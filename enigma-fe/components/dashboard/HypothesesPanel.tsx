"use client";

import type { Hypothesis } from "@/types/dashboard";
import { motion } from "framer-motion";

interface Props {
    hypotheses: Hypothesis[];
    dominantId: string | null;
}

function sBadge(s: string): string {
    return s === "confirmed" ? "badge-green" : s === "pruned" ? "badge-red" : "badge-blue";
}

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const, delay: 0.1 } },
};

const hypVariants = {
    hidden: { opacity: 0, x: 12 },
    visible: (i: number) => ({
        opacity: 1, x: 0,
        transition: { delay: 0.2 + i * 0.08, duration: 0.35, ease: "easeOut" as const },
    }),
};

export default function HypothesesPanel({ hypotheses, dominantId }: Props) {
    const sorted = [...hypotheses].sort((a, b) => b.confidence - a.confidence);

    return (
        <motion.div className="card" variants={cardVariants} initial="hidden" animate="visible"
            style={{ padding: "18px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span className="label">Hypotheses</span>
                <span className="badge badge-gray">{hypotheses.length}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflowY: "auto" }}>
                {sorted.map((h, i) => {
                    const p = isNaN(h.confidence) ? 0 : Math.round(h.confidence * 100);
                    const dom = h.id === dominantId;
                    return (
                        <motion.div key={h.id}
                            variants={hypVariants} custom={i} initial="hidden" animate="visible"
                            whileHover={{ scale: 1.01, x: 2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            style={{
                                padding: "9px 11px", borderRadius: "var(--radius-md)",
                                background: dom ? "var(--blue-dim)" : "var(--bg-muted)",
                                border: `1px solid ${dom ? "var(--blue)" : "var(--border-light)"}`,
                                cursor: "default",
                            }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                                <span style={{ fontSize: "0.76rem", color: "var(--text-primary)", flex: 1, lineHeight: 1.5 }}>
                                    {dom && <span style={{ color: "var(--blue-text)", fontWeight: 700, marginRight: "3px" }}>★</span>}
                                    {h.description}
                                </span>
                                <span className={`badge ${sBadge(h.status)}`} style={{ flexShrink: 0 }}>{h.status}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div className="bar-track" style={{ flex: 1 }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${p}%` }}
                                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 + i * 0.1 }}
                                        style={{ height: "100%", background: dom ? "var(--blue)" : "var(--text-dim)", borderRadius: "3px" }}
                                    />
                                </div>
                                <span className="mono" style={{ fontSize: "0.68rem", fontWeight: 700, minWidth: "28px", textAlign: "right", color: dom ? "var(--blue-text)" : "var(--text-secondary)" }}>{p}%</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {hypotheses.length === 0 && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    No hypotheses yet
                </div>
            )}
        </motion.div>
    );
}
