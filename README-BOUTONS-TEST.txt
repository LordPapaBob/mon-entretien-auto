MON ENTRETIEN AUTO – V0.2.1 TEST
==================================

Cette archive contient le projet SOURCE complet, sans les dépendances
node_modules, sans le dossier dist et sans le dossier .git.

AJOUTS
- Dans « Mon garage », section « OUTILS DE TEST »
- Bouton « 1 voiture aléatoire »
- Bouton « 5 voitures aléatoires »
- Bouton « Supprimer les X tests » (seulement les voitures fictives)
- Badge « FICTIF · TEST » sur les fiches générées
- 25 profils fictifs, modèles, moteurs et carburants variés
- Suppression en cascade des opérations, dépenses, problèmes, pneus,
  documents et médias associés aux seuls véhicules fictifs supprimés
- Les véhicules personnels restent intacts.

INSTALLATION SIMPLE SUR TA V0.2 ACTUELLE
1. Arrêter le serveur Vite avec Ctrl+C (facultatif mais conseillé).
2. Faire une copie de sauvegarde de ton projet actuel.
3. Extraire cette archive dans un dossier temporaire.
4. Copier ces QUATRE fichiers vers ton projet actuel, en conservant
   leurs emplacements et en remplaçant les anciens si demandé :
   - src/main.js
   - src/style.css
   - src/demo-vehicles.js (NOUVEAU fichier)
   - public/sw.js
5. Dans PowerShell à la racine du projet, lancer :
   npm.cmd run build
   npm.cmd run dev
6. Ouvrir http://localhost:5173/mon-entretien-auto/ puis « Mon garage ».

ATTENTION
- NE PAS écraser ton projet avec un dossier vide, ni supprimer
  node_modules, .git ou tes fichiers personnels : remplacer uniquement
  les quatre fichiers listés pour une installation sans surprise.
- Les fiches de démonstration sont fictives et ne doivent pas servir
  à déterminer des caractéristiques constructeur ou un entretien réel.
- Les véhicules de test créés sont enregistrés en stockage local de la V0.2
  et peuvent être supprimés sans toucher aux véhicules personnels.
- Comme avant, les véhicules ne sont pas automatiquement migrés d'une
  version à une autre.
- Les outils de test sont regroupés dans src/demo-vehicles.js pour
  faciliter leur conservation dans TOUTES les futures versions de test.
  Lors d'une refonte future, il faudra conserver l'import, les actions
  et la section de boutons du garage : le fichier seul ne suffit pas.
- Aucune mise en production / GitHub Pages pour le moment.
