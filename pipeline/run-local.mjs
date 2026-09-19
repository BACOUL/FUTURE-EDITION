import { spawnSync } from "node:child_process";

for (const [label, cmd, args] of [
  ["validate", process.execPath, ["pipeline/validate-data.mjs"]],
  ["graph", process.execPath, ["pipeline/build-graph.mjs"]]
]) {
  const result = spawnSync(cmd, args, {stdio:"inherit", shell:false});
  if (result.status !== 0) {
    console.error(`PIPELINE_FAIL|${label}`);
    process.exit(result.status ?? 1);
  }
}
console.log("PIPELINE_LOCAL_PASS");
