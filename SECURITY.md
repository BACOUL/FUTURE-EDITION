# Security Policy

## Principes
- aucun secret ou token dans le repository ;
- les exemples utilisent des valeurs fictives ;
- les dépendances externes doivent être minimisées ;
- le contenu récupéré du web est traité comme non fiable ;
- aucun HTML externe n'est injecté sans sanitation ;
- les pipelines futurs doivent limiter taille, type et provenance des téléchargements.

## Signalement
Le canal public de signalement sera défini avant lancement. En attendant, ne publiez pas de vulnérabilité sensible dans une issue publique.

## Menaces spécifiques
- prompt injection dans les contenus sources ;
- données falsifiées ;
- documents malveillants ;
- SSRF via URLs candidates ;
- supply-chain de dépendances ;
- exfiltration de secrets lors des futures automatisations.

Ces menaces doivent être couvertes avant l'automatisation autonome.
