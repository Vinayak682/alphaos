"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  sub?: string;
  subClass?: string;
  icon: LucideIcon;
  iconClass?: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

export default function StatCard({
  label, value, prefix, suffix, decimals = 2,
  sub, subClass, icon: Icon, iconClass, trend, delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="relative bg-card border border-border rounded-xl p-4 flex items-start gap-4 overflow-hidden group hover:border-border/80 cursor-pointer transition-colors"
    >
      {/* Background glow on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        trend === "up" ? "bg-gradient-to-br from-primary/5 to-transparent" :
        trend === "down" ? "bg-gradient-to-br from-destructive/5 to-transparent" :
        "bg-gradient-to-br from-muted/10 to-transparent"
      )} />

      <motion.div
        className={cn("p-2 rounded-lg bg-muted relative z-10", iconClass)}
        whileHover={{ rotate: 5, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <Icon className="w-4 h-4" />
      </motion.div>

      <div className="flex-1 min-w-0 relative z-10">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-lg font-semibold">
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        </p>
        {sub && (
          <p className={cn("text-xs mono mt-0.5", subClass ?? "text-muted-foreground")}>{sub}</p>
        )}
      </div>

      {trend && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.3 }}
          className={cn(
            "w-1 h-8 rounded-full self-center origin-bottom",
            trend === "up" ? "bg-primary" : trend === "down" ? "bg-destructive" : "bg-muted-foreground"
          )}
        />
      )}
    </motion.div>
  );
}
