import { useState } from 'react';
import { api, fmt, T } from './api.js';

// Catalogue local de fallback si l'API ne le renvoie pas
const FALLBACK_UPGRADES = [
  {id:'wifi_basique',          label:'Wi-Fi Basique',          emoji:'📶', prix:120000,  desc:'+3% occupation',               effet:'+3% occ.'},
  {id:'wifi_premium',          label:'Wi-Fi Premium',          emoji:'📡', prix:280000,  desc:'+6% occupation',               effet:'+6% occ.'},
  {id:'restaurant_bistro',     label:'Restaurant Bistro',      emoji:'🍽', prix:200000,  desc:'+5 satisfaction',              effet:'+5 sat.'},
  {id:'restaurant_gastronomique',label:'Resto Gastronomique',  emoji:'⭐', prix:900000,  desc:'+12 satisfaction',             effet:'+12 sat.'},
  {id:'spa_premium',           label:'Spa Premium',            emoji:'🛁', prix:650000,  desc:'+9 satisfaction',              effet:'+9 sat.'},
  {id:'pont_soleil',           label:'Pont Soleil',            emoji:'☀️', prix:160000,  desc:'+5% occupation',               effet:'+5% occ.'},
  {id:'pont_infinity',         label:'Infinity Pool',          emoji:'🏊', prix:520000,  desc:'+8% occupation',               effet:'+8% occ.'},
  {id:'casino',                label:'Casino',                 emoji:'🎰', prix:380000,  desc:'+6% revenus bruts',            effet:'+6% rev.'},
  {id:'theatre',               label:'Théâtre',                emoji:'🎭', prix:420000,  desc:'+7 satisfaction',              effet:'+7 sat.'},
  {id:'kids_club',             label:'Kids Club',              emoji:'🎠', prix:220000,  desc:'+4% occupation familles',      effet:'+4% occ.'},
  {id:'parc_aquatique',        label:'Parc Aquatique',         emoji:'🎢', prix:780000,  desc:'+10% occupation',              effet:'+10% occ.'},
  {id:'cabines_suite',         label:'Suites Luxe',            emoji:'👑', prix:1200000, desc:'+15 satisfaction',             effet:'+15 sat.'},
  {id:'yacht_club',            label:'Yacht Club Privé',       emoji:'⚓', prix:2000000, desc:'+20 satisfaction',             effet:'+20 sat.'},
  {id:'helipad',               label:'Hélipad',                emoji:'🚁', prix:3500000, desc:'+5 prestige compagnie',        effet:'+5 prestige'},
];

export default function UpgradesPanel({ company, gameData, userId, onRefresh }) {
  const [selNavire, setSelNavire] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState(null);

  const navires  = company?.flotte || [];
  const capital  = company?.capital || 0;
  const upgrades = gameData?.catalogue_upgrades?.length > 0
    ? gameData.catalogue_upgrades
    : FALLBACK_UPGRADES;

  const navireUpgrades = selNavire?.upgrades || [];
  const available = upgrades.filter(u => !navireUpgrades.includes(u.id));
  const installed = upgrades.filter(u => navireUpgrades.includes(u.id));

  const handleUpgrade = async(u) => {
    if (!selNavire||!userId) return;
    setLoading(true); setMsg(null);
    try {
      await api.upgradeShip(userId, selNavire.uid, u.id);
      setMsg({ok:true, text:`✅ ${u.label} installé sur ${selNavire.nom} !`});
      setTimeout(()=>{setMsg(null);onRefresh();}, 2000);
    } catch(e) { setMsg({ok:false, text:e.message}); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.title}>🔧 Upgrades</div>
        <div style={S.capital}>💳 {fmt(capital)}</div>
      </div>

      {msg && (
        <div style={{...S.msg, background:msg.ok?'rgba(39,174,96,0.12)':'rgba(192,57,43,0.12)', borderColor:msg.ok?T.green:T.red, color:msg.ok?T.green:T.red}}>
          {msg.text}
        </div>
      )}

      <div style={S.section}>⛴ Choisir un navire</div>
      <div style={{padding:'8px 12px',display:'flex',flexDirection:'column',gap:6}}>
        {navires.length===0 && <div style={{textAlign:'center',color:T.mid,fontSize:12,padding:12}}>Aucun navire disponible</div>}
        {navires.map(n=>{
          const isSel = selNavire?.uid===n.uid;
          return (
            <div key={n.uid} style={{...S.navBtn,...(isSel?S.navBtnSel:{})}} onClick={()=>setSelNavire(isSel?null:n)}>
              <span style={{fontSize:22}}>{n.flag||'🚢'}</span>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.dark}}>{n.nom}</div>
                <div style={{fontSize:10,color:T.mid}}>🔧 {n.upgrades?.length||0} upgrade{(n.upgrades?.length||0)>1?'s':''}</div>
              </div>
              {isSel && <span style={{marginLeft:'auto',color:T.gold}}>▼</span>}
            </div>
          );
        })}
      </div>

      {selNavire && installed.length>0 && (
        <>
          <div style={S.section}>✅ Installées</div>
          <div style={{padding:'4px 12px 8px',display:'flex',flexDirection:'column',gap:5}}>
            {installed.map(u=>(
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'rgba(39,174,96,0.08)',borderRadius:9,border:`1px solid rgba(39,174,96,0.3)`}}>
                <span style={{fontSize:20}}>{u.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.green}}>{u.label}</div>
                  <div style={{fontSize:10,color:T.mid}}>{u.effet}</div>
                </div>
                <span style={{fontSize:14,color:T.green}}>✅</span>
              </div>
            ))}
          </div>
        </>
      )}

      {selNavire && (
        <>
          <div style={S.section}>🛒 Disponibles {available.length===0?'— Tout est installé !':''}</div>
          <div style={{padding:'4px 12px 12px',display:'flex',flexDirection:'column',gap:6}}>
            {available.map(u=>{
              const canBuy = capital>=u.prix;
              return (
                <div key={u.id} style={{...S.upgradeCard,...(!canBuy?{opacity:0.6}:{})}}>
                  <span style={{fontSize:22}}>{u.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.dark}}>{u.label}</div>
                    <div style={{fontSize:11,color:T.mid,marginTop:1}}>{u.desc}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:canBuy?T.green:T.red,marginBottom:4}}>{fmt(u.prix)}</div>
                    <button
                      style={{...S.buyBtn,background:canBuy?T.gold:'#aaa',opacity:(!canBuy||loading)?0.55:1}}
                      onClick={()=>canBuy&&handleUpgrade(u)}
                      disabled={!canBuy||loading}
                    >
                      {loading?'...':'Acheter'}
                    </button>
                  </div>
                </div>
              );
            })}
            {available.length===0 && (
              <div style={{textAlign:'center',color:T.green,fontSize:13,fontWeight:600,padding:16}}>🎉 Toutes les upgrades sont installées !</div>
            )}
          </div>
        </>
      )}

      {!selNavire && navires.length>0 && (
        <div style={{textAlign:'center',padding:24,color:T.mid,fontSize:13,fontStyle:'italic'}}>👆 Sélectionnez un navire ci-dessus</div>
      )}
    </div>
  );
}

const S = {
  root    :{display:'flex',flexDirection:'column',height:'100%',overflowY:'auto',background:T.bg,fontFamily:T.ff},
  header  :{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:T.parchment,borderBottom:`2px solid ${T.border}`,flexShrink:0},
  title   :{fontSize:16,fontWeight:700,color:T.dark},
  capital :{fontSize:13,fontWeight:700,color:T.gold,background:'rgba(139,105,20,0.1)',padding:'5px 12px',borderRadius:20,border:`1px solid ${T.border}`},
  msg     :{margin:'6px 12px',padding:'8px 12px',borderRadius:8,border:'1px solid',fontSize:12,fontWeight:600,textAlign:'center'},
  section :{padding:'8px 14px',fontSize:11,fontWeight:700,color:T.gold,textTransform:'uppercase',letterSpacing:1,background:T.parchment,borderBottom:`1px solid ${T.border}`,borderTop:`1px solid ${T.border}`},
  navBtn  :{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:T.parchment,borderRadius:10,border:`1px solid ${T.border}`,cursor:'pointer'},
  navBtnSel:{border:`2px solid ${T.gold}`,background:'rgba(255,240,180,0.98)'},
  upgradeCard:{display:'flex',alignItems:'center',gap:10,padding:'11px 13px',background:T.parchment,borderRadius:10,border:`1px solid ${T.border}`,boxShadow:T.shadowSm},
  buyBtn  :{padding:'5px 12px',borderRadius:7,border:'none',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:T.ff},
};
