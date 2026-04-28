import { useState, useEffect, useRef, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from "react-simple-maps";

// ── Données géographiques (Natural Earth 110m) ────────────────────────────────
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ── Ports (coordonnées lon/lat réelles) ───────────────────────────────────────
const PORTS = {
  barcelone     : { lon:  2.2, lat: 41.4, label: "Barcelone",  major: true  },
  genes         : { lon:  8.9, lat: 44.4, label: "Gênes",       major: true  },
  civitavecchia : { lon: 11.8, lat: 42.1, label: "Rome",        major: true  },
  naples        : { lon: 14.3, lat: 40.8, label: "Naples",      major: false },
  la_valette    : { lon: 14.5, lat: 35.9, label: "Malte",       major: false },
  athenes_piree : { lon: 23.6, lat: 37.9, label: "Athènes",    major: true  },
  santorin      : { lon: 25.4, lat: 36.4, label: "Santorin",   major: false },
  istanbul      : { lon: 29.0, lat: 41.0, label: "Istanbul",   major: true  },
  venise        : { lon: 12.3, lat: 45.4, label: "Venise",     major: true  },
  dubrovnik     : { lon: 18.1, lat: 42.7, label: "Dubrovnik",  major: false },
  lisbonne      : { lon: -9.1, lat: 38.7, label: "Lisbonne",   major: true  },
  funchal       : { lon:-16.9, lat: 32.6, label: "Madère",     major: false },
  tenerife      : { lon:-16.3, lat: 28.5, label: "Tenerife",   major: false },
  casablanca    : { lon: -7.6, lat: 33.6, label: "Casablanca", major: false },
  miami         : { lon:-80.2, lat: 25.8, label: "Miami",      major: true  },
  nassau        : { lon:-77.4, lat: 25.1, label: "Nassau",     major: false },
  cozumel       : { lon:-86.9, lat: 20.5, label: "Cozumel",    major: false },
  le_cap        : { lon: 18.4, lat:-33.9, label: "Le Cap",     major: false },
  dubai         : { lon: 55.3, lat: 25.2, label: "Dubaï",      major: true  },
  singapour     : { lon:103.8, lat:  1.3, label: "Singapour",  major: true  },
  hong_kong     : { lon:114.2, lat: 22.3, label: "Hong Kong",  major: false },
};

const ROUTES = [
  { id:"atl",  ports:["lisbonne","tenerife","miami"],           color:"#7c3aed", label:"Atlantique"  },
  { id:"med",  ports:["barcelone","civitavecchia","la_valette","athenes_piree"], color:"#d97706", label:"Méditerranée" },
  { id:"adr",  ports:["venise","dubrovnik","santorin","athenes_piree"],          color:"#2563eb", label:"Adriatique"   },
  { id:"ege",  ports:["athenes_piree","istanbul"],              color:"#16a34a", label:"Égée"        },
  { id:"asie", ports:["dubai","singapour","hong_kong"],         color:"#dc2626", label:"Asie"        },
  { id:"car",  ports:["miami","nassau","cozumel"],              color:"#0891b2", label:"Caraïbes"    },
];

const DEMO_SHIPS = [
  { uid:"s1", nom:"La Belle Époque", flag:"🇫🇷", logo:"🌊", compNom:"Blue Ocean", isMe:true,  lon:8.0,  lat:43.2, route:"Méditerranée", next:"Rome",      voyages:12, sat:84 },
  { uid:"s2", nom:"Adriatica",       flag:"🇮🇹", logo:"🔴", compNom:"Red Sea",   isMe:false, lon:15.5, lat:43.8, route:"Adriatique",   next:"Dubrovnik", voyages:8,  sat:78 },
  { uid:"s3", nom:"Costa Brava",     flag:"🇪🇸", logo:"🟡", compNom:"Gold Lines",isMe:false, lon:24.5, lat:37.2, route:"Égée",          next:"Santorin",  voyages:5,  sat:91 },
  { uid:"s4", nom:"Dubai Star",      flag:"🇦🇪", logo:"⭐", compNom:"Orient",    isMe:false, lon:80.0, lat:12.5, route:"Asie",          next:"Singapour", voyages:3,  sat:88 },
];

// ── Style géographies ─────────────────────────────────────────────────────────
const geoStyle = {
  default: {
    fill: "url(#landGrad)",
    stroke: "#4a8a30",
    strokeWidth: 0.8,
    outline: "none",
  },
  hover: {
    fill: "#a0d070",
    stroke: "#3a7020",
    strokeWidth: 1,
    outline: "none",
  },
  pressed: {
    fill: "#90c060",
    outline: "none",
  },
};

// ── Composant Bateau SVG ───────────────────────────────────────────────────────
function ShipMarker({ ship, selected, hovered, onClick, onHover, frame }) {
  const isMe = ship.isMe;
  const pulse = Math.sin(frame * 0.045 + (ship.pulseOffset || 0));
  const aura = 8 + pulse * 3;

  return (
    <Marker coordinates={[ship.lon, ship.lat]}>
      <g
        onClick={() => onClick(ship)}
        onMouseEnter={() => onHover(ship)}
        onMouseLeave={() => onHover(null)}
        style={{ cursor: "pointer" }}
      >
        {/* Sillage */}
        {[1,2,3].map(i => (
          <circle key={i} r={i*4} fill="rgba(255,255,255,0)" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5-i*0.4}/>
        ))}

        {/* Aura mon navire */}
        {isMe && (
          <circle r={aura + 10} fill={`rgba(255,215,0,${0.2 + pulse * 0.1})`} />
        )}

        {/* Cercle sélection */}
        {(selected || hovered) && (
          <circle r={22} fill="none" stroke={isMe ? "rgba(255,215,0,0.9)" : "rgba(255,255,255,0.7)"} strokeWidth={2} strokeDasharray="5,4"/>
        )}

        {/* Corps bateau SVG illustré */}
        <g transform="translate(-14, -18)">
          {/* Coque */}
          <path d="M0 14 L28 14 L25 22 L3 22 Z" fill={isMe ? "#c0392b" : "#8e44ad"} stroke={isMe ? "#7b241c" : "#6c3483"} strokeWidth="1.2"/>
          {/* Pont */}
          <rect x="2" y="8" width="24" height="7" rx="2" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="0.8"/>
          {/* Superstructure */}
          <rect x="6" y="0" width="16" height="9" rx="2" fill={isMe ? "#e74c3c" : "#9b59b6"} stroke={isMe ? "#c0392b" : "#7d3c98"} strokeWidth="0.8"/>
          {/* Cheminée */}
          <rect x="11" y="-7" width="5" height="8" fill={isMe ? "#c0392b" : "#7d3c98"} stroke="rgba(0,0,0,0.2)" strokeWidth="0.6"/>
          {/* Fumée */}
          {[0,1,2].map(i => (
            <circle key={i} cx={13 - i*1.5} cy={-10 - i*4} r={2.5 + i*1.8} fill={`rgba(210,210,210,${0.45 - i*0.12})`}/>
          ))}
          {/* Hublots */}
          {[-4, 2, 8, 14].map(x => (
            <circle key={x} cx={x+8} cy="11" r="1.8" fill="#3498db" stroke="#2980b9" strokeWidth="0.5"/>
          ))}
          {/* Mât */}
          <line x1="14" y1="0" x2="14" y2="-18" stroke="#7f8c8d" strokeWidth="1.2"/>
          {/* Drapeau */}
          <path d={`M14 -18 L${23 + pulse*2} -13 L14 -8 Z`} fill={isMe ? "#f39c12" : "#e74c3c"}/>
        </g>

        {/* Bulle logo compagnie */}
        <g transform="translate(0, -42)">
          <rect x="-14" y="-9" width="28" height="16" rx="4" fill={isMe ? "rgba(253,230,100,0.97)" : "rgba(255,255,255,0.95)"} stroke={isMe ? "#d97706" : "rgba(0,0,0,0.2)"} strokeWidth="1.2"/>
          <path d="M-4 7 L4 7 L0 13 Z" fill={isMe ? "rgba(253,230,100,0.97)" : "rgba(255,255,255,0.95)"}/>
          <text x="0" y="4" textAnchor="middle" fontSize="11" dominantBaseline="middle">{ship.logo}</text>
        </g>
      </g>
    </Marker>
  );
}

// ── Composant Port SVG ────────────────────────────────────────────────────────
function PortMarker({ id, port, hovered, onHover }) {
  const sz = port.major ? 5 : 3;
  return (
    <Marker coordinates={[port.lon, port.lat]}>
      <g onMouseEnter={() => onHover(id)} onMouseLeave={() => onHover(null)} style={{ cursor: "default" }}>
        <circle r={sz + 2} fill="rgba(255,255,255,0.85)" filter="url(#portShadow)"/>
        <circle r={sz} fill={hovered ? "#f39c12" : port.major ? "#e74c3c" : "#e67e22"} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8"/>
        {(port.major || hovered) && (
          <g>
            <rect
              x={-port.label.length * 3.5 - 4}
              y={-sz - 18}
              width={port.label.length * 7 + 8}
              height={13}
              rx="3"
              fill="rgba(255,248,210,0.96)"
              stroke="rgba(139,105,20,0.45)"
              strokeWidth="0.9"
            />
            <text
              x="0"
              y={-sz - 9}
              textAnchor="middle"
              fontSize={hovered ? "10" : "8.5"}
              fontFamily="Georgia, serif"
              fontWeight="bold"
              fill="#3d2b0a"
            >{port.label}</text>
          </g>
        )}
      </g>
    </Marker>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function GameMap({ gameData, myCompany }) {
  const [sel,       setSel]       = useState(null);
  const [hovShip,   setHovShip]   = useState(null);
  const [hovPort,   setHovPort]   = useState(null);
  const [frame,     setFrame]     = useState(0);
  const [ships,     setShips]     = useState(
    DEMO_SHIPS.map(s => ({ ...s, pulseOffset: Math.random() * Math.PI * 2 }))
  );
  const animRef = useRef(null);
  const lastT   = useRef(0);

  // Animation frame
  useEffect(() => {
    const loop = (t) => {
      if (t - lastT.current > 80) { // ~12fps pour le SVG
        setFrame(f => f + 1);
        lastT.current = t;
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Construire ships depuis gameData
  useEffect(() => {
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
          uid: nav.uid, nom: nav.nom, flag: nav.flag || '', logo: co.logo, compNom: co.nom, isMe,
          lon: pA.lon + (pB ? (pB.lon - pA.lon) * sr : 0),
          lat: pA.lat + (pB ? (pB.lat - pA.lat) * sr : 0),
          route: route?.label || '', next: pB ? PORTS[pts[si + 1]]?.label : 'Arrivée',
          voyages: nav.voyages || 0, sat: nav.satisfactionMoyenne || 70,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
    }
    if (built.length > 0) setShips(built);
  }, [gameData, myCompany]);

  const total = ships.length, mine = ships.filter(s => s.isMe).length;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#c8943c", fontFamily: "Georgia, serif" }}>
      {/* ── Bordure parchemin ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: "linear-gradient(135deg, #c8843c 0%, #e8a840 50%, #c07030 100%)",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.25)",
      }}/>
      <div style={{
        position: "absolute", inset: 14, zIndex: 1,
        border: "4px dashed rgba(100,55,10,0.5)",
        borderRadius: 6, pointerEvents: "none",
      }}/>
      {/* Coins ⚓ */}
      {[[14,14],[null,14],[14,null],[null,null]].map(([l,t],i)=>(
        <div key={i} style={{position:"absolute",left:l??undefined,right:l===null?14:undefined,top:t??undefined,bottom:t===null?14:undefined,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"rgba(80,40,5,0.55)",zIndex:2}}>⚓</div>
      ))}

      {/* ── Carte SVG ── */}
      <div style={{ position: "absolute", inset: 22, zIndex: 3, borderRadius: 4, overflow: "hidden" }}>
        <ComposableMap
          width={900}
          height={480}
          projection="geoMercator"
          projectionConfig={{ center: [20, 30], scale: 140 }}
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            {/* Gradient terre */}
            <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#8cc870"/>
              <stop offset="40%"  stopColor="#7ab860"/>
              <stop offset="70%"  stopColor="#c8a840"/>
              <stop offset="100%" stopColor="#6a9e50"/>
            </linearGradient>
            {/* Gradient océan */}
            <radialGradient id="oceanGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%"   stopColor="#2c94d8"/>
              <stop offset="50%"  stopColor="#1e7ab8"/>
              <stop offset="100%" stopColor="#145888"/>
            </radialGradient>
            {/* Filtre ombre port */}
            <filter id="portShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.4"/>
            </filter>
            {/* Filtre ombre continent */}
            <filter id="landShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="3" dy="4" stdDeviation="4" floodOpacity="0.35"/>
            </filter>
            {/* Motif vagues */}
            <pattern id="wavePattern" x="0" y="0" width="60" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q15 3 30 10 Q45 17 60 10" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2"/>
            </pattern>
          </defs>

          {/* Fond océan */}
          <rect x="-1000" y="-1000" width="3000" height="3000" fill="url(#oceanGrad)"/>
          {/* Vagues */}
          <rect x="-1000" y="-1000" width="3000" height="3000" fill="url(#wavePattern)" opacity="0.6"/>

          {/* Lignes de grille lat/lon */}
          {[-60,-30,0,30,60].map(lat => {
            const y = lat === 0 ? "50%" : undefined;
            return <line key={lat} x1="-1000" y1={lat} x2="2000" y2={lat} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" transform={`translate(0,${-lat})`}/>;
          })}

          {/* Noms des océans */}
          {[
            { label: "OCÉAN ATLANTIQUE",  lon: -30,  lat:  8  },
            { label: "OCÉAN PACIFIQUE",   lon:-140,  lat: 10  },
            { label: "OCÉAN INDIEN",      lon:  72,  lat:-18  },
            { label: "ARCTIQUE",          lon:   0,  lat: 72  },
            { label: "MER MÉDITERRANÉE",  lon:  16,  lat: 36  },
            { label: "MER CARAÏBES",      lon: -74,  lat: 16  },
          ].map(({label,lon,lat})=>(
            <Marker key={label} coordinates={[lon,lat]}>
              <text textAnchor="middle" fontSize="9" fontFamily="Georgia,serif" fontWeight="bold" fill="rgba(255,255,255,0.38)" letterSpacing="0.8">
                {label}
              </text>
            </Marker>
          ))}

          {/* ── Continents ── */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={geoStyle}
                  filter="url(#landShadow)"
                />
              ))
            }
          </Geographies>

          {/* ── Couche texture grain sur terres ── */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey + "_t"}
                  geography={geo}
                  style={{
                    default: { fill: "rgba(0,0,0,0.04)", stroke: "none", outline: "none" },
                    hover:   { fill: "rgba(0,0,0,0.04)", stroke: "none", outline: "none" },
                    pressed: { fill: "rgba(0,0,0,0.04)", stroke: "none", outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* ── Routes ── */}
          {ROUTES.map(rt => {
            const pts = rt.ports.map(id => PORTS[id]).filter(Boolean);
            return pts.slice(0, -1).map((pA, i) => {
              const pB = pts[i + 1];
              return (
                <Line
                  key={`${rt.id}_${i}`}
                  from={[pA.lon, pA.lat]}
                  to={[pB.lon, pB.lat]}
                  stroke={rt.color + "dd"}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeDasharray="7,10"
                />
              );
            });
          })}

          {/* ── Ports ── */}
          {Object.entries(PORTS).map(([id, port]) => (
            <PortMarker
              key={id}
              id={id}
              port={port}
              hovered={hovPort === id}
              onHover={setHovPort}
            />
          ))}

          {/* ── Baleines déco ── */}
          {[[-35, 8], [-155, 12], [75, -18]].map(([lon, lat], i) => (
            <Marker key={`whale_${i}`} coordinates={[lon, lat]}>
              <text fontSize="18" textAnchor="middle" dominantBaseline="middle" style={{ userSelect: "none" }}>🐋</text>
            </Marker>
          ))}
          {[[-70, 18], [60, -10]].map(([lon, lat], i) => (
            <Marker key={`isle_${i}`} coordinates={[lon, lat]}>
              <text fontSize="14" textAnchor="middle" dominantBaseline="middle">🌴</text>
            </Marker>
          ))}

          {/* ── Navires ── */}
          {ships.map(ship => (
            <ShipMarker
              key={ship.uid}
              ship={ship}
              selected={sel?.uid === ship.uid}
              hovered={hovShip?.uid === ship.uid}
              onClick={s => setSel(prev => prev?.uid === s.uid ? null : s)}
              onHover={setHovShip}
              frame={frame}
            />
          ))}
        </ComposableMap>

        {/* ── Boussole SVG ornée ── */}
        <div style={{ position: "absolute", bottom: 12, left: 12 }}>
          <svg width="90" height="90" viewBox="0 0 90 90">
            <defs>
              <radialGradient id="compBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff8e0"/>
                <stop offset="65%" stopColor="#f0d888"/>
                <stop offset="100%" stopColor="#c09030"/>
              </radialGradient>
            </defs>
            <circle cx="45" cy="45" r="42" fill="url(#compBg)" stroke="#8B6914" strokeWidth="2.5"/>
            <circle cx="45" cy="45" r="33" fill="none" stroke="rgba(139,105,20,0.25)" strokeWidth="0.8"/>
            {/* Graduations */}
            {Array.from({length:36},(_,i)=>(
              <line key={i} x1="45" y1={i%9===0?10:14} x2="45" y2="18"
                stroke="rgba(100,60,10,0.4)" strokeWidth={i%9===0?1.8:.6}
                transform={`rotate(${i*10},45,45)`}/>
            ))}
            {/* Aiguilles */}
            <polygon points="45,8 41,45 45,38 49,45" fill="#c0392b"/>
            <polygon points="45,82 41,45 45,52 49,45" fill="rgba(139,105,20,0.5)"/>
            <polygon points="45,45 8,41 18,45 8,49" fill="rgba(139,105,20,0.5)"/>
            <polygon points="45,45 82,41 72,45 82,49" fill="rgba(139,105,20,0.5)"/>
            {/* NESW */}
            {[["N",45,6,"#c0392b"],["S",45,87,"#5d3a10"],["E",87,47,"#5d3a10"],["W",5,47,"#5d3a10"]].map(([l,x,y,c])=>(
              <text key={l} x={x} y={y} textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="Georgia,serif" fill={c}>{l}</text>
            ))}
            <circle cx="45" cy="45" r="5" fill="#d4a017" stroke="#8B6914" strokeWidth="1.2"/>
          </svg>
        </div>

        {/* ── Bannière titre ── */}
        <div style={{
          position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(90deg, #b07020 0%, #f0c050 20%, #f8d870 50%, #f0c050 80%, #b07020 100%)",
          border: "2px solid #8B6914",
          borderRadius: "4px",
          padding: "7px 28px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
          whiteSpace: "nowrap",
          clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)",
        }}>
          <div style={{ fontSize: "clamp(11px,1.8vw,18px)", fontWeight: "bold", color: "#4a1e05", letterSpacing: "1.5px", textAlign: "center" }}>
            LE TOUR DU MONDE EN CROISIÈRE
          </div>
          <div style={{ fontSize: "clamp(8px,1.1vw,11px)", color: "rgba(74,30,5,0.65)", textAlign: "center", fontStyle: "italic" }}>
            Planisphère du Jeu
          </div>
        </div>
      </div>

      {/* ── HUD ── */}
      <div style={{ position: "absolute", top: 75, left: 30, zIndex: 10, background: "rgba(255,248,210,0.95)", border: "1px solid rgba(139,105,20,0.45)", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#3d2b0a", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
        ⛴ {total} navire{total > 1 ? "s" : ""} en mer
        {mine > 0 && <span style={{ color: "#d97706", fontWeight: 700 }}> · ⭐ {mine} à moi</span>}
      </div>

      {/* ── Tooltip navire survolé ── */}
      {hovShip && !sel && (
        <div style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", zIndex: 20, background: "rgba(255,248,210,0.98)", border: "2px solid rgba(139,105,20,0.5)", borderRadius: 12, padding: "12px 14px", minWidth: 185, boxShadow: "0 6px 24px rgba(0,0,0,0.35)", pointerEvents: "none" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2c1a06" }}>{hovShip.logo} {hovShip.compNom}</div>
          <div style={{ fontSize: 14, color: "#c05c0a", fontWeight: 700, marginTop: 3 }}>{hovShip.flag} {hovShip.nom}</div>
          <hr style={{ border: "none", borderTop: "1px solid rgba(139,105,20,0.25)", margin: "7px 0" }}/>
          <div style={{ fontSize: 11, color: "#5d4e37" }}>🗺 {hovShip.route}</div>
          <div style={{ fontSize: 11, color: "#5d4e37", marginTop: 3 }}>➡️ Prochain : {hovShip.next}</div>
          <div style={{ fontSize: 10, color: "#8b6914", marginTop: 6, fontStyle: "italic" }}>Cliquez pour les détails</div>
        </div>
      )}

      {/* ── Fiche navire sélectionné ── */}
      {sel && (
        <div style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", zIndex: 20, width: 230, background: "rgba(255,248,210,0.98)", border: "2px solid rgba(139,105,20,0.55)", borderRadius: 14, padding: "14px 16px", boxShadow: "0 8px 28px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2c1a06" }}>{sel.logo} {sel.compNom}</div>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#8b6914", lineHeight: 1 }} onClick={() => setSel(null)}>✕</button>
          </div>
          <div style={{ fontSize: 16, color: "#c05c0a", fontWeight: 700, marginTop: 5 }}>{sel.flag} {sel.nom}</div>
          <hr style={{ border: "none", borderTop: "1px solid rgba(139,105,20,0.28)", margin: "9px 0" }}/>
          {[["🗺 Route", sel.route.slice(0,26)], ["➡️ Prochain", sel.next], ["✈️ Voyages", sel.voyages], ["😊 Satisfaction", `${sel.sat}/100`]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11 }}>
              <span style={{ color: "#5d4e37" }}>{k}</span>
              <span style={{ color: "#2c1a06", fontWeight: 700 }}>{v}</span>
            </div>
          ))}
          {sel.isMe && <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: "#d97706", fontWeight: 700, background: "rgba(251,191,36,0.15)", borderRadius: 8, padding: "5px" }}>⭐ Votre navire</div>}
        </div>
      )}

      {/* ── Légende ── */}
      <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 10, background: "rgba(255,248,210,0.95)", border: "1.5px solid rgba(139,105,20,0.45)", borderRadius: 10, padding: "9px 13px", boxShadow: "0 2px 10px rgba(0,0,0,0.22)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#8b6914", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5, paddingBottom: 3, borderBottom: "1px solid rgba(139,105,20,0.2)" }}>ROUTES</div>
        {ROUTES.map(rt => (
          <div key={rt.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10, color: "#3d2b0a", marginTop: 3 }}>
            <div style={{ width: 22, height: 3, background: rt.color, borderRadius: 2, border: "1px dashed rgba(0,0,0,0.15)" }}/>
            {rt.label}
          </div>
        ))}
      </div>
    </div>
  );
}
