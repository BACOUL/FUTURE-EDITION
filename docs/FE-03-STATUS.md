# FE-03 — Status

## Verdict actuel
**IN_PROGRESS — core safety layer proven, external evidence validation not yet proven.**

## Proved dans le noyau

- contrats `Candidate` et `EvidenceDossier` versionnés ;
- normalisation DOI / PMID / NCT / arXiv / bioRxiv / medRxiv ;
- adapters communs : Crossref, PubMed, ClinicalTrials.gov, arXiv, bioRxiv, medRxiv ;
- détection de correction/rétractation dans la normalisation Crossref ;
- classification déterministe du niveau de preuve ;
- séparation source primaire / niveau de preuve ;
- groupes d'indépendance des sources ;
- safety gate explicable ;
- `confirmed` impossible dans la sortie automatisée FE-03 ;
- revue humaine obligatoire ;
- file de revue humaine ;
- pont FE-03 → objets FE-02 en état `machine_proposed` ;
- résolveur avec `fetchFn` injecté pour tests reproductibles ;
- routes réseau préparées pour Crossref, PubMed ESummary, ClinicalTrials.gov v2 et bioRxiv/medRxiv ;
- arXiv réseau échoue explicitement tant que son parseur XML n'est pas gelé.

## Tests exécutés

### Core
`FE03_CORE_TEST_PASS|normalization=1|adapters=6|retraction=1|human_gate=1|contradiction=1|independence=1`

### Contrats
`FE03_CONTRACT_TEST_PASS|candidate=1|dossier=1|fe02_bridge=1`

### Résolveur offline
`FE03_RESOLVER_TEST_PASS|routes=4|offline_fixtures=4|invalid_id=1|network_error=1|arxiv_explicitly_unsupported=1`

### Bridge / revue
`FE03_BRIDGE_TEST_PASS|review_queue=1|fe02_compatible_draft=1|human_gate_preserved=1`

### Corpus synthétique
240 cas : 120 dev / 60 validation / 60 holdout synthétique.

Résultat exact sur le code commité :
- decision accuracy : 100 % ;
- confidence ceiling accuracy : 100 % ;
- false confirmed rate : 0 % ;
- rétractations rejetées : 100 % ;
- préprints non confirmés : 100 %.

## Important

Le corpus synthétique **ne peut pas valider FE-03**. Il verrouille uniquement les invariants de sécurité avant confrontation à des données externes.

## Reste à prouver avant FE-03 PROVED

1. parseur réseau arXiv ;
2. vérification live des statuts/corrections/rétractations sur un corpus réel ;
3. extraction de claims atomiques depuis contenu réel autorisé ;
4. locators vérifiés vers texte/table/résultat ;
5. classification domaine/niveau de preuve sur exemples réels ;
6. benchmark externe curaté d'au moins 200 cas ;
7. séparation dev / validation / holdout externe ;
8. thresholds gelés avant consommation du holdout externe ;
9. mesure résolution source primaire précision/rappel ;
10. mesure claim↔evidence ;
11. mesure indépendance des sources ;
12. **false confirmed rate = 0 sur les cas de sécurité critiques du holdout**.

FE-04 ne doit pas être ouvert avant ce gate.
