"use client";

import type { HealthData } from "@/types/dashboard";
import { motion } from "framer-motion";

interface Props {
    health: HealthData | null;
    latencyMs: number | null;
    lastUpdate: Date | null;
    isConnected: boolean;
}

export default function Footer({ health, latencyMs, lastUpdate, isConnected }: Props) {
    const fmt = (d: Date | null) => {
        if (!d) return "--:--:--";
        try { if (isNaN(d.getTime())) return "--:--:--"; return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }); }
        catch { return "--:--:--"; }
    };

    const stats = [
        { l: "Status", v: health?.status?.toUpperCase() || "—", c: health?.status === "ok" ? "var(--green-text)" : "var(--amber-text)" },
        { l: "Active", v: String(health?.active_situations ?? "—"), c: "var(--text-primary)" },
        { l: "Escalating", v: String(health?.escalating_situations ?? "—"), c: (health?.escalating_situations ?? 0) > 0 ? "var(--red-text)" : "var(--text-secondary)" },
        { l: "Avg Conf", v: health && !isNaN(health.average_confidence) ? `${(health.average_confidence * 100).toFixed(0)}%` : "—", c: "var(--blue-text)" },
        { l: "Max Rate", v: health && !isNaN(health.max_event_rate) ? `${health.max_event_rate.toFixed(1)}/s` : "—", c: "var(--text-secondary)" },
        { l: "Latency", v: latencyMs != null ? `${latencyMs}ms` : "—", c: latencyMs != null && latencyMs > 500 ? "var(--amber-text)" : "var(--green-text)" },
        { l: "Updated", v: fmt(lastUpdate), c: "var(--text-secondary)" },
        { l: "WS", v: isConnected ? "Connected" : "Disconnected", c: isConnected ? "var(--green-text)" : "var(--red-text)" },
    ];

    return (
        <motion.footer
            initial={{ y: 34, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
            style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "6px 24px", height: "34px",
                background: "var(--bg-card)", borderTop: "1px solid var(--border)", flexShrink: 0,
            }}
            className="footer-stats"
        >
            {stats.map((s, i) => (
                <div key={s.l} style={{ display: "contents" }}>
                    <motion.div className="stat-item"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.04 }}>
                        <span style={{ fontSize: "0.5rem", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.l}</span>
                        <span className="mono" style={{ fontSize: "0.62rem", fontWeight: 600, color: s.c }}>{s.v}</span>
                    </motion.div>
                    {i < stats.length - 1 && <div style={{ width: "1px", height: "12px", background: "var(--border-light)", margin: "0 1px" }} />}
                </div>
            ))}
        </motion.footer>
    );
}
