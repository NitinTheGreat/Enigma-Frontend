"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type {
    ConnectionState,
    ReasoningData,
    SituationAnalysis,
    SituationSummary,
} from "@/types/dashboard";

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
    /** Situation IDs seeded from the REST snapshot and not yet analysed live. */
    awaitingAnalysis: Set<string>;
}

/* The dashboard socket only pushes a situation when that situation is updated,
   so a browser opening mid-stream would otherwise see nothing until the next
   push and would never see a situation that has gone quiet. Seeding from the
   REST snapshot fixes that.

   A snapshot row carries the situation summary but no reasoning, hypotheses or
   explanation, because those are produced per analysis rather than stored. The
   placeholder below is explicit about that: zeroed reasoning and an undecided
   explanation, with the id recorded in awaitingAnalysis so the interface can
   mark it as not yet analysed rather than implying a real assessment of zero. */
function placeholderAnalysis(summary: SituationSummary): SituationAnalysis {
    const reasoning: ReasoningData = {
        situation_id: summary.situation_id,
        evidence_count: summary.evidence_count,
        event_rate: 0,
        burst_detected: false,
        quiet_detected: false,
        confidence_level: 0,
        trend: "stable",
        source_diversity: summary.sources?.length ?? 0,
        mean_anomaly_score: summary.mean_anomaly ?? 0,
        abstained_evidence_count: summary.abstained_evidence_count ?? 0,
        abstained_fraction: summary.evidence_count
            ? (summary.abstained_evidence_count ?? 0) / summary.evidence_count
            : 0,
    };

    return {
        type: "situation_analysis",
        situation: summary,
        temporal: {
            situation_id: summary.situation_id,
            event_count: summary.evidence_count,
            active_duration_seconds: 0,
            event_rate_per_minute: 0,
            last_event_age_seconds: 0,
            mean_interval_seconds: null,
            burst_detected: false,
            quiet_detected: false,
        },
        reasoning,
        langgraph: {
            hypotheses: [],
            convergence_score: 0,
            iterations: 0,
            belief_stability: 0,
            undecided_iterations: 0,
        },
        explanation: {
            undecided: true,
            dominant_hypothesis_id: null,
            dominant_confidence: 0,
            convergence_score: 0,
            sections: [],
            temporal_evolution: null,
        },
        human_readable: "Not yet analysed. Awaiting the next update for this situation.",
    };
}

export function useDashboardWS() {
    const [state, setState] = useState<DashboardWSState>({
        connectionState: "disconnected",
        situations: new Map(),
        feed: [],
        recentlyUpdated: new Set(),
        awaitingAnalysis: new Set(),
    });

    const wsRef = useRef<WebSocket | null>(null);
    const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttemptRef = useRef(0);
    const mountedRef = useRef(true);
    const feedSeqRef = useRef(0);

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

        /* React runs effects twice in development strict mode, and the
           reconnect timer can also fire while a socket is already opening.
           Without this guard each pass opened another socket: the cleanup
           closed only the newest, the rest leaked and kept receiving, and every
           aborted handshake raised onerror, which scheduled yet another
           reconnect. Five sockets for one dashboard was the observed result. */
        const existing = wsRef.current;
        if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
            return;
        }

        try {
            const ws = new WebSocket(getWsUrl());
            wsRef.current = ws;

            ws.onopen = () => {
                if (!mountedRef.current || wsRef.current !== ws) return;
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
                if (!mountedRef.current || wsRef.current !== ws) return;

                const raw = event.data;
                if (raw === "pong") return;

                try {
                    const parsed = JSON.parse(raw) as SituationAnalysis;
                    if (parsed.type !== "situation_analysis") return;

                    feedSeqRef.current += 1;
                    const data: SituationAnalysis = { ...parsed, feed_seq: feedSeqRef.current };
                    const sitId = data.situation.situation_id;

                    setState((prev) => {
                        const newSituations = new Map(prev.situations);
                        newSituations.set(sitId, data);

                        const newFeed = [data, ...prev.feed].slice(0, MAX_FEED_SIZE);

                        const newRecent = new Set(prev.recentlyUpdated);
                        newRecent.add(sitId);

                        const stillAwaiting = new Set(prev.awaitingAnalysis);
                        stillAwaiting.delete(sitId);

                        return {
                            ...prev,
                            situations: newSituations,
                            feed: newFeed,
                            recentlyUpdated: newRecent,
                            awaitingAnalysis: stillAwaiting,
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
                if (wsRef.current === ws) wsRef.current = null;
                if (!mountedRef.current) return;
                console.log("[WS] Disconnected");
                clearTimers();
                setState((prev) => ({ ...prev, connectionState: "reconnecting" }));
                scheduleReconnect();
            };

            /* Closing here would be redundant. The browser always follows an
               error with a close event, and calling close on a socket that
               never finished its handshake is what produced the aborted
               connections above. */
            ws.onerror = () => {
                if (wsRef.current !== ws) return;
                console.warn("[WS] Socket error, waiting for close");
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

    const seedFromSnapshot = useCallback(async () => {
        try {
            const response = await fetch("/api/situations", { cache: "no-store" });
            if (!response.ok) return;
            const payload = (await response.json()) as { situations?: SituationSummary[] };
            const snapshot = payload.situations ?? [];
            if (!mountedRef.current || snapshot.length === 0) return;

            setState((prev) => {
                const merged = new Map(prev.situations);
                const awaiting = new Set(prev.awaitingAnalysis);

                for (const summary of snapshot) {
                    if (merged.has(summary.situation_id)) continue;
                    merged.set(summary.situation_id, placeholderAnalysis(summary));
                    awaiting.add(summary.situation_id);
                }

                return { ...prev, situations: merged, awaitingAnalysis: awaiting };
            });
        } catch {
            // The snapshot is an optimisation. A failure here leaves the socket
            // as the only source, which is the previous behaviour.
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        connect();
        void seedFromSnapshot();

        return () => {
            mountedRef.current = false;
            clearTimers();
            const socket = wsRef.current;
            wsRef.current = null;
            if (socket) {
                /* Detach before closing. A socket torn down mid handshake fires
                   onerror and then onclose, and a still attached onclose would
                   schedule a reconnect on behalf of a component that is going
                   away, which is how one mount ended up owning five sockets. */
                socket.onopen = null;
                socket.onmessage = null;
                socket.onclose = null;
                socket.onerror = null;
                socket.close();
            }
        };
    }, [connect, clearTimers, seedFromSnapshot]);

    return {
        connectionState: state.connectionState,
        situations: state.situations,
        feed: state.feed,
        recentlyUpdated: state.recentlyUpdated,
        awaitingAnalysis: state.awaitingAnalysis,
        isConnected: state.connectionState === "connected",
        refreshSnapshot: seedFromSnapshot,
    };
}
