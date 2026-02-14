"use client";

import type { Hypothesis } from "@/types/dashboard";

interface HypothesesPanelProps {
    hypotheses: Hypothesis[];
    dominantId: string | null;
}

function statusBadgeClass(status: string): string {
    switch (status) {
        case "confirmed": return "badge-green";
        case "pruned": return "badge-red";
        default: return "badge-blue";
    }
}

export default function HypothesesPanel({ hypotheses, dominantId }: HypothesesPanelProps) {
    const sorted = [...hypotheses].sort((a, b) => b.confidence - a.confidence);
    const maxConf = sorted.length > 0 ? sorted[0].confidence : 1;

    return (
        <div className="glass-card animate-fade-in" style={{ padding: "20px" }}>
            <div
                style={{
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "14px",
                }}
            >
                AI Hypotheses
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {sorted.map((hyp, idx) => {
                    const pct = Math.round(hyp.confidence * 100);
                    const isUnknown = hyp.id === "hyp-unknown";
                    const isDominant = hyp.id === dominantId;
                    const barColor = isUnknown
                        ? "rgba(107, 114, 128, 0.5)"
                        : isDominant
                            ? "linear-gradient(90deg, var(--blue), var(--cyan))"
                            : `rgba(59, 130, 246, ${0.3 + (hyp.confidence / maxConf) * 0.5})`;

                    return (
                        <div
                            key={hyp.id}
                            className={`animate-slide-right stagger-${Math.min(idx + 1, 5)}`}
                            style={{
                                padding: "10px 12px",
                                background: isDominant ? "rgba(59, 130, 246, 0.06)" : "rgba(255,255,255,0.02)",
                                borderRadius: "8px",
                                border: isDominant ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid transparent",
                            }}
                        >
                            {/* Description row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-primary)", flex: 1, lineHeight: 1.4 }}>
                                    {hyp.description}
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "12px", flexShrink: 0 }}>
                                    <span className={`badge ${statusBadgeClass(hyp.status)}`}>
                                        {hyp.status}
                                    </span>
                                </div>
                            </div>

                            {/* Bar */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1, height: "5px", background: "rgba(255,255,255,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                                    <div
                                        className="animate-bar-grow"
                                        style={{
                                            height: "100%",
                                            width: `${pct}%`,
                                            background: barColor,
                                            borderRadius: "3px",
                                            transition: "width 0.6s ease",
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                        color: isUnknown ? "var(--text-muted)" : "var(--blue-light)",
                                        minWidth: "32px",
                                        textAlign: "right",
                                    }}
                                >
                                    {pct}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {hypotheses.length === 0 && (
                <div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    No hypotheses generated yet
                </div>
            )}
        </div>
    );
}
