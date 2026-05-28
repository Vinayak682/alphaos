"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import {
  LayoutDashboard, Zap, Briefcase, Settings, ChevronRight,
  Bot, ShieldAlert, BarChart2, Users, Newspaper,
  TrendingUp, Flag, Globe2, Bell, Building2, LineChart, Gauge,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "CORE",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/signals",   icon: Zap,             label: "Signals",   badge: "LIVE" },
      { href: "/portfolio", icon: Briefcase,        label: "Portfolio" },
      { href: "/agent",     icon: Bot,              label: "AI Agent" },
      { href: "/risk",       icon: ShieldAlert,  label: "Risk Index" },
      { href: "/fear-greed", icon: Gauge,         label: "Fear & Greed" },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { href: "/strategies", icon: BarChart2, label: "Strategies" },
      { href: "/traders",    icon: Users,     label: "Top Traders" },
      { href: "/intel",      icon: Newspaper, label: "Market Intel" },
    ],
  },
  {
    label: "MARKETS",
    items: [
      { href: "/us",    icon: Flag,    label: "US Markets" },
      { href: "/uae",   icon: Globe2,  label: "UAE Markets" },
      { href: "/india", icon: TrendingUp, label: "India Markets" },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { href: "/markets",      icon: LineChart,  label: "Live Quotes" },
      { href: "/institutions", icon: Building2,  label: "Institutions" },
      { href: "/alerts",       icon: Bell,       label: "Alerts" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useStore();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 56 : 216 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col h-full bg-[oklch(0.11_0.01_240)] border-r border-border overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3.5 h-14 border-b border-border shrink-0">
        <motion.div
          className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <span className="text-primary-foreground font-bold text-sm">α</span>
        </motion.div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="font-semibold text-sm tracking-wide text-foreground whitespace-nowrap"
            >
              AlphaOS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-1.5 py-2 overflow-y-auto overflow-x-hidden space-y-3 scrollbar-hide">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="px-2.5 mb-1 text-[9px] font-semibold tracking-widest text-muted-foreground/50 uppercase"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {section.items.map(({ href, icon: Icon, label, badge }: { href: string; icon: React.ElementType; label: string; badge?: string }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link key={href} href={href} className="block relative">
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-primary/12 rounded-md border-r-2 border-primary"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <motion.div
                      className={cn(
                        "relative flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors",
                        active
                          ? "text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                      whileHover={{ x: active ? 0 : 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.12 }}
                            className="whitespace-nowrap flex-1"
                          >
                            {label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!sidebarCollapsed && badge && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-[8px] font-bold px-1 py-0.5 rounded bg-primary/20 text-primary tracking-wider"
                        >
                          {badge}
                        </motion.span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-1.5 pb-3 space-y-0.5 border-t border-border pt-2 shrink-0">
        <Link href="/settings" className="block relative">
          {pathname === "/settings" && (
            <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/12 rounded-md border-r-2 border-primary" />
          )}
          <motion.div
            className={cn(
              "relative flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors",
              pathname === "/settings"
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            whileHover={{ x: 2 }}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="whitespace-nowrap">
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>

        <motion.button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div animate={{ rotate: sidebarCollapsed ? 0 : 180 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="whitespace-nowrap">
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}
