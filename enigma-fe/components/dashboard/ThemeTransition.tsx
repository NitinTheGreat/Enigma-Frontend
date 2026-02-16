"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Circular ripple overlay that expands from the toggle button
 * when switching themes.
 */
export default function ThemeTransition() {
    const { ripple, theme } = useTheme();

    // The ripple color is the INCOMING theme background
    const rippleColor = theme === "dark" ? "#1a1a1a" : "#f7f8fa";
    const maxDim = typeof window !== "undefined"
        ? Math.max(window.innerWidth, window.innerHeight)
        : 1920;
    const radius = maxDim * 1.5;

    return (
        <AnimatePresence>
            {ripple.active && (
                <motion.div
                    key="theme-ripple"
                    initial={{
                        clipPath: `circle(0px at ${ripple.x}px ${ripple.y}px)`,
                        opacity: 1,
                    }}
                    animate={{
                        clipPath: `circle(${radius}px at ${ripple.x}px ${ripple.y}px)`,
                        opacity: 1,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                        clipPath: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
                        opacity: { duration: 0.3, delay: 0.4 },
                    }}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: rippleColor,
                        pointerEvents: "none",
                    }}
                />
            )}
        </AnimatePresence>
    );
}
