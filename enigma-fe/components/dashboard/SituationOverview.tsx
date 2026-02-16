"use client";

import type { SituationAnalysis } from "@/types/dashboard";
import { SIGNAL_TYPE_ICONS } from "@/types/dashboard";

interface SituationOverviewProps {
    analysis: SituationAnalysis;
}

function ProgressRing({ value, size = 64, stroke = 5, color }: { value: number; size?: number; stroke?: number; color: string }) {
    const safeValue = isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - safeValue * circumference;

    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.04)"
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
                style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
            />
        </svg>
    );
}

function durationStr(dateStr: string | undefined | null): string {
    if (!dateStr) return "—";
    const parsed = new Date(dateStr).getTime();
    if (isNaN(parsed)) return "—";
    const diff = Date.now() - parsed;
    if (diff < 0) return "just now";
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}

function safePercent(value: number | undefined | null): string {
    if (value == null || isNaN(value)) return "—";
    return `${Math.round(value * 100)}%`;
}

export default function SituationOverview({ analysis }: SituationOverviewProps) {
    const { situation, explanation, langgraph, reasoning } = analysis;

    let statusLabel = "ACTIVE";
    let statusBadge = "badge-blue";
    if (explanation.undecided) {
        statusLabel = "UNDECIDED";
        statusBadge = "badge-amber";
    } else if (langgraph.convergence_score > 0.7) {
        statusLabel = "CONVERGED";
        statusBadge = "badge-green";
    }

    const dominant = langgraph.hypotheses.find((h) => h.id === explanation.dominant_hypothesis_id);
    const confidencePct = isNaN(explanation.dominant_confidence) ? 0 : Math.round(explanation.dominant_confidence * 100);
    const trendIcon = reasoning.trend === "escalating" ? "▲" : reasoning.trend === "deescalating" ? "▼" : "—";
    const trendColor = reasoning.trend === "escalating" ? "var(--red)" : reasoning.trend === "deescalating" ? "var(--green)" : "var(--text-muted)";

    return (
        <div className="glass-card animate-fade-in" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* ── Header row ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span className={`badge ${statusBadge}`}>{statusLabel}</span>
                        <span
                            style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-muted)" }}
                            title={situation.situation_id}
                        >
                            {situation.situation_id.substring(0, 8)}…
                        </span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        Active for{" "}
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 600 }}>
                            {durationStr(situation.created_at)}
                        </span>
                        <span style={{ margin: "0 8px", color: "var(--border-hover)" }}>·</span>
                        <span style={{ color: trendColor, fontWeight: 600 }}>
                            {trendIcon} {reasoning.trend}
                        </span>
                    </div>
                </div>

                {/* Convergence ring */}
                <div style={{ textAlign: "center", position: "relative", flexShrink: 0 }}>
                    <ProgressRing value={langgraph.convergence_score} color="var(--purple)" />
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--purple-light)",
                        }}
                    >
                        {safePercent(langgraph.convergence_score)}
                    </div>
                    <div style={{ fontSize: "0.5rem", color: "var(--text-dim)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Convergence
                    </div>
                </div>
            </div>

            {/* ── Metrics grid ── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                    padding: "4px",
                    background: "rgba(255,255,255,0.015)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                }}
            >
                {[
                    { label: "Evidence", value: String(situation.evidence_count ?? "—"), color: "var(--text-bright)" },
                    {
                        label: "Anomaly",
                        value: safePercent(situation.max_anomaly),
                        color: (situation.max_anomaly ?? 0) > 0.8
                            ? "var(--red)"
                            : (situation.max_anomaly ?? 0) > 0.5
                                ? "var(--amber)"
                                : "var(--green)",
                    },
                    { label: "Stability", value: safePercent(langgraph.belief_stability), color: "var(--blue-light)" },
                    { label: "Iterations", value: String(langgraph.iterations ?? "—"), color: "var(--text-bright)" },
                ].map((m) => (
                    <div key={m.label} className="metric-cell">
                        <div style={{ fontSize: "0.5rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                            {m.label}
                        </div>
                        <div
                            className="animate-count-up"
                            style={{ fontFamily: "var(--font-mono)", fontSize: "1.15rem", fontWeight: 700, color: m.color }}
                        >
                            {m.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Dominant hypothesis ── */}
            {dominant && (
                <div>
                    <div style={{
                        fontSize: "0.55rem", color: "var(--text-dim)", textTransform: "uppercase",
                        letterSpacing: "0.08em", marginBottom: "8px", fontWeight: 600,
                    }}>
                        Dominant Hypothesis
                    </div>
                    <div style={{
                        fontSize: "0.82rem", color: "var(--text-primary)", lineHeight: 1.6,
                        marginBottom: "10px", padding: "10px 14px",
                        background: "var(--blue-surface)", borderRadius: "var(--radius-sm)",
                        border: "1px solid rgba(59,130,246,0.1)",
                    }}>
                        {dominant.description}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            flex: 1, height: "6px",
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: "3px", overflow: "hidden",
                        }}>
                            <div
                                className="animate-bar-grow"
                                style={{
                                    height: "100%",
                                    width: `${confidencePct}%`,
                                    background: "linear-gradient(90deg, var(--blue), var(--cyan))",
                                    borderRadius: "3px",
                                    boxShadow: "0 0 8px rgba(59,130,246,0.3)",
                                }}
                            />
                        </div>
                        <span style={{
                            fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700,
                            color: "var(--blue-light)", minWidth: "38px",
                        }}>
                            {confidencePct}%
                        </span>
                    </div>
                </div>
            )}

            {/* ── Entity + signal badges ── */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {situation.entities.map((e) => (
                    <span key={e} className="badge badge-blue">{e}</span>
                ))}
                {situation.signal_types.map((t) => (
                    <span key={t} className="badge badge-gray">
                        {SIGNAL_TYPE_ICONS[t] || "•"} {t}
                    </span>
                ))}
            </div>
        </div>
    );
}
