import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const path=process.argv[2];

if(!path){
  console.error("USAGE|node benchmarks/fe03/seal-holdout.mjs <holdout-file>");
  process.exit(2);
}

const bytes=await readFile(path);
const hash=createHash("sha256").update(bytes).digest("hex");

console.log(JSON.stringify({
  algorithm:"sha256",
  sha256:hash,
  bytes:bytes.length,
  sealed_at:"record externally at seal time",
  rule:"Do not inspect holdout labels before final FE-03 evaluation."
},null,2));
