# Mon Entretien Auto — V0.1

Prototype PWA personnel, gratuit et sans compte. Les données sont conservées dans le stockage local du navigateur (`localStorage`).

## Fonctionnalités de cette V0.1
- Garage prérempli avec la Dacia Sandero Stepway III 2022 TCe 90 et la Fiat Punto 2012 1.2 FIRE 69 ch équipée d'un boîtier E85.
- Modification des fiches et kilométrages.
- Carnet d'entretien : ajout/suppression d'opérations, date, kilométrage, coût, notes et intervalle kilométrique.
- Module « Coût annuel » : dépenses de carburant, entretien, pneus, réparations, assurance, contrôle technique, financement et autres.
- Dépenses annuelles et totales, répartition par catégorie et comparaison par véhicule.
- Export et import JSON.
- Interface responsive et PWA avec cache de base hors connexion.

## Lancer sur Windows 10

### Prérequis
- Node.js LTS : https://nodejs.org/
- Un navigateur récent (Chrome ou Edge conseillé).

### Installation
1. Décompresser l'archive.
2. Ouvrir PowerShell dans le dossier `mon-entretien-auto-v0.1`.
3. Installer les dépendances :
   ```powershell
   npm install
   ```
4. Démarrer le serveur :
   ```powershell
   npm run dev
   ```
5. Ouvrir l'adresse indiquée par Vite, généralement `http://localhost:5173`.

## Installer sur Android
Pour une première vérification, le téléphone et le PC doivent être sur le même réseau Wi-Fi.
1. Lancer `npm run dev -- --host 0.0.0.0`.
2. Repérer l'adresse réseau locale affichée par Vite, par exemple `http://192.168.1.20:5173`.
3. Ouvrir cette adresse dans Chrome Android.
4. Pour une installation PWA complète, il faut une origine sécurisée (HTTPS ou localhost). En réseau local HTTP, le site fonctionne pour tester mais l'installation PWA et le service worker peuvent être limités. Pour une installation durable gratuite, héberger ensuite le dossier `dist` sur un hébergement statique gratuit proposant HTTPS, ou utiliser un tunnel HTTPS gratuit temporaire pour les essais.
5. Dans Chrome, menu ⋮ > « Installer l'application » ou « Ajouter à l'écran d'accueil » lorsque l'option est proposée.

## Construire la version de production
```powershell
npm run build
npm run preview
```
Le dossier `dist` contient le site prêt à être hébergé.

## Important
- Les données sont locales au navigateur et à l'appareil. Elles ne se synchronisent pas entre appareils.
- Exporter régulièrement un fichier JSON depuis Paramètres > Exporter mes données.
- Cette V0.1 ne récupère pas les préconisations constructeur et n'invente aucune périodicité. Les intervalles sont saisis manuellement.
- Le coût/km affiché est indicatif : total des dépenses saisies divisé par le kilométrage actuel, et non un coût d'usage complet depuis l'origine.
- Les dépenses liées à une opération d'entretien sont ajoutées automatiquement au module de coûts. Une dépense manuelle est indépendante.
- Les notifications, la communauté, la recherche par plaque et les recommandations vérifiées sont hors périmètre de cette première version.
