import { useState } from 'react';

const fmt = (n) => {
  if (!n) return '0 🪙';
  if (n >= 1e9) return `${(n/1e9).toFixed(2)}Md 🪙`;
  if (n >= 1e6) return `${(n/1e6).toFixed(2)}M 🪙`;
  if (n >= 1e3) return `${(n/1e3).toFixed(1)}K 🪙`;
  return `${n} 🪙`;
};

const satisfEmoji = s => s >= 85 ? '🤩' : s >= 70 ? '😊' : s >= 50 ? '😐' : '😟';
const satisfColor = s => s >= 85 ? '#16a34a' : s >= 70 ? '#ca8a04' : s >= 50 ? '#ea580c' : '#dc2626';

function Bar({ value, max = 100, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ background: 'rgba(139,105,20,0.15)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
    </div>
  );
}

export default function FleetPanel({ company, gameData }) {
  const [selected, setSelected] = useState(null);

  if (!company) {
    return (
      <div style={S.empty}>
        <div style={{ fontSize: 56 }}>⚓</div>
        <div style={S.emptyTitle}>Pas encore de compagnie</div>
        <div style={S.emptySub}>Ouvrez le jeu dans Discord pour lancer votre empire maritime.</div>
      </div>
    );
  }

  const navires   = company.flotte || [];
  const enMer     = navires.filter(n => n.routeActive).length;
  const totalRev  = navires.reduce((s, n) => s + (n.revenusGeneres || 0), 0);

  return (
    <div style={S.root}>

      {/* ── En-tête parchemin ── */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.compLogo}>{company.logo}</div>
          <div>
            <div style={S.compNom}>{company.nom}</div>
            <div style={S.compSlogan}>"{company.slogan}"</div>
          </div>
        </div>
        <div style={S.badge}>Niv. {company.niveau || 1}</div>
      </div>

      {/* ── Stats compagnie ── */}
      <div style={S.statsRow}>
        {[
          { label: '🪙 Capital',      val: fmt(company.capital)     },
          { label: '⭐ Prestige',     val: `${company.prestige} pts` },
          { label: '⛴ En mer',       val: `${enMer}/${navires.length}` },
          { label: '🗺 Voyages',      val: company.voyagesTotal     },
        ].map(({ label, val }) => (
          <div key={label} style={S.statBox}>
            <div style={S.statVal}>{val}</div>
            <div style={S.statLbl}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Satisfaction globale ── */}
      <div style={S.satisfRow}>
        <span style={{ fontSize: 13, color: '#5d4e37' }}>😊 Satisfaction</span>
        <span style={{ ...S.satisfScore, color: satisfColor(company.satisfaction) }}>
          {satisfEmoji(company.satisfaction)} {company.satisfaction}/100
        </span>
      </div>
      <div style={{ padding: '0 14px 10px' }}>
        <Bar value={company.satisfaction} color={satisfColor(company.satisfaction)} />
      </div>

      {/* ── Titre section flotte ── */}
      <div style={S.sectionTitle}>⛴ Ma Flotte</div>

      {/* ── Liste navires ── */}
      <div style={S.list}>
        {navires.length === 0 && (
          <div style={S.noShip}>Aucun navire — visitez le Marché dans Discord pour en acheter un.</div>
        )}
        {navires.map(navire => {
          const route  = gameData?.routes?.find(r => r.id === navire.routeActive);
          const isSel  = selected === navire.uid;
          const satPct = navire.satisfactionMoyenne || 70;
          return (
            <div
              key={navire.uid}
              style={{ ...S.card, ...(isSel ? S.cardSel : {}) }}
              onClick={() => setSelected(isSel ? null : navire.uid)}
            >
              {/* En-tête carte navire */}
              <div style={S.cardHeader}>
                <div style={S.shipFlag}>{navire.flag || '🚢'}</div>
                <div style={{ flex: 1 }}>
                  <div style={S.shipNom}>{navire.nom}</div>
                  <div style={S.shipRoute}>
                    {route ? `🗺 ${route.label.slice(0, 28)}` : '⚪ Sans route assignée'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16 }}>{satisfEmoji(satPct)}</div>
                  <div style={{ fontSize: 10, color: '#8b6914' }}>✈️ {navire.voyages}</div>
                </div>
              </div>

              {/* Détails dépliés */}
              {isSel && (
                <div style={S.detail}>
                  <div style={S.detailBar}>
                    <span style={S.detailLbl}>😊 Satisfaction</span>
                    <span style={{ ...S.detailVal, color: satisfColor(satPct) }}>{satPct.toFixed(0)}/100</span>
                  </div>
                  <Bar value={satPct} color={satisfColor(satPct)} />

                  <div style={{ marginTop: 8 }} />

                  {[
                    ['💰 Revenus générés', fmt(navire.revenusGeneres)],
                    ['👥 Passagers',       (navire.passagers || 0).toLocaleString('fr-FR')],
                    ['🔧 Upgrades',        `${(navire.upgrades || []).length} installée${(navire.upgrades||[]).length > 1 ? 's' : ''}`],
                    ...(navire.flag ? [['🏳 Pavillon', navire.flag]] : []),
                  ].map(([k, v]) => (
                    <div key={k} style={S.detailRow}>
                      <span style={S.detailLbl}>{k}</span>
                      <span style={S.detailVal}>{v}</span>
                    </div>
                  ))}
                  <div style={S.detailHint}>Gérez ce navire via Discord →</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Pied de page ── */}
      <div style={S.footer}>
        {[
          ['🗺 Voyages totaux',        company.voyagesTotal],
          ['👥 Passagers transportés', (company.passagersTotal || 0).toLocaleString('fr-FR')],
          ['🪙 CA Total',              fmt(company.revenusTotal)],
          ['💸 Dépenses totales',      fmt(company.depensesTotal)],
        ].map(([k, v]) => (
          <div key={k} style={S.footerRow}>
            <span style={{ color: '#6b4c1a' }}>{k}</span>
            <span style={{ fontWeight: 700, color: '#2c1a06' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const parchment = 'rgba(255,248,220,0.97)';
const border    = 'rgba(139,105,20,0.35)';
const textDark  = '#2c1a06';
const textMid   = '#5d4e37';
const fontFamily= 'Georgia, serif';

const S = {
  root      : { display:'flex', flexDirection:'column', height:'100%', overflowY:'auto', background:'#f5e6c8', fontFamily },
  empty     : { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:14, color:textMid, fontFamily, background:'#f5e6c8' },
  emptyTitle: { fontSize:20, fontWeight:700, color:textDark },
  emptySub  : { fontSize:13, textAlign:'center', maxWidth:260, lineHeight:1.5 },

  header    : { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', background:parchment, borderBottom:`2px solid ${border}` },
  headerLeft: { display:'flex', alignItems:'center', gap:12 },
  compLogo  : { fontSize:36 },
  compNom   : { fontSize:17, fontWeight:700, color:textDark },
  compSlogan: { fontSize:11, color:textMid, fontStyle:'italic', marginTop:2 },
  badge     : { background:'rgba(139,105,20,0.15)', border:`1px solid ${border}`, borderRadius:20, padding:'4px 10px', fontSize:12, fontWeight:700, color:'#8b6914' },

  statsRow  : { display:'flex', background:parchment, borderBottom:`1px solid ${border}` },
  statBox   : { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 4px', borderRight:`1px solid ${border}` },
  statVal   : { fontSize:14, fontWeight:700, color:textDark },
  statLbl   : { fontSize:9, color:textMid, marginTop:3, textAlign:'center' },

  satisfRow : { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 14px 4px', background:parchment },
  satisfScore:{ fontSize:13, fontWeight:700 },

  sectionTitle:{ padding:'10px 14px 6px', fontSize:12, fontWeight:700, color:'#8b6914', textTransform:'uppercase', letterSpacing:1, background:parchment, borderBottom:`1px solid ${border}`, borderTop:`1px solid ${border}` },

  list      : { flex:1, padding:'10px 12px', display:'flex', flexDirection:'column', gap:8, background:'#f5e6c8' },
  noShip    : { textAlign:'center', color:textMid, fontSize:13, padding:24, lineHeight:1.6 },

  card      : { background:parchment, borderRadius:10, padding:'12px 14px', border:`1px solid ${border}`, cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 6px rgba(0,0,0,0.1)' },
  cardSel   : { background:'rgba(255,240,180,0.99)', border:`2px solid rgba(139,105,20,0.6)`, boxShadow:'0 4px 12px rgba(0,0,0,0.15)' },
  cardHeader: { display:'flex', alignItems:'center', gap:10 },
  shipFlag  : { fontSize:26, flexShrink:0 },
  shipNom   : { fontSize:14, fontWeight:700, color:textDark },
  shipRoute : { fontSize:11, color:textMid, marginTop:3 },

  detail    : { marginTop:12, paddingTop:10, borderTop:`1px solid ${border}` },
  detailBar : { display:'flex', justifyContent:'space-between', marginBottom:4 },
  detailRow : { display:'flex', justifyContent:'space-between', marginTop:6 },
  detailLbl : { fontSize:11, color:textMid },
  detailVal : { fontSize:11, fontWeight:700, color:textDark },
  detailHint: { marginTop:10, textAlign:'center', fontSize:10, color:'rgba(139,105,20,0.6)', fontStyle:'italic' },

  footer    : { padding:'12px 16px', background:parchment, borderTop:`2px solid ${border}`, display:'flex', flexDirection:'column', gap:5 },
  footerRow : { display:'flex', justifyContent:'space-between', fontSize:11 },
};
