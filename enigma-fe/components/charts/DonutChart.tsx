"use client";

import { useMemo } from "react";
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
    const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

    const slices = useMemo(() => {
        const r = (size - thickness) / 2;
        const circumference = 2 * Math.PI * r;
        let offset = 0;
        return data.map(d => {
            const pct = total > 0 ? d.value / total : 0;
            const len = pct * circumference;
            const gap = data.length > 1 ? 3 : 0;
            const slice = { ...d, pct, dashArray: `${Math.max(0, len - gap)} ${circumference}`, dashOffset: -offset, r, circumference };
            offset += len;
            return slice;
        });
    }, [data, size, thickness, total]);

    const cx = size / 2;
    const cy = size / 2;

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
                {/* Track */}
                <circle cx={cx} cy={cy} r={slices[0]?.r ?? (size - thickness) / 2} fill="none" stroke="var(--bg-muted)" strokeWidth={thickness} />

                {/* Slices */}
                {slices.map((s, i) => (
                    <motion.circle
                        key={s.label}
                        cx={cx} cy={cy} r={s.r}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={thickness}
                        strokeLinecap="round"
                        strokeDasharray={s.dashArray}
                        initial={{ strokeDashoffset: -(s.dashOffset + s.pct * s.circumference) }}
                        animate={{ strokeDashoffset: s.dashOffset }}
                        transition={{ duration: 0.8, ease: "easeOut" as const, delay: 0.1 + i * 0.08 }}
                    />
                ))}

                {/* Center label */}
                {(centerLabel || centerValue) && (
                    <g style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>
                        {centerValue && (
                            <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
                                style={{ fontSize: "1.4rem", fontWeight: 700, fill: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                                {centerValue}
                            </text>
                        )}
                        {centerLabel && (
                            <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
                                style={{ fontSize: "0.52rem", fontWeight: 500, fill: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                {centerLabel}
                            </text>
                        )}
                    </g>
                )}
            </svg>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", minWidth: 0 }}>
                {data.map((d, i) => (
                    <motion.div key={d.label}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.06 }}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {d.label}
                        </span>
                        <span className="mono" style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-primary)", marginLeft: "auto" }}>
                            {d.value}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
