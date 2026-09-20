# FE-04 — Change Engine contract

## Purpose

FE-04 turns a reviewed evidence update into a traceable milestone transition:

`previous approved assessment -> new evidence -> new approved assessment -> explicit change record`.

Milestone definitions remain immutable. A milestone state is represented only by assessments.

## Mandatory invariants

1. Every human-approved assessment that supersedes another assessment must have exactly one `Change` record.
2. The before and after assessments must target the same milestone.
3. The after assessment must directly supersede the before assessment.
4. The after assessment must be human-approved and its review must approve that exact assessment.
5. A change requires at least one trigger claim and one concrete evidence item.
6. Trigger claims must be part of the after assessment basis.
7. Trigger evidence must belong to a trigger claim.
8. State hashes bind the change record to the exact before/after assessment contents.
9. `change_type` is computed deterministically; it is not free editorial text.
10. Direct mutable `status` fields remain forbidden on milestone definitions.

## Change types

- `none`: new reviewed evidence, no state/confidence movement.
- `minor_progress`: state advances without reaching the milestone.
- `evidence_upgrade`: state is unchanged but confidence increases.
- `milestone_reached`: state advances to `met`.
- `setback`: state or confidence moves backward.
- `invalidation`: new assessment explicitly invalidates the milestone state.

An invalidated milestone cannot be silently reopened.

## FE-04 gate

FE-04 is PROVED only when repository validation demonstrates that an approved superseding assessment cannot exist without a unique, evidence-backed, human-reviewed and hash-bound Change record.
