import { fmt, satisfColor, satisfEmoji, T } from './api.js';

function MiniBar({ value, max, color, width = 80 }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ width, height:8, background:'rgba(139,105,20,0.15)', borderRadius:4, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:4, transition:'width 0.6s' }} />
      </div>
      <span style={{ fontSize:10, color:T.mid }}>{pct}%</span>
    </div>
  );
}

function Historique({ data }) {
  if (!data || data.length < 2) return <div style={{ fontSize:12, color:T.mid, textAlign:'center', padding:16 }}>Pas encore assez de données</div>;

  const max   = Math.max(...data.map(Math.abs), 1);
  const h     = 80;
  const w     = 240;
  const barW  = Math.floor(w / data.length) - 2;

  return (
    <div style={{ overflowX:'auto' }}>
      <svg width={Math.max(w, data.length * (barW+2))} height={h + 20} style={{ display:'block', margin:'0 auto' }}>
        {/* Ligne zéro */}
        <line x1="0" y1={h/2} x2="100%" y2={h/2} stroke={T.border} strokeWidth="1" strokeDasharray="3,3"/>
        {data.map((v, i) => {
          const barH  = Math.round((Math.abs(v) / max) * (h/2 - 4));
          const pos   = v >= 0;
          const x     = i * (barW + 2);
          const y     = pos ? h/2 - barH : h/2;
          const color = pos ? '#27ae60' : '#c0392b';
          const isLast= i === data.length - 1;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={color} opacity={isLast ? 1 : 0.65} rx={2}/>
              {isLast && <text x={x+barW/2} y={pos?y-3:y+barH+11} textAnchor="middle" fontSize="8" fill={color}>J</text>}
            </g>
          );
        })}
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'0 4px', fontSize:9, color:T.mid }}>
        <span>J-{data.length-1}</span><span>Aujourd'hui</span>
      </div>
    </div>
  );
}

export default function FinancesPanel({ company, gameData }) {
  if (!company) {
    return (
      <div style={S.empty}>
        <div style={{ fontSize:48 }}>💰</div>
        <div style={S.emptyTitle}>Aucune compagnie</div>
      </div>
    );
  }

  const net       = company.revenusTotal - company.depensesTotal;
  const navires   = company.flotte || [];
  const totalRevNav = navires.reduce((s,n)=>s+(n.revenusGeneres||0), 0);
  const hist      = company.historiqueRevenusTick || [];

  // Classement CA dans le serveur
  const allCos = Object.values(gameData?.companies || {});
  const rank   = [...allCos].sort((a,b)=>(b.revenusTotal||0)-(a.revenusTotal||0)).findIndex(c=>c.ownerId===company.ownerId)+1;

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>💰 Finances</div>
          <div style={S.sub}>{company.logo} {company.nom}</div>
        </div>
        <div style={S.rankBadge}>#{rank} serveur</div>
      </div>

      {/* Capital */}
      <div style={S.bigStat}>
        <div style={S.bigLabel}>💳 Capital disponible</div>
        <div style={S.bigVal}>{fmt(company.capital)}</div>
      </div>

      {/* Grille stats */}
      <div style={S.grid}>
        {[
          { label:'🪙 CA Total',    val: fmt(company.revenusTotal), color: T.green  },
          { label:'💸 Dépenses',    val: fmt(company.depensesTotal),color: T.red    },
          { label:'💹 Résultat net',val: fmt(net),                  color: net>=0?T.green:T.red },
          { label:'🌟 Prestige',    val: `${company.prestige} pts`, color: T.gold   },
        ].map(({ label, val, color }) => (
          <div key={label} style={S.gridBox}>
            <div style={{ fontSize:10, color:T.mid, marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:14, fontWeight:700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Satisfaction */}
      <div style={S.section}>😊 Satisfaction Passagers</div>
      <div style={S.satisfBox}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:22 }}>{satisfEmoji(company.satisfaction)}</span>
          <span style={{ fontSize:18, fontWeight:700, color:satisfColor(company.satisfaction) }}>{company.satisfaction}/100</span>
        </div>
        <MiniBar value={company.satisfaction} max={100} color={satisfColor(company.satisfaction)} width={240} />
      </div>

      {/* Historique */}
      <div style={S.section}>📉 Revenus nets — 14 derniers jours</div>
      <div style={S.chartBox}>
        <Historique data={hist} />
      </div>

      {/* Par navire */}
      {navires.length > 0 && (
        <>
          <div style={S.section}>⛴ Revenus par navire</div>
          <div style={S.naviresList}>
            {navires.sort((a,b)=>(b.revenusGeneres||0)-(a.revenusGeneres||0)).map(n => {
              const pct = totalRevNav > 0 ? Math.round((n.revenusGeneres||0)/totalRevNav*100) : 0;
              return (
                <div key={n.uid} style={S.navireRow}>
                  <div style={S.navireLeft}>
                    <span style={{ fontSize:20 }}>{n.flag||'🚢'}</span>
                    <div>
                      <div style={S.navireNom}>{n.nom}</div>
                      <div style={{ fontSize:10, color:T.mid }}>✈️ {n.voyages} voyages · 👥 {(n.passagers||0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={S.navireRight}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.green }}>{fmt(n.revenusGeneres)}</div>
                    <MiniBar value={pct} max={100} color={T.gold} width={60}/>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Stats globales */}
      <div style={S.section}>📊 Bilan global</div>
      <div style={S.bilan}>
        {[
          ['🗺 Voyages',         company.voyagesTotal],
          ['👥 Passagers',       (company.passagersTotal||0).toLocaleString('fr-FR')],
          ['🪙 Embruns/voyage',  company.voyagesTotal > 0 ? fmt(Math.round(company.revenusTotal/company.voyagesTotal)) : '—'],
          ['📈 Taux satisfaction', `${company.satisfaction}/100`],
        ].map(([k,v]) => (
          <div key={k} style={S.bilanRow}>
            <span style={{ color:T.mid, fontSize:12 }}>{k}</span>
            <span style={{ color:T.dark, fontSize:12, fontWeight:700 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const S = {
  root       : { display:'flex', flexDirection:'column', height:'100%', overflowY:'auto', background:T.bg, fontFamily:T.ff },
  empty      : { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:T.mid },
  emptyTitle : { fontSize:18, color:T.dark },
  header     : { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:T.parchment, borderBottom:`2px solid ${T.border}`, flexShrink:0 },
  title      : { fontSize:16, fontWeight:700, color:T.dark },
  sub        : { fontSize:11, color:T.mid, marginTop:2 },
  rankBadge  : { background:'rgba(139,105,20,0.12)', border:`1px solid ${T.border}`, borderRadius:20, padding:'5px 12px', fontSize:13, fontWeight:700, color:T.gold },
  bigStat    : { padding:'16px', background:T.parchment, borderBottom:`1px solid ${T.border}`, textAlign:'center' },
  bigLabel   : { fontSize:11, color:T.mid, marginBottom:4, textTransform:'uppercase', letterSpacing:1 },
  bigVal     : { fontSize:28, fontWeight:700, color:T.dark },
  grid       : { display:'grid', gridTemplateColumns:'1fr 1fr', background:T.parchment, borderBottom:`2px solid ${T.border}` },
  gridBox    : { padding:'12px 16px', borderRight:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}` },
  section    : { padding:'8px 14px', fontSize:11, fontWeight:700, color:T.gold, textTransform:'uppercase', letterSpacing:1, background:T.parchment, borderBottom:`1px solid ${T.border}`, borderTop:`1px solid ${T.border}` },
  satisfBox  : { padding:'12px 16px', background:T.parchment },
  chartBox   : { padding:'14px 16px', background:T.parchment, borderBottom:`1px solid ${T.border}` },
  naviresList: { padding:'8px 12px', display:'flex', flexDirection:'column', gap:6 },
  navireRow  : { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:T.parchment, borderRadius:10, border:`1px solid ${T.border}` },
  navireLeft : { display:'flex', alignItems:'center', gap:10 },
  navireNom  : { fontSize:13, fontWeight:700, color:T.dark },
  navireRight: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 },
  bilan      : { padding:'12px 16px', display:'flex', flexDirection:'column', gap:6 },
  bilanRow   : { display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid rgba(139,105,20,0.1)` },
};
