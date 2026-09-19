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
  if (ids.has(q.id)) errors.push(`duplicate global id: ${q.id}`);
  if (slugs.has(q.slug)) errors.push(`duplicate slug: ${q.slug}`);
  ids.add(q.id);
  slugs.add(q.slug);

  if (!Array.isArray(q.milestones) || q.milestones.length < 3) {
    errors.push(`too few milestones for ${q.id}`);
    continue;
  }

  let expectedOrder = 1;
  for (const m of [...q.milestones].sort((a,b)=>a.order-b.order)) {
    if (ids.has(m.id)) errors.push(`duplicate global id: ${m.id}`);
    ids.add(m.id);
    if (!m.id.startsWith(`${q.id}-M`)) errors.push(`milestone id does not belong to question: ${m.id}`);
    if (m.order !== expectedOrder) errors.push(`non-contiguous milestone order in ${q.id}`);
    expectedOrder++;
    if ("status" in m) errors.push(`mutable milestone status forbidden in definition: ${m.id}`);
  }

  if ("current_state" in q) errors.push(`mutable question current_state forbidden in definition: ${q.id}`);
}

if (errors.length) {
  console.error("FUTURE_EDITION_DATA_INVALID");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`FUTURE_EDITION_DATA_VALID|questions=${questions.length}|milestones=${questions.reduce((n,q)=>n+q.milestones.length,0)}|definition_state_free=1`);
