"use client";

import { useState } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --black: #0a0a0a; --black2: #111111; --black3: #1a1a1a;
    --white: #f2f0ec; --white2: #d4d0c8;
    --red: #c0001a; --red2: #e8001f; --red-pale: rgba(192,0,26,0.08);
    --muted: #666; --muted2: #444;
    --border: rgba(255,255,255,0.06); --border2: rgba(255,255,255,0.1);
    --gold: #c9a84c;
  }
  html, body { background: var(--black); color: var(--white); font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; min-height: 100vh; }
  .header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; height: 56px; background: rgba(10,10,10,0.92); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
  .logo { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 3px; color: var(--white); }
  .logo span { color: var(--red); }
  .passion-pill { display: flex; align-items: center; gap: 8px; padding: 6px 14px; background: var(--black3); border: 1px solid var(--border2); font-size: 12px; color: var(--white2); }
  .passion-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--red); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.3} }
  .header-right { display: flex; align-items: center; gap: 16px; }
  .level-badge { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--gold); border: 1px solid rgba(201,168,76,.3); padding: 4px 10px; }
  .streak { font-size: 12px; color: var(--muted); }
  .streak strong { color: var(--red); }
  .new-btn { padding: 7px 16px; background: var(--red); border: none; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: white; cursor: pointer; letter-spacing: .5px; }
  .passions-bar { position: fixed; top: 56px; left: 0; right: 0; z-index: 99; background: var(--black2); border-bottom: 1px solid var(--border); padding: 0 40px; display: flex; align-items: center; gap: 4px; overflow-x: auto; height: 48px; }
  .passions-bar::-webkit-scrollbar { display: none; }
  .passion-tab { padding: 0 16px; height: 100%; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; white-space: nowrap; color: var(--muted); transition: all .2s; flex-shrink: 0; background: none; border-left: none; border-right: none; border-top: none; font-family: 'DM Sans', sans-serif; }
  .passion-tab:hover { color: var(--white); }
  .passion-tab.active { color: var(--white); border-bottom-color: var(--red); }
  .add-passion { padding: 0 16px; height: 100%; display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted2); cursor: pointer; border-left: 1px solid var(--border); margin-left: 8px; background: none; border-top: none; border-right: none; border-bottom: none; font-family: 'DM Sans', sans-serif; }
  .add-passion:hover { color: var(--red); }
  .hero { margin-top: 104px; position: relative; height: 400px; overflow: hidden; display: flex; align-items: flex-end; }
  .hero-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a0005 40%, #0a0a0a 100%); }
  .hero-bg::before { content: '911'; position: absolute; right: -20px; top: 50%; transform: translateY(-50%); font-family: 'Bebas Neue', sans-serif; font-size: 420px; color: rgba(192,0,26,0.04); line-height: 1; pointer-events: none; letter-spacing: -20px; }
  .hero-bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, var(--black) 0%, transparent 60%); }
  .hero-content { position: relative; z-index: 1; padding: 0 40px 40px; width: 100%; }
  .hero-tag { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: var(--red); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .hero-tag::before { content: ''; width: 24px; height: 1px; background: var(--red); }
  .hero-title { font-family: 'Bebas Neue', sans-serif; font-size: 96px; line-height: .9; letter-spacing: 2px; margin-bottom: 16px; }
  .hero-title span { color: var(--red); }
  .hero-sub { font-size: 14px; color: var(--muted); max-width: 480px; line-height: 1.7; font-weight: 300; margin-bottom: 24px; }
  .hero-stats { display: flex; gap: 32px; }
  .hstat-n { font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: var(--white); letter-spacing: 1px; line-height: 1; }
  .hstat-l { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 2px; }
  .body { display: grid; grid-template-columns: 1fr 380px; min-height: calc(100vh - 104px - 400px); }
  .left { padding: 32px 40px; border-right: 1px solid var(--border); }
  .section { margin-bottom: 48px; }
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
  .section-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 2px; }
  .section-meta { font-size: 11px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; }
  .see-all { font-size: 11px; color: var(--red); letter-spacing: 1px; text-transform: uppercase; cursor: pointer; border: none; background: none; font-family: 'DM Sans', sans-serif; }
  .res-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .res-card { background: var(--black2); border: 1px solid var(--border); padding: 20px; cursor: pointer; transition: all .25s; position: relative; }
  .res-card:hover { border-color: rgba(192,0,26,.3); transform: translateY(-2px); }
  .res-type { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .res-type-dot { width: 4px; height: 4px; border-radius: 50%; }
  .res-title { font-size: 14px; font-weight: 500; color: var(--white); margin-bottom: 6px; line-height: 1.4; }
  .res-source { font-size: 11px; color: var(--muted); }
  .res-tag { position: absolute; top: 16px; right: 16px; font-size: 9px; padding: 3px 8px; letter-spacing: .5px; }
  .rt-free { background: rgba(39,113,90,.15); color: #4aab87; }
  .rt-vid { background: rgba(192,0,26,.12); color: #ff4466; }
  .rt-pod { background: rgba(201,168,76,.12); color: var(--gold); }
  .rt-book { background: rgba(44,95,138,.15); color: #4a8fc0; }
  .rt-forum { background: rgba(255,255,255,.06); color: var(--muted); }
  .univers-row { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; }
  .univers-row::-webkit-scrollbar { height: 2px; }
  .univers-row::-webkit-scrollbar-thumb { background: var(--border2); }
  .univ-card { flex-shrink: 0; width: 180px; background: var(--black2); border: 1px solid var(--border); padding: 20px 16px; cursor: pointer; transition: all .25s; }
  .univ-card:hover { border-color: rgba(192,0,26,.3); }
  .univ-icon { font-size: 28px; margin-bottom: 10px; display: block; }
  .univ-title { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
  .univ-sub { font-size: 11px; color: var(--muted); line-height: 1.4; }
  .univ-arrow { font-size: 16px; color: var(--red); margin-top: 12px; display: block; }
  .prog-section { background: var(--black2); border: 1px solid var(--border); padding: 24px; }
  .prog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .prog-title { font-size: 13px; font-weight: 500; }
  .prog-pct { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: var(--red); }
  .prog-bar { height: 3px; background: var(--black3); margin-bottom: 16px; }
  .prog-fill { height: 100%; background: linear-gradient(90deg, var(--red), var(--red2)); }
  .prog-items { display: flex; flex-direction: column; gap: 8px; }
  .prog-item { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--muted); }
  .prog-item.done { color: var(--white2); }
  .prog-check { width: 14px; height: 14px; border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; font-size: 8px; flex-shrink: 0; }
  .prog-item.done .prog-check { background: var(--red); border-color: var(--red); color: white; }
  .timeline { display: flex; flex-direction: column; }
  .tl-item { display: flex; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--border); }
  .tl-item:last-child { border-bottom: none; }
  .tl-date { font-size: 10px; color: var(--muted); min-width: 36px; padding-top: 2px; }
  .tl-line { width: 1px; background: var(--border2); flex-shrink: 0; min-height: 36px; position: relative; }
  .tl-line::before { content: ''; position: absolute; top: 6px; left: -3px; width: 7px; height: 7px; border-radius: 50%; background: var(--red); }
  .tl-content { flex: 1; }
  .tl-title { font-size: 13px; font-weight: 500; margin-bottom: 3px; }
  .tl-sub { font-size: 11px; color: var(--muted); }
  .tl-type { font-size: 10px; color: var(--red); letter-spacing: 1px; text-transform: uppercase; margin-top: 4px; }
  .right { position: sticky; top: 104px; height: calc(100vh - 104px); display: flex; flex-direction: column; background: var(--black2); }
  .chat-header { padding: 20px 24px; border-bottom: 1px solid var(--border); }
  .chat-header-top { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .chat-logo { width: 24px; height: 24px; background: var(--red); display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 12px; color: white; }
  .chat-name { font-size: 13px; font-weight: 600; }
  .chat-status { font-size: 11px; color: var(--muted); }
  .chat-context { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
  .ctx-tag { font-size: 10px; padding: 3px 8px; background: var(--black3); border: 1px solid var(--border2); color: var(--muted); }
  .chat-msgs { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .chat-msgs::-webkit-scrollbar { width: 2px; }
  .chat-msgs::-webkit-scrollbar-thumb { background: var(--border2); }
  .msg { display: flex; gap: 10px; }
  .msg.user { flex-direction: row-reverse; }
  .msg-av { width: 26px; height: 26px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
  .msg.ai .msg-av { background: var(--red); color: white; font-family: 'Bebas Neue', sans-serif; font-size: 12px; }
  .msg.user .msg-av { background: var(--black3); border: 1px solid var(--border2); color: var(--muted); }
  .bubble { padding: 10px 14px; font-size: 13px; line-height: 1.65; max-width: 82%; font-weight: 300; white-space: pre-wrap; }
  .msg.ai .bubble { background: var(--black3); color: var(--white2); border-left: 2px solid var(--red); }
  .msg.user .bubble { background: rgba(192,0,26,.1); color: var(--white); border: 1px solid rgba(192,0,26,.2); }
  .suggestions { padding: 12px 20px; display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--border); }
  .suggestions-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .sugg { padding: 8px 12px; background: var(--black3); border: 1px solid var(--border); font-size: 12px; color: var(--white2); cursor: pointer; transition: all .2s; text-align: left; font-family: 'DM Sans', sans-serif; }
  .sugg:hover { border-color: rgba(192,0,26,.4); color: var(--white); }
  .chat-input-area { padding: 14px 20px; border-top: 1px solid var(--border); }
  .chat-input-row { display: flex; gap: 10px; align-items: center; }
  .chat-field { flex: 1; background: var(--black3); border: 1px solid var(--border2); padding: 10px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; color: var(--white); outline: none; caret-color: var(--red); }
  .chat-field:focus { border-color: rgba(192,0,26,.4); }
  .chat-field::placeholder { color: var(--muted2); }
  .chat-send { width: 36px; height: 36px; background: var(--red); border: none; color: white; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .chat-send:disabled { opacity: .3; cursor: not-allowed; }
  .chat-hint { font-size: 10px; color: var(--muted2); margin-top: 8px; text-align: center; letter-spacing: .5px; }
  .demo-badge { background: rgba(201,168,76,.1); border: 1px solid rgba(201,168,76,.2); color: var(--gold); font-size: 10px; padding: 3px 10px; letter-spacing: 1px; }
`;

const RESOURCES = [
  { type:"Vidéo", dot:"#ff4466", title:"Histoire complète de la 911 — de 1963 à aujourd'hui", source:"YouTube · Petrolicious", tag:"vid", tagLabel:"Vidéo" },
  { type:"Article", dot:"#4aab87", title:"Le flat-six : pourquoi ce moteur est une légende", source:"Road & Track · Gratuit", tag:"free", tagLabel:"Gratuit" },
  { type:"Podcast", dot:"#c9a84c", title:"The 911 Files — chaque épisode, un modèle iconic", source:"Spotify · 48 épisodes", tag:"pod", tagLabel:"Podcast" },
  { type:"Forum", dot:"#888", title:"Rennlist — la bible des passionnés 911 depuis 1995", source:"rennlist.com · Communauté", tag:"forum", tagLabel:"Forum" },
  { type:"Livre", dot:"#4a8fc0", title:"911 by Porsche — L'histoire officielle illustrée", source:"Porsche Museum · PDF gratuit", tag:"book", tagLabel:"Livre" },
  { type:"Vidéo", dot:"#ff4466", title:"Porsche 911 vs Ferrari : la rivalité de 60 ans", source:"YouTube · Motor Trend", tag:"vid", tagLabel:"Vidéo" },
];

const UNIVERS = [
  { icon:"🏁", title:"Course automobile", sub:"Le Mans, WRC, la 911 RSR" },
  { icon:"⚙️", title:"Mécanique Porsche", sub:"Flat-six, PDK, tout comprendre" },
  { icon:"🎬", title:"Cinéma automobile", sub:"Le Mans 66, Rush, Senna..." },
  { icon:"📐", title:"Design Porsche", sub:"Butzi, l'histoire du style" },
  { icon:"🗺️", title:"Routes mythiques", sub:"Stelvio, Transfăgărășan..." },
  { icon:"📸", title:"Photographie auto", sub:"Capturer la 911 en mouvement" },
];

const TIMELINE = [
  { date:"Hier", title:"Documentaire : Ferry Porsche — L'obsession de la perfection", sub:"Netflix · 1h24 · Regardé en entier", type:"Documentaire" },
  { date:"Mar", title:"Article : Les 10 versions les plus rares de la 911", sub:"Evo Magazine · 15 min de lecture", type:"Article" },
  { date:"Lun", title:"Podcast : The 911 Files — Épisode 12 : La 930 Turbo", sub:"Spotify · 52 min", type:"Podcast" },
];

const PROG_ITEMS = [
  { label:"Histoire de la 911 (1963-1989)", done:true },
  { label:"Mécanique : le flat-six expliqué", done:true },
  { label:"Les générations 964, 993, 996, 997", done:false },
  { label:"La 911 en compétition", done:false },
  { label:"Acheter une 911 : guide complet", done:false },
];

const PASSIONS = [
  { icon:"🏎️", label:"Porsche 911" },
  { icon:"🏃", label:"Running" },
  { icon:"🎬", label:"Cinéma" },
  { icon:"🍳", label:"Cuisine" },
  { icon:"📚", label:"Histoire" },
];

const SUGGESTIONS = [
  "J'ai vu Le Mans 66 hier soir 🎬",
  "Explique-moi le flat-six en 2 min",
  "Quels podcasts pour aller plus loin ?",
  "Je veux acheter une 964, par où commencer ?",
];

const DEMO_RESPONSES = {
  default: "Super question ! Dans la vraie version de DropOut, je connecte ici l'IA Claude pour t'ouvrir un univers complet sur ce sujet.\n\nPour l'instant c'est une démo statique — la clé API sera branchée très prochainement. 🏎️",
  "Le Mans 66": "Le Mans 66, c'est le point d'entrée parfait pour la 911 !\n\nVoilà où ça t'emmène :\n\n🏁 La vraie rivalité Ford-Ferrari 1966 — Carroll Shelby vs Enzo Ferrari\n🎬 Rush (2013), Grand Prix (1966) — la même époque, même intensité\n⚙️ La GT40 vs la 906 Porsche — les deux légendes de cette année\n📚 «Go Like Hell» de A.J. Baime — le livre dont le film est tiré\n\nPorsche était déjà là en 1966. La 906 finissait 4ème et 5ème overall. Le début d'une légende.",
  "flat-six": "Le flat-six Porsche en 2 minutes :\n\nC'est un moteur à 6 cylindres opposés à plat (boxeur). Les pistons s'affrontent horizontalement, pas verticalement.\n\nPourquoi c'est une légende :\n✅ Centre de gravité ultra-bas → meilleure tenue de route\n✅ Son inimitable — le «chant» de la 911\n✅ Refroidi par air jusqu'en 1998 (993), puis eau\n✅ Fiabilité légendaire — des moteurs qui font 300 000 km\n\nLa ressource parfaite : chaîne YouTube «Engineering Explained» — épisode flat-six Porsche. 45 min qui changent tout.",
};

export default function DropOut() {
  const [activePassion, setActivePassion] = useState("Porsche 911");
  const [msgs, setMsgs] = useState([
    { role:"ai", content:"Bienvenue dans ton univers Porsche 911. 🏎️\n\nJ'ai centralisé 847 ressources sur ce sujet — vidéos, podcasts, articles, forums, livres. Tout est là.\n\nDis-moi ce que tu viens de voir, lire ou découvrir, et je t'emmène plus loin." }
  ]);
  const [input, setInput] = useState("");

 const send = (text?: string) => {
    const q = text || input.trim();
    if (!q) return;
    const userMsg = { role:"user", content: q };
    let response = DEMO_RESPONSES.default;
    if (q.toLowerCase().includes("mans") || q.toLowerCase().includes("film")) response = DEMO_RESPONSES["Le Mans 66"];
    if (q.toLowerCase().includes("flat") || q.toLowerCase().includes("moteur")) response = DEMO_RESPONSES["flat-six"];
    setMsgs(prev => [...prev, userMsg, { role:"ai", content: response }]);
    setInput("");
  };

  return (
    <>
      <style>{STYLES}</style>

      <header className="header">
        <div className="logo">DROP<span>OUT</span></div>
        <div className="passion-pill">
          <div className="passion-dot"/>
          🏎️ Porsche 911 · 847 ressources
        </div>
        <div className="header-right">
          <span className="demo-badge">DÉMO</span>
          <div className="level-badge">Niveau 4 · Passionné</div>
          <div className="streak">🔥 <strong>23</strong> jours</div>
          <button className="new-btn">+ Nouvelle passion</button>
        </div>
      </header>

      <div className="passions-bar">
        {PASSIONS.map(p => (
          <button key={p.label} className={`passion-tab${activePassion === p.label ? " active" : ""}`} onClick={() => setActivePassion(p.label)}>
            {p.icon} {p.label}
          </button>
        ))}
        <button className="add-passion">+ Ajouter</button>
      </div>

      <div className="hero">
        <div className="hero-bg"/>
        <div className="hero-content">
          <div className="hero-tag">Ta passion · Depuis 23 jours</div>
          <div className="hero-title">PORSCHE<br/><span>911</span></div>
          <div className="hero-sub">847 ressources centralisées. Vidéos, podcasts, articles, forums, livres. Tout ce qui existe sur la 911 — au même endroit.</div>
          <div className="hero-stats">
            {[["847","Ressources"],["23","Jours streak"],["34%","Exploré"],["6","Univers"]].map(([n,l]) => (
              <div key={l}><div className="hstat-n">{n}</div><div className="hstat-l">{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div className="body">
        <div className="left">

          <div className="section">
            <div className="section-header">
              <div className="section-title">TON PARCOURS</div>
              <div className="section-meta">5 étapes</div>
            </div>
            <div className="prog-section">
              <div className="prog-header">
                <div className="prog-title">Maîtriser la Porsche 911</div>
                <div className="prog-pct">34%</div>
              </div>
              <div className="prog-bar"><div className="prog-fill" style={{width:"34%"}}/></div>
              <div className="prog-items">
                {PROG_ITEMS.map((it, i) => (
                  <div key={i} className={`prog-item${it.done ? " done" : ""}`}>
                    <div className="prog-check">{it.done ? "✓" : ""}</div>
                    {it.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <div className="section-title">RESSOURCES DU MOMENT</div>
              <button className="see-all">Voir tout →</button>
            </div>
            <div className="res-grid">
              {RESOURCES.map((r, i) => (
                <div key={i} className="res-card">
                  <span className={`res-tag rt-${r.tag}`}>{r.tagLabel}</span>
                  <div className="res-type"><div className="res-type-dot" style={{background:r.dot}}/>{r.type}</div>
                  <div className="res-title">{r.title}</div>
                  <div className="res-source">{r.source}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <div className="section-title">VA PLUS LOIN</div>
              <div className="section-meta">Univers connectés</div>
            </div>
            <div className="univers-row">
              {UNIVERS.map((u, i) => (
                <div key={i} className="univ-card">
                  <span className="univ-icon">{u.icon}</span>
                  <div className="univ-title">{u.title}</div>
                  <div className="univ-sub">{u.sub}</div>
                  <span className="univ-arrow">→</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <div className="section-title">CE QUE TU AS EXPLORÉ</div>
              <button className="see-all">Historique →</button>
            </div>
            <div className="timeline">
              {TIMELINE.map((t, i) => (
                <div key={i} className="tl-item">
                  <div className="tl-date">{t.date}</div>
                  <div className="tl-line"/>
                  <div className="tl-content">
                    <div className="tl-title">{t.title}</div>
                    <div className="tl-sub">{t.sub}</div>
                    <div className="tl-type">{t.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="right">
          <div className="chat-header">
            <div className="chat-header-top">
              <div className="chat-logo">DO</div>
              <div>
                <div className="chat-name">DropOut · Explorateur</div>
              </div>
              <div className="passion-dot" style={{marginLeft:"auto"}}/>
            </div>
            <div className="chat-status">Dis-moi ce que tu viens de voir, lire ou découvrir</div>
            <div className="chat-context">
              <span className="ctx-tag">🏎️ Porsche 911</span>
              <span className="ctx-tag">Niveau 4</span>
              <span className="ctx-tag">847 ressources</span>
            </div>
          </div>

          <div className="chat-msgs">
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className="msg-av">{m.role === "ai" ? "DO" : "M"}</div>
                <div className="bubble">{m.content}</div>
              </div>
            ))}
          </div>

          <div className="suggestions">
            <div className="suggestions-label">Suggestions</div>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="sugg" onClick={() => send(s)}>{s}</button>
            ))}
          </div>

          <div className="chat-input-area">
            <div className="chat-input-row">
              <input className="chat-field" placeholder="Un film vu, une question, une découverte..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }}/>
              <button className="chat-send" onClick={() => send()} disabled={!input.trim()}>→</button>
            </div>
            <div className="chat-hint">DROPOUT · EXPLORE SANS LIMITES</div>
          </div>
        </div>
      </div>
    </>
  );
}