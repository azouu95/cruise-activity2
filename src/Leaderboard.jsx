const fmt = (n) => {
  if (!n) return '0 🪙';
  if (n >= 1e9) return `${(n/1e9).toFixed(2)}Md 🪙`;
  if (n >= 1e6) return `${(n/1e6).toFixed(2)}M 🪙`;
  if (n >= 1e3) return `${(n/1e3).toFixed(1)}K 🪙`;
  return `${n} 🪙`;
};

export default function Leaderboard({ gameData, myCompany }) {
  if (!gameData?.companies) {
    return (
      <div style={s.empty}>
        <div style={{ fontSize:36 }}>🏆</div>
        <div style={s.emptyTitle}>Chargement...</div>
      </div>
    );
  }

  const companies = Object.values(gameData.companies);
  const sorted = [...companies]
    .sort((a, b) => (b.revenusTotal || 0) - (a.revenusTotal || 0));

  const medals = ['🥇', '🥈', '🥉'];
  const totalNavires   = companies.reduce((s, c) => s + (c.flotte?.filter(n=>n.routeActive).length||0), 0);
  const totalPassagers = companies.reduce((s, c) => s + (c.passagersTotal||0), 0);
  const totalVoyages   = companies.reduce((s, c) => s + (c.voyagesTotal||0), 0);

  return (
    <div style={s.root}>
      {/* Stats serveur */}
      <div style={s.serverStats}>
        <div style={s.serverStat}><span style={s.ssVal}>{companies.length}</span><span style={s.ssLbl}>Armateurs</span></div>
        <div style={s.serverStat}><span style={s.ssVal}>{totalNavires}</span><span style={s.ssLbl}>En mer</span></div>
        <div style={s.serverStat}><span style={s.ssVal}>{totalVoyages.toLocaleString()}</span><span style={s.ssLbl}>Voyages</span></div>
        <div style={s.serverStat}><span style={s.ssVal}>{(totalPassagers/1000).toFixed(0)}K</span><span style={s.ssLbl}>Passagers</span></div>
      </div>

      {/* Classement CA */}
      <div style={s.section}>🪙 Chiffre d'Affaires</div>
      <div style={s.list}>
        {sorted.map((company, i) => {
          const isMe = company.ownerId === myCompany?.ownerId;
          return (
            <div key={company.ownerId} style={{ ...s.row, ...(isMe ? s.rowMe : {}) }}>
              <span style={s.rank}>{medals[i] || `${i+1}`}</span>
              <span style={s.logo}>{company.logo}</span>
              <div style={s.info}>
                <div style={s.nom}>{company.nom}{isMe && <span style={s.meBadge}> vous</span>}</div>
                <div style={s.sub}>Niv.{company.niveau||1} · {company.prestige} prestige · {company.flotte?.length||0} navires</div>
              </div>
              <div style={s.amount}>{fmt(company.revenusTotal)}</div>
            </div>
          );
        })}
        {sorted.length === 0 && <div style={s.empty2}>Aucune compagnie encore</div>}
      </div>

      {/* Classement prestige */}
      <div style={s.section}>🌟 Prestige</div>
      <div style={s.list}>
        {[...companies].sort((a,b)=>(b.prestige||0)-(a.prestige||0)).slice(0,5).map((company, i) => {
          const isMe = company.ownerId === myCompany?.ownerId;
          return (
            <div key={company.ownerId} style={{ ...s.row, ...(isMe ? s.rowMe : {}) }}>
              <span style={s.rank}>{medals[i] || `${i+1}`}</span>
              <span style={s.logo}>{company.logo}</span>
              <div style={s.info}>
                <div style={s.nom}>{company.nom}</div>
              </div>
              <div style={s.amount}>{company.prestige||0} pts</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  root       : { display:'flex', flexDirection:'column', height:'100%', overflowY:'auto' },
  empty      : { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:10, color:'rgba(255,255,255,0.4)' },
  emptyTitle : { fontSize:16, color:'rgba(255,255,255,0.5)' },
  serverStats: { display:'flex', justifyContent:'space-around', padding:'14px 16px', background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 },
  serverStat : { display:'flex', flexDirection:'column', alignItems:'center', gap:2 },
  ssVal      : { fontSize:18, fontWeight:700, color:'#5b9cf6' },
  ssLbl      : { fontSize:10, color:'rgba(255,255,255,0.4)' },
  section    : { padding:'12px 16px 6px', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:1 },
  list       : { padding:'0 12px 4px', display:'flex', flexDirection:'column', gap:6 },
  row        : { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' },
  rowMe      : { background:'rgba(91,156,246,0.1)', border:'1px solid rgba(91,156,246,0.3)' },
  rank       : { fontSize:18, width:28, textAlign:'center', flexShrink:0 },
  logo       : { fontSize:20, flexShrink:0 },
  info       : { flex:1, minWidth:0 },
  nom        : { fontSize:13, fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  sub        : { fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 },
  amount     : { fontSize:12, fontWeight:700, color:'#5b9cf6', flexShrink:0 },
  meBadge    : { background:'rgba(91,156,246,0.3)', borderRadius:4, padding:'0 5px', fontSize:9, color:'#5b9cf6', marginLeft:4 },
  empty2     : { textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:12, padding:16 },
};
