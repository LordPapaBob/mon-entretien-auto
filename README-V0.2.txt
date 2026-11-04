# Mon Entretien Auto — fichiers V0.2

Cette archive contient les deux fichiers source à remplacer dans le projet Vite existant :

- `src/main.js`
- `src/style.css`

Le reste du projet (index.html, package.json, vite.config.js, manifest, service worker, icônes) reste inchangé.

## Installation

1. Faire une copie du dossier du projet.
2. Remplacer les deux fichiers dans `src/` par ceux de cette archive.
3. Depuis le dossier du projet :
   ```powershell
   npm.cmd run build
   npm.cmd run dev
   ```

La V0.2 utilise une nouvelle clé de stockage (`mon-entretien-auto-v02`) et démarre avec un garage vide. Les données de démonstration de la V0.1 ne sont pas reprises.

Les photos et documents sont stockés dans IndexedDB. La sauvegarde JSON inclut aussi les fichiers joints.

Le catalogue de silhouettes exactes n'est pas encore fourni : aucun visuel générique n'est utilisé pour éviter de présenter un mauvais modèle comme étant le bon.
