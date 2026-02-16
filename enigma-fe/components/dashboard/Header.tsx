"use client";

import type { ConnectionState } from "@/types/dashboard";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    connectionState: ConnectionState;
    onMenuToggle?: () => void;
}

const STATUS: Record<ConnectionState, { color: string; bg: string; label: string }> = {
    connected: { color: "var(--green-text)", bg: "var(--green-dim)", label: "Live" },
    disconnected: { color: "var(--red-text)", bg: "var(--red-dim)", label: "Offline" },
    reconnecting: { color: "var(--amber-text)", bg: "var(--amber-dim)", label: "Reconnecting" },
};

export default function Header({ connectionState, onMenuToggle }: Props) {
    const { theme, toggle } = useTheme();
    const s = STATUS[connectionState];

    return (
        <motion.header
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 20px", height: "48px",
                background: "var(--bg-card)", borderBottom: "1px solid var(--border)",
                flexShrink: 0,
            }}
        >
            {/* Left: Hamburger + Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Hamburger — hidden on desktop via CSS class */}
                <button className="hamburger-btn" onClick={onMenuToggle} aria-label="Toggle menu">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>

                <span style={{
                    fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.1em",
                    fontFamily: "var(--font-mono)", color: "var(--text-primary)",
                }}>ENIGMA</span>
                <span className="header-subtitle" style={{ width: "1px", height: "16px", background: "var(--border)" }} />
                <span className="header-subtitle" style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 400 }}>
                    Threat Intelligence
                </span>
            </div>

            {/* Right */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="mono header-date" style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                    {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>

                {/* Theme toggle with animated icon */}
                <motion.button
                    onClick={(e) => toggle(e)}
                    className="theme-toggle"
                    title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.85, rotate: -15 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                    <AnimatePresence mode="wait">
                        {theme === "dark" ? (
                            <motion.svg
                                key="sun"
                                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.3 }}
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
                            >
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </motion.svg>
                        ) : (
                            <motion.svg
                                key="moon"
                                initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.3 }}
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
                            >
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </motion.svg>
                        )}
                    </AnimatePresence>
                </motion.button>

                {/* Status pill */}
                <motion.div
                    layout
                    style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "3px 10px", borderRadius: "999px",
                        background: s.bg, border: "1px solid var(--border)",
                    }}
                >
                    <motion.div
                        animate={connectionState === "connected"
                            ? { opacity: [1, 0.3, 1] }
                            : connectionState === "reconnecting"
                                ? { scale: [1, 1.3, 1] }
                                : {}
                        }
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color }}
                    />
                    <span style={{ fontSize: "0.65rem", fontWeight: 600, color: s.color }}>{s.label}</span>
                </motion.div>
            </div>
        </motion.header>
    );
}
