import { loadCollections } from "./lib/load-collections.mjs";
import { buildGraph, stableStringify } from "./lib/graph-model.mjs";

const collections = await loadCollections();
const first = stableStringify(buildGraph(collections));
const second = stableStringify(buildGraph(collections));

if (first !== second) {
  console.error("FUTURE_GRAPH_NON_DETERMINISTIC");
  process.exit(1);
}

console.log(`FUTURE_GRAPH_DETERMINISTIC|bytes=${Buffer.byteLength(first)}`);
