const fmt = (n) => {
  if (!n) return '0 🪙';
  if (n >= 1e9) return `${(n/1e9).toFixed(2)}Md 🪙`;
  if (n >= 1e6) return `${(n/1e6).toFixed(2)}M 🪙`;
  if (n >= 1e3) return `${(n/1e3).toFixed(1)}K 🪙`;
  return `${n} 🪙`;
};

const medals   = ['🥇','🥈','🥉'];
const rankBg   = ['rgba(255,215,0,0.15)','rgba(192,192,192,0.12)','rgba(205,127,50,0.12)'];
const rankBdr  = ['rgba(212,175,55,0.5)','rgba(160,160,160,0.4)','rgba(160,100,40,0.4)'];

function Section({ title }) {
  return (
    <div style={{
      padding:'10px 16px 5px', fontSize:11, fontWeight:700,
      color:'#8b6914', textTransform:'uppercase', letterSpacing:1.2,
      borderBottom:'1px solid rgba(139,105,20,0.2)', marginTop:4,
    }}>{title}</div>
  );
}

export default function Leaderboard({ gameData, myCompany }) {
  if (!gameData?.companies) {
    return (
      <div style={S.empty}>
        <div style={{ fontSize:48 }}>🏆</div>
        <div style={S.emptyTitle}>Chargement...</div>
      </div>
    );
  }

  const companies    = Object.values(gameData.companies);
  const byCA         = [...companies].sort((a,b)=>(b.revenusTotal||0)-(a.revenusTotal||0));
  const byPrestige   = [...companies].sort((a,b)=>(b.prestige||0)-(a.prestige||0)).slice(0,5);
  const byVoyages    = [...companies].sort((a,b)=>(b.voyagesTotal||0)-(a.voyagesTotal||0)).slice(0,5);
  const totalNavires = companies.reduce((s,c)=>s+(c.flotte?.filter(n=>n.routeActive).length||0),0);
  const totalPax     = companies.reduce((s,c)=>s+(c.passagersTotal||0),0);
  const totalVoyages = companies.reduce((s,c)=>s+(c.voyagesTotal||0),0);
  const totalCA      = companies.reduce((s,c)=>s+(c.revenusTotal||0),0);

  const Row = ({ company, rank, valFmt, highlight }) => {
    const isMe = company.ownerId === myCompany?.ownerId;
    return (
      <div style={{
        ...S.row,
        ...(isMe ? S.rowMe : {}),
        ...(rank <= 3 ? { background: rankBg[rank-1], borderColor: rankBdr[rank-1] } : {}),
      }}>
        <span style={S.rank}>{medals[rank-1] || `${rank}`}</span>
        <span style={S.logo}>{company.logo}</span>
        <div style={S.info}>
          <div style={S.nom}>
            {company.nom}
            {isMe && <span style={S.meBadge}>vous</span>}
          </div>
          <div style={S.sub}>Niv.{company.niveau||1} · {company.prestige} prestige · {company.flotte?.length||0} navires</div>
        </div>
        <div style={S.val}>{valFmt}</div>
      </div>
    );
  };

  return (
    <div style={S.root}>

      {/* ── Stats globales serveur ── */}
      <div style={S.serverHeader}>
        <div style={S.serverTitle}>🌊 Serveur Costa & MSC</div>
        <div style={S.serverGrid}>
          {[
            ['🏢', companies.length, 'Armateurs'],
            ['⛴', totalNavires,     'En mer'],
            ['🗺', totalVoyages.toLocaleString(), 'Voyages'],
            ['👥', (totalPax/1000).toFixed(0)+'K', 'Passagers'],
          ].map(([emoji,val,lbl])=>(
            <div key={lbl} style={S.serverStat}>
              <div style={S.serverEmoji}>{emoji}</div>
              <div style={S.serverVal}>{val}</div>
              <div style={S.serverLbl}>{lbl}</div>
            </div>
          ))}
        </div>
        <div style={S.totalCA}>
          🪙 <b>{fmt(totalCA)}</b> générés par le serveur
        </div>
      </div>

      {/* ── CA Total ── */}
      <Section title="🪙 Chiffre d'Affaires" />
      <div style={S.list}>
        {byCA.map((co,i)=><Row key={co.ownerId} company={co} rank={i+1} valFmt={fmt(co.revenusTotal)} />)}
        {byCA.length===0&&<div style={S.empty2}>Aucune compagnie encore</div>}
      </div>

      {/* ── Prestige ── */}
      <Section title="🌟 Prestige" />
      <div style={S.list}>
        {byPrestige.map((co,i)=><Row key={co.ownerId} company={co} rank={i+1} valFmt={`${co.prestige} pts`} />)}
      </div>

      {/* ── Voyages ── */}
      <Section title="✈️ Voyages effectués" />
      <div style={S.list}>
        {byVoyages.map((co,i)=><Row key={co.ownerId} company={co} rank={i+1} valFmt={`${co.voyagesTotal} voyages`} />)}
      </div>

      {/* Pied */}
      <div style={S.footer}>⚓ Classement mis à jour automatiquement</div>
    </div>
  );
}

const parchment = 'rgba(255,248,220,0.97)';
const border    = 'rgba(139,105,20,0.3)';
const textDark  = '#2c1a06';
const textMid   = '#5d4e37';
const fontFamily= 'Georgia, serif';

const S = {
  root        : { display:'flex', flexDirection:'column', height:'100%', overflowY:'auto', background:'#f5e6c8', fontFamily },
  empty       : { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:textMid, fontFamily },
  emptyTitle  : { fontSize:18, color:textDark },
  empty2      : { textAlign:'center', color:textMid, fontSize:12, padding:16 },

  serverHeader: { background:parchment, borderBottom:`2px solid ${border}`, padding:'14px 16px' },
  serverTitle : { fontSize:16, fontWeight:700, color:textDark, marginBottom:10 },
  serverGrid  : { display:'flex', justifyContent:'space-around', marginBottom:10 },
  serverStat  : { display:'flex', flexDirection:'column', alignItems:'center', gap:2 },
  serverEmoji : { fontSize:18 },
  serverVal   : { fontSize:16, fontWeight:700, color:textDark },
  serverLbl   : { fontSize:9, color:textMid },
  totalCA     : { textAlign:'center', fontSize:12, color:'#8b6914', background:'rgba(139,105,20,0.08)', borderRadius:8, padding:'6px 10px' },

  list        : { padding:'8px 12px', display:'flex', flexDirection:'column', gap:6 },
  row         : { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:parchment, borderRadius:10, border:`1px solid ${border}`, boxShadow:'0 2px 4px rgba(0,0,0,0.08)' },
  rowMe       : { background:'rgba(255,235,150,0.95)', border:'2px solid rgba(212,175,55,0.6)', boxShadow:'0 3px 10px rgba(212,175,55,0.2)' },
  rank        : { fontSize:20, width:28, textAlign:'center', flexShrink:0 },
  logo        : { fontSize:22, flexShrink:0 },
  info        : { flex:1, minWidth:0 },
  nom         : { fontSize:13, fontWeight:700, color:textDark, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' },
  sub         : { fontSize:10, color:textMid, marginTop:2 },
  val         : { fontSize:12, fontWeight:700, color:'#8b6914', flexShrink:0 },
  meBadge     : { background:'rgba(212,175,55,0.3)', border:'1px solid rgba(212,175,55,0.5)', borderRadius:4, padding:'1px 6px', fontSize:9, color:'#8b6914', fontWeight:700 },
  footer      : { padding:'12px', textAlign:'center', fontSize:10, color:textMid, borderTop:`1px solid ${border}`, background:parchment, fontStyle:'italic' },
};
