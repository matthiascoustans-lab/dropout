"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const SUGGESTED_PASSIONS = ["Porsche 911","Running","Photographie","Histoire","Cuisine japonaise","Jazz","Architecture","Investissement","Yoga","Astronomie","Surf","Vin","Tennis","Littérature"];
const LEVELS = ["Débutant","Passionné","Expert"];
const BADGES = [
  { id:"first", label:"Premier pas", xp:0, icon:"◈", desc:"Bienvenue" },
  { id:"curious", label:"Curieux", xp:50, icon:"◉", desc:"50 XP" },
  { id:"learner", label:"Apprenant", xp:150, icon:"◇", desc:"150 XP" },
  { id:"expert", label:"Expert", xp:400, icon:"◆", desc:"400 XP" },
];

const BLUE = "#0055ff";
const BLUE_PALE = "#f0f4ff";
const BLUE_MID = "#e0e8ff";

export default function Home() {
  const [phase, setPhase] = useState<"onboarding"|"dashboard">("onboarding");
  const [obStep, setObStep] = useState(0);
  const [profile, setProfile] = useState({ name:"", passions:[] as string[], levels:{} as Record<string,string> });
  const [newPassionInput, setNewPassionInput] = useState("");
  const [activePassion, setActivePassion] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [feed, setFeed] = useState<any[]>([]);
  const [newsFeed, setNewsFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<any[]>([]);
  const [xp, setXp] = useState(0);
  const [consumed, setConsumed] = useState<Set<string>>(new Set());
  const [showXpPop, setShowXpPop] = useState<string|null>(null);
  const [rpTab, setRpTab] = useState("chat");
  const [chatMsgs, setChatMsgs] = useState<any[]>([]);
  const [chatIn, setChatIn] = useState("");
  const [chatLoad, setChatLoad] = useState(false);
  const [addingPassion, setAddingPassion] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string|null>(null);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [activeSubcat, setActiveSubcat] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("viewCount");
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:"smooth"}); }, [chatMsgs]);

  const loadFeed = useCallback(async (passion: string, p: number, append = false, subcat = "", date = "", order = "viewCount") => {
    if (p === 1) { setLoading(true); setFeed([]); }
    else setLoadingMore(true);
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({passion, type:"feed", page: p, subcategory: subcat, dateFilter: date, order})
      });
      const data = await res.json();
      if (data.resources?.length) {
        const items = data.resources.map((r:any,i:number) => ({...r, id:`${Date.now()}-${i}`}));
        if (append) setFeed(prev => [...prev, ...items]);
        else setFeed(items);
      }
      if (data.subcategories?.length) setSubcategories(data.subcategories);
    } catch(e) { console.error(e); }
    if (p === 1) setLoading(false); else setLoadingMore(false);
  }, []);

  const loadNews = useCallback(async (passion: string) => {
    setNewsLoading(true); setNewsFeed([]);
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({passion, type:"news"})
      });
      const data = await res.json();
      if (data.resources?.length) setNewsFeed(data.resources);
    } catch(e) { console.error(e); }
    setNewsLoading(false);
  }, []);

  const startDashboard = () => {
    const p = profile.passions[0];
    setActivePassion(p);
    setChatMsgs([{role:"ai", content:`Bonjour ${profile.name} ! Je centralise les meilleures ressources sur ${profile.passions.join(", ")}. Par quoi voulez-vous commencer ?`}]);
    loadFeed(p, 1);
    setPhase("dashboard");
  };

  const switchPassion = (p: string) => {
    setActivePassion(p); setFilter("ALL"); setPage(1);
    setPlayingVideo(null); setActiveSubcat(""); setDateFilter(""); setSortOrder("viewCount");
    loadFeed(p, 1);
  };

  const addPassion = (passion: string) => {
    if (!passion.trim() || profile.passions.includes(passion)) return;
    setProfile(p => ({...p, passions:[...p.passions, passion], levels:{...p.levels, [passion]:"Débutant"}}));
    setNewPassionInput(""); setAddingPassion(false);
    setActivePassion(passion); loadFeed(passion, 1);
  };

  const consumeResource = (id: string, earnXp: number) => {
    if (consumed.has(id)) return;
    setConsumed(prev => new Set([...prev, id]));
    setXp(prev => prev + earnXp);
    setShowXpPop(`+${earnXp} XP`);
    setTimeout(() => setShowXpPop(null), 1400);
  };

  const toggleSave = (item: any) => setSaved(prev => prev.find(s => s.url === item.url) ? prev.filter(s => s.url !== item.url) : [...prev, item]);
  const isSaved = (item: any) => saved.some(s => s.url === item.url);

  const sendChat = async (text?: string) => {
    const q = text || chatIn.trim();
    if (!q) return;
    setChatMsgs(p => [...p, {role:"user", content:q}]);
    setChatIn(""); setChatLoad(true);
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({passion:`${q} (contexte: ${profile.name} explore ${activePassion})`, type:"chat"})
      });
      const data = await res.json();
      setChatMsgs(p => [...p, {role:"ai", content:data.response}]);
    } catch { setChatMsgs(p => [...p, {role:"ai", content:"Erreur."}]); }
    setChatLoad(false);
  };

  const handleFilterChange = (f: string) => {
    setFilter(f);
    if (f === "ACTUALITÉS" && newsFeed.length === 0) loadNews(activePassion);
  };

  const displayFeed = filter === "ACTUALITÉS" ? newsFeed : feed;
  const level = Math.floor(xp / 100) + 1;
  const earnedBadges = BADGES.filter(b => xp >= b.xp);

  // ── ONBOARDING ──────────────────────────────────────────────────────────────
  if (phase === "onboarding") {
    return (
      <div style={{minHeight:"100vh", background:"#fff", fontFamily:"'DM Sans',sans-serif", display:"flex"}}>
        {/* Left panel */}
        <div style={{width:"42%", background:`linear-gradient(160deg,#0033cc,#0055ff,#3377ff)`, display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"48px", position:"sticky", top:0, height:"100vh"}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:32, letterSpacing:4, color:"white"}}>AKOLAB</div>
            <div style={{fontSize:13, color:"rgba(255,255,255,0.5)", letterSpacing:"2px", textTransform:"uppercase", marginTop:4}}>Explore sans limites</div>
          </div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif", fontSize:42, fontWeight:700, color:"white", lineHeight:1.15, marginBottom:24}}>
              Apprends tout ce qui te <em style={{fontStyle:"italic"}}>passionne.</em>
            </div>
            <div style={{fontSize:15, color:"rgba(255,255,255,0.65)", lineHeight:1.8, fontWeight:300}}>
              AkoLab centralise vidéos, articles, podcasts et forums sur n'importe quel sujet.
            </div>
          </div>
          <div style={{display:"flex", gap:32}}>
            {[["∞","Sujets disponibles"],["0","Connaissance perdue"],["1","Endroit pour tout"]].map(([n,l]) => (
              <div key={l}>
                <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:28, color:"white"}}>{n}</div>
                <div style={{fontSize:11, color:"rgba(255,255,255,0.4)"}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right form */}
        <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"48px", overflowY:"auto"}}>
          <div style={{maxWidth:480, width:"100%"}}>
            <div style={{display:"flex", gap:6, marginBottom:40}}>
              {[0,1,2].map(i => <div key={i} style={{flex:1, height:3, borderRadius:2, background: i<=obStep?BLUE:"#e8e8e8", transition:"background .4s"}}/>)}
            </div>

            {obStep === 0 && (
              <div>
                <div style={{fontSize:11, letterSpacing:"2px", textTransform:"uppercase", color:BLUE, marginBottom:12, fontWeight:600}}>Étape 1 sur 3</div>
                <div style={{fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:700, color:"#111", marginBottom:8}}>Ton prénom</div>
                <div style={{fontSize:15, color:"#888", marginBottom:36, fontWeight:300}}>Pour personnaliser toute ton expérience.</div>
                <input autoFocus value={profile.name} onChange={e => setProfile(p => ({...p, name:e.target.value}))}
                  onKeyDown={e => e.key==="Enter" && profile.name.trim().length>1 && setObStep(1)}
                  placeholder="Écris ton prénom..."
                  style={{width:"100%", border:"none", borderBottom:"2px solid #e8e8e8", padding:"14px 0", fontSize:28, fontFamily:"'Playfair Display',serif", color:"#111", caretColor:BLUE, background:"transparent", marginBottom:40}}/>
                <button onClick={() => setObStep(1)} disabled={profile.name.trim().length < 2}
                  style={{width:"100%", padding:"16px", background: profile.name.trim().length>1?BLUE:"#f0f0f0", border:"none", fontSize:13, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color: profile.name.trim().length>1?"white":"#bbb", transition:"all .3s"}}>
                  Continuer →
                </button>
              </div>
            )}

            {obStep === 1 && (
              <div>
                <div style={{fontSize:11, letterSpacing:"2px", textTransform:"uppercase", color:BLUE, marginBottom:12, fontWeight:600}}>Étape 2 sur 3</div>
                <div style={{fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:700, color:"#111", marginBottom:8}}>Tes passions</div>
                <div style={{fontSize:15, color:"#888", marginBottom:28, fontWeight:300}}>Sélectionne ou écris n'importe quoi.</div>
                <div style={{display:"flex", flexWrap:"wrap", gap:8, marginBottom:20}}>
                  {SUGGESTED_PASSIONS.map(p => (
                    <button key={p} onClick={() => {
                      if (profile.passions.includes(p)) setProfile(prev => ({...prev, passions:prev.passions.filter(x=>x!==p)}));
                      else setProfile(prev => ({...prev, passions:[...prev.passions, p], levels:{...prev.levels, [p]:"Débutant"}}));
                    }} style={{padding:"9px 18px", background: profile.passions.includes(p)?BLUE:"#f5f5f5", border:"none", fontSize:13, color: profile.passions.includes(p)?"white":"#444", fontWeight: profile.passions.includes(p)?600:400, transition:"all .2s"}}>
                      {p}
                    </button>
                  ))}
                </div>
                <div style={{display:"flex", gap:8, marginBottom:20}}>
                  <input value={newPassionInput} onChange={e => setNewPassionInput(e.target.value)}
                    onKeyDown={e => { if(e.key==="Enter" && newPassionInput.trim()) { setProfile(p => ({...p, passions:[...p.passions, newPassionInput.trim()], levels:{...p.levels, [newPassionInput.trim()]:"Débutant"}})); setNewPassionInput(""); }}}
                    placeholder="Autre chose ? Ex: Histoire de Bretagne..."
                    style={{flex:1, border:"1px solid #e8e8e8", padding:"10px 14px", fontSize:13, color:"#111", caretColor:BLUE}}/>
                  <button onClick={() => { if(newPassionInput.trim()) { setProfile(p => ({...p, passions:[...p.passions, newPassionInput.trim()], levels:{...p.levels, [newPassionInput.trim()]:"Débutant"}})); setNewPassionInput(""); }}}
                    style={{padding:"0 18px", background:BLUE, border:"none", fontSize:13, color:"white", fontWeight:600}}>+</button>
                </div>
                {profile.passions.length > 0 && (
                  <div style={{marginBottom:20, padding:"12px 16px", background:BLUE_PALE, display:"flex", flexWrap:"wrap", gap:6}}>
                    {profile.passions.map(p => (
                      <span key={p} style={{fontSize:12, color:BLUE, padding:"3px 10px", background:"white", border:`1px solid ${BLUE_MID}`, display:"flex", alignItems:"center", gap:6}}>
                        {p} <span onClick={() => setProfile(prev => ({...prev, passions:prev.passions.filter(x=>x!==p)}))} style={{cursor:"pointer", color:"#aaa", fontSize:14}}>×</span>
                      </span>
                    ))}
                  </div>
                )}
                <button onClick={() => setObStep(2)} disabled={profile.passions.length === 0}
                  style={{width:"100%", padding:"16px", background: profile.passions.length>0?BLUE:"#f0f0f0", border:"none", fontSize:13, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color: profile.passions.length>0?"white":"#bbb", transition:"all .3s"}}>
                  Continuer — {profile.passions.length} passion{profile.passions.length>1?"s":""}
                </button>
              </div>
            )}

            {obStep === 2 && (
              <div>
                <div style={{fontSize:11, letterSpacing:"2px", textTransform:"uppercase", color:BLUE, marginBottom:12, fontWeight:600}}>Étape 3 sur 3</div>
                <div style={{fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:700, color:"#111", marginBottom:8}}>Ton niveau</div>
                <div style={{fontSize:15, color:"#888", marginBottom:28, fontWeight:300}}>Pour adapter les ressources.</div>
                <div style={{display:"flex", flexDirection:"column", gap:10, marginBottom:32}}>
                  {profile.passions.map(p => (
                    <div key={p} style={{border:"1px solid #e8e8e8", padding:"14px 16px"}}>
                      <div style={{fontSize:14, color:"#111", fontWeight:500, marginBottom:10}}>{p}</div>
                      <div style={{display:"flex", gap:6}}>
                        {LEVELS.map(l => (
                          <button key={l} onClick={() => setProfile(prev => ({...prev, levels:{...prev.levels, [p]:l}}))}
                            style={{flex:1, padding:"8px", background: profile.levels[p]===l?BLUE:"#f5f5f5", border:"none", fontSize:12, color: profile.levels[p]===l?"white":"#666", fontWeight: profile.levels[p]===l?600:400}}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={startDashboard}
                  style={{width:"100%", padding:"18px", background:BLUE, border:"none", fontSize:14, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:"white"}}>
                  Lancer AkoLab →
                </button>
              </div>
            )}

            {obStep > 0 && (
              <button onClick={() => setObStep(o => o-1)}
                style={{background:"none", border:"none", color:"#bbb", fontSize:12, marginTop:20, width:"100%", textAlign:"center", letterSpacing:"1px", textTransform:"uppercase"}}>
                ← Retour
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ────────────────────────────────────────────────────────────────
  return (
    <div style={{display:"grid", gridTemplateColumns:"240px 1fr 300px", height:"100vh", overflow:"hidden", background:"#f8f8f8", color:"#111", fontFamily:"'DM Sans',sans-serif"}}>

      {showXpPop && (
        <div style={{position:"fixed", top:"45%", left:"50%", zIndex:1000, fontFamily:"'Bebas Neue',cursive", fontSize:44, color:BLUE, letterSpacing:3, animation:"xpPop 1.4s ease forwards", pointerEvents:"none"}}>
          {showXpPop}
        </div>
      )}

      {/* SIDEBAR */}
      <aside style={{background:"white", borderRight:"1px solid #e8e8e8", display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden"}}>
        <div style={{padding:"22px 20px 18px", borderBottom:"1px solid #f0f0f0"}}>
          <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:22, letterSpacing:3, color:"#111"}}>AKO<span style={{color:BLUE}}>LAB</span></div>
          <div style={{fontSize:11, color:"#bbb", letterSpacing:"1px", marginTop:2}}>Explore sans limites</div>
        </div>

        <div style={{padding:"16px 20px", borderBottom:"1px solid #f0f0f0"}}>
          <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:10}}>
            <div style={{width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${BLUE},#66aaff)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"white", flexShrink:0}}>
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:14, fontWeight:600, color:"#111"}}>{profile.name}</div>
              <div style={{fontSize:11, color:"#aaa"}}>Niveau {level} · {xp} XP</div>
            </div>
          </div>
          <div style={{height:4, background:"#f0f0f0", borderRadius:2, overflow:"hidden"}}>
            <div style={{height:"100%", background:BLUE, width:`${xp%100}%`, borderRadius:2, transition:"width .6s"}}/>
          </div>
        </div>

        <div style={{flex:1, overflowY:"auto", padding:"12px"}}>
          <div style={{fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#bbb", marginBottom:8, padding:"0 8px", fontWeight:600}}>Mes passions</div>
          {profile.passions.map(p => (
            <div key={p} onClick={() => switchPassion(p)}
              style={{display:"flex", alignItems:"center", gap:10, padding:"10px 12px", marginBottom:2, background: activePassion===p?BLUE_PALE:"transparent", borderLeft: activePassion===p?`3px solid ${BLUE}`:"3px solid transparent", cursor:"pointer", transition:"all .15s"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13, fontWeight: activePassion===p?600:400, color: activePassion===p?BLUE:"#333"}}>{p}</div>
                <div style={{fontSize:10, color:"#bbb"}}>{profile.levels[p]}</div>
              </div>
            </div>
          ))}
          {addingPassion ? (
            <div style={{padding:"8px 12px", marginTop:8}}>
              <input autoFocus value={newPassionInput} onChange={e => setNewPassionInput(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") addPassion(newPassionInput); if(e.key==="Escape") setAddingPassion(false); }}
                placeholder="Nouvelle passion..."
                style={{width:"100%", border:`1px solid ${BLUE}`, padding:"8px 12px", fontSize:12, color:"#111", caretColor:BLUE, marginBottom:6}}/>
              <div style={{display:"flex", gap:6}}>
                <button onClick={() => addPassion(newPassionInput)} style={{flex:1, padding:"7px", background:BLUE, border:"none", fontSize:11, color:"white", fontWeight:600}}>Ajouter</button>
                <button onClick={() => setAddingPassion(false)} style={{padding:"7px 12px", background:"#f5f5f5", border:"none", fontSize:11, color:"#999"}}>Annuler</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingPassion(true)}
              style={{width:"100%", padding:"10px 12px", background:"transparent", border:"1px dashed #ddd", fontSize:12, color:"#aaa", textAlign:"left", marginTop:8}}>
              + Nouvelle passion
            </button>
          )}
        </div>

        <div style={{padding:"12px 16px", borderTop:"1px solid #f0f0f0"}}>
          <div style={{fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"#bbb", marginBottom:8, fontWeight:600}}>Badges ({earnedBadges.length}/{BADGES.length})</div>
          <div style={{display:"flex", gap:6}}>
            {BADGES.map(b => {
              const earned = xp >= b.xp;
              return (
                <div key={b.id} title={`${b.label} — ${b.desc}`}
                  style={{width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background: earned?BLUE_PALE:"#f5f5f5", border:`1px solid ${earned?BLUE+"33":"#e8e8e8"}`, fontSize:14, color:earned?BLUE:"#ddd"}}>
                  {b.icon}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* FEED */}
      <main style={{display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:"#f8f8f8"}}>

        {/* Header */}
        <div style={{padding:"16px 24px", borderBottom:"1px solid #e8e8e8", background:"white", flexShrink:0}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12}}>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:"#111"}}>{activePassion}</div>
              <div style={{fontSize:11, color:"#aaa", marginTop:2}}>{profile.levels[activePassion]} · {feed.length} vidéos</div>
            </div>
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); loadFeed(activePassion, 1, false, activeSubcat, e.target.value, sortOrder); }}
                style={{padding:"7px 10px", border:"1px solid #e0e0e0", fontSize:11, color:"#666", background:"white", cursor:"pointer"}}>
                <option value="">Toutes les dates</option>
                <option value="day">Dernières 24h</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
              <select value={sortOrder} onChange={e => { setSortOrder(e.target.value); loadFeed(activePassion, 1, false, activeSubcat, dateFilter, e.target.value); }}
                style={{padding:"7px 10px", border:"1px solid #e0e0e0", fontSize:11, color:"#666", background:"white", cursor:"pointer"}}>
                <option value="viewCount">Plus vus</option>
                <option value="date">Plus récents</option>
                <option value="relevance">Pertinents</option>
              </select>
              <button onClick={() => loadFeed(activePassion, 1, false, activeSubcat, dateFilter, sortOrder)}
                style={{padding:"7px 14px", background:"white", border:`1px solid ${BLUE}`, fontSize:11, color:BLUE, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px"}}>
                ↻
              </button>
            </div>
          </div>

          {/* Sous-catégories */}
          {subcategories.length > 0 && (
            <div style={{display:"flex", gap:6, marginBottom:10, flexWrap:"wrap"}}>
              <button onClick={() => { setActiveSubcat(""); loadFeed(activePassion, 1, false, "", dateFilter, sortOrder); }}
                style={{padding:"5px 14px", background: activeSubcat===""?BLUE:"white", border:`1px solid ${activeSubcat===""?BLUE:"#e0e0e0"}`, fontSize:11, color: activeSubcat===""?"white":"#666", fontWeight: activeSubcat===""?600:400}}>
                Tout
              </button>
              {subcategories.map(s => (
                <button key={s} onClick={() => { setActiveSubcat(s); loadFeed(activePassion, 1, false, s, dateFilter, sortOrder); }}
                  style={{padding:"5px 14px", background: activeSubcat===s?BLUE:"white", border:`1px solid ${activeSubcat===s?BLUE:"#e0e0e0"}`, fontSize:11, color: activeSubcat===s?"white":"#666", fontWeight: activeSubcat===s?600:400}}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Filtres */}
          <div style={{display:"flex", gap:6}}>
            {["ALL","ACTUALITÉS"].map(f => (
              <button key={f} onClick={() => handleFilterChange(f)}
                style={{padding:"6px 16px", background: filter===f?BLUE:"white", border:`1px solid ${filter===f?BLUE:"#e0e0e0"}`, fontSize:11, letterSpacing:"1px", color: filter===f?"white":"#666", textTransform:"uppercase", fontWeight: filter===f?600:400}}>
                {f === "ALL" ? "Feed" : "Actualités"}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div style={{flex:1, overflowY:"auto", padding:"20px 24px"}}>
          {(loading || (filter === "ACTUALITÉS" && newsLoading)) ? (
            <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"50%", gap:16}}>
              <div style={{width:36, height:36, border:`3px solid ${BLUE_MID}`, borderTop:`3px solid ${BLUE}`, borderRadius:"50%", animation:"spin .8s linear infinite"}}/>
              <div style={{fontSize:13, color:"#aaa"}}>Chargement...</div>
            </div>
          ) : (
            <>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
                {displayFeed.map((item, i) => (
                  <div key={item.id||i} className="card-hover"
                    style={{background:"white", border:"1px solid #e8e8e8", overflow:"hidden", animation:"fadeIn .4s ease", animationDelay:`${i*0.04}s`, animationFillMode:"both"}}>

                    {item.type === "VIDEO" && item.videoId && (
                      playingVideo === item.id ? (
                        <iframe src={`https://www.youtube.com/embed/${item.videoId}?autoplay=1&controls=1&rel=0`} style={{width:"100%", height:200}} allow="autoplay; fullscreen" allowFullScreen/>
                      ) : (
                        <div style={{position:"relative", height:180, cursor:"pointer", overflow:"hidden", background:"#000"}}
                          onClick={() => { setPlayingVideo(item.id); consumeResource(item.id, item.xp||15); }}>
                          {item.thumbnail && <img src={item.thumbnail} alt="" style={{width:"100%", height:"100%", objectFit:"cover", opacity:0.9}}/>}
                          <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.2)"}}>
                            <div style={{width:48, height:48, borderRadius:"50%", background:"rgba(0,85,255,0.9)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:"white"}}>▶</div>
                          </div>
                        </div>
                      )
                    )}

                    {item.type !== "VIDEO" && item.thumbnail && (
                      <img src={item.thumbnail} alt="" style={{width:"100%", height:140, objectFit:"cover"}}/>
                    )}
                    {item.type !== "VIDEO" && !item.thumbnail && (
                      <div style={{height:80, background:BLUE_PALE, display:"flex", alignItems:"center", justifyContent:"center"}}>
                        <div style={{fontSize:28, opacity:0.3}}>📄</div>
                      </div>
                    )}

                    <div style={{padding:"14px"}}>
                      <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:8}}>
                        <span style={{fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase" as const, padding:"3px 8px", fontWeight:600, color:BLUE, background:BLUE_PALE}}>
                          {item.type}
                        </span>
                        <span style={{fontSize:11, color:"#aaa", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const}}>{item.source}</span>
                        {consumed.has(item.id) && <span style={{fontSize:10, color:BLUE, fontWeight:600}}>✓ {item.xp} XP</span>}
                      </div>

                      <div style={{fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"#111", lineHeight:1.3, marginBottom:8}}>
                        {item.title}
                      </div>

                      {item.excerpt && (
                        <div style={{fontSize:12, color:"#888", lineHeight:1.6, marginBottom:12}}>
                          {item.excerpt.slice(0,120)}{item.excerpt.length>120?"...":""}
                        </div>
                      )}

                      <div style={{display:"flex", gap:6}}>
                        {item.type === "VIDEO" ? (
                          <button onClick={() => { setPlayingVideo(item.id); consumeResource(item.id, item.xp||15); }}
                            style={{flex:1, padding:"8px", background:BLUE, border:"none", fontSize:11, fontWeight:600, letterSpacing:"1px", textTransform:"uppercase" as const, color:"white"}}>
                            Regarder
                          </button>
                        ) : item.url && item.url !== "#" ? (
                          <button onClick={() => { window.open(item.url, "_blank"); consumeResource(item.id, item.xp||10); }}
                            style={{flex:1, padding:"8px", background:BLUE, border:"none", fontSize:11, fontWeight:600, letterSpacing:"1px", textTransform:"uppercase" as const, color:"white"}}>
                            Lire
                          </button>
                        ) : null}
                        <button onClick={() => toggleSave(item)}
                          style={{padding:"8px 12px", background: isSaved(item)?BLUE_PALE:"#f5f5f5", border:`1px solid ${isSaved(item)?BLUE+"33":"#e8e8e8"}`, fontSize:11, color: isSaved(item)?BLUE:"#888", fontWeight: isSaved(item)?600:400}}>
                          {isSaved(item) ? "✓" : "Sauvegarder"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filter !== "ACTUALITÉS" && displayFeed.length > 0 && (
                <div style={{textAlign:"center", padding:"24px 0"}}>
                  <button onClick={() => { const next = page+1; setPage(next); loadFeed(activePassion, next, true, activeSubcat, dateFilter, sortOrder); }}
                    disabled={loadingMore}
                    style={{padding:"12px 36px", background:"white", border:`1px solid ${BLUE}`, fontSize:12, letterSpacing:"1.5px", textTransform:"uppercase", color:BLUE, fontWeight:600}}>
                    {loadingMore ? "Chargement..." : "Charger plus"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* RIGHT PANEL */}
      <aside style={{background:"white", borderLeft:"1px solid #e8e8e8", display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden"}}>
        <div style={{padding:"18px 18px 14px", borderBottom:"1px solid #f0f0f0"}}>
          <div style={{fontSize:13, fontWeight:700, color:"#111", marginBottom:2}}>Assistant AkoLab</div>
          <div style={{fontSize:11, color:"#aaa"}}>Bonjour {profile.name} · {activePassion}</div>
        </div>

        <div style={{display:"flex", borderBottom:"1px solid #f0f0f0"}}>
          {["chat","saved"].map(t => (
            <button key={t} onClick={() => setRpTab(t)}
              style={{flex:1, padding:"10px 0", fontSize:11, letterSpacing:"1px", textTransform:"uppercase" as const, color: rpTab===t?BLUE:"#aaa", borderBottom: rpTab===t?`2px solid ${BLUE}`:"2px solid transparent", background:"none", border:"none", borderBottomWidth:"2px", borderBottomStyle:"solid" as const, borderBottomColor: rpTab===t?BLUE:"transparent", fontWeight: rpTab===t?600:400}}>
              {t === "saved" ? `Sauvegardés (${saved.length})` : "Chat"}
            </button>
          ))}
        </div>

        <div style={{flex:1, overflowY:"auto", padding:"12px"}}>
          {rpTab === "chat" && (
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              {chatMsgs.map((m,i) => (
                <div key={i} style={{display:"flex", gap:8, flexDirection: m.role==="user"?"row-reverse":"row"}}>
                  <div style={{width:24, height:24, borderRadius:"50%", background: m.role==="ai"?BLUE:"#f0f0f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color: m.role==="ai"?"white":"#666", flexShrink:0, fontWeight:700}}>
                    {m.role==="ai"?"AK":profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{padding:"10px 12px", fontSize:13, lineHeight:1.65, maxWidth:"82%", fontWeight:300, background: m.role==="ai"?"#f8f8f8":BLUE_PALE, color:"#333", borderLeft: m.role==="ai"?`3px solid ${BLUE}`:"none", whiteSpace:"pre-wrap" as const}}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoad && (
                <div style={{display:"flex", gap:8}}>
                  <div style={{width:24, height:24, borderRadius:"50%", background:BLUE, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"white", fontWeight:700}}>AK</div>
                  <div style={{padding:"10px 12px", background:"#f8f8f8", borderLeft:`3px solid ${BLUE}`, display:"flex", gap:4, alignItems:"center"}}>
                    {[0,1,2].map(i => <div key={i} style={{width:5, height:5, borderRadius:"50%", background:BLUE, opacity:0.4, animation:`bounce 1.1s ease infinite ${i*0.18}s`}}/>)}
                  </div>
                </div>
              )}
              <div ref={chatEnd}/>
            </div>
          )}

          {rpTab === "saved" && (
            saved.length === 0 ? (
              <div style={{textAlign:"center", padding:"48px 16px", color:"#bbb", fontSize:13}}>Rien de sauvegardé encore.</div>
            ) : saved.map((item, i) => (
              <div key={i} style={{padding:"10px", background:"#f8f8f8", border:"1px solid #e8e8e8", marginBottom:6, cursor:"pointer", display:"flex", gap:8}}
                onClick={() => item.url && item.url !== "#" && window.open(item.url, "_blank")}>
                {item.thumbnail && <img src={item.thumbnail} alt="" style={{width:52, height:36, objectFit:"cover", flexShrink:0}}/>}
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase" as const, color:"#bbb", marginBottom:3}}>{item.type}</div>
                  <div style={{fontSize:12, fontWeight:500, color:"#111", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const}}>{item.title}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); toggleSave(item); }} style={{background:"none", border:"none", color:"#ccc", fontSize:16}}>×</button>
              </div>
            ))
          )}
        </div>

        {rpTab === "chat" && (
          <div style={{padding:"12px", borderTop:"1px solid #f0f0f0"}}>
            <div style={{display:"flex", gap:8}}>
              <input value={chatIn} onChange={e => setChatIn(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") sendChat(); }}
                placeholder={`Demander sur ${activePassion}...`}
                style={{flex:1, border:"1px solid #e0e0e0", padding:"9px 12px", fontSize:12, color:"#111", caretColor:BLUE}}/>
              <button onClick={() => sendChat()} disabled={chatLoad || !chatIn.trim()}
                style={{width:36, height:36, background:BLUE, border:"none", color:"white", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center"}}>→</button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
