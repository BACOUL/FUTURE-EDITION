# Architecture cible

## Principe
Le média visible est une vue du Future Graph. Les articles ne sont jamais la base de vérité.

## Couches

1. **Sources** — publications, registres, institutions, données officielles.
2. **Ingestion** — normalisation, empreinte, horodatage, provenance.
3. **Evidence Engine** — source primaire, statut, claims, preuves, contradictions, limites.
4. **Future Graph** — entités et relations versionnées.
5. **Change Engine** — comparaison avant/après et impact sur les jalons.
6. **Editorial Gate** — validation humaine des changements sensibles.
7. **Publishing** — média statique, RSS, formats de distribution.
8. **Query** — Ask Future Edition et future API.

## Stack FE-01

- Node.js 22+
- **zéro dépendance npm requise pour construire la fondation**
- JSON versionné pour le graphe initial
- générateur statique Node déterministe
- HTML/CSS natif
- GitHub comme historique
- Cloudflare Pages comme cible d’hébergement

## Pourquoi zéro dépendance au socle

FE-01 doit pouvoir être reconstruite hors ligne à partir d’une installation Node standard. Cela :
- supprime le blocage npm/GitHub Actions ;
- réduit la surface supply-chain ;
- améliore la reproductibilité ;
- maintient le coût d’exploitation proche de zéro.

Un framework pourra être introduit plus tard via ADR uniquement si sa valeur dépasse le coût de complexité.

## Contraintes

- Pas de dépendance à GitHub Actions pour le fonctionnement local.
- Pas de base externe obligatoire avant que le volume ne le justifie.
- Pas d’appel IA à chaque page vue.
- Pas d’état scientifique calculé depuis le front-end.
- Les sorties générées doivent pouvoir être reconstruites depuis les données sources du repo.
