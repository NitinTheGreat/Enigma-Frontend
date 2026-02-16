"use client";

import { useMemo } from "react";
import type { SituationAnalysis, HealthData } from "@/types/dashboard";
import DonutChart from "@/components/charts/DonutChart";
import AreaChart from "@/components/charts/AreaChart";
import BarChart from "@/components/charts/BarChart";
import GaugeChart from "@/components/charts/GaugeChart";
import SparkLine from "@/components/charts/SparkLine";
import { motion } from "framer-motion";

interface Props {
    situations: Map<string, SituationAnalysis>;
    health: HealthData | null;
    feed: SituationAnalysis[];
}

const CHART_COLORS = [
    "#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b", "#10b981",
    "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#84cc16",
];

const cardStyle = (delay: number, accentColor?: string): object => ({
    padding: "20px",
    background: "var(--bg-card)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    position: "relative" as const,
    overflow: "hidden",
    boxShadow: accentColor
        ? `0 0 20px ${accentColor}10, inset 0 1px 0 rgba(255,255,255,0.06)`
        : "inset 0 1px 0 rgba(255,255,255,0.06)",
});

/* ── KPI card ── */
function MetricCard({ label, value, delta, spark, color, icon, delay = 0 }: {
    label: string; value: string; delta?: string; spark?: number[];
    color: string; icon: string; delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -2, boxShadow: `0 8px 24px ${color}20` }}
            transition={{ duration: 0.4, delay }}
            style={{
                ...cardStyle(delay, color),
                padding: "16px 18px",
                display: "flex", flexDirection: "column", gap: "10px",
                borderLeft: `3px solid ${color}`,
            }}>
            {/* Subtle animated background accent */}
            <div style={{
                position: "absolute", top: "-20px", right: "-20px",
                width: "80px", height: "80px", borderRadius: "50%",
                background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
                pointerEvents: "none",
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem" }}>{icon}</span>
                <span style={{
                    fontSize: "0.52rem", fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.08em", color: "var(--text-muted)",
                }}>{label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span className="mono" style={{
                        fontSize: "1.6rem", fontWeight: 800, color,
                        lineHeight: 1, letterSpacing: "-0.02em",
                    }}>
                        {value}
                    </span>
                    {delta && (
                        <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mono" style={{
                                fontSize: "0.58rem", fontWeight: 600,
                                color: delta.startsWith("+") || delta.startsWith("↑") ? "#ef4444"
                                    : delta.startsWith("-") || delta.startsWith("↓") ? "#10b981"
                                        : "var(--text-muted)",
                                background: delta.startsWith("↑") ? "#ef444415" : "transparent",
                                padding: "1px 5px", borderRadius: "4px",
                            }}>{delta}</motion.span>
                    )}
                </div>
                {spark && spark.length >= 2 && <SparkLine data={spark} color={color} />}
            </div>
        </motion.div>
    );
}

/* ── Section header ── */
function SectionHeader({ icon, title, subtitle, delay = 0 }: {
    icon: string; title: string; subtitle?: string; delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.9rem" }}>{icon}</span>
            <span style={{
                fontSize: "0.54rem", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: "var(--text-primary)",
            }}>{title}</span>
            {subtitle && (
                <span style={{
                    fontSize: "0.48rem", color: "var(--text-muted)",
                    marginLeft: "auto", fontStyle: "italic",
                }}>{subtitle}</span>
            )}
        </motion.div>
    );
}

export default function OverviewDashboard({ situations, health, feed }: Props) {
    const sits = useMemo(() => Array.from(situations.values()), [situations]);

    // Signal type distribution
    const signalDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        sits.forEach(a => a.situation.signal_types.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([label, value], i) => ({ label, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
    }, [sits]);

    // Threat level distribution
    const threatDistribution = useMemo(() => {
        let high = 0, med = 0, low = 0;
        sits.forEach(a => {
            const v = a.situation.max_anomaly;
            if (isNaN(v)) low++;
            else if (v > 0.7) high++;
            else if (v > 0.4) med++;
            else low++;
        });
        return [
            { label: "Critical", value: high, color: "#ef4444" },
            { label: "Medium", value: med, color: "#f59e0b" },
            { label: "Low", value: low, color: "#10b981" },
        ].filter(d => d.value > 0);
    }, [sits]);

    // Trend distribution
    const trendDistribution = useMemo(() => {
        let esc = 0, stable = 0, deesc = 0;
        sits.forEach(a => {
            if (a.reasoning.trend === "escalating") esc++;
            else if (a.reasoning.trend === "deescalating") deesc++;
            else stable++;
        });
        return [
            { label: "Escalating", value: esc, color: "#ef4444" },
            { label: "Stable", value: stable, color: "#3b82f6" },
            { label: "De-escalating", value: deesc, color: "#10b981" },
        ].filter(d => d.value > 0);
    }, [sits]);

    // Confidence trend (from feed, most recent 20)
    const confidenceTrend = useMemo(() => {
        const recent = feed.slice(0, 20).reverse();
        return recent.map(a => isNaN(a.explanation.dominant_confidence) ? 0 : a.explanation.dominant_confidence);
    }, [feed]);

    const confidenceLabels = useMemo(() => {
        const recent = feed.slice(0, 20).reverse();
        return recent.map((a, i) => {
            if (i % 3 !== 0 && i !== recent.length - 1) return "";
            try {
                const d = new Date(a.situation.last_activity);
                if (isNaN(d.getTime())) return "—";
                return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
            } catch { return "—"; }
        });
    }, [feed]);

    // Evidence per situation bar chart
    const evidenceBars = useMemo(() =>
        [...sits].sort((a, b) => b.situation.evidence_count - a.situation.evidence_count)
            .slice(0, 8)
            .map((a, i) => ({
                label: a.situation.situation_id.substring(0, 8),
                value: a.situation.evidence_count || 0,
                color: CHART_COLORS[i % CHART_COLORS.length],
            })),
        [sits]);

    // Anomaly per situation bar chart
    const anomalyBars = useMemo(() =>
        [...sits].sort((a, b) => (b.situation.max_anomaly || 0) - (a.situation.max_anomaly || 0))
            .slice(0, 8)
            .map(a => ({
                label: a.situation.situation_id.substring(0, 8),
                value: Math.round((a.situation.max_anomaly || 0) * 100),
                color: (a.situation.max_anomaly || 0) > 0.7 ? "#ef4444"
                    : (a.situation.max_anomaly || 0) > 0.4 ? "#f59e0b" : "#10b981",
            })),
        [sits]);

    // Sparkline data
    const confSpark = useMemo(() =>
        feed.slice(0, 8).reverse().map(a => isNaN(a.explanation.dominant_confidence) ? 0 : a.explanation.dominant_confidence),
        [feed]);
    const anomalySpark = useMemo(() =>
        feed.slice(0, 8).reverse().map(a => a.situation.max_anomaly || 0),
        [feed]);
    const evidenceSpark = useMemo(() =>
        feed.slice(0, 8).reverse().map(a => a.situation.evidence_count || 0),
        [feed]);

    // Average metrics
    const avgConf = sits.length > 0
        ? sits.reduce((s, a) => s + (isNaN(a.explanation.dominant_confidence) ? 0 : a.explanation.dominant_confidence), 0) / sits.length : 0;
    const avgAnomaly = sits.length > 0
        ? sits.reduce((s, a) => s + (isNaN(a.situation.max_anomaly) ? 0 : a.situation.max_anomaly), 0) / sits.length : 0;
    const totalEvidence = sits.reduce((s, a) => s + (a.situation.evidence_count || 0), 0);
    const escCount = sits.filter(a => a.reasoning.trend === "escalating").length;
    const avgConvergence = sits.length > 0
        ? sits.reduce((s, a) => s + (isNaN(a.langgraph.convergence_score) ? 0 : a.langgraph.convergence_score), 0) / sits.length : 0;

    // Active entities count
    const entityCount = useMemo(() => {
        const s = new Set<string>();
        sits.forEach(a => a.situation.entities.forEach(e => s.add(e)));
        return s.size;
    }, [sits]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                display: "flex", flexDirection: "column", gap: "14px",
                flex: 1, minHeight: 0, overflow: "auto",
                padding: "2px",
            }}>

            {/* ── KPI Cards ── */}
            <div className="overview-grid-kpi">
                <MetricCard icon="🎯" label="Active Situations" value={String(sits.length)}
                    delta={escCount > 0 ? `↑${escCount} escalating` : undefined}
                    spark={evidenceSpark} color="#3b82f6" delay={0} />
                <MetricCard icon="📊" label="Total Evidence" value={String(totalEvidence)}
                    spark={evidenceSpark} color="#8b5cf6" delay={0.06} />
                <MetricCard icon="✅" label="Avg Confidence" value={`${Math.round(avgConf * 100)}%`}
                    spark={confSpark} color="#10b981" delay={0.12} />
                <MetricCard icon="⚠️" label="Avg Anomaly" value={`${Math.round(avgAnomaly * 100)}%`}
                    spark={anomalySpark} color={avgAnomaly > 0.6 ? "#ef4444" : "#f59e0b"} delay={0.18} />
            </div>

            {/* ── Donut Charts Row ── */}
            <div className="overview-grid-donuts">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    style={cardStyle(0.08)}>
                    <SectionHeader icon="📡" title="Signal Distribution" />
                    {signalDistribution.length > 0
                        ? <DonutChart data={signalDistribution} centerValue={String(sits.length)} centerLabel="Situations" />
                        : <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: "0.72rem" }}>No data</div>}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                    style={cardStyle(0.14)}>
                    <SectionHeader icon="🛡️" title="Threat Levels" subtitle={`${entityCount} entities`} />
                    {threatDistribution.length > 0
                        ? <DonutChart data={threatDistribution} size={155} thickness={26}
                            centerValue={`${Math.round(avgAnomaly * 100)}%`} centerLabel="Avg Risk" />
                        : <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: "0.72rem" }}>No data</div>}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={cardStyle(0.2)}>
                    <SectionHeader icon="📈" title="Trend Analysis" subtitle="real-time" />
                    {trendDistribution.length > 0
                        ? <DonutChart data={trendDistribution} size={155} thickness={26}
                            centerValue={String(escCount)} centerLabel="Escalating" />
                        : <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: "0.72rem" }}>No data</div>}
                </motion.div>
            </div>

            {/* ── Area Chart + Gauge ── */}
            <div className="overview-grid-trend">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                    style={{ ...cardStyle(0.22, "#3b82f6"), padding: "20px" }}>
                    <SectionHeader icon="📉" title="Confidence Trend" subtitle={`${confidenceTrend.length} data points`} />
                    {confidenceTrend.length >= 2
                        ? <div className="chart-area-container">
                            <AreaChart data={confidenceTrend} labels={confidenceLabels}
                                width={520} height={170} gradientId="conf-grad" color="#3b82f6" />
                        </div>
                        : <div style={{
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", padding: "40px 0", gap: "8px",
                        }}>
                            <motion.div
                                animate={{ opacity: [0.3, 0.7, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                style={{ fontSize: "1.8rem" }}>📊</motion.div>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                                Waiting for data…
                            </span>
                        </div>}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                    style={{
                        ...cardStyle(0.28),
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        padding: "18px",
                    }}>
                    <SectionHeader icon="🎯" title="System Convergence" />
                    <GaugeChart value={avgConvergence} size={210}
                        label="Average convergence across all situations" />
                </motion.div>
            </div>

            {/* ── Bar Charts ── */}
            <div className="overview-grid-bars">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                    style={cardStyle(0.32, "#8b5cf6")}>
                    <SectionHeader icon="🔍" title="Evidence by Situation" subtitle={`${totalEvidence} total`} />
                    {evidenceBars.length > 0
                        ? <BarChart data={evidenceBars} />
                        : <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "0.72rem" }}>No data</div>}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                    style={cardStyle(0.38, "#ef4444")}>
                    <SectionHeader icon="⚡" title="Anomaly Score" subtitle="by situation (%)" />
                    {anomalyBars.length > 0
                        ? <BarChart data={anomalyBars} maxValue={100} />
                        : <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "0.72rem" }}>No data</div>}
                </motion.div>
            </div>
        </motion.div>
    );
}
