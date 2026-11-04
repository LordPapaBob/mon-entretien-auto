# Mon Entretien Auto — Journal de développement

## Usage

Référence permanente des versions, décisions, tests et corrections. Les priorités et idées futures sont dans [ROADMAP.md](ROADMAP.md). Ajouter les nouvelles entrées datées en fin de document ; conserver l'historique et identifier les rectifications. Une compilation réussie ne vaut pas validation fonctionnelle.

## Historique transmis lors de la reprise

Source : texte « PROMPT DE REPRISE INTÉGRALE — PROJET MON ENTRETIEN AUTO » fourni par le porteur du projet le 4 novembre 2026. Les résultats ci-dessous sont rapportés, sauf vérification locale explicitement mentionnée plus bas. Les dates précises des versions ne sont pas établies.

| Version/phase | Réalisations et décisions rapportées | Validation rapportée |
| --- | --- | --- |
| Octobre 2026 | Conception d'un carnet automobile et d'une communauté ; choix ultérieur d'une PWA pour avancer gratuitement. | Contexte produit. |
| V0.1 | Garage avec deux voitures de démonstration, entretien, dépenses, échéances, sauvegarde JSON, responsive et PWA. | Compilation réussie ; publication GitHub Pages et essai d'installation Android. |
| V0.2 | Garage vide personnalisable, photos, entretien rapide/détaillé, problèmes, pneus, dépenses, documents, sauvegardes et accueil synthétique. Suivi des pleins reporté. | Compilation, affichage, ajout/modification/suppression des véhicules et garage vide validés. Autres modules à tester. |
| V0.2.1 TEST | Module séparé de génération de véhicules fictifs, catalogue de 25 profils, boutons 1/5 voitures et suppression ciblée ; badge FICTIF · TEST. | Générateur confirmé fonctionnel par le porteur du projet ; reste de l'application non intégralement validé. |

Version publique historique signalée : [GitHub Pages](https://lordpapabob.github.io/mon-entretien-auto/), V0.1 selon la transmission. L'état distant n'a pas été vérifié. Les V0.2 et V0.2.1 ne sont pas approuvées pour publication.

Les véhicules personnels de référence étaient la Dacia Sandero Stepway III 2022 TCe 90 et la Fiat Punto 2012 1.2 FIRE 69 ch avec boîtier E85. Ils ne doivent pas être ajoutés automatiquement aux nouveaux garages.

## 2026-11-04 — Reprise locale et documents permanents

### Demande et périmètre

Créer `ROADMAP.md` et `JOURNAL_DEVELOPPEMENT.md` dans le projet local après lecture de la transmission et examen de l'existant. Aucun changement du code applicatif ni publication demandé pour cette étape.

### Constats vérifiés sur les fichiers locaux

- Projet accessible : `D:\Projet Mon Entretien Auto\extract\mon-entretien-auto-v0.2` ; dépôt Git, dépendances et répertoire `dist` présents.
- Aucun fichier `AGENTS.md`, `ROADMAP.md` ou `JOURNAL_DEVELOPPEMENT.md` retrouvé lors de la recherche initiale dans l'espace projet.
- `src/main.js` : `APP_VERSION = '0.2.1-test'` ; interface « V0.2.1 TEST ». `package.json` conserve la version historique `0.1.0` : écart documenté, non corrigé.
- Architecture : Vite, JavaScript natif, HTML, CSS ; logique principale dans `src/main.js`, styles dans `src/style.css`, générateur dans `src/demo-vehicles.js`, manifeste et service worker dans `public`.
- `vite.config.js` : base `/mon-entretien-auto/`.
- Garage initial vide ; collections `vehicles`, `services`, `expenses`, `issues`, `tireSets`, `documents` et sélection `activeVehicle`.
- Données structurées : localStorage, clé `mon-entretien-auto-v02`. Médias : IndexedDB, base `mon-entretien-auto-media-v02`, store `files`.
- Générateur : catalogue de 25 profils, reconnaissance par `isDemo === true`, boutons 1/5 voitures et suppression filtrée. Nettoyage associé présent dans le code ; exécution réelle et cas d'erreur médias à tester.
- Entretien : formulaires rapide/détaillé, sauvegarde, historique, justificatif, notes regroupant pièces/références/prestataire ; une dépense avec `linkedServiceId` est créée si le coût est positif.
- `intervalMonths` est enregistré ; `nextDue` calcule une échéance kilométrique à partir de `lastKm + intervalKm`. Pas de calcul calendaire dans cette fonction.
- La suppression d'une intervention conserve sa dépense liée ; la confirmation l'annonce. Comportement à examiner pendant les essais, sans changement décidé à ce stade.
- Cache du service worker : `mea-v021-test-shell` ; comportement hors connexion non testé dans cette session.

### Environnement et vérifications exécutées

| Vérification | Résultat |
| --- | --- |
| `node --version` | `v26.13.0` |
| `npm.cmd --version` | `11.20.0` |
| Dépendances locales | `node_modules` présent ; Vite exécuté en version `6.4.5`. |
| `npm.cmd run build` | Succès : 5 modules transformés, génération de `dist`, 288 ms annoncées par Vite. |
| Inspection des modules | Garage, entretien, dépenses, problèmes, pneus, documents, médias, sauvegardes et générateur retrouvés. |
| Tests interactifs navigateur/mobile/PWA | Non exécutés ; aucune nouvelle validation fonctionnelle annoncée. |

### État Git préexistant

Avant la création des documents, `git status --short` indiquait déjà :

```text
 M index.html
 D manifest.webmanifest
 M public/sw.js
 M src/main.js
 M src/style.css
?? README-BOUTONS-TEST.txt
?? README-V0.2.txt
?? public/manifest.webmanifest
?? src/demo-vehicles.js
```

Ces différences préexistantes ont été conservées. Aucun commit ni push effectué. La compilation a régénéré `dist`, ignoré par Git.

### Livrables et décisions

- Création des deux références à la racine du dépôt applicatif, avec liens réciproques.
- Distinction explicite entre historique transmis, présence du code, compilation et validation fonctionnelle.
- Conservation des idées futures sans engagement automatique de développement ni attribution arbitraire à une V0.3.
- Générateur fictif maintenu comme exigence permanente des versions de test.
- Travail direct sur les fichiers autorisés ; préserver les données, dépendances et configuration Git. Prévoir un point de retour pour les futurs changements significatifs.
- Aucun changement du stockage, de l'architecture ou de la version publique.

### Reprise suivante

Tester le carnet d'entretien selon la séquence de la feuille de route : rapide, détaillé, historique, cohérence, échéances et dépenses liées. Consigner pour chaque essai les données fictives utilisées, le résultat attendu, le résultat observé, le testeur et les anomalies. Continuer ensuite les problèmes, pneus, médias, sauvegardes, persistance, mobile et PWA.

## 2026-11-04 — Validation utilisateur de la saisie rapide

- Environnement : serveur Vite local lancé sur `http://127.0.0.1:5173/mon-entretien-auto/` ; réponse HTTP 200 vérifiée avant l'essai.
- Testeur : porteur du projet, dans le navigateur.
- Scénario proposé : enregistrer une intervention en saisie rapide avec kilométrage et coût, puis consulter l'historique et les dépenses.
- Résultat rapporté : « bien dans historique et dans le suivi des dépenses aussi ».
- Validation acquise : enregistrement de l'intervention rapide, affichage dans l'historique et présence d'une dépense associée. Valeurs exactes et véhicule utilisés non communiqués.
- Non encore validés : persistance après rechargement, exactitude des montants, absence de doublons, saisie détaillée, justificatif et échéances.
- Prochaine étape : recharger pour contrôler la persistance, puis saisir une intervention détaillée avec une échéance kilométrique de test. Aucun changement du code applicatif.

## 2026-11-04 — Compteur partagé et clarification du formulaire

- Demande utilisateur : expliquer les deux kilométrages d'entretien, renommer le champ texte « Note », actualiser le compteur véhicule à partir des opérations et avertir si le relevé diminue.
- Fichier modifié : `src/main.js`. Copie préalable : `.local-backups/main-before-mileage-20261104.js`.
- Libellés : « Compteur lors de l’intervention (km) » et « Point de départ de l’intervalle (km, facultatif) », avec explication du calcul et de la valeur par défaut ; champ texte « Note ».
- Entretien, dépenses, problèmes et pneus actualisent le compteur au maximum connu. Le point de départ personnalisé d'une échéance n'est pas un relevé compteur. Aucun changement des clés de stockage.
- Un relevé inférieur demande confirmation avant enregistrement, permet la saisie historique et conserve le compteur courant. La modification directe de la fiche protège également contre une baisse. Supprimer une opération ne fait pas baisser le compteur.
- Pneus : rejet d'un démontage antérieur au montage en date ou en kilomètres.
- Les échéances kilométriques restantes utilisent déjà le compteur véhicule au rendu : elles se mettent donc à jour après l'enregistrement. Les intervalles choisis et les échéances calendaires ne sont pas modifiés.
- Vérifications : `node --check src/main.js`, compilation Vite réussie ; 8 assertions ciblées sur augmentation 52 360 → 54 865, refus/confirmation d'un relevé inférieur, absence de baisse, champs vides, maximum montage/démontage et rejet d'une valeur négative. Tests exécutés sur les fonctions extraites du fichier réel.
- Validation interactive utilisateur en attente. Essais proposés : intervention à 54 865 km, contrôle fiche/échéance et rechargement, puis ancienne intervention à 50 000 km avec avertissement ; vérifier aussi les pneus.
- Pleins : module toujours reporté, raccordement à prévoir lors de son développement. Pas de recalcul rétroactif des anciennes données à l'ouverture ni migration automatique.

## 2026-11-04 — Correction après essai « Distri »

- Anomalie utilisateur confirmée visuellement : intervention « Distri » à 84 562 km, Fiat 500e encore à 82 200 km dans Mon garage.
- Cause possible identifiée : cache-first du service worker susceptible de servir les anciennes sources Vite. Le serveur HTTP fournissait bien la fonction de mise à jour. Cette hypothèse n'a pas été isolée comme cause unique.
- Correction dans `public/sw.js` : ne pas intercepter les requêtes sur les hôtes locaux. Dans `src/main.js`, ne plus installer le service worker en développement et désinscrire l'ancien pour ce périmètre, puis recharger si nécessaire.
- Ajout au chargement : réconciliation du compteur avec les maximums des relevés déjà enregistrés en entretien, dépenses, problèmes et pneus, sans baisse ni suppression. Cette décision remplace la limite « pas de recalcul rétroactif » de l'entrée précédente. Les clés de stockage restent identiques.
- Vérifications : syntaxe JavaScript et compilation réussies ; rechargement dans le navigateur puis ouverture de Mon garage : Fiat affichée à 84 562 km. Aucun nouvel entretien fictif ajouté pour cette vérification.
- Reste à valider : nouvelle saisie après correction, avertissement sur compteur inférieur et autres parcours interactifs.

## 2026-11-04 — Historique ancien et justificatif en saisie rapide

- Demande : suggérer la date réelle d'une ancienne intervention dans l'avertissement de compteur inférieur ; proposer Note et photo de facture dès la saisie rapide ; conserver l'idée d'OCR pour plus tard.
- `src/main.js` : message de confirmation enrichi, sans changer automatiquement la date. Annuler conserve le formulaire pour corriger la date ; confirmer conserve le compteur maximum.
- Note et justificatif sortis du bloc détaillé et disponibles dans les deux modes. La note est désormais enregistrée aussi en saisie rapide.
- Facture : choix d'une image/PDF ou prise de photo avec caméra arrière sur téléphone compatible (`capture="environment"`). Un seul justificatif ; deux fichiers simultanés déclenchent un message explicite avant stockage. Conservation IndexedDB existante, sans OCR ni traitement d'image de scan.
- Vérifications : `node --check src/main.js` et `npm.cmd run build` réussis. Essais interactifs, ouverture du justificatif après rechargement et caméra mobile à valider par l'utilisateur. Pas d'ouverture de caméra ni d'accès à des fichiers personnels pendant cette modification.
- OCR inscrit dans ROADMAP.md sous IDEE-08, sans développement engagé.

## 2026-11-04 — Retour utilisateur sur la saisie rapide enrichie

- Retour du porteur du projet après livraison : « c'est nickel ».
- Validation générale de l'évolution : avertissement pour historique ancien, Note et justificatif en saisie rapide. Les scénarios et fichiers effectivement utilisés ne sont pas détaillés ; ne pas en déduire une validation exhaustive.
- Restent à vérifier explicitement : capture photo sur téléphone, ouverture du justificatif après rechargement, intégrité export/restauration avec médias.
- Prochaine vérification proposée : persistance de l'intervention, de sa note et ouverture du justificatif après rechargement ; ensuite carnet des problèmes.

## 2026-11-04 — Détails éditables et aperçu du justificatif

- Utilisateur : persistance après rechargement confirmée (« même après recharge c'est fonctionnel »).
- Demande : bouton Détails sur chaque ligne pour consulter et éditer tous les champs, remplacement de la flèche par une visionneuse intégrée.
- `src/main.js` : Détails disponible dans la liste et après filtrage ; formulaire prérempli, tous les champs accessibles, Note et intervalles compris. Conservation du justificatif existant sans remplacement ; aperçu image ou PDF dans la fenêtre. Erreur lisible si pièce manquante.
- Édition conserve l'identifiant de l'entretien, met à jour la dépense liée en conservant son identifiant, évite les doublons et retire la dépense liée si le coût devient nul. Les autres dépenses sont préservées.
- `src/style.css` : place réservée au bouton Détails, aperçu adapté à la fenêtre et liste défilante sur mobile.
- Copie préalable du code : `.local-backups/main-before-service-details-20261104.js`.
- Vérifications : syntaxe et compilation réussies ; 11 assertions dans `.local-backups/verify-service-edit.mjs`, sur les fonctions réelles extraites, couvrent préremplissage, note, justificatif conservé, coût, identifiant de dépense, répétition sans doublon et coût nul.
- Observation navigateur : 4 boutons Détails sans flèche ; fenêtre « le test » avec note existante, champs avancés et aperçu de l'image enregistrée. Aucune donnée utilisateur modifiée pour ce contrôle.
- Restent à valider par l'utilisateur : enregistrer une modification, recharger, vérifier historique et dépense ; remplacement de facture, aperçu PDF et ergonomie mobile.

## 2026-11-04 — Consultation seule puis édition détaillée

- Demande : Détails doit d'abord afficher les informations sans champs éditables ; bouton Éditer pour ouvrir directement la fiche détaillée ; propagation des modifications aux dépenses, véhicule et périodicités.
- `src/main.js` : nouvelle consultation avec liste de valeurs, note, échéance/km restants et justificatif intégré. Boutons Fermer et Éditer. Le filtre entretien conserve ce parcours. L'édition affiche tous les champs sans choix de mode simple.
- Édition : coût et kilométrage répercutés dans la dépense liée ; compteur véhicule mis à jour au maximum connu avec avertissement sur relevé inférieur. Un point de départ qui suivait le kilométrage de l'intervention suit sa correction ; un repère personnalisé différent est conservé. Les échéances kilométriques se recalculent depuis le repère et le compteur. Les échéances calendaires restent non intégrées et sont signalées dans la consultation.
- `src/style.css` : présentation de consultation en deux colonnes, une colonne sur petit écran.
- Vérifications : syntaxe et compilation réussies ; 18 assertions ciblées avec les fonctions réelles pour entretien, dépense, compteur et échéances. Vérification navigateur du parcours « le test » : consultation sans champ éditable, note/photo visibles, bouton Éditer ouvrant directement tous les champs. Aucune modification des données utilisateur enregistrée pendant cette vérification.
- Restent à valider : sauvegarde d'une édition par l'utilisateur et contrôle dans les onglets concernés, rechargement, mobile/PDF.

## 2026-11-04 — Silhouettes par carrosserie

- Validation utilisateur : « C'est fonctionnel » sur le parcours consultation Détails → Éditer précédent.
- Décision produit : remplacer la piste des silhouettes par modèle par des dessins génériques selon la carrosserie. Photo personnelle prioritaire.
- Libellé retenu avec l'utilisateur : « Tout-terrain / 4×4 », distinct de SUV. Pick-up ajouté également.
- Nouveau module `src/vehicle-silhouettes.js` : 11 profils SVG distincts et liste de carrosseries partagée avec le formulaire ; aucune image distante ni dépendance ajoutée. Alias de reconnaissance 4x4, 4×4, Tout-terrain et Pickup.
- `src/main.js` : sélection selon `bodyStyle`, affichage « silhouette générique » et invitation à ajouter une photo ; état neutre pour Autre, carrosserie absente ou inconnue. `photoId` garde la priorité. Ancien texte de silhouette exacte remplacé dans la fiche.
- `src/style.css` : silhouettes sombres avec détails sauge, fond existant et légende, dimensions souples.
- Vérifications : syntaxe et compilation Vite réussies ; 11 SVG distincts, alias et cas neutres vérifiés par import du module réel. Contrôle navigateur et capture visuelle de Mon garage : silhouettes visibles, libellés Citadine, SUV, Berline et Utilitaire dans les véhicules existants. Aucune donnée véhicule modifiée pendant le contrôle.
- À valider : appréciation visuelle utilisateur, choix manuel Tout-terrain / 4×4 et Pick-up, rendu smartphone. Pas de publication ni changement du stockage.

## 2026-11-04 — Préparation de la publication Android autorisée

- Utilisateur : silhouettes testées fonctionnelles ; demande explicite de publier la version actuelle sur GitHub pour Android et de rédiger un court texte vidéo. Autorisation pour cette livraison, sans autorisation permanente de publier.
- Dépôt vérifié : `LordPapaBob/mon-entretien-auto`, sources `main`, site compilé sur `gh-pages`. Têtes initiales : `fe850b5445fc41e41d9ea9bf0c8b6d40af63e3cd` et `8b52a260a45dfa7de63bced8da804fa57992e97d`. Historique conservé.
- Les métadonnées distantes indiquent un déploiement précédent nommé « Correction PWA Android V0.2 » ; l'hypothèse historique d'une V0.1 publique ne suffit donc pas à identifier exactement l'ancienne version hébergée.
- Harmonisation de la version npm à `0.2.1-test`, sans changement des clés de stockage ; README actualisé.
- PWA : script `scripts/prepare-pwa.mjs`, précache JavaScript/CSS/icônes, cache identifié par hash ; navigation en ligne prioritaire avec repli hors connexion, nettoyage limité aux caches `mea-`. Icônes PNG 192/512 ajoutées pour Android d'après l'identité existante.
- `.local-backups` ignoré ; données du navigateur et médias personnels non inclus dans la publication.
- Texte vidéo sauvegardé dans `VIDEO_MISE_A_JOUR_2026-11-04.md`.
- Couleur de carrosserie reportée explicitement par l'utilisateur (IDEE-09).
- Vérifications préparatoires : compilation réussie, 7 ressources précachées, build `900723af0797`, 18 assertions entretien réussies. Publication et vérification à suivre.

## 2026-11-04 — Livraison GitHub Pages confirmée

- Sources publiées sur `main` : commit `a7886b0`.
- Site compilé publié sur `gh-pages` : commit `2c5daca362aefebdabdebcb3f1b9306874617fcb`, build `900723af0797`. Historique préservé, aucun push forcé. Anciens assets compilés non référencés conservés sur la branche de publication.
- Déploiement GitHub Pages : [exécution 41927000034](https://github.com/LordPapaBob/mon-entretien-auto/actions/runs/41927000034), terminé avec succès.
- Vérifications publiques : page et version.json répondent HTTP 200 ; version `0.2.1-test`, nouveau bundle `index-BjXdT9E1.js` et service worker portant le hash du build effectivement servis.
- Site : https://lordpapabob.github.io/mon-entretien-auto/ . Sur Android : ouvrir avec connexion dans Chrome, installer depuis le menu si proposé ; fermer/rouvrir après mise à jour si nécessaire. Aucun effacement des données requis. Les données locales du PC ne sont pas synchronisées vers le téléphone.
- Texte court de présentation vidéo livré dans `VIDEO_MISE_A_JOUR_2026-11-04.md` et dans la réponse de livraison.
- État : publication réalisée ; essais sur appareil Android réel à effectuer par le porteur du projet. Aucune autorisation permanente de publier les versions futures.

## Modèle d'entrée future

```markdown
## AAAA-MM-JJ — Version ou sujet

- Demande et périmètre :
- Changements et fichiers concernés :
- Décisions et motifs :
- Tests exécutés, testeur et résultats observés :
- Corrections et limites restantes :
- Validation utilisateur : acquise sur quel périmètre / en attente.
- Prochaine tâche active et idées transférées dans ROADMAP.md :
```
