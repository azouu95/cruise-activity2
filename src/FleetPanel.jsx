import { useState } from 'react';

const fmt = (n) => {
  if (!n) return '0 🪙';
  if (n >= 1e9)  return `${(n/1e9).toFixed(2)}Md 🪙`;
  if (n >= 1e6)  return `${(n/1e6).toFixed(2)}M 🪙`;
  if (n >= 1e3)  return `${(n/1e3).toFixed(1)}K 🪙`;
  return `${n} 🪙`;
};

const satisfEmoji = s => s >= 85 ? '🤩' : s >= 70 ? '😊' : s >= 50 ? '😐' : '😟';

export default function FleetPanel({ company, gameData }) {
  const [selected, setSelected] = useState(null);

  if (!company) {
    return (
      <div style={s.empty}>
        <div style={{ fontSize:48 }}>⚓</div>
        <div style={s.emptyTitle}>Pas encore de compagnie</div>
        <div style={s.emptySub}>Ouvrez le jeu dans Discord pour créer votre empire maritime.</div>
      </div>
    );
  }

  const navires = company.flotte || [];
  const selNavire = selected ? navires.find(n => n.uid === selected) : null;

  return (
    <div style={s.root}>
      {/* Header compagnie */}
      <div style={s.header}>
        <div>
          <div style={s.compNom}>{company.logo} {company.nom}</div>
          <div style={s.compSlogan}>"{company.slogan}"</div>
        </div>
        <div style={s.stats}>
          <div style={s.stat}><span style={s.statVal}>{fmt(company.capital)}</span><span style={s.statLbl}>Capital</span></div>
          <div style={s.stat}><span style={s.statVal}>{company.prestige}</span><span style={s.statLbl}>Prestige</span></div>
          <div style={s.stat}><span style={s.statVal}>{company.satisfaction}/100</span><span style={s.statLbl}>Satisfaction</span></div>
        </div>
      </div>

      {/* Liste navires */}
      <div style={s.list}>
        {navires.length === 0 && (
          <div style={s.noShip}>Aucun navire — visitez le Marché dans Discord</div>
        )}
        {navires.map(navire => {
          const route = gameData?.routes?.find(r => r.id === navire.routeActive);
          const isSelected = selected === navire.uid;
          return (
            <div
              key={navire.uid}
              style={{ ...s.card, ...(isSelected ? s.cardSelected : {}) }}
              onClick={() => setSelected(isSelected ? null : navire.uid)}
            >
              <div style={s.cardTop}>
                <span style={s.shipEmoji}>{navire.flag || '🚢'}</span>
                <div style={s.cardInfo}>
                  <div style={s.shipNom}>{navire.nom}</div>
                  <div style={s.shipRoute}>
                    {route ? `🗺 ${route.label.slice(0,30)}` : '⚪ Sans route'}
                  </div>
                </div>
                <div style={s.cardStats}>
                  <div style={s.miniStat}>{satisfEmoji(navire.satisfactionMoyenne || 70)}</div>
                  <div style={s.miniStat}>✈️ {navire.voyages}</div>
                </div>
              </div>

              {isSelected && (
                <div style={s.detail}>
                  <div style={s.detailRow}><span>💰 Revenus générés</span><span style={{ color:'#5b9cf6' }}>{fmt(navire.revenusGeneres)}</span></div>
                  <div style={s.detailRow}><span>👥 Passagers</span><span>{(navire.passagers||0).toLocaleString('fr-FR')}</span></div>
                  <div style={s.detailRow}><span>😊 Satisfaction</span><span>{(navire.satisfactionMoyenne||70).toFixed(0)}/100</span></div>
                  <div style={s.detailRow}><span>🔧 Upgrades</span><span>{(navire.upgrades||[]).length} installée{(navire.upgrades||[]).length > 1 ? 's' : ''}</span></div>
                  {navire.flag && <div style={s.detailRow}><span>🏳 Pavillon</span><span>{navire.flag}</span></div>}
                  <div style={s.detailHint}>Gérez ce navire depuis Discord →</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.footerRow}><span>🗺 Voyages totaux</span><span>{company.voyagesTotal}</span></div>
        <div style={s.footerRow}><span>👥 Passagers transportés</span><span>{(company.passagersTotal||0).toLocaleString('fr-FR')}</span></div>
        <div style={s.footerRow}><span>🪙 CA Total</span><span>{fmt(company.revenusTotal)}</span></div>
      </div>
    </div>
  );
}

const s = {
  root     : { display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' },
  empty    : { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'rgba(255,255,255,0.5)' },
  emptyTitle: { fontSize:18, fontWeight:700, color:'rgba(255,255,255,0.7)' },
  emptySub : { fontSize:13, textAlign:'center', maxWidth:260 },
  header   : { padding:'14px 16px', background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 },
  compNom  : { fontSize:17, fontWeight:700, color:'#fff' },
  compSlogan: { fontSize:11, color:'rgba(255,255,255,0.4)', fontStyle:'italic', marginTop:2 },
  stats    : { display:'flex', gap:16, marginTop:10 },
  stat     : { display:'flex', flexDirection:'column', alignItems:'center' },
  statVal  : { fontSize:14, fontWeight:700, color:'#5b9cf6' },
  statLbl  : { fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 },
  list     : { flex:1, overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 },
  noShip   : { textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:13, padding:20 },
  card     : { background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.07)', cursor:'pointer', transition:'all 0.2s' },
  cardSelected: { background:'rgba(91,156,246,0.1)', border:'1px solid rgba(91,156,246,0.4)' },
  cardTop  : { display:'flex', alignItems:'center', gap:10 },
  shipEmoji: { fontSize:24 },
  cardInfo : { flex:1 },
  shipNom  : { fontSize:14, fontWeight:600, color:'#fff' },
  shipRoute: { fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:3 },
  cardStats: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 },
  miniStat : { fontSize:12, color:'rgba(255,255,255,0.6)' },
  detail   : { marginTop:12, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.06)' },
  detailRow: { display:'flex', justifyContent:'space-between', fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:5 },
  detailHint: { marginTop:10, textAlign:'center', fontSize:11, color:'rgba(91,156,246,0.6)', fontStyle:'italic' },
  footer   : { padding:'12px 16px', background:'rgba(0,0,0,0.3)', borderTop:'1px solid rgba(255,255,255,0.07)', flexShrink:0 },
  footerRow: { display:'flex', justifyContent:'space-between', fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:4 },
};
