# Future Edition — Design System Vision v1

## Status

**Authority:** design direction for FE-06R reference surfaces  
**Scope:** R1 Home, R2 Article, R3 Observatory, R4 Methodology, Reality Check, navigation, search and future agent-facing affordances.

This document does not freeze pixels. It freezes the **visual grammar and product behavior** that the implementation must prove.

---

# 1. North Star

Future Edition must not look like:
- a classic news homepage;
- a SaaS dashboard;
- a dark sci-fi control room;
- an academic database;
- a grid of AI-generated cards.

The target feeling is:

> **A living instrument for understanding how the state of knowledge changes.**

A visitor should perceive, before reading the details, four things that ordinary media rarely expose as first-class visual objects:

1. **STATE** — what is currently supportable;
2. **CHANGE** — what moved relative to the previous state;
3. **EVIDENCE** — what caused that movement;
4. **TIME** — when that state was valid.

The novelty must come from representing knowledge better, not from decorative futurism.

---

# 2. Benchmark — borrow principles, never appearances

Future Edition deliberately combines lessons from several product families.

## Editorial hierarchy — The Verge
Useful principle:
- separate high-impact editorial curation from chronological flow;
- preserve important work longer than a reverse-chronological feed;
- adapt the model on mobile.

Do not copy:
- card shapes;
- color system;
- typography;
- StoryStream aesthetics.

Reference:
https://www.theverge.com/bulletin/914842/the-next-evolution-of-the-verges-homepage-is-here

## Scientific storytelling — Quanta Magazine
Useful principle:
- scientific accuracy and narrative quality can coexist;
- illustration can explain, not merely decorate;
- ambitious digital packages can feel like authored editions rather than templated pages.

Do not copy:
- magazine composition;
- serif identity;
- article styling.

References:
https://www.quantamagazine.org/about/
https://www.quantamagazine.org/quantanews/quanta-wins-2025-national-magazine-award-for-best-single-topic-issue-and-webby-peoples-voice-award/

## Information density — Our World in Data
Useful principle:
- overview first;
- zoom/filter second;
- details on demand;
- search must span different object types;
- data/visualization can be part of navigation itself.

Do not copy:
- chart system;
- topic-page layout;
- brand palette.

References:
https://ourworldindata.org/homepage-redesign
https://ourworldindata.org/owid-entry-redesign
https://ourworldindata.org/introducing-new-search

## Visual journalism — Reuters Graphics
Useful principle:
- the visual can be the argument;
- an explanatory graphic can carry a story rather than illustrate text;
- scale, motion, sequence and comparison can make an abstract change visible.

Do not copy:
- Reuters graphic styles or assets.

## Machine usability — developer documentation products
Useful principle:
- human-readable and machine-usable representations can coexist;
- copying a structured representation should be a first-class action;
- source objects should be directly addressable.

Do not make the media experience look like developer documentation.

---

# 3. Core concept — The Knowledge State Canvas

The canonical Future Edition page is not a stack of cards.

It is a **Knowledge State Canvas** composed of semantic regions.

Every major surface should answer a different question:

- Home: **What changed that matters?**
- Article: **Why did our understanding change?**
- Observatory: **Where are we now and how did we get here?**
- Reality Check: **Does this public claim survive contact with the evidence?**
- Methodology: **Why should I trust the machinery behind this conclusion?**
- Agent view: **Give me the same state as structured, temporal, citable objects.**

This prevents the site from degenerating into one universal component repeated everywhere.

---

# 4. Four proprietary visual primitives

These are the visual DNA of Future Edition.

## 4.1 STATE — State Plate

A State Plate is the visual representation of the current supportable state of a question or claim.

Mandatory contents:
- state label in natural language;
- confidence label;
- `as_of`;
- last material change;
- evidence profile;
- direct path to evidence.

Never display:
- invented percentages;
- arbitrary gauges;
- generic progress rings.

The State Plate may use typography, spatial position and line weight, but the semantic label is always visible.

## 4.2 CHANGE — Delta

The signature object of Future Edition.

A Delta is rendered as:

**BEFORE → EVIDENCE → AFTER**

but not as three generic cards.

Desktop target:
- one continuous visual trajectory;
- BEFORE visually anchored in the past;
- EVIDENCE interrupts the trajectory;
- AFTER becomes the new current state;
- the evidence node is clickable.

Mobile target:
- vertical transition;
- no horizontal squeeze.

A Delta always includes:
- change type;
- event date;
- publication/update time;
- confidence;
- affected question/claim;
- link to proof.

Future Edition should become recognizable through this object.

## 4.3 EVIDENCE — Evidence Spine

Long-form articles use an **Evidence Spine** rather than footnotes as the only proof affordance.

Desktop:
- narrative occupies the reading column;
- a slim adjacent evidence spine contains numbered proof nodes aligned to the paragraphs they support;
- selecting a node reveals source, locator, status, confidence and relation.

Mobile:
- proof nodes collapse inline at the end of the relevant paragraph;
- no persistent side rail.

The spine must not create fake precision: only real claim/evidence relations are visualized.

## 4.4 TIME — Timeglass

Time is navigable.

Where historical states exist, observatories can expose a **Timeglass**:
- NOW / selected `as_of`;
- material change marks;
- corrections/retractions;
- previous approved states.

This is not a decorative timeline.

Selecting a historical point must change the displayed state and make the temporal context unmistakable.

If historical state resolution is not yet implemented, show chronology without an interactive control.

---

# 5. Secondary proprietary primitives

## 5.1 Depth Lens

One canonical scientific object, several reading depths:

- **30 sec** — change, why it matters, confidence;
- **3 min** — Before → Evidence → After, limits, Watch Next;
- **Expert** — claims, evidence, contradictions, methodology;
- **Agent** — structured representation / citation packet.

Changing depth must not change factual truth.

The first FE-06R prototype may implement 30 sec / 3 min / Expert as anchors rather than dynamic filtering. The IA and data model must support the four modes.

## 5.2 Change Lens

A user can conceptually distinguish:
- **Now**
- **Since last visit**
- **History**

"Since last visit" becomes functional only when identity/persistence exists. Before then, the UI must not fake it.

## 5.3 Contradiction Split

When meaningful evidence conflicts:
- do not average it into a single confidence score;
- split the evidence lane visually;
- show what supports, contradicts or limits;
- identify whether the contradiction is unresolved, scoped, or superseded.

## 5.4 Watch Horizon

Every qualified advancement ends with a visually distinct horizon:
- next observable condition;
- expected evidence type;
- what state it could change;
- no predicted date unless supported.

## 5.5 Correction Trail

Corrections are visible objects:
- original statement;
- correction date;
- changed fields;
- reason;
- current statement;
- machine-readable supersession.

A corrected page should feel maintained, not embarrassed.

## 5.6 Agent Dock

An unobtrusive action group for professional/machine users:
- Cite this claim;
- View evidence;
- Structured view;
- Copy machine citation;
- Open change history.

It must never dominate the human reading experience.

---

# 6. The visual language

## 6.1 Emotional direction

Target:
- authoritative;
- intellectually alive;
- calm;
- precise;
- memorable.

Avoid:
- cyberpunk;
- neon overload;
- glassmorphism;
- glowing dashboard widgets;
- generic AI gradients;
- endless rounded cards;
- faux terminal aesthetics.

## 6.2 Light and dark

Future Edition should support both light and dark systems eventually, but the initial signature should not rely on dark mode for perceived sophistication.

Recommended approach:
- editorial surfaces favor a high-contrast paper/ink reading mode;
- evidence and state surfaces can use deeper tonal fields;
- transitions between them become part of the rhythm.

Do not make every section the same background.

## 6.3 Color semantics

Color is semantic, never a decorative score.

Reserved families:
- CURRENT / stable state;
- NEW CHANGE;
- LIMIT / uncertainty;
- CONTRADICTION;
- CORRECTION / RETRACTION;
- historical context.

Rules:
- text label always accompanies semantic color;
- no red/green-only meaning;
- no confidence represented by an arbitrary continuous heatmap.

Exact palette is chosen during visual implementation and accessibility QA.

## 6.4 Typography

Need two functional voices:
- **Display/editorial voice** for headlines and big state changes;
- **Utility/evidence voice** for metadata, claims, locators and machine-facing details.

Requirements:
- excellent French diacritics;
- long-form readability;
- clear numeral differentiation;
- tabular numerals available for data;
- at least 3 obvious hierarchy levels without relying on font size alone.

No "tech mono everywhere".

## 6.5 Grid

Desktop:
- 12-column editorial grid;
- max reading line 65–75 characters;
- evidence rail separate from narrative column;
- full-bleed visualizations allowed when they carry information.

Tablet:
- collapse evidence rail below supported paragraph.

Mobile:
- single narrative column;
- full-width semantic objects;
- 16–24 px side gutters depending on viewport;
- no desktop component simply scaled down.

---

# 7. Navigation design

Novelty should not create a navigation tax.

## Desktop primary navigation

Persistent but visually quiet:

**Aujourd'hui · Observatoires · Reality Check · Ask · Search**

Brand at left.

Utility at right:
- language when enabled;
- profile/follow later;
- Agent Dock entry contextually.

No giant mega-menu in FE-06R.

## Desktop contextual state bar

Below the main header only when useful:

- object type;
- `as_of`;
- last change;
- confidence/status;
- Depth Lens.

This bar changes by surface.

## Mobile navigation

Do not hide the entire product behind a hamburger.

Target:
- compact top bar: brand + search;
- persistent bottom navigation for the five core destinations when ergonomically validated;
- contextual actions inline, not in a secondary maze.

The exact bottom-nav treatment must pass real 360/390 px testing.

## Search

Search is not only document search.

Unified search categories:
- changes/articles;
- questions/observatories;
- claims;
- technologies;
- people/organizations when available;
- sources.

Results should be type-aware, following the principle that different information objects deserve different result treatments.

---

# 8. Home — R1 composition

The Home is an **edition of changes**, not a catalog.

## Zone H0 — Knowledge Clock
Small, quiet:
- edition `as_of`;
- number of qualified material changes in the current window, only if meaningful;
- link to methodology/corrections.

No fake "LIVE" if nothing is live.

## Zone H1 — The Lead Delta
One dominant editorial change.

Composition:
- large authored visual or explanatory graphic;
- headline;
- why it matters;
- compact State Plate;
- full Delta;
- CTA to Article;
- secondary link to proof.

The hero must show the product difference without explaining the company.

## Zone H2 — Change Field
3–6 recent qualified changes with variable editorial weight.

Not uniform cards.
Possible forms:
- text-led;
- image-led;
- miniature delta;
- timeline-led.

## Zone H3 — Reality Check
One strong public claim.
Visual form:
- claim on one side;
- evidence verdict on the other;
- contradiction/limit visibly represented;
- link to full Reality Check.

## Zone H4 — Observatory Motion
Show observatories **because something changed**, not simply because they exist.

Each entry says:
- previous state;
- latest relevant change;
- current state or explicitly unassessed;
- Watch Next.

## Zone H5 — Watch Horizon
What Future Edition is actively watching and the evidence that would matter next.

## Zone H6 — Knowledge Map
A restrained visual of the Future Graph that helps exploration.
Never a decorative constellation.

## Zone H7 — Trust
Methodology, corrections, provenance and machine-access entry points.

---

# 9. Article — R2 composition

The article is a hybrid of narrative and auditable state change.

## Above the fold
- domain / observatory;
- headline;
- deck;
- authored visual;
- date / updated;
- confidence label;
- evidence level;
- `as_of`.

## Signature block
Full-width Delta:
**BEFORE → EVIDENCE → AFTER**

This should be the most recognizable Future Edition object.

## Narrative
Long-form explanation with Evidence Spine.

## Mandatory modules
- Why this matters;
- What this does NOT prove;
- Limits;
- Contradictions, if any;
- Watch Horizon;
- State impact;
- References;
- Corrections/history;
- Dossier de preuve.

## Exit state
The reader leaves with:
1. current conclusion;
2. its confidence;
3. its limits;
4. what evidence would change it.

---

# 10. Observatory — R3 composition

An Observatory is a **state room**, not an article archive.

## O1 — State Header
- canonical question;
- State Plate;
- `as_of`;
- last meaningful change;
- current confidence / unassessed status.

## O2 — State Trajectory
Timeglass or static versioned timeline.

## O3 — Milestone Field
Each milestone:
- criterion;
- status;
- evidence required;
- related changes.

No arbitrary completion percentage.

## O4 — Competing paths
Technologies or approaches shown as distinct trajectories, not ranked unless evidence supports a comparison.

## O5 — Evidence landscape
Support / contradict / limit.

## O6 — Recent Deltas
Material changes only.

## O7 — Watch Horizon
The next evidence that could move the state.

## O8 — Historical baseline
FE-05 events remain accessible but visually separated from current editorial changes.

---

# 11. Reality Check composition

A Reality Check is not a fact-check article with a badge.

It is a **Claim Stress Test**.

Structure:
1. public claim;
2. what would need to be true;
3. evidence for;
4. evidence against / limits;
5. permitted conclusion;
6. excessive conclusion;
7. confidence;
8. temporal validity;
9. sources;
10. Watch Next.

Visual signature:
- the claim is literally traversed by the evidence path;
- unsupported parts visibly fall outside the supported conclusion.

No binary TRUE/FALSE badge unless the evidence genuinely supports a binary conclusion.

---

# 12. Methodology — R4 composition

Methodology should feel like opening the machine.

Avoid a long wall of policy text.

Sections:
- Signal intake;
- Source resolution;
- Evidence extraction;
- Independence/dedup;
- Claim formation;
- Limits/contradictions;
- State resolution;
- Change proposal;
- Human gate;
- Publication;
- correction propagation;
- machine representation.

Use one continuous process visualization with expandable evidence/examples.

Every visual element must correspond to actual architecture.

---

# 13. Motion

Motion explains transitions.

Allowed:
- Before → Evidence → After transition;
- evidence node focus;
- historical state transition;
- correction diff;
- graph relation reveal.

Disallowed:
- ambient parallax;
- floating particles;
- auto-moving charts without explanation;
- infinite marquee merely to appear live.

Respect `prefers-reduced-motion`.

---

# 14. Imagery

Preferred order:
1. original explanatory illustration;
2. original data visualization;
3. scientifically meaningful photo under valid rights;
4. diagram generated from verified structured data.

Avoid generic AI stock imagery.

Any generated scientific illustration must be labeled when there is a risk it could be mistaken for an observed image.

---

# 15. "Never seen" acceptance test

A design is not accepted merely because it is polished.

The reference surfaces must demonstrate at least **three Future Edition-only interaction/representation patterns** from:
- Delta;
- Evidence Spine;
- Timeglass;
- Depth Lens;
- Contradiction Split;
- Watch Horizon;
- Correction Trail;
- Agent Dock.

R1–R4 may not all use the same three.

Independent test:
show anonymized screenshots to at least 5 evaluators familiar with digital media.

Ask:
1. "What is this product helping you understand?"
2. "What is unusual about the way it presents information?"
3. "Does this look primarily like a news site, a dashboard, or something else?"

Pass target:
- ≥4/5 identify change/evidence/state as the purpose;
- ≥4/5 identify at least one proprietary representation without prompting;
- ≤1/5 describe it primarily as a generic news site or SaaS dashboard.

This test measures recognizability, not aesthetic taste.

---

# 16. Non-negotiable rejection conditions

Reject the visual direction if any of these occur:
- Home becomes a uniform card grid;
- novelty depends mainly on gradients/glow/animation;
- evidence is visually subordinate to decoration;
- a progress indicator lacks a real measurable variable;
- historical content looks current;
- article and evidence dossier become visually indistinguishable;
- observatory looks like an analytics dashboard;
- agent affordances dominate ordinary reading;
- mobile is merely desktop stacked vertically;
- more than two reference surfaces share the same dominant page skeleton.

---

# 17. Implementation order

1. Build global shell + navigation.
2. Build the Delta primitive first.
3. Build State Plate.
4. Build R2 Article before further Home polishing.
5. Build Evidence Spine.
6. Rebuild R1 around a real R2 subject.
7. Build R3 Observatory + Time semantics.
8. Build R4 Methodology.
9. Add Reality Check.
10. Validate mobile.
11. Run FE-06R gate.
12. Only then generalize.

## Final rule

> Future Edition should not look futuristic because it uses unusual decoration. It should feel like the future because it lets a reader see how knowledge changes in a way today's media generally hide inside prose.
