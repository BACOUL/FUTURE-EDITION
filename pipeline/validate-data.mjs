import { readFile } from "node:fs/promises";

const questions = JSON.parse(await readFile(new URL("../data/questions/questions.json", import.meta.url), "utf8"));
const errors = [];
const ids = new Set();
const slugs = new Set();

if (!Array.isArray(questions) || questions.length !== 10) {
  errors.push("questions.json must contain exactly 10 launch questions");
}

for (const q of questions) {
  if (!/^Q-\d{3}$/.test(q.id ?? "")) errors.push(`invalid question id: ${q.id}`);
  if (!q.slug || !/^[a-z0-9-]+$/.test(q.slug)) errors.push(`invalid slug for ${q.id}`);
  if (ids.has(q.id)) errors.push(`duplicate id: ${q.id}`);
  if (slugs.has(q.slug)) errors.push(`duplicate slug: ${q.slug}`);
  ids.add(q.id);
  slugs.add(q.slug);
  if (q.current_state !== "baseline_pending_evidence" && q.current_state !== "assessed") {
    errors.push(`invalid current_state for ${q.id}`);
  }
  if (!Array.isArray(q.milestones) || q.milestones.length < 3) {
    errors.push(`too few milestones for ${q.id}`);
    continue;
  }
  const mids = new Set();
  let expectedOrder = 1;
  for (const m of [...q.milestones].sort((a,b)=>a.order-b.order)) {
    if (mids.has(m.id)) errors.push(`duplicate milestone id: ${m.id}`);
    mids.add(m.id);
    if (m.order !== expectedOrder) errors.push(`non-contiguous milestone order in ${q.id}`);
    expectedOrder++;
    if (!["unassessed","not_met","partially_met","met","invalidated"].includes(m.status)) {
      errors.push(`invalid milestone status: ${m.id}`);
    }
  }
}

if (errors.length) {
  console.error("FUTURE_EDITION_DATA_INVALID");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`FUTURE_EDITION_DATA_VALID|questions=${questions.length}|milestones=${questions.reduce((n,q)=>n+q.milestones.length,0)}`);
