"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

type Theme = "light" | "dark";
interface ThemeCtx {
    theme: Theme;
    toggle: (e?: React.MouseEvent) => void;
    ripple: { x: number; y: number; active: boolean };
}

const ThemeContext = createContext<ThemeCtx>({
    theme: "light",
    toggle: () => { },
    ripple: { x: 0, y: 0, active: false },
});

export function useTheme() { return useContext(ThemeContext); }

function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);
    const [ripple, setRipple] = useState({ x: 0, y: 0, active: false });
    const rippleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Init
    useEffect(() => {
        const stored = localStorage.getItem("enigma-theme") as Theme | null;
        const initial = stored === "dark" || stored === "light"
            ? stored
            : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setTheme(initial);
        applyTheme(initial);
        setMounted(true);
    }, []);

    // Sync class
    useEffect(() => {
        if (!mounted) return;
        applyTheme(theme);
        localStorage.setItem("enigma-theme", theme);
    }, [theme, mounted]);

    const toggle = useCallback((e?: React.MouseEvent) => {
        // Get click position for ripple
        let x = window.innerWidth / 2;
        let y = 48 / 2;
        if (e) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            x = rect.left + rect.width / 2;
            y = rect.top + rect.height / 2;
        }

        // Start ripple
        setRipple({ x, y, active: true });

        // Clear previous timeout
        if (rippleTimeout.current) clearTimeout(rippleTimeout.current);

        // Change theme after small delay for ripple to start
        setTimeout(() => {
            setTheme(prev => prev === "dark" ? "light" : "dark");
        }, 50);

        // End ripple after animation completes
        rippleTimeout.current = setTimeout(() => {
            setRipple(prev => ({ ...prev, active: false }));
        }, 800);
    }, []);

    if (!mounted) {
        return <div style={{ visibility: "hidden" }}>{children}</div>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggle, ripple }}>
            {children}
        </ThemeContext.Provider>
    );
}
