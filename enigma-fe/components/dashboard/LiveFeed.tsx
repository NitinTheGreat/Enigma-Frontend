"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SituationAnalysis } from "@/types/dashboard";
import { motion } from "framer-motion";

interface Props {
    feed: SituationAnalysis[];
    onSelect?: (situationId: string) => void;
    selectedId?: string | null;
}

/* Rows rendered at once. The buffer behind this is larger, so scrolling back
   still reaches older events, but the DOM stays small enough to animate. */
const RENDER_WINDOW = 80;

/* Distance from the top within which the feed is considered to be following
   live. Past that the reader has scrolled into history and auto-scroll would
   yank the list out from under them. */
const FOLLOW_THRESHOLD_PX = 24;

function fmtTime(d: string | undefined | null): string {
    if (!d) return "--:--:--";
    try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return "--:--:--";
        return dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    } catch { return "--:--:--"; }
}

function sevColor(v: number): string {
    if (isNaN(v)) return "var(--text-dim)";
    if (v > 0.8) return "var(--red)";
    if (v > 0.5) return "var(--amber)";
    return "var(--green)";
}

/* Identity of a feed entry. The array index is not stable because new entries
   are prepended, and situation id paired with version is not unique either:
   the backend re-analyses a situation per arriving signal, and overlapping
   analyses report the same version. The hook stamps each arrival with a
   monotonic sequence number, which is the only field that is genuinely one per
   row. The fallback keeps the key defined for snapshot seeded placeholders,
   which never enter the feed. */
function entryKey(entry: SituationAnalysis): string {
    return entry.feed_seq !== undefined
        ? `seq-${entry.feed_seq}`
        : `${entry.situation.situation_id}-${entry.situation.version}`;
}

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const, delay: 0.2 } },
};

export default function LiveFeed({ feed, onSelect, selectedId }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const followingRef = useRef(true);
    const [paused, setPaused] = useState(false);
    const [frozen, setFrozen] = useState<SituationAnalysis[] | null>(null);
    const [following, setFollowing] = useState(true);

    useEffect(() => {
        setFrozen(paused ? feed : null);
        // Snapshotting deliberately reads the feed at the moment of pausing and
        // does not re-run as it grows, which is what makes the list hold still.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paused]);

    const visible = frozen ?? feed;
    const rows = useMemo(() => visible.slice(0, RENDER_WINDOW), [visible]);

    /* How many events arrived since the pause. Comparing lengths cannot answer
       this: the feed is a fixed size ring buffer, so once it saturates its
       length stops changing no matter how much arrives. The arrival sequence of
       the newest entry keeps counting, so the difference between the live head
       and the frozen head is the true backlog. */
    const pending = useMemo(() => {
        if (!frozen) return 0;
        const liveHead = feed[0]?.feed_seq;
        const frozenHead = frozen[0]?.feed_seq;
        if (liveHead === undefined || frozenHead === undefined) return 0;
        return Math.max(0, liveHead - frozenHead);
    }, [frozen, feed]);

    useEffect(() => {
        if (paused || !followingRef.current) return;
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [feed.length, paused]);

    const handleScroll = useCallback(() => {
        const node = scrollRef.current;
        if (!node) return;
        const isFollowing = node.scrollTop <= FOLLOW_THRESHOLD_PX;
        followingRef.current = isFollowing;
        setFollowing(isFollowing);
    }, []);

    const jumpToLatest = useCallback(() => {
        followingRef.current = true;
        setFollowing(true);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, []);

    return (
        <motion.div className="card" variants={cardVariants} initial="hidden" animate="visible"
            style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px 8px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <span className="label">Live Feed</span>
                    <span className="badge badge-gray">{feed.length}</span>
                    {paused && pending > 0 && (
                        <span className="badge badge-amber" style={{ fontSize: "0.52rem" }}>
                            {pending} new
                        </span>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {!paused && !following && (
                        <motion.button whileTap={{ scale: 0.95 }} className="btn" onClick={jumpToLatest}
                            style={{ fontSize: "0.6rem" }}>
                            Jump to latest
                        </motion.button>
                    )}
                    <motion.button whileTap={{ scale: 0.95 }} className="btn" onClick={() => setPaused(p => !p)}
                        style={paused ? { background: "var(--amber-dim)", borderColor: "var(--amber)", color: "var(--amber-text)" } : {}}>
                        {paused ? "Resume" : "Pause"}
                    </motion.button>
                </div>
            </div>

            <div ref={scrollRef} onScroll={handleScroll}
                style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "0 4px 6px" }}>
                {rows.length === 0 && (
                    <div style={{ textAlign: "center", padding: "28px 14px", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                        Waiting for events…
                    </div>
                )}

                {rows.map((a) => {
                    const sit = a.situation;
                    const dom = a.langgraph.hypotheses.find(h => h.hypothesis_id === a.explanation.dominant_hypothesis_id);
                    const conf = isNaN(a.explanation.dominant_confidence) ? 0 : Math.round(a.explanation.dominant_confidence * 100);
                    const abstained = sit.abstained_evidence_count ?? 0;
                    const isSelected = selectedId === sit.situation_id;

                    return (
                        <motion.div
                            key={entryKey(a)}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="feed-row"
                            onClick={onSelect ? () => onSelect(sit.situation_id) : undefined}
                            style={{
                                cursor: onSelect ? "pointer" : "default",
                                background: isSelected ? "var(--bg-muted)" : undefined,
                                borderRadius: isSelected ? "var(--radius-sm)" : undefined,
                            }}>
                            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: sevColor(sit.max_anomaly), marginTop: "6px", flexShrink: 0 }} />
                            <span className="mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)", minWidth: "52px", flexShrink: 0, paddingTop: "1px" }}>
                                {fmtTime(sit.last_activity)}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                                    <span className="mono" style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-primary)" }} title={sit.situation_id}>
                                        {sit.situation_id.substring(0, 8)}
                                    </span>
                                    <span className="mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>
                                        v{sit.version}
                                    </span>
                                    {sit.signal_types.slice(0, 2).map(t => (
                                        <span key={t} className="badge badge-gray" style={{ fontSize: "0.48rem", padding: "0px 4px" }}>{t}</span>
                                    ))}
                                    {abstained > 0 && (
                                        <span className="badge badge-amber" style={{ fontSize: "0.48rem", padding: "0px 4px" }}
                                            title="Evidence the sensor declined to classify">
                                            {abstained} abstained
                                        </span>
                                    )}
                                </div>
                                {dom && (
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {dom.description}
                                    </div>
                                )}
                            </div>
                            <span className="mono" style={{ fontSize: "0.7rem", fontWeight: 600, flexShrink: 0, color: conf > 70 ? "var(--green-text)" : conf > 40 ? "var(--amber-text)" : "var(--text-muted)" }}>
                                {conf}%
                            </span>
                        </motion.div>
                    );
                })}

                {visible.length > RENDER_WINDOW && (
                    <div style={{ textAlign: "center", padding: "10px", color: "var(--text-dim)", fontSize: "0.62rem" }}>
                        showing newest {RENDER_WINDOW} of {visible.length} buffered events
                    </div>
                )}
            </div>
        </motion.div>
    );
}
