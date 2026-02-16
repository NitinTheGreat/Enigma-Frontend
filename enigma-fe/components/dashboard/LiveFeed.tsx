"use client";

import { useRef, useState, useEffect } from "react";
import type { SituationAnalysis } from "@/types/dashboard";

interface LiveFeedProps {
    feed: SituationAnalysis[];
}

function severityColor(anomaly: number): string {
    if (isNaN(anomaly)) return "var(--text-muted)";
    if (anomaly > 0.8) return "var(--red)";
    if (anomaly > 0.5) return "var(--amber)";
    return "var(--green)";
}

function formatTime(dateStr: string | undefined | null): string {
    if (!dateStr) return "--:--:--";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "--:--:--";
        return d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
    } catch {
        return "--:--:--";
    }
}

export default function LiveFeed({ feed }: LiveFeedProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [paused, setPaused] = useState(false);

    // Auto-scroll to top (newest first) unless paused
    useEffect(() => {
        if (!paused && containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [feed.length, paused]);

    return (
        <div className="glass-card animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 20px 10px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                        style={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--text-muted)",
                        }}
                    >
                        Live Activity Feed
                    </div>
                    <span
                        className="badge badge-blue"
                        style={{ fontSize: "0.55rem", padding: "1px 5px" }}
                    >
                        {feed.length}
                    </span>
                </div>
                <button
                    onClick={() => setPaused((p) => !p)}
                    style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: `1px solid ${paused ? "var(--amber)" : "var(--border-default)"}`,
                        background: paused ? "var(--amber-glow)" : "rgba(255,255,255,0.04)",
                        color: paused ? "var(--amber)" : "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        transition: "all 0.2s ease",
                    }}
                >
                    {paused ? "▶ RESUME" : "⏸ PAUSE"}
                </button>
            </div>

            {/* Feed */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "0 12px 12px",
                }}
            >
                {feed.length === 0 && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "32px 16px",
                            color: "var(--text-muted)",
                            fontSize: "0.8rem",
                        }}
                    >
                        <div style={{ fontSize: "1.5rem", marginBottom: "8px", opacity: 0.5 }}>📡</div>
                        Waiting for analysis events…
                    </div>
                )}

                {feed.map((analysis, idx) => {
                    const sit = analysis.situation;
                    const dominant = analysis.langgraph.hypotheses.find(
                        (h) => h.id === analysis.explanation.dominant_hypothesis_id
                    );
                    const confidence = isNaN(analysis.explanation.dominant_confidence)
                        ? 0
                        : Math.round(analysis.explanation.dominant_confidence * 100);

                    return (
                        <div
                            key={`${sit.situation_id}-${sit.last_activity}-${idx}`}
                            className={`feed-row ${idx < 3 ? "animate-slide-right" : ""}`}
                            style={{
                                borderLeft: `3px solid ${severityColor(sit.max_anomaly)}`,
                            }}
                        >
                            {/* Timestamp */}
                            <div
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.65rem",
                                    color: "var(--text-muted)",
                                    minWidth: "60px",
                                    paddingTop: "2px",
                                }}
                            >
                                {formatTime(sit.last_activity)}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    <span
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            fontSize: "0.7rem",
                                            fontWeight: 600,
                                            color: "var(--blue-light)",
                                        }}
                                        title={sit.situation_id}
                                    >
                                        {sit.situation_id.substring(0, 8)}
                                    </span>
                                    {sit.signal_types.slice(0, 2).map((t) => (
                                        <span
                                            key={t}
                                            className="badge badge-gray"
                                            style={{ fontSize: "0.55rem", padding: "0 4px" }}
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                {dominant && (
                                    <div
                                        style={{
                                            fontSize: "0.72rem",
                                            color: "var(--text-secondary)",
                                            lineHeight: 1.4,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {dominant.description}
                                    </div>
                                )}
                            </div>

                            {/* Confidence */}
                            <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                                <span
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                        color: confidence > 70 ? "var(--green)" : confidence > 40 ? "var(--amber)" : "var(--text-muted)",
                                    }}
                                >
                                    {confidence}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
