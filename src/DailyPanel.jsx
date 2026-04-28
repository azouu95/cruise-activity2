import { useState, useEffect } from 'react';
import { api, fmt, T } from './api.js';

const DAILY_ACTIONS = [
  {
    id: 'optimisation',
    emoji: '⚡',
    titre: 'Optimisation Express',
    desc: 'Réorganisez les équipes pour maximiser l\'efficacité ce soir.',
    choix: [
      { id: 'occupation',   label: '📊 +8% occupation',       emoji: '📊', bonus: '+8% occupation ce soir' },
      { id: 'satisfaction', label: '😊 +6 satisfaction',      emoji: '😊', bonus: '+6 satisfaction passagers' },
      { id: 'couts',        label: '💸 −10% coûts',           emoji: '💸', bonus: '−10% coûts opérationnels' },
    ],
  },
  {
    id: 'investissement',
    emoji: '💼',
    titre: 'Investissement Stratégique',
    desc: 'Une opportunité se présente. Quel secteur développer ?',
    choix: [
      { id: 'marketing',    label: '📣 Marketing (+prestige)',  emoji: '📣', bonus: '+5 prestige' },
      { id: 'formation',    label: '👨‍✈️ Formation équipage',  emoji: '👨‍✈️', bonus: '+10 satisfaction durable' },
      { id: 'tech',         label: '🔧 Maintenance préventive', emoji: '🔧', bonus: 'Éviter pannes 7j' },
    ],
  },
  {
    id: 'partenariat',
    emoji: '🤝',
    titre: 'Proposition de Partenariat',
    desc: 'Un port propose un accord commercial exclusif.',
    choix: [
      { id: 'exclusif',     label: '⭐ Accès exclusif',        emoji: '⭐', bonus: '+15% revenus sur cette escale' },
      { id: 'standard',     label: '📋 Accord standard',       emoji: '📋', bonus: '+5% revenus tous ports' },
      { id: 'refus',        label: '🚫 Décliner',              emoji: '🚫', bonus: '+2 prestige (indépendance)' },
    ],
  },
  {
    id: 'crise',
    emoji: '⚠️',
    titre: 'Gestion de Crise',
    desc: 'Les réseaux sociaux s\'emballent sur un incident mineur à bord.',
    choix: [
      { id: 'transparence', label: '📢 Communication ouverte', emoji: '📢', bonus: '+8 satisfaction, +3 prestige' },
      { id: 'silencieux',   label: '🤫 Gérer discrètement',    emoji: '🤫', bonus: 'Pas d\'impact visible' },
      { id: 'compensation', label: '🎁 Compensation passagers', emoji: '🎁', bonus: '+15 satisfaction, −50K🪙' },
    ],
  },
];

export default function DailyPanel({ company, userId, onRefresh }) {
  const [choixFait,   setChoixFait]  = useState(null);
  const [loading,     setLoading]    = useState(false);
  const [resultat,    setResultat]   = useState(null);
  const [todayAction, setTodayAction] = useState(null);

  useEffect(() => {
    // Choisir l'action du jour selon le jour de la semaine
    const dayIdx = new Date().getDay();
    setTodayAction(DAILY_ACTIONS[dayIdx % DAILY_ACTIONS.length]);
    // Vérifier si déjà fait aujourd'hui
    const lastKey = `daily_${new Date().toDateString()}_${userId}`;
    const done = localStorage.getItem(lastKey);
    if (done) setChoixFait(done);
  }, [userId]);

  const handleChoix = async (choixId) => {
    if (!userId || loading || choixFait) return;
    setLoading(true);
    try {
      const r = await api.dailyDecision(userId, choixId);
      const lastKey = `daily_${new Date().toDateString()}_${userId}`;
      localStorage.setItem(lastKey, choixId);
      setChoixFait(choixId);
      setResultat(r);
      setTimeout(() => onRefresh(), 1500);
    } catch(e) {
      // Si déjà fait côté serveur, marquer localement
      if (e.message?.includes('deja')) {
        const lastKey = `daily_${new Date().toDateString()}_${userId}`;
        localStorage.setItem(lastKey, choixId);
        setChoixFait(choixId);
      }
    } finally { setLoading(false); }
  };

  const deja = !!choixFait;
  const choixActuel = todayAction?.choix.find(c => c.id === choixFait);

  if (!todayAction) return null;

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>🎯 Décision du Jour</div>
          <div style={S.sub}>Se renouvelle chaque jour à minuit</div>
        </div>
        {deja && <div style={S.doneBadge}>✅ Fait</div>}
      </div>

      {/* Scénario */}
      <div style={S.scenario}>
        <div style={S.scenarioEmoji}>{todayAction.emoji}</div>
        <div style={S.scenarioTitle}>{todayAction.titre}</div>
        <div style={S.scenarioDesc}>{todayAction.desc}</div>
      </div>

      {/* Résultat si déjà fait */}
      {deja && choixActuel && (
        <div style={S.result}>
          <div style={S.resultTitle}>✅ Votre choix d'aujourd'hui</div>
          <div style={S.resultChoix}>{choixActuel.emoji} {choixActuel.label}</div>
          <div style={S.resultBonus}>🎁 {choixActuel.bonus}</div>
          {resultat?.effets && (
            <div style={S.resultEffets}>
              {resultat.effets.map((e, i) => (
                <div key={i} style={S.effet}>{e}</div>
              ))}
            </div>
          )}
          <div style={S.resultNext}>⏰ Prochaine décision demain</div>
        </div>
      )}

      {/* Choix */}
      {!deja && (
        <div style={S.choices}>
          <div style={S.choicesTitle}>Que décidez-vous ?</div>
          {todayAction.choix.map(choix => (
            <button
              key={choix.id}
              style={{ ...S.choixBtn, opacity: loading ? 0.6 : 1 }}
              onClick={() => handleChoix(choix.id)}
              disabled={loading}
            >
              <div style={S.choixTop}>
                <span style={S.choixEmoji}>{choix.emoji}</span>
                <span style={S.choixLabel}>{choix.label}</span>
              </div>
              <div style={S.choixBonus}>🎁 {choix.bonus}</div>
            </button>
          ))}
        </div>
      )}

      {/* Stats compagnie */}
      {company && (
        <div style={S.statsSection}>
          <div style={S.statsTitle}>📊 État actuel</div>
          {[
            ['🪙 Capital',     fmt(company.capital)],
            ['😊 Satisfaction', `${company.satisfaction}/100`],
            ['🌟 Prestige',    `${company.prestige} pts`],
            ['🗺 Voyages',     company.voyagesTotal],
          ].map(([k,v]) => (
            <div key={k} style={S.statRow}>
              <span style={{ color: T.mid, fontSize: 12 }}>{k}</span>
              <span style={{ color: T.dark, fontSize: 12, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  root          : { display:'flex', flexDirection:'column', height:'100%', overflowY:'auto', background:T.bg, fontFamily:T.ff },
  header        : { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:T.parchment, borderBottom:`2px solid ${T.border}`, flexShrink:0 },
  title         : { fontSize:16, fontWeight:700, color:T.dark },
  sub           : { fontSize:10, color:T.mid, marginTop:2 },
  doneBadge     : { background:'rgba(39,174,96,0.15)', border:`1px solid ${T.green}`, borderRadius:20, padding:'5px 12px', fontSize:12, fontWeight:700, color:T.green },
  scenario      : { margin:'14px 14px 0', padding:'18px', background:T.parchment, borderRadius:14, border:`2px solid ${T.border}`, textAlign:'center', boxShadow:T.shadowSm },
  scenarioEmoji : { fontSize:48, marginBottom:8 },
  scenarioTitle : { fontSize:18, fontWeight:700, color:T.dark, marginBottom:8 },
  scenarioDesc  : { fontSize:13, color:T.mid, lineHeight:1.6, fontStyle:'italic' },
  result        : { margin:'14px', padding:'16px', background:'rgba(255,248,220,0.98)', borderRadius:14, border:`2px solid rgba(139,105,20,0.5)`, boxShadow:T.shadowSm },
  resultTitle   : { fontSize:11, fontWeight:700, color:T.gold, textTransform:'uppercase', letterSpacing:1, marginBottom:8 },
  resultChoix   : { fontSize:15, fontWeight:700, color:T.dark, marginBottom:6 },
  resultBonus   : { fontSize:13, color:T.green, fontWeight:600, marginBottom:8 },
  resultEffets  : { display:'flex', flexDirection:'column', gap:4, marginBottom:8 },
  effet         : { fontSize:12, color:T.mid, padding:'4px 8px', background:'rgba(139,105,20,0.08)', borderRadius:6 },
  resultNext    : { fontSize:11, color:T.mid, fontStyle:'italic', textAlign:'center' },
  choices       : { padding:'14px' },
  choicesTitle  : { fontSize:13, fontWeight:700, color:T.dark, marginBottom:10, textAlign:'center' },
  choixBtn      : { width:'100%', display:'flex', flexDirection:'column', padding:'14px 16px', background:T.parchment, border:`2px solid ${T.border}`, borderRadius:12, cursor:'pointer', marginBottom:8, textAlign:'left', transition:'all 0.2s', fontFamily:T.ff, boxShadow:T.shadowSm },
  choixTop      : { display:'flex', alignItems:'center', gap:10, marginBottom:5 },
  choixEmoji    : { fontSize:22 },
  choixLabel    : { fontSize:14, fontWeight:700, color:T.dark },
  choixBonus    : { fontSize:12, color:T.green, fontWeight:600, paddingLeft:32 },
  statsSection  : { margin:'0 14px 14px', padding:'14px', background:T.parchment, borderRadius:12, border:`1px solid ${T.border}` },
  statsTitle    : { fontSize:11, fontWeight:700, color:T.gold, textTransform:'uppercase', letterSpacing:1, marginBottom:8 },
  statRow       : { display:'flex', justifyContent:'space-between', marginTop:6 },
};
