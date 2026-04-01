"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const SUGGESTED_PASSIONS = ["Porsche 911","Running","Photographie","Histoire de France","Cuisine japonaise","Jazz","Architecture","Investissement","Yoga","Astronomie","Surf","Vin"];
const LEVELS = ["Curieux","Passionné","Expert"];
const BADGES = [
  { id:"first", label:"Premier pas", xp:0, icon:"◈", desc:"Bienvenue sur AkoLab" },
  { id:"curious", label:"Curieux", xp:50, icon:"◉", desc:"50 XP — tu commences" },
  { id:"learner", label:"Apprenant", xp:150, icon:"◇", desc:"150 XP — bel engagement" },
  { id:"expert", label:"Expert", xp:400, icon:"◆", desc:"400 XP — tu maîtrises" },
];

export default function Home() {
  const [phase, setPhase] = useState<"onboarding"|"dashboard">("onboarding");
  const [obStep, setObStep] = useState(0);
  const [profile, setProfile] = useState({ name:"", passions:[] as string[], levels:{} as Record<string,string> });
  const [newPassionInput, setNewPassionInput] = useState("");
  const [activePassion, setActivePassion] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saved, setSaved] = useState<any[]>([]);
  const [xp, setXp] = useState(0);
  const [consumed, setConsumed] = useState<Set<string>>(new Set());
  const [showXpPop, setShowXpPop] = useState<string|null>(null);
  const [rpTab, setRpTab] = useState("feed");
  const [chatMsgs, setChatMsgs] = useState<any[]>([]);
  const [chatIn, setChatIn] = useState("");
  const [chatLoad, setChatLoad] = useState(false);
  const [addingPassion, setAddingPassion] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string|null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const feedEnd = useRef<HTMLDivElement>(null);

  const blue = "#0066ff";
  const bluePale = "rgba(0,102,255,0.08)";
  const blueBorder = "rgba(0,102,255,0.25)";
  const level = Math.floor(xp / 100) + 1;

  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:"smooth"}); }, [chatMsgs]);

  const loadFeed = useCallback(async (passion: string, p: number, append = false) => {
    if (p === 1) { setLoading(true); setFeed([]); setPage(1); }
    else setLoadingMore(true);
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({passion, type:"feed", page: p})
      });
      const data = await res.json();
      if (data.resources?.length) {
        if (append) setFeed(prev => [...prev, ...data.resources.map((r:any,i:number) => ({...r, id:`${Date.now()}-${i}`}))]);
        else setFeed(data.resources.map((r:any,i:number) => ({...r, id:`${Date.now()}-${i}`})));
      }
    } catch(e) { console.error(e); }
    if (p === 1) setLoading(false); else setLoadingMore(false);
  }, []);

  const startDashboard = () => {
    const firstPassion = profile.passions[0];
    setActivePassion(firstPassion);
    setChatMsgs([{role:"ai", content:`Bonjour ${profile.name} ! Je suis AkoLab, ton assistant d'apprentissage. Tu explores ${profile.passions.join(", ")}. Je centralise pour toi les meilleures ressources sur chaque sujet. Par quoi on commence ?`}]);
    loadFeed(firstPassion, 1);
    setPhase("dashboard");
  };

  const switchPassion = (p: string) => {
    setActivePassion(p);
    setFilter("ALL");
    setPage(1);
    setPlayingVideo(null);
    loadFeed(p, 1);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeed(activePassion, nextPage, true);
  };

  const addPassion = async (passion: string) => {
    if (!passion.trim() || profile.passions.includes(passion)) return;
    setProfile(p => ({...p, passions:[...p.passions, passion], levels:{...p.levels, [passion]:"Curieux"}}));
    setNewPassionInput("");
    setAddingPassion(false);
    setActivePassion(passion);
    loadFeed(passion, 1);
  };

  const consumeResource = (id: string, earnXp: number) => {
    if (consumed.has(id)) return;
    setConsumed(prev => new Set([...prev, id]));
    setXp(prev => prev + earnXp);
    setShowXpPop(`+${earnXp} XP`);
    setTimeout(() => setShowXpPop(null), 1400);
  };

  const toggleSave = (item: any) => {
    setSaved(prev => prev.find(s => s.url === item.url) ? prev.filter(s => s.url !== item.url) : [...prev, item]);
  };
  const isSaved = (item: any) => saved.some(s => s.url === item.url);

  const sendChat = async (text?: string) => {
    const q = text || chatIn.trim();
    if (!q) return;
    setChatMsgs(p => [...p, {role:"user", content:q}]);
    setChatIn(""); setChatLoad(true);
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({passion: `${q} (contexte: ${profile.name} explore ${activePassion})`, type:"chat"})
      });
      const data = await res.json();
      setChatMsgs(p => [...p, {role:"ai", content:data.response}]);
    } catch { setChatMsgs(p => [...p, {role:"ai", content:"Erreur de connexion."}]); }
    setChatLoad(false);
  };

  const filteredFeed = feed.filter(item => filter === "ALL" || item.type === filter);
  const earnedBadges = BADGES.filter(b => xp >= b.xp);

  // ── ONBOARDING ──────────────────────────────────────────────────────────────
  if (phase === "onboarding") {
    return (
      <div style={{minHeight:"100vh", background:"#080808", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans',sans-serif"}}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
          *{box-sizing:border-box;margin:0;padding:0}
          html,body{background:#080808;-webkit-font-smoothing:antialiased}
          @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
          input::placeholder{color:rgba(255,255,255,0.2)}
          input{outline:none}
          button{cursor:pointer;font-family:'DM Sans',sans-serif}
        `}</style>

        <div style={{maxWidth:520, width:"100%", animation:"fadeIn .5s ease"}}>

          {/* Logo */}
          <div style={{textAlign:"center", marginBottom:48}}>
            <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:36, letterSpacing:4, color:"white"}}>AKO<span style={{color:"#0066ff"}}>LAB</span></div>
            <div style={{fontSize:12, color:"rgba(255,255,255,0.3)", letterSpacing:"2px", textTransform:"uppercase", marginTop:4}}>Explore sans limites</div>
          </div>

          {/* Progress */}
          <div style={{display:"flex", gap:6, marginBottom:40}}>
            {[0,1,2].map(i => (
              <div key={i} style={{flex:1, height:2, background: i<=obStep?"#0066ff":"rgba(255,255,255,0.08)", transition:"background .4s"}}/>
            ))}
          </div>

          {/* STEP 0 — Prénom */}
          {obStep === 0 && (
            <div style={{animation:"fadeIn .4s ease"}}>
              <div style={{fontSize:11, letterSpacing:"3px", textTransform:"uppercase", color:"#0066ff", marginBottom:16}}>Etape 1 — Qui es-tu ?</div>
              <div style={{fontFamily:"'Playfair Display',serif", fontSize:42, fontWeight:400, color:"white", lineHeight:1.1, marginBottom:8}}>
                Ton <em style={{fontStyle:"italic", color:"#0066ff"}}>prénom</em>
              </div>
              <div style={{fontSize:14, color:"rgba(255,255,255,0.35)", marginBottom:36, fontWeight:300}}>Pour que tout soit vraiment fait pour toi.</div>
              <input
                autoFocus
                value={profile.name}
                onChange={e => setProfile(p => ({...p, name:e.target.value}))}
                onKeyDown={e => e.key==="Enter" && profile.name.trim().length>1 && setObStep(1)}
                placeholder="Écris ton prénom..."
                style={{width:"100%", background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,0.15)", padding:"16px 0", fontSize:32, fontFamily:"'Playfair Display',serif", color:"white", caretColor:"#0066ff", marginBottom:40}}
              />
              <button
                onClick={() => setObStep(1)}
                disabled={profile.name.trim().length < 2}
                style={{width:"100%", padding:"16px", background: profile.name.trim().length>1?"#0066ff":"rgba(255,255,255,0.05)", border:"none", fontSize:12, fontWeight:600, letterSpacing:"2px", textTransform:"uppercase", color: profile.name.trim().length>1?"white":"rgba(255,255,255,0.2)", transition:"all .3s"}}
              >
                Continuer
              </button>
            </div>
          )}

          {/* STEP 1 — Passions */}
          {obStep === 1 && (
            <div style={{animation:"fadeIn .4s ease"}}>
              <div style={{fontSize:11, letterSpacing:"3px", textTransform:"uppercase", color:"#0066ff", marginBottom:16}}>Etape 2 — Tes passions</div>
              <div style={{fontFamily:"'Playfair Display',serif", fontSize:42, fontWeight:400, color:"white", lineHeight:1.1, marginBottom:8}}>
                Ce qui te <em style={{fontStyle:"italic", color:"#0066ff"}}>passionne</em>
              </div>
              <div style={{fontSize:14, color:"rgba(255,255,255,0.35)", marginBottom:28, fontWeight:300}}>Sélectionne ou écris n'importe quoi — même le plus niche.</div>

              {/* Suggestions */}
              <div style={{display:"flex", flexWrap:"wrap", gap:8, marginBottom:20}}>
                {SUGGESTED_PASSIONS.map(p => (
                  <button key={p} onClick={() => {
                    if (profile.passions.includes(p)) setProfile(prev => ({...prev, passions:prev.passions.filter(x=>x!==p)}));
                    else setProfile(prev => ({...prev, passions:[...prev.passions, p], levels:{...prev.levels, [p]:"Curieux"}}));
                  }} style={{padding:"8px 16px", background: profile.passions.includes(p)?"rgba(0,102,255,0.15)":"rgba(255,255,255,0.04)", border: profile.passions.includes(p)?"1px solid rgba(0,102,255,0.4)":"1px solid rgba(255,255,255,0.08)", fontSize:13, color: profile.passions.includes(p)?"#4da6ff":"rgba(255,255,255,0.5)", borderRadius:0, transition:"all .2s"}}>
                    {p}
                  </button>
                ))}
              </div>

              {/* Ajout libre */}
              <div style={{display:"flex", gap:8, marginBottom:28}}>
                <input
                  value={newPassionInput}
                  onChange={e => setNewPassionInput(e.target.value)}
                  onKeyDown={e => { if(e.key==="Enter" && newPassionInput.trim()) { setProfile(p => ({...p, passions:[...p.passions, newPassionInput.trim()], levels:{...p.levels, [newPassionInput.trim()]:"Curieux"}})); setNewPassionInput(""); } }}
                  placeholder="Autre chose ? Écris n'importe quoi..."
                  style={{flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", padding:"10px 14px", fontSize:13, color:"white", caretColor:"#0066ff"}}
                />
                <button
                  onClick={() => { if(newPassionInput.trim()) { setProfile(p => ({...p, passions:[...p.passions, newPassionInput.trim()], levels:{...p.levels, [newPassionInput.trim()]:"Curieux"}})); setNewPassionInput(""); } }}
                  style={{padding:"0 16px", background:"rgba(0,102,255,0.15)", border:"1px solid rgba(0,102,255,0.3)", color:"#4da6ff", fontSize:13}}
                >+</button>
              </div>

              {profile.passions.length > 0 && (
                <div style={{marginBottom:24, padding:"12px 16px", background:"rgba(0,102,255,0.05)", border:"1px solid rgba(0,102,255,0.15)"}}>
                  <div style={{fontSize:10, letterSpacing:"2px", color:"rgba(0,102,255,0.7)", marginBottom:8, textTransform:"uppercase"}}>Sélectionnées ({profile.passions.length})</div>
                  <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
                    {profile.passions.map(p => (
                      <span key={p} style={{fontSize:12, color:"#4da6ff", padding:"3px 10px", background:"rgba(0,102,255,0.1)", border:"1px solid rgba(0,102,255,0.2)", display:"flex", alignItems:"center", gap:6}}>
                        {p}
                        <span onClick={() => setProfile(prev => ({...prev, passions:prev.passions.filter(x=>x!==p)}))} style={{cursor:"pointer", color:"rgba(0,102,255,0.5)", fontSize:14}}>×</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setObStep(2)}
                disabled={profile.passions.length === 0}
                style={{width:"100%", padding:"16px", background: profile.passions.length>0?"#0066ff":"rgba(255,255,255,0.05)", border:"none", fontSize:12, fontWeight:600, letterSpacing:"2px", textTransform:"uppercase", color: profile.passions.length>0?"white":"rgba(255,255,255,0.2)", transition:"all .3s"}}
              >
                Continuer ({profile.passions.length} passion{profile.passions.length>1?"s":""})
              </button>
            </div>
          )}

          {/* STEP 2 — Niveaux */}
          {obStep === 2 && (
            <div style={{animation:"fadeIn .4s ease"}}>
              <div style={{fontSize:11, letterSpacing:"3px", textTransform:"uppercase", color:"#0066ff", marginBottom:16}}>Etape 3 — Ton niveau</div>
              <div style={{fontFamily:"'Playfair Display',serif", fontSize:42, fontWeight:400, color:"white", lineHeight:1.1, marginBottom:8}}>
                Où tu en <em style={{fontStyle:"italic", color:"#0066ff"}}>es ?</em>
              </div>
              <div style={{fontSize:14, color:"rgba(255,255,255,0.35)", marginBottom:32, fontWeight:300}}>Pour adapter les ressources à ton niveau.</div>

              <div style={{display:"flex", flexDirection:"column", gap:12, marginBottom:36}}>
                {profile.passions.map(p => (
                  <div key={p} style={{background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", padding:"14px 16px"}}>
                    <div style={{fontSize:13, color:"white", fontWeight:500, marginBottom:10}}>{p}</div>
                    <div style={{display:"flex", gap:6}}>
                      {LEVELS.map(l => (
                        <button key={l} onClick={() => setProfile(prev => ({...prev, levels:{...prev.levels, [p]:l}}))} style={{flex:1, padding:"8px 4px", background: profile.levels[p]===l?"rgba(0,102,255,0.15)":"transparent", border: profile.levels[p]===l?"1px solid rgba(0,102,255,0.4)":"1px solid rgba(255,255,255,0.07)", fontSize:11, color: profile.levels[p]===l?"#4da6ff":"rgba(255,255,255,0.35)", letterSpacing:"0.5px"}}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={startDashboard}
                style={{width:"100%", padding:"18px", background:"#0066ff", border:"none", fontSize:13, fontWeight:600, letterSpacing:"2px", textTransform:"uppercase", color:"white"}}
              >
                Lancer AkoLab →
              </button>
            </div>
          )}

          <button onClick={() => obStep > 0 && setObStep(o => o-1)} style={{display:obStep>0?"block":"none", background:"none", border:"none", color:"rgba(255,255,255,0.2)", fontSize:12, marginTop:20, width:"100%", textAlign:"center", letterSpacing:"1px", textTransform:"uppercase"}}>
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ───────────────────────────────────────────────────────────────
  return (
    <div style={{display:"grid", gridTemplateColumns:"220px 1fr 300px", height:"100vh", overflow:"hidden", background:"#080808", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@1,400;0,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow:hidden;-webkit-font-smoothing:antialiased}
        button{cursor:pointer;font-family:'DM Sans',sans-serif}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08)}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes xpPop{0%{opacity:0;transform:translate(-50%,-50%) scale(0.7)}20%{opacity:1;transform:translate(-50%,-70%) scale(1.2)}80%{opacity:1;transform:translate(-50%,-90%) scale(1)}100%{opacity:0;transform:translate(-50%,-110%) scale(0.8)}}
        @keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}
        @keyframes bounce{0%,100%{transform:translateY(0);opacity:0.3}50%{transform:translateY(-5px);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        iframe{border:none;display:block}
      `}</style>

      {/* XP POPUP */}
      {showXpPop && (
        <div style={{position:"fixed", top:"45%", left:"50%", zIndex:1000, fontFamily:"'Bebas Neue',cursive", fontSize:44, color:blue, letterSpacing:3, animation:"xpPop 1.4s ease forwards", pointerEvents:"none", textShadow:`0 0 30px ${blue}`}}>
          {showXpPop}
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{background:"#0a0a0a", borderRight:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden"}}>

        {/* Logo + profil */}
        <div style={{padding:"24px 20px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:22, letterSpacing:3, marginBottom:2}}>AKO<span style={{color:blue}}>LAB</span></div>
          <div style={{fontSize:11, color:"rgba(255,255,255,0.25)", letterSpacing:"1px"}}>Explore sans limites</div>
          <div style={{marginTop:16, display:"flex", alignItems:"center", gap:10}}>
            <div style={{width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,${blue},#66aaff)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Playfair Display',serif", fontSize:16, color:"white", fontStyle:"italic", flexShrink:0}}>
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:13, fontWeight:600, color:"white"}}>{profile.name}</div>
              <div style={{fontSize:10, color:"rgba(255,255,255,0.3)"}}>Niveau {level} · {xp} XP</div>
            </div>
          </div>
          {/* XP bar */}
          <div style={{marginTop:10, height:2, background:"rgba(255,255,255,0.06)"}}>
            <div style={{height:"100%", background:`linear-gradient(90deg,${blue},#66aaff)`, width:`${xp%100}%`, transition:"width .6s"}}/>
          </div>
        </div>

        {/* Passions */}
        <div style={{flex:1, overflowY:"auto", padding:"16px 12px"}}>
          <div style={{fontSize:9, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.2)", marginBottom:10, padding:"0 8px"}}>Mes passions</div>

          {profile.passions.map(p => (
            <div key={p} onClick={() => switchPassion(p)} style={{display:"flex", alignItems:"center", gap:10, padding:"10px 12px", marginBottom:2, background: activePassion===p?bluePale:"transparent", border: activePassion===p?`1px solid ${blueBorder}`:"1px solid transparent", cursor:"pointer", transition:"all .2s"}}>
              <div style={{width:6, height:6, borderRadius:"50%", background: activePassion===p?blue:"rgba(255,255,255,0.15)", flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13, fontWeight: activePassion===p?600:400, color: activePassion===p?"white":"rgba(255,255,255,0.5)"}}>{p}</div>
                <div style={{fontSize:10, color:"rgba(255,255,255,0.2)"}}>{profile.levels[p] || "Curieux"}</div>
              </div>
              {activePassion===p && <div style={{width:4, height:4, borderRadius:"50%", background:blue, animation:"pulse 2s infinite"}}/>}
            </div>
          ))}

          {/* Ajouter passion */}
          {addingPassion ? (
            <div style={{padding:"8px 12px", marginTop:8}}>
              <input
                autoFocus
                value={newPassionInput}
                onChange={e => setNewPassionInput(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") addPassion(newPassionInput); if(e.key==="Escape") setAddingPassion(false); }}
                placeholder="Nouvelle passion..."
                style={{width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${blueBorder}`, padding:"8px 12px", fontSize:12, color:"white", caretColor:blue}}
              />
              <div style={{display:"flex", gap:6, marginTop:6}}>
                <button onClick={() => addPassion(newPassionInput)} style={{flex:1, padding:"7px", background:blue, border:"none", fontSize:11, color:"white", letterSpacing:"1px"}}>Ajouter</button>
                <button onClick={() => setAddingPassion(false)} style={{padding:"7px 12px", background:"transparent", border:"1px solid rgba(255,255,255,0.08)", fontSize:11, color:"rgba(255,255,255,0.3)"}}>Annuler</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingPassion(true)} style={{width:"100%", padding:"10px 12px", background:"transparent", border:"1px dashed rgba(255,255,255,0.08)", fontSize:12, color:"rgba(255,255,255,0.25)", textAlign:"left", marginTop:8, letterSpacing:"0.5px"}}>
              + Nouvelle passion
            </button>
          )}
        </div>

        {/* Badges */}
        <div style={{padding:"12px", borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"rgba(255,255,255,0.2)", marginBottom:8}}>Badges ({earnedBadges.length}/{BADGES.length})</div>
          <div style={{display:"flex", gap:8}}>
            {BADGES.map(b => {
              const earned = xp >= b.xp;
              return (
                <div key={b.id} title={`${b.label} — ${b.desc}`} style={{width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background: earned?bluePale:"rgba(255,255,255,0.03)", border:`1px solid ${earned?blueBorder:"rgba(255,255,255,0.06)"}`, fontSize:14, color:earned?blue:"rgba(255,255,255,0.1)", cursor:"default"}}>
                  {b.icon}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── FEED ── */}
      <main style={{display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:"#080808"}}>

        {/* Header */}
        <div style={{padding:"20px 28px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)", flexShrink:0}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:"white", lineHeight:1}}>
                {activePassion}
              </div>
              <div style={{fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:4}}>{profile.levels[activePassion] || "Curieux"} · {feed.length} ressources chargées</div>
            </div>
            <button onClick={() => loadFeed(activePassion, 1)} style={{padding:"8px 16px", background:"transparent", border:`1px solid ${blueBorder}`, fontSize:10, color:blue, letterSpacing:"1.5px", textTransform:"uppercase"}}>
              Actualiser
            </button>
          </div>

          {/* Filters */}
          <div style={{display:"flex", gap:4}}>
            {["ALL","VIDEO","ARTICLE","PODCAST","FORUM"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{padding:"6px 14px", background: filter===f?bluePale:"transparent", border: filter===f?`1px solid ${blueBorder}`:"1px solid rgba(255,255,255,0.06)", fontSize:10, letterSpacing:"1.5px", color: filter===f?blue:"rgba(255,255,255,0.3)", textTransform:"uppercase"}}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Feed list */}
        <div style={{flex:1, overflowY:"auto", padding:"16px 28px"}}>
          {loading ? (
            <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60%", gap:16}}>
              <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:32, color:blue, letterSpacing:3}}>AKOLAB</div>
              <div style={{fontSize:11, letterSpacing:"2px", color:"rgba(255,255,255,0.2)", textTransform:"uppercase"}}>Centralisation des ressources...</div>
              <div style={{width:32, height:32, border:`2px solid rgba(0,102,255,0.2)`, borderTop:`2px solid ${blue}`, borderRadius:"50%", animation:"spin .8s linear infinite"}}/>
            </div>
          ) : (
            <>
              {filteredFeed.map((item, i) => (
                <div key={item.id || i} style={{marginBottom:12, background:"#0f0f0f", border:"1px solid rgba(255,255,255,0.05)", overflow:"hidden", animation:"fadeIn .4s ease", animationDelay:`${i*0.04}s`, animationFillMode:"both"}}>

                  {/* Video embed */}
                  {item.type === "VIDEO" && item.videoId && (
                    <>
                      {playingVideo === item.id ? (
                        <iframe src={`https://www.youtube.com/embed/${item.videoId}?autoplay=1&controls=1&rel=0&modestbranding=1`} style={{width:"100%", height:220}} allow="autoplay; fullscreen" allowFullScreen/>
                      ) : (
                        <div style={{position:"relative", width:"100%", height:200, cursor:"pointer", overflow:"hidden"}} onClick={() => { setPlayingVideo(item.id); consumeResource(item.id, item.xp||15); }}>
                          {item.thumbnail && <img src={item.thumbnail} alt="" style={{width:"100%", height:"100%", objectFit:"cover"}}/>}
                          <div style={{position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center"}}>
                            <div style={{width:52, height:52, borderRadius:"50%", background:`rgba(0,102,255,0.9)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"white"}}>▶</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Article thumbnail */}
                  {item.type !== "VIDEO" && item.thumbnail && (
                    <img src={item.thumbnail} alt="" style={{width:"100%", height:160, objectFit:"cover"}}/>
                  )}

                  {/* Content */}
                  <div style={{padding:"14px 16px"}}>
                    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
                      <span style={{fontSize:9, letterSpacing:"2px", textTransform:"uppercase", padding:"3px 8px", fontWeight:600, color: item.type==="VIDEO"?"#4da6ff":item.type==="ARTICLE"?"#4aab87":item.type==="PODCAST"?"#c9a84c":"rgba(255,255,255,0.4)", background: item.type==="VIDEO"?"rgba(77,166,255,0.08)":item.type==="ARTICLE"?"rgba(74,171,135,0.08)":item.type==="PODCAST"?"rgba(201,168,76,0.08)":"rgba(255,255,255,0.04)", border: item.type==="VIDEO"?"1px solid rgba(77,166,255,0.2)":item.type==="ARTICLE"?"1px solid rgba(74,171,135,0.2)":item.type==="PODCAST"?"1px solid rgba(201,168,76,0.2)":"1px solid rgba(255,255,255,0.06)"}}>
                        {item.type}
                      </span>
                      <span style={{fontSize:11, color:"rgba(255,255,255,0.25)"}}>{item.source}</span>
                      <span style={{fontSize:11, color:"rgba(255,255,255,0.2)", marginLeft:"auto"}}>{item.duration}</span>
                      {consumed.has(item.id) && <span style={{fontSize:10, color:blue, fontWeight:600}}>+{item.xp} XP</span>}
                    </div>

                    <div style={{fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"white", lineHeight:1.3, marginBottom:8}}>
                      {item.title}
                    </div>

                    {item.excerpt && (
                      <div style={{fontSize:13, color:"rgba(255,255,255,0.4)", lineHeight:1.65, marginBottom:14, fontWeight:300}}>
                        {item.excerpt.slice(0, 160)}{item.excerpt.length > 160 ? "..." : ""}
                      </div>
                    )}

                    <div style={{display:"flex", gap:8}}>
                      {item.url && item.url !== "#" && item.type !== "VIDEO" && (
                        <button onClick={() => { window.open(item.url, "_blank"); consumeResource(item.id, item.xp||10); }} style={{padding:"8px 18px", background:blue, border:"none", fontSize:10, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:"white"}}>
                          Lire
                        </button>
                      )}
                      {item.type === "VIDEO" && !playingVideo && (
                        <button onClick={() => { setPlayingVideo(item.id); consumeResource(item.id, item.xp||15); }} style={{padding:"8px 18px", background:blue, border:"none", fontSize:10, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:"white"}}>
                          Regarder
                        </button>
                      )}
                      <button onClick={() => toggleSave(item)} style={{padding:"8px 14px", background: isSaved(item)?bluePale:"transparent", border: isSaved(item)?`1px solid ${blueBorder}`:"1px solid rgba(255,255,255,0.07)", fontSize:10, letterSpacing:"1px", textTransform:"uppercase", color: isSaved(item)?blue:"rgba(255,255,255,0.3)"}}>
                        {isSaved(item) ? "✓ Sauvé" : "Sauvegarder"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load more */}
              {filteredFeed.length > 0 && (
                <div style={{textAlign:"center", padding:"20px 0"}}>
                  <button onClick={loadMore} disabled={loadingMore} style={{padding:"12px 32px", background:"transparent", border:`1px solid ${blueBorder}`, fontSize:11, letterSpacing:"2px", textTransform:"uppercase", color:blue}}>
                    {loadingMore ? "Chargement..." : "Charger plus →"}
                  </button>
                </div>
              )}

              <div ref={feedEnd}/>
            </>
          )}
        </div>
      </main>

      {/* ── RIGHT PANEL ── */}
      <aside style={{background:"#0a0a0a", borderLeft:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden"}}>

        <div style={{padding:"20px 18px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{fontSize:12, fontWeight:600, letterSpacing:"1px", marginBottom:2}}>Assistant AkoLab</div>
          <div style={{fontSize:10, color:"rgba(255,255,255,0.25)"}}>Bonjour {profile.name} · {activePassion}</div>
        </div>

        <div style={{display:"flex", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"0 18px"}}>
          {["chat","saved"].map(t => (
            <button key={t} onClick={() => setRpTab(t)} style={{padding:"9px 14px 7px", fontSize:9, letterSpacing:"2px", textTransform:"uppercase" as const, color: rpTab===t?"#f0ede8":"rgba(255,255,255,0.25)", borderBottom: rpTab===t?`1px solid ${blue}`:"1px solid transparent", background:"none", border:"none", borderBottomWidth:"1px", borderBottomStyle:"solid" as const, borderBottomColor: rpTab===t?blue:"transparent"}}>
              {t === "saved" ? `Sauvegardés (${saved.length})` : t}
            </button>
          ))}
        </div>

        <div style={{flex:1, overflowY:"auto", padding:"12px"}}>

          {rpTab === "chat" && (
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              {chatMsgs.map((m,i) => (
                <div key={i} style={{display:"flex", gap:8, flexDirection: m.role==="user"?"row-reverse":"row", animation:"fadeIn .3s ease"}}>
                  <div style={{width:22, height:22, background: m.role==="ai"?blue:"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"white", flexShrink:0, fontFamily:"'Bebas Neue',cursive", borderRadius:"50%"}}>
                    {m.role==="ai"?"AK":profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{padding:"10px 12px", fontSize:13, lineHeight:1.7, maxWidth:"82%", fontWeight:300, background: m.role==="ai"?"#161616":bluePale, color: m.role==="ai"?"rgba(255,255,255,0.7)":"white", borderLeft: m.role==="ai"?`2px solid ${blue}`:"none", whiteSpace:"pre-wrap" as const}}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoad && (
                <div style={{display:"flex", gap:8}}>
                  <div style={{width:22, height:22, background:blue, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"white", fontFamily:"'Bebas Neue',cursive", borderRadius:"50%"}}>AK</div>
                  <div style={{padding:"10px 12px", background:"#161616", borderLeft:`2px solid ${blue}`, display:"flex", gap:4, alignItems:"center"}}>
                    {[0,1,2].map(i => <div key={i} style={{width:4, height:4, borderRadius:"50%", background:blue, opacity:0.5, animation:`bounce 1.1s ease infinite ${i*0.18}s`}}/>)}
                  </div>
                </div>
              )}
              <div ref={chatEnd}/>
            </div>
          )}

          {rpTab === "saved" && (
            <>
              {saved.length === 0 ? (
                <div style={{textAlign:"center", padding:"48px 16px", color:"rgba(255,255,255,0.2)", fontSize:13}}>
                  Aucune ressource sauvegardée.<br/>
                  <span style={{fontSize:11, marginTop:6, display:"block"}}>Clique sur "Sauvegarder" dans le feed.</span>
                </div>
              ) : saved.map((item, i) => (
                <div key={i} style={{padding:"10px", background:"#111", border:"1px solid rgba(255,255,255,0.05)", marginBottom:6, cursor:"pointer", display:"flex", gap:8}} onClick={() => item.url && item.url !== "#" && window.open(item.url, "_blank")}>
                  {item.thumbnail && <img src={item.thumbnail} alt="" style={{width:52, height:36, objectFit:"cover", flexShrink:0}}/>}
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase" as const, color:"rgba(255,255,255,0.25)", marginBottom:3}}>{item.type}</div>
                    <div style={{fontSize:12, fontWeight:500, color:"white", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const}}>{item.title}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleSave(item); }} style={{background:"none", border:"none", color:"rgba(255,255,255,0.2)", fontSize:16, padding:"0 4px"}}>×</button>
                </div>
              ))}
            </>
          )}
        </div>

        {rpTab === "chat" && (
          <div style={{padding:"12px", borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{display:"flex", gap:8}}>
              <input
                value={chatIn}
                onChange={e => setChatIn(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") sendChat(); }}
                placeholder={`Dis-moi tout sur ${activePassion}...`}
                style={{flex:1, background:"#161616", border:"1px solid rgba(255,255,255,0.07)", padding:"10px 12px", fontSize:12, color:"white", caretColor:blue}}
              />
              <button onClick={() => sendChat()} disabled={chatLoad || !chatIn.trim()} style={{width:36, height:36, background:blue, border:"none", color:"white", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center"}}>→</button>
            </div>
          </div>
        )}
      </aside>

      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:0.3}50%{transform:translateY(-5px);opacity:1}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
