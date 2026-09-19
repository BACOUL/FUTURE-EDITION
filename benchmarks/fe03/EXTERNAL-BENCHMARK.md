# FE-03 external benchmark

## Purpose

The synthetic 240-case corpus only proves safety invariants in code. It cannot prove real-world evidence performance.

The external benchmark must contain at least:

- 100 dev cases;
- 50 validation cases;
- 50 hidden holdout cases;
- 200 total cases.

The public dev+validation corpus is additionally constrained by
`collection-matrix.external.v1.json`. The matrix freezes minimum coverage
across all 17 required case families so the 150 public cases cannot be
satisfied by over-sampling easy categories.

Validate the matrix with:

`node benchmarks/fe03/validate-collection-matrix.mjs`

Validate a completed public corpus with:

`node benchmarks/fe03/validate-external.mjs <dev-validation.json>`

The corpus validator rejects duplicate case IDs, duplicate candidate
identifiers, insufficient family coverage, missing label evidence, and
critical cases without external authority evidence.

## Leakage rule

The holdout is **not stored with labels in the public repository before evaluation**.

Before the final run:

1. create the holdout outside the tuning workspace;
2. run `node benchmarks/fe03/seal-holdout.mjs <file>`;
3. record the SHA-256 and byte length in the evaluation record;
4. do not inspect or tune on holdout labels;
5. consume it once for the final FE-03 verdict.

## Mandatory case families

The external set must include real examples of:

- active peer-reviewed publication;
- preprint;
- corrected publication;
- expression of concern;
- retracted publication;
- retraction notice;
- invalid DOI / missing source;
- animal evidence;
- early human / phase I;
- controlled human evidence;
- systematic review or replication;
- trial registry record;
- dependent media/institutional echoes of one origin;
- genuine contradiction;
- negative result;
- technology benchmark;
- real-world deployment.

## Automatic FAIL conditions

FE-03 fails if a critical hidden case that is known retracted, invalid, unsupported, or animal-only-as-human is promoted to `confirmed`.

See `thresholds.external.v1.json`.
