/* ═══════════════════════════════════════════════════════════════
   Enigma Dashboard — TypeScript Interfaces
   ═══════════════════════════════════════════════════════════════ */

// ── Situation ──────────────────────────────────────────────────
export interface SituationSummary {
    situation_id: string;
    lifecycle: "active" | "dormant" | "expired";
    evidence_count: number;
    signal_types: string[];
    entities: string[];
    created_at: string;
    last_activity: string;
    max_anomaly: number;
    sources: string[];
}

// ── Hypothesis ─────────────────────────────────────────────────
export interface Hypothesis {
    id: string;
    description: string;
    confidence: number;
    status: "active" | "pruned" | "confirmed";
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
    event_count: number;
    event_rate: number;
    mean_anomaly: number;
    max_anomaly: number;
    unique_types: number;
    unique_sources: number;
    is_bursting: boolean;
    is_quiet: boolean;
    duration_seconds: number;
}

export interface ReasoningData {
    confidence: number;
    trend: "escalating" | "deescalating" | "stable";
    evidence_count: number;
    anomaly_mean: number;
    diversity: number;
    burst_active: boolean;
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
