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
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });
        } catch {
            return "--:--:--";
        }
    };

    const isHighLatency = latencyMs != null && latencyMs > 500;

    const stats: { label: string; value: string; color?: string; pulse?: boolean }[] = [
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
            label: "WS",
            value: isConnected ? "CONNECTED" : "DISCONNECTED",
            color: isConnected ? "var(--green)" : "var(--red)",
        },
    ];

    return (
        <footer
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 24px",
                background: "rgba(10, 15, 26, 0.9)",
                borderTop: "1px solid var(--border-default)",
                backdropFilter: "blur(12px)",
                flexWrap: "wrap",
                gap: "4px",
            }}
        >
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="stat-item"
                >
                    <span
                        style={{
                            fontSize: "0.55rem",
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                        }}
                    >
                        {stat.label}
                    </span>
                    <span
                        className={stat.pulse ? "latency-high" : ""}
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            color: stat.color || "var(--text-secondary)",
                            transition: "color 0.3s ease",
                        }}
                    >
                        {stat.value}
                    </span>
                </div>
            ))}
        </footer>
    );
}
