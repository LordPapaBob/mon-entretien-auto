import './style.css';
import { isDemoVehicle, makeDemoVehicles } from './demo-vehicles.js';
import { BODY_STYLES, genericSilhouette } from './vehicle-silhouettes.js';

const STORAGE_KEY = 'mon-entretien-auto-v02';
const DB_NAME = 'mon-entretien-auto-media-v02';
const DB_STORE = 'files';
const APP_VERSION = '0.2.1-test';

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const money = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(n || 0));
const num = n => new Intl.NumberFormat('fr-FR').format(Number(n || 0));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel = d => d ? new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR') : 'Date non renseignée';

const seed = {
  vehicles: [],
  services: [],
  expenses: [],
  issues: [],
  tireSets: [],
  documents: [],
  activeVehicle: null
};

let state = loadState();
let page = 'dashboard';
let toastTimer;
let mediaDbPromise;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seed);
    const data = JSON.parse(raw);
    const next = { ...structuredClone(seed), ...data };
    for (const key of ['vehicles','services','expenses','issues','tireSets','documents']) {
      if (!Array.isArray(next[key])) next[key] = [];
    }
    // Rattraper aussi les relevés enregistrés avant la synchronisation du compteur.
    for (const v of next.vehicles) {
      const readings = ['services', 'expenses', 'issues'].flatMap(key => next[key].filter(x => x.vehicleId === v.id).map(x => x.mileage));
      readings.push(...next.tireSets.filter(x => x.vehicleId === v.id).flatMap(x => [x.mountedKm, x.removedKm]));
      const valid = [v.mileage, ...readings].filter(x => x !== '' && x != null).map(Number).filter(x => Number.isFinite(x) && x >= 0);
      if (valid.length) v.mileage = Math.max(...valid);
    }
    if (!next.vehicles.some(v => v.id === next.activeVehicle)) next.activeVehicle = next.vehicles[0]?.id || null;
    return next;
  } catch {
    return structuredClone(seed);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const el = document.querySelector('#save-status');
  if (el) el.textContent = 'Enregistré sur cet appareil';
}

function vehicle(id = state.activeVehicle) {
  return state.vehicles.find(v => v.id === id) || null;
}

// Un relevé historique ne fait jamais reculer le compteur courant.
function confirmMileage(vehicleId, readings) {
  const v = vehicle(vehicleId);
  if (!v) return false;
  const values = readings.filter(x => x !== '' && x != null).map(Number);
  if (values.some(x => !Number.isFinite(x) || x < 0)) throw new Error('Le kilométrage doit être un nombre positif ou nul.');
  if (v.mileage != null && values.some(x => x < Number(v.mileage))) {
    return confirm(`Un kilométrage saisi est inférieur au dernier compteur connu (${num(v.mileage)} km).\n\nVérifiez la saisie. Pour compléter l’historique du véhicule avec une ancienne intervention, renseignez sa date réelle dans le champ Date. Choisissez Annuler pour corriger cette date avant d’enregistrer.\n\nSi la date et le kilométrage sont corrects, vous pouvez conserver cette ancienne opération : le compteur du véhicule ne diminuera pas.\n\nEnregistrer malgré cet avertissement ?`);
  }
  return true;
}

function updateVehicleMileage(vehicleId, readings) {
  const v = vehicle(vehicleId);
  const values = readings.filter(x => x !== '' && x != null).map(Number).filter(x => Number.isFinite(x) && x >= 0);
  if (!v || !values.length) return;
  v.mileage = Math.max(v.mileage == null ? 0 : Number(v.mileage), ...values);
}

function openMediaDb() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB indisponible'));
  if (!mediaDbPromise) {
    mediaDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return mediaDbPromise;
}

async function storeFile(file) {
  const db = await openMediaDb();
  const id = uid();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put({ id, blob: file, name: file.name || 'document', type: file.type || 'application/octet-stream', size: file.size || 0 });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return id;
}

async function getStoredFile(id) {
  if (!id) return null;
  const db = await openMediaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteStoredFile(id) {
  if (!id) return;
  try {
    const db = await openMediaDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('Suppression du média impossible', error);
  }
}

async function fileDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

function showToast(message) {
  const el = document.querySelector('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function icon(name) {
  const paths = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    car:'<path d="M5 17h14l1.5-6-2-5h-13l-2 5L5 17Z"/><path d="M3.5 11h17M7 17v2m10-2v2"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>',
    wrench:'<path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a5 5 0 0 0 6.4-6.4L14 12l-3-3 3.7-2.7Z"/>',
    wallet:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 8h18m-5 6h5"/><circle cx="16" cy="14" r=".7"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    gauge:'<path d="M4 19a8 8 0 1 1 16 0"/><path d="m12 13 4-4"/><path d="M7 19h10"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7 1.5-.9.3-1.8h2.8l.3 1.8 1.5.9 1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z"/>',
    close:'<path d="m18 6-12 12M6 6l12 12"/>',
    alert:'<path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>',
    file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8m-8 4h8"/>',
    tire:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5m0 8v5M3 12h5m8 0h5"/>',
    bug:'<path d="M12 8v13m-6-6h12M6 9l-2-2m14 2 2-2M5 13H2m20 0h-3M7 4l2 3m8-3-2 3"/><rect x="7" y="7" width="10" height="14" rx="5"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.car}</svg>`;
}

const NAV = [
  ['dashboard','Accueil','grid'],
  ['garage','Mon garage','car'],
  ['maintenance','Entretien','wrench'],
  ['issues','Problèmes','alert'],
  ['tires','Pneumatiques','tire'],
  ['costs','Dépenses','wallet'],
  ['documents','Documents','file']
];

function navItem(id, label, ico) {
  return `<button class="nav-item ${page===id?'active':''}" data-page="${id}">${icon(ico)}<span>${label}</span></button>`;
}

function appShell() {
  const labels = Object.fromEntries(NAV.map(([id,label]) => [id,label]));
  labels.settings = 'Paramètres';
  document.querySelector('#app').innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">MEA<span>+</span></div><div><b>MON ENTRETIEN</b><small>AUTO</small></div></div>
        <div class="side-label">ESPACE PERSONNEL</div>
        <nav>${NAV.map(([id,label,ico]) => navItem(id,label,ico)).join('')}</nav>
        <div class="sidebar-bottom">
          <div class="offline-pill"><span></span> Fonctionne hors connexion</div>
          ${navItem('settings','Paramètres','settings')}
          <div class="profile-mini"><div class="avatar">MEA</div><div><b>Mon espace</b><small>Version ${APP_VERSION} · Démo</small></div></div>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="mobile-brand"><div class="brand-mark">MEA<span>+</span></div><b>MON ENTRETIEN AUTO</b></div>
          <div class="breadcrumb"><span>MON ENTRETIEN AUTO</span><i>/</i><b>${labels[page] || 'Accueil'}</b></div>
          <div class="top-actions"><span class="saved" id="save-status">Stockage local</span><button class="icon-button" data-page="settings" aria-label="Paramètres">${icon('settings')}</button></div>
        </header>
        <section class="content" id="content">${renderPage()}</section>
        <nav class="mobile-nav">
          ${navItem('dashboard','Accueil','grid')}
          ${navItem('garage','Garage','car')}
          ${navItem('maintenance','Entretien','wrench')}
          ${navItem('costs','Dépenses','wallet')}
          <button class="nav-item" data-more-nav="1">${icon('grid')}<span>Plus</span></button>
        </nav>
      </main>
    </div>
    <div id="toast" class="toast" role="status"></div>
    <div id="modal-root"></div>
    <div id="more-nav-root"></div>`;
  bindGlobal();
}

function silhouetteFor(v) {
  return genericSilhouette(v.bodyStyle);
}

function vehicleArt(v, compact = false) {
  const cls = compact ? 'car-art compact' : 'car-art';
  if (v.photoId) {
    return `<div class="${cls} vehicle-photo" data-photo-id="${esc(v.photoId)}"><div class="photo-loading">Chargement de la photo…</div></div>`;
  }
  const silhouette = silhouetteFor(v);
  if (silhouette) return `<div class="${cls} silhouette-art"><div class="art-glow"></div>${silhouette.svg}<div class="silhouette-caption"><b>${esc(silhouette.type)} · silhouette générique</b><small>Personnalisez avec une photo de votre véhicule</small></div></div>`;
  return `<div class="${cls} no-vehicle-art"><div class="art-glow"></div><div class="vehicle-placeholder">${icon('car')}<b>Votre véhicule</b><small>Choisissez une carrosserie ou ajoutez votre photo</small></div></div>`;
}

function cardVehicle(v) {
  const mileage = v.mileage == null ? 'Kilométrage à renseigner' : `${num(v.mileage)} km`;
  const next = nextDue(v.id);
  return `<article class="vehicle-card">
    ${vehicleArt(v)}
    <div class="vehicle-card-body">
      <div class="vehicle-title-row"><div><span class="eyebrow">${esc(v.make)} · ${v.year || 'Année inconnue'}</span>${isDemoVehicle(v) ? '<span class="demo-badge">FICTIF · TEST</span>' : ''}<h3>${esc(v.model)}</h3><p>${esc(v.engine || 'Motorisation non renseignée')} · ${esc(v.power || 'Puissance inconnue')}</p></div><span class="vehicle-dot" style="background:${esc(v.color || '#48b5a2')}"></span></div>
      <div class="vehicle-meta"><span>${icon('gauge')} ${mileage}</span><span>⛽ ${esc(v.fuel || 'Carburant non renseigné')}</span></div>
      <div class="vehicle-footer"><span class="status-text">${next ? esc(next.label) : 'Aucune échéance renseignée'}</span><button class="text-button" data-edit-vehicle="${v.id}">Voir la fiche ${icon('chevron')}</button></div>
    </div>
  </article>`;
}

function nextDue(vehicleId) {
  const v = vehicle(vehicleId);
  if (!v) return null;
  const candidates = state.services.filter(s => s.vehicleId === vehicleId && s.intervalKm && s.lastKm != null);
  if (!candidates.length) return null;
  const sorted = candidates.map(s => {
    const dueKm = Number(s.lastKm) + Number(s.intervalKm);
    const remaining = v.mileage == null ? null : dueKm - Number(v.mileage);
    return { s, dueKm, remaining };
  }).sort((a,b) => (a.remaining ?? Infinity) - (b.remaining ?? Infinity));
  const x = sorted[0];
  if (x.remaining == null) return { label:`Échéance à ${num(x.dueKm)} km` };
  return { label:x.remaining <= 0 ? `${x.s.name} · en retard` : `${x.s.name} · dans ${num(x.remaining)} km` };
}

function emptyBlock(title, text, action = '', label = '') {
  return `<div class="empty-state"><div class="empty-illustration">✦</div><h3>${title}</h3><p>${text}</p>${action ? `<button class="primary-button" data-action="${action}">${icon('plus')} ${label}</button>` : ''}</div>`;
}

function renderDashboard() {
  const totalSpent = state.expenses.reduce((a,e)=>a+Number(e.amount||0),0);
  const currentYear = new Date().getFullYear();
  const annual = state.expenses.filter(e => (e.date||'').startsWith(String(currentYear))).reduce((a,e)=>a+Number(e.amount||0),0);
  const openIssues = state.issues.filter(i => i.status !== 'Résolu').length;
  const dueItems = state.vehicles.flatMap(v => {
    const due = nextDue(v.id);
    return due ? [{ vehicle:v, due }] : [];
  });
  return `<div class="page-heading"><div><div class="eyebrow">VOTRE ESPACE AUTOMOBILE</div><h1>Votre garage,<br><em>en un coup d’œil.</em></h1><p class="subheading">L'essentiel de vos véhicules, de leur entretien et de leur suivi au même endroit.</p></div><button class="primary-button" data-action="${state.vehicles.length ? 'add-service' : 'add-vehicle'}">${icon('plus')} ${state.vehicles.length ? 'Enregistrer une opération' : 'Ajouter un véhicule'}</button></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon teal">🚘</div><span>Véhicules suivis</span><strong>${state.vehicles.length.toString().padStart(2,'0')}</strong><small>Dans votre garage</small></div>
      <div class="stat-card"><div class="stat-icon orange">🔧</div><span>Problèmes ouverts</span><strong>${openIssues.toString().padStart(2,'0')}</strong><small>À surveiller ou diagnostiquer</small></div>
      <div class="stat-card"><div class="stat-icon blue">€</div><span>Dépenses ${currentYear}</span><strong>${money(annual)}</strong><small>${money(totalSpent)} au total enregistré</small></div>
    </div>
    <div class="section-heading"><div><span class="eyebrow">VOTRE PARC AUTOMOBILE</span><h2>Mon garage <span class="count">${state.vehicles.length}</span></h2></div><button class="text-button" data-page="garage">Gérer mes véhicules ${icon('chevron')}</button></div>
    ${state.vehicles.length ? `<div class="vehicle-grid">${state.vehicles.slice(0,4).map(cardVehicle).join('')}</div>` : emptyBlock('Votre garage est prêt à accueillir votre première voiture','Ajoutez un véhicule pour commencer. Vous pourrez ensuite suivre son entretien, ses problèmes et ses dépenses.','add-vehicle','Ajouter mon premier véhicule')}
    <div class="lower-grid">
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">À SURVEILLER</span><h3>Prochaines échéances</h3></div><span class="panel-icon">◷</span></div>
        ${dueItems.length ? dueItems.slice(0,5).map(x=>`<div class="list-row"><div class="row-icon">🔧</div><div class="row-main"><b>${esc(x.due.label)}</b><small>${esc(x.vehicle.make)} ${esc(x.vehicle.model)}</small></div></div>`).join('') : `<div class="empty-state compact-empty"><b>Aucune échéance calculée</b><p>Ajoutez une intervention avec un intervalle fiable pour suivre les prochains entretiens.</p></div>`}
      </section>
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">SUIVI BUDGÉTAIRE</span><h3>Vos dépenses</h3></div><span class="panel-icon">€</span></div><div class="cost-highlight"><strong>${money(totalSpent)}</strong><span>Dépenses enregistrées</span></div><div class="mini-bars">${state.vehicles.map(v=>{const val=state.expenses.filter(e=>e.vehicleId===v.id).reduce((a,e)=>a+Number(e.amount||0),0);return `<div class="mini-bar-row"><span>${esc(v.make)}</span><div class="bar-track"><i style="width:${totalSpent?Math.max(3,val/totalSpent*100):3}%;background:${esc(v.color||'#48b5a2')}"></i></div><b>${money(val)}</b></div>`}).join('')}</div><button class="secondary-button full" data-page="costs">Voir les dépenses ${icon('chevron')}</button></section>
    </div>`;
}

function renderGarage() {
  const demoCount = state.vehicles.filter(isDemoVehicle).length;
  return `<div class="page-heading"><div><div class="eyebrow">VOS VÉHICULES</div><h1>Mon <em>garage.</em></h1><p class="subheading">Chaque véhicule possède son propre historique et ses propres informations.</p></div><button class="primary-button" data-action="add-vehicle">${icon('plus')} Ajouter un véhicule</button></div>
    <section class="demo-tools" aria-label="Outils de test du garage">
      <div class="demo-tools-intro"><span class="eyebrow">OUTILS DE TEST · VERSIONS BÊTA</span><h2>Peupler le garage en un clic <span class="demo-count">${demoCount} fictif${demoCount > 1 ? 's' : ''}</span></h2><p>Crée des voitures de démonstration variées, clairement identifiées. Elles sont enregistrées localement comme les autres véhicules.</p></div>
      <div class="demo-tools-actions">
        <button type="button" class="secondary-button" data-action="demo-add-one">${icon('plus')} 1 voiture aléatoire</button>
        <button type="button" class="secondary-button" data-action="demo-add-five">${icon('plus')} 5 voitures aléatoires</button>
        <button type="button" class="ghost-button" data-action="demo-clear" ${demoCount ? '' : 'disabled'}>Supprimer les ${demoCount} tests</button>
      </div>
    </section>
    ${state.vehicles.length ? `<div class="vehicle-grid garage-grid">${state.vehicles.map(v=>`<div class="garage-card-wrap">${cardVehicle(v)}<div class="garage-actions"><button class="secondary-button" data-edit-vehicle="${v.id}">Modifier la fiche</button><button class="ghost-button" data-delete-vehicle="${v.id}">Supprimer</button></div></div>`).join('')}</div>` : emptyBlock('Votre garage est vide','Aucun véhicule n’est enregistré. Vous pouvez en ajouter un à tout moment, ou utiliser les autres espaces de l’application.','add-vehicle','Ajouter un véhicule')}`;
}

function serviceRow(s) {
  return `<div class="table-row"><div class="operation-name"><span class="operation-icon">${s.category==='Pneumatiques'?'🛞':s.category==='Freinage'?'🛑':'🔧'}</span><div><b>${esc(s.name)}</b><small>${esc(s.category||'Entretien')}${s.attachmentId?' · pièce jointe':''}</small></div></div><span class="table-vehicle">${esc(vehicle(s.vehicleId)?.make || '—')}</span><span>${dateLabel(s.date)}</span><span>${s.mileage!=null?num(s.mileage)+' km':'—'}</span><b>${money(s.cost)}</b><span class="row-tools"><button class="text-button" data-edit-service="${s.id}">Détails</button><button class="row-delete" title="Supprimer" data-delete-service="${s.id}">×</button></span></div>`;
}

function renderMaintenance() {
  const rows = state.services.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return `<div class="page-heading"><div><div class="eyebrow">SUIVI MÉCANIQUE</div><h1>Carnet <em>d’entretien.</em></h1><p class="subheading">Une saisie rapide pour noter l'essentiel, ou détaillée pour conserver toutes les informations.</p></div><button class="primary-button" data-action="add-service">${icon('plus')} Ajouter une opération</button></div>
    <div class="filter-strip"><span class="filter-label">Véhicule</span><select id="service-filter" class="select-control"><option value="all">Tous les véhicules</option>${state.vehicles.map(v=>`<option value="${v.id}">${esc(v.make)} ${esc(v.model)}</option>`).join('')}</select><span class="results-count">${rows.length} opération(s)</span></div>
    <section class="panel table-panel"><div class="table-head"><span>OPÉRATION</span><span>VÉHICULE</span><span>DATE</span><span>KILOMÉTRAGE</span><span>COÛT</span><span></span></div><div id="service-rows">${rows.length ? rows.map(serviceRow).join('') : emptyBlock('Votre historique commence ici','Enregistrez votre première vidange, un changement de pneus ou une réparation.','add-service','Ajouter une opération')}</div></section>`;
}

function renderIssues() {
  const open = state.issues.filter(i=>i.status!=='Résolu');
  const closed = state.issues.filter(i=>i.status==='Résolu');
  const row = i => `<article class="issue-card"><div class="issue-top"><span class="status-pill ${i.status==='Résolu'?'resolved':i.status==='En réparation'?'working':'pending'}">${esc(i.status)}</span><span class="muted">${dateLabel(i.date)}</span></div><h3>${esc(i.title)}</h3><p>${esc(i.description || 'Aucune description complémentaire.')}</p><div class="issue-meta"><span>${esc(vehicle(i.vehicleId)?.make || 'Véhicule supprimé')} ${esc(vehicle(i.vehicleId)?.model || '')}</span><span>${i.mileage != null ? num(i.mileage)+' km' : 'Kilométrage non renseigné'}</span></div><div class="card-actions">${i.attachmentId?`<button class="ghost-button" data-open-media="${i.attachmentId}">Voir la pièce jointe</button>`:''}<button class="secondary-button" data-edit-issue="${i.id}">Modifier / suivi</button><button class="ghost-button" data-delete-issue="${i.id}">Supprimer</button></div></article>`;
  return `<div class="page-heading"><div><div class="eyebrow">OBSERVATIONS ET DIAGNOSTICS</div><h1>Problèmes <em>mécaniques.</em></h1><p class="subheading">Notez un bruit, un voyant ou un comportement inhabituel, puis suivez sa résolution.</p></div><button class="primary-button" data-action="add-issue">${icon('plus')} Signaler un problème</button></div>
    <div class="section-heading"><div><span class="eyebrow">SUIVI EN COURS</span><h2>À traiter <span class="count">${open.length}</span></h2></div></div>
    ${open.length ? `<div class="issue-grid">${open.map(row).join('')}</div>` : emptyBlock('Aucun problème en cours','Les nouveaux symptômes pourront être consignés ici.')}
    ${closed.length ? `<div class="section-heading section-spaced"><div><span class="eyebrow">HISTORIQUE</span><h2>Problèmes résolus <span class="count">${closed.length}</span></h2></div></div><div class="issue-grid">${closed.map(row).join('')}</div>` : ''}`;
}

function renderTires() {
  const sets = state.tireSets.slice().sort((a,b)=>(b.mountedOn||'').localeCompare(a.mountedOn||''));
  const row = t => `<article class="tire-card"><div class="tire-card-head"><span class="tire-icon">${icon('tire')}</span><span class="status-pill ${t.status==='Monté'?'working':'pending'}">${esc(t.status || 'Stocké')}</span></div><h3>${esc(t.brand)} ${esc(t.model)}</h3><p>${esc(t.vehicleLabel || (vehicle(t.vehicleId)?.make+' '+vehicle(t.vehicleId)?.model) || 'Véhicule')}</p><div class="tire-specs"><span>${esc(t.size || 'Dimensions inconnues')}</span><span>${esc(t.season || 'Saison non renseignée')}</span><span>${esc(t.position || 'Position non renseignée')}</span></div><div class="tire-detail"><span>Montage : ${dateLabel(t.mountedOn)}</span><span>${t.mountedKm != null ? num(t.mountedKm)+' km' : 'Km inconnu'}</span></div><div class="tire-detail"><span>Usure : ${t.tread ? esc(t.tread)+' mm' : 'Non mesurée'}</span><span>${t.cost ? money(t.cost) : 'Coût inconnu'}</span></div><div class="card-actions"><button class="secondary-button" data-edit-tire="${t.id}">Modifier</button><button class="ghost-button" data-delete-tire="${t.id}">Supprimer</button></div></article>`;
  return `<div class="page-heading"><div><div class="eyebrow">SUIVI DES PNEUMATIQUES</div><h1>Mes <em>pneus.</em></h1><p class="subheading">Conservez l'historique des montages, dimensions, saisons et mesures d'usure.</p></div><button class="primary-button" data-action="add-tire">${icon('plus')} Ajouter un jeu de pneus</button></div>
    ${sets.length ? `<div class="tire-grid">${sets.map(row).join('')}</div>` : emptyBlock('Aucun jeu de pneus enregistré','Ajoutez vos pneus actuels ou un ancien jeu pour commencer à suivre leur durée de vie.','add-tire','Ajouter un jeu de pneus')}
    <p class="form-hint page-note">Les mesures et informations sont déclaratives. L'application ne déduit pas l'état légal d'un pneu à partir de données incomplètes.</p>`;
}

function renderCosts() {
  const sum = state.expenses.reduce((a,e)=>a+Number(e.amount||0),0);
  const year = new Date().getFullYear();
  const yearSum = state.expenses.filter(e=>(e.date||'').startsWith(String(year))).reduce((a,e)=>a+Number(e.amount||0),0);
  const categories = ['Entretien','Pneumatiques','Réparation','Assurance','Contrôle technique','Financement','Stationnement','Péage','Autre'];
  const totals = categories.map(c=>({name:c,total:state.expenses.filter(e=>e.category===c).reduce((a,e)=>a+Number(e.amount||0),0)})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
  const max = Math.max(1,...totals.map(x=>x.total));
  return `<div class="page-heading"><div><div class="eyebrow">BUDGET AUTOMOBILE</div><h1>Ce que vous coûte <em>votre auto.</em></h1><p class="subheading">Suivez les dépenses liées à vos véhicules. Le suivi des pleins et de la consommation arrivera dans une prochaine version.</p></div><button class="primary-button" data-action="add-expense">${icon('plus')} Ajouter une dépense</button></div>
    <div class="stats-grid cost-stats"><div class="stat-card"><div class="stat-icon blue">€</div><span>Total enregistré</span><strong>${money(sum)}</strong><small>Toutes périodes confondues</small></div><div class="stat-card"><div class="stat-icon teal">📅</div><span>Dépenses en ${year}</span><strong>${money(yearSum)}</strong><small>Année civile en cours</small></div><div class="stat-card"><div class="stat-icon orange">🧾</div><span>Transactions</span><strong>${state.expenses.length}</strong><small>Dépenses saisies</small></div></div>
    <div class="cost-layout"><section class="panel"><div class="panel-heading"><div><span class="eyebrow">RÉPARTITION</span><h3>Dépenses par catégorie</h3></div></div>${totals.length?totals.map(t=>`<div class="category-line"><div><b>${esc(t.name)}</b><strong>${money(t.total)}</strong></div><div class="bar-track"><i style="width:${t.total/max*100}%"></i></div></div>`).join(''):emptyBlock('Pas encore de dépenses','Ajoutez vos dépenses pour voir leur répartition.')}</section>
    <section class="panel"><div class="panel-heading"><div><span class="eyebrow">PAR VÉHICULE</span><h3>Comparatif du garage</h3></div></div>${state.vehicles.length ? state.vehicles.map(v=>{const total=state.expenses.filter(e=>e.vehicleId===v.id).reduce((a,e)=>a+Number(e.amount||0),0);const km=v.mileage;return `<div class="vehicle-cost"><div class="vehicle-cost-top"><span class="vehicle-dot" style="background:${esc(v.color||'#48b5a2')}"></span><b>${esc(v.make)} ${esc(v.model)}</b><strong>${money(total)}</strong></div><small>${km?`${money(total/Math.max(1,km))} / km sur la base du kilométrage actuel`:'Renseignez le kilométrage pour calculer un coût/km indicatif'}</small></div>`}).join('') : `<p class="panel-copy">Ajoutez un véhicule pour comparer les coûts.</p>`}</section></div>
    <section class="panel expense-table"><div class="panel-heading"><div><span class="eyebrow">HISTORIQUE FINANCIER</span><h3>Dernières dépenses</h3></div></div>${state.expenses.length?`<div class="expense-list">${state.expenses.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(e=>`<div class="expense-row"><div class="row-icon">€</div><div class="row-main"><b>${esc(e.label)}</b><small>${esc(e.category)} · ${esc(vehicle(e.vehicleId)?.make||'')} · ${dateLabel(e.date)}</small></div><strong>${money(e.amount)}</strong><button class="row-delete" data-delete-expense="${e.id}">×</button></div>`).join('')}</div>`:emptyBlock('Aucune dépense enregistrée','Vos dépenses apparaîtront ici.')}</section>`;
}

function renderDocuments() {
  const docs = state.documents.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return `<div class="page-heading"><div><div class="eyebrow">ARCHIVES DU VÉHICULE</div><h1>Mes <em>documents.</em></h1><p class="subheading">Factures, contrôles techniques, photos et justificatifs, conservés sur cet appareil.</p></div><button class="primary-button" data-action="add-document">${icon('plus')} Ajouter un document</button></div>
    ${docs.length ? `<div class="document-list">${docs.map(d=>`<article class="document-row"><div class="document-icon">${icon('file')}</div><div class="row-main"><b>${esc(d.title)}</b><small>${esc(d.category)} · ${esc(vehicle(d.vehicleId)?.make || 'Sans véhicule')} · ${dateLabel(d.date)}</small><small>${esc(d.fileName || 'Fichier')}</small></div><div class="document-actions"><button class="text-button" data-open-document="${d.id}">Ouvrir</button><button class="row-delete" data-delete-document="${d.id}">×</button></div></article>`).join('')}</div>` : emptyBlock('Votre espace documentaire est vide','Ajoutez une facture, une photo ou un document utile.','add-document','Ajouter un document')}
    <p class="form-hint page-note">Les fichiers sont conservés dans le stockage local du navigateur. Pensez à exporter une sauvegarde régulièrement.</p>`;
}

function renderSettings() {
  return `<div class="page-heading"><div><div class="eyebrow">APPLICATION</div><h1>Paramètres & <em>données.</em></h1><p class="subheading">Vos informations restent stockées localement sur cet appareil. Aucun compte n'est nécessaire.</p></div></div>
    <div class="settings-grid">
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">SAUVEGARDE</span><h3>Protéger mes données</h3></div><span class="panel-icon">🔐</span></div><p class="panel-copy">Exportez vos véhicules, opérations, problèmes, pneus, dépenses et documents. Les fichiers joints sont inclus dans la sauvegarde.</p><div class="settings-actions"><button class="primary-button" data-action="export">${icon('download')} Exporter mes données</button><button class="secondary-button" data-action="import">${icon('upload')} Restaurer une sauvegarde</button><input type="file" id="import-file" accept="application/json,.json" hidden></div></section>
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">STOCKAGE</span><h3>Sur cet appareil</h3></div><span class="panel-icon">💾</span></div><div class="storage-info"><span class="storage-dot"></span><div><b>Stockage local actif</b><small>Les données et médias sont enregistrés dans le navigateur.</small></div></div><p class="warning-note">La désinstallation ou l'effacement des données du navigateur peut supprimer vos informations. Exportez régulièrement une sauvegarde.</p></section>
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">À PROPOS</span><h3>Mon Entretien Auto</h3></div><span class="version-tag">V0.2.1 TEST</span></div><p class="panel-copy">Application de suivi personnel. Les échéances sont calculées uniquement à partir des informations que vous renseignez.</p><p class="panel-copy">Les données constructeur, les recommandations techniques et le suivi carburant ne sont pas encore intégrés. Aucun diagnostic mécanique automatisé n'est fourni.</p></section>
    </div>`;
}

function renderPage() {
  const pages = { dashboard:renderDashboard, garage:renderGarage, maintenance:renderMaintenance, issues:renderIssues, tires:renderTires, costs:renderCosts, documents:renderDocuments, settings:renderSettings };
  return (pages[page] || renderDashboard)();
}

function refresh() {
  appShell();
  loadVehiclePhotos();
}

async function loadVehiclePhotos() {
  for (const el of document.querySelectorAll('[data-photo-id]')) {
    try {
      const record = await getStoredFile(el.dataset.photoId);
      if (!record?.blob) continue;
      const url = URL.createObjectURL(record.blob);
      el.style.backgroundImage = `url("${url}")`;
      el.classList.add('has-photo');
      el.querySelector('.photo-loading')?.remove();
    } catch (error) {
      console.warn('Photo non disponible', error);
    }
  }
}

function bindGlobal() {
  document.querySelectorAll('[data-edit-service]').forEach(b=>b.addEventListener('click',()=>openServiceDetails(b.dataset.editService)));
  document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{page=b.dataset.page;refresh();}));
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>handleAction(b.dataset.action)));
  document.querySelectorAll('[data-edit-vehicle]').forEach(b=>b.addEventListener('click',()=>openVehicleModal(b.dataset.editVehicle)));
  document.querySelectorAll('[data-delete-vehicle]').forEach(b=>b.addEventListener('click',()=>deleteVehicle(b.dataset.deleteVehicle)));
  document.querySelectorAll('[data-delete-service]').forEach(b=>b.addEventListener('click',()=>deleteService(b.dataset.deleteService)));
  document.querySelectorAll('[data-delete-expense]').forEach(b=>b.addEventListener('click',()=>deleteExpense(b.dataset.deleteExpense)));
  document.querySelectorAll('[data-edit-issue]').forEach(b=>b.addEventListener('click',()=>openIssueModal(b.dataset.editIssue)));
  document.querySelectorAll('[data-delete-issue]').forEach(b=>b.addEventListener('click',()=>deleteIssue(b.dataset.deleteIssue)));
  document.querySelectorAll('[data-edit-tire]').forEach(b=>b.addEventListener('click',()=>openTireModal(b.dataset.editTire)));
  document.querySelectorAll('[data-delete-tire]').forEach(b=>b.addEventListener('click',()=>deleteTire(b.dataset.deleteTire)));
  document.querySelectorAll('[data-delete-document]').forEach(b=>b.addEventListener('click',()=>deleteDocument(b.dataset.deleteDocument)));
  document.querySelectorAll('[data-open-document]').forEach(b=>b.addEventListener('click',()=>openDocument(b.dataset.openDocument)));
  document.querySelectorAll('[data-open-media]').forEach(b=>b.addEventListener('click',()=>openMedia(b.dataset.openMedia)));
  document.querySelector('[data-more-nav]')?.addEventListener('click', showMoreNav);
  document.querySelector('#service-filter')?.addEventListener('change', e=>{
    const rows=state.services.filter(s=>e.target.value==='all'||s.vehicleId===e.target.value).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    document.querySelector('#service-rows').innerHTML=rows.length?rows.map(serviceRow).join(''):emptyBlock('Aucune opération','Aucune opération enregistrée pour ce filtre.');
    document.querySelectorAll('[data-edit-service]').forEach(b=>b.addEventListener('click',()=>openServiceDetails(b.dataset.editService)));
    document.querySelectorAll('[data-delete-service]').forEach(b=>b.addEventListener('click',()=>deleteService(b.dataset.deleteService)));
  });
}

function showMoreNav() {
  const root = document.querySelector('#more-nav-root');
  root.innerHTML = `<div class="more-nav-backdrop"><div class="more-nav-sheet"><div class="sheet-handle"></div><h3>Autres espaces</h3>${NAV.filter(x=>!['dashboard','garage','maintenance','costs'].includes(x[0])).map(([id,label,ico])=>navItem(id,label,ico)).join('')}${navItem('settings','Paramètres','settings')}</div></div>`;
  root.querySelector('.more-nav-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('more-nav-backdrop'))root.innerHTML='';});
  root.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{page=b.dataset.page;refresh();}));
}

function handleAction(action) {
  if (action === 'demo-add-one') addDemoVehicles(1);
  if (action === 'demo-add-five') addDemoVehicles(5);
  if (action === 'demo-clear') clearDemoVehicles();
  if (action === 'add-vehicle') openVehicleModal();
  if (action === 'add-service') state.vehicles.length ? openServiceModal() : promptAddVehicle();
  if (action === 'add-expense') state.vehicles.length ? openExpenseModal() : promptAddVehicle();
  if (action === 'add-issue') state.vehicles.length ? openIssueModal() : promptAddVehicle();
  if (action === 'add-tire') state.vehicles.length ? openTireModal() : promptAddVehicle();
  if (action === 'add-document') openDocumentModal();
  if (action === 'export') exportData();
  if (action === 'import') document.querySelector('#import-file')?.click();
}

function promptAddVehicle() {
  showToast('Ajoutez d’abord un véhicule au garage.');
  page = 'garage';
  refresh();
}

function modal(title, body, submitLabel, onSubmit) {
  const root=document.querySelector('#modal-root');
  root.innerHTML=`<div class="modal-backdrop"><section class="modal"><div class="modal-head"><div><span class="eyebrow">MON ENTRETIEN AUTO · V0.2</span><h2>${title}</h2></div><button type="button" class="icon-button modal-close" aria-label="Fermer">${icon('close')}</button></div><form id="modal-form">${body}<div class="modal-actions"><button type="button" class="secondary-button modal-cancel">Annuler</button><button class="primary-button" type="submit">${submitLabel}</button></div></form></section></div>`;
  root.querySelector('.modal-close').onclick=()=>root.innerHTML='';
  root.querySelector('.modal-cancel').onclick=()=>root.innerHTML='';
  root.querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))root.innerHTML='';});
  root.querySelector('#modal-form').onsubmit=async e=>{
    e.preventDefault();
    const form=e.target;
    if (!form.reportValidity()) return;
    const fd=new FormData(form);
    try {
      await onSubmit(Object.fromEntries(fd.entries()), form);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Une erreur est survenue.');
    }
  };
}

function field(label,name,value='',type='text',extra='') {
  return `<label class="form-field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
}

function vehicleSelect(selected) {
  if (!state.vehicles.length) return `<div class="empty-state compact-empty"><b>Aucun véhicule dans le garage</b><p>Ajoutez d'abord un véhicule pour associer cette information.</p></div>`;
  return `<label class="form-field"><span>Véhicule</span><select name="vehicleId" required>${state.vehicles.map(v=>`<option value="${v.id}" ${selected===v.id?'selected':''}>${esc(v.make)} ${esc(v.model)}</option>`).join('')}</select></label>`;
}

function quickModeSwitch() {
  return `<div class="mode-switch"><label><input type="radio" name="entryMode" value="quick" checked><span>Saisie rapide</span></label><label><input type="radio" name="entryMode" value="detailed"><span>Saisie détaillée</span></label></div>`;
}

function openVehicleModal(id) {
  const existing = id ? vehicle(id) : null;
  if (id && !existing) return showToast('Véhicule introuvable.');
  const v = existing || { make:'',model:'',generation:'',bodyStyle:'',year:new Date().getFullYear(),engine:'',power:'',fuel:'Essence SP95-E10',registration:'',mileage:'',note:'',photoId:null,color:'#48b5a2' };
  modal(id?'Modifier le véhicule':'Ajouter un véhicule',`
    <div class="form-section"><h3>Identification</h3><div class="form-grid">
      ${field('Marque','make',v.make,'text','required placeholder="Ex. : Renault"')}
      ${field('Modèle','model',v.model,'text','required placeholder="Ex. : Clio"')}
      ${field('Génération / phase','generation',v.generation || '', 'text','placeholder="Ex. : génération IV, phase 2"')}
      <label class="form-field"><span>Carrosserie</span><select name="bodyStyle">${['Non renseignée',...BODY_STYLES].map(x=>`<option value="${x==='Non renseignée'?'':x}" ${(v.bodyStyle||'')===(x==='Non renseignée'?'':x)?'selected':''}>${x}</option>`).join('')}</select></label>
      ${field('Année','year',v.year || '', 'number','min="1900" max="2100"')}
      ${field('Motorisation','engine',v.engine || '', 'text','placeholder="Ex. : 1.5 dCi"')}
      ${field('Puissance','power',v.power || '', 'text','placeholder="Ex. : 90 ch"')}
      <label class="form-field"><span>Carburant principal</span><select name="fuel">${['Essence SP95-E10','Essence','Essence + E85','Diesel','GPL','Hybride','Hybride rechargeable','Électrique','Autre'].map(x=>`<option ${v.fuel===x?'selected':''}>${x}</option>`).join('')}</select></label>
      ${field('Immatriculation (facultatif)','registration',v.registration || '')}
      ${field('Kilométrage actuel','mileage',v.mileage ?? '', 'number','min="0" placeholder="Ex. : 128500"')}
    </div></div>
    <div class="form-section"><h3>Photo du véhicule</h3><div class="photo-picker">${v.photoId?'<span class="photo-current">Une photo est déjà enregistrée.</span>':'<span class="photo-current">Aucune photo personnelle.</span>'}<label class="file-button">Choisir une photo<input type="file" name="vehiclePhoto" accept="image/*" capture="environment"></label><p class="form-hint">Vous pouvez prendre une photo avec votre téléphone ou choisir une image existante. Les photos sont conservées localement.</p></div></div>
    <label class="form-field"><span>Modifications / notes</span><textarea name="note" rows="3" placeholder="Boîtier E85, modifications, particularités…">${esc(v.note || '')}</textarea></label>
    <p class="form-hint">Sans photo personnelle, une silhouette générique représente le type de carrosserie choisi, pas le modèle exact.</p>`,
    id?'Enregistrer les modifications':'Ajouter au garage',
    async (d, form)=>{
      if (id && !confirmMileage(id, [d.mileage])) return;
      const photo = form.querySelector('[name="vehiclePhoto"]')?.files?.[0];
      const data={...v,make:d.make.trim(),model:d.model.trim(),generation:d.generation.trim(),bodyStyle:d.bodyStyle,year:d.year===''?null:Number(d.year),engine:d.engine.trim(),power:d.power.trim(),fuel:d.fuel,registration:d.registration.trim(),mileage:d.mileage===''?null:Number(d.mileage),note:d.note.trim()};
      if (existing?.mileage != null) data.mileage = Math.max(Number(existing.mileage), data.mileage ?? 0);
      if(photo) data.photoId = await storeFile(photo);
      if(id) state.vehicles=state.vehicles.map(x=>x.id===id?data:x);
      else {
        const added={...data,id:uid()};
        state.vehicles.push(added);
        if(!state.activeVehicle) state.activeVehicle=added.id;
      }
      save();refresh();showToast('Fiche véhicule enregistrée.');
    });
}

function openServiceDetails(id) {
  const s=state.services.find(item=>item.id===id);
  if (!s) return showToast('Intervention introuvable.');
  const v=vehicle(s.vehicleId);
  const value=(label,text)=>`<div><dt>${esc(label)}</dt><dd>${esc(text)}</dd></div>`;
  const dueKm=s.intervalKm && s.lastKm != null ? Number(s.lastKm)+Number(s.intervalKm) : null;
  modal('Détails de l’intervention',`
    <dl class="service-details">
      ${value('Opération',s.name)}
      ${value('Véhicule',v ? `${v.make} ${v.model}` : 'Véhicule introuvable')}
      ${value('Catégorie',s.category || 'Entretien')}
      ${value('Date',dateLabel(s.date))}
      ${value('Compteur lors de l’intervention',s.mileage == null ? 'Non renseigné' : `${num(s.mileage)} km`)}
      ${value('Coût',money(s.cost))}
      ${value('Intervalle kilométrique',s.intervalKm ? `${num(s.intervalKm)} km` : 'Non renseigné')}
      ${value('Intervalle en mois',s.intervalMonths ? `${num(s.intervalMonths)} mois (calcul calendaire non intégré)` : 'Non renseigné')}
      ${value('Point de départ de l’intervalle',s.lastKm == null ? 'Non renseigné' : `${num(s.lastKm)} km`)}
      ${value('Prochaine échéance kilométrique',dueKm == null ? 'Non renseignée' : `${num(dueKm)} km${v?.mileage != null ? ` · ${dueKm > v.mileage ? `${num(dueKm-v.mileage)} km restants` : 'Échéance atteinte ou dépassée'}` : ''}`)}
      ${value('Note',s.notes || 'Aucune note')}
    </dl>
    <h3>Justificatif</h3>
    ${s.attachmentId ? '<div id="service-attachment-preview" class="service-attachment-preview" aria-live="polite">Chargement du justificatif…</div>' : '<p class="form-hint">Aucun justificatif.</p>'}
    `,'Éditer',()=>openServiceModal(id));
  const root=document.querySelector('#modal-root');
  root.querySelector('.modal-cancel').textContent='Fermer';
  if(s.attachmentId) loadServiceAttachment(s.attachmentId,root.querySelector('#service-attachment-preview'));
}

function openServiceModal(id) {
  const existing = id ? state.services.find(s => s.id === id) : null;
  if (id && !existing) return showToast('Intervention introuvable.');
  if (!state.vehicles.length) return promptAddVehicle();
  modal(existing ? 'Éditer l’intervention' : 'Nouvelle opération',`
    ${quickModeSwitch()}
    ${vehicleSelect(state.activeVehicle)}
    <div class="form-grid">
      <label class="form-field"><span>Type d'opération</span><select name="category"><option>Entretien courant</option><option>Vidange</option><option>Filtres</option><option>Pneumatiques</option><option>Freinage</option><option>Distribution</option><option>Allumage</option><option>Réparation</option><option>Contrôle technique</option><option>Autre</option></select></label>
      ${field('Nom de l’opération','name','','text','required placeholder="Ex. : Vidange moteur"')}
      ${field('Date','date',today(),'date','required')}
      ${field('Compteur lors de l’intervention (km)','mileage','','number','min="0" placeholder="Facultatif"')}
      ${field('Coût (€)','cost','','number','min="0" step="0.01" placeholder="Facultatif"')}
    </div>
    <div class="detailed-fields" hidden>
      <div class="form-grid">${field('Intervalle kilométrique suivant','intervalKm','','number','min="1" placeholder="Ex. : 15000"')}${field('Intervalle en mois','intervalMonths','','number','min="1" placeholder="Ex. : 12"')}</div>
      ${field('Point de départ de l’intervalle (km, facultatif)','lastKm','','number','min="0" placeholder="Par défaut : compteur lors de l’intervention"')}
      <p class="form-hint">Laissez ce champ vide pour calculer la prochaine échéance depuis le compteur de cette intervention. Renseignez-le seulement si l’intervalle commence à un autre kilométrage. Ce repère ne met pas à jour le compteur du véhicule.</p>
    </div>
    <label class="form-field"><span>Note</span><textarea name="notes" rows="3" placeholder="Pièces, références, garage, remarques…"></textarea></label>
    <div class="form-section"><h3>Facture (facultatif)</h3>
      ${existing?.attachmentId ? '<div id="service-attachment-preview" class="service-attachment-preview" aria-live="polite">Chargement du justificatif…</div><p class="form-hint">Le justificatif actuel est conservé si vous ne choisissez aucun nouveau fichier.</p>' : ''}
      <label class="form-field"><span>Choisir une photo ou un PDF</span><input type="file" name="attachment" accept="image/*,.pdf"></label>
      <label class="form-field"><span>Photographier la facture</span><input type="file" name="invoicePhoto" accept="image/*" capture="environment"></label>
      <p class="form-hint">Sur un téléphone compatible, utilisez l’appareil photo pour photographier la facture. Un seul justificatif est conservé ; choisissez l’une des deux options.</p>
    </div>
    <p class="form-hint">Les champs facultatifs restent facultatifs. Une échéance n'est calculée que si vous renseignez un intervalle fiable.</p>`,
    existing ? 'Enregistrer les modifications' : 'Enregistrer l’opération',
    async (d,form)=>{
      const detailed=Boolean(existing) || d.entryMode==='detailed';
      if (!confirmMileage(d.vehicleId, [d.mileage])) return;
      const selectedFile=form.querySelector('[name="attachment"]')?.files?.[0];
      const photoFile=form.querySelector('[name="invoicePhoto"]')?.files?.[0];
      if (selectedFile && photoFile) throw new Error('Choisissez un seul justificatif : fichier ou photo de la facture.');
      const file=photoFile || selectedFile;
      const attachmentId=file?await storeFile(file):existing?.attachmentId||null;
      const item={...existing,id:existing?.id||uid(),vehicleId:d.vehicleId,category:d.category,name:d.name.trim(),date:d.date,mileage:d.mileage===''?null:Number(d.mileage),cost:Number(d.cost)||0,intervalKm:detailed&&d.intervalKm!==''?Number(d.intervalKm):null,intervalMonths:detailed&&d.intervalMonths!==''?Number(d.intervalMonths):null,lastKm:detailed?(d.lastKm===''?(d.mileage===''?null:Number(d.mileage)):Number(d.lastKm)):null,notes:d.notes.trim(),attachmentId};
      // Un repère qui suivait le compteur de l'intervention suit aussi sa correction.
      if (existing && existing.mileage != null && existing.lastKm === existing.mileage && d.lastKm !== '' && Number(d.lastKm) === existing.lastKm) item.lastKm=item.mileage;
      state.services=existing?state.services.map(s=>s.id===item.id?item:s):[...state.services,item];
      updateVehicleMileage(item.vehicleId, [item.mileage]);
      const linked = state.expenses.find(e=>e.linkedServiceId===item.id);
      state.expenses=state.expenses.filter(e=>e.linkedServiceId!==item.id);
      if(item.cost>0) state.expenses.push({...linked,id:linked?.id||uid(),vehicleId:item.vehicleId,label:item.name,category:item.category==='Pneumatiques'?'Pneumatiques':item.category==='Réparation'?'Réparation':'Entretien',date:item.date,amount:item.cost,mileage:item.mileage,linkedServiceId:item.id});
      save();refresh();showToast('Opération enregistrée.');
      if(file && existing?.attachmentId && !state.documents.some(x=>x.fileId===existing.attachmentId) && !state.expenses.some(x=>x.attachmentId===existing.attachmentId) && !state.services.some(x=>x.attachmentId===existing.attachmentId)) await deleteStoredFile(existing.attachmentId);
    });
  const root=document.querySelector('#modal-root');
  if (existing) {
    const form=root.querySelector('form');
    for (const key of ['vehicleId','category','name','date','mileage','cost','intervalKm','intervalMonths','lastKm','notes']) {
      const input=form.elements.namedItem(key);
      if (input) input.value=existing[key] ?? '';
    }
    form.querySelector('[name="entryMode"][value="detailed"]').checked=true;
    root.querySelector('.detailed-fields').hidden=false;
    // L'édition affiche toujours la fiche détaillée.
    root.querySelector('.mode-switch').hidden=true;
    if(existing.attachmentId) loadServiceAttachment(existing.attachmentId, root.querySelector('#service-attachment-preview'));
  }
  root.querySelectorAll('[name="entryMode"]').forEach(input=>input.addEventListener('change',()=>root.querySelector('.detailed-fields').hidden=input.value!=='detailed'));
}

async function loadServiceAttachment(fileId, container) {
  try {
    const record=await getStoredFile(fileId);
    if (!record?.blob) throw new Error('Justificatif introuvable sur cet appareil.');
    const type=record.type || record.blob.type;
    if (type.startsWith('image/')) {
      const img=document.createElement('img');
      img.alt=record.name || 'Photo de la facture';
      img.src=await fileDataUrl(record.blob);
      container.replaceChildren(img);
    } else if(type==='application/pdf') {
      const frame=document.createElement('iframe');
      frame.title='Facture PDF';
      frame.src=await fileDataUrl(record.blob);
      container.replaceChildren(frame);
    } else container.textContent='Aperçu indisponible pour ce type de justificatif.';
  } catch(error) { container.textContent=error.message || 'Impossible de charger le justificatif.'; }
}

function openExpenseModal() {
  if (!state.vehicles.length) return promptAddVehicle();
  modal('Nouvelle dépense',`
    ${quickModeSwitch()}
    ${vehicleSelect(state.activeVehicle)}
    <div class="form-grid">
      ${field('Intitulé','label','','text','required placeholder="Ex. : Remplacement batterie"')}
      <label class="form-field"><span>Catégorie</span><select name="category"><option>Entretien</option><option>Pneumatiques</option><option>Réparation</option><option>Assurance</option><option>Contrôle technique</option><option>Financement</option><option>Stationnement</option><option>Péage</option><option>Autre</option></select></label>
      ${field('Montant (€)','amount','','number','min="0.01" step="0.01" required')}
      ${field('Date','date',today(),'date','required')}
    </div>
    <div class="detailed-fields" hidden>
      ${field('Kilométrage (facultatif)','mileage','','number','min="0"')}
      <label class="form-field"><span>Détails / prestataire</span><textarea name="notes" rows="3"></textarea></label>
      <label class="form-field"><span>Justificatif</span><input type="file" name="attachment" accept="image/*,.pdf"></label>
    </div>`,
    'Enregistrer la dépense',
    async (d,form)=>{
      if (!confirmMileage(d.vehicleId, [d.mileage])) return;
      const file=form.querySelector('[name="attachment"]')?.files?.[0];
      const attachmentId=file?await storeFile(file):null;
      state.expenses.push({id:uid(),vehicleId:d.vehicleId,label:d.label.trim(),category:d.category,amount:Number(d.amount),date:d.date,mileage:d.mileage===''?null:Number(d.mileage),notes:d.notes?.trim()||'',attachmentId});
      updateVehicleMileage(d.vehicleId, [d.mileage]);
      save();refresh();showToast('Dépense enregistrée.');
    });
  const root=document.querySelector('#modal-root');
  root.querySelectorAll('[name="entryMode"]').forEach(input=>input.addEventListener('change',()=>root.querySelector('.detailed-fields').hidden=input.value!=='detailed'));
}

function openIssueModal(id) {
  const existing=id?state.issues.find(x=>x.id===id):null;
  if(id&&!existing) return;
  if(!state.vehicles.length) return promptAddVehicle();
  const i=existing||{vehicleId:state.activeVehicle,title:'',date:today(),mileage:'',status:'À surveiller',description:'',diagnosis:'',resolution:''};
  modal(id?'Mettre à jour le problème':'Signaler un problème',`
    ${vehicleSelect(i.vehicleId)}
    <div class="form-grid">${field('Symptôme / titre','title',i.title,'text','required placeholder="Ex. : Claquement à froid"')}${field('Date du constat','date',i.date,'date','required')}${field('Kilométrage','mileage',i.mileage??'','number','min="0"')}
      <label class="form-field"><span>Statut</span><select name="status">${['À surveiller','À diagnostiquer','En réparation','Résolu'].map(x=>`<option ${i.status===x?'selected':''}>${x}</option>`).join('')}</select></label>
    </div>
    <label class="form-field"><span>Description des symptômes</span><textarea name="description" rows="3">${esc(i.description)}</textarea></label>
    <div class="detailed-fields">
      <label class="form-field"><span>Diagnostic éventuel</span><textarea name="diagnosis" rows="2">${esc(i.diagnosis)}</textarea></label>
      <label class="form-field"><span>Réparation / résolution</span><textarea name="resolution" rows="2">${esc(i.resolution)}</textarea></label>
    </div>
    <label class="form-field"><span>Photo ou document (facultatif)</span><input type="file" name="attachment" accept="image/*,.pdf"></label>`,
    id?'Enregistrer le suivi':'Enregistrer le problème',
    async (d,form)=>{
      if (!confirmMileage(d.vehicleId, [d.mileage])) return;
      const file=form.querySelector('[name="attachment"]')?.files?.[0];
      const attachmentId=file?await storeFile(file):i.attachmentId||null;
      const item={...i,...d,id:i.id||uid(),mileage:d.mileage===''?null:Number(d.mileage),title:d.title.trim(),description:d.description.trim(),diagnosis:d.diagnosis.trim(),resolution:d.resolution.trim(),attachmentId};
      state.issues=id?state.issues.map(x=>x.id===id?item:x):[item,...state.issues];
      updateVehicleMileage(d.vehicleId, [item.mileage]);
      save();refresh();showToast('Suivi du problème enregistré.');
    });
}

function openTireModal(id) {
  const existing=id?state.tireSets.find(x=>x.id===id):null;
  if(id&&!existing) return;
  if(!state.vehicles.length) return promptAddVehicle();
  const t=existing||{vehicleId:state.activeVehicle,brand:'',model:'',size:'',season:'Toutes saisons',position:'4 pneus',status:'Monté',mountedOn:today(),mountedKm:'',removedOn:'',removedKm:'',tread:'',cost:'',notes:''};
  modal(id?'Modifier le jeu de pneus':'Ajouter un jeu de pneus',`
    ${vehicleSelect(t.vehicleId)}
    <div class="form-grid">
      ${field('Marque','brand',t.brand,'text','required')}
      ${field('Modèle','model',t.model,'text','required')}
      ${field('Dimensions','size',t.size,'text','placeholder="Ex. : 205/60 R16"')}
      <label class="form-field"><span>Saison</span><select name="season">${['Été','Hiver','Toutes saisons'].map(x=>`<option ${t.season===x?'selected':''}>${x}</option>`).join('')}</select></label>
      <label class="form-field"><span>Position</span><select name="position">${['4 pneus','Avant','Arrière','Avant gauche','Avant droit','Arrière gauche','Arrière droit'].map(x=>`<option ${t.position===x?'selected':''}>${x}</option>`).join('')}</select></label>
      <label class="form-field"><span>Statut</span><select name="status">${['Monté','Stocké','Démonté','Remplacé'].map(x=>`<option ${t.status===x?'selected':''}>${x}</option>`).join('')}</select></label>
      ${field('Date de montage','mountedOn',t.mountedOn||'','date')}
      ${field('Kilométrage au montage','mountedKm',t.mountedKm??'','number','min="0"')}
      ${field('Date de démontage','removedOn',t.removedOn||'','date')}
      ${field('Kilométrage au démontage','removedKm',t.removedKm??'','number','min="0"')}
      ${field('Profondeur mesurée (mm)','tread',t.tread??'','number','min="0" step="0.1"')}
      ${field('Coût (€)','cost',t.cost??'','number','min="0" step="0.01"')}
    </div>
    <label class="form-field"><span>Notes (indices, DOT, remarques…)</span><textarea name="notes" rows="2">${esc(t.notes||'')}</textarea></label>`,
    id?'Enregistrer les modifications':'Ajouter le jeu de pneus',
    d=>{
      if (d.mountedKm !== '' && d.removedKm !== '' && Number(d.removedKm) < Number(d.mountedKm)) throw new Error('Le kilométrage au démontage ne peut pas être inférieur à celui du montage.');
      if (d.mountedOn && d.removedOn && d.removedOn < d.mountedOn) throw new Error('La date de démontage ne peut pas précéder le montage.');
      if (!confirmMileage(d.vehicleId, [d.mountedKm, d.removedKm])) return;
      const item={...t,...d,id:t.id||uid(),mountedKm:d.mountedKm===''?null:Number(d.mountedKm),removedKm:d.removedKm===''?null:Number(d.removedKm),tread:d.tread===''?null:Number(d.tread),cost:d.cost===''?null:Number(d.cost),notes:d.notes.trim()};
      item.vehicleLabel = '';
      state.tireSets=id?state.tireSets.map(x=>x.id===id?item:x):[item,...state.tireSets];
      updateVehicleMileage(d.vehicleId, [item.mountedKm, item.removedKm]);
      save();refresh();showToast('Jeu de pneus enregistré.');
    });
}

function openDocumentModal() {
  modal('Ajouter un document',`
    <div class="form-grid">
      <label class="form-field"><span>Véhicule associé (facultatif)</span><select name="vehicleId"><option value="">Aucun véhicule</option>${state.vehicles.map(v=>`<option value="${v.id}">${esc(v.make)} ${esc(v.model)}</option>`).join('')}</select></label>
      <label class="form-field"><span>Catégorie</span><select name="category"><option>Facture</option><option>Contrôle technique</option><option>Photo</option><option>Assurance</option><option>Carte grise</option><option>Autre</option></select></label>
      ${field('Titre','title','','text','required placeholder="Ex. : Facture vidange"')}
      ${field('Date du document','date',today(),'date')}
    </div>
    <label class="form-field"><span>Fichier (photo ou PDF)</span><input type="file" name="documentFile" accept="image/*,.pdf" required></label>
    <p class="form-hint">Les fichiers restent sur cet appareil et seront inclus dans les sauvegardes exportées.</p>`,
    'Enregistrer le document',
    async (d,form)=>{
      const file=form.querySelector('[name="documentFile"]')?.files?.[0];
      if(!file) throw new Error('Sélectionnez un fichier.');
      const fileId=await storeFile(file);
      state.documents.unshift({id:uid(),vehicleId:d.vehicleId||null,title:d.title.trim(),category:d.category,date:d.date,fileId,fileName:file.name,mimeType:file.type});
      save();refresh();showToast('Document ajouté.');
    });
}

async function openMedia(fileId) {
  try {
    const record=await getStoredFile(fileId);
    if(!record?.blob) return showToast('Fichier introuvable sur cet appareil.');
    const url=URL.createObjectURL(record.blob);
    const a=document.createElement('a');
    a.href=url;a.target='_blank';a.rel='noopener';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  } catch { showToast('Impossible d’ouvrir ce fichier.'); }
}

async function openDocument(id) {
  const doc=state.documents.find(x=>x.id===id);
  if(!doc) return;
  await openMedia(doc.fileId);
}

async function deleteDocument(id) {
  const doc=state.documents.find(x=>x.id===id);
  if(!doc||!confirm('Supprimer ce document et son fichier associé ?')) return;
  await deleteStoredFile(doc.fileId);
  state.documents=state.documents.filter(x=>x.id!==id);
  save();refresh();showToast('Document supprimé.');
}

function addDemoVehicles(count) {
  const generated = makeDemoVehicles(count, state.vehicles, uid);
  state.vehicles.push(...generated);
  if (!state.activeVehicle) state.activeVehicle = generated[0]?.id || null;
  save(); refresh();
  showToast(`${generated.length} véhicule${generated.length > 1 ? 's' : ''} de test ajouté${generated.length > 1 ? 's' : ''}.`);
}

// Opération partagée par la suppression manuelle et le nettoyage des données de test.
// La suppression ne concerne que les identifiants explicitement transmis.
async function removeVehicleData(ids) {
  const selectedIds = new Set(ids);
  const selectedVehicles = state.vehicles.filter(v => selectedIds.has(v.id));
  const mediaIds = new Set([
    ...selectedVehicles.map(v => v.photoId),
    ...state.services.filter(x => selectedIds.has(x.vehicleId)).map(x => x.attachmentId),
    ...state.issues.filter(x => selectedIds.has(x.vehicleId)).map(x => x.attachmentId),
    ...state.expenses.filter(x => selectedIds.has(x.vehicleId)).map(x => x.attachmentId),
    ...state.documents.filter(x => selectedIds.has(x.vehicleId)).map(x => x.fileId)
  ].filter(Boolean));
  for (const mediaId of mediaIds) await deleteStoredFile(mediaId);
  for (const key of ['vehicles', 'services', 'expenses', 'issues', 'tireSets', 'documents']) {
    state[key] = state[key].filter(item => !selectedIds.has(key === 'vehicles' ? item.id : item.vehicleId));
  }
  if (!state.vehicles.some(v => v.id === state.activeVehicle)) {
    state.activeVehicle = state.vehicles[0]?.id || null;
  }
  save(); refresh();
}

async function clearDemoVehicles() {
  const ids = state.vehicles.filter(isDemoVehicle).map(v => v.id);
  if (!ids.length) return showToast('Aucun véhicule de test à supprimer.');
  if (!confirm(`Supprimer les ${ids.length} véhicule(s) fictif(s), ainsi que leurs opérations, dépenses, problèmes, pneus et documents associés ?\n\nLes véhicules personnels ne seront pas supprimés.`)) return;
  await removeVehicleData(ids);
  showToast(`${ids.length} véhicule${ids.length > 1 ? 's' : ''} de test supprimé${ids.length > 1 ? 's' : ''}.`);
}

async function deleteVehicle(id) {
  const v = vehicle(id);
  if (!v || !confirm(`Supprimer ${v.make} ${v.model} et toutes les informations qui lui sont associées ?`)) return;
  await removeVehicleData([id]);
  showToast('Véhicule supprimé.');
}

async function deleteService(id) {
  if(!confirm('Supprimer cette opération ? La dépense liée ne sera pas supprimée automatiquement.')) return;
  const item=state.services.find(x=>x.id===id);
  if(item?.attachmentId) await deleteStoredFile(item.attachmentId);
  state.services=state.services.filter(x=>x.id!==id);
  save();refresh();showToast('Opération supprimée.');
}

function deleteExpense(id) {
  if(!confirm('Supprimer cette dépense ?')) return;
  state.expenses=state.expenses.filter(x=>x.id!==id);
  save();refresh();showToast('Dépense supprimée.');
}

async function deleteIssue(id) {
  if(!confirm('Supprimer ce problème et son suivi ?')) return;
  const item=state.issues.find(x=>x.id===id);
  if(item?.attachmentId) await deleteStoredFile(item.attachmentId);
  state.issues=state.issues.filter(x=>x.id!==id);
  save();refresh();showToast('Problème supprimé.');
}

function deleteTire(id) {
  if(!confirm('Supprimer ce jeu de pneus de l’historique ?')) return;
  state.tireSets=state.tireSets.filter(x=>x.id!==id);
  save();refresh();showToast('Jeu de pneus supprimé.');
}

async function exportData() {
  try {
    const mediaIds=new Set([
      ...state.vehicles.map(v=>v.photoId),
      ...state.services.map(s=>s.attachmentId),
      ...state.issues.map(i=>i.attachmentId),
      ...state.documents.map(d=>d.fileId)
    ].filter(Boolean));
    const media=[];
    for(const id of mediaIds) {
      const record=await getStoredFile(id);
      if(record?.blob) media.push({id,name:record.name,type:record.type,data:await fileDataUrl(record.blob)});
    }
    const payload={...state,media,exportedAt:new Date().toISOString(),appVersion:APP_VERSION};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`mon-entretien-auto-sauvegarde-${today()}.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showToast('Sauvegarde complète exportée.');
  } catch(error) {
    console.error(error);showToast('La sauvegarde n’a pas pu être créée.');
  }
}

async function importData(file) {
  const reader=new FileReader();
  reader.onload=async()=>{
    try {
      const data=JSON.parse(reader.result);
      for(const key of ['vehicles','services','expenses','issues','tireSets','documents']) {
        if(!Array.isArray(data[key])) data[key]=[];
      }
      if(!confirm('Restaurer cette sauvegarde et remplacer les données actuelles ?')) return;
      const media=Array.isArray(data.media)?data.media:[];
      for(const item of media) {
        if(item.data) {
          const blob=await dataUrlBlob(item.data);
          const db=await openMediaDb();
          await new Promise((resolve,reject)=>{
            const tx=db.transaction(DB_STORE,'readwrite');
            tx.objectStore(DB_STORE).put({id:item.id,blob,name:item.name||'fichier',type:item.type||blob.type,size:blob.size});
            tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
          });
        }
      }
      delete data.media;delete data.exportedAt;delete data.appVersion;
      state={...structuredClone(seed),...data};
      if(!state.vehicles.some(v=>v.id===state.activeVehicle)) state.activeVehicle=state.vehicles[0]?.id||null;
      save();refresh();showToast('Sauvegarde restaurée.');
    } catch(error) {
      console.error(error);showToast('Fichier invalide ou illisible.');
    }
  };
  reader.readAsText(file);
}

document.addEventListener('change',e=>{
  if(e.target.id==='import-file'&&e.target.files?.[0]) importData(e.target.files[0]);
});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.deferredInstallPrompt=e;});

if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load',()=>navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(error=>console.warn('Service worker non enregistré',error)));
}

if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // Ne pas laisser le cache PWA masquer les changements du serveur Vite.
  navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL).then(async registration => {
    if (!registration) return;
    await registration.unregister();
    if (navigator.serviceWorker.controller) location.reload();
  }).catch(error => console.warn('Nettoyage du service worker de développement impossible', error));
}

appShell();
loadVehiclePhotos();
