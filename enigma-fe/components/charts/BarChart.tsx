"use client";

import { useState } from "react";
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

export default function BarChart({ data, maxValue, height, barHeight = 20, showValues = true }: Props) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const mx = maxValue ?? Math.max(...data.map(d => d.value), 1);
    const computedHeight = height ?? data.length * (barHeight + 10) + 4;

    return (
        <div style={{
            width: "100%", height: computedHeight,
            display: "flex", flexDirection: "column", gap: "5px", justifyContent: "center",
        }}>
            {data.map((d, i) => {
                const pct = mx > 0 ? (d.value / mx) * 100 : 0;
                const color = d.color || "var(--blue)";
                const isHovered = hoveredIdx === i;
                const isDimmed = hoveredIdx !== null && !isHovered;
                return (
                    <motion.div key={d.label}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: isDimmed ? 0.4 : 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            cursor: "pointer", padding: "2px 0",
                            transition: "opacity 0.15s",
                        }}>
                        <span style={{
                            fontSize: "0.58rem", color: isHovered ? color : "var(--text-secondary)",
                            minWidth: "56px", textAlign: "right", overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap",
                            fontWeight: isHovered ? 700 : 400,
                            transition: "color 0.15s, font-weight 0.15s",
                            fontFamily: "var(--font-mono)",
                        }} title={d.label}>{d.label}</span>
                        <div style={{
                            flex: 1, height: isHovered ? barHeight + 4 : barHeight,
                            borderRadius: "6px",
                            background: "var(--bg-muted)", overflow: "hidden", position: "relative",
                            transition: "height 0.15s",
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.7, ease: "easeOut" as const, delay: 0.1 + i * 0.05 }}
                                style={{
                                    height: "100%", borderRadius: "6px",
                                    background: `linear-gradient(90deg, ${color}dd, ${color})`,
                                    boxShadow: isHovered ? `0 0 12px ${color}40, inset 0 1px 0 rgba(255,255,255,0.2)` : "none",
                                    transition: "box-shadow 0.2s",
                                    position: "relative",
                                }}>
                                {/* Shimmer highlight */}
                                <div style={{
                                    position: "absolute", top: 0, left: 0, right: 0,
                                    height: "50%", borderRadius: "6px 6px 0 0",
                                    background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)",
                                }} />
                            </motion.div>
                        </div>
                        {showValues && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.05 }}
                                className="mono"
                                style={{
                                    fontSize: isHovered ? "0.68rem" : "0.6rem",
                                    fontWeight: 700,
                                    color: isHovered ? color : "var(--text-primary)",
                                    minWidth: "30px",
                                    transition: "color 0.15s, font-size 0.15s",
                                }}>
                                {d.value}
                            </motion.span>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
