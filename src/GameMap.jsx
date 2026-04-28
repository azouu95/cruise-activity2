import { useEffect, useRef, useState, useCallback } from 'react';

// ── Ports ────────────────────────────────────────────────────────────────────
const PORTS = {
  barcelone      : { x:0.265, y:0.345, label:'Barcelone',  major:true  },
  genes          : { x:0.355, y:0.295, label:'Gênes',       major:true  },
  marseille      : { x:0.310, y:0.320, label:'Marseille',   major:false },
  civitavecchia  : { x:0.395, y:0.355, label:'Rome',        major:true  },
  naples         : { x:0.415, y:0.390, label:'Naples',      major:false },
  palma_majorque : { x:0.282, y:0.368, label:'Majorque',    major:false },
  la_valette     : { x:0.472, y:0.430, label:'Malte',       major:false },
  athenes_piree  : { x:0.555, y:0.405, label:'Athènes',     major:true  },
  santorin       : { x:0.575, y:0.425, label:'Santorin',    major:false },
  istanbul       : { x:0.625, y:0.355, label:'Istanbul',    major:true  },
  venise         : { x:0.418, y:0.278, label:'Venise',      major:true  },
  split          : { x:0.452, y:0.302, label:'Split',       major:false },
  dubrovnik      : { x:0.462, y:0.338, label:'Dubrovnik',   major:false },
  kotor          : { x:0.470, y:0.355, label:'Kotor',       major:false },
  corfou         : { x:0.510, y:0.390, label:'Corfou',      major:false },
  lisbonne       : { x:0.155, y:0.328, label:'Lisbonne',    major:true  },
  funchal        : { x:0.110, y:0.415, label:'Madère',      major:false },
  tenerife       : { x:0.088, y:0.495, label:'Tenerife',    major:false },
  casablanca     : { x:0.192, y:0.455, label:'Casablanca',  major:false },
  miami          : { x:0.218, y:0.498, label:'Miami',       major:true  },
  nassau         : { x:0.242, y:0.520, label:'Nassau',      major:false },
  cozumel        : { x:0.178, y:0.558, label:'Cozumel',     major:false },
  ocho_rios      : { x:0.258, y:0.548, label:'Jamaïque',    major:false },
  saint_martin   : { x:0.292, y:0.540, label:'St-Martin',   major:false },
  pointe_pitre   : { x:0.305, y:0.558, label:'Guadeloupe',  major:false },
  le_cap         : { x:0.448, y:0.785, label:'Le Cap',      major:false },
  dubai          : { x:0.718, y:0.535, label:'Dubaï',       major:true  },
  singapour      : { x:0.820, y:0.635, label:'Singapour',   major:true  },
  hong_kong      : { x:0.868, y:0.498, label:'Hong Kong',   major:false },
};

const ROUTE_COLORS = {
  'Méditerranée': '#f59e0b',
  'Adriatique'  : '#3b82f6',
  'Caraïbes'    : '#10b981',
  'Atlantique'  : '#6366f1',
  'Asie'        : '#ef4444',
  'Afrique'     : '#f97316',
};

// Continents
const EU=[[0.16,0.19],[0.19,0.17],[0.23,0.16],[0.27,0.16],[0.30,0.155],[0.33,0.145],[0.37,0.145],[0.40,0.135],[0.44,0.13],[0.47,0.125],[0.50,0.12],[0.535,0.115],[0.565,0.12],[0.595,0.13],[0.625,0.145],[0.655,0.155],[0.675,0.165],[0.685,0.178],[0.678,0.198],[0.660,0.210],[0.638,0.222],[0.628,0.248],[0.618,0.268],[0.608,0.285],[0.595,0.300],[0.588,0.318],[0.575,0.332],[0.558,0.345],[0.538,0.358],[0.515,0.368],[0.498,0.382],[0.488,0.398],[0.472,0.408],[0.458,0.398],[0.442,0.385],[0.425,0.375],[0.408,0.360],[0.392,0.350],[0.375,0.342],[0.358,0.338],[0.342,0.328],[0.328,0.315],[0.312,0.305],[0.298,0.295],[0.285,0.290],[0.275,0.275],[0.270,0.258],[0.262,0.245],[0.252,0.232],[0.242,0.222],[0.230,0.210],[0.218,0.200],[0.208,0.192],[0.190,0.186],[0.172,0.185],[0.158,0.188],[0.152,0.195],[0.16,0.19]];
const AF=[[0.195,0.422],[0.218,0.412],[0.240,0.408],[0.262,0.408],[0.282,0.418],[0.298,0.428],[0.315,0.440],[0.332,0.452],[0.348,0.462],[0.365,0.475],[0.378,0.492],[0.390,0.512],[0.398,0.535],[0.402,0.558],[0.402,0.582],[0.400,0.608],[0.395,0.635],[0.388,0.658],[0.378,0.682],[0.365,0.705],[0.350,0.725],[0.335,0.742],[0.318,0.755],[0.300,0.765],[0.282,0.768],[0.268,0.768],[0.252,0.762],[0.242,0.755],[0.435,0.755],[0.450,0.742],[0.462,0.725],[0.468,0.705],[0.470,0.682],[0.468,0.658],[0.462,0.632],[0.452,0.608],[0.440,0.582],[0.428,0.558],[0.418,0.532],[0.415,0.508],[0.420,0.485],[0.432,0.462],[0.448,0.448],[0.462,0.438],[0.475,0.432],[0.488,0.428],[0.498,0.420],[0.498,0.408],[0.488,0.400],[0.470,0.398],[0.452,0.402],[0.432,0.408],[0.412,0.412],[0.392,0.412],[0.372,0.408],[0.352,0.402],[0.332,0.412],[0.312,0.418],[0.295,0.418],[0.275,0.412],[0.255,0.415],[0.232,0.418],[0.212,0.420],[0.195,0.422]];
const AS=[[0.625,0.145],[0.658,0.135],[0.688,0.125],[0.720,0.115],[0.755,0.108],[0.790,0.105],[0.828,0.108],[0.862,0.115],[0.892,0.125],[0.915,0.140],[0.935,0.155],[0.948,0.172],[0.955,0.190],[0.958,0.210],[0.955,0.232],[0.948,0.258],[0.938,0.280],[0.925,0.302],[0.910,0.322],[0.892,0.338],[0.875,0.352],[0.858,0.362],[0.840,0.368],[0.822,0.368],[0.805,0.362],[0.790,0.355],[0.775,0.345],[0.762,0.332],[0.748,0.318],[0.738,0.305],[0.725,0.290],[0.715,0.275],[0.705,0.260],[0.698,0.248],[0.690,0.232],[0.682,0.218],[0.675,0.205],[0.665,0.192],[0.655,0.180],[0.645,0.170],[0.635,0.160],[0.625,0.150],[0.625,0.145]];
const AM=[[0.078,0.155],[0.100,0.150],[0.125,0.155],[0.148,0.162],[0.165,0.175],[0.178,0.190],[0.185,0.208],[0.185,0.228],[0.180,0.248],[0.170,0.265],[0.158,0.278],[0.142,0.285],[0.128,0.288],[0.115,0.285],[0.102,0.278],[0.092,0.268],[0.082,0.255],[0.075,0.240],[0.068,0.222],[0.065,0.205],[0.065,0.188],[0.068,0.172],[0.072,0.160],[0.078,0.155],[0.148,0.285],[0.162,0.298],[0.172,0.315],[0.178,0.338],[0.178,0.362],[0.172,0.385],[0.162,0.405],[0.150,0.422],[0.138,0.440],[0.130,0.458],[0.125,0.475],[0.125,0.495],[0.130,0.515],[0.138,0.532],[0.148,0.548],[0.158,0.568],[0.162,0.588],[0.162,0.608],[0.158,0.628],[0.148,0.645],[0.135,0.658],[0.120,0.668],[0.105,0.675],[0.092,0.675],[0.080,0.665],[0.070,0.652],[0.063,0.635],[0.062,0.615],[0.065,0.595],[0.072,0.578],[0.078,0.562]];
const AU=[[0.840,0.620],[0.865,0.610],[0.888,0.605],[0.910,0.605],[0.930,0.612],[0.948,0.622],[0.960,0.638],[0.968,0.655],[0.970,0.672],[0.968,0.690],[0.960,0.705],[0.948,0.718],[0.932,0.725],[0.915,0.730],[0.898,0.730],[0.880,0.725],[0.865,0.715],[0.850,0.702],[0.838,0.688],[0.830,0.672],[0.828,0.655],[0.828,0.638],[0.832,0.625],[0.840,0.620]];

export default function GameMap({ gameData, myCompany }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const stateRef  = useRef({ ships:[], frame:0 });
  const hovRef    = useRef(null);
  const [tooltip, setTooltip]  = useState(null);
  const [selected,setSelected] = useState(null);

  const buildShips = useCallback(() => {
    if (!gameData?.companies) return;
    const ships = [];
    for (const co of Object.values(gameData.companies)) {
      for (const nav of (co.flotte||[])) {
        if (!nav.routeActive) continue;
        const route = gameData.routes?.find(r=>r.id===nav.routeActive);
        const pts = route ? [route.hub_depart,...route.escales,route.hub_arrivee] : [];
        const isMe = myCompany?.ownerId===co.ownerId;
        const now=Date.now(), start=nav.routeAssignedAt||now-86400000;
        const total=(route?.duree||7)*86400000;
        const ratio=((now-start)%total)/total;
        const segs=Math.max(1,pts.length-1);
        const si=Math.min(Math.floor(ratio*segs),segs-1);
        const sr=ratio*segs-si;
        const pA=PORTS[pts[si]], pB=PORTS[pts[si+1]];
        if(!pA) continue;
        const x=pA.x+(pB?(pB.x-pA.x)*sr:0);
        const y=pA.y+(pB?(pB.y-pA.y)*sr:0);
        ships.push({
          uid:nav.uid, nom:nav.nom, flag:nav.flag||'', logo:co.logo, compNom:co.nom,
          isMe, x, y, displayX:x, displayY:y,
          color:ROUTE_COLORS[route?.region]||'#f59e0b',
          routeLabel:route?.label||'', portProchain:pB?PORTS[pts[si+1]]?.label:'Arrivée',
          voyages:nav.voyages||0, satisfaction:nav.satisfactionMoyenne||70,
          revenu:nav.revenusGeneres||0, pulse:Math.random()*Math.PI*2, wake:[],
        });
      }
    }
    stateRef.current.ships = ships;
  }, [gameData, myCompany]);

  useEffect(()=>{ buildShips(); },[buildShips]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const resize=()=>{ canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight; };
    resize();
    window.addEventListener('resize',resize);

    // Pré-calcul texture papier (une seule fois)
    const noiseCanvas=document.createElement('canvas');
    noiseCanvas.width=256; noiseCanvas.height=256;
    const nctx=noiseCanvas.getContext('2d');
    const id=nctx.createImageData(256,256);
    for(let i=0;i<id.data.length;i+=4){
      const v=Math.random()*30;
      id.data[i]=id.data[i+1]=id.data[i+2]=v; id.data[i+3]=18;
    }
    nctx.putImageData(id,0,0);

    function drawLand(pts,fill,stroke,shadow){
      const W=canvas.width,H=canvas.height;
      if(!pts?.length) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0]*W,pts[0][1]*H);
      // Courbes douces
      for(let i=1;i<pts.length-1;i++){
        const mx=(pts[i][0]+pts[i+1][0])/2*W;
        const my=(pts[i][1]+pts[i+1][1])/2*H;
        ctx.quadraticCurveTo(pts[i][0]*W,pts[i][1]*H,mx,my);
      }
      ctx.closePath();
      if(shadow){ ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=8; ctx.shadowOffsetX=3; ctx.shadowOffsetY=3; }
      ctx.fillStyle=fill; ctx.fill();
      ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;
      ctx.strokeStyle=stroke; ctx.lineWidth=2; ctx.stroke();
    }

    function drawCompass(cx,cy,r){
      // Fond
      ctx.save();
      const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      bg.addColorStop(0,'rgba(255,248,220,0.95)');
      bg.addColorStop(0.7,'rgba(240,220,160,0.9)');
      bg.addColorStop(1,'rgba(200,170,100,0.8)');
      ctx.fillStyle=bg;
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#8B6914'; ctx.lineWidth=2; ctx.stroke();
      // Cercle intérieur
      ctx.beginPath(); ctx.arc(cx,cy,r*0.7,0,Math.PI*2);
      ctx.strokeStyle='rgba(139,105,20,0.4)'; ctx.lineWidth=0.8; ctx.stroke();
      // Aiguilles
      const dirs=[0,Math.PI/2,Math.PI,Math.PI*1.5];
      const labels=['N','E','S','O'];
      dirs.forEach((a,i)=>{
        const isN=i===0;
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(a);
        ctx.fillStyle=isN?'#c0392b':'#8B6914';
        ctx.beginPath();
        ctx.moveTo(0,-r*0.85); ctx.lineTo(-r*0.12,0); ctx.lineTo(0,-r*0.2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle='rgba(139,105,20,0.5)';
        ctx.beginPath();
        ctx.moveTo(0,r*0.85); ctx.lineTo(r*0.12,0); ctx.lineTo(0,r*0.2);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        // Labels
        const lx=cx+Math.sin(a)*r*0.95, ly=cy-Math.cos(a)*r*0.95;
        ctx.fillStyle=isN?'#c0392b':'#5d4e37';
        ctx.font=`bold ${r*0.25}px Georgia,serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(labels[i],lx,ly);
      });
      // Point central
      ctx.beginPath(); ctx.arc(cx,cy,r*0.08,0,Math.PI*2);
      ctx.fillStyle='#8B6914'; ctx.fill();
      ctx.restore();
    }

    function draw(){
      const W=canvas.width,H=canvas.height,{ships,frame}=stateRef.current;
      ctx.clearRect(0,0,W,H);

      // ── OCÉAN CARTOON ──
      // Dégradé chaud style carte illustrée
      const ocean=ctx.createLinearGradient(0,0,W,H);
      ocean.addColorStop(0,  '#1a6b9e');
      ocean.addColorStop(0.3,'#1e7ab8');
      ocean.addColorStop(0.6,'#1668a0');
      ocean.addColorStop(1,  '#124f7a');
      ctx.fillStyle=ocean; ctx.fillRect(0,0,W,H);

      // Reflets lumineux océan
      const shine=ctx.createRadialGradient(W*0.3,H*0.25,0,W*0.3,H*0.25,W*0.4);
      shine.addColorStop(0,'rgba(100,200,255,0.12)');
      shine.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=shine; ctx.fillRect(0,0,W,H);

      // Vagues cartoon (lignes courbes)
      ctx.save();
      for(let row=0;row<12;row++){
        const baseY=H*(0.08+row*0.08);
        const alpha=0.06+Math.sin(frame*0.008+row)*0.02;
        ctx.strokeStyle=`rgba(255,255,255,${alpha})`;
        ctx.lineWidth=1.2;
        ctx.beginPath();
        for(let x=0;x<=W;x+=W/20){
          const wx=x+Math.sin(frame*0.005+row*0.8+x*0.01)*8;
          const wy=baseY+Math.sin(x*0.025+frame*0.006+row*1.2)*6;
          x===0?ctx.moveTo(wx,wy):ctx.lineTo(wx,wy);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Texture papier sur l'océan
      ctx.globalAlpha=0.4;
      const pat=ctx.createPattern(noiseCanvas,'repeat');
      ctx.fillStyle=pat; ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=1;

      // ── CONTINENTS CARTOON ──
      // Style : formes douces, couleurs chaudes, ombres portées

      // Ombres portées des continents
      ctx.shadowColor='rgba(0,0,0,0.5)';
      ctx.shadowBlur=12; ctx.shadowOffsetX=4; ctx.shadowOffsetY=4;
      const drawShadow=(pts)=>{
        ctx.beginPath();
        ctx.moveTo(pts[0][0]*W,pts[0][1]*H);
        for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0]*W,pts[i][1]*H);
        ctx.closePath();
        ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fill();
      };
      [AF,AM,AS,AU,EU].forEach(drawShadow);
      ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;

      // Afrique — ocre chaud
      drawLand(AF,
        (() => { const g=ctx.createLinearGradient(0.3*W,0.4*H,0.5*W,0.8*H); g.addColorStop(0,'#c8a85c'); g.addColorStop(1,'#b8923e'); return g; })(),
        '#8B6914', false);
      // Amériques — vert forêt
      drawLand(AM,
        (() => { const g=ctx.createLinearGradient(0.1*W,0.15*H,0.18*W,0.7*H); g.addColorStop(0,'#5a9e52'); g.addColorStop(1,'#4a8642'); return g; })(),
        '#2d6b2a', false);
      // Asie — vert sauge
      drawLand(AS,
        (() => { const g=ctx.createLinearGradient(0.62*W,0.1*H,0.96*W,0.37*H); g.addColorStop(0,'#7ab87a'); g.addColorStop(1,'#5a9858'); return g; })(),
        '#3a7838', false);
      // Australie — ocre rouge
      drawLand(AU,
        (() => { const g=ctx.createLinearGradient(0.83*W,0.61*H,0.97*W,0.73*H); g.addColorStop(0,'#d4925a'); g.addColorStop(1,'#c07840'); return g; })(),
        '#8B4513', false);
      // Europe — vert prairie (en dernier, au-dessus)
      drawLand(EU,
        (() => { const g=ctx.createLinearGradient(0.15*W,0.12*H,0.68*W,0.42*H); g.addColorStop(0,'#8ac46e'); g.addColorStop(0.5,'#72b05a'); g.addColorStop(1,'#5a9648'); return g; })(),
        '#3d7030', true);

      // Texture grain sur les continents
      ctx.globalAlpha=0.06;
      ctx.fillStyle=ctx.createPattern(noiseCanvas,'repeat');
      ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=1;

      // ── ROUTES ──
      if(gameData?.companies){
        const drawn=new Set();
        for(const co of Object.values(gameData.companies)){
          for(const nav of (co.flotte||[])){
            if(!nav.routeActive||drawn.has(nav.routeActive)) continue;
            drawn.add(nav.routeActive);
            const route=gameData.routes?.find(r=>r.id===nav.routeActive);
            if(!route) continue;
            const plist=[route.hub_depart,...route.escales,route.hub_arrivee];
            const col=ROUTE_COLORS[route.region]||'#f59e0b';
            // Ombre route
            ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=3;
            ctx.setLineDash([6,10]);
            ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=3;
            ctx.beginPath(); let f=true;
            for(const pid of plist){const p=PORTS[pid];if(!p) continue;if(f){ctx.moveTo(p.x*W,p.y*H);f=false;}else ctx.lineTo(p.x*W,p.y*H);}
            ctx.stroke();
            // Route colorée
            ctx.strokeStyle=col+'dd'; ctx.lineWidth=2.2;
            ctx.beginPath(); f=true;
            for(const pid of plist){const p=PORTS[pid];if(!p) continue;if(f){ctx.moveTo(p.x*W,p.y*H);f=false;}else ctx.lineTo(p.x*W,p.y*H);}
            ctx.stroke();
            ctx.setLineDash([]); ctx.shadowBlur=0;
          }
        }
      }

      // ── PORTS (style épingle de carte) ──
      for(const [id,p] of Object.entries(PORTS)){
        const px=p.x*W, py=p.y*H;
        const hov=hovRef.current===id;
        const sz=p.major?6:4;

        ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=6; ctx.shadowOffsetY=2;

        // Base du point (cercle blanc)
        ctx.beginPath(); ctx.arc(px,py,sz+1.5,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fill();
        ctx.beginPath(); ctx.arc(px,py,sz,0,Math.PI*2);
        ctx.fillStyle=hov?'#f59e0b':p.major?'#e53e3e':'#e67e22';
        ctx.fill();
        ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1; ctx.stroke();

        ctx.shadowBlur=0; ctx.shadowOffsetY=0;

        // Étiquette
        if(p.major||hov){
          ctx.font=`bold ${hov?12:10}px Georgia,serif`;
          ctx.textAlign='center';
          // Fond étiquette
          const tw=ctx.measureText(p.label).width;
          ctx.fillStyle='rgba(255,248,220,0.88)';
          ctx.beginPath();
          ctx.roundRect(px-tw/2-4,py-sz-18,tw+8,14,3);
          ctx.fill();
          ctx.strokeStyle='rgba(139,105,20,0.4)'; ctx.lineWidth=0.8; ctx.stroke();
          // Texte
          ctx.fillStyle='#3d2b0a';
          ctx.textBaseline='alphabetic';
          ctx.fillText(p.label,px,py-sz-7);
        }
      }

      // ── NAVIRES (style cartoon) ──
      for(const s of ships){
        s.displayX+=(s.x-s.displayX)*0.04;
        s.displayY+=(s.y-s.displayY)*0.04;
        s.pulse=(s.pulse+0.04)%(Math.PI*2);
        const sx=s.displayX*W, sy=s.displayY*H;
        const hov=hovRef.current===s.uid;
        const sel=selected?.uid===s.uid;
        const sz=s.isMe?20:16;
        const pulse=Math.sin(s.pulse)*.5+.5;

        // Sillage (traîne blanche)
        s.wake.push({x:sx,y:sy,a:0});
        if(s.wake.length>18) s.wake.shift();
        s.wake.forEach(w=>{
          w.a++;
          const a=Math.max(0,0.35-w.a*0.02);
          const r=w.a*0.7+2;
          ctx.beginPath(); ctx.arc(w.x,w.y,r,0,Math.PI*2);
          ctx.fillStyle=`rgba(255,255,255,${a})`; ctx.fill();
        });

        // Aura sélection / hover
        if(sel||hov||s.isMe){
          const aura=ctx.createRadialGradient(sx,sy,0,sx,sy,sz+(s.isMe?18:10)+pulse*6);
          const col=s.isMe?'255,215,0':'255,255,255';
          aura.addColorStop(0,`rgba(${col},${s.isMe?0.35+pulse*0.2:0.2})`);
          aura.addColorStop(1,`rgba(${col},0)`);
          ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(sx,sy,sz+18+pulse*6,0,Math.PI*2); ctx.fill();
        }

        // Anneau cartoon
        if(sel){
          ctx.setLineDash([6,5]);
          ctx.strokeStyle='rgba(255,215,0,0.9)'; ctx.lineWidth=2.5;
          ctx.beginPath(); ctx.arc(sx,sy,sz+9,0,Math.PI*2); ctx.stroke();
          ctx.setLineDash([]);
        }

        // Corps du navire — style cartoon avec dégradé
        ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=8; ctx.shadowOffsetY=3;

        const shipGrad=ctx.createRadialGradient(sx-sz*0.3,sy-sz*0.35,sz*0.1,sx,sy,sz);
        if(s.isMe){
          shipGrad.addColorStop(0,'#fbbf24');
          shipGrad.addColorStop(0.5,'#f59e0b');
          shipGrad.addColorStop(1,'#d97706');
        } else {
          shipGrad.addColorStop(0,'#60a5fa');
          shipGrad.addColorStop(0.5,'#3b82f6');
          shipGrad.addColorStop(1,'#1d4ed8');
        }
        ctx.beginPath(); ctx.arc(sx,sy,sz,0,Math.PI*2);
        ctx.fillStyle=shipGrad; ctx.fill();

        // Bordure blanche (effet cartoon)
        ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=s.isMe?3:2;
        ctx.beginPath(); ctx.arc(sx,sy,sz,0,Math.PI*2); ctx.stroke();

        ctx.shadowBlur=0; ctx.shadowOffsetY=0;

        // Icône navire
        ctx.font=`${sz-2}px 'Segoe UI Emoji'`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(s.flag||'🚢',sx,sy+1);

        // Badge compagnie (bulle cartoon)
        const badgeTxt=s.logo;
        ctx.font=`bold 13px 'Segoe UI Emoji',sans-serif`;
        const bw=ctx.measureText(badgeTxt).width+10;
        const bh=18; const bx=sx-bw/2, by=sy-sz-bh-4;
        // Fond bulle
        ctx.fillStyle=s.isMe?'rgba(253,230,138,0.95)':'rgba(255,255,255,0.92)';
        ctx.strokeStyle=s.isMe?'#d97706':'rgba(0,0,0,0.2)';
        ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,5); ctx.fill(); ctx.stroke();
        // Petite flèche
        ctx.beginPath(); ctx.moveTo(sx-5,by+bh); ctx.lineTo(sx+5,by+bh); ctx.lineTo(sx,by+bh+5); ctx.closePath();
        ctx.fillStyle=s.isMe?'rgba(253,230,138,0.95)':'rgba(255,255,255,0.92)'; ctx.fill();
        // Texte
        ctx.fillStyle='#1a1a1a'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(badgeTxt,sx,by+bh/2);
      }

      // ── BOUSSOLE CARTOON ──
      drawCompass(W-58, H-58, 40);

      // ── TITRE CARTE ──
      ctx.save();
      ctx.font=`bold ${Math.round(W*0.022)}px Georgia,serif`;
      ctx.textAlign='left'; ctx.textBaseline='top';
      const title='⚓ Armateur de Croisière';
      const tw2=ctx.measureText(title).width;
      // Parchemin fond titre
      ctx.fillStyle='rgba(255,248,220,0.92)';
      ctx.strokeStyle='rgba(139,105,20,0.5)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(12,12,tw2+20,Math.round(W*0.022)+14,6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle='#3d2b0a';
      ctx.fillText(title,22,19);
      ctx.restore();

      stateRef.current.frame=frame+1;
      animRef.current=requestAnimationFrame(draw);
    }
    draw();
    return ()=>{ cancelAnimationFrame(animRef.current); window.removeEventListener('resize',resize); };
  },[gameData,selected]);

  const onMove=useCallback((e)=>{
    const c=canvasRef.current; if(!c) return;
    const r=c.getBoundingClientRect();
    const mx=(e.clientX-r.left)/c.width, my=(e.clientY-r.top)/c.height;
    let found=null;
    for(const s of stateRef.current.ships){if(Math.abs(s.displayX-mx)<.028&&Math.abs(s.displayY-my)<.028){found={t:'ship',d:s};break;}}
    if(!found) for(const [id,p] of Object.entries(PORTS)){if(Math.abs(p.x-mx)<.016&&Math.abs(p.y-my)<.016){found={t:'port',d:{...p,id}};break;}}
    hovRef.current=found?.d?.uid||found?.d?.id||null;
    if(found?.t==='ship'){setTooltip({t:'ship',s:found.d,x:e.clientX,y:e.clientY});c.style.cursor='pointer';}
    else if(found?.t==='port'){setTooltip({t:'port',p:found.d,x:e.clientX,y:e.clientY});c.style.cursor='pointer';}
    else{setTooltip(null);c.style.cursor='default';}
  },[]);

  const onClick=useCallback(()=>{
    if(tooltip?.t==='ship') setSelected(v=>v?.uid===tooltip.s.uid?null:tooltip.s);
    else setSelected(null);
  },[tooltip]);

  const total=stateRef.current.ships.length;
  const mine=stateRef.current.ships.filter(s=>s.isMe).length;

  return (
    <div style={{position:'relative',width:'100%',height:'100%',overflow:'hidden'}}>
      <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}} onMouseMove={onMove} onClick={onClick}/>

      {/* Compteur style parchemin */}
      <div style={S.counter}>
        ⛴ <b>{total}</b> navire{total>1?'s':''} en mer
        {mine>0&&<span style={{color:'#d97706',marginLeft:8,fontWeight:700}}>⭐ {mine} à moi</span>}
      </div>

      {/* Tooltip style carte */}
      {tooltip?.t==='ship'&&(
        <div style={{...S.tip,left:Math.min(tooltip.x+16,window.innerWidth-200),top:Math.max(tooltip.y-110,10)}}>
          <div style={S.tth}>{tooltip.s.logo} {tooltip.s.compNom}</div>
          <div style={S.ttn}>{tooltip.s.flag} {tooltip.s.nom}</div>
          <div style={S.hr}/>
          {[['🗺',tooltip.s.routeLabel.slice(0,24)],['➡️',tooltip.s.portProchain],['✈️',tooltip.s.voyages+' voyages'],['😊',Math.round(tooltip.s.satisfaction)+'/100']].map(([k,v])=>(
            <div key={k} style={S.tr}><span>{k}</span><span style={{fontWeight:600}}>{v}</span></div>
          ))}
          {tooltip.s.isMe&&<div style={S.tm}>⭐ Votre navire</div>}
        </div>
      )}
      {tooltip?.t==='port'&&(
        <div style={{...S.tip,left:Math.min(tooltip.x+16,window.innerWidth-180),top:Math.max(tooltip.y-75,10)}}>
          <div style={S.tth}>📍 {tooltip.p.label}</div>
        </div>
      )}

      {/* Fiche navire sélectionné */}
      {selected&&(
        <div style={S.panel}>
          <div style={S.ph}><span style={{fontWeight:700}}>{selected.logo} {selected.compNom}</span><button style={S.cl} onClick={()=>setSelected(null)}>✕</button></div>
          <div style={S.ps}>{selected.flag} {selected.nom}</div>
          <div style={S.hr}/>
          {[['🗺 Route',selected.routeLabel.slice(0,26)],['➡️ Prochain',selected.portProchain],['✈️ Voyages',selected.voyages],['😊 Satisfaction',Math.round(selected.satisfaction)+'/100'],['🪙 Revenus',(selected.revenu/1e6).toFixed(2)+'M 🪙']].map(([k,v])=>(
            <div key={k} style={S.pr}><span style={{color:'#6b4c1a',fontSize:11}}>{k}</span><span style={{color:'#2c1a06',fontSize:11,fontWeight:700}}>{v}</span></div>
          ))}
          {selected.isMe&&<div style={S.pm}>⭐ Votre navire</div>}
        </div>
      )}

      {/* Légende style carte */}
      <div style={S.legend}>
        <div style={{fontSize:10,fontWeight:700,color:'#3d2b0a',marginBottom:4,borderBottom:'1px solid rgba(139,105,20,0.3)',paddingBottom:3}}>LÉGENDE</div>
        {Object.entries(ROUTE_COLORS).map(([r,c])=>(
          <div key={r} style={{display:'flex',alignItems:'center',gap:6,fontSize:10,color:'#3d2b0a'}}>
            <div style={{width:20,height:3,background:c,borderRadius:2}}/>
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}

const S={
  counter:{position:'absolute',top:56,left:12,background:'rgba(255,248,220,0.92)',border:'1px solid rgba(139,105,20,0.4)',borderRadius:20,padding:'5px 14px',fontSize:12,color:'#3d2b0a',fontFamily:'Georgia,serif',boxShadow:'0 2px 8px rgba(0,0,0,0.3)'},
  tip    :{position:'fixed',zIndex:200,background:'rgba(255,248,220,0.97)',border:'2px solid rgba(139,105,20,0.5)',borderRadius:10,padding:'12px 14px',minWidth:175,boxShadow:'0 6px 24px rgba(0,0,0,0.4)',pointerEvents:'none',fontFamily:'Georgia,serif'},
  tth    :{fontSize:13,fontWeight:700,color:'#2c1a06'},
  ttn    :{fontSize:14,color:'#c05c0a',fontWeight:700,marginTop:3},
  hr     :{borderTop:'1px solid rgba(139,105,20,0.3)',margin:'7px 0'},
  tr     :{display:'flex',justifyContent:'space-between',gap:12,fontSize:11,color:'#5d4e37',marginTop:4},
  tm     :{marginTop:8,textAlign:'center',fontSize:11,color:'#d97706',fontWeight:700},
  panel  :{position:'absolute',bottom:12,right:12,width:235,background:'rgba(255,248,220,0.97)',border:'2px solid rgba(139,105,20,0.5)',borderRadius:12,padding:'14px 16px',boxShadow:'0 6px 24px rgba(0,0,0,0.4)',fontFamily:'Georgia,serif'},
  ph     :{display:'flex',justifyContent:'space-between',fontSize:13,color:'#2c1a06'},
  ps     :{fontSize:16,fontWeight:700,color:'#c05c0a',marginTop:5},
  pr     :{display:'flex',justifyContent:'space-between',marginTop:6},
  pm     :{marginTop:10,textAlign:'center',fontSize:12,color:'#d97706',fontWeight:700},
  cl     :{background:'none',border:'none',color:'rgba(60,30,0,0.4)',cursor:'pointer',fontSize:16,padding:0},
  legend :{position:'absolute',bottom:12,left:12,background:'rgba(255,248,220,0.93)',border:'1px solid rgba(139,105,20,0.4)',borderRadius:8,padding:'8px 12px',boxShadow:'0 2px 8px rgba(0,0,0,0.3)',fontFamily:'Georgia,serif',display:'flex',flexDirection:'column',gap:4},
};
