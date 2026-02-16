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
            hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
        });
    } catch {
        return "--:--:--";
    }
}

export default function LiveFeed({ feed }: LiveFeedProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (!paused && containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [feed.length, paused]);

    return (
        <div className="glass-card animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Header */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px 20px 12px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: "28px", height: "28px", borderRadius: "var(--radius-sm)",
                        background: "var(--green-surface)", border: "1px solid rgba(16,185,129,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.85rem",
                    }}>
                        📡
                    </div>
                    <span style={{
                        fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em",
                        textTransform: "uppercase", color: "var(--text-muted)",
                    }}>
                        Live Activity Feed
                    </span>
                    <span className="badge badge-green" style={{ fontSize: "0.55rem" }}>
                        {feed.length}
                    </span>
                </div>
                <button
                    onClick={() => setPaused((p) => !p)}
                    style={{
                        padding: "5px 14px",
                        borderRadius: "var(--radius-sm)",
                        border: `1px solid ${paused ? "rgba(245,158,11,0.3)" : "var(--border-default)"}`,
                        background: paused ? "var(--amber-surface)" : "rgba(255,255,255,0.03)",
                        color: paused ? "var(--amber)" : "var(--text-dim)",
                        cursor: "pointer",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.04em",
                        transition: "all 0.25s ease",
                    }}
                >
                    {paused ? "▶ RESUME" : "⏸ PAUSE"}
                </button>
            </div>

            {/* Feed */}
            <div ref={containerRef} style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
                {feed.length === 0 && (
                    <div style={{
                        textAlign: "center", padding: "40px 16px", color: "var(--text-dim)",
                    }}>
                        <div style={{ fontSize: "1.8rem", marginBottom: "10px", opacity: 0.3 }}>📡</div>
                        <div style={{ fontSize: "0.82rem" }}>Waiting for analysis events…</div>
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
                                animationDelay: idx < 3 ? `${idx * 0.08}s` : undefined,
                            }}
                        >
                            {/* Timestamp */}
                            <div style={{
                                fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                                color: "var(--text-dim)", minWidth: "62px", paddingTop: "2px",
                            }}>
                                {formatTime(sit.last_activity)}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    <span style={{
                                        fontFamily: "var(--font-mono)", fontSize: "0.72rem",
                                        fontWeight: 700, color: "var(--blue-light)",
                                    }} title={sit.situation_id}>
                                        {sit.situation_id.substring(0, 8)}
                                    </span>
                                    {sit.signal_types.slice(0, 2).map((t) => (
                                        <span key={t} className="badge badge-gray" style={{ fontSize: "0.5rem", padding: "1px 5px" }}>
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                {dominant && (
                                    <div style={{
                                        fontSize: "0.75rem", color: "var(--text-secondary)",
                                        lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                        {dominant.description}
                                    </div>
                                )}
                            </div>

                            {/* Confidence */}
                            <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                                <span style={{
                                    fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700,
                                    color: confidence > 70 ? "var(--green)" : confidence > 40 ? "var(--amber)" : "var(--text-dim)",
                                }}>
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
