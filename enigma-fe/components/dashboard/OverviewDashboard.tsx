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

function MetricCard({ label, value, delta, spark, color }: {
    label: string; value: string; delta?: string; spark?: number[]; color?: string;
}) {
    return (
        <motion.div className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, boxShadow: "var(--shadow-md)" }}
            transition={{ duration: 0.3 }}
            style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span className="label" style={{ fontSize: "0.48rem" }}>{label}</span>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span className="mono" style={{ fontSize: "1.4rem", fontWeight: 700, color: color || "var(--text-primary)", lineHeight: 1 }}>
                        {value}
                    </span>
                    {delta && (
                        <span className="mono" style={{
                            fontSize: "0.6rem", fontWeight: 600,
                            color: delta.startsWith("+") || delta.startsWith("↑") ? "var(--red-text)"
                                : delta.startsWith("-") || delta.startsWith("↓") ? "var(--green-text)"
                                    : "var(--text-muted)",
                        }}>{delta}</span>
                    )}
                </div>
                {spark && spark.length >= 2 && <SparkLine data={spark} color={color || "var(--blue)"} />}
            </div>
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

    // Confidence trend (from feed, most recent 12)
    const confidenceTrend = useMemo(() => {
        const recent = feed.slice(0, 12).reverse();
        return recent.map(a => isNaN(a.explanation.dominant_confidence) ? 0 : a.explanation.dominant_confidence);
    }, [feed]);

    const confidenceLabels = useMemo(() => {
        const recent = feed.slice(0, 12).reverse();
        return recent.map((a) => {
            try {
                const d = new Date(a.situation.last_activity);
                if (isNaN(d.getTime())) return "—";
                return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
            } catch { return "—"; }
        });
    }, [feed]);

    // Evidence per situation bar chart (top 8)
    const evidenceBars = useMemo(() =>
        sits.sort((a, b) => b.situation.evidence_count - a.situation.evidence_count)
            .slice(0, 8)
            .map((a, i) => ({
                label: a.situation.situation_id.substring(0, 8),
                value: a.situation.evidence_count || 0,
                color: CHART_COLORS[i % CHART_COLORS.length],
            })),
        [sits]);

    // Anomaly per situation bar chart
    const anomalyBars = useMemo(() =>
        sits.sort((a, b) => (b.situation.max_anomaly || 0) - (a.situation.max_anomaly || 0))
            .slice(0, 8)
            .map(a => ({
                label: a.situation.situation_id.substring(0, 8),
                value: Math.round((a.situation.max_anomaly || 0) * 100),
                color: (a.situation.max_anomaly || 0) > 0.7 ? "#ef4444"
                    : (a.situation.max_anomaly || 0) > 0.4 ? "#f59e0b" : "#10b981",
            })),
        [sits]);

    // Sparkline data for KPI cards
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
        ? sits.reduce((s, a) => s + (isNaN(a.explanation.dominant_confidence) ? 0 : a.explanation.dominant_confidence), 0) / sits.length
        : 0;
    const avgAnomaly = sits.length > 0
        ? sits.reduce((s, a) => s + (isNaN(a.situation.max_anomaly) ? 0 : a.situation.max_anomaly), 0) / sits.length
        : 0;
    const totalEvidence = sits.reduce((s, a) => s + (a.situation.evidence_count || 0), 0);
    const escCount = sits.filter(a => a.reasoning.trend === "escalating").length;

    // System convergence avg
    const avgConvergence = sits.length > 0
        ? sits.reduce((s, a) => s + (isNaN(a.langgraph.convergence_score) ? 0 : a.langgraph.convergence_score), 0) / sits.length
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0, overflow: "auto" }}>

            {/* KPI Cards Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", flexShrink: 0 }}>
                <MetricCard label="Active Situations" value={String(sits.length)} delta={escCount > 0 ? `↑${escCount} escalating` : undefined} spark={evidenceSpark} color="var(--blue-text)" />
                <MetricCard label="Total Evidence" value={String(totalEvidence)} spark={evidenceSpark} color="var(--purple-text)" />
                <MetricCard label="Avg Confidence" value={`${Math.round(avgConf * 100)}%`} spark={confSpark} color="var(--green-text)" />
                <MetricCard label="Avg Anomaly" value={`${Math.round(avgAnomaly * 100)}%`} spark={anomalySpark} color={avgAnomaly > 0.6 ? "var(--red-text)" : "var(--amber-text)"} />
            </div>

            {/* Charts Row 1: Donuts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", flexShrink: 0 }}>
                <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    style={{ padding: "18px" }}>
                    <span className="label" style={{ marginBottom: "12px", display: "block" }}>Signal Distribution</span>
                    {signalDistribution.length > 0
                        ? <DonutChart data={signalDistribution} centerValue={String(sits.length)} centerLabel="Situations" />
                        : <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: "0.72rem" }}>No data</div>}
                </motion.div>

                <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    style={{ padding: "18px" }}>
                    <span className="label" style={{ marginBottom: "12px", display: "block" }}>Threat Levels</span>
                    {threatDistribution.length > 0
                        ? <DonutChart data={threatDistribution} size={150} thickness={24} centerValue={`${Math.round(avgAnomaly * 100)}%`} centerLabel="Avg Risk" />
                        : <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: "0.72rem" }}>No data</div>}
                </motion.div>

                <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{ padding: "18px" }}>
                    <span className="label" style={{ marginBottom: "12px", display: "block" }}>Trend Analysis</span>
                    {trendDistribution.length > 0
                        ? <DonutChart data={trendDistribution} size={150} thickness={24} centerValue={String(escCount)} centerLabel="Escalating" />
                        : <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: "0.72rem" }}>No data</div>}
                </motion.div>
            </div>

            {/* Charts Row 2: Area + Gauge */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "10px", flexShrink: 0 }}>
                <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    style={{ padding: "18px" }}>
                    <span className="label" style={{ marginBottom: "10px", display: "block" }}>Confidence Trend</span>
                    {confidenceTrend.length >= 2
                        ? <AreaChart data={confidenceTrend} labels={confidenceLabels} width={420} height={150} gradientId="conf-grad" />
                        : <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: "0.72rem" }}>Needs 2+ data points</div>}
                </motion.div>

                <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    style={{ padding: "18px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span className="label" style={{ marginBottom: "10px" }}>System Convergence</span>
                    <GaugeChart value={avgConvergence} label="Average convergence across all situations"
                        color={avgConvergence > 0.6 ? "#10b981" : avgConvergence > 0.3 ? "#f59e0b" : "#ef4444"} />
                </motion.div>
            </div>

            {/* Charts Row 3: Bar charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", flexShrink: 0 }}>
                <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    style={{ padding: "18px" }}>
                    <span className="label" style={{ marginBottom: "10px", display: "block" }}>Evidence by Situation</span>
                    {evidenceBars.length > 0
                        ? <BarChart data={evidenceBars} />
                        : <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "0.72rem" }}>No data</div>}
                </motion.div>

                <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    style={{ padding: "18px" }}>
                    <span className="label" style={{ marginBottom: "10px", display: "block" }}>Anomaly Score (%)</span>
                    {anomalyBars.length > 0
                        ? <BarChart data={anomalyBars} maxValue={100} />
                        : <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "0.72rem" }}>No data</div>}
                </motion.div>
            </div>
        </motion.div>
    );
}
