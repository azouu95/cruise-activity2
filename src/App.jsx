import { useState, useEffect, useCallback } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import { fetchGameState, api, T } from './api.js';
import GameMap       from './GameMap.jsx';
import FleetPanel    from './FleetPanel.jsx';
import ShopPanel     from './ShopPanel.jsx';
import RoutesPanel   from './RoutesPanel.jsx';
import DailyPanel    from './DailyPanel.jsx';
import FinancesPanel from './FinancesPanel.jsx';
import UpgradesPanel from './UpgradesPanel.jsx';
import Leaderboard   from './Leaderboard.jsx';

const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || '1490265340733558916';
const discordSdk = new DiscordSDK(CLIENT_ID);

const BOTTOM_TABS = [
  { id:'map',    label:'Carte',     emoji:'🗺' },
  { id:'fleet',  label:'Flotte',    emoji:'⛴' },
  { id:'daily',  label:'Décision',  emoji:'🎯' },
  { id:'rank',   label:'Classement',emoji:'🏆' },
  { id:'more',   label:'Plus',      emoji:'⚙️' },
];
const MORE_ITEMS = [
  { id:'shop',     label:'Marché navires', emoji:'🛒' },
  { id:'routes',   label:'Mes Routes',     emoji:'🗺' },
  { id:'upgrades', label:'Upgrades',        emoji:'🔧' },
  { id:'finances', label:'Finances',        emoji:'💰' },
];
const LOGOS = ['⚓','🚢','🌊','🏴‍☠️','⭐','🔱','🌺','🦅','🦁','🐬','🌙','⚡'];

function FoundCompany({ userId, onDone }) {
  const [nom,s1]=useState('');const [logo,s2]=useState('⚓');const [slogan,s3]=useState('');
  const [loading,s4]=useState(false);const [error,s5]=useState(null);
  const go=async()=>{if(!nom.trim()){s5('Nom requis');return;}s4(true);s5(null);try{await api.foundCompany(userId,nom.trim(),logo,slogan.trim());onDone();}catch(e){s5(e.message);}finally{s4(false);}};
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)'}}>
      <div style={{background:T.parchment,border:`3px solid ${T.gold}`,borderRadius:20,padding:'26px 22px',width:'90%',maxWidth:380,fontFamily:T.ff,boxShadow:T.shadow}}>
        <div style={{fontSize:48,textAlign:'center'}}>⚓</div>
        <div style={{fontSize:18,fontWeight:700,color:T.dark,textAlign:'center',margin:'8px 0 4px'}}>Fonder votre Compagnie</div>
        <div style={{fontSize:12,color:T.mid,textAlign:'center',marginBottom:18}}>Capital de départ : <b>3 200 000 🪙</b></div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:T.gold,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Logo</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
            {LOGOS.map(l=><button key={l} style={{fontSize:20,padding:'5px 7px',borderRadius:7,border:`1px solid ${T.border}`,background:logo===l?T.gold:'transparent',cursor:'pointer',transform:logo===l?'scale(1.2)':'none'}} onClick={()=>s2(l)}>{l}</button>)}
          </div>
        </div>
        <input style={{width:'100%',padding:'9px 12px',borderRadius:9,border:`1.5px solid ${T.border}`,background:'rgba(255,248,220,0.8)',color:T.dark,fontSize:13,fontFamily:T.ff,outline:'none',boxSizing:'border-box',marginBottom:10}} value={nom} onChange={e=>s1(e.target.value)} placeholder="Nom de la compagnie *" maxLength={30}/>
        <input style={{width:'100%',padding:'9px 12px',borderRadius:9,border:`1.5px solid ${T.border}`,background:'rgba(255,248,220,0.8)',color:T.dark,fontSize:13,fontFamily:T.ff,outline:'none',boxSizing:'border-box',marginBottom:14}} value={slogan} onChange={e=>s3(e.target.value)} placeholder="Slogan (optionnel)" maxLength={50}/>
        {error&&<div style={{color:T.red,fontSize:12,textAlign:'center',marginBottom:8,fontWeight:600}}>{error}</div>}
        <button style={{width:'100%',padding:'13px',borderRadius:12,background:T.gold,border:'none',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:T.ff,opacity:loading?0.6:1}} onClick={go} disabled={loading}>{loading?'Création...': `${logo} Fonder ${nom||'ma compagnie'}`}</button>
      </div>
    </div>
  );
}

function buildLocalCatalogue(){
  return[
    {id:'riviera_express',    nom:'Riviera Express',    emoji:'⛴',classe:'decouverte',classeLabel:'🟢 Découverte',prix:2800000, luxe:1,capacite:800, vitesse:18,prestige:8, desc:'Idéal pour débuter.'},
    {id:'mediterranee_star',  nom:'Méditerranée Star',  emoji:'🚢',classe:'decouverte',classeLabel:'🟢 Découverte',prix:7500000, luxe:2,capacite:1400,vitesse:19,prestige:18,desc:'Second palier solide.'},
    {id:'belle_de_mer',       nom:'Belle de Mer',       emoji:'🛳',classe:'standard',  classeLabel:'🔵 Standard',  prix:22000000,luxe:2,capacite:2400,vitesse:20,prestige:22,desc:'Navire standard familial.'},
    {id:'costa_azurra',       nom:'Costa Azurra',       emoji:'🛳',classe:'standard',  classeLabel:'🔵 Standard',  prix:32000000,luxe:2,capacite:2800,vitesse:21,prestige:16,desc:'Animé et festif.'},
    {id:'msc_bellissima',     nom:'MSC Bellissima',     emoji:'🚢',classe:'standard',  classeLabel:'🔵 Standard',  prix:48000000,luxe:3,capacite:4100,vitesse:22,prestige:28,desc:'Le paquebot européen.'},
    {id:'adriatique_queen',   nom:'Adriatique Queen',   emoji:'🚢',classe:'standard',  classeLabel:'🔵 Standard',  prix:55000000,luxe:3,capacite:3200,vitesse:21,prestige:32,desc:'Reine de l\'Adriatique.'},
    {id:'oceanus_prima',      nom:'Oceanus Prima',      emoji:'⭐',classe:'premium',   classeLabel:'🟣 Premium',   prix:140000000,luxe:4,capacite:4800,vitesse:22,prestige:55,desc:'Première classe.'},
    {id:'celebrity_apex',     nom:'Celebrity Apex',     emoji:'🚢',classe:'premium',   classeLabel:'🟣 Premium',   prix:220000000,luxe:4,capacite:5200,vitesse:23,prestige:75,desc:'Design révolutionnaire.'},
    {id:'aurora_splendida',   nom:'Aurora Splendida',   emoji:'✨',classe:'premium',   classeLabel:'🟣 Premium',   prix:320000000,luxe:4,capacite:5800,vitesse:23,prestige:88,desc:'Le summum du premium.'},
    {id:'seabourn_encore',    nom:'Seabourn Encore',    emoji:'👑',classe:'luxe',      classeLabel:'🟡 Luxe',      prix:450000000,luxe:5,capacite:600, vitesse:19,prestige:90,desc:'600 invités ultra-VIP.'},
    {id:'sovereign_imperial', nom:'Sovereign Imperial', emoji:'👑',classe:'luxe',      classeLabel:'🟡 Luxe',      prix:700000000,luxe:5,capacite:3000,vitesse:22,prestige:120,desc:'Royauté des mers.'},
    {id:'icon_of_seas',       nom:'Icon of the Seas',   emoji:'🌊',classe:'luxe',      classeLabel:'🟡 Luxe',      prix:1200000000,luxe:4,capacite:7600,vitesse:22,prestige:180,desc:'Le plus grand navire.'},
    {id:'world_colossus',     nom:'World Colossus',     emoji:'🏰',classe:'luxe',      classeLabel:'🟡 Luxe',      prix:1800000000,luxe:5,capacite:9000,vitesse:21,prestige:250,desc:'Le monstre des mers.'},
    {id:'explorer_arctique',  nom:'Arctic Explorer',    emoji:'🧊',classe:'expedition',classeLabel:'🔵 Expédition',prix:12000000,luxe:3,capacite:400, vitesse:16,prestige:35,desc:'Routes polaires.'},
    {id:'safari_marin',       nom:'Ocean Safari',       emoji:'🐋',classe:'expedition',classeLabel:'🔵 Expédition',prix:8500000, luxe:2,capacite:280, vitesse:14,prestige:22,desc:'Observation naturaliste.'},
    {id:'nil_royal',          nom:'Nil Royal',          emoji:'🌴',classe:'fluviale',  classeLabel:'🟤 Fluviale',  prix:4500000, luxe:4,capacite:150, vitesse:12,prestige:18,desc:'Luxe sur le Nil.'},
  ];
}

export default function App(){
  const [ready,setReady]=useState(false);
  const [auth,setAuth]=useState(null);
  const [gameData,setGameData]=useState(null);
  const [myCompany,setMyCompany]=useState(null);
  const [activeTab,setActiveTab]=useState('map');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [showMore,setShowMore]=useState(false);
  const [showFound,setShowFound]=useState(false);
  const [userId,setUserId]=useState(null);

  useEffect(()=>{
    async function init(){
      try{
        await discordSdk.ready();
        const{code}=await discordSdk.commands.authorize({client_id:CLIENT_ID,response_type:'code',state:'',prompt:'none',scope:['identify','guilds']});
        const tr=await fetch('/api/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
        if(!tr.ok) throw new Error('token');
        const{access_token}=await tr.json();
        const result=await discordSdk.commands.authenticate({access_token});
        setAuth(result);setUserId(result.user.id);setReady(true);
        await load(result.user.id);
      }catch(e){
        const id='demo_'+Math.random().toString(36).slice(2,8);
        setAuth({user:{id,username:'Demo',global_name:'Joueur Demo'}});
        setUserId(id);setReady(true);await load(id);
      }
    }
    init();
  },[]);

  const load=useCallback(async(uid)=>{
    try{
      setLoading(true);
      const data=await fetchGameState();
      if(!data.catalogue_navires) data.catalogue_navires=buildLocalCatalogue();
      setGameData(data);
      setMyCompany(data.companies?.[uid]||null);
    }catch(e){setError('Bot hors ligne');}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{
    if(!ready||!userId) return;
    const iv=setInterval(()=>load(userId),30000);
    return()=>clearInterval(iv);
  },[ready,userId,load]);

  const onRefresh=useCallback(()=>{if(userId)load(userId);},[userId,load]);

  const handleTab=(id)=>{
    if(id==='more'){setShowMore(v=>!v);return;}
    setActiveTab(id);setShowMore(false);
  };

  const fmt1M=(n)=>n>=1e9?`${(n/1e9).toFixed(1)}Md`:n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1e3?`${Math.round(n/1000)}K`:`${n}`;

  if(!ready||loading) return(
    <div style={{width:'100vw',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:T.bg}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,padding:32,background:T.parchment,border:`3px solid ${T.gold}`,borderRadius:20,boxShadow:T.shadow}}>
        <div style={{fontSize:52}}>⚓</div>
        <div style={{fontSize:20,fontWeight:700,color:T.dark,fontFamily:T.ff}}>Armateur de Croisière</div>
        <div style={{fontSize:13,color:T.mid,fontFamily:T.ff}}>{!ready?'Connexion à Discord...':'Chargement...'}</div>
        <div style={{width:36,height:36,borderRadius:'50%',border:`3px solid ${T.border}`,borderTopColor:T.gold,animation:'spin 0.8s linear infinite'}}/>
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if(error) return(
    <div style={{width:'100vw',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:T.bg}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,padding:32,background:T.parchment,border:`3px solid ${T.gold}`,borderRadius:20}}>
        <div style={{fontSize:48}}>🌊</div>
        <div style={{fontSize:18,fontWeight:700,color:T.dark,fontFamily:T.ff}}>Connexion perdue</div>
        <div style={{fontSize:13,color:T.mid,fontFamily:T.ff}}>{error}</div>
        <button style={{padding:'10px 24px',borderRadius:10,background:T.gold,border:'none',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:T.ff}} onClick={()=>{setError(null);load(userId);}}>🔄 Réessayer</button>
      </div>
    </div>
  );

  return(
    <div style={{width:'100vw',height:'100vh',display:'flex',flexDirection:'column',background:T.bg,fontFamily:T.ff,overflow:'hidden'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 14px',background:T.parchment,borderBottom:`2px solid ${T.border}`,height:52,flexShrink:0,boxShadow:T.shadowSm}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:22}}>⚓</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.dark}}>{myCompany?`${myCompany.logo} ${myCompany.nom}`:'Armateur de Croisière'}</div>
            {myCompany&&<div style={{fontSize:9,color:T.mid}}>Niv.{myCompany.niveau||1} · {myCompany.prestige} prestige · {myCompany.satisfaction}/100 😊</div>}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {myCompany&&<div style={{background:'rgba(139,105,20,0.12)',border:`1px solid ${T.border}`,borderRadius:20,padding:'4px 10px',fontSize:12,fontWeight:700,color:T.gold}}>💳 {fmt1M(myCompany.capital)} 🪙</div>}
          {!myCompany&&<button style={{padding:'6px 14px',borderRadius:20,background:T.gold,border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:T.ff}} onClick={()=>setShowFound(true)}>🏢 Fonder</button>}
        </div>
      </div>

      {/* Contenu */}
      <div style={{flex:1,overflow:'hidden',position:'relative'}}>
        {activeTab==='map'      &&<GameMap       gameData={gameData} myCompany={myCompany}/>}
        {activeTab==='fleet'    &&<FleetPanel    company={myCompany} gameData={gameData} userId={userId} onRefresh={onRefresh}/>}
        {activeTab==='daily'    &&<DailyPanel    company={myCompany} userId={userId} onRefresh={onRefresh}/>}
        {activeTab==='rank'     &&<Leaderboard   gameData={gameData} myCompany={myCompany}/>}
        {activeTab==='shop'     &&<ShopPanel     gameData={gameData} company={myCompany} userId={userId} onRefresh={onRefresh}/>}
        {activeTab==='routes'   &&<RoutesPanel   gameData={gameData} company={myCompany} userId={userId} onRefresh={onRefresh}/>}
        {activeTab==='upgrades' &&<UpgradesPanel company={myCompany} userId={userId} onRefresh={onRefresh}/>}
        {activeTab==='finances' &&<FinancesPanel company={myCompany} gameData={gameData}/>}
      </div>

      {/* Drawer Plus */}
      {showMore&&(
        <div style={{position:'absolute',bottom:62,left:0,right:0,background:T.parchment,borderTop:`2px solid ${T.border}`,display:'flex',justifyContent:'space-around',padding:'12px 8px',zIndex:100,boxShadow:'0 -4px 20px rgba(0,0,0,0.2)'}}>
          {MORE_ITEMS.map(item=>(
            <button key={item.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'8px 12px',borderRadius:12,border:`1px solid ${activeTab===item.id?T.gold:T.border}`,background:activeTab===item.id?`rgba(139,105,20,0.1)`:'transparent',cursor:'pointer',color:T.dark,fontFamily:T.ff,minWidth:68}} onClick={()=>{setActiveTab(item.id);setShowMore(false);}}>
              <span style={{fontSize:22}}>{item.emoji}</span>
              <span style={{fontSize:11,fontWeight:600}}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div style={{display:'flex',background:T.parchment,borderTop:`2px solid ${T.border}`,height:60,flexShrink:0,position:'relative',zIndex:50}}>
        {BOTTOM_TABS.map(tab=>{
          const isActive=tab.id==='more'?showMore:activeTab===tab.id;
          return(
            <button key={tab.id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'none',border:'none',color:isActive?T.gold:'rgba(93,78,55,0.5)',cursor:'pointer',gap:2,fontFamily:T.ff,borderRight:`1px solid ${T.border}`,borderTop:isActive?`3px solid ${T.gold}`:'3px solid transparent',position:'relative',transition:'all 0.2s',fontSize:10}} onClick={()=>handleTab(tab.id)}>
              <span style={{fontSize:20}}>{tab.emoji}</span>
              {tab.label}
              {tab.id==='daily'&&<div style={{position:'absolute',top:8,right:'50%',transform:'translateX(10px)',width:8,height:8,borderRadius:'50%',background:'#ef4444',border:'2px solid '+T.parchment}}/>}
            </button>
          );
        })}
      </div>

      {showFound&&<FoundCompany userId={userId} onDone={()=>{setShowFound(false);load(userId);}}/>}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        button:hover{filter:brightness(1.06)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(139,105,20,0.3);border-radius:2px}
      `}</style>
    </div>
  );
}
