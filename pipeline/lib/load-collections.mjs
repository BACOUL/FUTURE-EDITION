import { readFile } from "node:fs/promises";

const read = async (root, path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

export async function loadCollections(root = new URL("../../", import.meta.url)) {
  return {
    questions: await read(root, "data/questions/questions.json"),
    technologies: await read(root, "data/technologies/technologies.json"),
    events: await read(root, "data/events/events.json"),
    claims: await read(root, "data/claims/claims.json"),
    evidence: await read(root, "data/evidence/evidence.json"),
    sources: await read(root, "data/sources/sources.json"),
    provenance: await read(root, "data/provenance/provenance.json"),
    organizations: await read(root, "data/organizations/organizations.json"),
    people: await read(root, "data/people/people.json"),
    reviews: await read(root, "data/reviews/reviews.json"),
    assessments: await read(root, "data/assessments/assessments.json")
  };
}
