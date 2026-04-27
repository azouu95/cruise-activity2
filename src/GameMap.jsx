import { useEffect, useRef, useState, useCallback } from 'react';

// ── Coordonnées des ports sur la carte (en % de la zone de dessin) ────────────
const PORT_COORDS = {
  // Méditerranée Ouest
  barcelone      : { x: 0.27, y: 0.34, label: 'Barcelone',   emoji: '🇪🇸' },
  genes          : { x: 0.36, y: 0.29, label: 'Gênes',        emoji: '🇮🇹' },
  civitavecchia  : { x: 0.41, y: 0.36, label: 'Rome',         emoji: '🇮🇹' },
  naples         : { x: 0.44, y: 0.40, label: 'Naples',       emoji: '🇮🇹' },
  palma_majorque : { x: 0.29, y: 0.37, label: 'Majorque',     emoji: '🇪🇸' },
  // Méditerranée Est
  la_valette     : { x: 0.50, y: 0.45, label: 'Malte',        emoji: '🇲🇹' },
  athenes_piree  : { x: 0.57, y: 0.42, label: 'Athènes',      emoji: '🇬🇷' },
  santorin       : { x: 0.60, y: 0.44, label: 'Santorin',     emoji: '🇬🇷' },
  istanbul       : { x: 0.65, y: 0.36, label: 'Istanbul',     emoji: '🇹🇷' },
  // Adriatique
  venise         : { x: 0.43, y: 0.28, label: 'Venise',       emoji: '🇮🇹' },
  split          : { x: 0.48, y: 0.31, label: 'Split',        emoji: '🇭🇷' },
  dubrovnik      : { x: 0.49, y: 0.36, label: 'Dubrovnik',    emoji: '🇭🇷' },
  kotor          : { x: 0.50, y: 0.38, label: 'Kotor',        emoji: '🇲🇪' },
  corfou         : { x: 0.53, y: 0.41, label: 'Corfou',       emoji: '🇬🇷' },
  // Atlantique
  lisbonne       : { x: 0.15, y: 0.33, label: 'Lisbonne',     emoji: '🇵🇹' },
  funchal        : { x: 0.10, y: 0.42, label: 'Madère',       emoji: '🇵🇹' },
  tenerife       : { x: 0.08, y: 0.51, label: 'Tenerife',     emoji: '🇪🇸' },
  casablanca     : { x: 0.19, y: 0.46, label: 'Casablanca',   emoji: '🇲🇦' },
  // Caraïbes
  miami          : { x: 0.22, y: 0.50, label: 'Miami',        emoji: '🇺🇸' },
  nassau         : { x: 0.25, y: 0.53, label: 'Nassau',       emoji: '🇧🇸' },
  cozumel        : { x: 0.18, y: 0.58, label: 'Cozumel',      emoji: '🇲🇽' },
  // Afrique
  le_cap         : { x: 0.45, y: 0.80, label: 'Cap',          emoji: '🇿🇦' },
  // Asie
  dubai          : { x: 0.73, y: 0.55, label: 'Dubaï',        emoji: '🇦🇪' },
  singapour      : { x: 0.83, y: 0.65, label: 'Singapour',    emoji: '🇸🇬' },
  hong_kong      : { x: 0.88, y: 0.52, label: 'HK',           emoji: '🇭🇰' },
  // NILE (fluvial)
  ocho_rios      : { x: 0.27, y: 0.57, label: 'Jamaica',      emoji: '🇯🇲' },
  saint_martin   : { x: 0.30, y: 0.56, label: 'St-Martin',    emoji: '🇸🇽' },
  pointe_pitre   : { x: 0.31, y: 0.58, label: 'Guadeloupe',   emoji: '🇬🇵' },
};

// Couleurs par région
const REGION_COLORS = {
  'Méditerranée': '#1a9fff',
  'Adriatique'  : '#0d8fd6',
  'Caraïbes'    : '#00c896',
  'Atlantique'  : '#2d5fa8',
  'Asie'        : '#ff7c3d',
  'Afrique'     : '#d4a017',
};

// ── Composant Canvas ──────────────────────────────────────────────────────────
export default function GameMap({ gameData, myCompany }) {
  const canvasRef    = useRef(null);
  const animRef      = useRef(null);
  const shipsRef     = useRef([]); // positions animées des navires
  const hoveredRef   = useRef(null);
  const [tooltip,    setTooltip]    = useState(null);
  const [selectedShip, setSelectedShip] = useState(null);

  // ── Construire la liste des navires depuis gameData ───────────────────────
  const buildShips = useCallback(() => {
    if (!gameData?.companies) return;
    const ships = [];

    for (const company of Object.values(gameData.companies)) {
      for (const navire of (company.flotte || [])) {
        if (!navire.routeActive) continue;

        const route   = gameData.routes?.find(r => r.id === navire.routeActive);
        const ports   = route ? [route.hub_depart, ...route.escales, route.hub_arrivee] : [];
        const isMe    = myCompany?.ownerId === company.ownerId;

        // Position interpolée
        const now       = Date.now();
        const start     = navire.routeAssignedAt || now;
        const totalMs   = (route?.duree || 7) * 24 * 60 * 60 * 1000;
        const elapsed   = (now - start) % totalMs;
        const globalRatio = elapsed / totalMs;
        const segCount  = ports.length - 1 || 1;
        const segIdx    = Math.min(Math.floor(globalRatio * segCount), segCount - 1);
        const segRatio  = (globalRatio * segCount) - segIdx;

        const portA = PORT_COORDS[ports[segIdx]];
        const portB = PORT_COORDS[ports[segIdx + 1]];

        if (!portA) continue;

        const x = portA.x + (portB ? (portB.x - portA.x) * segRatio : 0);
        const y = portA.y + (portB ? (portB.y - portA.y) * segRatio : 0);

        ships.push({
          uid        : navire.uid,
          nom        : navire.nom,
          flag       : navire.flag || '',
          logo       : company.logo,
          compNom    : company.nom,
          emoji      : navire.emoji || '🚢',
          isMe,
          x, y,
          targetX    : x, targetY: y,
          displayX   : x, displayY: y,
          route      : route?.label || '',
          portActuel : PORT_COORDS[ports[segIdx]]?.label || '',
          portProchain: portB ? (PORT_COORDS[ports[segIdx + 1]]?.label || '') : 'Arrivée',
          revenu     : navire.revenusGeneres || 0,
          voyages    : navire.voyages || 0,
          satisfaction: navire.satisfactionMoyenne || 70,
          color      : REGION_COLORS[route?.region] || '#5b9cf6',
          pulse      : 0,
        });
      }
    }

    shipsRef.current = ships;
  }, [gameData, myCompany]);

  useEffect(() => { buildShips(); }, [buildShips]);

  // ── Dessin Canvas ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // ── Fond océan dégradé
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#061428');
      bg.addColorStop(1, '#0a2040');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── Grille légère
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // ── Zones de mer colorées (très subtiles)
      const zones = [
        { name: 'MED', x:0.20, y:0.25, w:0.55, h:0.28, color:'rgba(26,159,255,0.04)' },
        { name: 'ATL', x:0.00, y:0.20, w:0.22, h:0.50, color:'rgba(45,95,168,0.05)' },
        { name: 'CAR', x:0.14, y:0.47, w:0.22, h:0.22, color:'rgba(0,200,150,0.05)' },
      ];
      zones.forEach(z => {
        ctx.fillStyle = z.color;
        ctx.beginPath();
        ctx.roundRect(z.x*W, z.y*H, z.w*W, z.h*H, 12);
        ctx.fill();
      });

      // ── Routes (lignes entre ports)
      if (gameData?.companies) {
        const drawnRoutes = new Set();
        for (const company of Object.values(gameData.companies)) {
          for (const navire of (company.flotte || [])) {
            if (!navire.routeActive || drawnRoutes.has(navire.routeActive)) continue;
            drawnRoutes.add(navire.routeActive);
            const route = gameData.routes?.find(r => r.id === navire.routeActive);
            if (!route) continue;
            const ports = [route.hub_depart, ...route.escales, route.hub_arrivee];
            const color = REGION_COLORS[route.region] || '#5b9cf6';
            ctx.setLineDash([5, 8]);
            ctx.strokeStyle = color + '40';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            let first = true;
            for (const pid of ports) {
              const p = PORT_COORDS[pid];
              if (!p) continue;
              if (first) { ctx.moveTo(p.x*W, p.y*H); first = false; }
              else ctx.lineTo(p.x*W, p.y*H);
            }
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      // ── Ports
      for (const [id, port] of Object.entries(PORT_COORDS)) {
        const px = port.x * W;
        const py = port.y * H;

        // Halo
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fill();

        // Point
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();

        // Nom du port (hover ou ports principaux)
        if (id === hoveredRef.current || ['barcelone','genes','athenes_piree','venise','miami','dubai'].includes(id)) {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.font = '10px Segoe UI';
          ctx.textAlign = 'center';
          ctx.fillText(port.label, px, py - 8);
        }
      }

      // ── Navires
      for (const ship of shipsRef.current) {
        // Animation douce vers position
        ship.displayX += (ship.x - ship.displayX) * 0.05;
        ship.displayY += (ship.y - ship.displayY) * 0.05;
        ship.pulse = (ship.pulse + 0.05) % (Math.PI * 2);

        const sx = ship.displayX * W;
        const sy = ship.displayY * H;
        const isHovered  = hoveredRef.current === ship.uid;
        const isSelected = selectedShip?.uid === ship.uid;
        const size = ship.isMe ? 14 : 11;

        // Halo pulsant (mes navires)
        if (ship.isMe) {
          const pulse = Math.sin(ship.pulse) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(sx, sy, size + 6 + pulse * 4, 0, Math.PI*2);
          ctx.fillStyle = `rgba(91,156,246,${0.15 + pulse * 0.15})`;
          ctx.fill();
        }

        // Sélectionné
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(sx, sy, size + 4, 0, Math.PI*2);
          ctx.fillStyle = ship.isMe ? 'rgba(91,156,246,0.4)' : 'rgba(255,255,255,0.2)';
          ctx.fill();
        }

        // Fond navire
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI*2);
        ctx.fillStyle = ship.isMe ? '#1a4fa8' : '#1a2e50';
        ctx.fill();
        ctx.strokeStyle = ship.isMe ? '#5b9cf6' : ship.color;
        ctx.lineWidth = ship.isMe ? 2 : 1.5;
        ctx.stroke();

        // Emoji navire
        ctx.font = `${size - 2}px Segoe UI Emoji`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ship.flag || '🚢', sx, sy);

        // Badge compagnie au-dessus
        ctx.fillStyle = ship.isMe ? '#5b9cf6' : 'rgba(255,255,255,0.7)';
        ctx.font = `bold ${ship.isMe ? 11 : 9}px Segoe UI`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(ship.logo, sx, sy - size - 3);

        // Nom du navire si sélectionné ou mien
        if (isSelected || (ship.isMe && isHovered)) {
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.font = '10px Segoe UI';
          ctx.fillText(ship.nom.slice(0,15), sx, sy + size + 12);
        }
      }

      // ── Légende
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Segoe UI';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('⚓ Armateur de Croisière — Positions en temps réel', 10, H - 10);

      frame++;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [gameData]);

  // ── Interactions souris ───────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / canvas.width;
    const my = (e.clientY - rect.top) / canvas.height;

    let found = null;
    for (const ship of shipsRef.current) {
      const dx = Math.abs(ship.displayX - mx);
      const dy = Math.abs(ship.displayY - my);
      if (dx < 0.025 && dy < 0.025) { found = ship; break; }
    }

    if (found) {
      hoveredRef.current = found.uid;
      setTooltip({ ship: found, x: e.clientX, y: e.clientY });
      canvas.style.cursor = 'pointer';
    } else {
      hoveredRef.current = null;
      setTooltip(null);
      canvas.style.cursor = 'default';
    }
  }, []);

  const handleClick = useCallback((e) => {
    if (tooltip?.ship) {
      setSelectedShip(prev => prev?.uid === tooltip.ship.uid ? null : tooltip.ship);
    } else {
      setSelectedShip(null);
    }
  }, [tooltip]);

  // ── Compteurs
  const totalNavires = shipsRef.current.length;
  const mesNavires   = shipsRef.current.filter(s => s.isMe).length;

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width:'100%', height:'100%', display:'block' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />

      {/* Compteur en haut à gauche */}
      <div style={ui.counter}>
        ⛴ {totalNavires} navire{totalNavires > 1 ? 's' : ''} en mer
        {mesNavires > 0 && <span style={{ color:'#5b9cf6' }}> · {mesNavires} à moi</span>}
      </div>

      {/* Tooltip navire */}
      {tooltip && (
        <div style={{
          ...ui.tooltip,
          left: Math.min(tooltip.x + 12, window.innerWidth - 200),
          top : Math.max(tooltip.y - 80, 10),
        }}>
          <div style={ui.ttTitle}>{tooltip.ship.logo} {tooltip.ship.compNom}</div>
          <div style={ui.ttSub}>{tooltip.ship.flag}{tooltip.ship.nom}</div>
          <div style={ui.ttRow}>📍 {tooltip.ship.portActuel}</div>
          <div style={ui.ttRow}>➡ {tooltip.ship.portProchain}</div>
          <div style={ui.ttRow}>✈️ {tooltip.ship.voyages} voyages</div>
          <div style={ui.ttRow}>😊 {Math.round(tooltip.ship.satisfaction)}/100</div>
        </div>
      )}

      {/* Panneau navire sélectionné */}
      {selectedShip && (
        <div style={ui.shipPanel}>
          <div style={ui.spHeader}>
            {selectedShip.logo} {selectedShip.compNom}
            <button style={ui.spClose} onClick={() => setSelectedShip(null)}>✕</button>
          </div>
          <div style={ui.spTitle}>{selectedShip.flag}{selectedShip.nom}</div>
          <div style={ui.spRow}><span>🗺 Route</span><span>{selectedShip.route.slice(0,25)}</span></div>
          <div style={ui.spRow}><span>📍 Position</span><span>{selectedShip.portActuel}</span></div>
          <div style={ui.spRow}><span>➡ Prochain</span><span>{selectedShip.portProchain}</span></div>
          <div style={ui.spRow}><span>✈️ Voyages</span><span>{selectedShip.voyages}</span></div>
          <div style={ui.spRow}><span>😊 Satisfaction</span><span>{Math.round(selectedShip.satisfaction)}/100</span></div>
          <div style={ui.spRow}><span>🪙 Revenus</span><span>{(selectedShip.revenu/1e6).toFixed(2)}M</span></div>
          {selectedShip.isMe && <div style={ui.spMine}>⭐ Votre navire</div>}
        </div>
      )}

      {/* Légende des régions */}
      <div style={ui.legend}>
        {Object.entries(REGION_COLORS).slice(0,4).map(([r,c]) => (
          <div key={r} style={ui.legendItem}>
            <div style={{ ...ui.legendDot, background: c }} />
            <span>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ui = {
  counter: {
    position:'absolute', top:10, left:10,
    background:'rgba(0,0,0,0.6)', borderRadius:8,
    padding:'6px 12px', fontSize:12, color:'rgba(255,255,255,0.8)',
    backdropFilter:'blur(4px)',
  },
  tooltip: {
    position:'fixed', zIndex:100,
    background:'rgba(10,20,40,0.95)', border:'1px solid rgba(91,156,246,0.4)',
    borderRadius:10, padding:'10px 14px', minWidth:160,
    backdropFilter:'blur(8px)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)',
  },
  ttTitle: { fontWeight:700, fontSize:13, color:'#fff', marginBottom:4 },
  ttSub: { fontSize:12, color:'#5b9cf6', marginBottom:6 },
  ttRow: { fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:2 },
  shipPanel: {
    position:'absolute', bottom:10, right:10, width:220,
    background:'rgba(10,20,40,0.95)', border:'1px solid rgba(91,156,246,0.4)',
    borderRadius:12, padding:'14px 16px',
    backdropFilter:'blur(8px)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)',
  },
  spHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 },
  spClose: { background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:16 },
  spTitle: { fontSize:15, color:'#5b9cf6', fontWeight:600, marginBottom:10 },
  spRow: { display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:5 },
  spMine: { marginTop:10, textAlign:'center', fontSize:12, color:'#5b9cf6', fontWeight:600 },
  legend: {
    position:'absolute', bottom:10, left:10,
    display:'flex', flexDirection:'column', gap:4,
    background:'rgba(0,0,0,0.5)', borderRadius:8, padding:'8px 10px',
  },
  legendItem: { display:'flex', alignItems:'center', gap:6, fontSize:10, color:'rgba(255,255,255,0.6)' },
  legendDot: { width:8, height:8, borderRadius:'50%' },
};
