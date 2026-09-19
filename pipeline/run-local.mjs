import { spawnSync } from "node:child_process";

const steps = [
  ["validate-data", ["pipeline/validate-data.mjs"]],
  ["validate-schemas", ["pipeline/validate-schemas.mjs"]],
  ["validate-relations", ["pipeline/validate-relations.mjs"]],
  ["test-fe02-model", ["pipeline/test-fe02-model.mjs"]],
  ["test-state-resolution", ["pipeline/test-state-resolution.mjs"]],
  ["test-fe03-core", ["pipeline/test-fe03-core.mjs"]],
  ["test-fe03-contracts", ["pipeline/test-fe03-contracts.mjs"]],
  ["test-fe03-resolver", ["pipeline/test-fe03-resolver.mjs"]],
  ["test-fe03-bridge", ["pipeline/test-fe03-bridge.mjs"]],
  ["test-fe03-locators", ["pipeline/test-fe03-locators.mjs"]],
  ["test-fe03-semantic", ["pipeline/test-fe03-semantic-safety.mjs"]],
  ["bench-fe03-synthetic", ["benchmarks/fe03/run-synthetic.mjs"]],
  ["build-graph", ["pipeline/build-graph.mjs"]],
  ["validate-graph", ["pipeline/validate-graph.mjs"]],
  ["verify-determinism", ["pipeline/verify-determinism.mjs"]],
  ["validate-current-state", ["pipeline/validate-current-state.mjs"]],
  ["build-site", ["pipeline/build-site.mjs"]],
  ["validate-output", ["pipeline/validate-output.mjs"]]
];

for (const [label, args] of steps) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error(`PIPELINE_FAIL|${label}`);
    process.exit(result.status ?? 1);
  }
}
console.log("PIPELINE_LOCAL_PASS");
