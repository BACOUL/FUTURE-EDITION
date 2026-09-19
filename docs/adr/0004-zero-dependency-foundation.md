# ADR-0004 — Zero-dependency foundation

**Décision :** FE-01 utilise Node.js natif pour valider les données, construire le Future Graph et générer le média statique.

**Contexte :** l’environnement de vérification ne pouvait pas résoudre GitHub/npm. La dépendance à Astro empêchait donc de prouver un build pourtant conceptuellement simple.

**Pourquoi :**
- reproductibilité hors ligne ;
- coût zéro ;
- surface supply-chain minimale ;
- pas de dépendance aux GitHub Actions ;
- le contenu V1 ne requiert pas de runtime applicatif.

**Conséquence :** Astro est retiré du chemin critique. Un framework pourra être réintroduit dans un stage futur par ADR s’il devient réellement utile.
