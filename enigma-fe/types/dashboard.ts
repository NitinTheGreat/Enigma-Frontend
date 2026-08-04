/* ═══════════════════════════════════════════════════════════════
   Enigma Dashboard — TypeScript Interfaces
   ═══════════════════════════════════════════════════════════════ */

/* Field names below mirror the backend wire format exactly. They were
   previously invented on the client and never sent, which left eight panels
   rendering zeros. See paper/EVIDENCE.md section F1. */

// ── Situation ──────────────────────────────────────────────────
export interface SituationSummary {
    situation_id: string;
    lifecycle: "active" | "dormant" | "expired" | null;
    evidence_count: number;
    signal_types: string[];
    entities: string[];
    sources: string[];
    created_at: string;
    last_updated: string;
    last_activity: string;
    version: number;
    max_anomaly: number;
    mean_anomaly: number;
    abstained_evidence_count: number;
}

// ── Hypothesis ─────────────────────────────────────────────────
export interface Hypothesis {
    hypothesis_id: string;
    description: string;
    confidence: number;
    status: "active" | "pruned" | "converged";
    belief_velocity: number;
    belief_acceleration: number;
    dominant_iterations: number;
    confidence_before_inertia?: number;
    inertia_clamped?: boolean;
}

// ── LangGraph ──────────────────────────────────────────────────
export interface LangGraphResult {
    hypotheses: Hypothesis[];
    convergence_score: number;
    iterations: number;
    belief_stability: number;
    undecided_iterations: number;
}

// ── Counterfactual ─────────────────────────────────────────────
export interface Counterfactual {
    missing_condition: string;
    expected_effect: string;
    confidence_delta: number;
}

// ── Explanation ────────────────────────────────────────────────
export type ExplanationSectionType =
    | "SUMMARY"
    | "SUPPORTING_EVIDENCE"
    | "CONTRADICTING_EVIDENCE"
    | "WHY_UNKNOWN"
    | "CONFIDENCE_RATIONALE"
    | "WHAT_WOULD_CHANGE_MY_MIND"
    | "COUNTERFACTUALS"
    | "TEMPORAL_EVOLUTION";

export type ContributionDirection = "SUPPORTING" | "OPPOSING" | "NEUTRAL";

export interface ExplanationSection {
    type: ExplanationSectionType;
    title: string;
    bullets: string[];
    contribution_score: number | null;
    contribution_direction: ContributionDirection | null;
    counterfactuals: Counterfactual[] | null;
}

export interface TemporalEvolution {
    confidence_trend: string;
    velocity: string;
    stability: string;
    undecided_duration: number;
}

export interface Explanation {
    undecided: boolean;
    dominant_hypothesis_id: string | null;
    dominant_confidence: number;
    convergence_score: number;
    sections: ExplanationSection[];
    temporal_evolution: TemporalEvolution | null;
}

// ── Temporal & Reasoning ───────────────────────────────────────
export interface TemporalData {
    situation_id: string;
    event_count: number;
    active_duration_seconds: number;
    event_rate_per_minute: number;
    last_event_age_seconds: number;
    mean_interval_seconds: number | null;
    burst_detected: boolean;
    quiet_detected: boolean;
}

export interface ReasoningData {
    situation_id: string;
    evidence_count: number;
    event_rate: number;
    burst_detected: boolean;
    quiet_detected: boolean;
    confidence_level: number;
    trend: "escalating" | "deescalating" | "stable";
    source_diversity: number;
    mean_anomaly_score: number;
    abstained_evidence_count: number;
    abstained_fraction: number;
}

// ── Full Analysis Payload ──────────────────────────────────────
export interface SituationAnalysis {
    type: "situation_analysis";
    situation: SituationSummary;
    temporal: TemporalData;
    reasoning: ReasoningData;
    langgraph: LangGraphResult;
    explanation: Explanation;
    human_readable: string;
    /* Client assigned arrival number, absent on the wire. The feed is an append
       log, so entries need an identity of their own: the server re-analyses a
       situation whenever a signal arrives, and two analyses that start before
       either finishes report the same version, which makes situation id and
       version together a duplicate key rather than a unique one. */
    feed_seq?: number;
}

// ── Health ─────────────────────────────────────────────────────
export interface HealthData {
    status: string;
    phase: number;
    active_situations: number;
    dormant_situations: number;
    bursting_situations: number;
    quiet_situations: number;
    max_event_rate: number;
    escalating_situations: number;
    stable_situations: number;
    deescalating_situations: number;
    average_confidence: number;
    max_confidence: number;
}

// ── Signal Type Mappings ───────────────────────────────────────
export const SIGNAL_TYPE_COLORS: Record<string, string> = {
    intrusion: "var(--red)",
    anomalous_access: "var(--amber)",
    data_exfiltration: "var(--red-light)",
    privilege_escalation: "var(--red)",
    lateral_movement: "var(--amber)",
    policy_violation: "var(--amber-light)",
    reconnaissance: "var(--cyan)",
    backdoor: "var(--red)",
    dos: "var(--red-light)",
    exploit: "var(--red)",
    fuzzers: "var(--purple)",
    shellcode: "var(--red)",
    worms: "var(--red-light)",
    generic: "var(--blue)",
    analysis: "var(--blue-light)",
    normal: "var(--green)",
    unknown: "var(--text-muted)",
};

export const SIGNAL_TYPE_ICONS: Record<string, string> = {
    intrusion: "🔓",
    anomalous_access: "⚠️",
    data_exfiltration: "📤",
    privilege_escalation: "⬆️",
    lateral_movement: "↔️",
    policy_violation: "📋",
    reconnaissance: "🔍",
    backdoor: "🚪",
    dos: "🚫",
    exploit: "💥",
    fuzzers: "🔀",
    shellcode: "🐚",
    worms: "🐛",
    generic: "📊",
    analysis: "🔬",
    normal: "✅",
    unknown: "❓",
};

export const SECTION_TYPE_STYLES: Record<string, string> = {
    SUMMARY: "section-summary",
    SUPPORTING_EVIDENCE: "section-supporting",
    CONTRADICTING_EVIDENCE: "section-contradicting",
    WHY_UNKNOWN: "section-why-unknown",
    CONFIDENCE_RATIONALE: "section-confidence",
    WHAT_WOULD_CHANGE_MY_MIND: "section-change-mind",
    COUNTERFACTUALS: "section-counterfactuals",
    TEMPORAL_EVOLUTION: "section-temporal",
};

export const SECTION_TYPE_ICONS: Record<string, string> = {
    SUMMARY: "📊",
    SUPPORTING_EVIDENCE: "✅",
    CONTRADICTING_EVIDENCE: "❌",
    WHY_UNKNOWN: "❓",
    CONFIDENCE_RATIONALE: "🧮",
    WHAT_WOULD_CHANGE_MY_MIND: "🔄",
    COUNTERFACTUALS: "🔮",
    TEMPORAL_EVOLUTION: "📈",
};

// ── Connection State ───────────────────────────────────────────
export type ConnectionState = "connected" | "disconnected" | "reconnecting";
