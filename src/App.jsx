import { useState, useEffect, useCallback } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import GameMap from './GameMap.jsx';
import FleetPanel from './FleetPanel.jsx';
import Leaderboard from './Leaderboard.jsx';

// ── Config ────────────────────────────────────────────────────────────────────
// Remplace par ton Application ID Discord
const CLIENT_ID   = import.meta.env.VITE_DISCORD_CLIENT_ID || 'TON_APP_ID_ICI';
// URL de ton API bot (ton IP Katabump + port)
const API_URL     = import.meta.env.VITE_API_URL || 'http://51.83.6.68:20106';

const discordSdk = new DiscordSDK(CLIENT_ID);

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'map',         label: '🗺 Carte',       emoji: '🗺' },
  { id: 'fleet',       label: '⛴ Ma Flotte',    emoji: '⛴' },
  { id: 'leaderboard', label: '🏆 Classement',  emoji: '🏆' },
];

export default function App() {
  const [ready,       setReady]       = useState(false);
  const [auth,        setAuth]        = useState(null);
  const [gameData,    setGameData]    = useState(null);
  const [myCompany,   setMyCompany]   = useState(null);
  const [activeTab,   setActiveTab]   = useState('map');
  const [error,       setError]       = useState(null);
  const [loading,     setLoading]     = useState(true);

  // ── Initialisation Discord SDK ─────────────────────────────────────────────
  useEffect(() => {
    async function initDiscord() {
      try {
        await discordSdk.ready();

        // OAuth2 — obtenir le token
        const { code } = await discordSdk.commands.authorize({
          client_id   : CLIENT_ID,
          response_type: 'code',
          state       : '',
          prompt      : 'none',
          scope       : ['identify', 'guilds'],
        });

        // Échanger le code contre un token via notre API
        const tokenRes = await fetch(`${API_URL}/activity/token`, {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({ code }),
        });

        if (!tokenRes.ok) throw new Error('Token exchange failed');
        const { access_token } = await tokenRes.json();

        // Authentifier auprès du SDK
        const authResult = await discordSdk.commands.authenticate({ access_token });
        setAuth(authResult);
        setReady(true);

        // Charger les données du jeu
        await loadGameData(authResult.user.id);

      } catch (e) {
        console.error('Discord init error:', e);
        // En mode démo (hors Discord), simuler un utilisateur
        setAuth({ user: { id: 'demo', username: 'DemoPlayer', global_name: 'Joueur Demo' } });
        setReady(true);
        await loadGameData('demo');
      }
    }

    initDiscord();
  }, []);

  // ── Chargement données jeu ─────────────────────────────────────────────────
  const loadGameData = useCallback(async (userId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/activity/gamestate`);
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setGameData(data);

      // Trouver la compagnie du joueur
      const company = data.companies?.[userId];
      setMyCompany(company || null);
    } catch (e) {
      setError('Impossible de joindre le bot. Vérifiez qu\'il est en ligne.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh toutes les 30 secondes
  useEffect(() => {
    if (!ready || !auth) return;
    const interval = setInterval(() => loadGameData(auth.user.id), 30_000);
    return () => clearInterval(interval);
  }, [ready, auth, loadGameData]);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  if (!ready || loading) {
    return (
      <div style={styles.splash}>
        <div style={styles.splashContent}>
          <div style={styles.spinner} />
          <div style={styles.splashTitle}>⚓ Armateur de Croisière</div>
          <div style={styles.splashSub}>Connexion aux mers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.splash}>
        <div style={styles.splashContent}>
          <div style={{ fontSize: 48 }}>🌊</div>
          <div style={styles.splashTitle}>Connexion perdue</div>
          <div style={styles.splashSub}>{error}</div>
          <button style={styles.retryBtn} onClick={() => { setError(null); loadGameData(auth?.user?.id); }}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>⚓</span>
        <span style={styles.title}>Armateur de Croisière</span>
        {auth?.user && (
          <span style={styles.userBadge}>
            {myCompany ? `${myCompany.logo} ${myCompany.nom}` : `👤 ${auth.user.global_name || auth.user.username}`}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div style={styles.content}>
        {activeTab === 'map'         && <GameMap      gameData={gameData} myCompany={myCompany} />}
        {activeTab === 'fleet'       && <FleetPanel   company={myCompany} gameData={gameData} apiUrl={API_URL} userId={auth?.user?.id} />}
        {activeTab === 'leaderboard' && <Leaderboard  gameData={gameData} myCompany={myCompany} />}
      </div>

      {/* Tabs du bas */}
      <div style={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ fontSize: 20 }}>{tab.emoji}</span>
            <span style={{ fontSize: 11, marginTop: 2 }}>{tab.label.split(' ').slice(1).join(' ')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  root: {
    width: '100vw', height: '100vh',
    display: 'flex', flexDirection: 'column',
    background: 'linear-gradient(180deg, #0a1628 0%, #0d2040 100%)',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', background: 'rgba(0,0,0,0.4)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    height: 50, flexShrink: 0,
  },
  logo: { fontSize: 22 },
  title: { fontWeight: 700, fontSize: 15, flex: 1, color: '#fff' },
  userBadge: {
    background: 'rgba(255,255,255,0.1)', borderRadius: 20,
    padding: '3px 10px', fontSize: 12, color: '#ccc',
  },
  content: { flex: 1, overflow: 'hidden', position: 'relative' },
  tabBar: {
    display: 'flex', background: 'rgba(0,0,0,0.5)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    height: 60, flexShrink: 0,
  },
  tab: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer', transition: 'all 0.2s', gap: 2,
  },
  tabActive: { color: '#5b9cf6', borderTop: '2px solid #5b9cf6' },
  splash: {
    width: '100vw', height: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(180deg, #0a1628 0%, #0d2040 100%)',
  },
  splashContent: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
  },
  splashTitle: { fontSize: 22, fontWeight: 700, color: '#fff' },
  splashSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  retryBtn: {
    marginTop: 8, padding: '10px 24px', borderRadius: 8,
    background: '#5b9cf6', border: 'none', color: '#fff',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#5b9cf6',
    animation: 'spin 0.8s linear infinite',
  },
};

// Keyframe spin
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
