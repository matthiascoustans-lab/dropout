"use client";
import { useState, useRef, useEffect } from "react";

const DEFAULT_FEED = [
  { id:1, type:"VIDEO", source:"Chargement...", title:"DropOut", italic:"charge vos ressources", excerpt:"Claude analyse votre passion et centralise les meilleures ressources en temps réel.", duration:"...", url:"#", thumbnail:null, bg:"linear-gradient(135deg,#0a0005,#1a0008,#080808)" },
];

const UNIVERS = [
  { title:"Motorsport", sub:"Le Mans, WRC, 911 RSR" },
  { title:"Mechanics", sub:"Flat-six, PDK explained" },
  { title:"Cinema", sub:"Le Mans 66, Rush, Senna" },
  { title:"Design", sub:"Butzi, the 911 lineage" },
  { title:"Routes", sub:"Stelvio, Transfagarasan" },
  { title:"Buying", sub:"Which 911 to buy in 2024" },
];

const PASSIONS = ["Porsche 911","Running","Cinema","History"];

export default function Home() {
  const [feed, setFeed] = useState<any[]>(DEFAULT_FEED);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [saved, setSaved] = useState<number[]>([]);
  const [rpTab, setRpTab] = useState("feed");
  const [feedTab, setFeedTab] = useState("ALL");
  const [activePassion, setActivePassion] = useState("Porsche 911");
  const [isAnim, setIsAnim] = useState(false);
  const [prevIdx, setPrevIdx] = useState(-1);
  const [chatMsgs, setChatMsgs] = useState([{role:"ai", content:"Bienvenue. Dis-moi ce que tu viens de voir ou découvrir — je t'ouvre un univers."}]);
  const [chatIn, setChatIn] = useState("");
  const [chatLoad, setChatLoad] = useState(false);
  const touchStart = useRef(0);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { loadFeed("Porsche 911"); }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:"smooth"}); }, [chatMsgs]);

  const loadFeed = async (passion: string) => {
    setLoading(true);
    setCurrent(0);
    try {
      const res = await fetch("/api/claude", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({passion, type:"feed"})
      });
      const data = await res.json();
      if (data.resources) setFeed(data.resources.map((r:any,i:number) => ({...r, id:i+1})));
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const sendChat = async (text?: string) => {
    const q = text || chatIn.trim();
    if (!q) return;
    setChatMsgs(p => [...p, {role:"user", content:q}]);
    setChatIn("");
    setChatLoad(true);
    try {
      const res = await fetch("/api/claude", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({passion:q, type:"chat"})
      });
      const data = await res.json();
      setChatMsgs(p => [...p, {role:"ai", content:data.response}]);
    } catch { setChatMsgs(p => [...p, {role:"ai", content:"Erreur."}]); }
    setChatLoad(false);
  };

  const goTo = (idx: number) => {
    if (isAnim || idx === current || idx < 0 || idx >= feed.length) return;
    setIsAnim(true);
    setPrevIdx(current);
    setCurrent(idx);
    setTimeout(() => { setPrevIdx(-1); setIsAnim(false); }, 520);
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") goTo(current+1);
      if (e.key === "ArrowUp") goTo(current-1);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [current, isAnim, feed]);

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 30) return;
    if (e.deltaY > 0) goTo(current+1); else goTo(current-1);
  };

  const toggleSave = (idx: number) => {
    setSaved(p => p.includes(idx) ? p.filter(i => i !== idx) : [...p, idx]);
  };

  const switchPassion = (p: string) => {
    setActivePassion(p);
    setRpTab("feed");
    loadFeed(p);
  };

  const getState = (idx: number) => {
    if (idx === current) return "current";
    if (idx === prevIdx) return "prev";
    if (idx === current+1) return "next";
    return "hidden";
  };

  const cardStyle = (state: string, bg: string, thumbnail: string|null): React.CSSProperties => ({
    position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:"flex-end",
    transition:"transform .5s cubic-bezier(.4,0,.2,1), opacity .5s",
    transform: state==="current" ? "translateY(0)" : state==="prev" ? "translateY(-100%)" : "translateY(100%)",
    opacity: state==="current" ? 1 : 0,
    zIndex: state==="current" ? 5 : 1,
    pointerEvents: state==="current" ? "auto" : "none",
    background: thumbnail ? "transparent" : bg,
  });

  return (
    <div style={{display:"grid", gridTemplateColumns:"56px 1fr 300px", height:"100vh", overflow:"hidden", background:"#080808", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@1,400;0,700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow:hidden;-webkit-font-smoothing:antialiased}
        button{cursor:pointer}
        ::-webkit-scrollbar{width:2px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1)}
      `}</style>

      {/* LEFT NAV */}
      <nav style={{background:"#080808", borderRight:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 0", gap:"4px"}}>
        <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:"18px", color:"#c0001a", letterSpacing:"2px", writingMode:"vertical-rl", transform:"rotate(180deg)", marginBottom:"28px"}}>DO</div>
        {["FEED","SAVED","PATH"].map(item => (
          <div key={item} style={{width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, letterSpacing:"1.5px", color: item==="FEED" ? "#c0001a" : "#444", writingMode:"vertical-rl" as const, transform:"rotate(180deg)", fontWeight:600, background: item==="FEED" ? "rgba(192,0,26,0.06)" : "transparent", border: item==="FEED" ? "1px solid rgba(192,0,26,0.2)" : "1px solid transparent"}}>{item}</div>
        ))}
        <div style={{marginTop:"auto", display:"flex", flexDirection:"column", alignItems:"center", gap:8}}>
          <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:16, color:"#f0ede8", writingMode:"vertical-rl" as const, transform:"rotate(180deg)"}}><span style={{color:"#c0001a"}}>23</span> DAYS</div>
          <div style={{fontSize:9, color:"#444", letterSpacing:"2px", writingMode:"vertical-rl" as const, transform:"rotate(180deg)"}}>LVL 4</div>
        </div>
      </nav>

      {/* FEED */}
      <div style={{position:"relative", height:"100vh", overflow:"hidden"}}
        onWheel={onWheel}
        onTouchStart={e => { touchStart.current = e.touches[0].clientY; }}
        onTouchEnd={e => { const d = touchStart.current - e.changedTouches[0].clientY; if (Math.abs(d)>50) { if(d>0) goTo(current+1); else goTo(current-1); }}}
      >
        {/* Top bar */}
        <div style={{position:"absolute", top:0, left:0, right:0, height:52, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", background:"linear-gradient(to bottom,#080808,transparent)", zIndex:20}}>
          <div style={{fontSize:10, letterSpacing:"3px", textTransform:"uppercase", color:"#b8b4ae", display:"flex", alignItems:"center", gap:10}}>
            <span style={{width:20, height:1, background:"#c0001a", display:"inline-block"}}/>
            {activePassion}
          </div>
          <div style={{display:"flex", gap:20}}>
            {["ALL","VIDEO","ARTICLE","PODCAST","FORUM"].map(t => (
              <button key={t} onClick={() => setFeedTab(t)} style={{background:"none", border:"none", borderBottom: feedTab===t ? "1px solid #c0001a" : "1px solid transparent", fontSize:9, letterSpacing:"2px", textTransform:"uppercase" as const, color: feedTab===t ? "#f0ede8" : "#444", padding:"2px 0", fontFamily:"'DM Sans',sans-serif"}}>{t}</button>
            ))}
          </div>
          <div style={{fontSize:10, color:"#444"}}>{loading ? "Loading..." : `${current+1} / ${feed.length}`}</div>
        </div>

        {/* Cards */}
        <div style={{position:"relative", height:"100%", width:"100%"}}>
          {loading ? (
            <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16}}>
              <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:48, color:"#c0001a", letterSpacing:4}}>DROPOUT</div>
              <div style={{fontSize:11, letterSpacing:"3px", textTransform:"uppercase", color:"#444"}}>Claude centralise vos ressources...</div>
              <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scaleX(0.5)}50%{opacity:1;transform:scaleX(1)}}`}</style>
              <div style={{width:40, height:1, background:"#c0001a", animation:"pulse 1s ease-in-out infinite"}}/>
            </div>
          ) : feed.map((card:any, idx:number) => (
            <div key={card.id} style={cardStyle(getState(idx), card.bg || "linear-gradient(135deg,#0a0005,#1a0008,#080808)", card.thumbnail)}>
              
              {/* Thumbnail background */}
              {card.thumbnail && (
                <>
                  <img src={card.thumbnail} alt="" style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", zIndex:0}}/>
                  <div style={{position:"absolute", inset:0, background:"linear-gradient(to top,rgba(8,8,8,0.98) 0%,rgba(8,8,8,0.7) 40%,rgba(8,8,8,0.3) 100%)", zIndex:1}}/>
                </>
              )}
              {!card.thumbnail && (
                <div style={{position:"absolute", inset:0, background:"linear-gradient(to top,rgba(8,8,8,0.97) 0%,rgba(8,8,8,0.5) 50%,rgba(8,8,8,0.1) 100%)", zIndex:1}}/>
              )}

              {/* Type tag */}
              <div style={{position:"absolute", top:64, left:28, zIndex:10, display:"flex", alignItems:"center", gap:10}}>
                <span style={{fontSize:9, letterSpacing:"2.5px", textTransform:"uppercase" as const, fontWeight:600, padding:"4px 10px", border:"1px solid", color: card.type==="VIDEO" ? "#ff4466" : card.type==="ARTICLE" ? "#4aab87" : card.type==="PODCAST" ? "#c9a84c" : "#888", borderColor: card.type==="VIDEO" ? "rgba(255,68,102,0.3)" : card.type==="ARTICLE" ? "rgba(74,171,135,0.3)" : card.type==="PODCAST" ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.1)", background: card.type==="VIDEO" ? "rgba(255,68,102,0.07)" : card.type==="ARTICLE" ? "rgba(74,171,135,0.07)" : card.type==="PODCAST" ? "rgba(201,168,76,0.07)" : "rgba(255,255,255,0.03)"}}>{card.type}</span>
                <span style={{fontSize:10, color:"#888", letterSpacing:"1px"}}>{card.source}</span>
              </div>

              {/* Content */}
              <div style={{position:"relative", zIndex:10, padding:"0 32px 32px"}}>
                <div style={{fontSize:10, letterSpacing:"3px", color:"#444", marginBottom:12}}>{String(idx+1).padStart(2,"0")} — {feed.length}</div>
                <div style={{fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:700, lineHeight:1.1, marginBottom:14, maxWidth:520}}>
                  {card.title} <em style={{fontStyle:"italic", color:"#c0001a"}}>{card.italic}</em>
                </div>
                <div style={{fontSize:14, color:"#b8b4ae", lineHeight:1.75, maxWidth:480, marginBottom:24, fontWeight:300}}>{card.excerpt}</div>
                <div style={{display:"flex", gap:20, marginBottom:22}}>
                  {[["Duration", card.duration],["Source", card.source]].map(([l,v]) => (
                    <div key={l} style={{fontSize:10, letterSpacing:"2px", textTransform:"uppercase" as const, color:"#555"}}>{l} <span style={{color:"#b8b4ae"}}>{v}</span></div>
                  ))}
                </div>
                <div style={{display:"flex", gap:10}}>
                  <button
                    onClick={() => card.url && card.url !== "#" && window.open(card.url, "_blank")}
                    style={{padding:"11px 28px", background: card.url && card.url !== "#" ? "#c0001a" : "#222", border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:600, letterSpacing:"2px", textTransform:"uppercase" as const, color:"white", opacity: card.url && card.url !== "#" ? 1 : 0.5}}
                  >
                    {card.url && card.url !== "#" ? "Open Resource" : "Coming Soon"}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); toggleSave(idx); }}
                    style={{padding:"11px 20px", background: saved.includes(idx) ? "rgba(192,0,26,0.08)" : "transparent", border: saved.includes(idx) ? "1px solid rgba(192,0,26,0.3)" : "1px solid rgba(255,255,255,0.09)", fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase" as const, color: saved.includes(idx) ? "#c0001a" : "#b8b4ae"}}
                  >
                    {saved.includes(idx) ? "Saved" : "Save"}
                  </button>
                  <button
                    onClick={() => goTo(current+1)}
                    style={{padding:"11px 20px", background:"transparent", border:"1px solid rgba(255,255,255,0.09)", fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase" as const, color:"#b8b4ae"}}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", display:"flex", flexDirection:"column", gap:6, zIndex:20}}>
          {feed.map((_:any, idx:number) => (
            <div key={idx} onClick={() => goTo(idx)} style={{width:2, height: idx===current ? 32 : 18, background: idx===current ? "#c0001a" : idx<current ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)", cursor:"pointer", transition:"all .3s"}}/>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{background:"#0f0f0f", borderLeft:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden"}}>
        <div style={{padding:"18px 18px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:20, letterSpacing:"2px", marginBottom:4}}>DROPOUT <span style={{color:"#c0001a"}}>AI</span></div>
          <div style={{fontSize:10, color:"#444", letterSpacing:"1px"}}>Powered by Claude · {feed.length} resources</div>
        </div>

        <div style={{display:"flex", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"0 18px"}}>
          {["feed","chat","universes"].map(t => (
            <button key={t} onClick={() => setRpTab(t)} style={{padding:"10px 14px 8px", fontSize:9, letterSpacing:"2px", textTransform:"uppercase" as const, color: rpTab===t ? "#f0ede8" : "#444", borderBottom: rpTab===t ? "1px solid #c0001a" : "1px solid transparent", background:"none", border:"none", borderBottomWidth:"1px", borderBottomStyle:"solid" as const, borderBottomColor: rpTab===t ? "#c0001a" : "transparent", fontFamily:"'DM Sans',sans-serif"}}>{t}</button>
          ))}
        </div>

        <div style={{flex:1, overflowY:"auto", padding:"10px"}}>

          {/* FEED TAB */}
          {rpTab==="feed" && feed.map((card:any, idx:number) => (
            <div key={idx} onClick={() => goTo(idx)} style={{padding:"12px", background: idx===current ? "rgba(192,0,26,0.04)" : "#161616", border:`1px solid ${idx===current ? "rgba(192,0,26,0.25)" : "rgba(255,255,255,0.05)"}`, marginBottom:"5px", cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start"}}>
              {card.thumbnail && (
                <img src={card.thumbnail} alt="" style={{width:56, height:40, objectFit:"cover", flexShrink:0}}/>
              )}
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:9, letterSpacing:"2px", textTransform:"uppercase" as const, color:"#444", marginBottom:4}}>{card.type} — {card.source}</div>
                <div style={{fontSize:12, fontWeight:500, color:"#f0ede8", lineHeight:1.4, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const}}>{card.title} {card.italic}</div>
                <div style={{fontSize:10, color:"#444"}}>{card.duration}</div>
              </div>
            </div>
          ))}

          {/* CHAT TAB */}
          {rpTab==="chat" && (
            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              {chatMsgs.map((m,i) => (
                <div key={i} style={{display:"flex", gap:8, flexDirection: m.role==="user" ? "row-reverse" : "row"}}>
                  <div style={{width:22, height:22, background: m.role==="ai" ? "#c0001a" : "#1e1e1e", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"white", flexShrink:0, fontFamily:"'Bebas Neue',cursive"}}>
                    {m.role==="ai" ? "DO" : "M"}
                  </div>
                  <div style={{padding:"9px 12px", fontSize:12, lineHeight:1.65, maxWidth:"80%", fontWeight:300, background: m.role==="ai" ? "#161616" : "rgba(192,0,26,0.08)", color: m.role==="ai" ? "#b8b4ae" : "#f0ede8", borderLeft: m.role==="ai" ? "2px solid #c0001a" : "none", whiteSpace:"pre-wrap" as const}}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoad && (
                <div style={{display:"flex", gap:8}}>
                  <div style={{width:22, height:22, background:"#c0001a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"white", fontFamily:"'Bebas Neue',cursive"}}>DO</div>
                  <div style={{padding:"9px 12px", background:"#161616", borderLeft:"2px solid #c0001a", display:"flex", gap:4}}>
                    {[0,1,2].map(i => <div key={i} style={{width:5, height:5, borderRadius:"50%", background:"#c0001a", opacity:0.5, animation:`bounce 1.1s ease infinite ${i*0.18}s`}}/>)}
                  </div>
                </div>
              )}
              <div ref={chatEnd}/>
            </div>
          )}

          {/* UNIVERSES TAB */}
          {rpTab==="universes" && (
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
              {UNIVERS.map((u,i) => (
                <div key={i} style={{padding:"14px 12px", background:"#161616", border:"1px solid rgba(255,255,255,0.05)", cursor:"pointer"}}>
                  <div style={{fontSize:11, fontWeight:600, color:"#f0ede8", marginBottom:4}}>{u.title}</div>
                  <div style={{fontSize:10, color:"#444", lineHeight:1.4}}>{u.sub}</div>
                  <div style={{fontSize:12, color:"#c0001a", marginTop:8}}>→</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat input */}
        {rpTab==="chat" && (
          <div style={{padding:"12px", borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{display:"flex", gap:8}}>
              <input
                value={chatIn}
                onChange={e => setChatIn(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") sendChat(); }}
                placeholder="J'ai vu Le Mans 66..."
                style={{flex:1, background:"#161616", border:"1px solid rgba(255,255,255,0.09)", padding:"9px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", color:"#f0ede8", outline:"none"}}
              />
              <button
                onClick={() => sendChat()}
                disabled={chatLoad || !chatIn.trim()}
                style={{width:34, height:34, background:"#c0001a", border:"none", color:"white", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center"}}
              >→</button>
            </div>
          </div>
        )}

        {/* Passions */}
        <div style={{padding:"12px", borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{fontSize:9, letterSpacing:"2.5px", textTransform:"uppercase" as const, color:"#444", marginBottom:8}}>Your Passions</div>
          <div style={{display:"flex", gap:5, flexWrap:"wrap" as const}}>
            {PASSIONS.map(p => (
              <button key={p} onClick={() => switchPassion(p)} style={{padding:"5px 10px", background: activePassion===p ? "rgba(192,0,26,0.06)" : "#161616", border: activePassion===p ? "1px solid rgba(192,0,26,0.3)" : "1px solid rgba(255,255,255,0.06)", fontSize:10, color: activePassion===p ? "#c0001a" : "#555", fontFamily:"'DM Sans',sans-serif"}}>{p}</button>
            ))}
            <button style={{padding:"5px 10px", background:"transparent", border:"1px dashed rgba(255,255,255,0.09)", fontSize:10, color:"#444", fontFamily:"'DM Sans',sans-serif"}}>+ Add</button>
          </div>
        </div>
      </div>

      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:0.3}50%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}
