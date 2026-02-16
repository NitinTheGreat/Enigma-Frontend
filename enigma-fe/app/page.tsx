"use client";

import { useState, useEffect } from "react";
import { useDashboardWS } from "@/hooks/useDashboardWS";
import { useHealth } from "@/hooks/useHealth";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import SituationOverview from "@/components/dashboard/SituationOverview";
import HypothesesPanel from "@/components/dashboard/HypothesesPanel";
import ExplanationSections from "@/components/dashboard/ExplanationSections";
import LiveFeed from "@/components/dashboard/LiveFeed";
import Footer from "@/components/dashboard/Footer";
import ThemeTransition from "@/components/dashboard/ThemeTransition";
import { motion, AnimatePresence } from "framer-motion";

function Skeleton({ lines = 3, delay = 0 }: { lines?: number; delay?: number }) {
  return (
    <motion.div className="card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ padding: "18px" }}>
      <div className="skeleton skeleton-line" style={{ width: "28%", height: "13px", marginBottom: "14px" }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton skeleton-line ${i === lines - 1 ? "skeleton-line-short" : "skeleton-line-medium"}`}
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { connectionState, situations, feed, recentlyUpdated, isConnected } = useDashboardWS();
  const { health, latencyMs, lastUpdate } = useHealth();
  const [selId, setSelId] = useState<string | null>(null);

  useEffect(() => {
    if (!selId && situations.size > 0) setSelId(Array.from(situations.keys())[0]);
  }, [situations, selId]);

  const sel = selId ? situations.get(selId) ?? null : null;
  const skeleton = connectionState === "reconnecting" || (connectionState === "connected" && situations.size === 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--bg-page)", transition: "background-color 0.3s ease" }}>
      {/* Ripple overlay for theme transitions */}
      <ThemeTransition />

      <Header connectionState={connectionState} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <Sidebar situations={situations} selectedId={selId} onSelect={setSelId} recentlyUpdated={recentlyUpdated} />

        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "14px", gap: "10px", minHeight: 0 }}>
          <AnimatePresence mode="wait">
            {sel ? (
              <motion.div key={sel.situation.situation_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0, overflow: "hidden" }}>
                {/* Top: Overview + Hypotheses */}
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "10px", flexShrink: 0 }}>
                  <SituationOverview analysis={sel} />
                  <HypothesesPanel hypotheses={sel.langgraph.hypotheses} dominantId={sel.explanation.dominant_hypothesis_id} />
                </div>
                {/* Bottom: Explanation + Live Feed */}
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", minHeight: 0, overflow: "hidden" }}>
                  <div style={{ overflowY: "auto", minHeight: 0 }}>
                    <ExplanationSections sections={sel.explanation.sections} />
                  </div>
                  <div style={{ minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <LiveFeed feed={feed} />
                  </div>
                </div>
              </motion.div>
            ) : skeleton ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "10px" }}>
                  <Skeleton lines={5} delay={0} /><Skeleton lines={4} delay={0.1} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", flex: 1 }}>
                  <Skeleton lines={3} delay={0.2} /><Skeleton lines={2} delay={0.3} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px" }}>
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  style={{
                    width: "56px", height: "56px", borderRadius: "50%",
                    background: "var(--bg-muted)", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  <svg style={{ width: "22px", height: "22px", color: "var(--text-muted)" }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    <path d="M12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </motion.div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "3px", color: "var(--text-primary)" }}>
                    {isConnected ? "Monitoring Active" : "Connecting…"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: "280px", lineHeight: 1.5 }}>
                    {isConnected ? "Waiting for threat analysis results." : "Establishing connection to backend…"}
                  </div>
                </div>
                {feed.length > 0 && (
                  <div style={{ width: "100%", maxWidth: "560px", height: "200px", marginTop: "6px" }}>
                    <LiveFeed feed={feed} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <Footer health={health} latencyMs={latencyMs} lastUpdate={lastUpdate} isConnected={isConnected} />
    </div>
  );
}
