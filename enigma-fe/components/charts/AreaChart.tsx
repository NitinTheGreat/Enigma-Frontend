"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface Point { x: number; y: number; }
interface Props {
    data: number[];
    labels?: string[];
    width?: number;
    height?: number;
    color?: string;
    gradientId?: string;
    showDots?: boolean;
    showLabels?: boolean;
    animate?: boolean;
}

function smooth(pts: Point[]): string {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
}

export default function AreaChart({
    data, labels, width = 320, height = 140, color = "var(--blue)",
    gradientId = "area-grad", showDots = true, showLabels = true, animate = true,
}: Props) {
    const padX = showLabels ? 28 : 8;
    const padTop = 8;
    const padBottom = showLabels ? 22 : 8;
    const chartW = width - padX * 2;
    const chartH = height - padTop - padBottom;

    const { pts, linePath, areaPath, minVal, maxVal } = useMemo(() => {
        if (data.length === 0) return { pts: [], linePath: "", areaPath: "", minVal: 0, maxVal: 1 };
        const mn = Math.min(...data);
        const mx = Math.max(...data);
        const range = mx - mn || 1;
        const points: Point[] = data.map((v, i) => ({
            x: padX + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2),
            y: padTop + chartH - ((v - mn) / range) * chartH,
        }));
        const lp = smooth(points);
        const last = points[points.length - 1];
        const first = points[0];
        const ap = lp + ` L ${last.x} ${padTop + chartH} L ${first.x} ${padTop + chartH} Z`;
        return { pts: points, linePath: lp, areaPath: ap, minVal: mn, maxVal: mx };
    }, [data, chartW, chartH, padX, padTop]);

    if (data.length === 0) {
        return (
            <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.72rem" }}>
                No data
            </div>
        );
    }

    return (
        <svg width={width} height={height} style={{ overflow: "visible" }}>
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                const y = padTop + chartH - pct * chartH;
                return (
                    <line key={pct} x1={padX} y1={y} x2={width - padX} y2={y}
                        stroke="var(--border-light)" strokeWidth={0.5} strokeDasharray="3 3" />
                );
            })}

            {/* Area fill */}
            <motion.path d={areaPath} fill={`url(#${gradientId})`}
                initial={animate ? { opacity: 0 } : undefined}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            />

            {/* Line */}
            <motion.path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"
                initial={animate ? { pathLength: 0 } : undefined}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut" as const, delay: 0.2 }}
            />

            {/* Dots */}
            {showDots && pts.map((p, i) => (
                <motion.circle key={i} cx={p.x} cy={p.y} r={3} fill={color} stroke="var(--bg-card)" strokeWidth={2}
                    initial={animate ? { scale: 0 } : undefined}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 300, damping: 15 }}
                />
            ))}

            {/* X labels */}
            {showLabels && labels && labels.map((l, i) => {
                const x = padX + (labels.length > 1 ? (i / (labels.length - 1)) * chartW : chartW / 2);
                return (
                    <text key={i} x={x} y={height - 4} textAnchor="middle"
                        style={{ fontSize: "0.5rem", fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {l}
                    </text>
                );
            })}

            {/* Y min/max */}
            {showLabels && (
                <>
                    <text x={padX - 4} y={padTop + 4} textAnchor="end"
                        style={{ fontSize: "0.46rem", fill: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                        {maxVal.toFixed(maxVal < 10 ? 1 : 0)}
                    </text>
                    <text x={padX - 4} y={padTop + chartH} textAnchor="end"
                        style={{ fontSize: "0.46rem", fill: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                        {minVal.toFixed(minVal < 10 ? 1 : 0)}
                    </text>
                </>
            )}
        </svg>
    );
}
