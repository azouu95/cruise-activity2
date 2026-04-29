import { useState } from 'react';
import { api, fmt, T } from './api.js';

const CLASSES = [
  {id:null,        label:'Tous',        emoji:'⛴'},
  {id:'decouverte',label:'Découverte',  emoji:'🟢'},
  {id:'standard',  label:'Standard',    emoji:'🔵'},
  {id:'premium',   label:'Premium',     emoji:'🟣'},
  {id:'luxe',      label:'Luxe',        emoji:'🟡'},
  {id:'expedition',label:'Expédition',  emoji:'🧊'},
  {id:'fluviale',  label:'Fluviale',    emoji:'🌿'},
];

// Photos Unsplash par défaut selon classe
const CLASS_IMG = {
  decouverte : 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=180&fit=crop',
  standard   : 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=180&fit=crop',
  premium    : 'https://images.unsplash.com/photo-1541909158536-57a888e69a03?w=400&h=180&fit=crop',
  luxe       : 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=180&fit=crop',
  expedition : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=180&fit=crop',
  fluviale   : 'https://images.unsplash.com/photo-1539768942893-daf853948f56?w=400&h=180&fit=crop',
};

export default function ShopPanel({ gameData, company, userId, onRefresh }) {
  const [classe,  setClasse]  = useState(null);
  const [sel,     setSel]     = useState(null);
  const [nom,     setNom]     = useState('');
  const [buying,  setBuying]  = useState(false);
  const [msg,     setMsg]     = useState(null);

  const ships    = (gameData?.catalogue_navires || []).filter(n => !classe || n.classe===classe);
  const capital  = company?.capital || 0;
  const flotte   = company?.flotte || [];
  const MAX_FLEET= 6;
  const full     = flotte.length >= MAX_FLEET;

  const handleBuy = async(ship) => {
    if (!userId) return;
    const nomFinal = nom.trim() || ship.nom;
    setBuying(true); setMsg(null);
    try {
      await api.buyShip(userId, ship.id, nomFinal);
      setMsg({ok:true, text:`⛴ ${nomFinal} rejoint votre flotte !`});
      setSel(null); setNom('');
      setTimeout(()=>{setMsg(null);onRefresh();}, 2000);
    } catch(e) {
      setMsg({ok:false, text:e.message});
    } finally { setBuying(false); }
  };

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.title}>🛒 Marché des Navires</div>
        <div style={S.capital}>💳 {fmt(capital)}</div>
      </div>

      {msg && (
        <div style={{...S.msg, background:msg.ok?'rgba(39,174,96,0.12)':'rgba(192,57,43,0.12)', borderColor:msg.ok?T.green:T.red, color:msg.ok?T.green:T.red}}>
          {msg.text}
        </div>
      )}

      {full && (
        <div style={{margin:'6px 12px',padding:'8px 12px',borderRadius:8,background:'rgba(192,57,43,0.08)',border:`1px solid ${T.red}`,color:T.red,fontSize:12,textAlign:'center'}}>
          ⚠️ Flotte complète ({MAX_FLEET}/{MAX_FLEET}) — revendez un navire d'abord
        </div>
      )}

      {/* Filtres */}
      <div style={S.filters}>
        {CLASSES.map(c=>(
          <button key={c.id||'all'} style={{...S.filter,...(classe===c.id?S.filterActive:{})}} onClick={()=>{setClasse(c.id);setSel(null);}}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Grille */}
      <div style={S.grid}>
        {ships.map(ship => {
          const canBuy = capital >= ship.prix && !full;
          const owned  = flotte.some(n=>n.navireId===ship.id);
          const isSel  = sel?.id===ship.id;
          return (
            <div key={ship.id} style={{...S.card,...(isSel?S.cardSel:{}),...(!canBuy&&!owned?S.cardLocked:{})}} onClick={()=>setSel(isSel?null:ship)}>
              {/* Image */}
              <div style={{position:'relative',height:90,overflow:'hidden',background:T.bgDeep,borderRadius:'8px 8px 0 0'}}>
                <img src={CLASS_IMG[ship.classe]||CLASS_IMG.standard} alt={ship.nom} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>
                <div style={{position:'absolute',bottom:4,right:6,fontSize:20,filter:'drop-shadow(1px 2px 3px rgba(0,0,0,0.5))'}}>{ship.emoji}</div>
                {owned && <div style={{position:'absolute',top:5,left:5,background:'rgba(39,174,96,0.9)',color:'#fff',fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:8}}>✅ Possédé</div>}
                {!canBuy&&!owned && <div style={{position:'absolute',top:5,right:5,fontSize:16}}>🔒</div>}
              </div>
              {/* Infos */}
              <div style={{padding:'8px 10px'}}>
                <div style={{fontSize:13,fontWeight:700,color:T.dark}}>{ship.nom}</div>
                <div style={{fontSize:10,color:T.mid,marginBottom:4}}>{ship.classeLabel}</div>
                <div style={{fontSize:11,marginBottom:4}}>{'⭐'.repeat(ship.luxe||1)}{'☆'.repeat(5-(ship.luxe||1))}</div>
                <div style={{fontSize:13,fontWeight:700,color:canBuy?T.green:T.red}}>{fmt(ship.prix)}</div>
                <div style={{display:'flex',gap:8,fontSize:10,color:T.mid,marginTop:4}}>
                  <span>👥 {(ship.capacite||0).toLocaleString()}</span>
                  <span>⚡ {ship.vitesse}kn</span>
                  <span>⭐ +{ship.prestige}</span>
                </div>
              </div>
              {/* Détail achat */}
              {isSel && (
                <div style={{padding:'10px',borderTop:`1px solid ${T.border}`,background:'rgba(255,240,180,0.4)'}}>
                  <div style={{fontSize:11,color:T.mid,fontStyle:'italic',marginBottom:8}}>{ship.desc}</div>
                  {canBuy && !owned && (
                    <>
                      <input style={S.input} placeholder={`Nom du navire (défaut : ${ship.nom})`} value={nom} onChange={e=>setNom(e.target.value)} maxLength={30}/>
                      <button style={{...S.buyBtn,opacity:buying?0.6:1}} onClick={()=>handleBuy(ship)} disabled={buying}>
                        {buying?'Achat en cours...`:`⛴ Acheter — ${fmt(ship.prix)}`}
                      </button>
                    </>
                  )}
                  {!canBuy&&!owned && <div style={{color:T.red,fontSize:11,fontWeight:600,textAlign:'center'}}>❌ Il manque {fmt(ship.prix-capital)}</div>}
                  {owned && <div style={{color:T.green,fontSize:11,fontWeight:600,textAlign:'center'}}>✅ Modèle déjà dans votre flotte</div>}
                </div>
              )}
            </div>
          );
        })}
        {ships.length===0 && (
          <div style={{gridColumn:'1/-1',textAlign:'center',color:T.mid,padding:24,fontSize:13}}>Aucun navire dans cette catégorie</div>
        )}
      </div>
    </div>
  );
}

const S = {
  root      : {display:'flex',flexDirection:'column',height:'100%',overflowY:'auto',background:T.bg,fontFamily:T.ff},
  header    : {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:T.parchment,borderBottom:`2px solid ${T.border}`,flexShrink:0},
  title     : {fontSize:16,fontWeight:700,color:T.dark},
  capital   : {fontSize:14,fontWeight:700,color:T.gold,background:'rgba(139,105,20,0.1)',padding:'5px 12px',borderRadius:20,border:`1px solid ${T.border}`},
  msg       : {margin:'6px 12px',padding:'8px 12px',borderRadius:8,border:'1px solid',fontSize:12,fontWeight:600,textAlign:'center'},
  filters   : {display:'flex',gap:5,padding:'8px 12px',overflowX:'auto',flexShrink:0,background:T.parchment,borderBottom:`1px solid ${T.border}`},
  filter    : {padding:'4px 10px',borderRadius:16,border:`1px solid ${T.border}`,background:'transparent',color:T.mid,fontSize:11,cursor:'pointer',whiteSpace:'nowrap',fontFamily:T.ff},
  filterActive:{background:T.gold,color:'#fff',borderColor:T.gold},
  grid      : {padding:'10px 12px',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(165px,1fr))',gap:10},
  card      : {background:T.parchment,borderRadius:10,border:`1px solid ${T.border}`,cursor:'pointer',overflow:'hidden',boxShadow:T.shadowSm,transition:'all 0.2s'},
  cardSel   : {border:`2px solid ${T.gold}`,boxShadow:`0 4px 16px rgba(139,105,20,0.25)`},
  cardLocked: {opacity:0.65},
  input     : {width:'100%',padding:'7px 10px',borderRadius:8,border:`1.5px solid ${T.border}`,background:T.parchment,color:T.dark,fontSize:12,fontFamily:T.ff,outline:'none',boxSizing:'border-box',marginBottom:7},
  buyBtn    : {width:'100%',padding:'9px',borderRadius:8,background:T.gold,border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:T.ff},
};
