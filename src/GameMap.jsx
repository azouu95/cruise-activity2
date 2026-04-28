import { useState, useEffect, useRef } from "react";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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
  miami         : { lon:-80.2, lat: 25.8, label: "Miami",      major: true  },
  nassau        : { lon:-77.4, lat: 25.1, label: "Nassau",     major: false },
  cozumel       : { lon:-86.9, lat: 20.5, label: "Cozumel",    major: false },
  le_cap        : { lon: 18.4, lat:-33.9, label: "Le Cap",     major: false },
  dubai         : { lon: 55.3, lat: 25.2, label: "Dubaï",      major: true  },
  singapour     : { lon:103.8, lat:  1.3, label: "Singapour",  major: true  },
  hong_kong     : { lon:114.2, lat: 22.3, label: "Hong Kong",  major: false },
};

const ROUTES = [
  { id:"atl",  ports:["lisbonne","tenerife","miami"],            color:"#9333ea", label:"Atlantique"   },
  { id:"med",  ports:["barcelone","civitavecchia","la_valette","athenes_piree"], color:"#d97706", label:"Méditerranée" },
  { id:"adr",  ports:["venise","dubrovnik","santorin","athenes_piree"],          color:"#2563eb", label:"Adriatique"   },
  { id:"ege",  ports:["athenes_piree","istanbul"],               color:"#16a34a", label:"Égée"         },
  { id:"asie", ports:["dubai","singapour","hong_kong"],          color:"#dc2626", label:"Asie"         },
  { id:"car",  ports:["miami","nassau","cozumel"],               color:"#0891b2", label:"Caraïbes"     },
];

const DEMO_SHIPS = [
  { uid:"s1", nom:"La Belle Époque", flag:"🇫🇷", logo:"🌊", compNom:"Blue Ocean", isMe:true,  lon:  6.0, lat:43.5, route:"Méditerranée", next:"Rome",       voyages:12, sat:84 },
  { uid:"s2", nom:"Adriatica",       flag:"🇮🇹", logo:"🔴", compNom:"Red Sea",   isMe:false, lon: 15.5, lat:43.8, route:"Adriatique",   next:"Dubrovnik",  voyages:8,  sat:78 },
  { uid:"s3", nom:"Costa Brava",     flag:"🇪🇸", logo:"🟡", compNom:"Gold Lines",isMe:false, lon: 24.5, lat:37.2, route:"Égée",          next:"Santorin",   voyages:5,  sat:91 },
  { uid:"s4", nom:"Dubai Star",      flag:"🇦🇪", logo:"⭐", compNom:"Orient",    isMe:false, lon: 78.0, lat:12.5, route:"Asie",          next:"Singapour",  voyages:3,  sat:88 },
];

// Couleur d'un pays selon sa position géographique (pour effet illustré)
function getCountryColor(geo) {
  const name = geo.properties?.name || "";
  // Déserts / arides
  if (["Algeria","Libya","Egypt","Saudi Arabia","Niger","Mali","Chad","Sudan","Mongolia","Kazakhstan","Australia","Mauritania","Western Sahara"].some(n => name.includes(n))) {
    return { fill:"#d4a855", stroke:"#b8883a" };
  }
  // Forêts tropicales
  if (["Brazil","Congo","Indonesia","Malaysia","Colombia","Peru","Venezuela","Cameroon"].some(n => name.includes(n))) {
    return { fill:"#4a9e48", stroke:"#357030" };
  }
  // Steppes / prairies
  if (["Russia","Ukraine","Canada","United States","Argentina","Kazakhstan"].some(n => name.includes(n))) {
    return { fill:"#7ab860", stroke:"#5a9040" };
  }
  // Montagnes / hauts plateaux
  if (["Nepal","Tibet","Bolivia","Ethiopia","Afghanistan","Iran"].some(n => name.includes(n))) {
    return { fill:"#c8a855", stroke:"#a08035" };
  }
  // Europe (verdoyant)
  if (["France","Germany","Spain","Italy","Poland","Romania","United Kingdom","Sweden","Norway","Finland"].some(n => name.includes(n))) {
    return { fill:"#8cc870", stroke:"#5a9040" };
  }
  // Afrique sub-saharienne
  if (["Nigeria","Tanzania","Kenya","South Africa","Mozambique","Zimbabwe","Angola","Zambia"].some(n => name.includes(n))) {
    return { fill:"#a8c858", stroke:"#789035" };
  }
  // Asie du Sud-Est (tropical)
  if (["Vietnam","Thailand","Myanmar","Cambodia","Philippines"].some(n => name.includes(n))) {
    return { fill:"#5ab850", stroke:"#389030" };
  }
  // Défaut verdoyant
  return { fill:"#7ab860", stroke:"#4a8a30" };
}

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

  // Animation
  useEffect(() => {
    const loop = t => {
      if (t - lastT.current > 100) { setFrame(f => f + 1); lastT.current = t; }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Ships depuis gameData
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
          uid: nav.uid, nom: nav.nom, flag: nav.flag || '', logo: co.logo,
          compNom: co.nom, isMe,
          lon: pA.lon + (pB ? (pB.lon - pA.lon) * sr : 0),
          lat: pA.lat + (pB ? (pB.lat - pA.lat) * sr : 0),
          route: route?.label || '', next: pB ? PORTS[pts[si + 1]]?.label : 'Arrivée',
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

      {/* ── Fond parchemin ── */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#c8843c,#e8a840,#c07030)", zIndex:0 }}/>
      <div style={{ position:"absolute", inset:12, border:"4px dashed rgba(100,55,10,0.5)", borderRadius:6, pointerEvents:"none", zIndex:5 }}/>
      {/* Coins ⚓ */}
      {[[12,12],[null,12],[12,null],[null,null]].map(([l,t],i)=>(
        <div key={i} style={{position:"absolute",left:l??undefined,right:l===null?12:undefined,top:t??undefined,bottom:t===null?12:undefined,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"rgba(80,40,5,0.55)",zIndex:6,pointerEvents:"none"}}>⚓</div>
      ))}

      {/* ── Carte principale ── */}
      <div style={{ position:"absolute", inset:20, borderRadius:4, overflow:"hidden", zIndex:2 }}>
        <ComposableMap
          width={960}
          height={500}
          projection="geoMercator"
          projectionConfig={{ center:[20, 25], scale:148 }}
          style={{ width:"100%", height:"100%" }}
        >
          <defs>
            {/* Vagues océan */}
            <pattern id="waves" x="0" y="0" width="70" height="24" patternUnits="userSpaceOnUse">
              <path d="M0 12 Q17 4 35 12 Q52 20 70 12" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.3"/>
            </pattern>
            {/* Grain sur terres */}
            <pattern id="grain" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="transparent"/>
              <circle cx="2" cy="2" r="0.5" fill="rgba(0,0,0,0.07)"/>
            </pattern>
            {/* Ombre intérieure continent */}
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="2" dy="3" result="offsetblur"/>
              <feFlood floodColor="rgba(0,0,0,0.35)"/>
              <feComposite in2="offsetblur" operator="in" result="shadow"/>
              <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Océan */}
          <rect x="-500" y="-500" width="2500" height="1500" fill="#1a7bb8"/>
          {/* Dégradé océan radial via overlay */}
          <ellipse cx="300" cy="150" rx="400" ry="280" fill="rgba(60,160,230,0.22)"/>
          {/* Vagues */}
          <rect x="-500" y="-500" width="2500" height="1500" fill="url(#waves)"/>

          {/* Noms océans */}
          {[
            {t:"OCÉAN ATLANTIQUE",  lon:-28,  lat:  6},
            {t:"OCÉAN PACIFIQUE",   lon:-145, lat: 10},
            {t:"OCÉAN INDIEN",      lon:  72, lat:-18},
            {t:"ARCTIQUE",          lon:   0, lat: 74},
            {t:"MER MÉDITERRANÉE",  lon:  16, lat: 35},
            {t:"MER CARAÏBES",      lon: -75, lat: 16},
          ].map(({t,lon,lat})=>(
            <Marker key={t} coordinates={[lon,lat]}>
              <text textAnchor="middle" fontSize="8.5" fontFamily="Georgia,serif" fontWeight="bold"
                fill="rgba(255,255,255,0.4)" letterSpacing="0.5">{t}</text>
            </Marker>
          ))}

          {/* ── Continents avec couleurs par pays ── */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) => geographies.map(geo => {
              const { fill, stroke } = getCountryColor(geo);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill, stroke, strokeWidth:0.7, outline:"none" },
                    hover:   { fill, stroke, strokeWidth:0.7, outline:"none" },
                    pressed: { fill, stroke, strokeWidth:0.7, outline:"none" },
                  }}
                />
              );
            })}
          </Geographies>

          {/* ── Grain par-dessus les terres ── */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) => geographies.map(geo => (
              <Geography
                key={geo.rsmKey + "_g"}
                geography={geo}
                style={{
                  default: { fill:"url(#grain)", stroke:"none", outline:"none", pointerEvents:"none" },
                  hover:   { fill:"url(#grain)", stroke:"none", outline:"none", pointerEvents:"none" },
                  pressed: { fill:"url(#grain)", stroke:"none", outline:"none", pointerEvents:"none" },
                }}
              />
            ))}
          </Geographies>

          {/* Trait de côte plus visible */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) => geographies.map(geo => (
              <Geography
                key={geo.rsmKey + "_c"}
                geography={geo}
                style={{
                  default: { fill:"none", stroke:"rgba(40,90,20,0.55)", strokeWidth:1.4, outline:"none", pointerEvents:"none" },
                  hover:   { fill:"none", stroke:"rgba(40,90,20,0.55)", strokeWidth:1.4, outline:"none", pointerEvents:"none" },
                  pressed: { fill:"none", stroke:"rgba(40,90,20,0.55)", strokeWidth:1.4, outline:"none", pointerEvents:"none" },
                }}
              />
            ))}
          </Geographies>

          {/* ── Routes (pointillées) ── */}
          {ROUTES.map(rt => {
            const pts = rt.ports.map(id => PORTS[id]).filter(Boolean);
            return pts.slice(0,-1).map((pA,i) => (
              <Line key={`${rt.id}_${i}`}
                from={[pA.lon, pA.lat]} to={[pts[i+1].lon, pts[i+1].lat]}
                stroke={rt.color} strokeWidth={2.5}
                strokeLinecap="round" strokeDasharray="8,11"
              />
            ));
          })}

          {/* ── Décos océan ── */}
          {[[-35,8,"🐋"],[-155,12,"🐋"],[75,-18,"🐋"],[-70,18,"🌴"],[60,-10,"🌴"],[-140,-18,"🐬"]].map(([lon,lat,e],i)=>(
            <Marker key={i} coordinates={[lon,lat]}>
              <text fontSize={e==="🐋"?"22":"18"} textAnchor="middle" dominantBaseline="middle" style={{userSelect:"none"}}>{e}</text>
            </Marker>
          ))}

          {/* ── Ports ── */}
          {Object.entries(PORTS).map(([id,p]) => {
            const sz = p.major ? 5.5 : 3.5;
            const hov = hovPort === id;
            return (
              <Marker key={id} coordinates={[p.lon, p.lat]}>
                <g
                  onMouseEnter={() => setHovPort(id)}
                  onMouseLeave={() => setHovPort(null)}
                >
                  <circle r={sz+2.5} fill="rgba(255,255,255,0.85)"/>
                  <circle r={sz} fill={hov?"#f39c12":p.major?"#e74c3c":"#e67e22"} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8"/>
                  {(p.major || hov) && (
                    <>
                      <rect
                        x={-p.label.length*3.8-4} y={-sz-21}
                        width={p.label.length*7.5+8} height={14}
                        rx="3" fill="rgba(255,248,210,0.96)"
                        stroke="rgba(139,105,20,0.45)" strokeWidth="0.9"
                      />
                      <text x="0" y={-sz-12} textAnchor="middle"
                        fontSize={hov?"9.5":"8.5"} fontFamily="Georgia,serif"
                        fontWeight="bold" fill="#3d2b0a"
                      >{p.label}</text>
                    </>
                  )}
                </g>
              </Marker>
            );
          })}

          {/* ── Navires ── */}
          {ships.map(ship => {
            const isSel = sel?.uid === ship.uid;
            const isHov = hovShip?.uid === ship.uid;
            const pulse = Math.sin(frame * 0.045 + (ship.po || 0));
            const aura  = 10 + pulse * 3;
            const waveFlag = pulse * 2.5;

            return (
              <Marker key={ship.uid} coordinates={[ship.lon, ship.lat]}>
                <g
                  onClick={() => setSel(prev => prev?.uid === ship.uid ? null : ship)}
                  onMouseEnter={() => setHovShip(ship)}
                  onMouseLeave={() => setHovShip(null)}
                  style={{ cursor:"pointer" }}
                >
                  {/* Sillage */}
                  {[12,20,28].map(r => (
                    <circle key={r} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
                  ))}
                  {/* Aura mon navire */}
                  {ship.isMe && (
                    <circle r={aura+12} fill={`rgba(255,215,0,${0.18+pulse*0.1})`}/>
                  )}
                  {/* Sélection */}
                  {(isSel||isHov) && (
                    <circle r={28} fill="none"
                      stroke={ship.isMe?"rgba(255,215,0,0.9)":"rgba(255,255,255,0.7)"}
                      strokeWidth="2" strokeDasharray="5,4"/>
                  )}
                  {/* Navire SVG illustré */}
                  <g transform={`translate(-16,-22) scale(${ship.isMe?1.15:0.95})`}>
                    {/* Coque */}
                    <path d="M0 18 L32 18 L28 27 L4 27 Z"
                      fill={ship.isMe?"#c0392b":"#8e44ad"}
                      stroke={ship.isMe?"#7b241c":"#6c3483"} strokeWidth="1.3"/>
                    {/* Ligne de flottaison */}
                    <path d="M2 22 L30 22" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
                    {/* Pont */}
                    <rect x="3" y="10" width="26" height="9" rx="2"
                      fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="0.9"/>
                    {/* Fenêtres pont */}
                    {[6,11,16,21].map(x=>(
                      <rect key={x} x={x} y="12" width="3" height="5" rx="0.5"
                        fill="#aed6f1" stroke="#85c1e9" strokeWidth="0.5"/>
                    ))}
                    {/* Superstructure */}
                    <rect x="8" y="1" width="16" height="10" rx="2.5"
                      fill={ship.isMe?"#e74c3c":"#9b59b6"}
                      stroke={ship.isMe?"#c0392b":"#7d3c98"} strokeWidth="0.9"/>
                    {/* Hublots superstructure */}
                    {[12,19].map(x=>(
                      <circle key={x} cx={x} cy="5" r="1.8"
                        fill="#3498db" stroke="#2980b9" strokeWidth="0.5"/>
                    ))}
                    {/* Cheminée */}
                    <rect x="13" y="-8" width="6" height="10" rx="1"
                      fill={ship.isMe?"#c0392b":"#7d3c98"}
                      stroke="rgba(0,0,0,0.2)" strokeWidth="0.7"/>
                    {/* Bandes cheminée */}
                    <rect x="13" y="-5" width="6" height="2" fill="rgba(255,255,255,0.3)"/>
                    {/* Fumée animée */}
                    {[0,1,2].map(i=>(
                      <circle key={i} cx={16-i*1.5} cy={-11-i*5+pulse*1.5}
                        r={3+i*2} fill={`rgba(200,200,200,${0.45-i*0.12})`}/>
                    ))}
                    {/* Mât */}
                    <line x1="16" y1="1" x2="16" y2="-20"
                      stroke="#95a5a6" strokeWidth="1.2"/>
                    {/* Cordage */}
                    <line x1="5" y1="10" x2="16" y2="-18"
                      stroke="rgba(150,130,100,0.5)" strokeWidth="0.6"/>
                    <line x1="27" y1="10" x2="16" y2="-18"
                      stroke="rgba(150,130,100,0.5)" strokeWidth="0.6"/>
                    {/* Drapeau animé */}
                    <path d={`M16 -20 L${25+waveFlag} -15 L16 -10 Z`}
                      fill={ship.isMe?"#f39c12":"#e74c3c"}/>
                    {/* Ancre */}
                    <text x="32" y="30" fontSize="8" fill="rgba(255,255,255,0.6)">⚓</text>
                  </g>
                  {/* Bulle logo */}
                  <g transform="translate(0,-50)">
                    <rect x="-13" y="-8" width="26" height="15" rx="4"
                      fill={ship.isMe?"rgba(253,230,100,0.97)":"rgba(255,255,255,0.95)"}
                      stroke={ship.isMe?"#d97706":"rgba(0,0,0,0.2)"} strokeWidth="1.2"/>
                    <path d="M-4 7 L4 7 L0 13 Z"
                      fill={ship.isMe?"rgba(253,230,100,0.97)":"rgba(255,255,255,0.95)"}/>
                    <text x="0" y="4" textAnchor="middle" fontSize="11" dominantBaseline="middle">
                      {ship.logo}
                    </text>
                  </g>
                  {/* Nom si sélectionné */}
                  {isSel && (
                    <text y="45" textAnchor="middle" fontSize="10"
                      fontFamily="Georgia,serif" fontWeight="bold"
                      fill="white" stroke="rgba(0,0,0,0.7)" strokeWidth="3"
                      paintOrder="stroke">{ship.nom.slice(0,16)}</text>
                  )}
                </g>
              </Marker>
            );
          })}
        </ComposableMap>

        {/* ── Boussole ornée ── */}
        <div style={{ position:"absolute", bottom:14, left:14 }}>
          <svg width="88" height="88" viewBox="0 0 88 88">
            <defs>
              <radialGradient id="cBg" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#fff8e0"/>
                <stop offset="60%" stopColor="#f0d070"/>
                <stop offset="100%" stopColor="#c09030"/>
              </radialGradient>
            </defs>
            <circle cx="44" cy="44" r="42" fill="url(#cBg)" stroke="#8B6914" strokeWidth="2.5"/>
            <circle cx="44" cy="44" r="34" fill="none" stroke="rgba(139,105,20,0.2)" strokeWidth="0.8"/>
            {/* Points cardinaux déco */}
            {Array.from({length:32},(_,i)=>(
              <line key={i} x1="44" y1={i%8===0?6:i%4===0?9:12} x2="44" y2="15"
                stroke="rgba(100,60,10,0.35)" strokeWidth={i%8===0?1.5:.6}
                transform={`rotate(${i*11.25},44,44)`}/>
            ))}
            {/* Aiguilles */}
            <polygon points="44,8 40,44 44,38 48,44" fill="#c0392b" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
            <polygon points="44,80 40,44 44,50 48,44" fill="rgba(139,105,20,0.55)"/>
            <polygon points="8,44 44,40 38,44 44,48" fill="rgba(139,105,20,0.55)"/>
            <polygon points="80,44 44,40 50,44 44,48" fill="rgba(139,105,20,0.55)"/>
            {[["N",44,5.5,"#c0392b"],["S",44,85,"#5d3a10"],["E",85,46,"#5d3a10"],["W",4,46,"#5d3a10"]].map(([l,x,y,c])=>(
              <text key={l} x={x} y={y} textAnchor="middle" fontSize="10.5"
                fontWeight="bold" fontFamily="Georgia,serif" fill={c}>{l}</text>
            ))}
            <circle cx="44" cy="44" r="5" fill="#d4a017" stroke="#8B6914" strokeWidth="1.2"/>
          </svg>
        </div>

        {/* ── Bannière titre ── */}
        <div style={{
          position:"absolute", top:10, left:"50%", transform:"translateX(-50%)",
          background:"linear-gradient(90deg,#9a6010 0%,#e8a830 18%,#f8d060 50%,#e8a830 82%,#9a6010 100%)",
          border:"2px solid #7a5010", borderRadius:"3px",
          padding:"8px 32px 6px",
          boxShadow:"0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
          whiteSpace:"nowrap",
          clipPath:"polygon(12px 0%,calc(100% - 12px) 0%,100% 50%,calc(100% - 12px) 100%,12px 100%,0% 50%)",
        }}>
          <div style={{fontSize:"clamp(10px,1.7vw,17px)",fontWeight:"bold",color:"#3a1505",letterSpacing:"1.5px",textAlign:"center",textShadow:"0 1px 0 rgba(255,220,100,0.4)"}}>
            LE TOUR DU MONDE EN CROISIÈRE
          </div>
          <div style={{fontSize:"clamp(8px,1vw,10px)",color:"rgba(58,21,5,0.65)",textAlign:"center",fontStyle:"italic",marginTop:1}}>
            Planisphère du Jeu
          </div>
        </div>

        {/* ── Parchemin déco bas droite ── */}
        <div style={{ position:"absolute", bottom:14, right:14, fontSize:36, opacity:.4, transform:"rotate(-10deg)", pointerEvents:"none" }}>📜</div>
      </div>

      {/* ── HUD haut gauche ── */}
      <div style={{position:"absolute",top:72,left:26,zIndex:10,background:"rgba(255,248,210,0.96)",border:"1px solid rgba(139,105,20,0.45)",borderRadius:20,padding:"5px 14px",fontSize:12,color:"#3d2b0a",boxShadow:"0 2px 8px rgba(0,0,0,0.25)"}}>
        ⛴ {total} navire{total>1?"s":""} en mer{mine>0&&<> · <span style={{color:"#d97706",fontWeight:700}}>⭐ {mine} à moi</span></>}
      </div>

      {/* ── Tooltip navire ── */}
      {hovShip && !sel && (
        <div style={{position:"absolute",top:"40%",right:16,zIndex:20,width:210,background:"rgba(255,248,210,0.98)",border:"2px solid rgba(139,105,20,0.5)",borderRadius:12,padding:"12px 14px",boxShadow:"0 6px 24px rgba(0,0,0,0.35)",pointerEvents:"none"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#2c1a06"}}>{hovShip.logo} {hovShip.compNom}</div>
          <div style={{fontSize:14,color:"#c05c0a",fontWeight:700,marginTop:3}}>{hovShip.flag} {hovShip.nom}</div>
          <hr style={{border:"none",borderTop:"1px solid rgba(139,105,20,0.25)",margin:"7px 0"}}/>
          {[["🗺",hovShip.route],["➡️",hovShip.next],["✈️",`${hovShip.voyages} voyages`],["😊",`${hovShip.sat}/100`]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#5d4e37",marginTop:4}}>
              <span>{k}</span><span style={{fontWeight:600}}>{v}</span>
            </div>
          ))}
          {hovShip.isMe && <div style={{marginTop:8,textAlign:"center",fontSize:11,color:"#d97706",fontWeight:700}}>⭐ Votre navire</div>}
        </div>
      )}

      {/* ── Fiche navire sélectionné ── */}
      {sel && (
        <div style={{position:"absolute",top:"35%",right:16,zIndex:20,width:225,background:"rgba(255,248,210,0.98)",border:"2px solid rgba(139,105,20,0.55)",borderRadius:14,padding:"14px 16px",boxShadow:"0 8px 28px rgba(0,0,0,0.4)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#2c1a06"}}>{sel.logo} {sel.compNom}</div>
            <button style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#8b6914",lineHeight:1}} onClick={()=>setSel(null)}>✕</button>
          </div>
          <div style={{fontSize:16,color:"#c05c0a",fontWeight:700,marginTop:5}}>{sel.flag} {sel.nom}</div>
          <hr style={{border:"none",borderTop:"1px solid rgba(139,105,20,0.28)",margin:"9px 0"}}/>
          {[["🗺 Route",sel.route.slice(0,24)],["➡️ Prochain",sel.next],["✈️ Voyages",sel.voyages],["😊 Satisfaction",`${sel.sat}/100`]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11}}>
              <span style={{color:"#5d4e37"}}>{k}</span>
              <span style={{color:"#2c1a06",fontWeight:700}}>{v}</span>
            </div>
          ))}
          {sel.isMe && <div style={{marginTop:10,textAlign:"center",fontSize:12,color:"#d97706",fontWeight:700,background:"rgba(251,191,36,0.15)",borderRadius:8,padding:"5px"}}>⭐ Votre navire</div>}
        </div>
      )}

      {/* ── Légende ── */}
      <div style={{position:"absolute",bottom:20,right:20,zIndex:10,background:"rgba(255,248,210,0.95)",border:"1.5px solid rgba(139,105,20,0.45)",borderRadius:10,padding:"9px 13px",boxShadow:"0 2px 10px rgba(0,0,0,0.22)"}}>
        <div style={{fontSize:9,fontWeight:700,color:"#8b6914",textTransform:"uppercase",letterSpacing:1.2,marginBottom:5,paddingBottom:3,borderBottom:"1px solid rgba(139,105,20,0.2)"}}>ROUTES</div>
        {ROUTES.map(rt=>(
          <div key={rt.id} style={{display:"flex",alignItems:"center",gap:7,fontSize:10,color:"#3d2b0a",marginTop:3}}>
            <div style={{width:22,height:3,background:rt.color,borderRadius:2,border:"1px dashed rgba(0,0,0,0.15)"}}/>
            {rt.label}
          </div>
        ))}
      </div>
    </div>
  );
}
