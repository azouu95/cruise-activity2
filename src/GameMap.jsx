import { useState, useEffect, useRef, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker, Line } from "react-simple-maps";
import { feature } from "topojson-client";
// Topojson embarqué dans le bundle — 0 requête réseau
import worldTopo from "./worldData.json";

// Pré-convertir en GeoJSON une seule fois au chargement du module
const worldGeo = feature(worldTopo, worldTopo.objects.countries);

// ── Ports ─────────────────────────────────────────────────────────────────────
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
  tenerife      : { lon:-16.3, lat: 28.5, label: "Tenerife",   major: false },
  casablanca    : { lon: -7.6, lat: 33.6, label: "Casablanca", major: false },
  miami         : { lon:-80.2, lat: 25.8, label: "Miami",      major: true  },
  nassau        : { lon:-77.4, lat: 25.1, label: "Nassau",     major: false },
  cozumel       : { lon:-86.9, lat: 20.5, label: "Cozumel",    major: false },
  ocho_rios     : { lon:-77.1, lat: 18.4, label: "Jamaïque",   major: false },
  le_cap        : { lon: 18.4, lat:-33.9, label: "Le Cap",     major: false },
  dubai         : { lon: 55.3, lat: 25.2, label: "Dubaï",      major: true  },
  singapour     : { lon:103.8, lat:  1.3, label: "Singapour",  major: true  },
  hong_kong     : { lon:114.2, lat: 22.3, label: "Hong Kong",  major: false },
};

const ROUTES = [
  { id:"atl",  ports:["lisbonne","tenerife","miami"],             color:"#9333ea", label:"Atlantique"   },
  { id:"med",  ports:["barcelone","civitavecchia","la_valette","athenes_piree"], color:"#f59e0b", label:"Méditerranée" },
  { id:"adr",  ports:["venise","dubrovnik","athenes_piree"],      color:"#3b82f6", label:"Adriatique"   },
  { id:"ege",  ports:["athenes_piree","santorin","istanbul"],     color:"#16a34a", label:"Égée"         },
  { id:"asie", ports:["dubai","singapour","hong_kong"],           color:"#dc2626", label:"Asie"         },
  { id:"car",  ports:["miami","nassau","cozumel","ocho_rios"],    color:"#0891b2", label:"Caraïbes"     },
];

const DEMO_SHIPS = [
  { uid:"s1", nom:"La Belle Époque", flag:"🇫🇷", logo:"🌊", compNom:"Blue Ocean", isMe:true,  lon:6.0,  lat:43.5, route:"Méditerranée", next:"Rome",      voyages:12, sat:84 },
  { uid:"s2", nom:"Adriatica",       flag:"🇮🇹", logo:"🔴", compNom:"Red Sea",   isMe:false, lon:15.5, lat:43.8, route:"Adriatique",   next:"Dubrovnik", voyages:8,  sat:78 },
  { uid:"s3", nom:"Costa Brava",     flag:"🇪🇸", logo:"🟡", compNom:"Gold Lines",isMe:false, lon:24.5, lat:37.2, route:"Égée",          next:"Santorin",  voyages:5,  sat:91 },
  { uid:"s4", nom:"Dubai Star",      flag:"🇦🇪", logo:"⭐", compNom:"Orient",    isMe:false, lon:78.0, lat:12.5, route:"Asie",          next:"Singapour", voyages:3,  sat:88 },
];

// ── Couleur biome par pays ────────────────────────────────────────────────────
function getBiomeColor(name = "") {
  const n = name.toLowerCase();
  if (/algeria|libya|egypt|saudi arabia|niger|mali|chad|sudan|mauritania|western sahara|mongolia|namibia|oman/.test(n)) return "#d4a544";
  if (/brazil|congo|indonesia|malaysia|colombia|peru|venezuela|cameroon|papua/.test(n))                                 return "#3d9e3a";
  if (/nigeria|tanzania|kenya|mozambique|zimbabwe|angola|zambia|ethiopia|ghana|senegal|somalia|madagascar/.test(n))     return "#7ab830";
  if (/south africa/.test(n))  return "#b89840";
  if (/australia/.test(n))     return "#c8a040";
  if (/kazakhstan|uzbekistan|turkmenistan|afghanistan|iran|pakistan/.test(n)) return "#c09848";
  if (/vietnam|thailand|myanmar|cambodia|philippines|laos/.test(n))          return "#4aaa3a";
  if (/china/.test(n))         return "#78b658";
  if (/india/.test(n))         return "#98be52";
  if (/russia|canada|finland|sweden|norway/.test(n))  return "#68a850";
  if (/united states|mexico/.test(n))                 return "#76b450";
  if (/argentina|chile|bolivia/.test(n))              return "#6ea84a";
  if (/greenland|antarctica/.test(n))                 return "#d0e8f0";
  if (/iceland/.test(n))       return "#c0d8e2";
  if (/turkey|iraq|syria|jordan|israel|yemen|kuwait|bahrain|qatar|united arab/.test(n)) return "#c09848";
  // Europe par défaut — vert prairie
  return "#88c668";
}

// ── Navire SVG ────────────────────────────────────────────────────────────────
function ShipSVG({ isMe, logo, nom, selected, frame, po }) {
  const pulse = Math.sin((frame || 0) * 0.045 + (po || 0));
  const wf = pulse * 2.5;
  const sc = isMe ? 1.1 : 0.9;

  const hullC = isMe ? "#c0392b" : "#8e44ad";
  const hullD = isMe ? "#7b241c" : "#6c3483";
  const supC  = isMe ? "#e74c3c" : "#9b59b6";
  const chimC = isMe ? "#c0392b" : "#7d3c98";
  const flagC = isMe ? "#f39c12" : "#e74c3c";

  return (
    <g style={{ cursor: "pointer" }}>
      {[12, 22, 30].map(r => <circle key={r} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />)}
      {isMe && <circle r={18 + pulse * 4} fill={`rgba(255,215,0,${0.18 + pulse * 0.08})`} />}
      {selected && <circle r={30} fill="none" stroke="rgba(255,215,0,0.85)" strokeWidth="2.5" strokeDasharray="5,4" />}

      {/* Corps navire */}
      <g transform={`translate(-18,-28) scale(${sc})`}>
        <path d="M0 20 L36 20 L32 30 L4 30 Z" fill={hullC} stroke={hullD} strokeWidth="1.4" />
        <line x1="3" y1="25" x2="33" y2="25" stroke="rgba(255,255,255,0.28)" strokeWidth="0.9" />
        <rect x="3" y="11" width="30" height="10" rx="2" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="1" />
        {[5, 11, 17, 23].map(x => <rect key={x} x={x} y="13" width="4" height="6" rx="0.8" fill="#3498db" stroke="#2980b9" strokeWidth="0.5" />)}
        <rect x="8" y="1" width="20" height="11" rx="3" fill={supC} stroke={chimC} strokeWidth="1" />
        {[12, 20].map(x => <circle key={x} cx={x} cy="5" r="2.2" fill="#3498db" stroke="#2980b9" strokeWidth="0.6" />)}
        <rect x="15" y="-9" width="7" height="11" rx="1.5" fill={chimC} />
        <rect x="15" y="-5" width="7" height="2.5" fill="rgba(255,255,255,0.28)" />
        {[0, 1, 2].map(i => <circle key={i} cx={18.5 - i * 2} cy={-13 - i * 5 + pulse * 1.5} r={3.5 + i * 2.5} fill={`rgba(200,200,200,${0.48 - i * 0.12})`} />)}
        <line x1="18" y1="1" x2="18" y2="-24" stroke="#95a5a6" strokeWidth="1.3" />
        <line x1="5" y1="11" x2="18" y2="-22" stroke="rgba(140,120,80,0.4)" strokeWidth="0.7" />
        <line x1="31" y1="11" x2="18" y2="-22" stroke="rgba(140,120,80,0.4)" strokeWidth="0.7" />
        <path d={`M18 -24 L${28 + wf} -18 L18 -12 Z`} fill={flagC} />
      </g>

      {/* Bulle logo */}
      <rect x="-13" y="-60" width="26" height="15" rx="5"
        fill={isMe ? "rgba(253,230,100,0.97)" : "rgba(255,255,255,0.95)"}
        stroke={isMe ? "#d97706" : "rgba(0,0,0,0.2)"} strokeWidth="1.2" />
      <path d={`M-4 -45 L4 -45 L0 -39 Z`}
        fill={isMe ? "rgba(253,230,100,0.97)" : "rgba(255,255,255,0.95)"} />
      <text x="0" y="-48" textAnchor="middle" fontSize="11" dominantBaseline="middle">{logo}</text>

      {selected && (
        <text y="52" textAnchor="middle" fontSize="10" fontFamily="Georgia,serif" fontWeight="bold"
          fill="white" stroke="rgba(0,0,0,0.8)" strokeWidth="3" paintOrder="stroke">
          {nom.slice(0, 18)}
        </text>
      )}
    </g>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function GameMap({ gameData, myCompany }) {
  const [sel,     setSel]     = useState(null);
  const [hovShip, setHovShip] = useState(null);
  const [hovPort, setHovPort] = useState(null);
  const [zoom,    setZoom]    = useState(1);
  const [center,  setCenter]  = useState([20, 20]);
  const [frame,   setFrame]   = useState(0);
  const [ships,   setShips]   = useState(DEMO_SHIPS.map(s => ({ ...s, po: Math.random() * Math.PI * 2 })));
  const animRef = useRef(null);
  const lastT   = useRef(0);

  // Animation lente (navires uniquement)
  useEffect(() => {
    const loop = t => {
      if (t - lastT.current > 200) { setFrame(f => f + 1); lastT.current = t; }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Build ships depuis gameData
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
          uid: nav.uid, nom: nav.nom, flag: nav.flag || "", logo: co.logo,
          compNom: co.nom, isMe,
          lon: pA.lon + (pB ? (pB.lon - pA.lon) * sr : 0),
          lat: pA.lat + (pB ? (pB.lat - pA.lat) * sr : 0),
          route: route?.label || "", next: pB ? PORTS[pts[si + 1]]?.label : "Arrivée",
          voyages: nav.voyages || 0, sat: nav.satisfactionMoyenne || 70,
          po: Math.random() * Math.PI * 2,
        });
      }
    }
    if (built.length > 0) setShips(built);
  }, [gameData, myCompany]);

  const total = ships.length, mine = ships.filter(s => s.isMe).length;

  // Stroke width adapté au zoom
  const sw = (n) => n / zoom;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Georgia,serif" }}>
      {/* Cadre parchemin */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#c8843c,#e8b040,#c07030)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 12, border: "4px dashed rgba(90,45,5,0.5)", borderRadius: 6, pointerEvents: "none", zIndex: 20 }} />
      {[[10, 10, "left", "top"], [null, 10, "right", "top"], [10, null, "left", "bottom"], [null, null, "right", "bottom"]].map(([l, t, lr, tb], i) => (
        <div key={i} style={{ position: "absolute", [lr]: 10, [tb]: 10, fontSize: 18, color: "rgba(70,30,5,0.5)", zIndex: 21, pointerEvents: "none" }}>⚓</div>
      ))}

      {/* Carte */}
      <div style={{ position: "absolute", inset: 20, borderRadius: 4, overflow: "hidden", zIndex: 2 }}>
        <ComposableMap
          width={960}
          height={500}
          projection="geoMercator"
          projectionConfig={{ scale: 148 }}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <defs>
            <pattern id="wv" x="0" y="0" width="60" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q15 3 30 10 Q45 17 60 10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.3" />
            </pattern>
          </defs>

          <ZoomableGroup
            center={center}
            zoom={zoom}
            minZoom={1}
            maxZoom={8}
            onMoveEnd={({ zoom: z, coordinates: c }) => { setZoom(z); setCenter(c); }}
          >
            {/* ── Fond océan ── */}
            <rect x="-3000" y="-3000" width="8000" height="6000" fill="#1a7cc0" />
            <ellipse cx="350" cy="120" rx="400" ry="280" fill="rgba(60,160,240,0.18)" />
            <rect x="-3000" y="-3000" width="8000" height="6000" fill="url(#wv)" />

            {/* Noms des océans */}
            {[
              ["OCÉAN ATLANTIQUE", -28, 8], ["OCÉAN PACIFIQUE", -150, 10],
              ["OCÉAN INDIEN", 72, -18], ["ARCTIQUE", 0, 75],
              ["MER MÉDITERRANÉE", 16, 35], ["MER CARAÏBES", -74, 16],
              ["MER DU NORD", 4, 58],
            ].map(([t, lon, lat]) => (
              <Marker key={t} coordinates={[lon, lat]}>
                <text textAnchor="middle" fontSize={sw(7.5)} fontFamily="Georgia,serif"
                  fontWeight="bold" fill="rgba(255,255,255,0.38)" letterSpacing="0.8">{t}</text>
              </Marker>
            ))}

            {/* ── CONTINENTS (Natural Earth 110m — GeoJSON pré-converti) ── */}
            <Geographies geography={worldGeo}>
              {({ geographies }) => geographies.map(geo => {
                const fill = getBiomeColor(geo.properties?.name || "");
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: { fill, stroke: "rgba(25,75,10,0.65)", strokeWidth: sw(0.5), outline: "none" },
                      hover:   { fill, stroke: "rgba(25,75,10,0.65)", strokeWidth: sw(0.5), outline: "none" },
                      pressed: { fill, stroke: "rgba(25,75,10,0.65)", strokeWidth: sw(0.5), outline: "none" },
                    }}
                  />
                );
              })}
            </Geographies>

            {/* Trait de côte cartoon */}
            <Geographies geography={worldGeo}>
              {({ geographies }) => geographies.map(geo => (
                <Geography
                  key={geo.rsmKey + "_c"}
                  geography={geo}
                  style={{
                    default: { fill: "none", stroke: "rgba(25,75,10,0.6)", strokeWidth: sw(1.4), outline: "none", pointerEvents: "none" },
                    hover:   { fill: "none", stroke: "rgba(25,75,10,0.6)", strokeWidth: sw(1.4), outline: "none", pointerEvents: "none" },
                    pressed: { fill: "none", stroke: "rgba(25,75,10,0.6)", strokeWidth: sw(1.4), outline: "none", pointerEvents: "none" },
                  }}
                />
              ))}
            </Geographies>

            {/* Routes */}
            {ROUTES.map(rt => {
              const pts = rt.ports.map(id => PORTS[id]).filter(Boolean);
              return pts.slice(0, -1).map((pA, i) => ([
                <Line key={`${rt.id}_s${i}`}
                  from={[pA.lon, pA.lat]} to={[pts[i + 1].lon, pts[i + 1].lat]}
                  stroke="rgba(0,0,0,0.3)" strokeWidth={sw(4)}
                  strokeLinecap="round" strokeDasharray={`${sw(7)},${sw(11)}`} />,
                <Line key={`${rt.id}_${i}`}
                  from={[pA.lon, pA.lat]} to={[pts[i + 1].lon, pts[i + 1].lat]}
                  stroke={rt.color} strokeWidth={sw(2.8)}
                  strokeLinecap="round" strokeDasharray={`${sw(7)},${sw(11)}`} />,
              ]));
            })}

            {/* Déco océan */}
            {[[-35, 8, "🐋", 22], [-155, 12, "🐋", 20], [75, -18, "🐋", 18],
              [-70, 18, "🌴", 16], [60, -10, "🌴", 15], [-140, -18, "🐬", 15]].map(([lon, lat, e, sz], i) => (
              <Marker key={i} coordinates={[lon, lat]}>
                <text fontSize={sw(sz)} textAnchor="middle" dominantBaseline="middle"
                  style={{ userSelect: "none" }}>{e}</text>
              </Marker>
            ))}

            {/* Ports */}
            {Object.entries(PORTS).map(([id, p]) => {
              const sz = sw(p.major ? 6 : 4);
              const hov = hovPort === id;
              const tw = p.label.length * sw(7) + sw(12);
              return (
                <Marker key={id} coordinates={[p.lon, p.lat]}>
                  <g onMouseEnter={() => setHovPort(id)} onMouseLeave={() => setHovPort(null)}>
                    <circle r={sz + sw(3)} fill="rgba(255,255,255,0.75)" />
                    <circle r={sz} fill={hov ? "#f59e0b" : p.major ? "#e74c3c" : "#e67e22"}
                      stroke="rgba(0,0,0,0.25)" strokeWidth={sw(0.8)} />
                    {(p.major || hov) && (
                      <>
                        <rect x={-tw / 2} y={-sz - sw(20)} width={tw} height={sw(13)} rx={sw(3)}
                          fill="rgba(255,248,210,0.97)" stroke="rgba(139,105,20,0.5)" strokeWidth={sw(0.9)} />
                        <text x="0" y={-sz - sw(12)} textAnchor="middle"
                          fontSize={hov ? sw(10) : sw(8.5)} fontFamily="Georgia,serif"
                          fontWeight="bold" fill="#3d2b0a">{p.label}</text>
                      </>
                    )}
                  </g>
                </Marker>
              );
            })}

            {/* Navires */}
            {ships.map(ship => (
              <Marker key={ship.uid} coordinates={[ship.lon, ship.lat]}>
                <g
                  transform={`scale(${1 / zoom})`}
                  onClick={() => setSel(p => p?.uid === ship.uid ? null : ship)}
                  onMouseEnter={() => setHovShip(ship)}
                  onMouseLeave={() => setHovShip(null)}
                >
                  <ShipSVG
                    isMe={ship.isMe}
                    logo={ship.logo}
                    nom={ship.nom}
                    selected={sel?.uid === ship.uid}
                    frame={frame}
                    po={ship.po}
                  />
                </g>
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>

        {/* Contrôles zoom */}
        <div style={{ position: "absolute", top: 52, right: 14, display: "flex", flexDirection: "column", gap: 5, zIndex: 10 }}>
          {[["＋", () => setZoom(z => Math.min(8, z + 0.5))],
            ["－", () => setZoom(z => Math.max(1, z - 0.5))],
            ["⌂", () => { setZoom(1); setCenter([20, 20]); }]].map(([label, fn]) => (
            <button key={label} onClick={fn} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,248,210,0.96)", border: "1.5px solid rgba(139,105,20,0.5)", color: "#3d2b0a", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Boussole */}
        <div style={{ position: "absolute", bottom: 14, left: 14 }}>
          <svg width="86" height="86" viewBox="0 0 86 86">
            <defs>
              <radialGradient id="cBg" cx="48%" cy="38%" r="56%">
                <stop offset="0%" stopColor="#fff8de" /><stop offset="55%" stopColor="#f0d060" />
                <stop offset="100%" stopColor="#b88828" />
              </radialGradient>
            </defs>
            <circle cx="43" cy="43" r="41" fill="url(#cBg)" stroke="#8B6914" strokeWidth="2.5" />
            <circle cx="43" cy="43" r="33" fill="none" stroke="rgba(139,105,20,0.2)" strokeWidth="0.8" />
            {Array.from({ length: 32 }, (_, i) => (
              <line key={i} x1="43" y1={i % 8 === 0 ? 6 : i % 4 === 0 ? 9 : 13} x2="43" y2="16"
                stroke="rgba(90,50,8,0.33)" strokeWidth={i % 8 === 0 ? 1.6 : 0.5}
                transform={`rotate(${i * 11.25},43,43)`} />
            ))}
            <polygon points="43,7 39,43 43,35 47,43" fill="#c0392b" />
            <polygon points="43,79 39,43 43,51 47,43" fill="rgba(130,90,15,0.52)" />
            <polygon points="7,43 43,39 35,43 43,47" fill="rgba(130,90,15,0.52)" />
            <polygon points="79,43 43,39 51,43 43,47" fill="rgba(130,90,15,0.52)" />
            {[["N", 43, 5.5, "#c0392b"], ["S", 43, 83, "#5d3a10"], ["E", 83, 45, "#5d3a10"], ["W", 5, 45, "#5d3a10"]].map(([l, x, y, c]) => (
              <text key={l} x={x} y={y} textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="Georgia,serif" fill={c}>{l}</text>
            ))}
            <circle cx="43" cy="43" r="5" fill="#d4a017" stroke="#8B6914" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Bannière */}
        <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg,#8a5208,#d89820 18%,#f8c845 50%,#d89820 82%,#8a5208)", border: "2.5px solid #6a4008", borderRadius: 3, padding: "8px 38px 6px", boxShadow: "0 5px 20px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,230,100,0.3)", whiteSpace: "nowrap", clipPath: "polygon(14px 0%,calc(100% - 14px) 0%,100% 50%,calc(100% - 14px) 100%,14px 100%,0% 50%)" }}>
          <div style={{ fontSize: "clamp(11px,1.8vw,19px)", fontWeight: "bold", color: "#2a0f02", letterSpacing: "3px", textAlign: "center", textShadow: "0 1px 0 rgba(255,210,80,0.5)" }}>EMPIRE DES MERS</div>
          <div style={{ fontSize: "clamp(8px,1vw,10px)", color: "rgba(42,15,2,0.65)", textAlign: "center", fontStyle: "italic", marginTop: 1, letterSpacing: "1px" }}>Le Grand Jeu de Croisière</div>
        </div>
      </div>

      {/* HUD */}
      <div style={{ position: "absolute", top: 74, left: 26, zIndex: 10, background: "rgba(255,248,210,0.97)", border: "1px solid rgba(139,105,20,0.45)", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#3d2b0a", boxShadow: "0 2px 8px rgba(0,0,0,0.28)" }}>
        ⛴ {total} navire{total > 1 ? "s" : ""} en mer
        {mine > 0 && <><span style={{ margin: "0 6px", opacity: 0.4 }}>·</span><span style={{ color: "#d97706", fontWeight: 700 }}>⭐ {mine} à moi</span></>}
        <span style={{ marginLeft: 10, fontSize: 10, color: "rgba(139,105,20,0.55)" }}>🔍 {zoom.toFixed(1)}x</span>
      </div>

      {/* Tooltip */}
      {hovShip && !sel && (
        <div style={{ position: "absolute", top: "38%", right: 16, zIndex: 20, width: 215, background: "rgba(255,248,210,0.98)", border: "2px solid rgba(139,105,20,0.5)", borderRadius: 12, padding: "12px 14px", boxShadow: "0 6px 24px rgba(0,0,0,0.38)", pointerEvents: "none" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2c1a06" }}>{hovShip.logo} {hovShip.compNom}</div>
          <div style={{ fontSize: 14, color: "#c05c0a", fontWeight: 700, marginTop: 3 }}>{hovShip.flag} {hovShip.nom}</div>
          <hr style={{ border: "none", borderTop: "1px solid rgba(139,105,20,0.25)", margin: "7px 0" }} />
          {[["🗺", hovShip.route], ["➡️", hovShip.next], ["✈️", `${hovShip.voyages} voyages`], ["😊", `${hovShip.sat}/100`]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5d4e37", marginTop: 4 }}>
              <span>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          {hovShip.isMe && <div style={{ marginTop: 8, textAlign: "center", fontSize: 11, color: "#d97706", fontWeight: 700 }}>⭐ Votre navire</div>}
        </div>
      )}

      {/* Fiche sélection */}
      {sel && (
        <div style={{ position: "absolute", top: "28%", right: 16, zIndex: 20, width: 228, background: "rgba(255,248,210,0.99)", border: "2.5px solid rgba(139,105,20,0.6)", borderRadius: 14, padding: "14px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.45)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2c1a06" }}>{sel.logo} {sel.compNom}</div>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#8b6914", lineHeight: 1 }} onClick={() => setSel(null)}>✕</button>
          </div>
          <div style={{ fontSize: 16, color: "#c05c0a", fontWeight: 700, marginTop: 5 }}>{sel.flag} {sel.nom}</div>
          <hr style={{ border: "none", borderTop: "1px solid rgba(139,105,20,0.28)", margin: "9px 0" }} />
          {[["🗺 Route", sel.route.slice(0, 24)], ["➡️ Prochain", sel.next], ["✈️ Voyages", sel.voyages], ["😊 Satisfaction", `${sel.sat}/100`]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11 }}>
              <span style={{ color: "#5d4e37" }}>{k}</span>
              <span style={{ color: "#2c1a06", fontWeight: 700 }}>{v}</span>
            </div>
          ))}
          {sel.isMe && <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: "#d97706", fontWeight: 700, background: "rgba(251,191,36,0.15)", borderRadius: 8, padding: "5px" }}>⭐ Votre navire</div>}
        </div>
      )}

      {/* Légende */}
      <div style={{ position: "absolute", bottom: 18, right: 18, zIndex: 10, background: "rgba(255,248,210,0.96)", border: "1.5px solid rgba(139,105,20,0.45)", borderRadius: 10, padding: "9px 13px", boxShadow: "0 2px 10px rgba(0,0,0,0.22)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#8b6914", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5, paddingBottom: 3, borderBottom: "1px solid rgba(139,105,20,0.2)" }}>ROUTES</div>
        {ROUTES.map(rt => (
          <div key={rt.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10, color: "#3d2b0a", marginTop: 3 }}>
            <div style={{ width: 22, height: 3, background: rt.color, borderRadius: 2, border: "1px dashed rgba(0,0,0,0.15)" }} />{rt.label}
          </div>
        ))}
      </div>
    </div>
  );
}
