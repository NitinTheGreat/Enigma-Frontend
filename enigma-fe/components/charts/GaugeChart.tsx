"use client";

import { motion } from "framer-motion";

interface Props {
    value: number;   // 0-1
    size?: number;
    label?: string;
    color?: string;
    valueLabel?: string;
}

export default function GaugeChart({ value, size = 160, label, color = "var(--blue)", valueLabel }: Props) {
    const v = isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
    const thickness = size * 0.12;
    const r = (size - thickness) / 2;
    const cx = size / 2;
    const cy = size / 2 + size * 0.08;

    // Semi-circle: 180 degrees
    const totalArc = Math.PI * r;
    const filled = v * totalArc;

    // Needle
    const needleLen = r - 8;
    const angle = -180 + v * 180; // -180 = left, 0 = right
    const needleRad = (angle * Math.PI) / 180;
    const nx = cx + Math.cos(needleRad) * needleLen;
    const ny = cy + Math.sin(needleRad) * needleLen;

    // Tick marks
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => {
        const a = -180 + t * 180;
        const rad = (a * Math.PI) / 180;
        const outerR = r + thickness / 2 + 3;
        const innerR = r + thickness / 2 - 2;
        return {
            x1: cx + Math.cos(rad) * innerR,
            y1: cy + Math.sin(rad) * innerR,
            x2: cx + Math.cos(rad) * outerR,
            y2: cy + Math.sin(rad) * outerR,
            label: `${Math.round(t * 100)}`,
            lx: cx + Math.cos(rad) * (outerR + 9),
            ly: cy + Math.sin(rad) * (outerR + 9),
        };
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <svg width={size} height={size * 0.62} style={{ overflow: "visible" }}>
                {/* Track */}
                <path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke="var(--bg-muted)" strokeWidth={thickness} strokeLinecap="round"
                />

                {/* Filled arc */}
                <motion.path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round"
                    strokeDasharray={`${totalArc} ${totalArc}`}
                    initial={{ strokeDashoffset: totalArc }}
                    animate={{ strokeDashoffset: totalArc - filled }}
                    transition={{ duration: 1, ease: "easeOut" as const, delay: 0.2 }}
                />

                {/* Tick marks */}
                {ticks.map((t, i) => (
                    <g key={i}>
                        <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--text-dim)" strokeWidth={1} />
                        <text x={t.lx} y={t.ly} textAnchor="middle" dominantBaseline="middle"
                            style={{ fontSize: "0.42rem", fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            {t.label}
                        </text>
                    </g>
                ))}

                {/* Needle */}
                <motion.line
                    x1={cx} y1={cy} x2={nx} y2={ny}
                    stroke="var(--text-primary)" strokeWidth={2} strokeLinecap="round"
                    initial={{ x2: cx - needleLen, y2: cy }}
                    animate={{ x2: nx, y2: ny }}
                    transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.5 }}
                />
                <circle cx={cx} cy={cy} r={4} fill="var(--text-primary)" />

                {/* Center value */}
                <text x={cx} y={cy + 22} textAnchor="middle"
                    style={{ fontSize: "1.2rem", fontWeight: 700, fill: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                    {valueLabel ?? `${Math.round(v * 100)}%`}
                </text>
            </svg>
            {label && (
                <div className="label" style={{ marginTop: "2px", fontSize: "0.5rem" }}>{label}</div>
            )}
        </div>
    );
}
