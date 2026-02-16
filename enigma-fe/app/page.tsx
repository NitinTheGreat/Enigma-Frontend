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
    <div className="glass-card" style={{ padding: "20px", height }}>
      <div className="skeleton skeleton-line" style={{ width: "40%", marginBottom: "16px" }} />
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

  // Auto-select the first situation if none is selected
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
      {/* Header */}
      <Header connectionState={connectionState} />

      {/* Main body: Sidebar + Content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <Sidebar
          situations={situations}
          selectedId={selectedSituationId}
          onSelect={setSelectedSituationId}
          recentlyUpdated={recentlyUpdated}
        />

        {/* Main content area */}
        <main
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: "16px",
            gap: "16px",
          }}
        >
          {selectedAnalysis ? (
            <>
              {/* Top row: Overview + Hypotheses */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  minHeight: 0,
                }}
              >
                <SituationOverview analysis={selectedAnalysis} />
                <HypothesesPanel
                  hypotheses={selectedAnalysis.langgraph.hypotheses}
                  dominantId={selectedAnalysis.explanation.dominant_hypothesis_id}
                />
              </div>

              {/* Middle: Explanation sections */}
              <div
                style={{
                  flex: "0 1 auto",
                  minHeight: 0,
                  overflowY: "auto",
                }}
              >
                <ExplanationSections sections={selectedAnalysis.explanation.sections} />
              </div>

              {/* Bottom: Live Feed */}
              <div style={{ flex: "1 1 200px", minHeight: "180px", overflow: "hidden" }}>
                <LiveFeed feed={feed} />
              </div>
            </>
          ) : showSkeleton ? (
            /* Skeleton Loading State */
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  minHeight: 0,
                }}
              >
                <SkeletonCard lines={5} />
                <SkeletonCard lines={4} />
              </div>
              <SkeletonCard lines={3} />
              <SkeletonCard lines={2} height="180px" />
            </>
          ) : (
            /* Empty state */
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                }}
                className="animate-pulse-glow"
              >
                🛡️
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "6px",
                  }}
                >
                  {isConnected ? "Monitoring Active" : "Connecting…"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: "320px" }}>
                  {isConnected
                    ? "Waiting for the AI reasoning engine to detect and analyze threats. Analyses will appear here in real time."
                    : "Establishing secure connection to the threat analysis backend…"}
                </div>
              </div>

              {/* Still show live feed even without selection */}
              {feed.length > 0 && (
                <div style={{ width: "100%", maxWidth: "700px", height: "250px", marginTop: "16px" }}>
                  <LiveFeed feed={feed} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer
        health={health}
        latencyMs={latencyMs}
        lastUpdate={lastUpdate}
        isConnected={isConnected}
      />
    </div>
  );
}
