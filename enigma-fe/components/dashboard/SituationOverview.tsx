"use client";

import type { SituationAnalysis } from "@/types/dashboard";
import { SIGNAL_TYPE_ICONS } from "@/types/dashboard";

interface SituationOverviewProps {
    analysis: SituationAnalysis;
}

function ProgressRing({ value, size = 56, stroke = 4, color }: { value: number; size?: number; stroke?: number; color: string }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - value * circumference;

    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={stroke}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
        </svg>
    );
}

function durationStr(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}

export default function SituationOverview({ analysis }: SituationOverviewProps) {
    const { situation, explanation, langgraph, reasoning } = analysis;

    // Determine status
    let statusLabel = "ACTIVE";
    let statusBadge = "badge-blue";
    if (explanation.undecided) {
        statusLabel = "UNDECIDED";
        statusBadge = "badge-amber";
    } else if (langgraph.convergence_score > 0.7) {
        statusLabel = "CONVERGED";
        statusBadge = "badge-green";
    }

    // Dominant hypothesis
    const dominant = langgraph.hypotheses.find((h) => h.id === explanation.dominant_hypothesis_id);
    const confidencePct = Math.round(explanation.dominant_confidence * 100);

    // Trend
    const trendIcon = reasoning.trend === "escalating" ? "🔺" : reasoning.trend === "deescalating" ? "🔻" : "➖";

    return (
        <div className="glass-card animate-fade-in" style={{ padding: "20px" }}>
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <span className={`badge ${statusBadge}`}>{statusLabel}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {situation.situation_id.substring(0, 8)}…
                        </span>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        Active for <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{durationStr(situation.created_at)}</span>
                        {" · "}Trend {trendIcon}
                    </div>
                </div>

                {/* Convergence ring */}
                <div style={{ textAlign: "center", position: "relative" }}>
                    <ProgressRing value={langgraph.convergence_score} color="var(--purple)" />
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            color: "var(--purple-light)",
                        }}
                    >
                        {Math.round(langgraph.convergence_score * 100)}%
                    </div>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "2px" }}>CONVERGENCE</div>
                </div>
            </div>

            {/* Metrics row */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px",
                    marginBottom: "16px",
                    padding: "12px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "8px",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Evidence</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: "var(--text-bright)" }}>
                        {situation.evidence_count}
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Anomaly</div>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: situation.max_anomaly > 0.8 ? "var(--red)" : situation.max_anomaly > 0.5 ? "var(--amber)" : "var(--green)",
                        }}
                    >
                        {(situation.max_anomaly * 100).toFixed(0)}%
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Stability</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: "var(--blue-light)" }}>
                        {(langgraph.belief_stability * 100).toFixed(0)}%
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Iterations</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: "var(--text-bright)" }}>
                        {langgraph.iterations}
                    </div>
                </div>
            </div>

            {/* Dominant hypothesis */}
            {dominant && (
                <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.06em" }}>
                        Dominant Hypothesis
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", marginBottom: "8px", lineHeight: 1.5 }}>
                        {dominant.description}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                            <div
                                className="animate-bar-grow"
                                style={{
                                    height: "100%",
                                    width: `${confidencePct}%`,
                                    background: `linear-gradient(90deg, var(--blue), var(--cyan))`,
                                    borderRadius: "3px",
                                    transition: "width 0.6s ease",
                                }}
                            />
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 600, color: "var(--blue-light)", minWidth: "36px" }}>
                            {confidencePct}%
                        </span>
                    </div>
                </div>
            )}

            {/* Entities + signal types */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {situation.entities.map((e) => (
                    <span key={e} className="badge badge-blue" style={{ fontSize: "0.6rem" }}>
                        {e}
                    </span>
                ))}
                {situation.signal_types.map((t) => (
                    <span key={t} className="badge badge-gray" style={{ fontSize: "0.6rem" }}>
                        {SIGNAL_TYPE_ICONS[t] || "•"} {t}
                    </span>
                ))}
            </div>
        </div>
    );
}
