"use client";

import { useState } from "react";
import type { ExplanationSection as SectionType, Counterfactual } from "@/types/dashboard";
import { SECTION_TYPE_STYLES } from "@/types/dashboard";
import { motion, AnimatePresence } from "framer-motion";

interface Props { sections: SectionType[]; }

const ICONS: Record<string, string> = {
    SUMMARY: "S", SUPPORTING_EVIDENCE: "+", CONTRADICTING_EVIDENCE: "−",
    WHY_UNKNOWN: "?", CONFIDENCE_FACTORS: "C", WHAT_WOULD_CHANGE_MIND: "~",
    COUNTERFACTUALS: "CF", TEMPORAL_EVOLUTION: "T",
};

function ContribBadge({ dir }: { dir: string | null }) {
    if (!dir) return null;
    const c = dir === "SUPPORTING" ? { l: "Supporting", c: "var(--green-text)" }
        : dir === "OPPOSING" ? { l: "Opposing", c: "var(--red-text)" }
            : { l: "Neutral", c: "var(--text-muted)" };
    return <span style={{ fontSize: "0.6rem", color: c.c, fontWeight: 600 }}>{c.l}</span>;
}

function CFCard({ cf, index }: { cf: Counterfactual; index: number }) {
    const d = isNaN(cf.confidence_delta) ? 0 : cf.confidence_delta;
    const pos = d > 0;
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.01, borderColor: "var(--border-hover)" }}
            style={{
                padding: "9px 11px", background: "var(--purple-dim)",
                border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                marginBottom: "4px", cursor: "default",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: "2px" }}>
                        <span className="mono" style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--amber-text)", marginRight: "5px" }}>IF</span>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>{cf.missing_condition}</span>
                    </div>
                    <div>
                        <span className="mono" style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", marginRight: "5px" }}>THEN</span>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-primary)" }}>{cf.expected_effect}</span>
                    </div>
                </div>
                <span className="mono" style={{ fontSize: "0.68rem", fontWeight: 700, alignSelf: "center", color: pos ? "var(--green-text)" : "var(--red-text)" }}>
                    {pos ? "+" : ""}{d.toFixed(2)}
                </span>
            </div>
        </motion.div>
    );
}

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const, delay: 0.15 } },
};

export default function ExplanationSections({ sections }: Props) {
    const [exp, setExp] = useState<Set<number>>(() => {
        const s = new Set<number>();
        sections.forEach((sec, i) => { if (sec.type === "SUMMARY") s.add(i); });
        return s;
    });

    const toggle = (i: number) => setExp(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });

    return (
        <motion.div className="card" variants={cardVariants} initial="hidden" animate="visible"
            style={{ padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span className="label">Explanation</span>
                <div style={{ display: "flex", gap: "4px" }}>
                    <motion.button whileTap={{ scale: 0.95 }} className="btn" onClick={() => setExp(new Set(sections.map((_, i) => i)))}>Expand all</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} className="btn" onClick={() => setExp(new Set())}>Collapse all</motion.button>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {sections.map((sec, i) => {
                    const open = exp.has(i);
                    const cls = SECTION_TYPE_STYLES[sec.type] || "";
                    return (
                        <motion.div key={`${sec.type}-${i}`} className={cls}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.06 }}
                            style={{ borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                            <motion.button onClick={() => toggle(i)} className="section-btn"
                                whileHover={{ backgroundColor: "var(--bg-hover)" }}
                                whileTap={{ scale: 0.99 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                    <span className="mono" style={{
                                        width: "20px", height: "20px", borderRadius: "4px",
                                        background: "var(--bg-muted)", display: "inline-flex", alignItems: "center",
                                        justifyContent: "center", fontSize: "0.58rem", fontWeight: 700,
                                        color: "var(--text-secondary)", flexShrink: 0,
                                    }}>{ICONS[sec.type] || "•"}</span>
                                    <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{sec.title}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                    <ContribBadge dir={sec.contribution_direction} />
                                    {sec.contribution_score != null && !isNaN(sec.contribution_score) && (
                                        <span className="mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
                                            {(sec.contribution_score * 100).toFixed(0)}%
                                        </span>
                                    )}
                                    <motion.svg
                                        animate={{ rotate: open ? 180 : 0 }}
                                        transition={{ duration: 0.25, ease: "easeInOut" }}
                                        style={{ width: "12px", height: "12px", color: "var(--text-muted)" }}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path d="m6 9 6 6 6-6" />
                                    </motion.svg>
                                </div>
                            </motion.button>
                            <AnimatePresence>
                                {open && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                        style={{ overflow: "hidden" }}>
                                        <div style={{ padding: "0 12px 12px" }}>
                                            <ul style={{ margin: 0, padding: "0 0 0 12px", listStyleType: "none" }}>
                                                {sec.bullets.map((b, j) => (
                                                    <motion.li key={j}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: j * 0.04 }}
                                                        style={{ fontSize: "0.76rem", color: "var(--text-secondary)", lineHeight: 1.7, padding: "1px 0", position: "relative" }}>
                                                        <span style={{ position: "absolute", left: "-10px", color: "var(--text-dim)" }}>·</span>
                                                        {b}
                                                    </motion.li>
                                                ))}
                                            </ul>
                                            {sec.counterfactuals && sec.counterfactuals.length > 0 && (
                                                <div style={{ marginTop: "8px" }}>
                                                    {sec.counterfactuals.map((cf, j) => <CFCard key={j} cf={cf} index={j} />)}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
