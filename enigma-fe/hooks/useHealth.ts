"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { HealthData } from "@/types/dashboard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://13.233.93.2:8000";
const POLL_INTERVAL = 30_000;

export function useHealth() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [latencyMs, setLatencyMs] = useState<number | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const mountedRef = useRef(true);

    const fetchHealth = useCallback(async () => {
        try {
            const start = performance.now();
            const res = await fetch(`${API_URL}/health`);
            const elapsed = performance.now() - start;

            if (!mountedRef.current) return;

            if (res.ok) {
                const data: HealthData = await res.json();
                setHealth(data);
                setLatencyMs(Math.round(elapsed));
                setLastUpdate(new Date());
            }
        } catch (err) {
            console.error("[Health] Fetch failed:", err);
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        fetchHealth();

        const interval = setInterval(fetchHealth, POLL_INTERVAL);

        return () => {
            mountedRef.current = false;
            clearInterval(interval);
        };
    }, [fetchHealth]);

    return { health, latencyMs, lastUpdate };
}
