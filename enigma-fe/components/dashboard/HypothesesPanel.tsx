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

    return (
        <div className="glass-card animate-fade-in" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: "28px", height: "28px", borderRadius: "var(--radius-sm)",
                        background: "var(--purple-surface)", border: "1px solid rgba(139,92,246,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.85rem",
                    }}>
                        🧠
                    </div>
                    <span style={{
                        fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em",
                        textTransform: "uppercase", color: "var(--text-muted)",
                    }}>
                        AI Hypotheses
                    </span>
                </div>
                <span className="badge badge-purple" style={{ fontSize: "0.6rem" }}>
                    {hypotheses.length} total
                </span>
            </div>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, overflowY: "auto" }}>
                {sorted.map((hyp, idx) => {
                    const pct = isNaN(hyp.confidence) ? 0 : Math.round(hyp.confidence * 100);
                    const isUnknown = hyp.id === "hyp-unknown";
                    const isDominant = hyp.id === dominantId;
                    const barColor = isUnknown
                        ? "rgba(107, 114, 128, 0.5)"
                        : isDominant
                            ? "linear-gradient(90deg, var(--blue), var(--cyan))"
                            : `rgba(59, 130, 246, ${0.25 + (pct / 100) * 0.5})`;

                    return (
                        <div
                            key={hyp.id}
                            className={`hyp-card ${isDominant ? "hyp-card-dominant" : ""} animate-slide-right stagger-${Math.min(idx + 1, 5)}`}
                            style={!isDominant ? { background: "rgba(255,255,255,0.02)" } : {}}
                        >
                            {/* Description row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "12px" }}>
                                <span style={{
                                    fontSize: "0.78rem", color: "var(--text-primary)", flex: 1, lineHeight: 1.5,
                                }}>
                                    {isDominant && (
                                        <span style={{
                                            marginRight: "6px", fontSize: "0.65rem",
                                            background: "linear-gradient(135deg, var(--amber), var(--amber-light))",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                        }}>
                                            ★
                                        </span>
                                    )}
                                    {hyp.description}
                                </span>
                                <span className={`badge ${statusBadgeClass(hyp.status)}`} style={{ flexShrink: 0 }}>
                                    {hyp.status}
                                </span>
                            </div>

                            {/* Bar */}
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{
                                    flex: 1, height: "5px", background: "rgba(255,255,255,0.04)",
                                    borderRadius: "3px", overflow: "hidden",
                                }}>
                                    <div
                                        className="animate-bar-grow"
                                        style={{
                                            height: "100%",
                                            width: `${pct}%`,
                                            background: barColor,
                                            borderRadius: "3px",
                                            ...(isDominant ? { boxShadow: "0 0 8px rgba(59,130,246,0.3)" } : {}),
                                        }}
                                    />
                                </div>
                                <span style={{
                                    fontFamily: "var(--font-mono)", fontSize: "0.72rem", fontWeight: 700,
                                    color: isUnknown ? "var(--text-dim)" : isDominant ? "var(--blue-light)" : "var(--text-secondary)",
                                    minWidth: "34px", textAlign: "right",
                                }}>
                                    {pct}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {hypotheses.length === 0 && (
                <div style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    color: "var(--text-dim)", gap: "8px",
                }}>
                    <span style={{ fontSize: "1.5rem", opacity: 0.4 }}>🧠</span>
                    <span style={{ fontSize: "0.8rem" }}>No hypotheses generated yet</span>
                </div>
            )}
        </div>
    );
}
