# Benchmark Evidence Engine

## But
Évaluer le moteur indépendamment des exemples utilisés pour le développer.

## Corpus minimum avant FE-03 PROVED
Au moins 200 cas répartis entre :
- source primaire solide ;
- préprint présenté abusivement comme confirmé ;
- communiqué marketing amplifié ;
- étude rétractée/corrigée ;
- faux DOI ou référence inexistante ;
- étude animale présentée comme résultat humain ;
- petit essai présenté comme preuve définitive ;
- résultats contradictoires ;
- réplication indépendante ;
- résultats négatifs ;
- copie multiple d’une origine unique.

## Labels de référence
- source tier correcte ;
- source primaire résolue oui/non ;
- statut publication ;
- niveau de preuve ;
- indépendance des sources ;
- claim supporté/non supporté ;
- contradiction détectée ;
- décision publish / hold / reject.

## Séparation
- dev set ;
- validation set ;
- holdout gelé jamais utilisé pour ajuster les règles ;
- cas adversariaux ajoutés après erreurs réelles.

## Métriques
Précision et rappel séparés pour les décisions à risque. Une moyenne globale ne suffit pas.
