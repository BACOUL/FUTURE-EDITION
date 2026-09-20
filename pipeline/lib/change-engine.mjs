import { createHash } from "node:crypto";

const STATUS_RANK = {
  not_met: 0,
  partially_met: 1,
  met: 2
};

const CONFIDENCE_RANK = {
  contested: 0,
  needs_confirmation: 1,
  solid_preliminary: 2,
  confirmed: 3
};

const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

export function assessmentStateHash(assessment) {
  if (!assessment?.id || !assessment?.milestone_id) throw new Error("assessment identity required");
  const state = {
    id: assessment.id,
    milestone_id: assessment.milestone_id,
    status: assessment.status,
    confidence: assessment.confidence,
    basis_claim_ids: [...(assessment.basis_claim_ids ?? [])].sort(),
    basis_event_ids: [...(assessment.basis_event_ids ?? [])].sort(),
    review_state: assessment.review_state,
    review_id: assessment.review_id ?? null,
    supersedes_assessment_id: assessment.supersedes_assessment_id ?? null,
    effective_at: assessment.effective_at
  };
  return createHash("sha256").update(stableStringify(state)).digest("hex");
}

export function classifyMilestoneChange(before, after) {
  if (!before || !after) throw new Error("before and after assessments are required");
  if (before.milestone_id !== after.milestone_id) throw new Error("cross-milestone change forbidden");

  if (after.status === "invalidated") return "invalidation";
  if (before.status === "invalidated" && after.status !== "invalidated") {
    throw new Error("invalidated milestone cannot be silently reopened");
  }

  if (before.status === after.status) {
    const beforeConfidence = CONFIDENCE_RANK[before.confidence];
    const afterConfidence = CONFIDENCE_RANK[after.confidence];
    if (beforeConfidence == null || afterConfidence == null) throw new Error("unknown confidence");
    if (afterConfidence > beforeConfidence) return "evidence_upgrade";
    if (afterConfidence < beforeConfidence) return "setback";
    return "none";
  }

  const beforeRank = STATUS_RANK[before.status];
  const afterRank = STATUS_RANK[after.status];
  if (beforeRank == null || afterRank == null) throw new Error("unknown milestone status");
  if (after.status === "met" && afterRank > beforeRank) return "milestone_reached";
  if (afterRank > beforeRank) return "minor_progress";
  return "setback";
}

export function buildMilestoneChange({
  id,
  before,
  after,
  trigger_claim_ids,
  trigger_evidence_ids,
  trigger_event_ids = [],
  review_id,
  justification,
  observed_at,
  valid_from = observed_at,
  valid_to = null
}) {
  if (after?.supersedes_assessment_id !== before?.id) {
    throw new Error("after assessment must directly supersede before assessment");
  }
  if (after?.review_state !== "human_approved") {
    throw new Error("after assessment must be human approved");
  }
  if (!review_id || after.review_id !== review_id) {
    throw new Error("change review must be the after-assessment review");
  }
  if (!Array.isArray(trigger_claim_ids) || trigger_claim_ids.length === 0) {
    throw new Error("at least one trigger claim is required");
  }
  if (!Array.isArray(trigger_evidence_ids) || trigger_evidence_ids.length === 0) {
    throw new Error("at least one trigger evidence item is required");
  }
  if (!String(justification ?? "").trim()) throw new Error("change justification required");

  return {
    id,
    milestone_id: after.milestone_id,
    before_assessment_id: before.id,
    after_assessment_id: after.id,
    change_type: classifyMilestoneChange(before, after),
    trigger_claim_ids: [...new Set(trigger_claim_ids)].sort(),
    trigger_evidence_ids: [...new Set(trigger_evidence_ids)].sort(),
    trigger_event_ids: [...new Set(trigger_event_ids)].sort(),
    review_id,
    justification: String(justification).trim(),
    before_state_hash: assessmentStateHash(before),
    after_state_hash: assessmentStateHash(after),
    observed_at,
    valid_from,
    valid_to
  };
}
