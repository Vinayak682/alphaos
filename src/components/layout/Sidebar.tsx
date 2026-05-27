"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import {
  LayoutDashboard, BarChart2, TrendingUp, Zap,
  Bot, Briefcase, Bell, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard"  },
  { href: "/markets",    icon: BarChart2,        label: "Markets"    },
  { href: "/charts",     icon: TrendingUp,       label: "Charts"     },
  { href: "/strategies", icon: Zap,              label: "Strategies" },
  { href: "/bot",        icon: Bot,              label: "AI Bot"     },
  { href: "/portfolio",  icon: Briefcase,        label: "Portfolio"  },
  { href: "/alerts",     icon: Bell,             label: "Alerts"     },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useStore();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 56 : 208 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col h-full bg-[oklch(0.11_0.01_240)] border-r border-border overflow-hidden"
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
      <nav className="flex-1 px-1.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ href, icon: Icon, label }) => {
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
                  active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
                      className="whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-1.5 pb-3 space-y-0.5 border-t border-border pt-2">
        <Link href="/settings" className="block relative">
          {pathname === "/settings" && (
            <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/12 rounded-md border-r-2 border-primary" />
          )}
          <motion.div
            className={cn(
              "relative flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors",
              pathname === "/settings" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
