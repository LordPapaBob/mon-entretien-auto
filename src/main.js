import './style.css';

const STORAGE_KEY = 'mon-entretien-auto-v01';
const today = () => new Date().toISOString().slice(0, 10);
const money = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(n || 0));
const num = n => new Intl.NumberFormat('fr-FR').format(Number(n || 0));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const seed = {
  vehicles: [
    { id:'dacia', make:'Dacia', model:'Sandero Stepway III', year:2022, engine:'TCe 90', power:'90 ch', fuel:'Essence SP95-E10', registration:'', mileage:null, color:'#48b5a2', note:'Véhicule d’origine, aucune modification mécanique renseignée.' },
    { id:'fiat', make:'Fiat', model:'Punto Evo / 199 Gen3 Phase 3', year:2012, engine:'1.2 FIRE', power:'69 ch', fuel:'Essence + E85', registration:'', mileage:null, color:'#f4a340', note:'Équipée d’un boîtier de conversion E85. Marque et homologation à compléter.' }
  ],
  services: [],
  expenses: [],
  activeVehicle: 'dacia'
};

let state = loadState();
let page = 'dashboard';
let toastTimer;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seed);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(seed), ...parsed, vehicles: parsed.vehicles?.length ? parsed.vehicles : structuredClone(seed.vehicles), services: parsed.services || [], expenses: parsed.expenses || [] };
  } catch { return structuredClone(seed); }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const el = document.querySelector('#save-status');
  if (el) el.textContent = 'Enregistré sur cet appareil';
}
function vehicle(id=state.activeVehicle) { return state.vehicles.find(v => v.id === id) || state.vehicles[0]; }
function showToast(message) {
  const el = document.querySelector('#toast');
  if (!el) return;
  el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
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
    settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z"/>',
    close:'<path d="m18 6-12 12M6 6l12 12"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.car}</svg>`;
}
function navItem(id, label, ico) {
  return `<button class="nav-item ${page===id?'active':''}" data-page="${id}">${icon(ico)}<span>${label}</span></button>`;
}
function appShell() {
  document.querySelector('#app').innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">MEA<span>+</span></div><div><b>MON ENTRETIEN</b><small>AUTO</small></div></div>
        <div class="side-label">ESPACE PERSONNEL</div>
        <nav>
          ${navItem('dashboard','Vue d’ensemble','grid')}
          ${navItem('garage','Mon garage','car')}
          ${navItem('maintenance','Entretien','wrench')}
          ${navItem('costs','Coût annuel','wallet')}
        </nav>
        <div class="sidebar-bottom">
          <div class="offline-pill"><span></span> Stockage local actif</div>
          <button class="nav-item" data-page="settings">${icon('settings')}<span>Paramètres</span></button>
          <div class="profile-mini"><div class="avatar">B</div><div><b>Mon espace</b><small>Version 0.1 · Bêta</small></div></div>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="mobile-brand"><div class="brand-mark">MEA<span>+</span></div><b>MON ENTRETIEN AUTO</b></div>
          <div class="breadcrumb"><span>MON GARAGE</span><i>/</i><b>${({dashboard:'Vue d’ensemble',garage:'Mes véhicules',maintenance:'Carnet d’entretien',costs:'Coût annuel',settings:'Paramètres'})[page]}</b></div>
          <div class="top-actions"><span class="saved" id="save-status">Données locales</span><button class="icon-button" data-page="settings" aria-label="Paramètres">${icon('settings')}</button></div>
        </header>
        <section class="content" id="content">${renderPage()}</section>
        <nav class="mobile-nav">
          ${navItem('dashboard','Accueil','grid')}${navItem('garage','Garage','car')}${navItem('maintenance','Entretien','wrench')}${navItem('costs','Coûts','wallet')}
        </nav>
      </main>
    </div>
    <div id="toast" class="toast" role="status"></div>
    <div id="modal-root"></div>`;
  bindGlobal();
}
function vehicleArt(v, compact=false) {
  const cls = compact ? 'car-art compact' : 'car-art';
  const accent = v.id === 'fiat' ? '#f4a340' : '#48b5a2';
  return `<div class="${cls}" style="--car-accent:${accent}">
    <div class="art-glow"></div><svg viewBox="0 0 420 190" role="img" aria-label="Illustration stylisée d'une voiture">
      <ellipse cx="210" cy="155" rx="160" ry="13" fill="#080e13" opacity=".48"/>
      <path d="M65 124 83 93q8-13 25-17l54-12q23-35 58-35h59q28 0 49 26l27 22q17 4 24 19l8 28-12 15H54z" fill="#d5e0e4"/>
      <path d="m174 70 49-29h54q20 0 37 22l17 19H158z" fill="#324754"/>
      <path d="m233 44-48 29h-22l-10-4 9-5q23-34 56-34h15z" fill="#526c79"/>
      <path d="M275 43q22 1 39 23l18 17h-46z" fill="#526c79"/>
      <path d="M78 112h275l8 20H65z" fill="${accent}" opacity=".95"/>
      <path d="M54 129h318v22H54z" fill="#263744"/>
      <path d="M67 111h22l-5 13H62zM349 108h18l8 14h-24z" fill="#f4f1e7"/>
      <path d="M126 145h36m126 0h36" stroke="#101820" stroke-width="7" stroke-linecap="round"/>
      <circle cx="126" cy="147" r="27" fill="#101820"/><circle cx="126" cy="147" r="14" fill="#73838b"/><circle cx="126" cy="147" r="6" fill="#d5e0e4"/>
      <circle cx="315" cy="147" r="27" fill="#101820"/><circle cx="315" cy="147" r="14" fill="#73838b"/><circle cx="315" cy="147" r="6" fill="#d5e0e4"/>
      <path d="M93 92h36m187 0h23" stroke="#ffffff" stroke-width="3" opacity=".45" stroke-linecap="round"/>
    </svg><span class="art-tag">${v.id==='fiat'?'E85 FLEX':'TCe 90'}</span>
  </div>`;
}
function cardVehicle(v) {
  const mileage = v.mileage == null ? 'Kilométrage à renseigner' : `${num(v.mileage)} km`;
  const next = nextDue(v.id);
  return `<article class="vehicle-card">
    ${vehicleArt(v)}
    <div class="vehicle-card-body">
      <div class="vehicle-title-row"><div><span class="eyebrow">${esc(v.make)} · ${v.year}</span><h3>${esc(v.model)}</h3><p>${esc(v.engine)} · ${esc(v.power)}</p></div><span class="vehicle-dot" style="background:${v.color}"></span></div>
      <div class="vehicle-meta"><span>${icon('gauge')} ${mileage}</span><span>⛽ ${esc(v.fuel)}</span></div>
      <div class="vehicle-footer"><span class="status-text">${next ? next.label : 'Aucune échéance renseignée'}</span><button class="text-button" data-edit-vehicle="${v.id}">Voir la fiche ${icon('chevron')}</button></div>
    </div>
  </article>`;
}
function nextDue(vehicleId) {
  const v = vehicle(vehicleId);
  const candidates = state.services.filter(s => s.vehicleId === vehicleId && s.intervalKm && s.lastKm != null);
  if (!candidates.length) return null;
  const sorted = candidates.map(s => {
    const dueKm = Number(s.lastKm) + Number(s.intervalKm);
    const remaining = v.mileage == null ? null : dueKm - Number(v.mileage);
    return {s, dueKm, remaining};
  }).sort((a,b) => (a.remaining ?? Infinity) - (b.remaining ?? Infinity));
  const x = sorted[0];
  if (x.remaining == null) return {label:`Prochaine échéance : ${num(x.dueKm)} km`};
  return {label:x.remaining <= 0 ? `${x.s.name} · en retard` : `${x.s.name} · dans ${num(x.remaining)} km`};
}
function renderDashboard() {
  const totalSpent = state.expenses.reduce((a,e)=>a+Number(e.amount||0),0);
  const serviceCount = state.services.length;
  const currentYear = new Date().getFullYear();
  const annual = state.expenses.filter(e => (e.date||'').startsWith(String(currentYear))).reduce((a,e)=>a+Number(e.amount||0),0);
  return `<div class="page-heading"><div><div class="eyebrow">MARDI 03 NOVEMBRE 2026 · ESPACE PERSONNEL</div><h1>Votre garage,<br><em>en un coup d’œil.</em></h1><p class="subheading">Suivez vos véhicules, anticipez l’entretien et gardez le contrôle de vos dépenses.</p></div><button class="primary-button" data-action="add-expense">${icon('plus')} Ajouter une dépense</button></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon teal">🚘</div><span>Véhicules suivis</span><strong>${state.vehicles.length.toString().padStart(2,'0')}</strong><small>Dans votre garage</small></div>
      <div class="stat-card"><div class="stat-icon orange">🔧</div><span>Opérations enregistrées</span><strong>${serviceCount.toString().padStart(2,'0')}</strong><small>Historique d’entretien</small></div>
      <div class="stat-card"><div class="stat-icon blue">€</div><span>Dépenses ${currentYear}</span><strong>${money(annual)}</strong><small>${money(totalSpent)} au total enregistré</small></div>
    </div>
    <div class="section-heading"><div><span class="eyebrow">VOTRE PARC AUTOMOBILE</span><h2>Mon garage <span class="count">${state.vehicles.length}</span></h2></div><button class="text-button" data-page="garage">Gérer mes véhicules ${icon('chevron')}</button></div>
    <div class="vehicle-grid">${state.vehicles.map(cardVehicle).join('')}</div>
    <div class="lower-grid">
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">À SURVEILLER</span><h3>Prochaines échéances</h3></div><span class="panel-icon">◷</span></div>
        ${state.services.length ? state.services.slice(0,4).map(s=>`<div class="list-row"><div class="row-icon">🔧</div><div class="row-main"><b>${esc(s.name)}</b><small>${esc(vehicle(s.vehicleId)?.model || 'Véhicule')}</small></div><span class="muted">${s.intervalKm?num(s.intervalKm)+' km':'À planifier'}</span></div>`).join('') : `<div class="empty-state compact-empty"><div class="empty-illustration">🧰</div><b>Votre carnet est prêt</b><p>Ajoutez une première opération pour commencer à suivre vos échéances.</p><button class="secondary-button" data-action="add-service">${icon('plus')} Ajouter une opération</button></div>`}
      </section>
      <section class="panel cost-panel"><div class="panel-heading"><div><span class="eyebrow">SUIVI BUDGÉTAIRE</span><h3>Le coût de vos voitures</h3></div><span class="panel-icon">€</span></div><div class="cost-highlight"><strong>${money(totalSpent)}</strong><span>Dépenses enregistrées</span></div><div class="mini-bars">${state.vehicles.map(v=>{const val=state.expenses.filter(e=>e.vehicleId===v.id).reduce((a,e)=>a+Number(e.amount||0),0);return `<div class="mini-bar-row"><span>${esc(v.make)}</span><div class="bar-track"><i style="width:${totalSpent?Math.max(3,val/totalSpent*100):3}%;background:${v.color}"></i></div><b>${money(val)}</b></div>`}).join('')}</div><button class="secondary-button full" data-page="costs">Voir le détail des coûts ${icon('chevron')}</button></section>
    </div>`;
}
function renderGarage() {
  return `<div class="page-heading"><div><div class="eyebrow">VOS VÉHICULES</div><h1>Mon <em>garage.</em></h1><p class="subheading">Toutes les informations de vos voitures réunies au même endroit.</p></div><button class="primary-button" data-action="add-vehicle">${icon('plus')} Ajouter un véhicule</button></div>
  <div class="vehicle-grid garage-grid">${state.vehicles.map(v=>`<div class="garage-card-wrap">${cardVehicle(v)}<div class="garage-actions"><button class="secondary-button" data-edit-vehicle="${v.id}">Modifier la fiche</button><button class="ghost-button" data-delete-vehicle="${v.id}" ${state.vehicles.length<2?'disabled':''}>Supprimer</button></div></div>`).join('')}</div>`;
}
function renderMaintenance() {
  const rows = state.services.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return `<div class="page-heading"><div><div class="eyebrow">SUIVI MÉCANIQUE</div><h1>Carnet <em>d’entretien.</em></h1><p class="subheading">Centralisez les interventions passées et préparez les prochaines.</p></div><button class="primary-button" data-action="add-service">${icon('plus')} Ajouter une opération</button></div>
  <div class="filter-strip"><span class="filter-label">Véhicule</span><select id="service-filter" class="select-control"><option value="all">Tous les véhicules</option>${state.vehicles.map(v=>`<option value="${v.id}">${esc(v.make)} ${esc(v.model)}</option>`).join('')}</select><span class="results-count">${rows.length} opération(s)</span></div>
  <section class="panel table-panel"><div class="table-head"><span>OPÉRATION</span><span>VÉHICULE</span><span>DATE</span><span>KILOMÉTRAGE</span><span>COÛT</span><span></span></div><div id="service-rows">${rows.length ? rows.map(serviceRow).join('') : `<div class="empty-state"><div class="empty-illustration">🛠️</div><h3>Votre historique commence ici</h3><p>Enregistrez votre première vidange, un changement de pneus ou une réparation.</p><button class="primary-button" data-action="add-service">${icon('plus')} Ajouter une opération</button></div>`}</div></section>`;
}
function serviceRow(s) {
  return `<div class="table-row"><div class="operation-name"><span class="operation-icon">${s.category==='Pneumatiques'?'🛞':s.category==='Freinage'?'🛑':'🔧'}</span><div><b>${esc(s.name)}</b><small>${esc(s.category||'Entretien')}</small></div></div><span class="table-vehicle">${esc(vehicle(s.vehicleId)?.make||'')}</span><span>${s.date?new Date(s.date+'T12:00:00').toLocaleDateString('fr-FR'):'—'}</span><span>${s.mileage!=null?num(s.mileage)+' km':'—'}</span><b>${money(s.cost)}</b><button class="row-delete" title="Supprimer" data-delete-service="${s.id}">×</button></div>`;
}
function renderCosts() {
  const sum = state.expenses.reduce((a,e)=>a+Number(e.amount||0),0);
  const year = new Date().getFullYear();
  const yearSum = state.expenses.filter(e=>(e.date||'').startsWith(String(year))).reduce((a,e)=>a+Number(e.amount||0),0);
  const categories = ['Carburant','Entretien','Pneumatiques','Réparation','Assurance','Contrôle technique','Financement','Autre'];
  const totals = categories.map(c=>({name:c,total:state.expenses.filter(e=>e.category===c).reduce((a,e)=>a+Number(e.amount||0),0)})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
  const max = Math.max(1,...totals.map(x=>x.total));
  return `<div class="page-heading"><div><div class="eyebrow">BUDGET AUTOMOBILE</div><h1>Ce que vous coûte <em>votre auto.</em></h1><p class="subheading">Enregistrez chaque dépense pour connaître le coût réel de possession de vos véhicules.</p></div><button class="primary-button" data-action="add-expense">${icon('plus')} Ajouter une dépense</button></div>
    <div class="stats-grid cost-stats"><div class="stat-card"><div class="stat-icon blue">€</div><span>Total enregistré</span><strong>${money(sum)}</strong><small>Toutes périodes confondues</small></div><div class="stat-card"><div class="stat-icon teal">📅</div><span>Dépenses en ${year}</span><strong>${money(yearSum)}</strong><small>Année civile en cours</small></div><div class="stat-card"><div class="stat-icon orange">🧾</div><span>Transactions</span><strong>${state.expenses.length}</strong><small>Dépenses saisies</small></div></div>
    <div class="cost-layout"><section class="panel"><div class="panel-heading"><div><span class="eyebrow">RÉPARTITION</span><h3>Dépenses par catégorie</h3></div></div>${totals.length?totals.map(t=>`<div class="category-line"><div><b>${esc(t.name)}</b><strong>${money(t.total)}</strong></div><div class="bar-track"><i style="width:${t.total/max*100}%"></i></div></div>`).join(''):`<div class="empty-state compact-empty"><div class="empty-illustration">📊</div><b>Pas encore de dépenses</b><p>Ajoutez vos dépenses pour voir leur répartition.</p></div>`}</section>
    <section class="panel"><div class="panel-heading"><div><span class="eyebrow">PAR VÉHICULE</span><h3>Comparatif du garage</h3></div></div>${state.vehicles.map(v=>{const total=state.expenses.filter(e=>e.vehicleId===v.id).reduce((a,e)=>a+Number(e.amount||0),0);const km=v.mileage;return `<div class="vehicle-cost"><div class="vehicle-cost-top"><span class="vehicle-dot" style="background:${v.color}"></span><b>${esc(v.make)} ${esc(v.model)}</b><strong>${money(total)}</strong></div><small>${km?`${money(total/Math.max(1,km))} / km sur la base du kilométrage actuel`:'Renseignez le kilométrage pour calculer un coût/km indicatif'}</small></div>`}).join('')}</section></div>
    <section class="panel table-panel expense-table"><div class="panel-heading"><div><span class="eyebrow">HISTORIQUE FINANCIER</span><h3>Dernières dépenses</h3></div></div>${state.expenses.length?`<div class="expense-list">${state.expenses.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(e=>`<div class="expense-row"><div class="row-icon">${e.category==='Carburant'?'⛽':'€'}</div><div class="row-main"><b>${esc(e.label)}</b><small>${esc(e.category)} · ${esc(vehicle(e.vehicleId)?.make||'')} · ${e.date?new Date(e.date+'T12:00:00').toLocaleDateString('fr-FR'):'Date inconnue'}</small></div><strong>${money(e.amount)}</strong><button class="row-delete" data-delete-expense="${e.id}">×</button></div>`).join('')}</div>`:`<div class="empty-state compact-empty"><p>Aucune dépense enregistrée pour le moment.</p></div>`}</section>`;
}
function renderSettings() {
  return `<div class="page-heading"><div><div class="eyebrow">APPLICATION</div><h1>Paramètres & <em>données.</em></h1><p class="subheading">Vos informations restent stockées localement sur cet appareil.</p></div></div>
  <div class="settings-grid"><section class="panel"><div class="panel-heading"><div><span class="eyebrow">SAUVEGARDE</span><h3>Protéger mes données</h3></div><span class="panel-icon">🔐</span></div><p class="panel-copy">Exportez un fichier JSON contenant vos véhicules, votre historique d'entretien et vos dépenses. Conservez-le dans un endroit sûr.</p><div class="settings-actions"><button class="primary-button" data-action="export">${icon('download')} Exporter mes données</button><button class="secondary-button" data-action="import">${icon('upload')} Importer une sauvegarde</button><input type="file" id="import-file" accept="application/json,.json" hidden></div></section>
  <section class="panel"><div class="panel-heading"><div><span class="eyebrow">STOCKAGE</span><h3>Sur cet appareil</h3></div><span class="panel-icon">💾</span></div><div class="storage-info"><span class="storage-dot"></span><div><b>Stockage local actif</b><small>Les données sont conservées dans le navigateur de cet appareil.</small></div></div><p class="warning-note">Attention : vider les données du navigateur ou désinstaller le navigateur peut supprimer les informations. Pensez à exporter régulièrement une sauvegarde.</p></section>
  <section class="panel"><div class="panel-heading"><div><span class="eyebrow">À PROPOS</span><h3>Mon Entretien Auto</h3></div><span class="version-tag">V0.1</span></div><p class="panel-copy">Prototype personnel. Les échéances sont calculées uniquement à partir des intervalles que vous saisissez. Aucune donnée constructeur n'est préchargée ou garantie dans cette version.</p><p class="panel-copy">La communauté, l'immatriculation automatique et les recommandations techniques sourcées sont prévues pour des versions ultérieures.</p></section></div>`;
}
function renderPage() {
  return ({dashboard:renderDashboard,garage:renderGarage,maintenance:renderMaintenance,costs:renderCosts,settings:renderSettings})[page]();
}
function refresh() { appShell(); }
function bindGlobal() {
  document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{page=b.dataset.page;refresh();}));
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>handleAction(b.dataset.action)));
  document.querySelectorAll('[data-edit-vehicle]').forEach(b=>b.addEventListener('click',()=>openVehicleModal(b.dataset.editVehicle)));
  document.querySelectorAll('[data-delete-vehicle]').forEach(b=>b.addEventListener('click',()=>deleteVehicle(b.dataset.deleteVehicle)));
  document.querySelectorAll('[data-delete-service]').forEach(b=>b.addEventListener('click',()=>deleteService(b.dataset.deleteService)));
  document.querySelectorAll('[data-delete-expense]').forEach(b=>b.addEventListener('click',()=>deleteExpense(b.dataset.deleteExpense)));
  document.querySelector('#service-filter')?.addEventListener('change', e=>{
    const rows=state.services.filter(s=>e.target.value==='all'||s.vehicleId===e.target.value).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    document.querySelector('#service-rows').innerHTML=rows.length?rows.map(serviceRow).join(''):`<div class="empty-state compact-empty">Aucune opération pour ce véhicule.</div>`;
    document.querySelectorAll('[data-delete-service]').forEach(b=>b.addEventListener('click',()=>deleteService(b.dataset.deleteService)));
  });
}
function handleAction(action) {
  if(action==='add-vehicle') openVehicleModal();
  if(action==='add-service') openServiceModal();
  if(action==='add-expense') openExpenseModal();
  if(action==='export') exportData();
  if(action==='import') document.querySelector('#import-file')?.click();
}
function modal(title, body, submitLabel, onSubmit) {
  const root=document.querySelector('#modal-root');
  root.innerHTML=`<div class="modal-backdrop"><section class="modal"><div class="modal-head"><div><span class="eyebrow">MON ENTRETIEN AUTO</span><h2>${title}</h2></div><button class="icon-button modal-close" aria-label="Fermer">${icon('close')}</button></div><form id="modal-form">${body}<div class="modal-actions"><button type="button" class="secondary-button modal-cancel">Annuler</button><button class="primary-button" type="submit">${submitLabel}</button></div></form></section></div>`;
  root.querySelector('.modal-close').onclick=()=>root.innerHTML='';
  root.querySelector('.modal-cancel').onclick=()=>root.innerHTML='';
  root.querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))root.innerHTML='';});
  root.querySelector('#modal-form').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);onSubmit(Object.fromEntries(fd.entries()));};
}
function field(label,name,value='',type='text',extra='') {
  return `<label class="form-field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
}
function vehicleSelect(selected) {
  return `<label class="form-field"><span>Véhicule</span><select name="vehicleId" required>${state.vehicles.map(v=>`<option value="${v.id}" ${selected===v.id?'selected':''}>${esc(v.make)} ${esc(v.model)}</option>`).join('')}</select></label>`;
}
function openVehicleModal(id) {
  const v=id?vehicle(id):{make:'',model:'',year:new Date().getFullYear(),engine:'',power:'',fuel:'Essence',registration:'',mileage:'',note:''};
  modal(id?'Modifier le véhicule':'Ajouter un véhicule',`
    <div class="form-grid">${field('Marque','make',v.make,'text','required')}${field('Modèle','model',v.model,'text','required')}${field('Année','year',v.year,'number','min="1900" max="2100"')}${field('Motorisation','engine',v.engine)}${field('Puissance','power',v.power)}<label class="form-field"><span>Carburant</span><select name="fuel"><option ${v.fuel==='Essence SP95-E10'?'selected':''}>Essence SP95-E10</option><option ${v.fuel==='Essence'?'selected':''}>Essence</option><option ${v.fuel==='Essence + E85'?'selected':''}>Essence + E85</option><option ${v.fuel==='Diesel'?'selected':''}>Diesel</option><option ${v.fuel==='GPL'?'selected':''}>GPL</option><option>Hybride</option><option>Électrique</option><option>Autre</option></select></label>${field('Immatriculation (facultatif)','registration',v.registration)}${field('Kilométrage actuel','mileage',v.mileage??'','number','min="0" placeholder="Ex. 128500"')}</div><label class="form-field"><span>Modifications / notes</span><textarea name="note" rows="3">${esc(v.note)}</textarea></label>`,
    id?'Enregistrer':'Ajouter au garage',d=>{
      const data={...v,...d,year:Number(d.year)||null,mileage:d.mileage===''?null:Number(d.mileage)};
      if(id) state.vehicles=state.vehicles.map(x=>x.id===id?data:x);
      else state.vehicles.push({...data,id:uid(),color:'#48b5a2'});
      save();refresh();showToast('Fiche véhicule enregistrée.');
    });
}
function openServiceModal() {
  modal('Nouvelle opération',`
    ${vehicleSelect(state.activeVehicle)}
    <div class="form-grid"><label class="form-field"><span>Catégorie</span><select name="category"><option>Entretien courant</option><option>Vidange</option><option>Filtres</option><option>Pneumatiques</option><option>Freinage</option><option>Distribution</option><option>Allumage</option><option>Réparation</option><option>Autre</option></select></label>${field('Nom de l’opération','name','','text','required')}${field('Date','date',today(),'date','required')}${field('Kilométrage réalisé','mileage','','number','min="0"')}${field('Coût (€)','cost','','number','min="0" step="0.01"')}${field('Intervalle kilométrique suivant','intervalKm','','number','min="1" placeholder="Facultatif"')}${field('Dernier kilométrage de référence','lastKm','','number','min="0" placeholder="Par défaut : kilométrage réalisé"')}</div>
    <label class="form-field"><span>Pièces, références et commentaires</span><textarea name="notes" rows="3" placeholder="Marque, référence, garage, remarques…"></textarea></label>
    <p class="form-hint">L'intervalle est facultatif. Les échéances ne sont calculées que si vous renseignez une périodicité fiable.</p>`,
    'Enregistrer l’opération',d=>{
      state.services.push({...d,id:uid(),mileage:d.mileage===''?null:Number(d.mileage),cost:Number(d.cost)||0,intervalKm:d.intervalKm===''?null:Number(d.intervalKm),lastKm:d.lastKm===''?(d.mileage===''?null:Number(d.mileage)):Number(d.lastKm)});
      if(d.cost && Number(d.cost)>0) state.expenses.push({id:uid(),vehicleId:d.vehicleId,label:d.name,category:d.category==='Pneumatiques'?'Pneumatiques':d.category==='Réparation'?'Réparation':'Entretien',date:d.date,amount:Number(d.cost),linkedService:true});
      save();refresh();showToast('Opération enregistrée.');
    });
}
function openExpenseModal() {
  modal('Nouvelle dépense',`
    ${vehicleSelect(state.activeVehicle)}
    <div class="form-grid">${field('Intitulé','label','','text','required')}<label class="form-field"><span>Catégorie</span><select name="category"><option>Carburant</option><option>Entretien</option><option>Pneumatiques</option><option>Réparation</option><option>Assurance</option><option>Contrôle technique</option><option>Financement</option><option>Autre</option></select></label>${field('Montant (€)','amount','','number','min="0.01" step="0.01" required')}${field('Date','date',today(),'date','required')}${field('Kilométrage (facultatif)','mileage','','number','min="0"')}</div>
    <label class="form-field"><span>Détails (facultatif)</span><textarea name="notes" rows="2"></textarea></label>
    <p class="form-hint">Une dépense saisie ici est indépendante du carnet d'entretien. Le coût d'une intervention enregistrée avec un montant est automatiquement ajouté aux dépenses.</p>`,
    'Enregistrer la dépense',d=>{
      state.expenses.push({...d,id:uid(),amount:Number(d.amount),mileage:d.mileage===''?null:Number(d.mileage)});
      save();refresh();showToast('Dépense enregistrée.');
    });
}
function deleteVehicle(id) {
  if(state.vehicles.length<2)return;
  if(!confirm('Supprimer ce véhicule et ses opérations/dépenses associées ?'))return;
  state.vehicles=state.vehicles.filter(v=>v.id!==id);state.services=state.services.filter(s=>s.vehicleId!==id);state.expenses=state.expenses.filter(e=>e.vehicleId!==id);
  if(state.activeVehicle===id)state.activeVehicle=state.vehicles[0].id;
  save();refresh();showToast('Véhicule supprimé.');
}
function deleteService(id) {
  if(!confirm('Supprimer cette opération ? La dépense liée, si elle existe, ne sera pas supprimée automatiquement.'))return;
  state.services=state.services.filter(s=>s.id!==id);save();refresh();showToast('Opération supprimée.');
}
function deleteExpense(id) {
  if(!confirm('Supprimer cette dépense ?'))return;
  state.expenses=state.expenses.filter(e=>e.id!==id);save();refresh();showToast('Dépense supprimée.');
}
function exportData() {
  const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString(),appVersion:'0.1.0'},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`mon-entretien-auto-sauvegarde-${today()}.json`;a.click();URL.revokeObjectURL(url);showToast('Sauvegarde exportée.');
}
function importData(file) {
  const reader=new FileReader();
  reader.onload=()=>{
    try {
      const data=JSON.parse(reader.result);
      if(!Array.isArray(data.vehicles)||!Array.isArray(data.services)||!Array.isArray(data.expenses))throw new Error('Format invalide');
      if(!confirm('Importer cette sauvegarde et remplacer les données actuelles ?'))return;
      state={...structuredClone(seed),...data};save();refresh();showToast('Sauvegarde importée.');
    } catch { showToast('Fichier invalide ou illisible.'); }
  };
  reader.readAsText(file);
}
document.addEventListener('change',e=>{if(e.target.id==='import-file'&&e.target.files[0])importData(e.target.files[0]);});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.deferredInstallPrompt=e;});
if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
appShell();
