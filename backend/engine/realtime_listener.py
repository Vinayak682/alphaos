"""
AlphaOS — PostgreSQL LISTEN/NOTIFY → WebSocket Bridge
Forwards pg_notify events to connected Next.js clients via WebSocket.
Run alongside the webhook server: uvicorn realtime_listener:app --port 8001
"""

import asyncio
import json
import logging
import os
from typing import set as Set

import asyncpg
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

log = logging.getLogger("alphaos.realtime")

SUPABASE_DB_URL = os.environ["SUPABASE_DATABASE_URL"]

# Active WebSocket connections keyed by user_id
connections: dict[str, set[WebSocket]] = {}

app = FastAPI(title="AlphaOS Realtime Bridge")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://alphaos.app", "http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


async def broadcast(channel: str, payload: str) -> None:
    data = json.loads(payload)

    # Global signal broadcast (all connected clients)
    if channel == "alphaos:signals":
        for user_conns in connections.values():
            for ws in list(user_conns):
                try:
                    await ws.send_json({"channel": "signals", "data": data})
                except Exception:
                    pass
        return

    # Per-user trade notifications
    if channel.startswith("alphaos:user:"):
        user_id = channel.split(":")[-1]
        if user_id in connections:
            for ws in list(connections[user_id]):
                try:
                    await ws.send_json({"channel": "trades", "data": data})
                except Exception:
                    connections[user_id].discard(ws)


async def pg_listener() -> None:
    """Long-running task: listens on all AlphaOS pg channels"""
    conn = await asyncpg.connect(SUPABASE_DB_URL)
    await conn.add_listener("alphaos:signals", lambda *args: asyncio.create_task(broadcast(args[2], args[3])))
    log.info("PostgreSQL LISTEN active on 'alphaos:signals'")

    # Keep alive forever
    while True:
        await asyncio.sleep(30)
        await conn.execute("SELECT 1")  # Heartbeat


@app.on_event("startup")
async def startup():
    asyncio.create_task(pg_listener())


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(ws: WebSocket, user_id: str):
    await ws.accept()
    connections.setdefault(user_id, set()).add(ws)

    # Subscribe to user-specific pg channel
    async def _setup_user_listener():
        conn = await asyncpg.connect(SUPABASE_DB_URL)
        channel = f"alphaos:user:{user_id}"
        await conn.add_listener(
            channel,
            lambda *args: asyncio.create_task(broadcast(args[2], args[3]))
        )
        return conn

    user_conn = await _setup_user_listener()

    try:
        while True:
            await ws.receive_text()  # Keep connection alive, client sends pings
    except WebSocketDisconnect:
        connections[user_id].discard(ws)
        if not connections[user_id]:
            del connections[user_id]
        await user_conn.close()
