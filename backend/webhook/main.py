"""
AlphaOS — TradingView Webhook Handler
Receives alerts from TradingView → validates → writes to DB → fans out to all copiers
"""

import asyncio
import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI, HTTPException, Header, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("alphaos.webhook")

SUPABASE_DB_URL = os.environ["SUPABASE_DATABASE_URL"]
WEBHOOK_SECRET = os.environ["TRADINGVIEW_WEBHOOK_SECRET"]

# ─────────────────────────────────────────────
# DB CONNECTION POOL
# ─────────────────────────────────────────────
pool: asyncpg.Pool | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    pool = await asyncpg.create_pool(SUPABASE_DB_URL, min_size=2, max_size=10)
    log.info("DB pool ready")
    yield
    await pool.close()


app = FastAPI(title="AlphaOS Webhook", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://alphaos.app", "http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────────
class TradingViewAlert(BaseModel):
    """
    Expected JSON body from TradingView alert.
    TradingView alert message format (set in TradingView alert dialog):
    {
        "strategy_id": "{{strategy.order.id}}",
        "symbol": "{{ticker}}",
        "action": "BUY",
        "price": {{close}},
        "timeframe": "{{interval}}",
        "exchange": "{{exchange}}",
        "comment": "{{strategy.order.comment}}"
    }
    """

    strategy_id: str
    symbol: str
    action: str
    price: Optional[float] = None
    timeframe: Optional[str] = None
    exchange: Optional[str] = None
    comment: Optional[str] = None

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        allowed = {"BUY", "SELL", "CLOSE", "SCALE_IN", "SCALE_OUT"}
        v = v.upper()
        if v not in allowed:
            raise ValueError(f"action must be one of {allowed}")
        return v

    @field_validator("symbol")
    @classmethod
    def normalize_symbol(cls, v: str) -> str:
        return v.upper().strip()

    class Config:
        extra = "allow"  # Allow extra TradingView fields ({{strategy.*}})


class AlertResponse(BaseModel):
    status: str
    signal_id: str
    copiers_notified: int
    message: str


# ─────────────────────────────────────────────
# AUTHENTICATION
# ─────────────────────────────────────────────
def verify_webhook_secret(raw_body: bytes, signature: Optional[str]) -> bool:
    """
    TradingView doesn't support HMAC natively.
    Use a shared secret passed in the JSON body or as a header.
    For TradingView: add 'secret': '...' to your alert JSON.
    """
    return True  # Replace with real validation when using a reverse proxy + HMAC


# ─────────────────────────────────────────────
# MAIN WEBHOOK ENDPOINT
# ─────────────────────────────────────────────
@app.post("/webhook/tradingview", response_model=AlertResponse)
async def receive_tradingview_alert(
    alert: TradingViewAlert,
    background_tasks: BackgroundTasks,
    request: Request,
    x_webhook_secret: Optional[str] = Header(None),
):
    # Validate secret
    if x_webhook_secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: invalid webhook secret")

    raw_payload = await request.body()

    async with pool.acquire() as db:
        # 1. Check strategy exists and is active
        strategy = await db.fetchrow(
            "SELECT id, name FROM strategies WHERE id = $1 AND is_active = true",
            alert.strategy_id,
        )
        if not strategy:
            log.warning(f"Unknown or inactive strategy: {alert.strategy_id}")
            raise HTTPException(status_code=404, detail="Strategy not found or inactive")

        # 2. Persist signal (decouples ingestion from execution)
        signal_id = await db.fetchval(
            """
            INSERT INTO webhook_signals
                (strategy_id, symbol, action, price, timeframe, payload, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
            RETURNING id
            """,
            alert.strategy_id,
            alert.symbol,
            alert.action,
            alert.price,
            alert.timeframe,
            json.dumps(alert.model_dump()),
        )
        signal_id_str = str(signal_id)

        # 3. Push real-time notification to Next.js via pg_notify
        await db.execute(
            "SELECT pg_notify($1, $2)",
            "alphaos:signals",
            json.dumps(
                {
                    "signal_id": signal_id_str,
                    "strategy_id": alert.strategy_id,
                    "symbol": alert.symbol,
                    "action": alert.action,
                    "price": alert.price,
                    "received_at": datetime.now(timezone.utc).isoformat(),
                }
            ),
        )

        # 4. Count active subscribers for response
        copier_count = await db.fetchval(
            """
            SELECT COUNT(*) FROM strategy_subscriptions
            WHERE strategy_id = $1 AND is_active = true
            """,
            alert.strategy_id,
        )

    # 5. Fan-out to copiers in background (non-blocking)
    background_tasks.add_task(
        execute_copy_trades,
        signal_id=signal_id_str,
        alert=alert,
    )

    log.info(f"Signal {signal_id_str} received: {alert.action} {alert.symbol} → {copier_count} copiers")
    return AlertResponse(
        status="received",
        signal_id=signal_id_str,
        copiers_notified=copier_count,
        message=f"{alert.action} {alert.symbol} queued for {copier_count} copier(s)",
    )


# ─────────────────────────────────────────────
# COPY TRADE EXECUTION ENGINE
# ─────────────────────────────────────────────
async def execute_copy_trades(signal_id: str, alert: TradingViewAlert) -> None:
    """
    Fan out a signal to all active subscribers of that strategy.
    Each subscriber gets an individual trade record with position-sized quantity.
    """
    async with pool.acquire() as db:
        # Mark signal as processing
        await db.execute(
            "UPDATE webhook_signals SET status = 'PROCESSING' WHERE id = $1",
            signal_id,
        )

        # Fetch all active subscribers with their risk settings
        subscribers = await db.fetch(
            """
            SELECT
                ss.id AS subscription_id,
                ss.follower_id,
                ss.allocation_amount,
                ss.max_position_size,
                ss.risk_multiplier,
                ss.is_paper,
                ss.strategy_id,
                u.risk_appetite,
                u.max_drawdown_limit,
                u.total_balance,
                u.paper_balance
            FROM strategy_subscriptions ss
            JOIN users u ON u.id = ss.follower_id
            WHERE ss.strategy_id = $1 AND ss.is_active = true AND u.is_active = true
            """,
            alert.strategy_id,
        )

        trade_count = 0
        errors = []

        for sub in subscribers:
            try:
                quantity = calculate_position_size(
                    allocation=float(sub["allocation_amount"]),
                    price=alert.price,
                    max_position=float(sub["max_position_size"]) if sub["max_position_size"] else None,
                    risk_appetite=sub["risk_appetite"],
                    risk_multiplier=float(sub["risk_multiplier"]),
                )

                if quantity <= 0:
                    log.warning(f"Zero quantity for subscriber {sub['follower_id']}, skipping")
                    continue

                side = "LONG" if alert.action in ("BUY", "SCALE_IN") else "SHORT"

                # Create child trade
                trade_id = await db.fetchval(
                    """
                    INSERT INTO trades
                        (user_id, strategy_id, signal_id, symbol, market,
                         side, status, entry_price, quantity, is_paper)
                    VALUES ($1, $2, $3, $4,
                            COALESCE($5, 'US'),
                            $6, 'OPEN', $7, $8, $9)
                    RETURNING id
                    """,
                    sub["follower_id"],
                    alert.strategy_id,
                    signal_id,
                    alert.symbol,
                    _infer_market(alert.symbol, alert.exchange),
                    side,
                    alert.price,
                    quantity,
                    sub["is_paper"],
                )

                # Real-time notification per user
                await db.execute(
                    "SELECT pg_notify($1, $2)",
                    f"alphaos:user:{sub['follower_id']}",
                    json.dumps(
                        {
                            "type": "TRADE_OPENED",
                            "trade_id": str(trade_id),
                            "symbol": alert.symbol,
                            "side": side,
                            "quantity": float(quantity),
                            "price": alert.price,
                            "is_paper": sub["is_paper"],
                        }
                    ),
                )

                trade_count += 1

            except Exception as e:
                log.error(f"Failed to create trade for subscriber {sub['follower_id']}: {e}")
                errors.append(str(e))

        # Mark signal complete or failed
        final_status = "PROCESSED" if not errors else "FAILED"
        await db.execute(
            """
            UPDATE webhook_signals
            SET status = $1, processed_at = NOW(),
                error_message = $2
            WHERE id = $3
            """,
            final_status,
            "; ".join(errors) if errors else None,
            signal_id,
        )

        log.info(f"Signal {signal_id} processed: {trade_count} trades created, {len(errors)} errors")


# ─────────────────────────────────────────────
# POSITION SIZING
# ─────────────────────────────────────────────
def calculate_position_size(
    allocation: float,
    price: Optional[float],
    max_position: Optional[float],
    risk_appetite: str,
    risk_multiplier: float = 1.0,
) -> float:
    """
    Kelly-inspired position sizing.
    allocation  = total $ allocated to this strategy
    risk_mult   = subscriber-set scale factor (0.5x conservative, 2x aggressive)
    """
    if not price or price <= 0:
        return 0.0

    risk_fractions = {"LOW": 0.40, "MEDIUM": 0.65, "HIGH": 0.90, "QUANT": 1.0}
    fraction = risk_fractions.get(risk_appetite, 0.65)

    capital_to_deploy = allocation * fraction * risk_multiplier
    quantity = capital_to_deploy / price

    if max_position:
        quantity = min(quantity, max_position / price)

    return round(quantity, 8)


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
def _infer_market(symbol: str, exchange: Optional[str]) -> str:
    if exchange:
        ex = exchange.upper()
        if ex in ("NSE", "BSE"):
            return "INDIA"
        if ex in ("DFM", "ADX"):
            return "UAE"
        if ex in ("BINANCE", "COINBASE", "KRAKEN"):
            return "CRYPTO"
        if ex in ("NYSE", "NASDAQ", "AMEX"):
            return "US"

    sym = symbol.upper()
    if sym.endswith(("USDT", "BTC", "ETH", "BUSD")):
        return "CRYPTO"
    if sym.endswith(".NS") or sym.endswith(".BO"):
        return "INDIA"

    return "US"  # Default


# ─────────────────────────────────────────────
# HEALTH & MONITORING
# ─────────────────────────────────────────────
@app.get("/health")
async def health():
    async with pool.acquire() as db:
        await db.execute("SELECT 1")
    return {"status": "ok", "ts": datetime.now(timezone.utc).isoformat()}


@app.get("/signals/recent")
async def recent_signals(limit: int = 20):
    """Debug endpoint: last N signals received"""
    async with pool.acquire() as db:
        rows = await db.fetch(
            """
            SELECT id, strategy_id, symbol, action, price, status, received_at
            FROM webhook_signals
            ORDER BY received_at DESC
            LIMIT $1
            """,
            limit,
        )
    return [dict(r) for r in rows]
