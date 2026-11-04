# Eval — Créez une évaluation de français

Application autonome combinant Conjugaison, Natures et Récits.

## Sources et indépendance
- Conjugaison : données et algorithmes adaptés depuis `conjugaison`.
- Natures : corpus grammatical depuis `natures/js/data.js`.
- Récits : textes, difficultés et QCM depuis `recits/corpus.json`.
- Aucun fichier des trois dépôts sources n'est modifié par Eval.
- Le workflow de synchronisation copie les corpus dans `data/` ; l'application fonctionne ensuite sans accès aux dépôts sources.

## Mise à jour
Le workflow `sync-corpus.yml` se lance quotidiennement et manuellement. Il contrôle les formats et conserve les fichiers précédents si la validation échoue. Les moteurs restent indépendants, et leurs mises à jour sont contrôlées.

## Confidentialité
Aucun compte, aucune collecte distante des noms ou des résultats. La reprise utilise le stockage local du navigateur.
