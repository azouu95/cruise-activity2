import { useState, useEffect } from 'react';
import { api, fmt, satisfEmoji, satisfColor, T } from './api.js';

// 8 scénarios qui tournent sur les jours (alignés avec cruise-game-daily.js)
const SCENARIOS = [
  {
    id:'optimisation', emoji:'⚡', titre:'Optimisation Express',
    desc:'Vos équipes attendent vos directives pour maximiser l\'efficacité ce soir.',
    choix:[
      {id:'occupation',   emoji:'📊', label:'Maximiser l\'occupation',   bonus:'+8% occupation ce soir'},
      {id:'satisfaction', emoji:'😊', label:'Prioriser le confort',       bonus:'+6 satisfaction passagers'},
      {id:'couts',        emoji:'💸', label:'Réduire les coûts',          bonus:'−10% coûts opérationnels'},
    ],
  },
  {
    id:'investissement', emoji:'💼', titre:'Opportunité d\'Investissement',
    desc:'Un partenaire vous propose d\'investir dans un secteur stratégique.',
    choix:[
      {id:'marketing',    emoji:'📣', label:'Campagne marketing',         bonus:'+5 prestige'},
      {id:'formation',    emoji:'👨‍✈️', label:'Formation des équipages',   bonus:'+10 satisfaction durable'},
      {id:'tech',         emoji:'🔧', label:'Maintenance préventive',     bonus:'Pannes évitées 7 jours'},
    ],
  },
  {
    id:'evenement', emoji:'🌊', titre:'Événement Naturel',
    desc:'Des conditions météo exceptionnelles affectent vos routes. Comment réagissez-vous ?',
    choix:[
      {id:'contourner',   emoji:'🗺', label:'Contourner la zone',         bonus:'Pas de risque, −5% revenus'},
      {id:'maintenir',    emoji:'💪', label:'Maintenir le cap',           bonus:'Revenus normaux, risque 20%'},
      {id:'attendre',     emoji:'⏳', label:'Attendre en port',           bonus:'+4 satisfaction, retard 1j'},
    ],
  },
  {
    id:'partenariat', emoji:'🤝', titre:'Proposition de Partenariat',
    desc:'Un port méditerranéen propose un accord commercial exclusif.',
    choix:[
      {id:'exclusif',     emoji:'⭐', label:'Accord exclusif',            bonus:'+15% revenus escale'},
      {id:'standard',     emoji:'📋', label:'Accord standard',            bonus:'+5% revenus tous ports'},
      {id:'refus',        emoji:'🚫', label:'Décliner l\'offre',          bonus:'+2 prestige (indépendance)'},
    ],
  },
  {
    id:'crise', emoji:'⚠️', titre:'Gestion de Crise',
    desc:'Un incident mineur à bord fait le buzz sur les réseaux sociaux.',
    choix:[
      {id:'transparence', emoji:'📢', label:'Communication ouverte',      bonus:'+8 satisfaction, +3 prestige'},
      {id:'silencieux',   emoji:'🤫', label:'Gérer discrètement',         bonus:'Aucun impact visible'},
      {id:'compensation', emoji:'🎁', label:'Compenser les passagers',    bonus:'+15 satisfaction, −50K🪙'},
    ],
  },
  {
    id:'recrutement', emoji:'👥', titre:'Recrutement Stratégique',
    desc:'Plusieurs profils exceptionnels postulent à des postes clés.',
    choix:[
      {id:'expert',       emoji:'🎓', label:'Expert en restauration',     bonus:'+8 satisfaction cuisine'},
      {id:'animateur',    emoji:'🎭', label:'Directeur des animations',   bonus:'+6 satisfaction divertissements'},
      {id:'commercial',   emoji:'💼', label:'Directeur commercial',       bonus:'+10% occupation durable'},
    ],
  },
  {
    id:'innovation', emoji:'🚀', titre:'Innovation Technologique',
    desc:'Une startup propose d\'équiper vos navires d\'une technologie inédite.',
    choix:[
      {id:'ia_service',   emoji:'🤖', label:'IA au service client',       bonus:'+12 satisfaction, −5% coûts'},
      {id:'ecologie',     emoji:'🌿', label:'Moteurs écologiques',        bonus:'+8 prestige, −15% carburant'},
      {id:'divertissement',emoji:'🎮',label:'Divertissement immersif',    bonus:'+10% occupation premium'},
    ],
  },
  {
    id:'medias', emoji:'📺', titre:'Opportunité Médiatique',
    desc:'Une chaîne TV veut filmer un reportage à bord de votre navire.',
    choix:[
      {id:'accepter',     emoji:'🎬', label:'Accepter le tournage',       bonus:'+10 prestige, +5% occupation'},
      {id:'negocier',     emoji:'💬', label:'Négocier les conditions',    bonus:'+6 prestige, confort préservé'},
      {id:'refuser',      emoji:'🚫', label:'Protéger la vie privée',     bonus:'+4 satisfaction passagers'],
    ],
  },
];

export default function DailyPanel({ company, userId, onRefresh }) {
  const [today,    setToday]    = useState(null);
  const [choixFait,setChoixFait] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [resultat, setResultat] = useState(null);

  useEffect(() => {
    // Scénario du jour : index selon le jour de l'année
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000);
    setToday(SCENARIOS[dayOfYear % SCENARIOS.length]);
    // Vérifier si déjà joué aujourd'hui (localStorage)
    const key = `daily_${new Date().toDateString()}_${userId}`;
    const done = localStorage.getItem(key);
    if (done) setChoixFait(JSON.parse(done));
  }, [userId]);

  const handleChoix = async(choix) => {
    if (!userId||loading||choixFait) return;
    setLoading(true);
    try {
      const r = await api.dailyDecision(userId, choix.id);
      const key = `daily_${new Date().toDateString()}_${userId}`;
      localStorage.setItem(key, JSON.stringify(choix));
      setChoixFait(choix);
      setResultat(r);
      setTimeout(()=>onRefresh(), 1500);
    } catch(e) {
      // Si déjà fait côté serveur, marquer localement quand même
      const key = `daily_${new Date().toDateString()}_${userId}`;
      localStorage.setItem(key, JSON.stringify(choix));
      setChoixFait(choix);
    } finally { setLoading(false); }
  };

  if (!today) return null;

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div>
          <div style={S.title}>🎯 Décision du Jour</div>
          <div style={S.sub}>Se renouvelle chaque jour à minuit</div>
        </div>
        {choixFait && <div style={S.doneBadge}>✅ Fait</div>}
      </div>

      {/* Scénario */}
      <div style={S.scenario}>
        <div style={{fontSize:50,marginBottom:10}}>{today.emoji}</div>
        <div style={S.scenTitle}>{today.titre}</div>
        <div style={S.scenDesc}>{today.desc}</div>
      </div>

      {/* Résultat si déjà fait */}
      {choixFait && (
        <div style={S.result}>
          <div style={{fontSize:11,fontWeight:700,color:T.gold,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Votre choix d'aujourd'hui</div>
          <div style={{fontSize:15,fontWeight:700,color:T.dark,marginBottom:5}}>{choixFait.emoji} {choixFait.label}</div>
          <div style={{fontSize:13,color:T.green,fontWeight:600,marginBottom:8}}>🎁 {choixFait.bonus}</div>
          {resultat?.effets?.map((ef,i)=>(
            <div key={i} style={{fontSize:12,color:T.mid,padding:'3px 8px',background:'rgba(139,105,20,0.08)',borderRadius:6,marginTop:3}}>{ef}</div>
          ))}
          <div style={{marginTop:10,fontSize:11,color:T.mid,fontStyle:'italic',textAlign:'center'}}>⏰ Prochaine décision demain</div>
        </div>
      )}

      {/* Choix */}
      {!choixFait && (
        <div style={{padding:'14px'}}>
          <div style={{fontSize:13,fontWeight:700,color:T.dark,marginBottom:12,textAlign:'center'}}>Que décidez-vous ?</div>
          {today.choix.map(choix=>(
            <button key={choix.id} style={{...S.choixBtn,opacity:loading?0.6:1}} onClick={()=>handleChoix(choix)} disabled={loading}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:5}}>
                <span style={{fontSize:22}}>{choix.emoji}</span>
                <span style={{fontSize:14,fontWeight:700,color:T.dark}}>{choix.label}</span>
              </div>
              <div style={{fontSize:12,color:T.green,fontWeight:600,paddingLeft:32}}>🎁 {choix.bonus}</div>
            </button>
          ))}
        </div>
      )}

      {/* État compagnie */}
      {company && (
        <div style={{margin:'0 14px 14px',padding:'14px',background:T.parchment,borderRadius:12,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:T.gold,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>📊 État actuel</div>
          {[
            ['🪙 Capital',     fmt(company.capital)],
            ['😊 Satisfaction', `${company.satisfaction}/100`],
            ['🌟 Prestige',    `${company.prestige} pts`],
            ['🗺 Voyages',     company.voyagesTotal],
            ['👥 Passagers',   (company.passagersTotal||0).toLocaleString('fr-FR')],
          ].map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',marginTop:5,fontSize:11}}>
              <span style={{color:T.mid}}>{k}</span>
              <span style={{color:T.dark,fontWeight:700}}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  root     :{display:'flex',flexDirection:'column',height:'100%',overflowY:'auto',background:T.bg,fontFamily:T.ff},
  header   :{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:T.parchment,borderBottom:`2px solid ${T.border}`,flexShrink:0},
  title    :{fontSize:16,fontWeight:700,color:T.dark},
  sub      :{fontSize:10,color:T.mid,marginTop:2},
  doneBadge:{background:'rgba(39,174,96,0.15)',border:`1px solid ${T.green}`,borderRadius:20,padding:'5px 12px',fontSize:12,fontWeight:700,color:T.green},
  scenario :{margin:'14px 14px 0',padding:'20px',background:T.parchment,borderRadius:14,border:`2px solid ${T.border}`,textAlign:'center',boxShadow:T.shadowSm},
  scenTitle:{fontSize:18,fontWeight:700,color:T.dark,marginBottom:8},
  scenDesc :{fontSize:13,color:T.mid,lineHeight:1.6,fontStyle:'italic'},
  result   :{margin:'12px 14px 0',padding:'16px',background:T.parchment,borderRadius:14,border:`2px solid rgba(139,105,20,0.45)`,boxShadow:T.shadowSm},
  choixBtn :{width:'100%',display:'flex',flexDirection:'column',padding:'14px 16px',background:T.parchment,border:`2px solid ${T.border}`,borderRadius:12,cursor:'pointer',marginBottom:8,textAlign:'left',boxShadow:T.shadowSm,fontFamily:T.ff},
};
