import { readFile, writeFile } from "node:fs/promises";

const protocolPath = new URL("./recognition-test.protocol.json", import.meta.url);
const resultsPath = new URL("./recognition-test.results.json", import.meta.url);

const protocol = JSON.parse(await readFile(protocolPath, "utf8"));
const results = JSON.parse(await readFile(resultsPath, "utf8"));

const fail = (message) => {
  console.error("FE06R_RECOGNITION_INVALID|" + message);
  process.exit(2);
};

if (results.status !== "COLLECTED_FROZEN") fail("results must be COLLECTED_FROZEN");
if (results.candidate_sha !== protocol.candidate_sha) fail("candidate_sha mismatch");
if (results.browser_qa_run_id !== protocol.browser_qa_run_id) fail("browser_qa_run_id mismatch");
if (!Array.isArray(results.evaluators) || results.evaluators.length !== protocol.evaluators.required) {
  fail(`expected exactly ${protocol.evaluators.required} evaluators`);
}

const criteria = Object.keys(protocol.threshold_rules);
const counts = Object.fromEntries(criteria.map((c) => [c, 0]));

for (const evaluator of results.evaluators) {
  if (evaluator.human !== true) fail(`${evaluator.id}: human must be true`);
  if (evaluator.independent !== true) fail(`${evaluator.id}: independent must be true`);
  if (evaluator.unbriefed !== true) fail(`${evaluator.id}: unbriefed must be true`);

  for (const q of protocol.questions) {
    const response = evaluator.responses?.[q.id];
    if (!response || typeof response.verbatim !== "string" || response.verbatim.trim().length < 2) {
      fail(`${evaluator.id}/${q.id}: verbatim response missing`);
    }
    for (const criterion of q.criteria) {
      const value = response.criteria?.[criterion];
      if (typeof value !== "boolean") fail(`${evaluator.id}/${q.id}: criterion ${criterion} missing`);
      if (value) counts[criterion] += 1;
    }
  }
}

const checks = {};
let pass = true;
for (const [criterion, rule] of Object.entries(protocol.threshold_rules)) {
  const measured = counts[criterion];
  const ok = rule.operator === ">=" ? measured >= rule.count : measured <= rule.count;
  checks[criterion] = {
    measured,
    denominator: rule.denominator,
    operator: rule.operator,
    threshold: rule.count,
    verdict: ok ? "PASS" : "FAIL"
  };
  if (!ok) pass = false;
}

results.aggregate = { counts, checks };
results.verdict = pass ? "PASS" : "FAIL";
results.status = "EVALUATED";
await writeFile(resultsPath, JSON.stringify(results, null, 2) + "\n");

console.log(`FE06R_RECOGNITION_${results.verdict}`);
for (const [criterion, check] of Object.entries(checks)) {
  console.log(`${criterion}|${check.measured}/${check.denominator}|${check.operator}${check.threshold}|${check.verdict}`);
}
