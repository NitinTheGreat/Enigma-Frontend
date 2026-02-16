"use client";

import type { HealthData } from "@/types/dashboard";

interface FooterProps {
    health: HealthData | null;
    latencyMs: number | null;
    lastUpdate: Date | null;
    isConnected: boolean;
}

export default function Footer({ health, latencyMs, lastUpdate, isConnected }: FooterProps) {
    const formatTime = (date: Date | null): string => {
        if (!date) return "--:--:--";
        try {
            if (isNaN(date.getTime())) return "--:--:--";
            return date.toLocaleTimeString("en-US", {
                hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
            });
        } catch {
            return "--:--:--";
        }
    };

    const isHighLatency = latencyMs != null && latencyMs > 500;

    const stats: { label: string; value: string; color: string; pulse?: boolean }[] = [
        {
            label: "STATUS",
            value: health?.status?.toUpperCase() || "UNKNOWN",
            color: health?.status === "ok" ? "var(--green)" : "var(--amber)",
        },
        {
            label: "ACTIVE",
            value: String(health?.active_situations ?? "—"),
            color: "var(--amber)",
        },
        {
            label: "ESCALATING",
            value: String(health?.escalating_situations ?? "—"),
            color: (health?.escalating_situations ?? 0) > 0 ? "var(--red)" : "var(--text-secondary)",
        },
        {
            label: "AVG CONF",
            value: health && !isNaN(health.average_confidence) ? `${(health.average_confidence * 100).toFixed(0)}%` : "—",
            color: "var(--blue-light)",
        },
        {
            label: "MAX RATE",
            value: health && !isNaN(health.max_event_rate) ? `${health.max_event_rate.toFixed(1)}/s` : "—",
            color: "var(--purple-light)",
        },
        {
            label: "LATENCY",
            value: latencyMs != null ? `${latencyMs}ms` : "—",
            color: isHighLatency ? "var(--amber)" : "var(--green)",
            pulse: isHighLatency,
        },
        {
            label: "LAST UPDATE",
            value: formatTime(lastUpdate),
            color: "var(--text-secondary)",
        },
        {
            label: "WEBSOCKET",
            value: isConnected ? "CONNECTED" : "DISCONNECTED",
            color: isConnected ? "var(--green)" : "var(--red)",
        },
    ];

    return (
        <footer
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 28px",
                background: "rgba(6, 10, 20, 0.95)",
                borderTop: "1px solid var(--border-default)",
                backdropFilter: "blur(20px)",
                gap: "4px",
                flexWrap: "wrap",
                position: "relative",
            }}
        >
            {/* Subtle top accent line */}
            <div style={{
                position: "absolute",
                left: 0, right: 0, height: "1px", top: -1,
                background: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.2) 50%, transparent 100%)",
            }} />

            {stats.map((stat, idx) => (
                <div key={stat.label} style={{ display: "contents" }}>
                    <div className="stat-item">
                        <span style={{
                            fontSize: "0.5rem", fontWeight: 600, letterSpacing: "0.06em",
                            color: "var(--text-dim)", textTransform: "uppercase",
                        }}>
                            {stat.label}
                        </span>
                        <span
                            className={stat.pulse ? "latency-high" : ""}
                            style={{
                                fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                                fontWeight: 600, color: stat.color,
                                transition: "color 0.3s ease",
                            }}
                        >
                            {stat.value}
                        </span>
                    </div>
                    {idx < stats.length - 1 && (
                        <div style={{ width: "1px", height: "18px", background: "var(--border-subtle)", margin: "0 2px" }} />
                    )}
                </div>
            ))}
        </footer>
    );
}
