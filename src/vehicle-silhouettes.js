// Dessins génériques de carrosserie, sans correspondance à un modèle constructeur.
export const BODY_STYLES = ['Citadine','Berline','Compacte','Break','SUV','Tout-terrain / 4×4','Pick-up','Monospace','Coupé','Cabriolet','Utilitaire','Autre'];

const profiles = {
  Citadine: { body:'M35 110 L43 88 Q47 82 65 81 L91 52 Q98 45 115 45 H169 Q183 46 194 61 L211 82 L229 89 Q238 95 238 112 V126 H35Z', windows:'M76 79 L101 53 H126 V79Z M135 53 H168 Q177 54 184 65 L194 79 H135Z', wheels:[78,196] },
  Compacte: { body:'M25 111 L33 88 L69 80 L98 50 H170 Q183 51 195 66 L211 85 L248 94 L256 112 V126 H25Z', windows:'M82 79 L105 57 H130 V79Z M139 57 H169 L190 80 H139Z', wheels:[73,212] },
  Berline: { body:'M19 111 L27 93 L72 83 L104 53 H169 Q180 54 190 65 L211 86 L258 94 L268 110 V126 H19Z', windows:'M87 81 L111 60 H139 V81Z M148 60 H168 L191 82 H148Z', wheels:[69,222] },
  Break: { body:'M22 110 L28 70 L43 51 H171 Q181 53 193 68 L210 85 L253 94 L263 111 V126 H22Z', windows:'M38 78 L46 59 H91 V79Z M100 59 H137 V80 H100Z M146 59 H169 L190 81 H146Z', wheels:[68,220] },
  SUV: { body:'M23 111 L27 76 L50 47 H165 Q183 48 197 69 L211 83 L250 91 L260 109 V129 H23Z', windows:'M41 77 L58 55 H100 V78Z M109 55 H146 V79 H109Z M155 56 H165 Q177 57 188 79 H155Z', wheels:[69,218] },
  'Tout-terrain / 4×4': { body:'M25 116 V59 H43 V40 H160 L185 74 L231 79 V88 H253 V132 H25Z', windows:'M51 51 H93 V78 H51Z M103 51 H151 L168 78 H103Z', wheels:[68,212], extra:'<path d="M22 72 H13 V110 H25 M42 40 H165 M181 86 V112" fill="none" stroke="currentColor" stroke-width="6"/>' },
  'Pick-up': { body:'M19 111 V79 H105 V48 H163 L190 80 L245 88 L258 107 V128 H19Z', windows:'M115 56 H139 V80 H115Z M148 56 H158 L177 80 H148Z', wheels:[64,216], extra:'<path d="M25 87 H98 V110 M107 85 V115" fill="none" stroke="#40535a" stroke-width="3"/>' },
  Monospace: { body:'M22 112 L28 65 L50 40 H164 Q178 42 191 59 L220 88 L252 96 L261 113 V128 H22Z', windows:'M41 78 L49 49 H87 V80Z M96 49 H134 V81 H96Z M143 49 H160 Q174 50 184 64 L199 82 H143Z', wheels:[68,218] },
  'Coupé': { body:'M20 113 L30 96 L79 83 L116 55 Q122 51 138 51 H161 Q177 54 194 80 L251 94 L264 112 V126 H20Z', windows:'M95 82 L125 59 H143 V82Z M152 59 H159 Q172 60 185 83 H152Z', wheels:[70,221] },
  Cabriolet: { body:'M20 113 L28 96 L81 86 L102 62 H112 L101 87 H174 L183 79 L204 87 L250 94 L264 111 V126 H20Z', windows:'M92 85 L106 66 L102 85Z', wheels:[70,221], extra:'<path d="M117 87 V77 H133 V87 M151 87 V77 H167 V87" fill="none" stroke="#40535a" stroke-width="4"/>' },
  Utilitaire: { body:'M20 113 V46 Q20 37 31 37 H168 L198 77 L242 87 L256 109 V130 H20Z', windows:'M150 47 H164 L186 77 H150Z', wheels:[64,216], extra:'<path d="M138 45 V113 M35 51 H124 V85 H35Z" fill="none" stroke="#40535a" stroke-width="2"/>' }
};

export function genericSilhouette(bodyStyle) {
  const aliases = {'4x4':'Tout-terrain / 4×4','4×4':'Tout-terrain / 4×4','Tout-terrain':'Tout-terrain / 4×4','Pickup':'Pick-up'};
  const type=aliases[bodyStyle] || bodyStyle;
  const p=profiles[type];
  if (!p) return null;
  const wheels=p.wheels.map(x=>`<circle cx="${x}" cy="125" r="23" fill="#080e13" stroke="#51666e" stroke-width="2"/><circle cx="${x}" cy="125" r="11" fill="#263942"/><circle cx="${x}" cy="125" r="4" fill="#71858b"/>`).join('');
  return {type,svg:`<svg viewBox="0 0 290 165" aria-hidden="true" focusable="false"><ellipse cx="145" cy="149" rx="120" ry="5" fill="#030a0e" opacity=".35"/><path d="${p.body}" fill="currentColor" stroke="#536b73" stroke-width="1.5" stroke-linejoin="round"/><path d="${p.windows}" fill="#658982" opacity=".5"/>${p.extra||''}<path d="M35 112 H248" stroke="#536b73" opacity=".4"/>${wheels}</svg>`};
}
