/**
 * Jeux de données de démonstration – Mon Entretien Auto.
 * Ce module est volontairement séparé du reste de l'application pour être
 * repris dans toutes les futures versions de test, même si le stockage change.
 *
 * Les associations marque/modèle/motorisation sont plausibles, mais les
 * voitures créées sont entièrement fictives : ce n'est pas un catalogue
 * constructeur et aucun conseil mécanique ne doit reposer dessus.
 */
const DEMO_CATALOG = [
  { code:'sandero-stepway', make:'Dacia', model:'Sandero Stepway III', generation:'III, phase 1', bodyStyle:'Citadine', engine:'TCe 90', power:'90 ch', fuel:'Essence SP95-E10', first:2021, last:2024 },
  { code:'punto-evo', make:'Fiat', model:'Punto Evo', generation:'199, phase Evo', bodyStyle:'Citadine', engine:'1.2 FIRE', power:'69 ch', fuel:'Essence + E85', first:2010, last:2012 },
  { code:'clio-iv', make:'Renault', model:'Clio IV', generation:'IV, phase 1/2', bodyStyle:'Citadine', engine:'0.9 TCe', power:'90 ch', fuel:'Essence', first:2013, last:2018 },
  { code:'golf-vii', make:'Volkswagen', model:'Golf VII', generation:'VII, phase 2', bodyStyle:'Compacte', engine:'1.5 TSI', power:'150 ch', fuel:'Essence SP95-E10', first:2017, last:2019 },
  { code:'peugeot-308', make:'Peugeot', model:'308 II', generation:'II, phase 2', bodyStyle:'Compacte', engine:'1.5 BlueHDi', power:'130 ch', fuel:'Diesel', first:2018, last:2021 },
  { code:'citroen-c3', make:'Citroën', model:'C3 III', generation:'III', bodyStyle:'Citadine', engine:'1.2 PureTech', power:'82 ch', fuel:'Essence', first:2017, last:2021 },
  { code:'yaris-iv', make:'Toyota', model:'Yaris IV', generation:'IV', bodyStyle:'Citadine', engine:'1.5 Hybrid', power:'116 ch', fuel:'Hybride', first:2020, last:2024 },
  { code:'corolla-ts', make:'Toyota', model:'Corolla Touring Sports', generation:'XII', bodyStyle:'Break', engine:'1.8 Hybrid', power:'122 ch', fuel:'Hybride', first:2019, last:2022 },
  { code:'tucson-iv', make:'Hyundai', model:'Tucson IV', generation:'IV', bodyStyle:'SUV', engine:'1.6 T-GDi HEV', power:'230 ch', fuel:'Hybride', first:2021, last:2024 },
  { code:'sportage-v', make:'Kia', model:'Sportage V', generation:'V', bodyStyle:'SUV', engine:'1.6 T-GDi', power:'150 ch', fuel:'Essence SP95-E10', first:2022, last:2025 },
  { code:'zoe-ii', make:'Renault', model:'Zoe', generation:'Phase 2', bodyStyle:'Citadine', engine:'R135', power:'135 ch', fuel:'Électrique', first:2020, last:2023 },
  { code:'fiesta-vii', make:'Ford', model:'Fiesta VII', generation:'VII', bodyStyle:'Citadine', engine:'1.0 EcoBoost', power:'100 ch', fuel:'Essence', first:2018, last:2023 },
  { code:'focus-iv', make:'Ford', model:'Focus IV', generation:'IV', bodyStyle:'Compacte', engine:'1.0 EcoBoost', power:'125 ch', fuel:'Essence', first:2019, last:2023 },
  { code:'octavia-iv', make:'Škoda', model:'Octavia Combi IV', generation:'IV', bodyStyle:'Break', engine:'1.5 TSI', power:'150 ch', fuel:'Essence', first:2020, last:2025 },
  { code:'classe-a', make:'Mercedes-Benz', model:'Classe A', generation:'W177', bodyStyle:'Compacte', engine:'A 180', power:'136 ch', fuel:'Essence', first:2019, last:2024 },
  { code:'serie-3', make:'BMW', model:'Série 3', generation:'G20', bodyStyle:'Berline', engine:'320d', power:'190 ch', fuel:'Diesel', first:2019, last:2023 },
  { code:'cx5-ii', make:'Mazda', model:'CX-5 II', generation:'II', bodyStyle:'SUV', engine:'2.0 Skyactiv-G', power:'165 ch', fuel:'Essence', first:2017, last:2023 },
  { code:'swift-hybrid', make:'Suzuki', model:'Swift', generation:'2017, phase 2', bodyStyle:'Citadine', engine:'1.2 Dualjet Hybrid', power:'83 ch', fuel:'Hybride', first:2020, last:2023 },
  { code:'duster-gpl', make:'Dacia', model:'Duster II', generation:'II', bodyStyle:'SUV', engine:'ECO-G 100', power:'100 ch', fuel:'GPL', first:2020, last:2024 },
  { code:'transporter', make:'Volkswagen', model:'Transporter', generation:'T6.1', bodyStyle:'Utilitaire', engine:'2.0 TDI', power:'150 ch', fuel:'Diesel', first:2020, last:2023 },
  { code:'kangoo-iii', make:'Renault', model:'Kangoo III', generation:'III', bodyStyle:'Utilitaire', engine:'Blue dCi 95', power:'95 ch', fuel:'Diesel', first:2021, last:2025 },
  { code:'corsa-f', make:'Opel', model:'Corsa F', generation:'F', bodyStyle:'Citadine', engine:'1.2', power:'75 ch', fuel:'Essence', first:2020, last:2025 },
  { code:'fiat-500e', make:'Fiat', model:'500e', generation:'2020', bodyStyle:'Citadine', engine:'Électrique 42 kWh', power:'118 ch', fuel:'Électrique', first:2021, last:2025 },
  { code:'leaf-ii', make:'Nissan', model:'Leaf II', generation:'ZE1', bodyStyle:'Compacte', engine:'Électrique 40 kWh', power:'150 ch', fuel:'Électrique', first:2018, last:2024 },
  { code:'captur-e-tech', make:'Renault', model:'Captur II', generation:'II', bodyStyle:'SUV', engine:'E-Tech full hybrid', power:'145 ch', fuel:'Hybride', first:2022, last:2025 }
];

const TEST_COLORS = ['#48b5a2','#6b9fd5','#f4a340','#9e8bda','#d37676','#a2b5be'];
const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
export const isDemoVehicle = v => v?.isDemo === true;

/** Crée des objets compatibles avec le modèle vehicle de V0.2. */
export function makeDemoVehicles(count, existingVehicles, generateId) {
  const used = new Set(existingVehicles.filter(isDemoVehicle).map(v => v.demoFixtureCode));
  // Privilégier des modèles différents tant que le catalogue le permet.
  const fresh = DEMO_CATALOG.filter(v => !used.has(v.code)).sort(() => Math.random() - .5);
  const repeat = DEMO_CATALOG.slice().sort(() => Math.random() - .5);
  const candidates = [...fresh, ...repeat];
  const now = new Date().getFullYear();
  return Array.from({length: count}, (_, index) => {
    const source = candidates[index % candidates.length];
    const year = rand(source.first, Math.min(source.last, now));
    const age = Math.max(1, now - year);
    // Quelques fiches sans kilométrage pour tester les champs facultatifs.
    const mileage = Math.random() < .12 ? null : Math.max(3000, Math.round((age * rand(6000, 22500) + rand(0, 16000)) / 100) * 100);
    return {
      id: generateId(), make:source.make, model:source.model,
      generation:source.generation, bodyStyle:source.bodyStyle, year,
      engine:source.engine, power:source.power, fuel:source.fuel,
      registration:'', mileage, color:TEST_COLORS[rand(0,TEST_COLORS.length-1)],
      photoId:null, note:'Données fictives générées pour tester Mon Entretien Auto.',
      isDemo:true, demoFixtureCode:source.code,
      demoCreatedAt:new Date().toISOString()
    };
  });
}
