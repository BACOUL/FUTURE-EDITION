import { loadCollections } from "./lib/load-collections.mjs";
import { validateCollections } from "./lib/graph-model.mjs";

const collections = await loadCollections();
const result = validateCollections(collections);

if (!result.ok) {
  console.error("FUTURE_EDITION_RELATIONS_INVALID");
  for (const error of result.errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`FUTURE_EDITION_RELATIONS_VALID|objects=${result.registry.size}`);
