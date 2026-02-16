"use client";

import { motion } from "framer-motion";

interface Bar {
    label: string;
    value: number;
    color?: string;
}

interface Props {
    data: Bar[];
    maxValue?: number;
    height?: number;
    barHeight?: number;
    showValues?: boolean;
}

export default function BarChart({ data, maxValue, height, barHeight = 18, showValues = true }: Props) {
    const mx = maxValue ?? Math.max(...data.map(d => d.value), 1);
    const computedHeight = height ?? data.length * (barHeight + 8) + 4;

    return (
        <div style={{ width: "100%", height: computedHeight, display: "flex", flexDirection: "column", gap: "4px", justifyContent: "center" }}>
            {data.map((d, i) => {
                const pct = mx > 0 ? (d.value / mx) * 100 : 0;
                const color = d.color || "var(--blue)";
                return (
                    <motion.div key={d.label}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.3 }}
                        style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                            fontSize: "0.6rem", color: "var(--text-secondary)",
                            minWidth: "55px", textAlign: "right", overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }} title={d.label}>{d.label}</span>
                        <div style={{
                            flex: 1, height: barHeight, borderRadius: "4px",
                            background: "var(--bg-muted)", overflow: "hidden", position: "relative",
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.7, ease: "easeOut" as const, delay: 0.15 + i * 0.06 }}
                                style={{
                                    height: "100%", borderRadius: "4px",
                                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                                }}
                            />
                        </div>
                        {showValues && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + i * 0.06 }}
                                className="mono"
                                style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-primary)", minWidth: "24px" }}>
                                {d.value}
                            </motion.span>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
