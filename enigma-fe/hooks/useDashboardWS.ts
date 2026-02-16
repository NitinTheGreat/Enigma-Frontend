"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { SituationAnalysis, ConnectionState } from "@/types/dashboard";

const RAW_WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://13.233.93.2:8000/ws/dashboard";

function getWsUrl(): string {
    let url = RAW_WS_URL;
    // Auto-upgrade to wss:// when page is served over HTTPS
    if (typeof window !== "undefined" && window.location.protocol === "https:") {
        url = url.replace(/^ws:\/\//i, "wss://");
    }
    return url;
}
const PING_INTERVAL = 30_000;
const MAX_RECONNECT_DELAY = 30_000;
const MAX_FEED_SIZE = 200;

interface DashboardWSState {
    connectionState: ConnectionState;
    situations: Map<string, SituationAnalysis>;
    feed: SituationAnalysis[];
    /** Set of situation IDs that just received new data (for pulse animation) */
    recentlyUpdated: Set<string>;
}

export function useDashboardWS() {
    const [state, setState] = useState<DashboardWSState>({
        connectionState: "disconnected",
        situations: new Map(),
        feed: [],
        recentlyUpdated: new Set(),
    });

    const wsRef = useRef<WebSocket | null>(null);
    const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttemptRef = useRef(0);
    const mountedRef = useRef(true);

    const clearTimers = useCallback(() => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    const connect = useCallback(() => {
        if (!mountedRef.current) return;

        try {
            const ws = new WebSocket(getWsUrl());
            wsRef.current = ws;

            ws.onopen = () => {
                if (!mountedRef.current) return;
                console.log("[WS] Connected to dashboard");
                reconnectAttemptRef.current = 0;
                setState((prev) => ({ ...prev, connectionState: "connected" }));

                // Start keepalive
                pingIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send("ping");
                    }
                }, PING_INTERVAL);
            };

            ws.onmessage = (event) => {
                if (!mountedRef.current) return;

                const raw = event.data;
                if (raw === "pong") return;

                try {
                    const data = JSON.parse(raw) as SituationAnalysis;
                    if (data.type !== "situation_analysis") return;

                    const sitId = data.situation.situation_id;

                    setState((prev) => {
                        const newSituations = new Map(prev.situations);
                        newSituations.set(sitId, data);

                        const newFeed = [data, ...prev.feed].slice(0, MAX_FEED_SIZE);

                        const newRecent = new Set(prev.recentlyUpdated);
                        newRecent.add(sitId);

                        return {
                            ...prev,
                            situations: newSituations,
                            feed: newFeed,
                            recentlyUpdated: newRecent,
                        };
                    });

                    // Clear the "recently updated" flag after 2 seconds
                    setTimeout(() => {
                        if (!mountedRef.current) return;
                        setState((prev) => {
                            const newRecent = new Set(prev.recentlyUpdated);
                            newRecent.delete(sitId);
                            return { ...prev, recentlyUpdated: newRecent };
                        });
                    }, 2000);
                } catch {
                    // Not JSON or wrong structure — ignore
                }
            };

            ws.onclose = () => {
                if (!mountedRef.current) return;
                console.log("[WS] Disconnected");
                clearTimers();
                setState((prev) => ({ ...prev, connectionState: "reconnecting" }));
                scheduleReconnect();
            };

            ws.onerror = (err) => {
                console.error("[WS] Error:", err);
                ws.close();
            };
        } catch (err) {
            console.error("[WS] Connection failed:", err);
            setState((prev) => ({ ...prev, connectionState: "reconnecting" }));
            scheduleReconnect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const scheduleReconnect = useCallback(() => {
        if (!mountedRef.current) return;

        const attempt = reconnectAttemptRef.current;
        const delay = Math.min(1000 * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${attempt + 1})`);

        reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current += 1;
            connect();
        }, delay);
    }, [connect]);

    useEffect(() => {
        mountedRef.current = true;
        connect();

        return () => {
            mountedRef.current = false;
            clearTimers();
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connect, clearTimers]);

    return {
        connectionState: state.connectionState,
        situations: state.situations,
        feed: state.feed,
        recentlyUpdated: state.recentlyUpdated,
        isConnected: state.connectionState === "connected",
    };
}
