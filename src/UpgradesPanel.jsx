import { useState } from 'react';
import { api, fmt, T } from './api.js';

const UPGRADES_CATALOGUE = [
  { id:'wifi_basique',          label:'Wi-Fi Basique',         emoji:'📶', prix:120_000,  desc:'+3% occupation',        effet:'+3% occ.' },
  { id:'wifi_premium',          label:'Wi-Fi Premium',         emoji:'📡', prix:280_000,  desc:'+6% occupation',        effet:'+6% occ.' },
  { id:'restaurant_bistro',     label:'Restaurant Bistro',     emoji:'🍽', prix:200_000,  desc:'+5 satisfaction',       effet:'+5 sat.' },
  { id:'restaurant_specialite', label:'Restaurant Spécialité', emoji:'🥩', prix:450_000,  desc:'+8 satisfaction',       effet:'+8 sat.' },
  { id:'restaurant_gastronomique',label:'Restaurant Gastro',   emoji:'⭐', prix:900_000,  desc:'+12 satisfaction',      effet:'+12 sat.' },
  { id:'mini_spa',              label:'Mini Spa',              emoji:'💆', prix:180_000,  desc:'+4 satisfaction',       effet:'+4 sat.' },
  { id:'spa_premium',           label:'Spa Premium',           emoji:'🛁', prix:650_000,  desc:'+9 satisfaction',       effet:'+9 sat.' },
  { id:'pont_soleil',           label:'Pont Soleil',           emoji:'☀️', prix:160_000,  desc:'+5% occupation',        effet:'+5% occ.' },
  { id:'pont_infinity',         label:'Pont Infinity Pool',    emoji:'🏊', prix:520_000,  desc:'+8% occupation',        effet:'+8% occ.' },
  { id:'casino',                label:'Casino',                emoji:'🎰', prix:380_000,  desc:'+6% revenus bruts',     effet:'+6% rev.' },
  { id:'theatre',               label:'Théâtre',               emoji:'🎭', prix:420_000,  desc:'+7 satisfaction',       effet:'+7 sat.' },
  { id:'kids_club',             label:'Kids Club',             emoji:'🎠', prix:220_000,  desc:'+4% occupation familles',effet:'+4% occ.' },
  { id:'parc_aquatique',        label:'Parc Aquatique',        emoji:'🎢', prix:780_000,  desc:'+10% occupation',       effet:'+10% occ.' },
  { id:'cabines_suite',         label:'Suites Luxe',           emoji:'👑', prix:1_200_000,desc:'+15 satisfaction',      effet:'+15 sat.' },
  { id:'yacht_club',            label:'Yacht Club Privé',      emoji:'⚓', prix:2_000_000,desc:'+20 satisfaction',      effet:'+20 sat.' },
  { id:'helipad',               label:'Hélipad',               emoji:'🚁', prix:3_500_000,desc:'+5 prestige compagnie', effet:'+5 prestige' },
];

export default function UpgradesPanel({ company, userId, onRefresh }) {
  const [selectedNavire, setSelectedNavire] = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [msg,            setMsg]            = useState(null);

  const navires  = company?.flotte || [];
  const capital  = company?.capital || 0;

  const handleUpgrade = async (upgradeId, upgradeLabel) => {
    if (!selectedNavire || !userId || loading) return;
    setLoading(true); setMsg(null);
    try {
      await api.upgradeShip(userId, selectedNavire.uid, upgradeId);
      setMsg({ ok: true, text: `✅ ${upgradeLabel} installé sur ${selectedNavire.nom} !` });
      // Mettre à jour selectedNavire
      setTimeout(() => { setMsg(null); onRefresh(); }, 2000);
    } catch(e) {
      setMsg({ ok: false, text: e.message });
    } finally { setLoading(false); }
  };

  const navireUpgrades = selectedNavire?.upgrades || [];
  const availableUpgrades = UPGRADES_CATALOGUE.filter(u => !navireUpgrades.includes(u.id));
  const installedUpgrades = UPGRADES_CATALOGUE.filter(u => navireUpgrades.includes(u.id));

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.title}>🔧 Upgrades Navires</div>
        <div style={S.capital}>💳 {fmt(capital)}</div>
      </div>

      {msg && (
        <div style={{ ...S.msg, background: msg.ok ? 'rgba(39,174,96,0.12)' : 'rgba(192,57,43,0.12)', borderColor: msg.ok ? T.green : T.red, color: msg.ok ? T.green : T.red }}>
          {msg.text}
        </div>
      )}

      {/* Sélection navire */}
      <div style={S.section}>⛴ Choisir un navire</div>
      <div style={S.navires}>
        {navires.length === 0 && <div style={S.empty}>Aucun navire — achetez-en un dans le Marché</div>}
        {navires.map(n => {
          const isSel = selectedNavire?.uid === n.uid;
          return (
            <div
              key={n.uid}
              style={{ ...S.navireBtn, ...(isSel ? S.navireBtnSel : {}) }}
              onClick={() => setSelectedNavire(isSel ? null : n)}
            >
              <span style={{ fontSize: 22 }}>{n.flag || '🚢'}</span>
              <div>
                <div style={S.navireNom}>{n.nom}</div>
                <div style={{ fontSize:10, color:T.mid }}>🔧 {n.upgrades?.length || 0} upgrade{(n.upgrades?.length||0)>1?'s':''} installée{(n.upgrades?.length||0)>1?'s':''}</div>
              </div>
              {isSel && <span style={{ marginLeft:'auto', color:T.gold }}>▼</span>}
            </div>
          );
        })}
      </div>

      {/* Upgrades installées */}
      {selectedNavire && installedUpgrades.length > 0 && (
        <>
          <div style={S.section}>✅ Déjà installées</div>
          <div style={S.upgradesList}>
            {installedUpgrades.map(u => (
              <div key={u.id} style={S.upgradeInstalled}>
                <span style={{ fontSize:20 }}>{u.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.green }}>{u.label}</div>
                  <div style={{ fontSize:11, color:T.mid }}>{u.effet}</div>
                </div>
                <span style={{ fontSize:11, color:T.green, fontWeight:700 }}>✅</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Upgrades disponibles */}
      {selectedNavire && (
        <>
          <div style={S.section}>
            🛒 Disponibles {availableUpgrades.length === 0 ? '— Tout est installé !' : `(${availableUpgrades.length})`}
          </div>
          <div style={S.upgradesList}>
            {availableUpgrades.map(u => {
              const canBuy = capital >= u.prix;
              return (
                <div key={u.id} style={{ ...S.upgradeCard, ...(!canBuy ? S.upgradeCardLocked : {}) }}>
                  <span style={{ fontSize:22 }}>{u.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.dark }}>{u.label}</div>
                    <div style={{ fontSize:11, color:T.mid, marginTop:2 }}>{u.desc}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:canBuy?T.green:T.red, marginBottom:4 }}>
                      {fmt(u.prix)}
                    </div>
                    <button
                      style={{ ...S.buyBtn, opacity: (!canBuy || loading) ? 0.5 : 1, background: canBuy ? T.gold : '#999' }}
                      onClick={() => canBuy && handleUpgrade(u.id, u.label)}
                      disabled={!canBuy || loading}
                    >
                      {loading ? '...' : 'Acheter'}
                    </button>
                  </div>
                </div>
              );
            })}
            {availableUpgrades.length === 0 && (
              <div style={{ textAlign:'center', padding:20, color:T.green, fontSize:13, fontWeight:600 }}>
                🎉 Ce navire a toutes les upgrades disponibles !
              </div>
            )}
          </div>
        </>
      )}

      {!selectedNavire && navires.length > 0 && (
        <div style={S.hint}>👆 Sélectionnez un navire pour voir ses upgrades</div>
      )}
    </div>
  );
}

const S = {
  root         : { display:'flex', flexDirection:'column', height:'100%', overflowY:'auto', background:T.bg, fontFamily:T.ff },
  header       : { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:T.parchment, borderBottom:`2px solid ${T.border}`, flexShrink:0 },
  title        : { fontSize:16, fontWeight:700, color:T.dark },
  capital      : { fontSize:13, fontWeight:700, color:T.gold, background:'rgba(139,105,20,0.1)', padding:'5px 12px', borderRadius:20, border:`1px solid ${T.border}` },
  msg          : { margin:'8px 12px', padding:'10px', borderRadius:8, border:'1px solid', fontSize:12, fontWeight:600, textAlign:'center' },
  section      : { padding:'8px 14px', fontSize:11, fontWeight:700, color:T.gold, textTransform:'uppercase', letterSpacing:1, background:T.parchment, borderBottom:`1px solid ${T.border}`, borderTop:`1px solid ${T.border}` },
  navires      : { padding:'8px 12px', display:'flex', flexDirection:'column', gap:6 },
  empty        : { textAlign:'center', color:T.mid, fontSize:12, padding:16 },
  navireBtn    : { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:T.parchment, borderRadius:10, border:`1px solid ${T.border}`, cursor:'pointer', transition:'all 0.15s' },
  navireBtnSel : { border:`2px solid ${T.gold}`, background:'rgba(255,240,180,0.98)' },
  navireNom    : { fontSize:13, fontWeight:700, color:T.dark },
  upgradesList : { padding:'8px 12px', display:'flex', flexDirection:'column', gap:6 },
  upgradeCard  : { display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:T.parchment, borderRadius:10, border:`1px solid ${T.border}`, boxShadow:T.shadowSm },
  upgradeCardLocked:{ opacity:0.65 },
  upgradeInstalled:{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(39,174,96,0.08)', borderRadius:10, border:`1px solid rgba(39,174,96,0.3)` },
  buyBtn       : { padding:'5px 12px', borderRadius:8, border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:T.ff },
  hint         : { textAlign:'center', padding:24, color:T.mid, fontSize:13, fontStyle:'italic' },
};
