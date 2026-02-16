"use client";

import { useRef, useState, useEffect } from "react";
import type { SituationAnalysis } from "@/types/dashboard";
import { motion, AnimatePresence } from "framer-motion";

interface Props { feed: SituationAnalysis[]; }

function fmtTime(d: string | undefined | null): string {
    if (!d) return "--:--:--";
    try { const dt = new Date(d); if (isNaN(dt.getTime())) return "--:--:--"; return dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }); }
    catch { return "--:--:--"; }
}

function sevColor(v: number): string {
    if (isNaN(v)) return "var(--text-dim)";
    if (v > 0.8) return "var(--red)";
    if (v > 0.5) return "var(--amber)";
    return "var(--green)";
}

const feedItemVariants = {
    initial: { opacity: 0, y: -10, height: 0 },
    animate: { opacity: 1, y: 0, height: "auto", transition: { duration: 0.3, ease: "easeOut" as const } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.15 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const, delay: 0.2 } },
};

export default function LiveFeed({ feed }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [paused, setPaused] = useState(false);

    useEffect(() => { if (!paused && ref.current) ref.current.scrollTop = 0; }, [feed.length, paused]);

    return (
        <motion.div className="card" variants={cardVariants} initial="hidden" animate="visible"
            style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px 8px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <span className="label">Live Feed</span>
                    <motion.span key={feed.length} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                        className="badge badge-gray">{feed.length}</motion.span>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} className="btn" onClick={() => setPaused(p => !p)}
                    style={paused ? { background: "var(--amber-dim)", borderColor: "var(--amber)", color: "var(--amber-text)" } : {}}>
                    {paused ? "Resume" : "Pause"}
                </motion.button>
            </div>

            <div ref={ref} style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "0 4px 6px" }}>
                {feed.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ textAlign: "center", padding: "28px 14px", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                        Waiting for events…
                    </motion.div>
                )}
                <AnimatePresence initial={false}>
                    {feed.map((a, i) => {
                        const sit = a.situation;
                        const dom = a.langgraph.hypotheses.find(h => h.id === a.explanation.dominant_hypothesis_id);
                        const conf = isNaN(a.explanation.dominant_confidence) ? 0 : Math.round(a.explanation.dominant_confidence * 100);
                        return (
                            <motion.div key={`${sit.situation_id}-${sit.last_activity}-${i}`}
                                variants={feedItemVariants} initial="initial" animate="animate" exit="exit"
                                className="feed-row">
                                <motion.div
                                    animate={i === 0 ? { scale: [1, 1.5, 1] } : {}}
                                    transition={{ duration: 0.5 }}
                                    style={{ width: "5px", height: "5px", borderRadius: "50%", background: sevColor(sit.max_anomaly), marginTop: "6px", flexShrink: 0 }}
                                />
                                <span className="mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)", minWidth: "52px", flexShrink: 0, paddingTop: "1px" }}>
                                    {fmtTime(sit.last_activity)}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                                        <span className="mono" style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-primary)" }} title={sit.situation_id}>
                                            {sit.situation_id.substring(0, 8)}
                                        </span>
                                        {sit.signal_types.slice(0, 2).map(t => (
                                            <span key={t} className="badge badge-gray" style={{ fontSize: "0.48rem", padding: "0px 4px" }}>{t}</span>
                                        ))}
                                    </div>
                                    {dom && (
                                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {dom.description}
                                        </div>
                                    )}
                                </div>
                                <span className="mono" style={{ fontSize: "0.7rem", fontWeight: 600, flexShrink: 0, color: conf > 70 ? "var(--green-text)" : conf > 40 ? "var(--amber-text)" : "var(--text-muted)" }}>
                                    {conf}%
                                </span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
