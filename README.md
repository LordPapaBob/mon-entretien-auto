# Mon Entretien Auto — V0.2.1 TEST

Application automobile personnelle, gratuite et sans compte : https://lordpapabob.github.io/mon-entretien-auto/

## Version actuelle

- Garage multivéhicules initialement vide, fiches modifiables et photo personnelle.
- Onze silhouettes génériques par carrosserie, dont SUV, Tout-terrain / 4×4 et Pick-up.
- Entretien rapide ou détaillé avec note, facture image/PDF, consultation Détails puis Éditer.
- Compteur partagé entre entretien, dépenses, problèmes et pneus ; avertissement sur relevé inférieur.
- Échéances kilométriques calculées selon les intervalles saisis ; intervalle en mois stocké, calcul calendaire non intégré.
- Dépense liée actualisée lors de l'édition d'une intervention, sans doublon.
- Suivi des problèmes, pneus, dépenses et documents ; export/import JSON avec médias.
- Générateur permanent de voitures fictives, clairement identifiées et supprimables séparément.

Version expérimentale : certains modules et scénarios restent à tester. Aucun diagnostic automatisé ni préconisation constructeur n'est inventé. OCR, suivi des pleins, comptes et communauté ne sont pas intégrés.

## Android

Ouvrir le site HTTPS dans Chrome Android, puis utiliser le menu du navigateur pour l'installer ou l'ajouter à l'écran d'accueil si l'option est proposée. Après une mise à jour, ouvrir avec une connexion puis fermer et rouvrir si nécessaire.

Les données restent locales à chaque appareil et navigateur. Les données du PC ne sont pas automatiquement présentes sur le téléphone. Exporter une sauvegarde avant toute manipulation de données importantes. Le stockage V0.2 utilise mon-entretien-auto-v02 et IndexedDB pour les médias ; aucune migration automatique de V0.1 n'est incluse.

## Développement Windows

Installer : npm.cmd install
Démarrer : npm.cmd run dev
Compiler : npm.cmd run build
Prévisualiser : npm.cmd run preview

Stack : Vite, JavaScript natif, CSS, manifeste PWA et service worker. Base : /mon-entretien-auto/.

La compilation prépare dist, précache les ressources et calcule une version de cache depuis le contenu. La branche main conserve les sources ; gh-pages contient le site compilé. Les sauvegardes locales de développement sont ignorées par Git.

Références : [feuille de route](ROADMAP.md), [journal](JOURNAL_DEVELOPPEMENT.md), [texte vidéo](VIDEO_MISE_A_JOUR_2026-11-04.md).
