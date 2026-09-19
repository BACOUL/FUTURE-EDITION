import { readFile, mkdir, writeFile } from "node:fs/promises";

const questions = JSON.parse(await readFile(new URL("../data/questions/questions.json", import.meta.url), "utf8"));
const nodes = [];
const edges = [];

for (const q of questions) {
  nodes.push({
    id: q.id,
    type: "Question",
    slug: q.slug,
    title: q.title,
    summary: q.summary,
    evidence_profile: q.evidence_profile,
    current_state: q.current_state
  });
  for (const m of q.milestones) {
    nodes.push({...m, type: "Milestone"});
    edges.push({from: q.id, relation: "HAS_MILESTONE", to: m.id});
  }
}

const graph = {
  schema_version: "0.1.0",
  status: "baseline_pending_evidence",
  counts: {
    questions: questions.length,
    milestones: questions.reduce((n,q)=>n+q.milestones.length,0)
  },
  nodes,
  edges
};

const graphPayload = JSON.stringify(graph, null, 2) + "\n";
const questionsPayload = JSON.stringify(questions, null, 2) + "\n";

await mkdir(new URL("../generated/", import.meta.url), {recursive:true});
await writeFile(new URL("../generated/future-graph.json", import.meta.url), graphPayload);

await mkdir(new URL("../apps/web/src/generated/", import.meta.url), {recursive:true});
await writeFile(new URL("../apps/web/src/generated/future-graph.json", import.meta.url), graphPayload);
await writeFile(new URL("../apps/web/src/generated/questions.json", import.meta.url), questionsPayload);

console.log(`FUTURE_GRAPH_BUILT|nodes=${nodes.length}|edges=${edges.length}`);
