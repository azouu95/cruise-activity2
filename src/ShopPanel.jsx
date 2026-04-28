import { useState } from 'react';
import { api, fmt, T } from './api.js';

const CLASSES = [
  { id: null,          label: 'Tous',        emoji: '⛴' },
  { id: 'decouverte',  label: 'Découverte',  emoji: '🟢' },
  { id: 'standard',    label: 'Standard',    emoji: '🔵' },
  { id: 'premium',     label: 'Premium',     emoji: '🟣' },
  { id: 'luxe',        label: 'Luxe',        emoji: '🟡' },
  { id: 'expedition',  label: 'Expédition',  emoji: '🔵' },
  { id: 'fluviale',    label: 'Fluviale',    emoji: '🟤' },
];

const SHIP_IMAGES = {
  riviera_express    : 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=200&fit=crop',
  mediterranee_star  : 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=400&h=200&fit=crop',
  belle_de_mer       : 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=200&fit=crop',
  adriatique_queen   : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop',
  oceanus_prima      : 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=200&fit=crop',
  aurora_splendida   : 'https://images.unsplash.com/photo-1541909158536-57a888e69a03?w=400&h=200&fit=crop',
  costa_azurra       : 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=200&fit=crop',
  msc_bellissima     : 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=200&fit=crop',
  celebrity_apex     : 'https://images.unsplash.com/photo-1541909158536-57a888e69a03?w=400&h=200&fit=crop',
  sovereign_imperial : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
  seabourn_encore    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
  world_colossus     : 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=200&fit=crop',
  icon_of_seas       : 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=200&fit=crop',
  explorer_arctique  : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
  safari_marin       : 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&h=200&fit=crop',
  nil_royal          : 'https://images.unsplash.com/photo-1539768942893-daf853948f56?w=400&h=200&fit=crop',
};

export default function ShopPanel({ gameData, company, userId, onRefresh }) {
  const [classe,   setClasse]   = useState(null);
  const [selected, setSelected] = useState(null);
  const [buying,   setBuying]   = useState(false);
  const [nom,      setNom]      = useState('');
  const [msg,      setMsg]      = useState(null);

  const ships = (gameData?.catalogue_navires || []).filter(n =>
    !classe || n.classe === classe
  );

  const capital = company?.capital || 0;
  const maxFlotte = 6;
  const flotteFull = (company?.flotte?.length || 0) >= maxFlotte;

  const handleBuy = async (ship) => {
    if (!userId || !ship) return;
    const nomFinal = nom.trim() || ship.nom;
    setBuying(true); setMsg(null);
    try {
      await api.buyShip(userId, ship.id, nomFinal);
      setMsg({ ok: true, text: `⛴ ${nomFinal} rejoint votre flotte !` });
      setSelected(null); setNom('');
      setTimeout(() => { setMsg(null); onRefresh(); }, 2000);
    } catch(e) {
      setMsg({ ok: false, text: e.message });
    } finally { setBuying(false); }
  };

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.title}>🛒 Marché des Navires</div>
        <div style={S.capital}>💳 {fmt(capital)}</div>
      </div>

      {/* Message feedback */}
      {msg && (
        <div style={{ ...S.msg, background: msg.ok ? 'rgba(39,174,96,0.15)' : 'rgba(192,57,43,0.15)', borderColor: msg.ok ? T.green : T.red, color: msg.ok ? T.green : T.red }}>
          {msg.text}
        </div>
      )}

      {/* Filtre classes */}
      <div style={S.filters}>
        {CLASSES.map(c => (
          <button
            key={c.id || 'all'}
            style={{ ...S.filter, ...(classe === c.id ? S.filterActive : {}) }}
            onClick={() => { setClasse(c.id); setSelected(null); }}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Grille navires */}
      <div style={S.grid}>
        {ships.map(ship => {
          const canBuy   = capital >= ship.prix && !flotteFull;
          const owned    = company?.flotte?.some(n => n.navireId === ship.id);
          const isSel    = selected?.id === ship.id;
          return (
            <div
              key={ship.id}
              style={{ ...S.card, ...(isSel ? S.cardSel : {}), ...(canBuy ? {} : S.cardLocked) }}
              onClick={() => setSelected(isSel ? null : ship)}
            >
              {/* Image */}
              <div style={S.imgWrap}>
                <img
                  src={SHIP_IMAGES[ship.id] || SHIP_IMAGES.riviera_express}
                  alt={ship.nom}
                  style={S.img}
                  onError={e => { e.target.style.display='none'; }}
                />
                <div style={S.imgOverlay}>
                  <span style={S.shipEmoji}>{ship.emoji}</span>
                </div>
                {owned && <div style={S.ownedBadge}>✅ Possédé</div>}
                {!canBuy && !owned && <div style={S.lockedBadge}>🔒</div>}
              </div>

              {/* Infos */}
              <div style={S.cardBody}>
                <div style={S.shipNom}>{ship.nom}</div>
                <div style={S.classeLabel}>{ship.classeLabel}</div>
                <div style={S.stars}>{'⭐'.repeat(ship.luxe || 1)}{'☆'.repeat(5-(ship.luxe||1))}</div>
                <div style={S.prix}>
                  <span style={{ color: canBuy ? T.green : T.red, fontWeight: 700 }}>
                    {fmt(ship.prix)}
                  </span>
                </div>
                <div style={S.stats}>
                  <span>👥 {(ship.capacite||0).toLocaleString()}</span>
                  <span>⚡ {ship.vitesse}kn</span>
                  <span>⭐ +{ship.prestige}</span>
                </div>
              </div>

              {/* Détail déplié */}
              {isSel && (
                <div style={S.detail}>
                  <div style={S.detailDesc}>{ship.desc}</div>
                  {canBuy && !owned && (
                    <div style={S.buySection}>
                      <input
                        style={S.input}
                        placeholder={`Nom du navire (ex: ${ship.nom})`}
                        value={nom}
                        onChange={e => setNom(e.target.value)}
                        maxLength={30}
                      />
                      <button
                        style={{ ...S.buyBtn, opacity: buying ? 0.6 : 1 }}
                        onClick={() => handleBuy(ship)}
                        disabled={buying}
                      >
                        {buying ? 'Achat...' : `⛴ Acheter — ${fmt(ship.prix)}`}
                      </button>
                    </div>
                  )}
                  {!canBuy && !owned && (
                    <div style={S.noFunds}>
                      ❌ Capital insuffisant — manque {fmt(ship.prix - capital)}
                    </div>
                  )}
                  {owned && <div style={S.alreadyOwned}>✅ Vous possédez déjà ce modèle</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {flotteFull && (
        <div style={S.fullMsg}>⚠️ Flotte complète ({maxFlotte}/{maxFlotte}) — revendez un navire pour en acheter un nouveau</div>
      )}
    </div>
  );
}

const S = {
  root    : { display:'flex', flexDirection:'column', height:'100%', overflowY:'auto', background:T.bg, fontFamily:T.ff },
  header  : { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:T.parchment, borderBottom:`2px solid ${T.border}`, flexShrink:0 },
  title   : { fontSize:16, fontWeight:700, color:T.dark },
  capital : { fontSize:14, fontWeight:700, color:T.gold, background:'rgba(139,105,20,0.1)', padding:'5px 12px', borderRadius:20, border:`1px solid ${T.border}` },
  msg     : { margin:'8px 12px', padding:'10px 14px', borderRadius:8, border:'1px solid', fontSize:13, fontWeight:600, textAlign:'center' },
  filters : { display:'flex', gap:6, padding:'10px 12px', overflowX:'auto', flexShrink:0, background:T.parchment, borderBottom:`1px solid ${T.border}` },
  filter  : { padding:'5px 12px', borderRadius:20, border:`1px solid ${T.border}`, background:'transparent', color:T.mid, fontSize:11, cursor:'pointer', whiteSpace:'nowrap', fontFamily:T.ff },
  filterActive: { background:T.gold, color:'#fff', borderColor:T.gold },
  grid    : { padding:'12px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))', gap:10 },
  card    : { background:T.parchment, borderRadius:12, border:`1px solid ${T.border}`, cursor:'pointer', overflow:'hidden', transition:'all 0.2s', boxShadow:T.shadowSm },
  cardSel : { border:`2px solid ${T.gold}`, boxShadow:`0 6px 20px rgba(139,105,20,0.25)` },
  cardLocked:{ opacity:0.7 },
  imgWrap : { position:'relative', height:100, overflow:'hidden', background:T.bgDeep },
  img     : { width:'100%', height:'100%', objectFit:'cover' },
  imgOverlay:{ position:'absolute', bottom:4, right:6, fontSize:24 },
  ownedBadge:{ position:'absolute', top:6, left:6, background:'rgba(39,174,96,0.9)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10 },
  lockedBadge:{ position:'absolute', top:6, right:6, fontSize:18 },
  cardBody: { padding:'10px 12px' },
  shipNom : { fontSize:13, fontWeight:700, color:T.dark, marginBottom:2 },
  classeLabel:{ fontSize:10, color:T.mid, marginBottom:4 },
  stars   : { fontSize:11, marginBottom:4 },
  prix    : { fontSize:14, marginBottom:6 },
  stats   : { display:'flex', gap:8, fontSize:10, color:T.mid },
  detail  : { padding:'10px 12px', borderTop:`1px solid ${T.border}`, background:'rgba(255,240,180,0.5)' },
  detailDesc:{ fontSize:11, color:T.mid, lineHeight:1.5, marginBottom:10, fontStyle:'italic' },
  buySection:{ display:'flex', flexDirection:'column', gap:6 },
  input   : { padding:'7px 10px', borderRadius:8, border:`1px solid ${T.border}`, background:T.parchment, color:T.dark, fontSize:12, fontFamily:T.ff, outline:'none' },
  buyBtn  : { padding:'9px', borderRadius:8, background:T.gold, border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:T.ff },
  noFunds : { fontSize:11, color:T.red, textAlign:'center', fontWeight:600 },
  alreadyOwned:{ fontSize:11, color:T.green, textAlign:'center', fontWeight:600 },
  fullMsg : { margin:'0 12px 12px', padding:'10px', background:'rgba(192,57,43,0.1)', border:`1px solid ${T.red}`, borderRadius:8, fontSize:12, color:T.red, textAlign:'center' },
};
