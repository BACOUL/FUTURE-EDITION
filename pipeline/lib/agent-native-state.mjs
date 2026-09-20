const ACTIVE = new Set(["active", "current"]);

const iso = (v) => v ? Date.parse(v) : NaN;

export function resolveClaimState(versions = [], asOf) {
  const t = iso(asOf);
  if (!Number.isFinite(t)) throw new Error("valid as_of required");

  const eligible = versions.filter((item) => {
    const from = iso(item.valid_from);
    const to = item.valid_to ? iso(item.valid_to) : Infinity;
    return Number.isFinite(from) && from <= t && t < to;
  });

  const active = eligible.filter((item) => ACTIVE.has(item.status));
  if (active.length > 1) throw new Error("ambiguous active claim versions");
  if (active.length === 1) return { status: "active", claim: active[0], history: versions.map((x) => x.id) };

  const retracted = eligible.find((item) => item.status === "retracted" || item.status === "invalidated")
    ?? versions.find((item) =>
      (item.status === "retracted" || item.status === "invalidated") &&
      Number.isFinite(iso(item.lifecycle_effective_at)) &&
      iso(item.lifecycle_effective_at) <= t
    );
  if (retracted) return { status: "retracted", claim: retracted, history: versions.map((x) => x.id) };

  const corrected = eligible.find((item) => item.status === "corrected" || item.status === "superseded");
  if (corrected) return { status: corrected.status, claim: corrected, history: versions.map((x) => x.id) };

  return { status: "unavailable", claim: null, history: versions.map((x) => x.id) };
}

export function propagateClaimLifecycle({
  versions = [],
  priorId,
  nextClaim = null,
  kind,
  effectiveAt,
  reason
}) {
  if (!["correction", "supersession", "retraction"].includes(kind)) throw new Error("unsupported lifecycle kind");
  if (!String(reason ?? "").trim()) throw new Error("lifecycle reason required");
  const prior = versions.find((x) => x.id === priorId);
  if (!prior) throw new Error("prior claim version not found");

  const updated = versions.map((x) => ({ ...x }));
  const target = updated.find((x) => x.id === priorId);
  target.valid_to = effectiveAt;
  target.status = kind === "retraction" ? "retracted" : kind === "correction" ? "corrected" : "superseded";
  target.lifecycle_reason = reason;
  target.lifecycle_effective_at = effectiveAt;
  target.superseded_by = nextClaim?.id ?? null;

  if (kind === "retraction") {
    if (nextClaim) throw new Error("retraction must not silently replace claim");
    return updated;
  }

  if (!nextClaim?.id || !nextClaim?.source_id || !nextClaim?.evidence_id || !nextClaim?.locator) {
    throw new Error("replacement claim must preserve source/evidence/locator");
  }
  updated.push({
    ...nextClaim,
    status: "active",
    valid_from: effectiveAt,
    valid_to: null,
    supersedes: priorId
  });
  return updated;
}

export function citationAtom(claim) {
  if (!claim?.id || !claim?.evidence_id || !claim?.source_id || !claim?.locator) {
    throw new Error("claim is not citable");
  }
  return {
    claim_id: claim.id,
    evidence_id: claim.evidence_id,
    source_id: claim.source_id,
    locator: claim.locator,
    version: claim.version ?? 1,
    valid_from: claim.valid_from ?? null,
    valid_to: claim.valid_to ?? null,
    status: claim.status
  };
}

export function buildQuestionAnswerPacket({
  question_id,
  as_of,
  state,
  claim_versions = [],
  limitations = [],
  contradictions = [],
  watch_next = []
}) {
  if (!question_id) throw new Error("question_id required");
  const resolved = resolveClaimState(claim_versions, as_of);

  let abstention = null;
  if (!state || state.status === "unassessed") abstention = "state_unassessed";
  else if (state.status === "ambiguous") abstention = "state_ambiguous";
  else if (contradictions.some((x) => x.status === "unresolved")) abstention = "unresolved_contradiction";
  else if (resolved.status === "retracted") abstention = "claim_retracted";
  else if (resolved.status !== "active") abstention = "no_active_supported_claim";
  else if (!resolved.claim.source_available) abstention = "source_unavailable";
  else if (!resolved.claim.evidence_verified) abstention = "evidence_unverified";

  const citations = abstention ? [] : [citationAtom(resolved.claim)];

  return {
    schema_version: "fe/agent-answer-packet/v1",
    question_id,
    as_of,
    state,
    answer: abstention ? null : resolved.claim.text,
    claims: resolved.claim ? [resolved.claim.id] : [],
    citations,
    limitations,
    contradictions,
    watch_next,
    abstention
  };
}
