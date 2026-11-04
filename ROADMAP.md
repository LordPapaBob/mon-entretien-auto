# Mon Entretien Auto — Feuille de route

Dernière mise à jour : 4 novembre 2026.

## Rôle de ce document

Conserver les priorités, les idées et leur statut entre les conversations. L'historique des versions, décisions, tests et corrections se trouve dans [JOURNAL_DEVELOPPEMENT.md](JOURNAL_DEVELOPPEMENT.md). Le code local reste la source de vérité technique.

Une idée nouvelle est enregistrée ici sans interrompre la tâche active. Son inscription ne vaut pas décision de développement. Toute priorité ou cible de version encore incertaine doit rester explicitement à décider.

## Cap produit et règles permanentes

- Un carnet automobile gratuit pour ses fonctions personnelles essentielles, simple au premier regard et progressivement plus complet. Budget initial visé : 0 €.
- Identité « Garage moderne » : sombre, anthracite, blanc cassé et touches vert sauge/turquoise ; interface adaptée au smartphone.
- Conserver la PWA Vite, JavaScript natif, HTML et CSS tant qu'un changement n'apporte pas un bénéfice justifié.
- Garage initialement vide ; véhicules et données associés indépendants. Photo personnelle prioritaire ; sinon silhouette générique par carrosserie, explicitement identifiée comme telle. Emplacement neutre si carrosserie absente ou inconnue. Décision du 04/11/2026 : abandon des silhouettes par modèle.
- Conserver dans toutes les versions de test le générateur fictif : 1 ou 5 voitures, badge « FICTIF · TEST », suppression ciblée et nettoyage des données et médias associés en préservant les voitures personnelles.
- Ne pas inventer de périodicités, caractéristiques constructeur ou compatibilités. Distinguer données vérifiées, réglages personnels, témoignages et indications non confirmées.
- Préserver les données et les acquis ; ne pas changer arbitrairement le stockage. Réévaluer les migrations avant l'utilisation durable de vraies données.
- Aucune publication publique ni push sans accord explicite du porteur du projet.

## Fonctionnel et validé

04/11/2026 : silhouettes par carrosserie testées et confirmées fonctionnelles par l'utilisateur. Publication de la version actuelle sur GitHub et GitHub Pages explicitement autorisée dans cette conversation.

04/11/2026 : utilisateur confirme « C'est fonctionnel » pour Détails en consultation puis Éditer en fiche détaillée, après livraison de la synchronisation des données.

Retour utilisateur du 04/11/2026 : « c'est nickel » sur l'enrichissement de la saisie rapide (Note, justificatif et avertissement pour historique ancien). Validation générale de l'évolution ; capture mobile et persistance/ouverture des pièces jointes après rechargement restent à confirmer explicitement.

Validations rapportées dans le texte de reprise, non rejouées dans cette session :

- V0.1 : prototype publié et PWA Android testée.
- V0.2 : affichage, ajout et modification des véhicules, suppression d'un véhicule et retour à un garage entièrement vide.
- V0.2.1 TEST : générateur de véhicules fictifs validé par le porteur du projet. Cela ne valide pas tous les autres modules ni tous les cas de nettoyage des médias.

Validation utilisateur dans cette session, le 4 novembre 2026 : saisie rapide d'une intervention, présence dans l'historique et dans le suivi des dépenses confirmées. Persistance après rechargement, exactitude des montants et absence de doublons restent à vérifier.

## Développé, à tester

Ajout du 04/11/2026 : synchronisation du compteur depuis entretien, dépenses, problèmes et montage/démontage des pneus ; avertissement sur relevé inférieur et conservation du maximum connu. Échéances kilométriques restantes actualisées au rendu. Libellés entretien clarifiés et champ « Note ». Compilation et tests ciblés réussis ; validation utilisateur de ces changements en attente. Le futur suivi des pleins devra réutiliser cette logique.

Modules retrouvés dans le code local le 4 novembre 2026 ; leur présence ne constitue pas une validation fonctionnelle :

- Carnet d'entretien : saisies rapide/détaillée, historique, coût, notes et justificatif ; échéances kilométriques.
- Dépenses, totaux et statistiques ; création d'une dépense liée à une intervention payante.
- Problèmes mécaniques et changement de statut.
- Jeux de pneumatiques.
- Photos personnelles et documents via IndexedDB ; ouverture et suppression des fichiers.
- Export/import JSON avec médias ; intégrité après restauration.
- Persistance après fermeture et réouverture ; comportement mobile, installation PWA et hors connexion.
- Suppression ciblée des véhicules fictifs avec leurs données et médias, sur un garage mêlant véhicules personnels et fictifs.

## En cours

Livraison du 04/11/2026 : V0.2.1 TEST publiée avec autorisation explicite sur https://lordpapabob.github.io/mon-entretien-auto/ ; déploiement GitHub Pages réussi et réponses HTTP 200 confirmées (version, page, nouveau bundle et service worker). Prochaine étape : utilisation et tests Android ; autres modules à poursuivre. Couleur véhicule reportée.

04/11/2026 — 11 silhouettes SVG génériques intégrées : Citadine, Compacte, Berline, Break, SUV, Tout-terrain / 4×4, Pick-up, Monospace, Coupé, Cabriolet et Utilitaire. Photo personnelle prioritaire. Compilation, profils distincts et rendu garage vérifiés ; appréciation visuelle utilisateur en attente.

04/11/2026 — Parcours Détails ajusté : fiche de consultation en lecture seule avec photo/PDF, puis bouton Éditer ouvrant directement tous les champs détaillés. Synchronisation coût/kilométrage/échéances couverte par 18 assertions ; navigation consultation → édition vérifiée dans le navigateur, sans modifier les données utilisateur. Validation utilisateur à poursuivre.

04/11/2026 : utilisateur confirme la persistance après recharge. Ajout de « Détails » par intervention : consultation et modification des champs complets, aperçu photo/PDF intégré, retrait de la flèche d'ouverture directe. Édition avec actualisation de la dépense liée sans doublon ; tests ciblés réussis et aperçu photo observé dans le navigateur. Validation utilisateur de l'enregistrement des modifications en attente.

Retour du 04/11/2026 : écart entre « Distri » (84 562 km) et la Fiat (82 200 km), confirmé puis corrigé. Réconciliation des relevés existants au chargement et neutralisation du cache PWA en développement ; contrôle navigateur : Mon garage affiche désormais 84 562 km. Nouvelle saisie et avertissement de baisse restent à retester.

Reprise locale et constitution des références permanentes : documents créés, inspection initiale et compilation réalisées (voir journal).

**Tâche active : poursuivre le test du carnet d'entretien de la V0.2.1 TEST.** Saisie rapide et présence dans l'historique et les dépenses confirmées par l'utilisateur ; prochaine étape : persistance après rechargement, puis saisie détaillée et échéance kilométrique.

1. Saisie rapide, enregistrement et consultation dans l'historique du bon véhicule.
2. Saisie détaillée : références/notes, coût, kilométrage de référence, intervalles et justificatif.
3. Cohérence des champs et des données après rechargement ; séparation entre véhicules.
4. Échéance kilométrique : référence + intervalle, kilomètres restants et dépassement ; absence d'échéance sans intervalle.
5. Dépense liée : création unique, montant correct et comportement lors de la suppression de l'intervention.

Attention : l'intervalle en mois est enregistré, mais le calcul actuel de `nextDue` utilise les kilomètres uniquement. La suppression d'une intervention conserve actuellement sa dépense liée, avec avertissement explicite.

## À développer prochainement

Aucune nouvelle fonctionnalité n'est engagée à ce stade. Priorité : terminer les tests V0.2.1, consigner les anomalies puis corriger les problèmes constatés. Les prochaines versions seront définies ensemble ; aucune V0.3 n'est engagée automatiquement.

## Idées pour plus tard

| ID | Idée | Orientation et état |
| --- | --- | --- |
| IDEE-01 | Pleins et consommation | Suivi spécifique volontairement reporté ; statistiques par carburant, coût/km et rentabilité à préciser. |
| IDEE-02 | Configurations et modifications | Distinguer carburant d'origine, conversion E85 par boîtier, flexfuel d'origine, GPL et autres modifications ; ne pas présumer d'une homologation. |
| IDEE-03 | Entretien intelligent | Temps + distance + historique + usage ; sources fiables et recommandations clairement qualifiées. |
| IDEE-04 | Données automobiles structurées | Marque, modèle, génération, phase, moteur, configuration ; identification précise à approfondir. |
| IDEE-05 | Communauté | Groupes et retours d'expérience par véhicule/moteur/configuration, recherche structurée, centres d'intérêt et entraide locale distincte des prestations professionnelles. |
| IDEE-06 | Événements automobiles | Rassemblements, salons et rencontres dans Communauté ; carte, filtres géographiques et calendrier possibles. |
| IDEE-07 | Visuels des véhicules | Réalisé le 04/11/2026 : silhouettes génériques par carrosserie, dont Tout-terrain / 4×4 distinct de SUV et Pick-up ; photo personnelle prioritaire. Remplace les silhouettes exactes par modèle. Ressources locales ; validation visuelle utilisateur en attente. |
| IDEE-08 | Lecture intelligente des factures — 04/11/2026 | OCR pour proposer le préremplissage des informations d'entretien depuis une photo ou un PDF. Étudier précision, confidentialité, traitement local et coût ; faire confirmer les champs extraits par l'utilisateur. Idée future, non implémentée. |
| IDEE-09 | Couleur du véhicule — 04/11/2026 | À intégrer plus tard, selon confirmation utilisateur. Le point coloré actuel est un repère visuel, pas une couleur de carrosserie renseignée. |

## À étudier

| ID | Piste | Questions à résoudre avant engagement |
| --- | --- | --- |
| ETUDE-01 | Comparateur d'assurances — idée du 04/11/2026 | Partenariats, données nécessaires, pertinence des estimations, cadre réglementaire et confidentialité ; distinguer indication et devis, signaler les mises en avant rémunérées. |
| ETUDE-02 | Annuaire/comparateur de garages | Carte, filtres, fiches et avis ; accès autorisé aux avis externes, API/licences, modération et séparation publicité/classement indépendant. |
| ETUDE-03 | Comparateur de pièces | Références compatibles vérifiées, sources fournisseurs, prix, affiliation et transparence commerciale. |
| ETUDE-04 | Comptes et synchronisation | Besoin réel, protection des immatriculations et documents, coûts et sauvegardes ; stockage actuellement local. |
| ETUDE-05 | Fiabilisation technique | Médias, sauvegardes, migrations, cache PWA, échéances calendaires et cohérence entretien/dépenses ; prioriser selon les tests. |
| ETUDE-06 | Modèle économique | Services professionnels, référencement sponsorisé, affiliation et partenariats ; préserver le cœur gratuit et la confiance. |

Ces points sont des sujets d'étude, sans conclusion technique, commerciale ou juridique acquise.

## Mise à jour entre les conversations

Lire ce document et le journal au début d'une reprise, puis vérifier les fichiers concernés. Pour chaque idée, conserver une date, un identifiant, son intérêt, son statut et les questions ouvertes. Pour chaque réalisation, inscrire dans le journal les changements, décisions, tests effectivement exécutés et vérifications restantes. Ne déclarer « validé » que le périmètre réellement testé, en indiquant par qui et comment.
