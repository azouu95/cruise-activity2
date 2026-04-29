import { useState } from 'react';
import { api, fmt, satisfEmoji, satisfColor, T } from './api.js';

function Bar({ value, max=100, color }) {
  const pct = Math.min(100, Math.round((value/Math.max(1,max))*100));
  return (
    <div style={{background:'rgba(139,105,20,0.15)',borderRadius:4,height:6,overflow:'hidden'}}>
      <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:4,transition:'width 0.5s'}}/>
    </div>
  );
}

function StatBox({label,val,color}) {
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 4px',borderRight:`1px solid ${T.border}`}}>
      <div style={{fontSize:14,fontWeight:700,color:color||T.dark}}>{val}</div>
      <div style={{fontSize:9,color:T.mid,marginTop:2,textAlign:'center'}}>{label}</div>
    </div>
  );
}

export default function FleetPanel({ company, gameData, userId, onRefresh }) {
  const [selected,  setSelected]  = useState(null);
  const [editing,   setEditing]   = useState(null); // 'rename'|'flag'|'sell'
  const [inputVal,  setInputVal]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState(null);

  const showMsg = (ok, text) => { setMsg({ok,text}); setTimeout(()=>setMsg(null),3000); };

  if (!company) {
    return (
      <div style={S.empty}>
        <div style={{fontSize:52}}>⚓</div>
        <div style={S.emptyTitle}>Aucune compagnie</div>
        <div style={S.emptySub}>Fondez votre empire via le bouton en haut, ou dans Discord.</div>
      </div>
    );
  }

  const navires  = company.flotte || [];
  const enMer    = navires.filter(n=>n.routeActive).length;

  const doAction = async(action, params) => {
    setLoading(true);
    try {
      await api[action](userId, ...params);
      showMsg(true, '✅ Action effectuée !');
      setEditing(null); setSelected(null);
      setTimeout(()=>onRefresh(), 500);
    } catch(e) { showMsg(false, e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{fontSize:36}}>{company.logo}</div>
          <div>
            <div style={S.compNom}>{company.nom}</div>
            <div style={S.compSlogan}>"{company.slogan}"</div>
          </div>
        </div>
        <div style={S.badge}>Niv. {company.niveau||1}</div>
      </div>

      {/* Stats */}
      <div style={{display:'flex',background:T.parchment,borderBottom:`1px solid ${T.border}`}}>
        <StatBox label="🪙 Capital"      val={fmt(company.capital)}                 color={T.gold}/>
        <StatBox label="⭐ Prestige"     val={`${company.prestige} pts`}/>
        <StatBox label="⛴ En mer"       val={`${enMer}/${navires.length}`}         color={T.blue}/>
        <StatBox label="🗺 Voyages"      val={company.voyagesTotal}/>
      </div>

      {/* Satisfaction */}
      <div style={{padding:'8px 14px',background:T.parchment,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
          <span style={{fontSize:12,color:T.mid}}>😊 Satisfaction passagers</span>
          <span style={{fontSize:12,fontWeight:700,color:satisfColor(company.satisfaction)}}>{satisfEmoji(company.satisfaction)} {company.satisfaction}/100</span>
        </div>
        <Bar value={company.satisfaction} color={satisfColor(company.satisfaction)}/>
      </div>

      {/* Feedback */}
      {msg && (
        <div style={{margin:'6px 12px',padding:'8px 12px',borderRadius:8,background:msg.ok?'rgba(39,174,96,0.12)':'rgba(192,57,43,0.12)',border:`1px solid ${msg.ok?T.green:T.red}`,color:msg.ok?T.green:T.red,fontSize:12,fontWeight:600,textAlign:'center'}}>
          {msg.text}
        </div>
      )}

      {/* Section titre */}
      <div style={S.sectionTitle}>⛴ Ma Flotte</div>

      {/* Liste navires */}
      <div style={S.list}>
        {navires.length===0 && <div style={S.noShip}>Aucun navire — achetez-en un dans le Marché ↓</div>}
        {navires.map(navire => {
          const route = gameData?.routes?.find(r=>r.id===navire.routeActive);
          const isSel = selected===navire.uid;
          const sat   = navire.satisfactionMoyenne||70;
          return (
            <div key={navire.uid} style={{...S.card,...(isSel?S.cardSel:{})}}>
              {/* Ligne principale */}
              <div style={S.cardTop} onClick={()=>setSelected(isSel?null:navire.uid)}>
                <div style={{fontSize:26}}>{navire.flag||'🚢'}</div>
                <div style={{flex:1}}>
                  <div style={S.shipNom}>{navire.nom}</div>
                  <div style={{fontSize:11,color:route?T.green:T.mid}}>
                    {route?`🟢 ${route.label.slice(0,28)}`:'⚪ Sans route'}
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:15}}>{satisfEmoji(sat)}</div>
                  <div style={{fontSize:10,color:T.mid}}>✈️ {navire.voyages}</div>
                </div>
              </div>

              {/* Détails dépliés */}
              {isSel && (
                <div style={S.detail}>
                  {/* Bar satisfaction */}
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:11,color:T.mid}}>😊 Satisfaction</span>
                    <span style={{fontSize:11,fontWeight:700,color:satisfColor(sat)}}>{sat.toFixed(0)}/100</span>
                  </div>
                  <Bar value={sat} color={satisfColor(sat)}/>

                  {/* Stats */}
                  <div style={{display:'flex',flexDirection:'column',gap:5,marginTop:10}}>
                    {[
                      ['💰 Revenus',   fmt(navire.revenusGeneres)],
                      ['👥 Passagers', (navire.passagers||0).toLocaleString('fr-FR')],
                      ['🔧 Upgrades',  `${(navire.upgrades||[]).length} installée${(navire.upgrades||[]).length>1?'s':''}`],
                    ].map(([k,v])=>(
                      <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
                        <span style={{color:T.mid}}>{k}</span>
                        <span style={{color:T.dark,fontWeight:700}}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions rapides */}
                  <div style={{display:'flex',gap:6,marginTop:12,flexWrap:'wrap'}}>
                    <button style={S.actionBtn} onClick={()=>{setEditing('rename');setInputVal(navire.nom);}}>✏️ Renommer</button>
                    <button style={S.actionBtn} onClick={()=>{setEditing('flag');setInputVal('');}}>🏳 Pavillon</button>
                    <button style={{...S.actionBtn,color:T.red,borderColor:T.red}} onClick={()=>setEditing('sell')}>💰 Revendre</button>
                  </div>

                  {/* Formulaires inline */}
                  {editing==='rename' && (
                    <div style={S.editBox}>
                      <input style={S.input} value={inputVal} onChange={e=>setInputVal(e.target.value)} placeholder="Nouveau nom..." maxLength={30}/>
                      <button style={S.confirmBtn} disabled={loading||!inputVal.trim()} onClick={()=>doAction('renameShip',[navire.uid,inputVal.trim()])}>Confirmer</button>
                    </div>
                  )}
                  {editing==='flag' && (
                    <div style={S.editBox}>
                      <div style={{fontSize:11,color:T.mid,marginBottom:6}}>Collez un drapeau emoji (ex: 🇫🇷 🇮🇹 🏴‍☠️)</div>
                      <input style={S.input} value={inputVal} onChange={e=>setInputVal(e.target.value)} placeholder="🇫🇷" maxLength={8}/>
                      <button style={S.confirmBtn} disabled={loading||!inputVal.trim()} onClick={()=>doAction('setFlag',[navire.uid,inputVal.trim()])}>Confirmer</button>
                    </div>
                  )}
                  {editing==='sell' && (
                    <div style={{...S.editBox,background:'rgba(192,57,43,0.08)',borderColor:T.red}}>
                      <div style={{fontSize:12,color:T.red,fontWeight:600,marginBottom:8}}>⚠️ Revendre {navire.nom} ?<br/><span style={{fontWeight:400,fontSize:11}}>Vous récupérez ~60% du prix d'achat.</span></div>
                      <div style={{display:'flex',gap:8}}>
                        <button style={{...S.confirmBtn,background:T.red}} disabled={loading} onClick={()=>doAction('sellShip',[navire.uid])}>Confirmer la vente</button>
                        <button style={{...S.actionBtn}} onClick={()=>setEditing(null)}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer bilan */}
      <div style={S.footer}>
        {[
          ['🗺 Voyages totaux',        company.voyagesTotal],
          ['👥 Passagers transportés', (company.passagersTotal||0).toLocaleString('fr-FR')],
          ['🪙 CA Total',              fmt(company.revenusTotal)],
        ].map(([k,v])=>(
          <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
            <span style={{color:T.mid}}>{k}</span>
            <span style={{fontWeight:700,color:T.dark}}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const S = {
  root      : {display:'flex',flexDirection:'column',height:'100%',overflowY:'auto',background:T.bg,fontFamily:T.ff},
  empty     : {display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:14,color:T.mid,fontFamily:T.ff,background:T.bg},
  emptyTitle: {fontSize:20,fontWeight:700,color:T.dark},
  emptySub  : {fontSize:13,textAlign:'center',maxWidth:260,lineHeight:1.5},
  header    : {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:T.parchment,borderBottom:`2px solid ${T.border}`},
  compNom   : {fontSize:16,fontWeight:700,color:T.dark},
  compSlogan: {fontSize:11,color:T.mid,fontStyle:'italic',marginTop:2},
  badge     : {background:'rgba(139,105,20,0.15)',border:`1px solid ${T.border}`,borderRadius:20,padding:'4px 10px',fontSize:12,fontWeight:700,color:T.gold},
  sectionTitle:{padding:'8px 14px',fontSize:11,fontWeight:700,color:T.gold,textTransform:'uppercase',letterSpacing:1,background:T.parchment,borderBottom:`1px solid ${T.border}`,borderTop:`1px solid ${T.border}`},
  list      : {flex:1,padding:'10px 12px',display:'flex',flexDirection:'column',gap:8,background:T.bg},
  noShip    : {textAlign:'center',color:T.mid,fontSize:13,padding:24,lineHeight:1.6},
  card      : {background:T.parchment,borderRadius:10,padding:'12px 14px',border:`1px solid ${T.border}`,cursor:'pointer',boxShadow:T.shadowSm},
  cardSel   : {border:`2px solid ${T.gold}`,background:'rgba(255,240,180,0.99)'},
  cardTop   : {display:'flex',alignItems:'center',gap:10},
  shipNom   : {fontSize:14,fontWeight:700,color:T.dark},
  detail    : {marginTop:12,paddingTop:10,borderTop:`1px solid ${T.border}`},
  actionBtn : {padding:'5px 10px',borderRadius:7,border:`1px solid ${T.border}`,background:'transparent',color:T.dark,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:T.ff},
  editBox   : {marginTop:10,padding:'10px',background:'rgba(139,105,20,0.06)',borderRadius:8,border:`1px solid ${T.border}`},
  input     : {width:'100%',padding:'7px 10px',borderRadius:8,border:`1.5px solid ${T.border}`,background:T.parchment,color:T.dark,fontSize:12,fontFamily:T.ff,outline:'none',boxSizing:'border-box',marginBottom:7},
  confirmBtn: {padding:'7px 14px',borderRadius:8,background:T.gold,border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:T.ff},
  footer    : {padding:'10px 16px',background:T.parchment,borderTop:`2px solid ${T.border}`,display:'flex',flexDirection:'column',gap:5},
};
