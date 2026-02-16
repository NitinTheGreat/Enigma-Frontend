"use client";

import { useState, useMemo } from "react";
import type { SituationAnalysis } from "@/types/dashboard";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    situations: Map<string, SituationAnalysis>;
    selectedId: string | null;
    onSelect: (id: string) => void;
    recentlyUpdated: Set<string>;
}

function timeAgo(d: string | undefined | null): string {
    if (!d) return "—";
    const t = new Date(d).getTime();
    if (isNaN(t)) return "—";
    const diff = Date.now() - t;
    if (diff < 0) return "now";
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}

function riskColor(v: number): string {
    if (isNaN(v)) return "var(--text-muted)";
    if (v > 0.8) return "var(--red-text)";
    if (v > 0.5) return "var(--amber-text)";
    return "var(--green-text)";
}

type Filter = "all" | "escalating" | "high";

const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: (i: number) => ({
        opacity: 1, x: 0,
        transition: { delay: i * 0.04, duration: 0.3, ease: "easeOut" as const },
    }),
    exit: { opacity: 0, x: -8, transition: { duration: 0.15 } },
};

export default function Sidebar({ situations, selectedId, onSelect, recentlyUpdated }: Props) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("all");

    const sorted = useMemo(() => Array.from(situations.values()).sort((a, b) => {
        const ta = new Date(b.situation.last_activity).getTime();
        const tb = new Date(a.situation.last_activity).getTime();
        return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
    }), [situations]);

    const filtered = useMemo(() => {
        let list = sorted;
        if (filter === "escalating") list = list.filter(a => a.reasoning.trend === "escalating");
        else if (filter === "high") list = list.filter(a => a.situation.max_anomaly > 0.5);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(a => {
                const s = a.situation;
                return s.situation_id.toLowerCase().includes(q) ||
                    s.entities.some(e => e.toLowerCase().includes(q)) ||
                    s.signal_types.some(t => t.toLowerCase().includes(q));
            });
        }
        return list;
    }, [sorted, search, filter]);

    const esc = sorted.filter(s => s.reasoning.trend === "escalating").length;

    return (
        <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
                width: "280px", minWidth: "280px", height: "100%",
                display: "flex", flexDirection: "column",
                borderRight: "1px solid var(--border)", background: "var(--bg-sidebar)",
            }}
        >
            {/* Header */}
            <div style={{ padding: "14px 14px 10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                    <span className="label">Situations</span>
                    <motion.span key={sorted.length} initial={{ scale: 1.4, color: "var(--blue-text)" }} animate={{ scale: 1, color: "var(--text-primary)" }} transition={{ duration: 0.3 }}
                        className="mono" style={{ fontSize: "0.8rem", fontWeight: 700 }}>{sorted.length}</motion.span>
                </div>
                {esc > 0 && <span className="badge badge-red">{esc} escalating</span>}
            </div>

            {/* Search + filters */}
            <div style={{ padding: "0 10px 8px" }}>
                <div style={{ position: "relative", marginBottom: "6px" }}>
                    <svg style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", width: "13px", height: "13px", color: "var(--text-muted)" }}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input className="search-input" type="text" placeholder="Search…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                    {([["all", "All"], ["escalating", "Escalating"], ["high", "High Risk"]] as [Filter, string][]).map(([k, l]) => (
                        <motion.button key={k} whileTap={{ scale: 0.95 }}
                            className={`pill ${filter === k ? "pill-active" : ""}`}
                            onClick={() => setFilter(k)}>{l}</motion.button>
                    ))}
                </div>
            </div>

            <div style={{ height: "1px", background: "var(--border)", margin: "0 10px" }} />

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 && (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                            {search || filter !== "all"
                                ? <>No matches. <button onClick={() => { setSearch(""); setFilter("all"); }} style={{ background: "none", border: "none", color: "var(--text-link)", cursor: "pointer", fontSize: "inherit", textDecoration: "underline", padding: 0, fontFamily: "inherit" }}>Clear</button></>
                                : "Waiting for data…"}
                        </motion.div>
                    )}
                    {filtered.map((a, i) => {
                        const sit = a.situation;
                        const active = selectedId === sit.situation_id;
                        const fresh = recentlyUpdated.has(sit.situation_id);
                        return (
                            <motion.div key={sit.situation_id}
                                variants={itemVariants} custom={i}
                                initial="hidden" animate="visible" exit="exit"
                                layout layoutId={sit.situation_id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className={`sidebar-item ${active ? "sidebar-item-active" : ""}`}
                                onClick={() => onSelect(sit.situation_id)}
                                style={{ marginBottom: "2px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                    <span className="mono" style={{ fontSize: "0.76rem", fontWeight: 600, color: active ? "var(--blue-text)" : "var(--text-primary)" }}
                                        title={sit.situation_id}>
                                        {sit.situation_id.substring(0, 8)}
                                    </span>
                                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                        {fresh && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--blue)" }} />}
                                        <span className="mono" style={{ fontSize: "0.68rem", fontWeight: 600, color: riskColor(sit.max_anomaly) }}>
                                            {isNaN(sit.max_anomaly) ? "—" : `${Math.round(sit.max_anomaly * 100)}%`}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "3px", marginBottom: "4px", flexWrap: "wrap" }}>
                                    {sit.signal_types.slice(0, 3).map(t => <span key={t} className="signal-tag">{t}</span>)}
                                    {sit.signal_types.length > 3 && <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", alignSelf: "center" }}>+{sit.signal_types.length - 3}</span>}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>{sit.entities[0] || "—"}</span>
                                    <span className="mono" style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{timeAgo(sit.last_activity)}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Stats */}
            <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-around" }}>
                {[
                    { l: "Signals", v: sorted.reduce((s, a) => s + (a.situation.evidence_count || 0), 0) },
                    { l: "Active", v: sorted.length },
                    { l: "Types", v: new Set(sorted.flatMap(s => s.situation.signal_types)).size },
                ].map(s => (
                    <div key={s.l} style={{ textAlign: "center" }}>
                        <div className="label" style={{ fontSize: "0.5rem", marginBottom: "1px" }}>{s.l}</div>
                        <div className="mono" style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{s.v}</div>
                    </div>
                ))}
            </div>
        </motion.aside>
    );
}
