"use client";

import type { SituationAnalysis } from "@/types/dashboard";
import { motion } from "framer-motion";

interface Props { analysis: SituationAnalysis; }

function Ring({ value, size = 52, stroke = 4, color }: { value: number; size?: number; stroke?: number; color: string }) {
    const v = isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-muted)" strokeWidth={stroke} />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeLinecap="round" strokeDasharray={c}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: c - v * c }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
        </svg>
    );
}

function dur(d: string | undefined | null): string {
    if (!d) return "—";
    const t = new Date(d).getTime();
    if (isNaN(t)) return "—";
    const diff = Date.now() - t;
    if (diff < 0) return "now";
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${s % 60}s`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function pct(v: number | null | undefined): string {
    if (v == null || isNaN(v)) return "—";
    return `${Math.round(v * 100)}%`;
}

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function SituationOverview({ analysis }: Props) {
    const { situation, explanation, langgraph, reasoning } = analysis;

    let statusLabel = "Active", statusCls = "badge-blue";
    if (explanation.undecided) { statusLabel = "Undecided"; statusCls = "badge-amber"; }
    else if (langgraph.convergence_score > 0.7) { statusLabel = "Converged"; statusCls = "badge-green"; }

    const dominant = langgraph.hypotheses.find(h => h.id === explanation.dominant_hypothesis_id);
    const conf = isNaN(explanation.dominant_confidence) ? 0 : Math.round(explanation.dominant_confidence * 100);
    const trendColor = reasoning.trend === "escalating" ? "var(--red-text)" : reasoning.trend === "deescalating" ? "var(--green-text)" : "var(--text-muted)";

    return (
        <motion.div className="card" variants={cardVariants} initial="hidden" animate="visible"
            style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span className={`badge ${statusCls}`}>{statusLabel}</span>
                        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }} title={situation.situation_id}>
                            {situation.situation_id.substring(0, 8)}
                        </span>
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                        Active for <span className="mono" style={{ fontWeight: 600, color: "var(--text-primary)" }}>{dur(situation.created_at)}</span>
                        <span style={{ margin: "0 5px", color: "var(--text-dim)" }}>/</span>
                        <span style={{ fontWeight: 600, color: trendColor }}>{reasoning.trend}</span>
                    </div>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                        <Ring value={langgraph.convergence_score} color="var(--purple)" />
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
                            <span className="mono" style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--purple-text)" }}>
                                {pct(langgraph.convergence_score)}
                            </span>
                        </div>
                    </div>
                    <div className="label" style={{ fontSize: "0.48rem", marginTop: "1px" }}>Convergence</div>
                </div>
            </div>

            {/* Metrics grid */}
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px",
                background: "var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden",
                border: "1px solid var(--border)",
            }}>
                {[
                    { l: "Evidence", v: String(situation.evidence_count ?? "—"), c: "var(--text-primary)" },
                    { l: "Anomaly", v: pct(situation.max_anomaly), c: (situation.max_anomaly ?? 0) > 0.8 ? "var(--red-text)" : (situation.max_anomaly ?? 0) > 0.5 ? "var(--amber-text)" : "var(--green-text)" },
                    { l: "Stability", v: pct(langgraph.belief_stability), c: "var(--blue-text)" },
                    { l: "Iterations", v: String(langgraph.iterations ?? "—"), c: "var(--text-primary)" },
                ].map((m, i) => (
                    <motion.div key={m.l} className="metric" style={{ background: "var(--bg-card)" }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                        <div className="label" style={{ fontSize: "0.48rem", marginBottom: "3px" }}>{m.l}</div>
                        <div className="mono" style={{ fontSize: "1.05rem", fontWeight: 700, color: m.c }}>{m.v}</div>
                    </motion.div>
                ))}
            </div>

            {/* Dominant hypothesis */}
            {dominant && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <div className="label" style={{ marginBottom: "5px" }}>Lead hypothesis</div>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "0 0 8px", lineHeight: 1.6 }}>{dominant.description}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div className="bar-track" style={{ flex: 1 }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${conf}%` }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                                style={{ height: "100%", background: "var(--blue)", borderRadius: "3px" }} />
                        </div>
                        <span className="mono" style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--blue-text)", minWidth: "30px" }}>{conf}%</span>
                    </div>
                </motion.div>
            )}

            {/* Entity + Signal tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {situation.entities.map((e, i) => (
                    <motion.span key={e} className="badge badge-blue" style={{ fontSize: "0.6rem" }}
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.05 }}>{e}</motion.span>
                ))}
                {situation.signal_types.map((t, i) => (
                    <motion.span key={t} className="badge badge-gray" style={{ fontSize: "0.6rem" }}
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.05 }}>{t}</motion.span>
                ))}
            </div>
        </motion.div>
    );
}
