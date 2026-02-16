"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

interface Slice {
    label: string;
    value: number;
    color: string;
}

interface Props {
    data: Slice[];
    size?: number;
    thickness?: number;
    centerLabel?: string;
    centerValue?: string;
}

export default function DonutChart({ data, size = 180, thickness = 28, centerLabel, centerValue }: Props) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

    const slices = useMemo(() => {
        const r = (size - thickness) / 2;
        const circumference = 2 * Math.PI * r;
        let offset = 0;
        return data.map(d => {
            const pct = total > 0 ? d.value / total : 0;
            const len = pct * circumference;
            const gap = data.length > 1 ? 3 : 0;
            // mid-angle for tooltip position
            const midOffset = offset + len / 2;
            const midAngle = (midOffset / circumference) * 360 - 90;
            const midRad = (midAngle * Math.PI) / 180;
            const slice = {
                ...d, pct, dashArray: `${Math.max(0, len - gap)} ${circumference}`,
                dashOffset: -offset, r, circumference,
                tipX: size / 2 + Math.cos(midRad) * r,
                tipY: size / 2 + Math.sin(midRad) * r,
            };
            offset += len;
            return slice;
        });
    }, [data, size, thickness, total]);

    const cx = size / 2;
    const cy = size / 2;

    // If a slice is hovered, show its info in center
    const displayValue = hoveredIdx !== null ? `${Math.round(slices[hoveredIdx].pct * 100)}%` : centerValue;
    const displayLabel = hoveredIdx !== null ? slices[hoveredIdx].label : centerLabel;

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)", cursor: "pointer" }}>
                    {/* Track */}
                    <circle cx={cx} cy={cy} r={slices[0]?.r ?? (size - thickness) / 2}
                        fill="none" stroke="var(--bg-muted)" strokeWidth={thickness} />

                    {/* Slices */}
                    {slices.map((s, i) => (
                        <motion.circle
                            key={s.label}
                            cx={cx} cy={cy} r={s.r}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={hoveredIdx === i ? thickness + 6 : thickness}
                            strokeLinecap="round"
                            strokeDasharray={s.dashArray}
                            initial={{ strokeDashoffset: -(s.dashOffset + s.pct * s.circumference) }}
                            animate={{
                                strokeDashoffset: s.dashOffset,
                                strokeWidth: hoveredIdx === i ? thickness + 6 : thickness,
                                opacity: hoveredIdx !== null && hoveredIdx !== i ? 0.4 : 1,
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.1 + i * 0.06 }}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            style={{ filter: hoveredIdx === i ? `drop-shadow(0 0 6px ${s.color})` : "none", transition: "filter 0.2s" }}
                        />
                    ))}

                    {/* Center label */}
                    <g style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>
                        <motion.text
                            key={displayValue}
                            x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                                fontSize: hoveredIdx !== null ? "1.6rem" : "1.4rem",
                                fontWeight: 700,
                                fill: hoveredIdx !== null ? slices[hoveredIdx].color : "var(--text-primary)",
                                fontFamily: "var(--font-mono)",
                                transition: "fill 0.2s, font-size 0.2s",
                            }}>
                            {displayValue}
                        </motion.text>
                        <motion.text
                            key={displayLabel}
                            x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="middle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                fontSize: "0.48rem", fontWeight: 500,
                                fill: "var(--text-muted)", textTransform: "uppercase",
                                letterSpacing: "0.08em",
                            }}>
                            {displayLabel}
                        </motion.text>
                    </g>
                </svg>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                {data.map((d, i) => {
                    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                    const isActive = hoveredIdx === i;
                    return (
                        <motion.div key={d.label}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: hoveredIdx !== null && !isActive ? 0.45 : 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.04 }}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                cursor: "pointer", padding: "2px 4px", borderRadius: "4px",
                                background: isActive ? "var(--bg-hover)" : "transparent",
                                transition: "background 0.15s",
                            }}>
                            <div style={{
                                width: "8px", height: "8px", borderRadius: "2px",
                                background: d.color, flexShrink: 0,
                                boxShadow: isActive ? `0 0 6px ${d.color}` : "none",
                                transition: "box-shadow 0.2s",
                            }} />
                            <span style={{
                                fontSize: "0.65rem", color: "var(--text-secondary)",
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                fontWeight: isActive ? 600 : 400,
                            }}>
                                {d.label}
                            </span>
                            <span className="mono" style={{
                                fontSize: "0.58rem", fontWeight: 600,
                                color: isActive ? d.color : "var(--text-primary)",
                                marginLeft: "auto",
                                transition: "color 0.2s",
                            }}>
                                {d.value}
                                <span style={{ fontSize: "0.46rem", color: "var(--text-muted)", marginLeft: "3px" }}>
                                    ({pct}%)
                                </span>
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
