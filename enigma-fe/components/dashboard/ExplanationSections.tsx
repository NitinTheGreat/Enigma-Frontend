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
        return <span style={{ fontSize: "0.6rem", color: "var(--green)", fontWeight: 600 }}>↑ SUPPORT</span>;
    if (direction === "OPPOSING")
        return <span style={{ fontSize: "0.6rem", color: "var(--red)", fontWeight: 600 }}>↓ OPPOSE</span>;
    return <span style={{ fontSize: "0.6rem", color: "var(--text-dim)", fontWeight: 600 }}>— NEUTRAL</span>;
}

function CounterfactualCard({ cf }: { cf: Counterfactual }) {
    const delta = isNaN(cf.confidence_delta) ? 0 : cf.confidence_delta;
    const isPositive = delta > 0;
    return (
        <div
            style={{
                padding: "12px 14px",
                background: "var(--purple-surface)",
                border: "1px solid rgba(139, 92, 246, 0.12)",
                borderRadius: "var(--radius-md)",
                marginBottom: "8px",
                transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(139, 92, 246, 0.1)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(139, 92, 246, 0.25)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateX(3px)";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "var(--purple-surface)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(139, 92, 246, 0.12)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: "5px" }}>
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--amber)", marginRight: "6px", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>IF</span>
                        <span style={{ fontSize: "0.78rem", color: "var(--amber-light)" }}>{cf.missing_condition}</span>
                    </div>
                    <div>
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-dim)", marginRight: "6px", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>THEN</span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-primary)" }}>{cf.expected_effect}</span>
                    </div>
                </div>
                <div style={{
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm)",
                    background: isPositive ? "var(--green-surface)" : "var(--red-surface)",
                    border: `1px solid ${isPositive ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: isPositive ? "var(--green-light)" : "var(--red-light)",
                    whiteSpace: "nowrap",
                }}>
                    {isPositive ? "+" : ""}{delta.toFixed(2)}
                </div>
            </div>
        </div>
    );
}

function TemporalMiniViz({ bullets }: { bullets: string[] }) {
    const trendLine = bullets.find(b => b.toLowerCase().includes("trend"));
    const velocityLine = bullets.find(b => b.toLowerCase().includes("velocity"));
    const stabilityLine = bullets.find(b => b.toLowerCase().includes("stability"));
    const items = [
        trendLine && { icon: "📈", text: trendLine },
        velocityLine && { icon: "⚡", text: velocityLine },
        stabilityLine && { icon: "🔄", text: stabilityLine },
    ].filter(Boolean);

    if (items.length === 0) return null;

    return (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px", marginBottom: "6px" }}>
            {items.map((item, idx) => item && (
                <div key={idx} style={{
                    padding: "8px 14px", background: "rgba(167,139,250,0.06)",
                    borderRadius: "var(--radius-sm)", border: "1px solid rgba(167,139,250,0.1)",
                    fontSize: "0.72rem", color: "var(--purple-light)",
                }}>
                    {item.icon} {item.text}
                </div>
            ))}
        </div>
    );
}

export default function ExplanationSections({ sections }: ExplanationSectionsProps) {
    const [expandedSet, setExpandedSet] = useState<Set<number>>(() => {
        const initial = new Set<number>();
        sections.forEach((s, i) => { if (s.type === "SUMMARY") initial.add(i); });
        return initial;
    });

    const toggle = (idx: number) => {
        setExpandedSet((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return next;
        });
    };

    return (
        <div className="glass-card animate-fade-in" style={{ padding: "24px" }}>
            {/* Header */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: "28px", height: "28px", borderRadius: "var(--radius-sm)",
                        background: "var(--blue-surface)", border: "1px solid rgba(59,130,246,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.85rem",
                    }}>
                        📋
                    </div>
                    <span style={{
                        fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em",
                        textTransform: "uppercase", color: "var(--text-muted)",
                    }}>
                        AI Explanation
                    </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                    <button className="mini-btn" onClick={() => setExpandedSet(new Set(sections.map((_, i) => i)))}>
                        Expand All
                    </button>
                    <button className="mini-btn" onClick={() => setExpandedSet(new Set())}>
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {sections.map((section, idx) => {
                    const isExpanded = expandedSet.has(idx);
                    const sectionStyle = SECTION_TYPE_STYLES[section.type] || "";

                    return (
                        <div
                            key={`${section.type}-${idx}`}
                            className={`${sectionStyle} animate-fade-in stagger-${Math.min(idx + 1, 5)}`}
                            style={{
                                borderRadius: "var(--radius-md)",
                                overflow: "hidden",
                                transition: "all 0.25s ease",
                            }}
                        >
                            <button onClick={() => toggle(idx)} className="section-header-btn">
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ fontSize: "0.9rem" }}>{SECTION_TYPE_ICONS[section.type] || "📄"}</span>
                                    <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{section.title}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <ContributionBadge direction={section.contribution_direction} />
                                    {section.contribution_score != null && !isNaN(section.contribution_score) && (
                                        <span style={{
                                            fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                                            color: "var(--text-dim)",
                                        }}>
                                            {(section.contribution_score * 100).toFixed(0)}%
                                        </span>
                                    )}
                                    <span style={{
                                        fontSize: "0.7rem", color: "var(--text-dim)",
                                        transition: "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                        display: "inline-block",
                                    }}>
                                        ▼
                                    </span>
                                </div>
                            </button>

                            <div className="section-collapsible" data-expanded={isExpanded ? "true" : "false"}>
                                <div className="section-collapsible-inner">
                                    <div style={{ padding: "0 16px 16px" }}>
                                        {section.type === "TEMPORAL_EVOLUTION" && (
                                            <TemporalMiniViz bullets={section.bullets} />
                                        )}

                                        <ul style={{ margin: 0, padding: "0 0 0 18px", listStyleType: "none" }}>
                                            {section.bullets
                                                .filter((b) => {
                                                    if (section.type !== "TEMPORAL_EVOLUTION") return true;
                                                    const lower = b.toLowerCase();
                                                    return !lower.includes("trend") && !lower.includes("velocity") && !lower.includes("stability");
                                                })
                                                .map((bullet, bIdx) => (
                                                    <li key={bIdx} style={{
                                                        fontSize: "0.8rem", color: "var(--text-secondary)",
                                                        lineHeight: 1.7, padding: "3px 0", position: "relative",
                                                    }}>
                                                        <span style={{ position: "absolute", left: "-14px", color: "var(--text-dim)" }}>›</span>
                                                        {bullet}
                                                    </li>
                                                ))}
                                        </ul>

                                        {section.counterfactuals && section.counterfactuals.length > 0 && (
                                            <div style={{ marginTop: "12px" }}>
                                                {section.counterfactuals.map((cf, cfIdx) => (
                                                    <CounterfactualCard key={cfIdx} cf={cf} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
