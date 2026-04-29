import { useState, useEffect, useRef } from "react";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";

// ── Vraies données géographiques Natural Earth ────────────────────────────────
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ── Ports (coordonnées lon/lat réelles) ───────────────────────────────────────
const PORTS = {
  barcelone      : { lon:  2.2, lat: 41.4, label: "Barcelone",  major: true  },
  genes          : { lon:  8.9, lat: 44.4, label: "Gênes",       major: true  },
  civitavecchia  : { lon: 11.8, lat: 42.1, label: "Rome",        major: true  },
  naples         : { lon: 14.3, lat: 40.8, label: "Naples",      major: false },
  la_valette     : { lon: 14.5, lat: 35.9, label: "Malte",       major: false },
  athenes_piree  : { lon: 23.6, lat: 37.9, label: "Athènes",    major: true  },
  santorin       : { lon: 25.4, lat: 36.4, label: "Santorin",   major: false },
  istanbul       : { lon: 29.0, lat: 41.0, label: "Istanbul",   major: true  },
  venise         : { lon: 12.3, lat: 45.4, label: "Venise",     major: true  },
  dubrovnik      : { lon: 18.1, lat: 42.7, label: "Dubrovnik",  major: false },
  kotor          : { lon: 18.8, lat: 42.4, label: "Kotor",      major: false },
  lisbonne       : { lon: -9.1, lat: 38.7, label: "Lisbonne",   major: true  },
  funchal        : { lon:-16.9, lat: 32.6, label: "Madère",     major: false },
  tenerife       : { lon:-16.3, lat: 28.5, label: "Tenerife",   major: false },
  casablanca     : { lon: -7.6, lat: 33.6, label: "Casablanca", major: false },
  miami          : { lon:-80.2, lat: 25.8, label: "Miami",      major: true  },
  nassau         : { lon:-77.4, lat: 25.1, label: "Nassau",     major: false },
  cozumel        : { lon:-86.9, lat: 20.5, label: "Cozumel",    major: false },
  ocho_rios      : { lon:-77.1, lat: 18.4, label: "Jamaïque",   major: false },
  le_cap         : { lon: 18.4, lat:-33.9, label: "Le Cap",     major: false },
  dubai          : { lon: 55.3, lat: 25.2, label: "Dubaï",      major: true  },
  singapour      : { lon:103.8, lat:  1.3, label: "Singapour",  major: true  },
  hong_kong      : { lon:114.2, lat: 22.3, label: "Hong Kong",  major: false },
};

const ROUTES = [
  { id:"atl",  ports:["lisbonne","tenerife","miami"],             color:"#9333ea", label:"Atlantique"   },
  { id:"med",  ports:["barcelone","civitavecchia","la_valette","athenes_piree"], color:"#f59e0b", label:"Méditerranée" },
  { id:"adr",  ports:["venise","dubrovnik","kotor","athenes_piree"],             color:"#3b82f6", label:"Adriatique"   },
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

// ── Couleur cartoon par pays (biome réel) ─────────────────────────────────────
function getCountryStyle(geoName = "") {
  const n = geoName.toLowerCase();

  // Désert / aride
  if (/algeria|libya|egypt|saudi|niger|mali|chad|sudan|mauritania|western sahara|mongolia|gobi|namibia/.test(n))
    return { fill: "#d4a855", stroke: "#b8883a", strokeWidth: 0.8 };

  // Forêt tropicale / jungle
  if (/brazil|congo|indonesia|malaysia|colombia|peru|venezuela|cameroon|papua|gabon|equatorial/.test(n))
    return { fill: "#3d9e3a", stroke: "#256022", strokeWidth: 0.8 };

  // Afrique sub-saharienne
  if (/nigeria|tanzania|kenya|mozambique|zimbabwe|angola|zambia|ethiopia|ghana|ivory|senegal|somalia|madagascar/.test(n))
    return { fill: "#8ab830", stroke: "#5a8020", strokeWidth: 0.8 };

  // Afrique du Sud / australie
  if (/south africa|australia/.test(n))
    return { fill: "#c8a845", stroke: "#8a7020", strokeWidth: 0.8 };

  // Asie centrale / steppes
  if (/kazakhstan|uzbekistan|turkmenistan|afghanistan|iran|pakistan/.test(n))
    return { fill: "#c0a050", stroke: "#906820", strokeWidth: 0.7 };

  // Asie du sud-est tropical
  if (/vietnam|thailand|myanmar|cambodia|philippines|laos/.test(n))
    return { fill: "#4aaa3a", stroke: "#287020", strokeWidth: 0.8 };

  // Chine / Asie est
  if (/china|japan|korea/.test(n))
    return { fill: "#7ab860", stroke: "#4a8030", strokeWidth: 0.8 };

  // Inde
  if (/india/.test(n))
    return { fill: "#a0c055", stroke: "#608025", strokeWidth: 0.8 };

  // Russie / Canada / nordiques (taïga)
  if (/russia|canada|finland|sweden|norway/.test(n))
    return { fill: "#6aaa5a", stroke: "#3a7030", strokeWidth: 0.8 };

  // USA / Amérique centrale
  if (/united states|mexico|argentina|chile|bolivia|paraguay|uruguay/.test(n))
    return { fill: "#78b855", stroke: "#488030", strokeWidth: 0.8 };

  // Europe de l'ouest (verdoyant)
  if (/france|germany|spain|italy|poland|romania|united kingdom|ireland|portugal|austria|switzerland|belgium|netherlands|denmark/.test(n))
    return { fill: "#8cc870", stroke: "#508040", strokeWidth: 0.8 };

  // Groenland / Antarctique / zones polaires
  if (/greenland|antarctica|iceland/.test(n))
    return { fill: "#d8ecf0", stroke: "#90b0c0", strokeWidth: 0.8 };

  // Moyen-Orient
  if (/turkey|iraq|syria|jordan|israel|lebanon|yemen|oman|kuwait|bahrain|qatar|uae/.test(n))
    return { fill: "#c4a050", stroke: "#907030", strokeWidth: 0.8 };

  // Défaut — vert moyen
  return { fill: "#7ab860", stroke: "#4a8030", strokeWidth: 0.8 };
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function GameMap({ gameData, myCompany }) {
  const [sel,     setSel]     = useState(null);
  const [hovShip, setHovShip] = useState(null);
  const [hovPort, setHovPort] = useState(null);
  const [frame,   setFrame]   = useState(0);
  const [ships,   setShips]   = useState(
    DEMO_SHIPS.map(s => ({ ...s, po: Math.random() * Math.PI * 2 }))
  );
  const animRef = useRef(null);
  const lastT   = useRef(0);

  // ── Animation ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = t => {
      if (t - lastT.current > 120) { setFrame(f => f + 1); lastT.current = t; }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // ── Ships depuis gameData ───────────────────────────────────────────────────
  useEffect(() => {
    if (!gameData?.companies) return;
    const built = [];
    for (const co of Object.values(gameData.companies)) {
      for (const nav of (co.flotte || [])) {
        if (!nav.routeActive) continue;
        const route = gameData.routes?.find(r => r.id === nav.routeActive);
        const pts   = route ? [route.hub_depart, ...route.escales, route.hub_arrivee] : [];
        const isMe  = myCompany?.ownerId === co.ownerId;
        const now = Date.now(), start = nav.routeAssignedAt || now - 86400000;
        const total = (route?.duree || 7) * 86400000;
        const ratio = ((now - start) % total) / total;
        const segs  = Math.max(1, pts.length - 1);
        const si    = Math.min(Math.floor(ratio * segs), segs - 1);
        const sr    = ratio * segs - si;
        const pA    = PORTS[pts[si]], pB = PORTS[pts[si + 1]];
        if (!pA) continue;
        built.push({
          uid: nav.uid, nom: nav.nom, flag: nav.flag || "", logo: co.logo,
          compNom: co.nom, isMe,
          lon: pA.lon + (pB ? (pB.lon - pA.lon) * sr : 0),
          lat: pA.lat + (pB ? (pB.lat - pA.lat) * sr : 0),
          route: route?.label || "", next: pB ? PORTS[pts[si+1]]?.label : "Arrivée",
          voyages: nav.voyages || 0, sat: nav.satisfactionMoyenne || 70,
          po: Math.random() * Math.PI * 2,
        });
      }
    }
    if (built.length > 0) setShips(built);
  }, [gameData, myCompany]);

  const total = ships.length, mine = ships.filter(s => s.isMe).length;

  return (
    <div style={{ position:"relative", width:"100%", height:"100%", overflow:"hidden", fontFamily:"Georgia,serif" }}>

      {/* ── Bordure parchemin ── */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#c8843c,#e8b040,#c07030)", zIndex:0, pointerEvents:"none" }}/>
      <div style={{ position:"absolute", inset:12, border:"4px dashed rgba(90,45,5,0.5)", borderRadius:6, pointerEvents:"none", zIndex:20 }}/>
      {[["10px","10px"],["auto","10px"],["10px","auto"],["auto","auto"]].map(([t,b],i) => (
        <div key={i} style={{ position:"absolute", top:i<2?10:"auto", bottom:i>=2?10:"auto", left:i%2===0?10:"auto", right:i%2===1?10:"auto", fontSize:18, color:"rgba(70,30,5,0.5)", zIndex:21, pointerEvents:"none" }}>⚓</div>
      ))}

      {/* ── Carte SVG ── */}
      <div style={{ position:"absolute", inset:20, borderRadius:4, overflow:"hidden", zIndex:2 }}>
        <ComposableMap
          width={960}
          height={500}
          projection="geoMercator"
          projectionConfig={{ center:[20, 25], scale:148 }}
          style={{ width:"100%", height:"100%", display:"block" }}
        >
          <defs>
            {/* Pattern vagues océan */}
            <pattern id="wv" x="0" y="0" width="60" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q15 3 30 10 Q45 17 60 10" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2"/>
            </pattern>
            {/* Pattern grain sur terres */}
            <pattern id="gr" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.6" fill="rgba(0,0,0,0.06)"/>
              <circle cx="4" cy="4" r="0.4" fill="rgba(0,0,0,0.04)"/>
            </pattern>
          </defs>

          {/* Fond océan */}
          <rect x="-1000" y="-1000" width="3000" height="2000" fill="#1878b8"/>
          {/* Reflet lumineux */}
          <ellipse cx="320" cy="140" rx="380" ry="260" fill="rgba(80,170,240,0.18)"/>
          {/* Profondeur côtes */}
          <ellipse cx="480" cy="300" rx="500" ry="200" fill="rgba(10,60,120,0.12)"/>
          {/* Vagues */}
          <rect x="-1000" y="-1000" width="3000" height="2000" fill="url(#wv)"/>

          {/* Noms des mers */}
          {[
            { t:"OCÉAN ATLANTIQUE", lon:-28, lat:8   },
            { t:"OCÉAN PACIFIQUE",  lon:-145,lat:12  },
            { t:"OCÉAN INDIEN",     lon:72,  lat:-18 },
            { t:"ARCTIQUE",         lon:20,  lat:74  },
            { t:"MER MÉDITERRANÉE", lon:16,  lat:36  },
            { t:"MER CARAÏBES",     lon:-74, lat:16  },
            { t:"MER ROUGE",        lon:37,  lat:18  },
          ].map(({ t, lon, lat }) => (
            <Marker key={t} coordinates={[lon, lat]}>
              <text textAnchor="middle" fontSize="7.5" fontFamily="Georgia,serif"
                fontWeight="bold" fill="rgba(255,255,255,0.38)" letterSpacing="0.8">
                {t}
              </text>
            </Marker>
          ))}

          {/* ── Continents — vraies formes Natural Earth ── */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const { fill, stroke, strokeWidth } = getCountryStyle(geo.properties?.name || "");
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: { fill, stroke, strokeWidth, outline:"none" },
                      hover:   { fill, stroke, strokeWidth, outline:"none" },
                      pressed: { fill, stroke, strokeWidth, outline:"none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* ── Grain sur les terres ── */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey + "_g"}
                  geography={geo}
                  style={{
                    default: { fill:"url(#gr)", stroke:"none", strokeWidth:0, outline:"none", pointerEvents:"none" },
                    hover:   { fill:"url(#gr)", stroke:"none", strokeWidth:0, outline:"none", pointerEvents:"none" },
                    pressed: { fill:"url(#gr)", stroke:"none", strokeWidth:0, outline:"none", pointerEvents:"none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* ── Trait de côte cartoon (plus épais et sombre) ── */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey + "_c"}
                  geography={geo}
                  style={{
                    default: { fill:"none", stroke:"rgba(30,80,15,0.6)", strokeWidth:1.5, outline:"none", pointerEvents:"none" },
                    hover:   { fill:"none", stroke:"rgba(30,80,15,0.6)", strokeWidth:1.5, outline:"none", pointerEvents:"none" },
                    pressed: { fill:"none", stroke:"rgba(30,80,15,0.6)", strokeWidth:1.5, outline:"none", pointerEvents:"none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* ── Routes pointillées ── */}
          {ROUTES.map(rt => {
            const pts = rt.ports.map(id => PORTS[id]).filter(Boolean);
            return pts.slice(0, -1).map((pA, i) => [
              // Ombre route
              <Line key={`${rt.id}_shadow_${i}`}
                from={[pA.lon, pA.lat]} to={[pts[i+1].lon, pts[i+1].lat]}
                stroke="rgba(0,0,0,0.3)" strokeWidth={4}
                strokeLinecap="round" strokeDasharray="7,11"
              />,
              // Route colorée
              <Line key={`${rt.id}_${i}`}
                from={[pA.lon, pA.lat]} to={[pts[i+1].lon, pts[i+1].lat]}
                stroke={rt.color} strokeWidth={2.6}
                strokeLinecap="round" strokeDasharray="7,11"
              />,
            ]);
          })}

          {/* ── Décos ── */}
          {[
            [-35,  8, "🐋", 22], [-155, 12, "🐋", 20], [75, -18, "🐋", 18],
            [-70, 18, "🌴", 18], [ 60, -10, "🌴", 16], [-140,-18, "🐬", 16],
            [ 90, -50, "🧊", 18], [-50, 60, "🧊", 16],
          ].map(([lon, lat, e, sz], i) => (
            <Marker key={i} coordinates={[lon, lat]}>
              <text fontSize={sz} textAnchor="middle" dominantBaseline="middle"
                style={{ userSelect:"none", filter:"drop-shadow(1px 2px 2px rgba(0,0,0,0.25))" }}>
                {e}
              </text>
            </Marker>
          ))}

          {/* ── Ports ── */}
          {Object.entries(PORTS).map(([id, p]) => {
            const sz  = p.major ? 6 : 4;
            const hov = hovPort === id;
            const tw  = p.label.length * 7 + 12;
            return (
              <Marker key={id} coordinates={[p.lon, p.lat]}>
                <g
                  onMouseEnter={() => setHovPort(id)}
                  onMouseLeave={() => setHovPort(null)}
                  style={{ cursor:"default" }}
                >
                  {/* Halo */}
                  <circle r={sz + 3} fill="rgba(255,255,255,0.7)"/>
                  {/* Point */}
                  <circle r={sz} fill={hov ? "#f59e0b" : p.major ? "#e74c3c" : "#e67e22"}
                    stroke="rgba(0,0,0,0.25)" strokeWidth="0.8"/>
                  {/* Étiquette parchemin */}
                  {(p.major || hov) && (
                    <>
                      <rect x={-tw/2} y={-sz-20} width={tw} height={14} rx="3"
                        fill="rgba(255,248,210,0.97)" stroke="rgba(139,105,20,0.5)" strokeWidth="0.9"/>
                      <text x="0" y={-sz-10} textAnchor="middle"
                        fontSize={hov ? "10" : "8.5"} fontFamily="Georgia,serif"
                        fontWeight="bold" fill="#3d2b0a">
                        {p.label}
                      </text>
                    </>
                  )}
                </g>
              </Marker>
            );
          })}

          {/* ── Navires SVG illustrés ── */}
          {ships.map(ship => {
            const isSel = sel?.uid === ship.uid;
            const isHov = hovShip?.uid === ship.uid;
            const pulse = Math.sin(frame * 0.045 + (ship.po || 0));
            const aura  = 12 + pulse * 4;
            const wf    = pulse * 2.5;
            const isMe  = ship.isMe;

            const hullColor = isMe ? "#c0392b" : "#8e44ad";
            const hullDark  = isMe ? "#7b241c" : "#6c3483";
            const superCol  = isMe ? "#e74c3c" : "#9b59b6";
            const chimneyC  = isMe ? "#c0392b" : "#7d3c98";
            const flagC     = isMe ? "#f39c12" : "#e74c3c";
            const bubBlue   = "#3498db";

            return (
              <Marker key={ship.uid} coordinates={[ship.lon, ship.lat]}>
                <g
                  onClick={() => setSel(p => p?.uid === ship.uid ? null : ship)}
                  onMouseEnter={() => setHovShip(ship)}
                  onMouseLeave={() => setHovShip(null)}
                  style={{ cursor:"pointer" }}
                >
                  {/* Sillage */}
                  {[14, 22, 30].map(r => (
                    <circle key={r} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                  ))}

                  {/* Aura navire principal */}
                  {isMe && (
                    <circle r={aura + 14} fill={`rgba(255,215,0,${0.18 + pulse * 0.1})`}/>
                  )}

                  {/* Cercle sélection */}
                  {(isSel || isHov) && (
                    <circle r={30} fill="none"
                      stroke={isMe ? "rgba(255,215,0,0.9)" : "rgba(255,255,255,0.7)"}
                      strokeWidth="2.5" strokeDasharray="5,4"/>
                  )}

                  {/* ── Navire SVG ── */}
                  <g transform={`translate(-18,-26) scale(${isMe ? 1.15 : 0.95})`}>
                    {/* Coque */}
                    <path d="M0 20 L36 20 L32 30 L4 30 Z"
                      fill={hullColor} stroke={hullDark} strokeWidth="1.4"/>
                    {/* Ligne de flottaison */}
                    <line x1="3" y1="25" x2="33" y2="25" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                    {/* Pont */}
                    <rect x="3" y="11" width="30" height="10" rx="2"
                      fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="1"/>
                    {/* Fenêtres pont */}
                    {[5, 11, 17, 23].map(x => (
                      <rect key={x} x={x} y="13" width="4" height="6" rx="0.8"
                        fill={bubBlue} stroke="#2980b9" strokeWidth="0.5"/>
                    ))}
                    {/* Superstructure */}
                    <rect x="8" y="1" width="20" height="11" rx="3"
                      fill={superCol} stroke={chimneyC} strokeWidth="1"/>
                    {/* Hublots superstructure */}
                    {[12, 20].map(x => (
                      <circle key={x} cx={x} cy="5" r="2.2"
                        fill={bubBlue} stroke="#2980b9" strokeWidth="0.6"/>
                    ))}
                    {/* Cheminée */}
                    <rect x="15" y="-9" width="7" height="11" rx="1.5"
                      fill={chimneyC} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8"/>
                    {/* Bande déco cheminée */}
                    <rect x="15" y="-5" width="7" height="2.5" fill="rgba(255,255,255,0.3)"/>
                    {/* Fumée */}
                    {[0, 1, 2].map(i => (
                      <circle key={i}
                        cx={18.5 - i * 2} cy={-13 - i * 5 + pulse * 1.5}
                        r={3.5 + i * 2.5} fill={`rgba(200,200,200,${0.48 - i * 0.12})`}/>
                    ))}
                    {/* Mât */}
                    <line x1="18" y1="1" x2="18" y2="-24"
                      stroke="#95a5a6" strokeWidth="1.3"/>
                    {/* Cordages */}
                    <line x1="5" y1="11" x2="18" y2="-22"
                      stroke="rgba(140,120,80,0.45)" strokeWidth="0.7"/>
                    <line x1="31" y1="11" x2="18" y2="-22"
                      stroke="rgba(140,120,80,0.45)" strokeWidth="0.7"/>
                    {/* Drapeau animé */}
                    <path d={`M18 -24 L${28 + wf} -18 L18 -12 Z`} fill={flagC}/>
                    {/* Ancre déco */}
                    <text x="34" y="33" fontSize="9" fill="rgba(255,255,255,0.55)">⚓</text>
                  </g>

                  {/* Bulle logo */}
                  <g transform="translate(0,-56)">
                    <rect x="-14" y="-9" width="28" height="16" rx="5"
                      fill={isMe ? "rgba(253,230,100,0.97)" : "rgba(255,255,255,0.95)"}
                      stroke={isMe ? "#d97706" : "rgba(0,0,0,0.2)"} strokeWidth="1.3"/>
                    <path d="M-5 7 L5 7 L0 14 Z"
                      fill={isMe ? "rgba(253,230,100,0.97)" : "rgba(255,255,255,0.95)"}/>
                    <text x="0" y="4" textAnchor="middle" fontSize="12"
                      dominantBaseline="middle">{ship.logo}</text>
                  </g>

                  {/* Nom si sélectionné */}
                  {isSel && (
                    <text y="52" textAnchor="middle" fontSize="10.5"
                      fontFamily="Georgia,serif" fontWeight="bold"
                      fill="white" stroke="rgba(0,0,0,0.75)" strokeWidth="3"
                      paintOrder="stroke">
                      {ship.nom.slice(0, 18)}
                    </text>
                  )}
                </g>
              </Marker>
            );
          })}
        </ComposableMap>

        {/* ── Boussole ornée ── */}
        <div style={{ position:"absolute", bottom:14, left:14 }}>
          <svg width="92" height="92" viewBox="0 0 92 92">
            <defs>
              <radialGradient id="cBg" cx="48%" cy="38%" r="56%">
                <stop offset="0%" stopColor="#fff8de"/>
                <stop offset="55%" stopColor="#f0d060"/>
                <stop offset="100%" stopColor="#b88828"/>
              </radialGradient>
            </defs>
            <circle cx="46" cy="46" r="44" fill="url(#cBg)" stroke="#8B6914" strokeWidth="2.8"/>
            <circle cx="46" cy="46" r="35" fill="none" stroke="rgba(139,105,20,0.22)" strokeWidth="0.9"/>
            {Array.from({ length:32 }, (_, i) => (
              <line key={i} x1="46" y1={i%8===0?6:i%4===0?9:13} x2="46" y2="17"
                stroke="rgba(90,50,8,0.35)" strokeWidth={i%8===0?1.8:0.6}
                transform={`rotate(${i*11.25},46,46)`}/>
            ))}
            <polygon points="46,7 41,46 46,36 51,46" fill="#c0392b" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
            <polygon points="46,85 41,46 46,56 51,46" fill="rgba(130,90,15,0.55)"/>
            <polygon points="7,46 46,41 36,46 46,51" fill="rgba(130,90,15,0.55)"/>
            <polygon points="85,46 46,41 56,46 46,51" fill="rgba(130,90,15,0.55)"/>
            {[["N",46,5.5,"#c0392b"],["S",46,88,"#5d3a10"],["E",88,48,"#5d3a10"],["W",5,48,"#5d3a10"]].map(([l,x,y,c]) => (
              <text key={l} x={x} y={y} textAnchor="middle" fontSize="11.5"
                fontWeight="bold" fontFamily="Georgia,serif" fill={c}>{l}</text>
            ))}
            <circle cx="46" cy="46" r="5.5" fill="#d4a017" stroke="#8B6914" strokeWidth="1.3"/>
          </svg>
        </div>

        {/* ── Bannière "EMPIRE DES MERS" ── */}
        <div style={{
          position:"absolute", top:10, left:"50%", transform:"translateX(-50%)",
          background:"linear-gradient(90deg,#8a5208 0%,#d89820 18%,#f8c845 50%,#d89820 82%,#8a5208 100%)",
          border:"2.5px solid #6a4008", borderRadius:3,
          padding:"9px 40px 7px",
          boxShadow:"0 5px 20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,230,100,0.3)",
          whiteSpace:"nowrap",
          clipPath:"polygon(16px 0%,calc(100% - 16px) 0%,100% 50%,calc(100% - 16px) 100%,16px 100%,0% 50%)",
        }}>
          <div style={{ fontSize:"clamp(12px,1.9vw,20px)", fontWeight:"bold", color:"#2a0f02", letterSpacing:"3px", textAlign:"center", textShadow:"0 1px 0 rgba(255,210,80,0.5)" }}>
            EMPIRE DES MERS
          </div>
          <div style={{ fontSize:"clamp(8px,1vw,11px)", color:"rgba(42,15,2,0.65)", textAlign:"center", fontStyle:"italic", marginTop:2, letterSpacing:"1px" }}>
            Le Grand Jeu de Croisière
          </div>
        </div>

        {/* Parchemin déco coin bas droit */}
        <div style={{ position:"absolute", bottom:10, right:10, fontSize:32, opacity:0.35, transform:"rotate(-12deg)", pointerEvents:"none" }}>📜</div>
      </div>

      {/* ── HUD compteur ── */}
      <div style={{ position:"absolute", top:75, left:26, zIndex:10, background:"rgba(255,248,210,0.96)", border:"1px solid rgba(139,105,20,0.45)", borderRadius:20, padding:"5px 14px", fontSize:12, color:"#3d2b0a", boxShadow:"0 2px 8px rgba(0,0,0,0.28)" }}>
        ⛴ {total} navire{total > 1 ? "s" : ""} en mer
        {mine > 0 && <span style={{ color:"#d97706", fontWeight:700 }}> · ⭐ {mine} à moi</span>}
      </div>

      {/* ── Tooltip navire survolé ── */}
      {hovShip && !sel && (
        <div style={{ position:"absolute", top:"38%", right:16, zIndex:20, width:215, background:"rgba(255,248,210,0.98)", border:"2px solid rgba(139,105,20,0.5)", borderRadius:12, padding:"12px 14px", boxShadow:"0 6px 24px rgba(0,0,0,0.38)", pointerEvents:"none" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#2c1a06" }}>{hovShip.logo} {hovShip.compNom}</div>
          <div style={{ fontSize:14, color:"#c05c0a", fontWeight:700, marginTop:3 }}>{hovShip.flag} {hovShip.nom}</div>
          <hr style={{ border:"none", borderTop:"1px solid rgba(139,105,20,0.25)", margin:"7px 0" }}/>
          {[["🗺", hovShip.route], ["➡️", hovShip.next], ["✈️", `${hovShip.voyages} voyages`], ["😊", `${hovShip.sat}/100`]].map(([k, v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#5d4e37", marginTop:4 }}>
              <span>{k}</span><span style={{ fontWeight:600 }}>{v}</span>
            </div>
          ))}
          {hovShip.isMe && <div style={{ marginTop:8, textAlign:"center", fontSize:11, color:"#d97706", fontWeight:700 }}>⭐ Votre navire</div>}
        </div>
      )}

      {/* ── Fiche navire sélectionné ── */}
      {sel && (
        <div style={{ position:"absolute", top:"30%", right:16, zIndex:20, width:230, background:"rgba(255,248,210,0.99)", border:"2.5px solid rgba(139,105,20,0.6)", borderRadius:14, padding:"14px 16px", boxShadow:"0 8px 32px rgba(0,0,0,0.45)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#2c1a06" }}>{sel.logo} {sel.compNom}</div>
            <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#8b6914", lineHeight:1 }} onClick={() => setSel(null)}>✕</button>
          </div>
          <div style={{ fontSize:16, color:"#c05c0a", fontWeight:700, marginTop:5 }}>{sel.flag} {sel.nom}</div>
          <hr style={{ border:"none", borderTop:"1px solid rgba(139,105,20,0.28)", margin:"9px 0" }}/>
          {[["🗺 Route", sel.route.slice(0,24)], ["➡️ Prochain", sel.next], ["✈️ Voyages", sel.voyages], ["😊 Satisfaction", `${sel.sat}/100`]].map(([k, v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11 }}>
              <span style={{ color:"#5d4e37" }}>{k}</span>
              <span style={{ color:"#2c1a06", fontWeight:700 }}>{v}</span>
            </div>
          ))}
          {sel.isMe && <div style={{ marginTop:10, textAlign:"center", fontSize:12, color:"#d97706", fontWeight:700, background:"rgba(251,191,36,0.15)", borderRadius:8, padding:"5px" }}>⭐ Votre navire</div>}
        </div>
      )}

      {/* ── Légende routes ── */}
      <div style={{ position:"absolute", bottom:18, right:18, zIndex:10, background:"rgba(255,248,210,0.96)", border:"1.5px solid rgba(139,105,20,0.45)", borderRadius:10, padding:"9px 13px", boxShadow:"0 2px 10px rgba(0,0,0,0.22)" }}>
        <div style={{ fontSize:9, fontWeight:700, color:"#8b6914", textTransform:"uppercase", letterSpacing:1.2, marginBottom:5, paddingBottom:3, borderBottom:"1px solid rgba(139,105,20,0.2)" }}>ROUTES</div>
        {ROUTES.map(rt => (
          <div key={rt.id} style={{ display:"flex", alignItems:"center", gap:7, fontSize:10, color:"#3d2b0a", marginTop:3 }}>
            <div style={{ width:22, height:3, background:rt.color, borderRadius:2, border:"1px dashed rgba(0,0,0,0.15)" }}/>
            {rt.label}
          </div>
        ))}
      </div>
    </div>
  );
}
