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

function SkeletonCard({ lines = 3, height }: { lines?: number; height?: string }) {
  return (
    <div className="glass-card" style={{ padding: "24px", height }}>
      <div className="skeleton skeleton-line" style={{ width: "35%", height: "16px", marginBottom: "20px" }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton skeleton-line ${i === lines - 1 ? "skeleton-line-short" : "skeleton-line-medium"}`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const {
    connectionState,
    situations,
    feed,
    recentlyUpdated,
    isConnected,
  } = useDashboardWS();

  const { health, latencyMs, lastUpdate } = useHealth();

  const [selectedSituationId, setSelectedSituationId] = useState<string | null>(null);

  // Auto-select best situation
  useEffect(() => {
    if (!selectedSituationId && situations.size > 0) {
      const firstId = Array.from(situations.keys())[0];
      setSelectedSituationId(firstId);
    }
  }, [situations, selectedSituationId]);

  const selectedAnalysis = selectedSituationId
    ? situations.get(selectedSituationId) ?? null
    : null;

  const showSkeleton = connectionState === "reconnecting" || (connectionState === "connected" && situations.size === 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-primary)",
      }}
    >
      <Header connectionState={connectionState} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
          situations={situations}
          selectedId={selectedSituationId}
          onSelect={setSelectedSituationId}
          recentlyUpdated={recentlyUpdated}
        />

        <main
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: "20px",
            gap: "16px",
          }}
        >
          {selectedAnalysis ? (
            <>
              {/* Top: Overview + Hypotheses side by side */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 0.9fr",
                gap: "16px",
                minHeight: 0,
              }}>
                <SituationOverview analysis={selectedAnalysis} />
                <HypothesesPanel
                  hypotheses={selectedAnalysis.langgraph.hypotheses}
                  dominantId={selectedAnalysis.explanation.dominant_hypothesis_id}
                />
              </div>

              {/* Middle: Explanation + Live Feed side-by-side */}
              <div style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                minHeight: 0,
                overflow: "hidden",
              }}>
                <div style={{ overflowY: "auto" }}>
                  <ExplanationSections sections={selectedAnalysis.explanation.sections} />
                </div>
                <LiveFeed feed={feed} />
              </div>
            </>
          ) : showSkeleton ? (
            <>
              <div style={{
                display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "16px",
              }}>
                <SkeletonCard lines={5} />
                <SkeletonCard lines={4} />
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", flex: 1,
              }}>
                <SkeletonCard lines={3} />
                <SkeletonCard lines={2} />
              </div>
            </>
          ) : (
            /* Empty state */
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "20px",
            }}>
              <div style={{
                width: "90px", height: "90px", borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))",
                border: "1px solid rgba(59,130,246,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2.2rem",
                boxShadow: "var(--shadow-glow-blue)",
              }} className="animate-pulse-glow">
                🛡️
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: "1.2rem", fontWeight: 700,
                  color: "var(--text-primary)", marginBottom: "8px",
                }}>
                  {isConnected ? "Monitoring Active" : "Connecting…"}
                </div>
                <div style={{
                  fontSize: "0.85rem", color: "var(--text-muted)",
                  maxWidth: "360px", lineHeight: 1.6,
                }}>
                  {isConnected
                    ? "Waiting for the AI reasoning engine to detect and analyze threats. Results will appear here in real time."
                    : "Establishing secure connection to the threat analysis backend…"}
                </div>
              </div>

              {feed.length > 0 && (
                <div style={{ width: "100%", maxWidth: "700px", height: "260px", marginTop: "12px" }}>
                  <LiveFeed feed={feed} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer
        health={health}
        latencyMs={latencyMs}
        lastUpdate={lastUpdate}
        isConnected={isConnected}
      />
    </div>
  );
}
