// ── Client API centralisé ────────────────────────────────────────────────────
// Toutes les communications avec le bot passent par ici

const BASE = ''; // Proxy Vercel → /api/* → bot

export async function fetchGameState() {
  const r = await fetch('/api/gamestate');
  if (!r.ok) throw new Error('API indisponible');
  return r.json();
}

export async function doAction(userId, action, params = {}) {
  const r = await fetch('/api/action', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ userId, action, params }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

// Helpers spécialisés
export const api = {
  foundCompany : (userId, nom, logo, slogan) =>
    doAction(userId, 'found_company', { nom, logo, slogan }),
  buyShip      : (userId, navireId, nom) =>
    doAction(userId, 'buy_ship', { navireId, nom }),
  assignRoute  : (userId, navireUid, routeId) =>
    doAction(userId, 'assign_route', { navireUid, routeId }),
  removeRoute  : (userId, navireUid) =>
    doAction(userId, 'remove_route', { navireUid }),
  upgradeShip  : (userId, navireUid, upgradeId) =>
    doAction(userId, 'upgrade_ship', { navireUid, upgradeId }),
  renameShip   : (userId, navireUid, nom) =>
    doAction(userId, 'rename_ship', { navireUid, nom }),
  setFlag      : (userId, navireUid, flag) =>
    doAction(userId, 'set_flag', { navireUid, flag }),
  dailyDecision: (userId, choixId) =>
    doAction(userId, 'daily_decision', { choixId }),
  sellShip     : (userId, navireUid) =>
    doAction(userId, 'sell_ship', { navireUid }),
};

export const fmt = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1e9) return `${(n/1e9).toFixed(2)}Md 🪙`;
  if (n >= 1e6) return `${(n/1e6).toFixed(2)}M 🪙`;
  if (n >= 1e3) return `${(n/1e3).toFixed(1)}K 🪙`;
  return `${n} 🪙`;
};

export const satisfEmoji = s =>
  s >= 90 ? '🤩' : s >= 75 ? '😊' : s >= 55 ? '😐' : s >= 35 ? '😟' : '😡';

export const satisfColor = s =>
  s >= 75 ? '#16a34a' : s >= 55 ? '#ca8a04' : s >= 35 ? '#ea580c' : '#dc2626';

// Thème parchemin global
export const T = {
  parchment : 'rgba(255,248,220,0.98)',
  bg        : '#f0deb0',
  bgDeep    : '#e8d49a',
  border    : 'rgba(139,105,20,0.4)',
  borderStrong: 'rgba(139,105,20,0.7)',
  dark      : '#2c1a06',
  mid       : '#5d4e37',
  gold      : '#8b6914',
  goldLight : '#d4a017',
  red       : '#c0392b',
  green     : '#27ae60',
  blue      : '#2980b9',
  ff        : 'Georgia, serif',
  shadow    : '0 4px 16px rgba(0,0,0,0.2)',
  shadowSm  : '0 2px 8px rgba(0,0,0,0.15)',
};
