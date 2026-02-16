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
        return Array.from(situations.values()).sort(
            (a, b) => {
                const tA = new Date(b.situation.last_activity).getTime();
                const tB = new Date(a.situation.last_activity).getTime();
                // Guard against NaN in sort
                if (isNaN(tA) && isNaN(tB)) return 0;
                if (isNaN(tA)) return -1;
                if (isNaN(tB)) return 1;
                return tA - tB;
            }
        );
    }, [situations]);

    const filteredSituations = useMemo(() => {
        let list = sortedSituations;

        // Apply filter
        if (filter === "escalating") {
            list = list.filter((a) => a.reasoning.trend === "escalating");
        } else if (filter === "high-anomaly") {
            list = list.filter((a) => a.situation.max_anomaly > 0.5);
        }

        // Apply search
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

    // Aggregate stats
    const totalSignals = sortedSituations.reduce((sum, s) => sum + (s.situation.evidence_count || 0), 0);
    const allTypes = new Set(sortedSituations.flatMap((s) => s.situation.signal_types));
    const escalatingCount = sortedSituations.filter((s) => s.reasoning.trend === "escalating").length;

    return (
        <aside
            style={{
                width: "320px",
                minWidth: "320px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid var(--border-default)",
                background: "rgba(10, 15, 26, 0.5)",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "16px 16px 12px",
                    borderBottom: "1px solid var(--border-default)",
                }}
            >
                <div
                    style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        marginBottom: "4px",
                    }}
                >
                    Active Situations
                </div>
                <div style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                }}>
                    <div style={{ fontSize: "1.8rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-bright)" }}
                        className="animate-count-up">
                        {sortedSituations.length}
                    </div>
                    {escalatingCount > 0 && (
                        <span className="badge badge-red" style={{ fontSize: "0.55rem" }}>
                            🔺 {escalatingCount} escalating
                        </span>
                    )}
                </div>
            </div>

            {/* Search & Filter */}
            <div style={{ padding: "10px 12px 6px", borderBottom: "1px solid var(--border-default)" }}>
                {/* Search Input */}
                <div style={{ position: "relative", marginBottom: "8px" }}>
                    <span style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        pointerEvents: "none",
                    }}>
                        🔍
                    </span>
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search by ID, entity, or type…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Filter pills */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button
                        className={`filter-pill ${filter === "all" ? "filter-pill-active" : ""}`}
                        onClick={() => setFilter("all")}
                    >
                        All ({sortedSituations.length})
                    </button>
                    <button
                        className={`filter-pill ${filter === "escalating" ? "filter-pill-active" : ""}`}
                        onClick={() => setFilter("escalating")}
                    >
                        🔺 Escalating ({escalatingCount})
                    </button>
                    <button
                        className={`filter-pill ${filter === "high-anomaly" ? "filter-pill-active" : ""}`}
                        onClick={() => setFilter("high-anomaly")}
                    >
                        ⚠️ High Anomaly
                    </button>
                </div>
            </div>

            {/* Situations List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                {filteredSituations.length === 0 && (
                    <div
                        style={{
                            padding: "24px 16px",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            fontSize: "0.8rem",
                        }}
                    >
                        {search || filter !== "all" ? (
                            <>
                                No situations match filters.
                                <br />
                                <button
                                    onClick={() => { setSearch(""); setFilter("all"); }}
                                    style={{
                                        marginTop: "8px",
                                        background: "none",
                                        border: "1px solid var(--border-default)",
                                        color: "var(--blue-light)",
                                        padding: "4px 12px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "0.7rem",
                                    }}
                                >
                                    Clear filters
                                </button>
                            </>
                        ) : (
                            <>
                                No active situations.
                                <br />
                                Waiting for threat data…
                            </>
                        )}
                    </div>
                )}

                {filteredSituations.map((analysis, idx) => {
                    const sit = analysis.situation;
                    const isSelected = selectedId === sit.situation_id;
                    const isRecent = recentlyUpdated.has(sit.situation_id);

                    return (
                        <div
                            key={sit.situation_id}
                            onClick={() => onSelect(sit.situation_id)}
                            className={`card-interactive animate-fade-in stagger-${Math.min(idx + 1, 5)} ${isRecent ? "animate-border-pulse" : ""}`}
                            style={{
                                padding: "12px",
                                marginBottom: "6px",
                                borderRadius: "10px",
                                background: isSelected ? "rgba(59, 130, 246, 0.1)" : "var(--glass-bg)",
                                border: `1px solid ${isSelected ? "var(--blue)" : isRecent ? "var(--blue-light)" : "var(--glass-border)"}`,
                                ...(isRecent ? { ["--glow-color" as string]: "var(--blue-light)" } : {}),
                            }}
                        >
                            {/* ID + anomaly */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.8rem",
                                        fontWeight: 600,
                                        color: "var(--text-bright)",
                                    }}
                                    title={sit.situation_id}
                                >
                                    {sit.situation_id.substring(0, 8)}
                                </span>
                                <span
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        color: anomalyColor(sit.max_anomaly),
                                    }}
                                >
                                    {isNaN(sit.max_anomaly) ? "—" : `${(sit.max_anomaly * 100).toFixed(0)}%`}
                                </span>
                            </div>

                            {/* Signal type tags */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                                {sit.signal_types.slice(0, 4).map((type) => (
                                    <span
                                        key={type}
                                        style={{
                                            fontSize: "0.6rem",
                                            padding: "1px 6px",
                                            borderRadius: "4px",
                                            background: `${SIGNAL_TYPE_COLORS[type] || "var(--text-muted)"}18`,
                                            color: SIGNAL_TYPE_COLORS[type] || "var(--text-muted)",
                                            border: `1px solid ${SIGNAL_TYPE_COLORS[type] || "var(--text-muted)"}30`,
                                            fontFamily: "var(--font-mono)",
                                            fontWeight: 500,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "3px",
                                        }}
                                    >
                                        {SIGNAL_TYPE_ICONS[type] || "•"} {type}
                                    </span>
                                ))}
                                {sit.signal_types.length > 4 && (
                                    <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                                        +{sit.signal_types.length - 4}
                                    </span>
                                )}
                            </div>

                            {/* Entity + metadata */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                                    {sit.entities[0] || "unknown"}
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span
                                        className="badge badge-blue"
                                        style={{ fontSize: "0.6rem", padding: "1px 5px" }}
                                    >
                                        {sit.evidence_count || 0} signals
                                    </span>
                                    <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                                        {timeAgo(sit.last_activity)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Stats footer */}
            <div
                style={{
                    padding: "12px 16px",
                    borderTop: "1px solid var(--border-default)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>
                        Signals
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-bright)" }}>
                        {totalSignals}
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>
                        Active
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", fontWeight: 600, color: "var(--amber)" }}>
                        {sortedSituations.length}
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>
                        Types
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", fontWeight: 600, color: "var(--purple)" }}>
                        {allTypes.size}
                    </div>
                </div>
            </div>
        </aside>
    );
}
