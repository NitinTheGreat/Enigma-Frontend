"use client";

import type { ConnectionState } from "@/types/dashboard";

interface HeaderProps {
    connectionState: ConnectionState;
}

const STATUS_CONFIG: Record<ConnectionState, { color: string; glow: string; label: string }> = {
    connected: { color: "var(--green)", glow: "var(--green-glow)", label: "LIVE" },
    disconnected: { color: "var(--red)", glow: "var(--red-glow)", label: "OFFLINE" },
    reconnecting: { color: "var(--amber)", glow: "var(--amber-glow)", label: "RECONNECTING" },
};

export default function Header({ connectionState }: HeaderProps) {
    const status = STATUS_CONFIG[connectionState];

    return (
        <header
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 24px",
                background: "rgba(10, 15, 26, 0.9)",
                borderBottom: "1px solid var(--border-default)",
                backdropFilter: "blur(12px)",
                position: "relative",
                zIndex: 50,
            }}
        >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                    style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        background: "linear-gradient(135deg, var(--blue) 0%, var(--cyan) 50%, var(--purple) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontFamily: "var(--font-mono)",
                    }}
                >
                    ENIGMA
                </div>
                <div
                    style={{
                        fontSize: "0.65rem",
                        color: "var(--text-muted)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        borderLeft: "1px solid var(--border-default)",
                        paddingLeft: "12px",
                    }}
                >
                    AI Threat Intelligence
                </div>
            </div>

            {/* Connection Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 14px",
                        borderRadius: "9999px",
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${status.color}33`,
                    }}
                >
                    <div
                        className={connectionState === "connected" ? "animate-pulse-dot" : ""}
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: status.color,
                            boxShadow: `0 0 8px ${status.glow}`,
                        }}
                    />
                    <span
                        style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            fontFamily: "var(--font-mono)",
                            color: status.color,
                            letterSpacing: "0.06em",
                        }}
                    >
                        {status.label}
                    </span>
                </div>
            </div>
        </header>
    );
}
