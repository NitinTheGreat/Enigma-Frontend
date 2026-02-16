"use client";

import type { ConnectionState } from "@/types/dashboard";

interface HeaderProps {
    connectionState: ConnectionState;
}

const STATUS_CONFIG: Record<ConnectionState, { color: string; glow: string; label: string; icon: string }> = {
    connected: { color: "var(--green)", glow: "var(--green-glow)", label: "LIVE", icon: "●" },
    disconnected: { color: "var(--red)", glow: "var(--red-glow)", label: "OFFLINE", icon: "○" },
    reconnecting: { color: "var(--amber)", glow: "var(--amber-glow)", label: "RECONNECTING", icon: "◌" },
};

export default function Header({ connectionState }: HeaderProps) {
    const status = STATUS_CONFIG[connectionState];

    return (
        <header
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 28px",
                background: "rgba(6, 10, 20, 0.95)",
                borderBottom: "1px solid var(--border-default)",
                backdropFilter: "blur(20px)",
                position: "relative",
                zIndex: 50,
            }}
        >
            {/* Subtle scan line */}
            <div style={{
                position: "absolute",
                left: 0, right: 0, height: "1px",
                background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.3) 50%, transparent 100%)",
                bottom: -1,
            }} />

            {/* Logo area */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Logo mark */}
                <div style={{
                    width: "36px", height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
                    border: "1px solid rgba(59,130,246,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.1rem",
                    boxShadow: "var(--shadow-glow-blue)",
                }}>
                    🛡️
                </div>

                <div>
                    <div
                        className="logo-breathing"
                        style={{
                            fontSize: "1.25rem",
                            fontWeight: 800,
                            letterSpacing: "0.18em",
                            background: "linear-gradient(135deg, var(--blue) 0%, var(--cyan) 40%, var(--purple-light) 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontFamily: "var(--font-mono)",
                            lineHeight: 1.1,
                        }}
                    >
                        ENIGMA
                    </div>
                    <div
                        style={{
                            fontSize: "0.6rem",
                            color: "var(--text-dim)",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            fontWeight: 500,
                        }}
                    >
                        AI Threat Intelligence
                    </div>
                </div>
            </div>

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Timestamp */}
                <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.65rem",
                    color: "var(--text-dim)",
                    letterSpacing: "0.06em",
                }}>
                    {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>

                {/* Divider */}
                <div style={{ width: "1px", height: "24px", background: "var(--border-default)" }} />

                {/* Connection status */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "7px 16px",
                        borderRadius: "var(--radius-full)",
                        background: `${status.color}10`,
                        border: `1px solid ${status.color}30`,
                        transition: "all 0.4s ease",
                    }}
                >
                    <div
                        className={connectionState === "connected" ? "animate-pulse-dot" : ""}
                        style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            backgroundColor: status.color,
                            boxShadow: `0 0 10px ${status.glow}`,
                        }}
                    />
                    <span
                        style={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            color: status.color,
                            letterSpacing: "0.08em",
                        }}
                    >
                        {status.label}
                    </span>
                </div>
            </div>
        </header>
    );
}
