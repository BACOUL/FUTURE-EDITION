import { readFile } from "node:fs/promises";
import { validateSchema } from "./lib/schema-validator.mjs";
import { sha256 } from "./lib/graph-model.mjs";

const root = new URL("../", import.meta.url);
const graph = JSON.parse(await readFile(new URL("generated/future-graph.json", root), "utf8"));
const relationSchema = JSON.parse(await readFile(new URL("schemas/relation.schema.json", root), "utf8"));
const errors = [];

for (let index = 0; index < graph.edges.length; index++) {
  errors.push(...validateSchema(graph.edges[index], relationSchema, `edge[${index}]`));
}

const { content_hash, ...body } = graph;
const expected = sha256(body);
if (content_hash !== expected) errors.push(`content_hash mismatch: expected ${expected}, got ${content_hash}`);

if (errors.length) {
  console.error("FUTURE_GRAPH_INVALID");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`FUTURE_GRAPH_VALID|nodes=${graph.nodes.length}|edges=${graph.edges.length}|hash=${content_hash}`);
