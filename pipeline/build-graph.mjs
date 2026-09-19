import { mkdir, writeFile } from "node:fs/promises";
import { loadCollections } from "./lib/load-collections.mjs";
import { buildGraph } from "./lib/graph-model.mjs";

const root = new URL("../", import.meta.url);
const collections = await loadCollections(root);
const graph = buildGraph(collections);

await mkdir(new URL("generated/", root), { recursive: true });
await writeFile(
  new URL("generated/future-graph.json", root),
  JSON.stringify(graph, null, 2) + "\n"
);

console.log(`FUTURE_GRAPH_BUILT|nodes=${graph.nodes.length}|edges=${graph.edges.length}|hash=${graph.content_hash}`);
