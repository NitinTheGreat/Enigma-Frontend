"use client";

import { useState } from "react";
import type { ExplanationSection as SectionType, Counterfactual } from "@/types/dashboard";
import { SECTION_TYPE_STYLES, SECTION_TYPE_ICONS } from "@/types/dashboard";

interface ExplanationSectionsProps {
    sections: SectionType[];
}

function ContributionBadge({ direction }: { direction: string | null }) {
    if (!direction) return null;
    if (direction === "SUPPORTING")
        return <span style={{ fontSize: "0.6rem", color: "var(--green)", fontWeight: 600 }}>↑ SUPPORTING</span>;
    if (direction === "OPPOSING")
        return <span style={{ fontSize: "0.6rem", color: "var(--red)", fontWeight: 600 }}>↓ OPPOSING</span>;
    return <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600 }}>— NEUTRAL</span>;
}

function CounterfactualCard({ cf }: { cf: Counterfactual }) {
    const isPositive = cf.confidence_delta > 0;
    return (
        <div
            style={{
                padding: "10px 12px",
                background: "rgba(139, 92, 246, 0.06)",
                border: "1px solid rgba(139, 92, 246, 0.15)",
                borderRadius: "8px",
                marginBottom: "6px",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--amber)", marginRight: "6px" }}>IF</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--amber-light)" }}>{cf.missing_condition}</span>
                    </div>
                    <div>
                        <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", marginRight: "6px" }}>THEN</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-primary)" }}>{cf.expected_effect}</span>
                    </div>
                </div>
                <div
                    style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: isPositive ? "var(--green-glow)" : "var(--red-glow)",
                        border: `1px solid ${isPositive ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: isPositive ? "var(--green-light)" : "var(--red-light)",
                        whiteSpace: "nowrap",
                    }}
                >
                    {isPositive ? "+" : ""}{cf.confidence_delta.toFixed(2)}
                </div>
            </div>
        </div>
    );
}

function TemporalMiniViz({ bullets }: { bullets: string[] }) {
    // Extract key metrics from bullets
    const trendLine = bullets.find(b => b.toLowerCase().includes("trend"));
    const velocityLine = bullets.find(b => b.toLowerCase().includes("velocity"));
    const stabilityLine = bullets.find(b => b.toLowerCase().includes("stability"));

    return (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px", marginBottom: "4px" }}>
            {trendLine && (
                <div style={{ padding: "6px 12px", background: "rgba(167,139,250,0.08)", borderRadius: "6px", fontSize: "0.7rem", color: "var(--purple-light)" }}>
                    📈 {trendLine}
                </div>
            )}
            {velocityLine && (
                <div style={{ padding: "6px 12px", background: "rgba(167,139,250,0.08)", borderRadius: "6px", fontSize: "0.7rem", color: "var(--purple-light)" }}>
                    ⚡ {velocityLine}
                </div>
            )}
            {stabilityLine && (
                <div style={{ padding: "6px 12px", background: "rgba(167,139,250,0.08)", borderRadius: "6px", fontSize: "0.7rem", color: "var(--purple-light)" }}>
                    🔄 {stabilityLine}
                </div>
            )}
        </div>
    );
}

export default function ExplanationSections({ sections }: ExplanationSectionsProps) {
    const [expandedSet, setExpandedSet] = useState<Set<number>>(() => {
        // Auto-expand SUMMARY
        const initial = new Set<number>();
        sections.forEach((s, i) => {
            if (s.type === "SUMMARY") initial.add(i);
        });
        return initial;
    });

    const toggle = (idx: number) => {
        setExpandedSet((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    return (
        <div className="glass-card animate-fade-in" style={{ padding: "20px" }}>
            <div
                style={{
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "14px",
                }}
            >
                AI Explanation
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {sections.map((section, idx) => {
                    const isExpanded = expandedSet.has(idx);
                    const sectionStyle = SECTION_TYPE_STYLES[section.type] || "";

                    return (
                        <div
                            key={`${section.type}-${idx}`}
                            className={`${sectionStyle} animate-fade-in stagger-${Math.min(idx + 1, 5)}`}
                            style={{
                                borderRadius: "8px",
                                overflow: "hidden",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {/* Header */}
                            <button
                                onClick={() => toggle(idx)}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "10px 14px",
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--text-primary)",
                                    textAlign: "left",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "0.85rem" }}>{SECTION_TYPE_ICONS[section.type] || "📄"}</span>
                                    <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{section.title}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <ContributionBadge direction={section.contribution_direction} />
                                    {section.contribution_score != null && (
                                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                                            {(section.contribution_score * 100).toFixed(0)}%
                                        </span>
                                    )}
                                    <span
                                        style={{
                                            fontSize: "0.7rem",
                                            color: "var(--text-muted)",
                                            transition: "transform 0.2s",
                                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                        }}
                                    >
                                        ▼
                                    </span>
                                </div>
                            </button>

                            {/* Body */}
                            {isExpanded && (
                                <div style={{ padding: "0 14px 14px" }}>
                                    {/* Temporal evolution mini viz */}
                                    {section.type === "TEMPORAL_EVOLUTION" && (
                                        <TemporalMiniViz bullets={section.bullets} />
                                    )}

                                    {/* Standard bullets */}
                                    <ul
                                        style={{
                                            margin: 0,
                                            padding: "0 0 0 16px",
                                            listStyleType: "none",
                                        }}
                                    >
                                        {section.bullets
                                            .filter((b) => {
                                                // Skip bullets already shown in TemporalMiniViz
                                                if (section.type === "TEMPORAL_EVOLUTION") {
                                                    const lower = b.toLowerCase();
                                                    if (lower.includes("trend") || lower.includes("velocity") || lower.includes("stability")) return false;
                                                }
                                                return true;
                                            })
                                            .map((bullet, bIdx) => (
                                                <li
                                                    key={bIdx}
                                                    style={{
                                                        fontSize: "0.77rem",
                                                        color: "var(--text-secondary)",
                                                        lineHeight: 1.6,
                                                        padding: "2px 0",
                                                        position: "relative",
                                                    }}
                                                >
                                                    <span style={{ position: "absolute", left: "-14px", color: "var(--text-muted)" }}>›</span>
                                                    {bullet}
                                                </li>
                                            ))}
                                    </ul>

                                    {/* Counterfactuals */}
                                    {section.counterfactuals && section.counterfactuals.length > 0 && (
                                        <div style={{ marginTop: "10px" }}>
                                            {section.counterfactuals.map((cf, cfIdx) => (
                                                <CounterfactualCard key={cfIdx} cf={cf} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
