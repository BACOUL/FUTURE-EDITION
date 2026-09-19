# Provenance

La provenance est un produit de premier rang.

## Pour chaque source
Conserver :
- identifiant Future Edition ;
- URL canonique ;
- type ;
- auteur/institution si disponible ;
- date de publication ;
- date de récupération/vérification ;
- version ou identifiant externe ;
- DOI/registre si applicable ;
- statut (actif, corrigé, rétracté...) ;
- licence quand connue.

## Pour chaque preuve
Conserver :
- source ;
- locator précis (page, section, tableau, paragraphe ou identifiant de donnée) ;
- relation : supports / contradicts / limits / context ;
- hash d’extrait ou de contenu autorisé lorsque possible ;
- date de vérification.

## Pour chaque claim
Conserver :
- preuves supportant ;
- preuves contradictoires ;
- niveau de confiance ;
- état de revue humaine ;
- historique des modifications.

## Source poisoning
Le nombre de pages répétant une information n’est pas le nombre de preuves indépendantes. Le pipeline doit détecter :
- même communiqué d’origine ;
- même publication primaire ;
- citations circulaires ;
- reprises syndiquées ;
- contenus générés ou résumés depuis la même source.

## Règle
**10 reprises d’une même origine = 1 origine, pas 10 confirmations.**
