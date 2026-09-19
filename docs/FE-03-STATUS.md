# FE-03 — Status

## Verdict actuel
**IN_PROGRESS — core safety layer proven, external evidence validation not yet proven.**

## Proved dans le noyau

- contrats `Candidate` et `EvidenceDossier` versionnés ;
- normalisation DOI / PMID / NCT / arXiv / bioRxiv / medRxiv ;
- adapters communs : Crossref, PubMed, ClinicalTrials.gov, arXiv, bioRxiv, medRxiv ;
- détection de correction/rétractation dans la normalisation Crossref ;
- classification déterministe du niveau de preuve ;
- scope sémantique des claims : in vitro / animal / humain / technologie ;
- rejet explicite animal→claim humain et plafond renforcé pour efficacité phase I ;
- séparation source primaire / niveau de preuve ;
- groupes d'indépendance des sources ;
- safety gate explicable ;
- `confirmed` impossible dans la sortie automatisée FE-03 ;
- revue humaine obligatoire ;
- file de revue humaine ;
- pont FE-03 → objets FE-02 en état `machine_proposed` ;
- contrat `EvidenceDocument` avec périmètre de licence explicite ;
- locators vérifiables `document#section:start-end` avec hash d’extrait ;
- résolveur avec `fetchFn` injecté pour tests reproductibles ;
- routes réseau préparées pour Crossref, PubMed ESummary, ClinicalTrials.gov v2 et bioRxiv/medRxiv ;
- arXiv réseau échoue explicitement tant que son parseur XML n'est pas gelé.

## Tests exécutés

### Crossref integrity semantics
`FE03_CROSSREF_INTEGRITY_PASS|notice_active=1|target_retracted=1|direction_preserved=1|notice_review_gate=1`

La relation `updated-by` détermine le statut du travail consulté ; `update-to` décrit un document qui corrige/rétracte une autre ressource.

### Core
`FE03_CORE_TEST_PASS|normalization=1|adapters=6|retraction=1|human_gate=1|contradiction=1|independence=1`

### Contrats
`FE03_CONTRACT_TEST_PASS|candidate=1|dossier=1|fe02_bridge=1`

### Résolveur offline
`FE03_RESOLVER_TEST_PASS|routes=4|offline_fixtures=4|invalid_id=1|network_error=1|arxiv_explicitly_unsupported=1`

### Bridge / revue
`FE03_BRIDGE_TEST_PASS|review_queue=1|fe02_compatible_draft=1|human_gate_preserved=1`

### Locators
`FE03_LOCATOR_TEST_PASS|verified=1|tamper_rejected=1|wrong_document_rejected=1|bounds_rejected=1`

### Sécurité sémantique
`FE03_SEMANTIC_SAFETY_PASS|animal_to_human_rejected=1|phase1_ceiling=1|technology_scope=1`

### Corpus synthétique
240 cas : 120 dev / 60 validation / 60 holdout synthétique.

Résultat exact sur le code commité :
- decision accuracy : 100 % ;
- confidence ceiling accuracy : 100 % ;
- false confirmed rate : 0 % ;
- rétractations rejetées : 100 % ;
- préprints non confirmés : 100 %.

## Benchmark externe gelé avant holdout

Le protocole externe est maintenant versionné avant consommation du holdout :

- minimum 200 cas réels ;
- ≥100 dev ;
- ≥50 validation ;
- ≥50 holdout caché ;
- holdout absent du repo public avant verdict ;
- scellement SHA-256 + taille avant consommation ;
- seuils `external-v1` gelés avant collecte finale ;
- cas critique faussement `confirmed` = FAIL automatique.

Seuils principaux :
- précision résolution source primaire ≥ 98 % ;
- rappel source primaire ≥ 95 % ;
- précision statut publication ≥ 99 % ;
- précision claim↔evidence ≥ 95 % ;
- précision niveau de preuve ≥ 95 % ;
- précision indépendance des sources ≥ 98 % ;
- false confirmed critique = 0 %.

## Important

Le corpus synthétique **ne peut pas valider FE-03**. Il verrouille uniquement les invariants de sécurité avant confrontation à des données externes.

## Reste à prouver avant FE-03 PROVED

1. parseur réseau arXiv ;
2. vérification live des statuts/corrections/rétractations sur un corpus réel ;
3. extraction de claims atomiques depuis contenu réel autorisé ;
4. locators vérifiés sur corpus réel et sur plusieurs formats documentaires ;
5. classification domaine/niveau de preuve sur exemples réels ;
6. benchmark externe curaté d'au moins 200 cas — protocole prêt, corpus à constituer ;
7. séparation dev / validation / holdout externe — protocole gelé ;
8. exécuter le holdout scellé une seule fois ;
9. mesure résolution source primaire précision/rappel ;
10. mesure claim↔evidence ;
11. mesure indépendance des sources ;
12. **false confirmed rate = 0 sur les cas de sécurité critiques du holdout**.

FE-04 ne doit pas être ouvert avant ce gate.
