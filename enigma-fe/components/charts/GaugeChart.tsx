"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
    value: number;   // 0-1
    size?: number;
    label?: string;
    color?: string;
    valueLabel?: string;
}

export default function GaugeChart({ value, size = 180, label, color, valueLabel }: Props) {
    const v = isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
    const [displayVal, setDisplayVal] = useState(0);

    // Animated counter
    useEffect(() => {
        const target = Math.round(v * 100);
        const dur = 1000;
        const start = performance.now();
        const initial = displayVal;
        const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / dur, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setDisplayVal(Math.round(initial + (target - initial) * eased));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [v]);

    const thickness = size * 0.11;
    const r = (size - thickness * 2) / 2;
    const cx = size / 2;
    const cy = size / 2 + size * 0.06;

    const totalArc = Math.PI * r;
    const filled = v * totalArc;

    // Determine color based on value
    const autoColor = color || (v > 0.65 ? "#10b981" : v > 0.35 ? "#f59e0b" : "#ef4444");

    // Needle
    const needleLen = r - 10;
    const angle = -180 + v * 180;
    const needleRad = (angle * Math.PI) / 180;
    const nx = cx + Math.cos(needleRad) * needleLen;
    const ny = cy + Math.sin(needleRad) * needleLen;

    // Segment arcs (colored zones)
    const segments = [
        { from: 0, to: 0.35, color: "#ef444440" },
        { from: 0.35, to: 0.65, color: "#f59e0b30" },
        { from: 0.65, to: 1.0, color: "#10b98130" },
    ];

    // More tick marks for premium look
    const tickCount = 21;
    const ticks = Array.from({ length: tickCount }, (_, i) => {
        const t = i / (tickCount - 1);
        const a = -180 + t * 180;
        const rad = (a * Math.PI) / 180;
        const isMajor = i % 5 === 0;
        const outerR = r + thickness / 2 + 2;
        const innerR = r + thickness / 2 - (isMajor ? 6 : 3);
        return {
            x1: cx + Math.cos(rad) * innerR,
            y1: cy + Math.sin(rad) * innerR,
            x2: cx + Math.cos(rad) * outerR,
            y2: cy + Math.sin(rad) * outerR,
            isMajor,
            label: isMajor ? `${Math.round(t * 100)}` : null,
            lx: cx + Math.cos(rad) * (outerR + 11),
            ly: cy + Math.sin(rad) * (outerR + 11),
        };
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <svg width={size} height={size * 0.58} style={{ overflow: "visible" }}>
                <defs>
                    <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="35%" stopColor="#f59e0b" />
                        <stop offset="65%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <filter id="gauge-glow">
                        <feGaussianBlur stdDeviation="4" />
                    </filter>
                </defs>

                {/* Colored zones */}
                {segments.map((seg, i) => {
                    const startAngle = -180 + seg.from * 180;
                    const endAngle = -180 + seg.to * 180;
                    const sRad = (startAngle * Math.PI) / 180;
                    const eRad = (endAngle * Math.PI) / 180;
                    const arcR = r + thickness / 2 + 8;
                    return (
                        <path key={i}
                            d={`M ${cx + Math.cos(sRad) * arcR} ${cy + Math.sin(sRad) * arcR} A ${arcR} ${arcR} 0 0 1 ${cx + Math.cos(eRad) * arcR} ${cy + Math.sin(eRad) * arcR}`}
                            fill="none" stroke={seg.color} strokeWidth={14} strokeLinecap="butt"
                        />
                    );
                })}

                {/* Track */}
                <path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke="var(--bg-muted)" strokeWidth={thickness} strokeLinecap="round"
                />

                {/* Glow filled arc */}
                <motion.path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke={autoColor} strokeWidth={thickness + 8} strokeLinecap="round"
                    strokeDasharray={`${totalArc} ${totalArc}`}
                    filter="url(#gauge-glow)"
                    initial={{ strokeDashoffset: totalArc }}
                    animate={{ strokeDashoffset: totalArc - filled }}
                    transition={{ duration: 1.2, ease: "easeOut" as const, delay: 0.2 }}
                    opacity={0.35}
                />

                {/* Filled arc */}
                <motion.path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke="url(#gauge-grad)" strokeWidth={thickness} strokeLinecap="round"
                    strokeDasharray={`${totalArc} ${totalArc}`}
                    initial={{ strokeDashoffset: totalArc }}
                    animate={{ strokeDashoffset: totalArc - filled }}
                    transition={{ duration: 1.2, ease: "easeOut" as const, delay: 0.2 }}
                />

                {/* Tick marks */}
                {ticks.map((t, i) => (
                    <g key={i}>
                        <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                            stroke={t.isMajor ? "var(--text-muted)" : "var(--border)"} strokeWidth={t.isMajor ? 1.5 : 0.5} />
                        {t.label && (
                            <text x={t.lx} y={t.ly} textAnchor="middle" dominantBaseline="middle"
                                style={{ fontSize: "0.4rem", fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                                {t.label}
                            </text>
                        )}
                    </g>
                ))}

                {/* Needle shadow */}
                <motion.line
                    x1={cx} y1={cy + 1} x2={nx} y2={ny + 1}
                    stroke="rgba(0,0,0,0.15)" strokeWidth={3} strokeLinecap="round"
                    initial={{ x2: cx - needleLen, y2: cy + 1 }}
                    animate={{ x2: nx, y2: ny + 1 }}
                    transition={{ type: "spring", stiffness: 50, damping: 12, delay: 0.5 }}
                />
                {/* Needle */}
                <motion.line
                    x1={cx} y1={cy} x2={nx} y2={ny}
                    stroke="var(--text-primary)" strokeWidth={2.5} strokeLinecap="round"
                    initial={{ x2: cx - needleLen, y2: cy }}
                    animate={{ x2: nx, y2: ny }}
                    transition={{ type: "spring", stiffness: 50, damping: 12, delay: 0.5 }}
                />
                {/* Needle hub */}
                <circle cx={cx} cy={cy} r={6} fill="var(--bg-card)" stroke="var(--text-primary)" strokeWidth={2} />
                <circle cx={cx} cy={cy} r={2.5} fill={autoColor} />

                {/* Center value */}
                <text x={cx} y={cy + 24} textAnchor="middle"
                    style={{ fontSize: "1.5rem", fontWeight: 800, fill: autoColor, fontFamily: "var(--font-mono)" }}>
                    {valueLabel ?? `${displayVal}%`}
                </text>
            </svg>
            {label && (
                <div style={{
                    marginTop: "2px", fontSize: "0.5rem", color: "var(--text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center",
                    maxWidth: size, lineHeight: 1.4,
                }}>{label}</div>
            )}
        </div>
    );
}
