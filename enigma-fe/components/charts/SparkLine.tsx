"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface Props {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    showEndDot?: boolean;
}

export default function SparkLine({ data, width = 56, height = 20, color = "var(--blue)", showEndDot = true }: Props) {
    const path = useMemo(() => {
        if (data.length < 2) return "";
        const mn = Math.min(...data);
        const mx = Math.max(...data);
        const range = mx - mn || 1;
        const pad = 3;
        const w = width - pad * 2;
        const h = height - pad * 2;
        const pts = data.map((v, i) => ({
            x: pad + (i / (data.length - 1)) * w,
            y: pad + h - ((v - mn) / range) * h,
        }));

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
    }, [data, width, height]);

    if (data.length < 2) return null;

    const mn = Math.min(...data);
    const mx = Math.max(...data);
    const range = mx - mn || 1;
    const lastY = 3 + (height - 6) - ((data[data.length - 1] - mn) / range) * (height - 6);
    const lastX = width - 3;

    return (
        <svg width={width} height={height} style={{ overflow: "visible" }}>
            <motion.path
                d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" as const }}
            />
            {showEndDot && (
                <motion.circle cx={lastX} cy={lastY} r={2.5} fill={color}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                />
            )}
        </svg>
    );
}
