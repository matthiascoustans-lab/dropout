"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const PASSIONS = ["Porsche 911", "Running", "Cinema", "Histoire", "Cuisine"];

const BADGES = [
  { id:"explorer", label:"Explorer", desc:"10 ressources consommées", xp:0, icon:"◈" },
  { id:"curious", label:"Curious Mind", desc:"50 ressources", xp:100, icon:"◉" },
  { id:"deep", label:"Deep Diver", desc:"3 passions explorées", xp:200, icon:"◇" },
  { id:"master", label:"Master", desc:"500 XP", xp:500, icon:"◆" },
];

export default function Home() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [current, setCurrent] = useState(0);
  const [saved, setSaved] = useState<any[]>([]);
  const [rpTab, setRpTab] = useState("feed");
  const [activePassion, setActivePassion] = useState("Porsche 911");
  const [isAnim, setIsAnim] = useState(false);
  const [prevIdx, setPrevIdx] = useState(-1);
  const [chatMsgs, setChatMsgs] = useState([{role:"ai", content:"Bienvenue sur AkoLab. Dis-moi ce que tu viens de découvrir — je t'ouvre un univers sans limites."}]);
  const [chatIn, setChatIn] = useState("");
  const [chatLoad, setChatLoad] = useState(false);
  const [page, setPage] = useState(1);
  const [xp, setXp] = useState(0);
  const [consumed, setConsumed] = useState<Set<number>>(new Set());
  const [typePrefs, setTypePrefs] = useState<Record<string,number>>({VIDEO:1, ARTICLE:1, PODCAST:1, FORUM:1});
  const [showXpPop, setShowXpPop] = useState<string|null>(null);
  const [activeView, setActiveView] = useState("feed");
  const [videoFeed, setVideoFeed] = useState<any[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const touchStart = useRef(0);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { loadFeed("Porsche 911", 1); }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:"smooth"}); }, [chatMsgs]);

  const loadFeed = async (passion: string, p: number) => {
    if (p === 1) { setLoading(true); setCurrent(0); setFeed([]); }
    else setLoadingMore(true);
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({passion, type:"feed", page: p})
      });
      const data = await res.json();
      if (data.resources?.length) {
        if (p === 1) setFeed(data.resources);
        else setFeed(prev => [...prev, ...data.resources]);
      }
    } catch(e) { console.error(e); }
    if (p === 1) setLoading(false); else setLoadingMore(false);
  };

  const loadVideos = async (passion: string) => {
    setVideoLoading(true);
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({passion, type:"videos"})
      });
      const data = await res.json();
      if (data.resources?.length) setVideoFeed(data.resources);
    } catch(e) { console.error(e); }
    setVideoLoading(false);
  };

  const goTo = useCallback((idx: number) => {
    if (isAnim || idx === current || idx < 0) return;
    if (idx >= feed.length - 2 && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFeed(activePassion, nextPage);
    }
    if (idx >= feed.length) return;
    setIsAnim(true);
    setPrevIdx(current);
    setCurrent(idx);
    const card = feed[idx];
    if (card && !consumed.has(idx)) {
      const earnedXp = card.xp || 10;
      setXp(prev => prev + earnedXp);
      setConsumed(prev => new Set([...prev, idx]));
      setTypePrefs(prev => ({...prev, [card.type]: (prev[card.type] || 1) + 1}));
      setShowXpPop(`+${earnedXp} XP`);
      setTimeout(() => setShowXpPop(null), 1500);
    }
    setTimeout(() => { setPrevIdx(-1); setIsAnim(false); }, 520);
  }, [isAnim, current, feed, page, loadingMore, activePassion, consumed]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") goTo(current+1);
      if (e.key === "ArrowUp") goTo(current-1);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [current, goTo]);

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 30) return;
    if (e.deltaY > 0) goTo(current+1); else goTo(current-1);
  };

  const toggleSave = (card: any) => {
    setSaved(prev => prev.find(s => s.url === card.url) ? prev.filter(s => s.url !== card.url) : [...prev, card]);
  };

  const isSaved = (card: any) => saved.some(s => s.url === card.url);

  const switchPassion = (p: string) => {
    setActivePassion(p);
    setPage(1);
    loadFeed(p, 1);
    if (activeView === "videos") loadVideos(p);
  };

  const switchView = (v: string) => {
    setActiveView(v);
    if (v === "videos" && videoFeed.length === 0) loadVideos(activePassion);
  };

  const sendChat = async (text?: string) => {
    const q = text || chatIn.trim();
    if (!q) return;
    setChatMsgs(p => [...p, {role:"user", content:q}]);
    setChatIn(""); setChatLoad(true);
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({passion:q, type:"chat"})
      });
      const data = await res.json();
      setChatMsgs(p => [...p, {role:"ai", content:data.response}]);
    } catch { setChatMsgs(p => [...p, {role:"ai", content:"Erreur."}]); }
    setChatLoad(false);
  };

  const getState = (idx: number) => {
    if (idx === current) return "current";
    if (idx === prevIdx) return "prev";
    if (idx === current+1) return "next";
    return "hidden";
  };

  const level = Math.floor(xp / 100) + 1;
  const xpToNext = 100 - (xp % 100);
  const earnedBadges = BADGES.filter(b => xp >= b.xp);
  const topType = Object.entries(typePrefs).sort((a,b) => b[1]-a[1])[0]?.[0];

  const blue = "#0066ff";
  const bluePale = "rgba(0,102,255,0.1)";
  const blueBorder = "rgba(0,102,255,0.3)";

  return (
    <div style={{display:"grid", gridTemplateColumns:"56px 1fr 300px", height:"100vh", overflow:"hidden", background:"#080808", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@1,400;0,700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow:hidden;-webkit-font-smoothing:antialiased}
        button{cursor:pointer}
        ::-webkit-scrollbar{width:2px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1)}
        @keyframes bounce{0%,100%{transform:translateY(0);opacity:0.3}50%{transform:translateY(-5px);opacity:1}}
        @keyframes xpPop{0%{opacity:0;transform:translateY(0)}20%{opacity:1}80%{opacity:1}100%{opacity:0;transform:translateY(-40px)}}
        @keyframes pulse{0%,100%{opacity:0.3;transform:scaleX(0.5)}50%{opacity:1;transform:scaleX(1)}}
      `}</style>

      {/* XP POPUP */}
      {showXpPop && (
        <div style={{position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:1000, fontFamily:"'Bebas Neue',cursive", fontSize:32, color:blue, letterSpacing:3, animation:"xpPop 1.5s ease forwards", pointerEvents:"none"}}>
          {showXpPop}
        </div>
      )}

      {/* LEFT NAV */}
      <nav style={{background:"#080808", borderRight:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 0", gap:"4px"}}>
        <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:"16px", color:blue, letterSpacing:"2px", writingMode:"vertical-rl", transform:"rotate(180deg)", marginBottom:"28px"}}>AK</div>
        {[["FEED","feed"],["VIDEO","videos"],["SAVED","saved"]].map(([label, view]) => (
          <div key={view} onClick={() => switchView(view)} style={{width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, letterSpacing:"1.5px", color: activeView===view ? blue : "#444", writingMode:"vertical-rl" as const, transform:"rotate(180deg)", fontWeight:600, background: activeView===view ? bluePale : "transparent", border: activeView===view ? `1px solid ${blueBorder}` : "1px solid transparent", cursor:"pointer"}}>{label}</div>
        ))}
        <div style={{marginTop:"auto", display:"flex", flexDirection:"column", alignItems:"center", gap:6}}>
          <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:14, color:"#f0ede8", writingMode:"vertical-rl" as const, transform:"rotate(180deg)"}}><span style={{color:blue}}>{xp}</span> XP</div>
          <div style={{fontSize:8, color:"#444", letterSpacing:"2px", writingMode:"vertical-rl" as const, transform:"rotate(180deg)"}}>LVL {level}</div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{position:"relative", height:"100vh", overflow:"hidden"}}>

        {/* Top bar */}
        <div style={{position:"absolute", top:0, left:0, right:0, height:52, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", background:"linear-gradient(to bottom,#080808,transparent)", zIndex:20}}>
          <div style={{fontSize:10, letterSpacing:"3px", textTransform:"uppercase", color:"#b8b4ae", display:"flex", alignItems:"center", gap:10}}>
            <span style={{width:20, height:1, background:blue, display:"inline-block"}}/>
            {activePassion}
          </div>
          <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:18, letterSpacing:2, color:"#f0ede8"}}>
            AKO<span style={{color:blue}}>LAB</span>
          </div>
          <div style={{fontSize:10, color:"#444"}}>
            {activeView==="feed" ? (loading ? "Loading..." : `${current+1} / ${feed.length}${loadingMore ? "+" : ""}`) : `${videoFeed.length} videos`}
          </div>
        </div>

        {/* FEED VIEW */}
        {activeView === "feed" && (
          <div style={{height:"100%"}} onWheel={onWheel}
            onTouchStart={e => { touchStart.current = e.touches[0].clientY; }}
            onTouchEnd={e => { const d = touchStart.current - e.changedTouches[0].clientY; if(Math.abs(d)>50){if(d>0)goTo(current+1);else goTo(current-1);} }}
          >
            {loading ? (
              <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16}}>
                <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:48, color:blue, letterSpacing:4}}>AKOLAB</div>
                <div style={{fontSize:11, letterSpacing:"3px", textTransform:"uppercase", color:"#444"}}>Centralisation en cours...</div>
                <div style={{width:40, height:1, background:blue, animation:"pulse 1s ease-in-out infinite"}}/>
              </div>
            ) : (
              <div style={{position:"relative", height:"100%"}}>
                {feed.map((card:any, idx:number) => {
                  const state = getState(idx);
                  return (
                    <div key={card.id || idx} style={{position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:"flex-end", transition:"transform .5s cubic-bezier(.4,0,.2,1), opacity .5s", transform: state==="current"?"translateY(0)":state==="prev"?"translateY(-100%)":"translateY(100%)", opacity:state==="current"?1:0, zIndex:state==="current"?5:1, pointerEvents:state==="current"?"auto":"none"}}>
                      {card.thumbnail ? (
                        <>
                          <img src={card.thumbnail} alt="" style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", zIndex:0}}/>
                          <div style={{position:"absolute", inset:0, background:"linear-gradient(to top,rgba(8,8,8,0.98) 0%,rgba(8,8,8,0.75) 40%,rgba(8,8,8,0.2) 100%)", zIndex:1}}/>
                        </>
                      ) : (
                        <div style={{position:"absolute", inset:0, background:card.bg||"linear-gradient(135deg,#000510,#001030,#080808)", zIndex:0}}>
                          <div style={{position:"absolute", inset:0, background:"linear-gradient(to top,rgba(8,8,8,0.97) 0%,rgba(8,8,8,0.5) 50%,rgba(8,8,8,0.1) 100%)"}}/>
                        </div>
                      )}
                      <div style={{position:"absolute", top:64, left:28, zIndex:10, display:"flex", alignItems:"center", gap:10}}>
                        <span style={{fontSize:9, letterSpacing:"2.5px", textTransform:"uppercase" as const, fontWeight:600, padding:"4px 10px", border:"1px solid", color: card.type==="VIDEO"?"#4da6ff":card.type==="ARTICLE"?"#4aab87":card.type==="PODCAST"?"#c9a84c":"#888", borderColor: card.type==="VIDEO"?"rgba(77,166,255,0.3)":card.type==="ARTICLE"?"rgba(74,171,135,0.3)":card.type==="PODCAST"?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.1)", background: card.type==="VIDEO"?"rgba(77,166,255,0.07)":card.type==="ARTICLE"?"rgba(74,171,135,0.07)":card.type==="PODCAST"?"rgba(201,168,76,0.07)":"rgba(255,255,255,0.03)"}}>{card.type}</span>
                        <span style={{fontSize:10, color:"#888"}}>{card.source}</span>
                        {consumed.has(idx) && <span style={{fontSize:9, color:blue, letterSpacing:"1px"}}>+{card.xp||10} XP</span>}
                      </div>
                      <div style={{position:"relative", zIndex:10, padding:"0 32px 32px"}}>
                        <div style={{fontSize:10, letterSpacing:"3px", color:"#444", marginBottom:12}}>{String(idx+1).padStart(2,"0")} — {feed.length}</div>
                        <div style={{fontFamily:"'Playfair Display',serif", fontSize:34, fontWeight:700, lineHeight:1.1, marginBottom:12, maxWidth:520}}>
                          {card.title} <em style={{fontStyle:"italic", color:blue}}>{card.italic}</em>
                        </div>
                        <div style={{fontSize:14, color:"#b8b4ae", lineHeight:1.75, maxWidth:480, marginBottom:20, fontWeight:300}}>{card.excerpt}</div>
                        <div style={{display:"flex", gap:20, marginBottom:20}}>
                          {[["Duration",card.duration],["Source",card.source]].map(([l,v]) => (
                            <div key={l} style={{fontSize:10, letterSpacing:"2px", textTransform:"uppercase" as const, color:"#555"}}>{l} <span style={{color:"#b8b4ae"}}>{v}</span></div>
                          ))}
                        </div>
                        <div style={{display:"flex", gap:10}}>
                          <button onClick={() => card.url && card.url !== "#" && window.open(card.url, "_blank")} style={{padding:"11px 28px", background: card.url && card.url !== "#" ? blue : "#222", border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:600, letterSpacing:"2px", textTransform:"uppercase" as const, color:"white", opacity: card.url && card.url !== "#" ? 1 : 0.5}}>
                            {card.url && card.url !== "#" ? "Open" : "Soon"}
                          </button>
                          <button onClick={e => { e.stopPropagation(); toggleSave(card); }} style={{padding:"11px 20px", background: isSaved(card) ? bluePale : "transparent", border: isSaved(card) ? `1px solid ${blueBorder}` : "1px solid rgba(255,255,255,0.09)", fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase" as const, color: isSaved(card) ? blue : "#b8b4ae"}}>
                            {isSaved(card) ? "Saved" : "Save"}
                          </button>
                          <button onClick={() => goTo(current+1)} style={{padding:"11px 20px", background:"transparent", border:"1px solid rgba(255,255,255,0.09)", fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase" as const, color:"#b8b4ae"}}>Next</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {loadingMore && (
                  <div style={{position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)", zIndex:20, fontSize:10, letterSpacing:"2px", color:"#444", textTransform:"uppercase"}}>
                    Chargement...
                  </div>
                )}
              </div>
            )}
            <div style={{position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", display:"flex", flexDirection:"column", gap:6, zIndex:20}}>
              {feed.map((_:any, idx:number) => (
                <div key={idx} onClick={() => goTo(idx)} style={{width:2, height:idx===current?32:18, background:idx===current?blue:idx<current?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.12)", cursor:"pointer", transition:"all .3s"}}/>
              ))}
            </div>
          </div>
        )}

        {/* VIDEO VIEW */}
        {activeView === "videos" && (
          <div style={{height:"100%", overflowY:"auto", paddingTop:60}}>
            {videoLoading ? (
              <div style={{display:"flex", alignItems:"center", justifyContent:"center", height:"60%", flexDirection:"column", gap:12}}>
                <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:32, color:blue, letterSpacing:3}}>AKOLAB</div>
                <div style={{fontSize:10, letterSpacing:"2px", color:"#444", textTransform:"uppercase"}}>Recherche des vidéos...</div>
              </div>
            ) : (
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:2, padding:"8px"}}>
                {videoFeed.map((v:any, i:number) => (
                  <div key={i} onClick={() => v.url && window.open(v.url, "_blank")} style={{position:"relative", aspectRatio:"16/9", overflow:"hidden", cursor:"pointer", background:"#111"}}>
                    {v.thumbnail && <img src={v.thumbnail} alt="" style={{width:"100%", height:"100%", objectFit:"cover", transition:"transform .3s"}}/>}
                    <div style={{position:"absolute", inset:0, background:"linear-gradient(to top,rgba(8,8,8,0.9) 0%,transparent 50%)"}}/>
                    <div style={{position:"absolute", bottom:0, left:0, right:0, padding:"8px 10px"}}>
                      <div style={{fontSize:10, fontWeight:500, color:"#f0ede8", lineHeight:1.3, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as const}}>{v.title}</div>
                      <div style={{fontSize:9, color:"#666", marginTop:3, letterSpacing:"0.5px"}}>{v.source}</div>
                    </div>
                    <div style={{position:"absolute", top:8, right:8, width:24, height:24, background:"rgba(0,102,255,0.8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"white"}}>▶</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SAVED VIEW */}
        {activeView === "saved" && (
          <div style={{height:"100%", overflowY:"auto", paddingTop:60, padding:"60px 24px 24px"}}>
            <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:28, letterSpacing:2, marginBottom:20}}>SAVED <span style={{color:blue}}>({saved.length})</span></div>
            {saved.length === 0 ? (
              <div style={{textAlign:"center", color:"#444", fontSize:13, marginTop:80}}>
                Aucune ressource sauvegardée.<br/>Appuie sur Save dans le feed.
              </div>
            ) : saved.map((card:any, i:number) => (
              <div key={i} style={{display:"flex", gap:12, padding:"14px", background:"#111", border:"1px solid rgba(255,255,255,0.05)", marginBottom:8, cursor:"pointer"}} onClick={() => card.url && card.url !== "#" && window.open(card.url, "_blank")}>
                {card.thumbnail && <img src={card.thumbnail} alt="" style={{width:72, height:48, objectFit:"cover", flexShrink:0}}/>}
                <div style={{flex:1}}>
                  <div style={{fontSize:9, letterSpacing:"2px", textTransform:"uppercase" as const, color:"#444", marginBottom:4}}>{card.type} — {card.source}</div>
                  <div style={{fontSize:13, fontWeight:500, color:"#f0ede8", lineHeight:1.4}}>{card.title}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); toggleSave(card); }} style={{background:"none", border:"none", color:"#444", fontSize:16, padding:"0 4px"}}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div style={{background:"#0a0a0a", borderLeft:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden"}}>
        
        {/* XP Bar */}
        <div style={{padding:"16px 18px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:18, letterSpacing:2}}>AKO<span style={{color:blue}}>LAB</span></div>
            <div style={{fontSize:10, color:blue, letterSpacing:"1px", fontWeight:600}}>LVL {level} · {xp} XP</div>
          </div>
          <div style={{height:3, background:"rgba(255,255,255,0.06)", overflow:"hidden"}}>
            <div style={{height:"100%", background:`linear-gradient(90deg,${blue},#66aaff)`, width:`${(xp%100)}%`, transition:"width .5s"}}/>
          </div>
          <div style={{fontSize:9, color:"#444", marginTop:4, letterSpacing:"0.5px"}}>{xpToNext} XP jusqu'au niveau {level+1}</div>
        </div>

        <div style={{display:"flex", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"0 18px"}}>
          {["feed","chat","badges"].map(t => (
            <button key={t} onClick={() => setRpTab(t)} style={{padding:"9px 12px 7px", fontSize:9, letterSpacing:"2px", textTransform:"uppercase" as const, color: rpTab===t ? "#f0ede8" : "#444", borderBottom: rpTab===t ? `1px solid ${blue}` : "1px solid transparent", background:"none", border:"none", borderBottomWidth:"1px", borderBottomStyle:"solid" as const, borderBottomColor: rpTab===t ? blue : "transparent", fontFamily:"'DM Sans',sans-serif"}}>{t}</button>
          ))}
        </div>

        <div style={{flex:1, overflowY:"auto", padding:"10px"}}>

          {rpTab === "feed" && feed.map((card:any, idx:number) => (
            <div key={idx} onClick={() => goTo(idx)} style={{padding:"10px", background: idx===current ? bluePale : "#111", border:`1px solid ${idx===current ? blueBorder : "rgba(255,255,255,0.05)"}`, marginBottom:"4px", cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start"}}>
              {card.thumbnail && <img src={card.thumbnail} alt="" style={{width:52, height:36, objectFit:"cover", flexShrink:0}}/>}
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase" as const, color:"#444", marginBottom:3}}>{card.type}</div>
                <div style={{fontSize:11, fontWeight:500, color:"#f0ede8", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const}}>{card.title}</div>
                <div style={{fontSize:9, color: consumed.has(idx) ? blue : "#333", marginTop:2}}>{consumed.has(idx) ? `+${card.xp||10} XP` : card.duration}</div>
              </div>
            </div>
          ))}

          {rpTab === "chat" && (
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              {chatMsgs.map((m,i) => (
                <div key={i} style={{display:"flex", gap:8, flexDirection: m.role==="user" ? "row-reverse" : "row"}}>
                  <div style={{width:20, height:20, background: m.role==="ai" ? blue : "#1e1e1e", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700, color:"white", flexShrink:0, fontFamily:"'Bebas Neue',cursive"}}>
                    {m.role==="ai" ? "AK" : "M"}
                  </div>
                  <div style={{padding:"8px 11px", fontSize:12, lineHeight:1.65, maxWidth:"80%", fontWeight:300, background: m.role==="ai" ? "#161616" : bluePale, color: m.role==="ai" ? "#b8b4ae" : "#f0ede8", borderLeft: m.role==="ai" ? `2px solid ${blue}` : "none", whiteSpace:"pre-wrap" as const}}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoad && (
                <div style={{display:"flex", gap:8}}>
                  <div style={{width:20, height:20, background:blue, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"white", fontFamily:"'Bebas Neue',cursive"}}>AK</div>
                  <div style={{padding:"8px 11px", background:"#161616", borderLeft:`2px solid ${blue}`, display:"flex", gap:4}}>
                    {[0,1,2].map(i => <div key={i} style={{width:4, height:4, borderRadius:"50%", background:blue, opacity:0.5, animation:`bounce 1.1s ease infinite ${i*0.18}s`}}/>)}
                  </div>
                </div>
              )}
              <div ref={chatEnd}/>
            </div>
          )}

          {rpTab === "badges" && (
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              <div style={{fontSize:9, letterSpacing:"2px", textTransform:"uppercase" as const, color:"#444", marginBottom:4}}>
                {consumed.size} ressources · {topType} favori
              </div>
              {BADGES.map(b => {
                const earned = xp >= b.xp;
                return (
                  <div key={b.id} style={{padding:"14px", background: earned ? bluePale : "#111", border:`1px solid ${earned ? blueBorder : "rgba(255,255,255,0.05)"}`, display:"flex", gap:12, alignItems:"center"}}>
                    <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:24, color: earned ? blue : "#333", width:32, textAlign:"center"}}>{b.icon}</div>
                    <div>
                      <div style={{fontSize:12, fontWeight:600, color: earned ? "#f0ede8" : "#444"}}>{b.label}</div>
                      <div style={{fontSize:10, color:"#444", marginTop:2}}>{b.desc}</div>
                    </div>
                    {earned && <div style={{marginLeft:"auto", fontSize:9, color:blue, letterSpacing:"1px"}}>EARNED</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {rpTab === "chat" && (
          <div style={{padding:"10px", borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{display:"flex", gap:8}}>
              <input value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => { if(e.key==="Enter") sendChat(); }} placeholder="J'ai vu Le Mans 66..." style={{flex:1, background:"#161616", border:"1px solid rgba(255,255,255,0.09)", padding:"8px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", color:"#f0ede8", outline:"none"}}/>
              <button onClick={() => sendChat()} disabled={chatLoad || !chatIn.trim()} style={{width:32, height:32, background:blue, border:"none", color:"white", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center"}}>→</button>
            </div>
          </div>
        )}

        <div style={{padding:"10px", borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{fontSize:9, letterSpacing:"2px", textTransform:"uppercase" as const, color:"#444", marginBottom:7}}>Passions</div>
          <div style={{display:"flex", gap:4, flexWrap:"wrap" as const}}>
            {PASSIONS.map(p => (
              <button key={p} onClick={() => switchPassion(p)} style={{padding:"4px 9px", background: activePassion===p ? bluePale : "#161616", border: activePassion===p ? `1px solid ${blueBorder}` : "1px solid rgba(255,255,255,0.06)", fontSize:9, color: activePassion===p ? blue : "#555", fontFamily:"'DM Sans',sans-serif"}}>{p}</button>
            ))}
            <button style={{padding:"4px 9px", background:"transparent", border:"1px dashed rgba(255,255,255,0.09)", fontSize:9, color:"#444", fontFamily:"'DM Sans',sans-serif"}}>+ Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
