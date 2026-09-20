# Future Edition — Information Architecture v1

## Status

**Authority:** navigation, object hierarchy and surface relationships for FE-06R and future stages.

The IA is designed around **questions, changes, claims, evidence and time**, not around a classic newspaper taxonomy.

---

# 1. Core mental model

A user should be able to enter Future Edition through five intents:

1. **What changed?**
2. **Where are we on a major question?**
3. **Is this claim actually supported?**
4. **What does Future Edition know about X?**
5. **Show me the evidence / give me the structured state.**

The navigation and URLs must support these intents directly.

---

# 2. Primary navigation

## Aujourd'hui
Purpose: qualified changes that are genuinely current.

Contains:
- lead change;
- recent qualified changes;
- corrections/retractions;
- no-change state when appropriate.

Does not contain:
- historical filler;
- arbitrary daily publishing quota.

## Observatoires
Purpose: current state of long-horizon questions.

Contains:
- state;
- `as_of`;
- milestones;
- trajectories;
- competing approaches;
- evidence landscape;
- changes;
- Watch Next;
- history.

## Reality Check
Purpose: stress-test public claims against evidence.

Contains:
- claim;
- conditions required;
- supporting/contradicting/limiting evidence;
- permitted conclusion;
- excessive conclusion;
- current validity.

## Ask
Purpose: query the Future Graph.

FE-06R may expose a non-functional preview only if clearly labelled. The functional product belongs to FE-10.

## Search
Purpose: universal object discovery.

---

# 3. Secondary navigation / utility

Accessible contextually or from footer:
- Methodology;
- Sources;
- Corrections;
- Change log;
- About;
- Editorial responsibility;
- Report an error;
- Machine access;
- Contact;
- Legal;
- Privacy.

No more than one additional nested level for trust pages.

---

# 4. Object hierarchy

Canonical scientific hierarchy:

```
Question
├── Observatory
├── Milestone
├── Technology / Approach
├── Event
│   └── Change
│       ├── Claim
│       │   ├── Evidence
│       │   │   └── Source
│       │   └── Contradiction / Limitation
│       └── Article representation
└── Current State / Historical State
```

Article is a representation, not a parent of the truth.

Reality Check is also a representation composed from canonical Claim/Evidence objects.

---

# 5. Public route model

Routes below are product targets. Existing FE-06 routes remain valid until migration and redirects are proved.

## Core
- `/` — Home / current edition
- `/aujourdhui/` — current qualified changes
- `/observatoires/`
- `/observatoires/:slug/`
- `/reality-check/`
- `/reality-check/:slug/`
- `/ask/`
- `/recherche/`

## Editorial
- `/avance/:slug/` — human Article / Advancement
- `/changements/` — material change log
- `/changements/:change-id/` — explicit Change view
- `/corrections/`
- `/corrections/:id/`

## Evidence / trust
- `/preuves/:id/`
- `/sources/:id/` when useful and legally appropriate
- `/methodologie/`
- `/sources/`
- `/responsabilite-editoriale/`
- `/signaler-une-erreur/`
- `/a-propos/`

## Machine discovery target
Semantic contract is frozen now; implementation may arrive progressively:
- `/.well-known/future-edition.json`
- `/machine/`
- versioned JSON representations or content negotiation;
- delta/change feed;
- schemas.

Exact API routing is frozen later by ADR in FE-14.

---

# 6. Stable identity vs human URLs

Human-friendly slugs are not scientific identity.

Every canonical object has:
- stable Future Edition ID;
- stable machine identifier/URI;
- current human route;
- aliases/redirects from former slugs.

Slug rename must never create a new scientific object.

Translations share the same canonical scientific ID.

---

# 7. Home information architecture

## H0 — Knowledge Clock
Answers:
- as of when?
- is there a material update?

## H1 — Lead Delta
Answers:
- what is the most important qualified change?
- what was true before?
- what is the evidence?
- what is now supportable?

## H2 — Change Field
Answers:
- what else materially changed?

## H3 — Reality Check
Answers:
- which widely repeated claim needs evidence context?

## H4 — Observatory Motion
Answers:
- which long-horizon questions moved?

## H5 — Watch Horizon
Answers:
- what evidence are we waiting for next?

## H6 — Explore the Knowledge Map
Answers:
- where else can I go?

## H7 — Trust / Machine
Answers:
- how does this work?
- how can I verify/cite/use it?

The Home must not attempt to expose every object.

---

# 8. Aujourd'hui architecture

"Today" is an editorial state, not necessarily a calendar bucket containing content.

Order:
1. current time window / `as_of`;
2. material changes;
3. corrections/retractions;
4. signals under investigation only if explicitly separated;
5. explicit no-change message if there are no qualified changes.

Historical baseline belongs elsewhere.

---

# 9. Article architecture

## Layer 1 — Orientation
- domain;
- observatory;
- headline;
- deck;
- visual;
- event/publication/update dates;
- confidence/evidence level.

## Layer 2 — Delta
- Before;
- Evidence;
- After.

## Layer 3 — Narrative
- explanation;
- context;
- why it matters.

## Layer 4 — Auditability
- Evidence Spine;
- claims;
- sources;
- locators.

## Layer 5 — Boundaries
- what it does not prove;
- limitations;
- contradictions.

## Layer 6 — Forward state
- Watch Next;
- affected milestones;
- what could invalidate or strengthen the state.

## Layer 7 — History
- corrections;
- change history;
- previous versions.

## Layer 8 — Machine
- Agent Dock / structured view.

A reader can stop after Layer 2 and still understand the core change.

---

# 10. Observatory architecture

## O1 — Question + State
The current answer, or explicitly unassessed.

## O2 — Temporal context
Current `as_of`, last material change, state history.

## O3 — Milestones
Defined criteria and actual states.

## O4 — Approaches / Technologies
Competing or complementary paths.

## O5 — Evidence landscape
Support, contradict, limit.

## O6 — Recent Changes
Material deltas.

## O7 — Watch Next
Observable future evidence.

## O8 — Historical baseline
Foundational events, separated from current intelligence.

## O9 — Machine state
Canonical IDs, structured representation and change access.

---

# 11. Reality Check architecture

Input:
a public claim.

Output:
- exact claim;
- scope;
- what would make it true;
- evidence supporting;
- evidence contradicting;
- evidence limiting;
- conclusion allowed;
- conclusion not allowed;
- confidence;
- `as_of`;
- corrections/version;
- sources.

Reality Check pages link back to:
- relevant Observatory;
- related Article;
- claim/evidence objects.

---

# 12. Search architecture

Universal search returns typed groups.

## Query interpretation
Potential target types:
- Question;
- Article/Change;
- Claim;
- Technology;
- Source;
- Organization/Person later.

## Result design
Question result:
- current state + as_of.

Change result:
- Before → After summary.

Claim result:
- claim + confidence + source count/quality description.

Technology result:
- linked observatories + recent changes.

Source result:
- source status + linked claims.

Do not flatten all result types into identical cards.

---

# 13. Depth architecture

Every major scientific surface supports progressive disclosure.

## 30 sec
- state/change;
- why it matters;
- confidence.

## 3 min
- Delta;
- limits;
- Watch Next.

## Expert
- claims;
- evidence;
- contradictions;
- chronology;
- methodology.

## Agent
- canonical structured object;
- versions;
- citations;
- delta.

These are views, not independent content stores.

---

# 14. Mobile IA

Mobile does not remove scientific meaning.

Primary destinations remain one action away:
- Aujourd'hui;
- Observatoires;
- Reality Check;
- Ask;
- Search.

Within an Article:
- Delta immediately after intro;
- Evidence Spine becomes inline evidence anchors;
- Depth Lens becomes compact segmented control or anchored index;
- Agent actions move to overflow/context panel;
- Watch Next remains visible before related content.

Within Observatory:
- State first;
- as_of second;
- recent Delta before full milestone history;
- no giant visualization before the answer.

---

# 15. Navigation invariants

- Current scientific state is never more than 2 actions from an Observatory landing.
- Source original is never more than 2 actions from a primary claim in an Article.
- A correction is reachable from the corrected object.
- Current vs historical context is always visually explicit.
- Search is accessible globally.
- No primary destination depends on a hamburger-only path on mobile.
- No dead-end evidence dossier: it links back to the Article/Observatory context.
- No machine representation exists without a human canonical object or explicit reason.

---

# 16. Cross-surface linking

## Article links to
- Observatory;
- Change;
- Dossier de preuve;
- Source;
- Reality Check if relevant;
- corrections/history.

## Observatory links to
- latest Articles/Changes;
- milestones;
- technologies;
- evidence landscape;
- historical events;
- Watch Next.

## Reality Check links to
- canonical claims;
- evidence;
- Observatory;
- related Articles.

## Evidence dossier links to
- supported/contradicted Claim;
- Article;
- Observatory;
- original Source.

The user should never lose context while going deeper.

---

# 17. Agent IA navigation model

Agents should not navigate like humans.

Machine discovery must expose:
- entity/type index;
- schema versions;
- canonical IDs;
- object representations;
- `as_of`;
- changes since cursor/version;
- correction/retraction feed;
- citation atom contract.

The human IA and agent IA meet at stable IDs and canonical objects.

---

# 18. Personalization target

Later stages may add:
- Follow Question;
- Follow Technology;
- Follow Claim;
- Follow only material changes;
- Notify on contradiction;
- Notify on correction;
- Notify on milestone change.

Do not implement vanity engagement notifications.

---

# 19. Analytics that matter

Do not optimize only:
- pageviews;
- scroll depth;
- session duration.

Future product metrics should include:
- Article → Evidence open rate;
- source-open rate;
- Observatory return rate;
- followed question retention;
- corrections seen after prior citation;
- Ask citation usage;
- machine object fetches;
- delta feed consumers;
- successful evidence reconstruction.

These measure trust and utility, not addiction.

---

# 20. FE-06R implementation slice

FE-06R must prove the IA on one coherent end-to-end subject:

`Home lead → Article → Change → Evidence → Source → Observatory → Methodology/machine representation`

Required:
- R1 Home;
- R2 Article;
- R3 Observatory;
- R4 Methodology;
- one Reality Check;
- one structured machine representation;
- navigation desktop/mobile;
- search shell may be non-functional only if explicitly marked, but no fake result experience.

Do not generalize before this slice passes the gate.

---

# 21. Rejection conditions

Reject IA if:
- Home is organized primarily by generic categories rather than changes;
- Today needs old content to look populated;
- Article begins with methodology instead of the scientific change;
- Evidence requires more than 2 actions from a major claim;
- Observatory is mostly an article list;
- History and current state are mixed;
- user must understand internal IDs to navigate;
- machine routes create a separate truth store;
- mobile hides primary product destinations behind several menus.

## Final rule

> The site is organized around the evolution of knowledge, not the production schedule of a newsroom.
