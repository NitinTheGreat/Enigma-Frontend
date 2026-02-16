"use client";

import { useState, useMemo } from "react";
import type { SituationAnalysis } from "@/types/dashboard";
import { SIGNAL_TYPE_COLORS, SIGNAL_TYPE_ICONS } from "@/types/dashboard";

interface SidebarProps {
    situations: Map<string, SituationAnalysis>;
    selectedId: string | null;
    onSelect: (id: string) => void;
    recentlyUpdated: Set<string>;
}

function timeAgo(dateStr: string | undefined | null): string {
    if (!dateStr) return "—";
    const parsed = new Date(dateStr).getTime();
    if (isNaN(parsed)) return "—";
    const diff = Date.now() - parsed;
    if (diff < 0) return "just now";
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function clampPercent(val: number): string {
    if (isNaN(val)) return "—";
    return `${Math.round(Math.max(0, Math.min(1, val)) * 100)}%`;
}

function anomalyColor(val: number): string {
    if (isNaN(val)) return "var(--text-muted)";
    if (val > 0.8) return "var(--red)";
    if (val > 0.5) return "var(--amber)";
    return "var(--green)";
}

type FilterType = "all" | "escalating" | "high-anomaly";

export default function Sidebar({ situations, selectedId, onSelect, recentlyUpdated }: SidebarProps) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");

    const sortedSituations = useMemo(() => {
        return Array.from(situations.values()).sort((a, b) => {
            const tA = new Date(b.situation.last_activity).getTime();
            const tB = new Date(a.situation.last_activity).getTime();
            if (isNaN(tA) && isNaN(tB)) return 0;
            if (isNaN(tA)) return -1;
            if (isNaN(tB)) return 1;
            return tA - tB;
        });
    }, [situations]);

    const filteredSituations = useMemo(() => {
        let list = sortedSituations;
        if (filter === "escalating") {
            list = list.filter((a) => a.reasoning.trend === "escalating");
        } else if (filter === "high-anomaly") {
            list = list.filter((a) => a.situation.max_anomaly > 0.5);
        }
        if (search.trim()) {
            const q = search.toLowerCase().trim();
            list = list.filter((a) => {
                const sit = a.situation;
                return (
                    sit.situation_id.toLowerCase().includes(q) ||
                    sit.entities.some((e) => e.toLowerCase().includes(q)) ||
                    sit.signal_types.some((t) => t.toLowerCase().includes(q))
                );
            });
        }
        return list;
    }, [sortedSituations, search, filter]);

    const escalatingCount = sortedSituations.filter((s) => s.reasoning.trend === "escalating").length;
    const totalSignals = sortedSituations.reduce((sum, s) => sum + (s.situation.evidence_count || 0), 0);
    const allTypes = new Set(sortedSituations.flatMap((s) => s.situation.signal_types));

    return (
        <aside
            style={{
                width: "340px",
                minWidth: "340px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid var(--border-default)",
                background: "rgba(6, 10, 20, 0.6)",
                overflow: "hidden",
            }}
        >
            {/* ── Header ── */}
            <div style={{ padding: "20px 20px 16px" }}>
                <div style={{
                    fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "8px",
                }}>
                    Active Situations
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                    <span
                        className="animate-count-up"
                        style={{
                            fontSize: "2.2rem", fontWeight: 800, fontFamily: "var(--font-mono)",
                            color: "var(--text-bright)",
                            background: "linear-gradient(135deg, var(--text-bright), var(--blue-light))",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        {sortedSituations.length}
                    </span>
                    {escalatingCount > 0 && (
                        <span className="badge badge-red" style={{ fontSize: "0.55rem" }}>
                            ▲ {escalatingCount} escalating
                        </span>
                    )}
                </div>
            </div>

            {/* ── Search & Filter ── */}
            <div style={{ padding: "0 16px 12px", borderBottom: "1px solid var(--border-default)" }}>
                <div style={{ position: "relative", marginBottom: "10px" }}>
                    <span style={{
                        position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                        fontSize: "0.75rem", color: "var(--text-dim)", pointerEvents: "none",
                    }}>
                        ⌕
                    </span>
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search by ID, entity, or type…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {[
                        { key: "all" as FilterType, label: `All (${sortedSituations.length})` },
                        { key: "escalating" as FilterType, label: `▲ Escalating (${escalatingCount})` },
                        { key: "high-anomaly" as FilterType, label: "⚠ High Anomaly" },
                    ].map((f) => (
                        <button
                            key={f.key}
                            className={`filter-pill ${filter === f.key ? "filter-pill-active" : ""}`}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Situations list ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
                {filteredSituations.length === 0 && (
                    <div style={{
                        padding: "40px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: "0.8rem",
                    }}>
                        {search || filter !== "all" ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "1.3rem", opacity: 0.4 }}>🔍</span>
                                <span>No situations match filters</span>
                                <button
                                    onClick={() => { setSearch(""); setFilter("all"); }}
                                    className="mini-btn"
                                >
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "1.3rem", opacity: 0.4 }}>📡</span>
                                <span>Waiting for threat data…</span>
                            </div>
                        )}
                    </div>
                )}

                {filteredSituations.map((analysis, idx) => {
                    const sit = analysis.situation;
                    const isSelected = selectedId === sit.situation_id;
                    const isRecent = recentlyUpdated.has(sit.situation_id);
                    const trendIcon = analysis.reasoning.trend === "escalating" ? "▲" : analysis.reasoning.trend === "deescalating" ? "▼" : "";

                    return (
                        <div
                            key={sit.situation_id}
                            onClick={() => onSelect(sit.situation_id)}
                            className={`card-interactive animate-fade-in stagger-${Math.min(idx + 1, 5)} ${isRecent ? "animate-border-pulse" : ""}`}
                            style={{
                                padding: "14px 16px",
                                marginBottom: "8px",
                                borderRadius: "var(--radius-md)",
                                background: isSelected
                                    ? "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.06))"
                                    : "rgba(255,255,255,0.02)",
                                border: `1px solid ${isSelected ? "rgba(59,130,246,0.3)" : isRecent ? "var(--blue)" : "var(--border-default)"}`,
                                ...(isSelected ? { boxShadow: "var(--shadow-glow-blue)" } : {}),
                            }}
                        >
                            {/* Row: ID + anomaly */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{
                                        fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700,
                                        color: isSelected ? "var(--blue-light)" : "var(--text-bright)",
                                    }} title={sit.situation_id}>
                                        {sit.situation_id.substring(0, 8)}
                                    </span>
                                    {trendIcon && (
                                        <span style={{
                                            fontSize: "0.55rem",
                                            color: analysis.reasoning.trend === "escalating" ? "var(--red)" : "var(--green)",
                                        }}>
                                            {trendIcon}
                                        </span>
                                    )}
                                </div>
                                <span style={{
                                    fontFamily: "var(--font-mono)", fontSize: "0.72rem", fontWeight: 700,
                                    color: anomalyColor(sit.max_anomaly),
                                    padding: "2px 8px",
                                    borderRadius: "var(--radius-sm)",
                                    background: `${anomalyColor(sit.max_anomaly)}15`,
                                }}>
                                    {clampPercent(sit.max_anomaly)}
                                </span>
                            </div>

                            {/* Signal tags */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                                {sit.signal_types.slice(0, 4).map((type) => (
                                    <span
                                        key={type}
                                        className="signal-tag"
                                        style={{
                                            background: `${SIGNAL_TYPE_COLORS[type] || "var(--text-muted)"}15`,
                                            color: SIGNAL_TYPE_COLORS[type] || "var(--text-muted)",
                                            border: `1px solid ${SIGNAL_TYPE_COLORS[type] || "var(--text-muted)"}25`,
                                        }}
                                    >
                                        {SIGNAL_TYPE_ICONS[type] || "•"} {type}
                                    </span>
                                ))}
                                {sit.signal_types.length > 4 && (
                                    <span style={{ fontSize: "0.6rem", color: "var(--text-dim)", alignSelf: "center" }}>
                                        +{sit.signal_types.length - 4}
                                    </span>
                                )}
                            </div>

                            {/* Bottom: entity + meta */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                                    {sit.entities[0] || "unknown"}
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span className="badge badge-blue" style={{ fontSize: "0.55rem", padding: "2px 7px" }}>
                                        {sit.evidence_count || 0}
                                    </span>
                                    <span style={{ fontSize: "0.6rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                                        {timeAgo(sit.last_activity)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Stats footer ── */}
            <div
                style={{
                    padding: "14px 20px",
                    borderTop: "1px solid var(--border-default)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                    background: "rgba(6, 10, 20, 0.4)",
                }}
            >
                {[
                    { label: "Signals", value: totalSignals, color: "var(--text-bright)" },
                    { label: "Active", value: sortedSituations.length, color: "var(--amber)" },
                    { label: "Types", value: allTypes.size, color: "var(--purple)" },
                ].map((s) => (
                    <div key={s.label} className="metric-cell">
                        <div style={{ fontSize: "0.55rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                            {s.label}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: s.color }}>
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}
