"use client";

import type { SituationAnalysis } from "@/types/dashboard";
import { SIGNAL_TYPE_COLORS, SIGNAL_TYPE_ICONS } from "@/types/dashboard";

interface SidebarProps {
    situations: Map<string, SituationAnalysis>;
    selectedId: string | null;
    onSelect: (id: string) => void;
    recentlyUpdated: Set<string>;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function anomalyColor(val: number): string {
    if (val > 0.8) return "var(--red)";
    if (val > 0.5) return "var(--amber)";
    return "var(--green)";
}

export default function Sidebar({ situations, selectedId, onSelect, recentlyUpdated }: SidebarProps) {
    const sortedSituations = Array.from(situations.values()).sort(
        (a, b) => new Date(b.situation.last_activity).getTime() - new Date(a.situation.last_activity).getTime()
    );

    // Aggregate stats
    const totalSignals = sortedSituations.reduce((sum, s) => sum + s.situation.evidence_count, 0);
    const allTypes = new Set(sortedSituations.flatMap((s) => s.situation.signal_types));

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
                <div style={{ fontSize: "1.8rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-bright)" }}>
                    {sortedSituations.length}
                </div>
            </div>

            {/* Situations List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                {sortedSituations.length === 0 && (
                    <div
                        style={{
                            padding: "24px 16px",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            fontSize: "0.8rem",
                        }}
                    >
                        No active situations.
                        <br />
                        Waiting for threat data…
                    </div>
                )}

                {sortedSituations.map((analysis, idx) => {
                    const sit = analysis.situation;
                    const isSelected = selectedId === sit.situation_id;
                    const isRecent = recentlyUpdated.has(sit.situation_id);

                    return (
                        <div
                            key={sit.situation_id}
                            onClick={() => onSelect(sit.situation_id)}
                            className={`animate-fade-in stagger-${Math.min(idx + 1, 5)} ${isRecent ? "animate-border-pulse" : ""}`}
                            style={{
                                padding: "12px",
                                marginBottom: "6px",
                                borderRadius: "10px",
                                cursor: "pointer",
                                background: isSelected ? "rgba(59, 130, 246, 0.1)" : "var(--glass-bg)",
                                border: `1px solid ${isSelected ? "var(--blue)" : isRecent ? "var(--blue-light)" : "var(--glass-border)"}`,
                                transition: "all 0.2s ease",
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
                                    {(sit.max_anomaly * 100).toFixed(0)}%
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
                                        {sit.evidence_count} signals
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
