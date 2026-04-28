import { useState } from 'react';
import { api, fmt, T } from './api.js';

const REGION_EMOJIS = {
  'Méditerranée': '🌊', 'Adriatique': '🌊', 'Caraïbes': '🌴',
  'Atlantique': '🌊', 'Asie': '⛩', 'Afrique': '🌍',
};
const REGION_COLORS = {
  'Méditerranée': '#f59e0b', 'Adriatique': '#3b82f6', 'Caraïbes': '#10b981',
  'Atlantique': '#6366f1', 'Asie': '#ef4444', 'Afrique': '#f97316',
};

function Saturation({ count }) {
  const label = count === 0 ? '🟢 Libre' : count === 1 ? '🟡 Partagée' : count <= 3 ? '🟠 Chargée' : '🔴 Saturée';
  const color = count === 0 ? T.green : count === 1 ? '#ca8a04' : count <= 3 ? '#ea580c' : T.red;
  return <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label} {count > 0 ? `(${count} conc.)` : ''}</span>;
}

export default function RoutesPanel({ gameData, company, userId, onRefresh }) {
  const [selectedNavire, setSelectedNavire] = useState(null);
  const [selectedRoute,  setSelectedRoute]  = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [msg,            setMsg]            = useState(null);
  const [region,         setRegion]         = useState(null);

  const navires = company?.flotte || [];
  const routes  = gameData?.routes || [];
  const companies = Object.values(gameData?.companies || {});

  // Calcul saturation
  const getSat = (routeId) => {
    let count = 0;
    for (const co of companies) {
      if (co.ownerId === userId) continue;
      count += (co.flotte || []).filter(n => n.routeActive === routeId).length;
    }
    return count;
  };

  const regions = [...new Set(routes.map(r => r.region))];

  const filteredRoutes = routes.filter(r => !region || r.region === region);

  const handleAssign = async () => {
    if (!selectedNavire || !selectedRoute) return;
    setLoading(true); setMsg(null);
    try {
      await api.assignRoute(userId, selectedNavire.uid, selectedRoute.id);
      setMsg({ ok: true, text: `🗺 ${selectedNavire.nom} part sur ${selectedRoute.label} !` });
      setSelectedNavire(null); setSelectedRoute(null);
      setTimeout(() => { setMsg(null); onRefresh(); }, 2500);
    } catch(e) {
      setMsg({ ok: false, text: e.message });
    } finally { setLoading(false); }
  };

  const handleRemove = async (navireUid, navireNom) => {
    setLoading(true); setMsg(null);
    try {
      await api.removeRoute(userId, navireUid);
      setMsg({ ok: true, text: `⚓ ${navireNom} est revenu au port.` });
      setTimeout(() => { setMsg(null); onRefresh(); }, 2000);
    } catch(e) {
      setMsg({ ok: false, text: e.message });
    } finally { setLoading(false); }
  };

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.title}>🗺 Mes Routes</div>
        <div style={S.sub}>{navires.filter(n=>n.routeActive).length}/{navires.length} en mer</div>
      </div>

      {msg && (
        <div style={{ ...S.msg, background: msg.ok ? 'rgba(39,174,96,0.12)' : 'rgba(192,57,43,0.12)', borderColor: msg.ok ? T.green : T.red, color: msg.ok ? T.green : T.red }}>
          {msg.text}
        </div>
      )}

      {/* Flotte actuelle */}
      <div style={S.section}>⛴ Votre Flotte</div>
      <div style={S.naviresList}>
        {navires.length === 0 && <div style={S.empty}>Aucun navire — achetez-en un dans le Marché</div>}
        {navires.map(n => {
          const route  = routes.find(r => r.id === n.routeActive);
          const isSel  = selectedNavire?.uid === n.uid;
          return (
            <div
              key={n.uid}
              style={{ ...S.navireCard, ...(isSel ? S.navireCardSel : {}) }}
              onClick={() => setSelectedNavire(isSel ? null : n)}
            >
              <div style={{ fontSize: 24 }}>{n.flag || '🚢'}</div>
              <div style={{ flex: 1 }}>
                <div style={S.navireNom}>{n.nom}</div>
                <div style={{ fontSize: 11, color: route ? T.green : T.mid }}>
                  {route ? `🟢 ${route.label.split('—').pop()?.trim().slice(0,25) || route.label.slice(0,25)}` : '⚪ Sans route'}
                </div>
              </div>
              {route && (
                <button
                  style={S.removeBtn}
                  onClick={e => { e.stopPropagation(); handleRemove(n.uid, n.nom); }}
                >⚓ Retirer</button>
              )}
              {!route && isSel && (
                <div style={{ fontSize: 11, color: T.gold }}>← Choisir</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sélecteur de routes (si navire sélectionné et sans route) */}
      {selectedNavire && !selectedNavire.routeActive && (
        <>
          <div style={S.section}>
            Choisir une route pour <b>{selectedNavire.nom}</b>
          </div>

          {/* Filtre région */}
          <div style={S.regionFilters}>
            <button style={{ ...S.regionBtn, ...(region === null ? S.regionBtnActive : {}) }} onClick={() => setRegion(null)}>Toutes</button>
            {regions.map(r => (
              <button
                key={r}
                style={{ ...S.regionBtn, ...(region === r ? { ...S.regionBtnActive, background: REGION_COLORS[r], borderColor: REGION_COLORS[r] } : {}) }}
                onClick={() => setRegion(region === r ? null : r)}
              >
                {REGION_EMOJIS[r] || '🌊'} {r}
              </button>
            ))}
          </div>

          {/* Liste routes */}
          <div style={S.routesList}>
            {filteredRoutes.map(route => {
              const sat    = getSat(route.id);
              const isSel  = selectedRoute?.id === route.id;
              const col    = REGION_COLORS[route.region] || T.gold;
              return (
                <div
                  key={route.id}
                  style={{ ...S.routeCard, ...(isSel ? { ...S.routeCardSel, borderColor: col } : {}), borderLeft: `4px solid ${col}` }}
                  onClick={() => setSelectedRoute(isSel ? null : route)}
                >
                  <div style={S.routeTop}>
                    <span style={S.routeLabel}>{route.label}</span>
                    <span style={{ fontSize: 10, color: T.mid }}>{route.duree}j · {'⭐'.repeat(route.popularite)}</span>
                  </div>
                  <div style={S.routeBottom}>
                    <Saturation count={sat} />
                    <span style={{ fontSize: 10, color: T.mid }}>
                      {REGION_EMOJIS[route.region]} {route.region}
                    </span>
                  </div>
                  {isSel && (
                    <button
                      style={{ ...S.assignBtn, background: col, opacity: loading ? 0.6 : 1 }}
                      onClick={e => { e.stopPropagation(); handleAssign(); }}
                      disabled={loading}
                    >
                      {loading ? 'Assignation...' : `✅ Assigner cette route`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedNavire?.routeActive && (
        <div style={S.routeInfo}>
          <div style={S.section}>Route actuelle de {selectedNavire.nom}</div>
          {(() => {
            const route = routes.find(r => r.id === selectedNavire.routeActive);
            return route ? (
              <div style={{ padding: '10px 14px', color: T.mid, fontSize: 13 }}>
                🗺 <b style={{ color: T.dark }}>{route.label}</b><br/>
                ⏱ {route.duree} jours · {REGION_EMOJIS[route.region]} {route.region}<br/><br/>
                <button style={S.removeBtn2} onClick={() => handleRemove(selectedNavire.uid, selectedNavire.nom)}>
                  ⚓ Retirer de cette route
                </button>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}

const S = {
  root        : { display:'flex', flexDirection:'column', height:'100%', overflowY:'auto', background:T.bg, fontFamily:T.ff },
  header      : { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:T.parchment, borderBottom:`2px solid ${T.border}`, flexShrink:0 },
  title       : { fontSize:16, fontWeight:700, color:T.dark },
  sub         : { fontSize:13, color:T.gold, fontWeight:600 },
  msg         : { margin:'8px 12px', padding:'10px', borderRadius:8, border:'1px solid', fontSize:12, fontWeight:600, textAlign:'center' },
  section     : { padding:'8px 14px', fontSize:11, fontWeight:700, color:T.gold, textTransform:'uppercase', letterSpacing:1, background:T.parchment, borderBottom:`1px solid ${T.border}`, borderTop:`1px solid ${T.border}` },
  naviresList : { padding:'8px 12px', display:'flex', flexDirection:'column', gap:6 },
  empty       : { textAlign:'center', color:T.mid, fontSize:12, padding:16 },
  navireCard  : { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:T.parchment, borderRadius:10, border:`1px solid ${T.border}`, cursor:'pointer', transition:'all 0.15s' },
  navireCardSel:{ border:`2px solid ${T.gold}`, background:'rgba(255,240,180,0.98)' },
  navireNom   : { fontSize:13, fontWeight:700, color:T.dark },
  removeBtn   : { padding:'4px 10px', borderRadius:6, border:`1px solid ${T.red}`, background:'transparent', color:T.red, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:T.ff },
  regionFilters:{ display:'flex', gap:5, padding:'8px 12px', overflowX:'auto', flexShrink:0 },
  regionBtn   : { padding:'4px 10px', borderRadius:14, border:`1px solid ${T.border}`, background:'transparent', color:T.mid, fontSize:10, cursor:'pointer', whiteSpace:'nowrap', fontFamily:T.ff },
  regionBtnActive:{ background:T.gold, color:'#fff', borderColor:T.gold },
  routesList  : { padding:'8px 12px', display:'flex', flexDirection:'column', gap:6 },
  routeCard   : { padding:'10px 12px', background:T.parchment, borderRadius:10, border:`1px solid ${T.border}`, cursor:'pointer', transition:'all 0.15s' },
  routeCardSel: { border:'2px solid', background:'rgba(255,240,180,0.98)' },
  routeTop    : { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  routeLabel  : { fontSize:13, fontWeight:700, color:T.dark },
  routeBottom : { display:'flex', justifyContent:'space-between', alignItems:'center' },
  assignBtn   : { width:'100%', marginTop:10, padding:'9px', borderRadius:8, border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:T.ff },
  routeInfo   : {},
  removeBtn2  : { padding:'8px 16px', borderRadius:8, border:`1px solid ${T.red}`, background:'transparent', color:T.red, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:T.ff },
};
