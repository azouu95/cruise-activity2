import { useEffect, useRef, useState, useCallback } from 'react';

// ── Ports (lat/lon réels) ─────────────────────────────────────────────────────
const PORTS = {
  barcelone     : { lat: 41.38, lon:  2.18, label: 'Barcelone',  major: true  },
  genes         : { lat: 44.40, lon:  8.93, label: 'Gênes',       major: true  },
  civitavecchia : { lat: 42.09, lon: 11.79, label: 'Rome',        major: true  },
  naples        : { lat: 40.84, lon: 14.25, label: 'Naples',      major: false },
  la_valette    : { lat: 35.90, lon: 14.51, label: 'Malte',       major: false },
  athenes_piree : { lat: 37.94, lon: 23.64, label: 'Athènes',    major: true  },
  santorin      : { lat: 36.39, lon: 25.46, label: 'Santorin',   major: false },
  istanbul      : { lat: 41.01, lon: 28.98, label: 'Istanbul',   major: true  },
  venise        : { lat: 45.44, lon: 12.33, label: 'Venise',     major: true  },
  dubrovnik     : { lat: 42.65, lon: 18.09, label: 'Dubrovnik',  major: false },
  kotor         : { lat: 42.42, lon: 18.77, label: 'Kotor',      major: false },
  lisbonne      : { lat: 38.71, lon: -9.14, label: 'Lisbonne',   major: true  },
  funchal       : { lat: 32.65, lon:-16.91, label: 'Madère',     major: false },
  tenerife      : { lat: 28.47, lon:-16.25, label: 'Tenerife',   major: false },
  casablanca    : { lat: 33.60, lon: -7.62, label: 'Casablanca', major: false },
  miami         : { lat: 25.77, lon:-80.19, label: 'Miami',      major: true  },
  nassau        : { lat: 25.05, lon:-77.35, label: 'Nassau',     major: false },
  cozumel       : { lat: 20.51, lon:-86.96, label: 'Cozumel',    major: false },
  ocho_rios     : { lat: 18.41, lon:-77.10, label: 'Jamaïque',   major: false },
  le_cap        : { lat:-33.93, lon: 18.42, label: 'Le Cap',     major: false },
  dubai         : { lat: 25.20, lon: 55.27, label: 'Dubaï',      major: true  },
  singapour     : { lat:  1.29, lon:103.85, label: 'Singapour',  major: true  },
  hong_kong     : { lat: 22.32, lon:114.18, label: 'Hong Kong',  major: false },
};

const ROUTES = [
  { id:'atl', ports:['lisbonne','tenerife','miami'],            color:'#9333ea', label:'Atlantique'   },
  { id:'med', ports:['barcelone','civitavecchia','la_valette','athenes_piree'], color:'#d97706', label:'Méditerranée' },
  { id:'adr', ports:['venise','dubrovnik','kotor','athenes_piree'],             color:'#2563eb', label:'Adriatique'   },
  { id:'ege', ports:['athenes_piree','santorin','istanbul'],   color:'#16a34a', label:'Égée'         },
  { id:'asie',ports:['dubai','singapour','hong_kong'],          color:'#dc2626', label:'Asie'         },
  { id:'car', ports:['miami','nassau','cozumel','ocho_rios'],   color:'#0891b2', label:'Caraïbes'     },
];

const DEMO_SHIPS = [
  { uid:'s1', nom:'La Belle Époque', flag:'🇫🇷', logo:'🌊', compNom:'Blue Ocean', isMe:true,  lat:43.5, lon:6.0,  route:'Méditerranée', next:'Rome',      voyages:12, sat:84 },
  { uid:'s2', nom:'Adriatica',       flag:'🇮🇹', logo:'🔴', compNom:'Red Sea',   isMe:false, lat:43.8, lon:15.5, route:'Adriatique',   next:'Dubrovnik', voyages:8,  sat:78 },
  { uid:'s3', nom:'Costa Brava',     flag:'🇪🇸', logo:'🟡', compNom:'Gold Lines',isMe:false, lat:37.2, lon:24.5, route:'Égée',          next:'Santorin',  voyages:5,  sat:91 },
  { uid:'s4', nom:'Dubai Star',      flag:'🇦🇪', logo:'⭐', compNom:'Orient',    isMe:false, lat:12.5, lon:78.0, route:'Asie',          next:'Singapour', voyages:3,  sat:88 },
];

// ── SVG navire illustré ───────────────────────────────────────────────────────
function makeShipSVG(isMe, frame, pulseOffset) {
  const pulse = Math.sin((frame || 0) * 0.045 + (pulseOffset || 0));
  const waveFlag = pulse * 2.5;
  const smoke = [0, 1, 2].map(i => ({
    cx: 16 - i * 1.5,
    cy: -11 - i * 5 + pulse * 1.5,
    r: 3 + i * 2,
    a: 0.45 - i * 0.12,
  }));

  const primary   = isMe ? '#c0392b' : '#8e44ad';
  const dark      = isMe ? '#7b241c' : '#6c3483';
  const secondary = isMe ? '#e74c3c' : '#9b59b6';
  const chimney   = isMe ? '#c0392b' : '#7d3c98';
  const flagCol   = isMe ? '#f39c12' : '#e74c3c';
  const bubble    = isMe ? 'rgba(253,230,100,0.97)' : 'rgba(255,255,255,0.95)';
  const bubStroke = isMe ? '#d97706' : 'rgba(0,0,0,0.2)';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="80" viewBox="-32 -55 64 80">
    <!-- Sillage -->
    <circle r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
    <circle r="28" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
    <!-- Aura mon navire -->
    ${isMe ? `<circle r="${22 + pulse * 4}" fill="rgba(255,215,0,${0.18 + pulse * 0.1})"/>` : ''}
    <!-- Corps navire -->
    <path d="M-16 8 L16 8 L13 17 L-13 17 Z" fill="${primary}" stroke="${dark}" stroke-width="1.3"/>
    <path d="-14 12 L14 12" stroke="rgba(255,255,255,0.35)" stroke-width="0.8"/>
    <rect x="-13" y="0" width="26" height="9" rx="2" fill="#ecf0f1" stroke="#bdc3c7" stroke-width="0.9"/>
    ${[-8,-3,2,7].map(x => `<rect x="${x}" y="2" width="3" height="5" rx="0.5" fill="#aed6f1" stroke="#85c1e9" stroke-width="0.5"/>`).join('')}
    <rect x="-8" y="-9" width="16" height="10" rx="2.5" fill="${secondary}" stroke="${chimney}" stroke-width="0.9"/>
    ${[12,19].map(x => `<circle cx="${x - 24}" cy="-5" r="1.8" fill="#3498db" stroke="#2980b9" stroke-width="0.5"/>`).join('')}
    <rect x="-3" y="-18" width="6" height="10" rx="1" fill="${chimney}" stroke="rgba(0,0,0,0.2)" stroke-width="0.7"/>
    <rect x="-3" y="-15" width="6" height="2" fill="rgba(255,255,255,0.28)"/>
    ${smoke.map(s => `<circle cx="${s.cx - 16}" cy="${s.cy}" r="${s.r}" fill="rgba(200,200,200,${s.a})"/>`).join('')}
    <line x1="0" y1="-9" x2="0" y2="-30" stroke="#95a5a6" stroke-width="1.2"/>
    <line x1="-11" y1="0" x2="0" y2="-28" stroke="rgba(150,130,100,0.5)" stroke-width="0.6"/>
    <line x1="11" y1="0" x2="0" y2="-28" stroke="rgba(150,130,100,0.5)" stroke-width="0.6"/>
    <path d="M0 -30 L${9 + waveFlag} -25 L0 -20 Z" fill="${flagCol}"/>
    <!-- Bulle logo -->
    <rect x="-12" y="-46" width="24" height="14" rx="4" fill="${bubble}" stroke="${bubStroke}" stroke-width="1.2"/>
    <path d="M-4 -32 L4 -32 L0 -27 Z" fill="${bubble}"/>
  </svg>`;
}

// ── Composant Leaflet ─────────────────────────────────────────────────────────
export default function GameMap({ gameData, myCompany }) {
  const mapDivRef  = useRef(null);
  const leafletRef = useRef(null);   // instance Leaflet map
  const markersRef = useRef({});     // uid → Leaflet marker
  const routeLayersRef = useRef([]); // Leaflet polylines
  const portLayersRef  = useRef([]); // port markers
  const frameRef   = useRef(0);
  const animRef    = useRef(null);
  const shipsRef   = useRef(DEMO_SHIPS.map(s => ({ ...s, po: Math.random() * Math.PI * 2 })));

  const [sel,     setSel]     = useState(null);
  const [hovShip, setHovShip] = useState(null);
  const [mapReady,setMapReady]= useState(false);

  // ── Construire ships depuis gameData ────────────────────────────────────────
  const buildShips = useCallback(() => {
    if (!gameData?.companies) return;
    const built = [];
    for (const co of Object.values(gameData.companies)) {
      for (const nav of (co.flotte || [])) {
        if (!nav.routeActive) continue;
        const route = gameData.routes?.find(r => r.id === nav.routeActive);
        const pts = route ? [route.hub_depart, ...route.escales, route.hub_arrivee] : [];
        const isMe = myCompany?.ownerId === co.ownerId;
        const now = Date.now(), start = nav.routeAssignedAt || now - 86400000;
        const total = (route?.duree || 7) * 86400000;
        const ratio = ((now - start) % total) / total;
        const segs = Math.max(1, pts.length - 1);
        const si = Math.min(Math.floor(ratio * segs), segs - 1);
        const sr = ratio * segs - si;
        const pA = PORTS[pts[si]], pB = PORTS[pts[si + 1]];
        if (!pA) continue;
        built.push({
          uid: nav.uid, nom: nav.nom, flag: nav.flag || '', logo: co.logo,
          compNom: co.nom, isMe,
          lat: pA.lat + (pB ? (pB.lat - pA.lat) * sr : 0),
          lon: pA.lon + (pB ? (pB.lon - pA.lon) * sr : 0),
          route: route?.label || '', next: pB ? PORTS[pts[si + 1]]?.label : 'Arrivée',
          voyages: nav.voyages || 0, sat: nav.satisfactionMoyenne || 70,
          po: Math.random() * Math.PI * 2,
        });
      }
    }
    if (built.length > 0) shipsRef.current = built;
  }, [gameData, myCompany]);

  useEffect(() => { buildShips(); }, [buildShips]);

  // ── Init Leaflet ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || leafletRef.current) return;

    // Charger Leaflet dynamiquement (CSS + JS)
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkEl);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    document.head.appendChild(script);

    function initMap() {
      const L = window.L;
      if (!L || !mapDivRef.current) return;

      // Créer la map
      const map = L.map(mapDivRef.current, {
        center: [25, 20],
        zoom: 3,
        zoomControl: false,
        attributionControl: false,
        minZoom: 2,
        maxZoom: 6,
        maxBounds: [[-85, -180], [85, 180]],
        maxBoundsViscosity: 0.8,
      });

      // ── Tuile Stamen Watercolor — style carte illustrée aquarelle ──
      // Fallback sur OpenTopoMap si Stamen indisponible
      const stamenWatercolor = L.tileLayer(
        'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
        { attribution: '&copy; Stamen/Stadia', crossOrigin: true }
      );

      const topoFallback = L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        { attribution: '&copy; OpenTopoMap', crossOrigin: true }
      );

      // Essayer watercolor, fallback topo
      stamenWatercolor.on('tileerror', () => {
        map.removeLayer(stamenWatercolor);
        topoFallback.addTo(map);
      });
      stamenWatercolor.addTo(map);

      // ── Overlay SVG Canvas pour effets cartoon ──
      // Overlay pane pour nos éléments par-dessus les tuiles
      map.createPane('cartoonPane');
      map.getPane('cartoonPane').style.zIndex = 450;
      map.getPane('cartoonPane').style.pointerEvents = 'none';

      // ── Dessiner les routes ──
      ROUTES.forEach(rt => {
        const pts = rt.ports.map(id => PORTS[id]).filter(Boolean);
        for (let i = 0; i < pts.length - 1; i++) {
          const poly = L.polyline(
            [[pts[i].lat, pts[i].lon], [pts[i+1].lat, pts[i+1].lon]],
            {
              color: rt.color,
              weight: 3,
              opacity: 0.85,
              dashArray: '8, 12',
              lineCap: 'round',
              pane: 'cartoonPane',
              interactive: false,
            }
          ).addTo(map);
          routeLayersRef.current.push(poly);

          // Ombre de la route
          const shadow = L.polyline(
            [[pts[i].lat, pts[i].lon], [pts[i+1].lat, pts[i+1].lon]],
            { color: 'rgba(0,0,0,0.25)', weight: 5, opacity: 1, dashArray: '8, 12', pane: 'cartoonPane', interactive: false }
          ).addTo(map);
          routeLayersRef.current.push(shadow);
        }
      });

      // ── Ports ──
      Object.entries(PORTS).forEach(([id, p]) => {
        const sz = p.major ? 10 : 7;
        const portIcon = L.divIcon({
          className: '',
          iconSize: [sz*2+8, sz*2+8],
          iconAnchor: [sz+4, sz+4],
          html: `<div style="
            position:relative;width:${sz*2+8}px;height:${sz*2+8}px;
            display:flex;align-items:center;justify-content:center;
          ">
            <div style="
              width:${sz*2+4}px;height:${sz*2+4}px;border-radius:50%;
              background:rgba(255,255,255,0.9);
              position:absolute;
              box-shadow:0 2px 6px rgba(0,0,0,0.45);
            "></div>
            <div style="
              width:${sz*2}px;height:${sz*2}px;border-radius:50%;
              background:${p.major ? '#e74c3c' : '#e67e22'};
              border:1.5px solid rgba(0,0,0,0.25);
              position:absolute;
            "></div>
            ${p.major ? `<div style="
              position:absolute;bottom:100%;margin-bottom:2px;left:50%;transform:translateX(-50%);
              background:rgba(255,248,210,0.96);border:1px solid rgba(139,105,20,0.5);
              border-radius:4px;padding:1px 6px;white-space:nowrap;
              font:bold 9px Georgia,serif;color:#3d2b0a;
              box-shadow:0 1px 4px rgba(0,0,0,0.2);
            ">${p.label}</div>` : ''}
          </div>`,
        });
        const m = L.marker([p.lat, p.lon], { icon: portIcon, interactive: false }).addTo(map);
        portLayersRef.current.push(m);
      });

      // ── Animaux décoratifs ──
      [
        { lat: 8, lon: -30, emoji:'🐋', size:28 },
        { lat:12, lon:-155, emoji:'🐋', size:24 },
        { lat:-18,lon:  72, emoji:'🐋', size:22 },
        { lat: 18, lon:-70, emoji:'🌴', size:22 },
        { lat:-10, lon: 60, emoji:'🌴', size:20 },
        { lat: 15, lon: 90, emoji:'🐬', size:20 },
        { lat:-20, lon:-40, emoji:'🐬', size:18 },
      ].forEach(({ lat, lon, emoji, size }) => {
        const icon = L.divIcon({
          className: '',
          iconSize: [size, size],
          iconAnchor: [size/2, size/2],
          html: `<div style="font-size:${size}px;line-height:1;user-select:none;filter:drop-shadow(1px 2px 2px rgba(0,0,0,0.3))">${emoji}</div>`,
        });
        L.marker([lat, lon], { icon, interactive: false }).addTo(map);
      });

      leafletRef.current = map;
      setMapReady(true);
    }

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  // ── Animation des navires ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    const L = window.L;
    if (!L) return;

    function updateShipMarkers() {
      const map = leafletRef.current;
      if (!map) return;
      const fr = frameRef.current;
      const ships = shipsRef.current;

      ships.forEach(ship => {
        const isSel = sel?.uid === ship.uid;
        const sz = ship.isMe ? 56 : 46;
        const pulse = Math.sin(fr * 0.045 + (ship.po || 0));

        const svgStr = makeShipSVG(ship.isMe, fr, ship.po || 0);
        const logoEmoji = ship.logo || '🚢';

        const html = `
          <div style="position:relative;width:${sz}px;height:${sz+20}px;cursor:pointer;filter:${isSel?'drop-shadow(0 0 8px gold)':'drop-shadow(0 3px 6px rgba(0,0,0,0.4))'}">
            ${ship.isMe ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${sz+8+pulse*4}px;height:${sz+8+pulse*4}px;border-radius:50%;background:rgba(255,215,0,${0.15+pulse*0.08});pointer-events:none"></div>` : ''}
            ${isSel ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${sz+14}px;height:${sz+14}px;border-radius:50%;border:2.5px dashed rgba(255,215,0,0.85);pointer-events:none;animation:spinSlow 8s linear infinite"></div>` : ''}
            <div style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);background:${ship.isMe?'rgba(253,230,100,0.97)':'rgba(255,255,255,0.95)'};border:1.5px solid ${ship.isMe?'#d97706':'rgba(0,0,0,0.2)'};border-radius:5px;padding:2px 6px;white-space:nowrap;font:bold 11px Segoe UI Emoji;box-shadow:0 2px 6px rgba(0,0,0,0.2)">
              ${logoEmoji}
            </div>
            <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:8px;height:8px;background:${ship.isMe?'rgba(253,230,100,0.97)':'rgba(255,255,255,0.95)'};clip-path:polygon(50% 100%,0 0,100% 0)"></div>
            <div style="position:absolute;top:0;left:0;width:${sz}px;height:${sz}px">
              ${svgStr}
            </div>
            ${isSel ? `<div style="position:absolute;top:${sz+2}px;left:50%;transform:translateX(-50%);white-space:nowrap;font:bold 10px Georgia,serif;color:#fff;text-shadow:0 0 4px rgba(0,0,0,0.8),0 0 8px rgba(0,0,0,0.6)">${ship.nom.slice(0,16)}</div>` : ''}
          </div>`;

        const icon = L.divIcon({
          className: '',
          iconSize: [sz, sz + 20],
          iconAnchor: [sz / 2, sz - 4],
          html,
        });

        if (markersRef.current[ship.uid]) {
          markersRef.current[ship.uid].setIcon(icon);
          markersRef.current[ship.uid].setLatLng([ship.lat, ship.lon]);
        } else {
          const marker = L.marker([ship.lat, ship.lon], { icon })
            .addTo(map)
            .on('click', () => setSel(prev => prev?.uid === ship.uid ? null : ship))
            .on('mouseover', () => setHovShip(ship))
            .on('mouseout', () => setHovShip(null));
          markersRef.current[ship.uid] = marker;
        }
      });
    }

    const loop = () => {
      frameRef.current += 1;
      if (frameRef.current % 6 === 0) updateShipMarkers(); // 60fps clock, update ships ~10fps
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); };
  }, [mapReady, sel]);

  const total = shipsRef.current.length;
  const mine  = shipsRef.current.filter(s => s.isMe).length;

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', fontFamily:'Georgia,serif' }}>

      {/* ── Cadre parchemin ── */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#c8843c,#e8a840,#c07030)', zIndex:0, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', inset:12, border:'4px dashed rgba(100,55,10,0.5)', borderRadius:6, pointerEvents:'none', zIndex:20 }}/>
      {/* Coins ⚓ */}
      {[[10,10],[null,10],[10,null],[null,null]].map(([l,t],i) => (
        <div key={i} style={{ position:'absolute', left:l??undefined, right:l===null?10:undefined, top:t??undefined, bottom:t===null?10:undefined, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'rgba(80,40,5,0.5)', zIndex:21, pointerEvents:'none' }}>⚓</div>
      ))}

      {/* ── Conteneur Leaflet ── */}
      <div ref={mapDivRef} style={{ position:'absolute', inset:20, zIndex:2, borderRadius:4 }}/>

      {/* CSS animation */}
      <style>{`
        @keyframes spinSlow { to { transform: translate(-50%,-50%) rotate(360deg); } }
        .leaflet-container { background: #1a7bb8 !important; }
        .leaflet-tile-pane { filter: saturate(1.4) brightness(0.95); }
      `}</style>

      {/* ── Bannière titre ── */}
      <div style={{
        position:'absolute', top:18, left:'50%', transform:'translateX(-50%)',
        background:'linear-gradient(90deg,#9a6010,#e8a830 18%,#f8d060 50%,#e8a830 82%,#9a6010)',
        border:'2px solid #7a5010', borderRadius:3,
        padding:'8px 36px 6px',
        boxShadow:'0 4px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
        whiteSpace:'nowrap',
        clipPath:'polygon(14px 0%,calc(100% - 14px) 0%,100% 50%,calc(100% - 14px) 100%,14px 100%,0% 50%)',
        zIndex:25, pointerEvents:'none',
      }}>
        <div style={{ fontSize:'clamp(11px,1.8vw,18px)', fontWeight:'bold', color:'#3a1505', letterSpacing:'1.5px', textAlign:'center', textShadow:'0 1px 0 rgba(255,220,100,0.4)' }}>
          LE TOUR DU MONDE EN CROISIÈRE
        </div>
        <div style={{ fontSize:'clamp(8px,1vw,10px)', color:'rgba(58,21,5,0.65)', textAlign:'center', fontStyle:'italic', marginTop:1 }}>
          Planisphère du Jeu
        </div>
      </div>

      {/* ── Boussole ── */}
      <div style={{ position:'absolute', bottom:18, left:18, zIndex:25, pointerEvents:'none' }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <defs>
            <radialGradient id="cg" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#fff8e0"/>
              <stop offset="60%" stopColor="#f0d070"/>
              <stop offset="100%" stopColor="#c09030"/>
            </radialGradient>
          </defs>
          <circle cx="45" cy="45" r="43" fill="url(#cg)" stroke="#8B6914" strokeWidth="2.5"/>
          <circle cx="45" cy="45" r="34" fill="none" stroke="rgba(139,105,20,0.2)" strokeWidth="0.8"/>
          {Array.from({length:32},(_,i) => (
            <line key={i} x1="45" y1={i%8===0?6:i%4===0?9:13} x2="45" y2="16"
              stroke="rgba(100,60,10,0.35)" strokeWidth={i%8===0?1.5:.5}
              transform={`rotate(${i*11.25},45,45)`}/>
          ))}
          <polygon points="45,7 41,45 45,36 49,45" fill="#c0392b"/>
          <polygon points="45,83 41,45 45,54 49,45" fill="rgba(139,105,20,0.5)"/>
          <polygon points="7,45 45,41 36,45 45,49" fill="rgba(139,105,20,0.5)"/>
          <polygon points="83,45 45,41 54,45 45,49" fill="rgba(139,105,20,0.5)"/>
          {[['N',45,5.5,'#c0392b'],['S',45,87,'#5d3a10'],['E',87,47,'#5d3a10'],['W',5,47,'#5d3a10']].map(([l,x,y,c]) => (
            <text key={l} x={x} y={y} textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="Georgia,serif" fill={c}>{l}</text>
          ))}
          <circle cx="45" cy="45" r="5" fill="#d4a017" stroke="#8B6914" strokeWidth="1.2"/>
        </svg>
      </div>

      {/* ── HUD compteur ── */}
      <div style={{ position:'absolute', top:78, left:24, zIndex:25, background:'rgba(255,248,210,0.96)', border:'1px solid rgba(139,105,20,0.45)', borderRadius:20, padding:'5px 14px', fontSize:12, color:'#3d2b0a', boxShadow:'0 2px 8px rgba(0,0,0,0.25)' }}>
        ⛴ {total} navire{total>1?'s':''} en mer
        {mine > 0 && <span style={{ color:'#d97706', fontWeight:700 }}> · ⭐ {mine} à moi</span>}
      </div>

      {/* ── Tooltip navire survolé ── */}
      {hovShip && !sel && (
        <div style={{ position:'absolute', top:'38%', right:16, zIndex:25, width:215, background:'rgba(255,248,210,0.98)', border:'2px solid rgba(139,105,20,0.5)', borderRadius:12, padding:'12px 14px', boxShadow:'0 6px 24px rgba(0,0,0,0.35)', pointerEvents:'none' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#2c1a06' }}>{hovShip.logo} {hovShip.compNom}</div>
          <div style={{ fontSize:14, color:'#c05c0a', fontWeight:700, marginTop:3 }}>{hovShip.flag} {hovShip.nom}</div>
          <hr style={{ border:'none', borderTop:'1px solid rgba(139,105,20,0.25)', margin:'7px 0' }}/>
          {[['🗺',hovShip.route],['➡️',hovShip.next],['✈️',`${hovShip.voyages} voyages`],['😊',`${hovShip.sat}/100`]].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#5d4e37', marginTop:4 }}>
              <span>{k}</span><span style={{ fontWeight:600 }}>{v}</span>
            </div>
          ))}
          {hovShip.isMe && <div style={{ marginTop:8, textAlign:'center', fontSize:11, color:'#d97706', fontWeight:700 }}>⭐ Votre navire</div>}
        </div>
      )}

      {/* ── Fiche navire sélectionné ── */}
      {sel && (
        <div style={{ position:'absolute', top:'32%', right:16, zIndex:25, width:228, background:'rgba(255,248,210,0.98)', border:'2px solid rgba(139,105,20,0.55)', borderRadius:14, padding:'14px 16px', boxShadow:'0 8px 28px rgba(0,0,0,0.4)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#2c1a06' }}>{sel.logo} {sel.compNom}</div>
            <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#8b6914', lineHeight:1 }} onClick={() => setSel(null)}>✕</button>
          </div>
          <div style={{ fontSize:16, color:'#c05c0a', fontWeight:700, marginTop:5 }}>{sel.flag} {sel.nom}</div>
          <hr style={{ border:'none', borderTop:'1px solid rgba(139,105,20,0.28)', margin:'9px 0' }}/>
          {[['🗺 Route',sel.route.slice(0,24)],['➡️ Prochain',sel.next],['✈️ Voyages',sel.voyages],['😊 Satisfaction',`${sel.sat}/100`]].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:11 }}>
              <span style={{ color:'#5d4e37' }}>{k}</span>
              <span style={{ color:'#2c1a06', fontWeight:700 }}>{v}</span>
            </div>
          ))}
          {sel.isMe && <div style={{ marginTop:10, textAlign:'center', fontSize:12, color:'#d97706', fontWeight:700, background:'rgba(251,191,36,0.15)', borderRadius:8, padding:'5px' }}>⭐ Votre navire</div>}
        </div>
      )}

      {/* ── Légende ── */}
      <div style={{ position:'absolute', bottom:18, right:18, zIndex:25, background:'rgba(255,248,210,0.95)', border:'1.5px solid rgba(139,105,20,0.45)', borderRadius:10, padding:'9px 13px', boxShadow:'0 2px 10px rgba(0,0,0,0.22)' }}>
        <div style={{ fontSize:9, fontWeight:700, color:'#8b6914', textTransform:'uppercase', letterSpacing:1.2, marginBottom:5, paddingBottom:3, borderBottom:'1px solid rgba(139,105,20,0.2)' }}>ROUTES</div>
        {ROUTES.map(rt => (
          <div key={rt.id} style={{ display:'flex', alignItems:'center', gap:7, fontSize:10, color:'#3d2b0a', marginTop:3 }}>
            <div style={{ width:22, height:3, background:rt.color, borderRadius:2, border:'1px dashed rgba(0,0,0,0.15)' }}/>
            {rt.label}
          </div>
        ))}
      </div>
    </div>
  );
}
