import { readFile } from "node:fs/promises";
import { validateSchema } from "./lib/schema-validator.mjs";

const root = new URL("../", import.meta.url);
const specs = [
  ["Question", "data/questions/questions.json", "schemas/question.schema.json"],
  ["Technology", "data/technologies/technologies.json", "schemas/technology.schema.json"],
  ["Event", "data/events/events.json", "schemas/event.schema.json"],
  ["Claim", "data/claims/claims.json", "schemas/claim.schema.json"],
  ["Evidence", "data/evidence/evidence.json", "schemas/evidence.schema.json"],
  ["Source", "data/sources/sources.json", "schemas/source.schema.json"],
  ["Provenance", "data/provenance/provenance.json", "schemas/provenance.schema.json"],
  ["Organization", "data/organizations/organizations.json", "schemas/organization.schema.json"],
  ["Person", "data/people/people.json", "schemas/person.schema.json"],
  ["Review", "data/reviews/reviews.json", "schemas/review.schema.json"]
];

const errors = [];
let objects = 0;

for (const [label, dataPath, schemaPath] of specs) {
  const data = JSON.parse(await readFile(new URL(dataPath, root), "utf8"));
  const schema = JSON.parse(await readFile(new URL(schemaPath, root), "utf8"));
  if (!Array.isArray(data)) {
    errors.push(`${label}: collection is not an array`);
    continue;
  }
  for (let index = 0; index < data.length; index++) {
    objects++;
    errors.push(...validateSchema(data[index], schema, `${label}[${index}]`));
  }
}

if (errors.length) {
  console.error("FUTURE_EDITION_SCHEMA_INVALID");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`FUTURE_EDITION_SCHEMA_VALID|objects=${objects}`);
