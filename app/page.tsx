"use client";
import { useState, useRef, useEffect } from "react";

const FEED = [
  { id:1, type:"VIDEO", source:"Petrolicious", title:"The Last Air-Cooled", italic:"993", excerpt:"Why the final air-cooled 911 remains the most sought-after Porsche ever built. A deep dive into engineering, culture, and obsession.", duration:"18 min", bg:"linear-gradient(135deg,#0a0005,#1a0008,#080808)" },
  { id:2, type:"ARTICLE", source:"Road & Track", title:"Flat-Six", italic:"Decoded", excerpt:"The engineering philosophy behind Porsche's most iconic engine. How six horizontally-opposed cylinders became a cultural artifact.", duration:"12 min read", bg:"linear-gradient(135deg,#00050a,#001018,#080808)" },
  { id:3, type:"PODCAST", source:"The 911 Files", title:"Episode 12 :", italic:"La 930 Turbo", excerpt:"How a single car defined an era. The story of the 930 Turbo — its power, its danger, and why collectors still call it the widowmaker.", duration:"52 min", bg:"linear-gradient(135deg,#050a00,#0a1800,#080808)" },
  { id:4, type:"ARTICLE", source:"Evo Magazine", title:"Ten Rarest", italic:"911s Ever Built", excerpt:"From the 2.7 RS to the GT1 Strassenversion. A definitive guide to the most collectible Porsches in history.", duration:"15 min read", bg:"linear-gradient(135deg,#0a0500,#180a00,#080808)" },
  { id:5, type:"VIDEO", source:"Motor Trend", title:"60 Years of", italic:"Rivalry", excerpt:"Porsche vs Ferrari. From Le Mans 1966 to the modern GT wars. The greatest competition in motorsport.", duration:"24 min", bg:"linear-gradient(135deg,#0a0002,#1a0005,#080808)" },
  { id:6, type:"FORUM", source:"Rennlist", title:"Buying Your First", italic:"964", excerpt:"The definitive community guide to purchasing a 964 in 2024. What to check, what to avoid, and why the market shifted.", duration:"32 min read", bg:"linear-gradient(135deg,#000508,#000d14,#080808)" },
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
  const [current, setCurrent] = useState(0);
  const [saved, setSaved] = useState<number[]>([]);
  const [rpTab, setRpTab] = useState("feed");
  const [feedTab, setFeedTab] = useState("ALL");
  const [activePassion, setActivePassion] = useState("Porsche 911");
  const [isAnim, setIsAnim] = useState(false);
  const [prevIdx, setPrevIdx] = useState(-1);
  const touchStart = useRef(0);

  const goTo = (idx: number) => {
    if (isAnim || idx === current || idx < 0 || idx >= FEED.length) return;
    setIsAnim(true);
    setPrevIdx(current);
    setCurrent(idx);
    setTimeout(() => { setPrevIdx(-1); setIsAnim(false); }, 520);
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") goTo(current + 1);
      if (e.key === "ArrowUp") goTo(current - 1);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [current, isAnim]);

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 30) return;
    if (e.deltaY > 0) goTo(current + 1); else goTo(current - 1);
  };

  const toggleSave = (idx: number) => {
    setSaved(p => p.includes(idx) ? p.filter(i => i !== idx) : [...p, idx]);
  };

  const getState = (idx: number) => {
    if (idx === current) return "current";
    if (idx === prevIdx) return "prev";
    if (idx === current + 1) return "next";
    return "hidden";
  };

  const s: Record<string, React.CSSProperties> = {
    app: { display:"grid", gridTemplateColumns:"56px 1fr 300px", height:"100vh", overflow:"hidden", background:"#080808", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif" },
    leftnav: { background:"#080808", borderRight:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 0", gap:"4px" },
    logo: { fontFamily:"'Bebas Neue',cursive", fontSize:"18px", color:"#c0001a", letterSpacing:"2px", writingMode:"vertical-rl" as const, transform:"rotate(180deg)", marginBottom:"28px", cursor:"pointer" },
    feed: { position:"relative" as const, height:"100vh", overflow:"hidden", background:"#080808" },
    feedTop: { position:"absolute" as const, top:0, left:0, right:0, height:"52px", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", background:"linear-gradient(to bottom,#080808,transparent)", zIndex:20 },
    right: { background:"#0f0f0f", borderLeft:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" },
  };

  const cardStyle = (state: string, bg: string): React.CSSProperties => ({
    position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:"flex-end",
    transition:"transform .5s cubic-bezier(.4,0,.2,1), opacity .5s",
    transform: state === "current" ? "translateY(0)" : state === "prev" ? "translateY(-100%)" : state === "next" ? "translateY(100%)" : "translateY(100%)",
    opacity: state === "current" ? 1 : 0,
    zIndex: state === "current" ? 5 : 1,
    pointerEvents: state === "current" ? "auto" : "none",
    background: bg,
  });

  const item = FEED[current];

  return (
    <div style={s.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@1,400;0,700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow:hidden;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1)}
        button{cursor:pointer}
      `}</style>

      {/* LEFT NAV */}
      <nav style={s.leftnav}>
        <div style={s.logo}>DO</div>
        {["FEED","SAVED","PATH"].map(item => (
          <div key={item} style={{ width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, letterSpacing:"1.5px", color: item === "FEED" ? "#c0001a" : "#444", writingMode:"vertical-rl" as const, transform:"rotate(180deg)", fontWeight:600, borderBottom: item === "FEED" ? "none" : "none", background: item === "FEED" ? "rgba(192,0,26,0.06)" : "transparent", border: item === "FEED" ? "1px solid rgba(192,0,26,0.2)" : "1px solid transparent" }}>{item}</div>
        ))}
        <div style={{ marginTop:"auto", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:16, color:"#f0ede8", writingMode:"vertical-rl" as const, transform:"rotate(180deg)" }}><span style={{color:"#c0001a"}}>23</span> DAYS</div>
          <div style={{ fontSize:9, color:"#444", letterSpacing:"2px", writingMode:"vertical-rl" as const, transform:"rotate(180deg)" }}>LVL 4</div>
        </div>
      </nav>

      {/* FEED */}
      <div style={s.feed} onWheel={onWheel} onTouchStart={e => { touchStart.current = e.touches[0].clientY; }} onTouchEnd={e => { const d = touchStart.current - e.changedTouches[0].clientY; if (Math.abs(d) > 50) { if (d > 0) goTo(current+1); else goTo(current-1); } }}>
        <div style={s.feedTop}>
          <div style={{ fontSize:10, letterSpacing:"3px", textTransform:"uppercase" as const, color:"#b8b4ae", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ width:20, height:1, background:"#c0001a", display:"inline-block" }}/>
            Porsche 911
          </div>
          <div style={{ display:"flex", gap:20 }}>
            {["ALL","VIDEO","ARTICLE","PODCAST","FORUM"].map(t => (
              <button key={t} onClick={() => setFeedTab(t)} style={{ background:"none", border:"none", borderBottom: feedTab === t ? "1px solid #c0001a" : "1px solid transparent", fontSize:9, letterSpacing:"2px", textTransform:"uppercase" as const, color: feedTab === t ? "#f0ede8" : "#444", padding:"2px 0", fontFamily:"'DM Sans',sans-serif" }}>{t}</button>
            ))}
          </div>
          <div style={{ fontSize:10, color:"#444", letterSpacing:"1px" }}>{current+1} / {FEED.length}</div>
        </div>

        {/* Cards */}
        <div style={{ position:"relative", height:"100%", width:"100%" }}>
          {FEED.map((card, idx) => (
            <div key={card.id} style={cardStyle(getState(idx), card.bg)}>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(8,8,8,0.97) 0%,rgba(8,8,8,0.5) 50%,rgba(8,8,8,0.1) 100%)" }}/>
              <div style={{ position:"absolute", top:64, left:28, zIndex:10, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:9, letterSpacing:"2.5px", textTransform:"uppercase" as const, fontWeight:600, padding:"4px 10px", border:"1px solid", color: card.type === "VIDEO" ? "#ff4466" : card.type === "ARTICLE" ? "#4aab87" : card.type === "PODCAST" ? "#c9a84c" : "#888", borderColor: card.type === "VIDEO" ? "rgba(255,68,102,0.3)" : card.type === "ARTICLE" ? "rgba(74,171,135,0.3)" : card.type === "PODCAST" ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.1)", background: card.type === "VIDEO" ? "rgba(255,68,102,0.07)" : card.type === "ARTICLE" ? "rgba(74,171,135,0.07)" : card.type === "PODCAST" ? "rgba(201,168,76,0.07)" : "rgba(255,255,255,0.03)" }}>{card.type}</span>
                <span style={{ fontSize:10, color:"#444", letterSpacing:"1px" }}>{card.source}</span>
              </div>
              <div style={{ position:"relative", zIndex:10, padding:"0 32px 32px" }}>
                <div style={{ fontSize:10, letterSpacing:"3px", color:"#444", marginBottom:12 }}>{String(idx+1).padStart(2,"0")} — {FEED.length}</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:700, lineHeight:1.1, marginBottom:14, maxWidth:520 }}>
                  {card.title} <em style={{ fontStyle:"italic", color:"#c0001a" }}>{card.italic}</em>
                </div>
                <div style={{ fontSize:14, color:"#b8b4ae", lineHeight:1.75, maxWidth:480, marginBottom:24, fontWeight:300 }}>{card.excerpt}</div>
                <div style={{ display:"flex", gap:20, marginBottom:22 }}>
                  {[["Duration", card.duration], ["Source", card.source]].map(([l,v]) => (
                    <div key={l} style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase" as const, color:"#444" }}>{l} <span style={{color:"#b8b4ae"}}>{v}</span></div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button style={{ padding:"11px 28px", background:"#c0001a", border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:600, letterSpacing:"2px", textTransform:"uppercase" as const, color:"white" }}>Open Resource</button>
                  <button onClick={e => { e.stopPropagation(); toggleSave(idx); }} style={{ padding:"11px 20px", background: saved.includes(idx) ? "rgba(192,0,26,0.08)" : "transparent", border: saved.includes(idx) ? "1px solid rgba(192,0,26,0.3)" : "1px solid rgba(255,255,255,0.09)", fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase" as const, color: saved.includes(idx) ? "#c0001a" : "#b8b4ae" }}>{saved.includes(idx) ? "Saved" : "Save"}</button>
                  <button onClick={() => goTo(current+1)} style={{ padding:"11px 20px", background:"transparent", border:"1px solid rgba(255,255,255,0.09)", fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase" as const, color:"#b8b4ae" }}>Next</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", display:"flex", flexDirection:"column", gap:6, zIndex:20 }}>
          {FEED.map((_,idx) => (
            <div key={idx} onClick={() => goTo(idx)} style={{ width:2, height: idx === current ? 32 : 18, background: idx === current ? "#c0001a" : idx < current ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)", cursor:"pointer", transition:"all .3s" }}/>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={s.right}>
        <div style={{ padding:"18px 18px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:20, letterSpacing:"2px", marginBottom:4 }}>PORSCHE <span style={{color:"#c0001a"}}>911</span></div>
          <div style={{ display:"flex", gap:14 }}>
            {[["847","resources"],["34%","explored"],["6","universes"]].map(([n,l]) => (
              <div key={l} style={{ fontSize:10, color:"#444", letterSpacing:"1px" }}><strong style={{color:"#b8b4ae", fontWeight:500}}>{n}</strong> {l}</div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"0 18px" }}>
          {["feed","saved","universes"].map(t => (
            <button key={t} onClick={() => setRpTab(t)} style={{ padding:"10px 14px 8px", fontSize:9, letterSpacing:"2px", textTransform:"uppercase" as const, color: rpTab === t ? "#f0ede8" : "#444", borderBottom: rpTab === t ? "1px solid #c0001a" : "1px solid transparent", background:"none", border:"none", borderBottomWidth:"1px", borderBottomStyle:"solid" as const, borderBottomColor: rpTab === t ? "#c0001a" : "transparent", fontFamily:"'DM Sans',sans-serif" }}>{t}</button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"10px" }}>
          {rpTab === "feed" && FEED.map((card, idx) => (
            <div key={idx} onClick={() => goTo(idx)} style={{ padding:"12px", background: idx === current ? "rgba(192,0,26,0.04)" : "#161616", border: `1px solid ${idx === current ? "rgba(192,0,26,0.25)" : "rgba(255,255,255,0.05)"}`, marginBottom:"5px", cursor:"pointer" }}>
              <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase" as const, color:"#444", marginBottom:5 }}>{card.type} — {card.source}</div>
              <div style={{ fontSize:12, fontWeight:500, color:"#f0ede8", lineHeight:1.4, marginBottom:4 }}>{card.title} {card.italic}</div>
              <div style={{ fontSize:10, color:"#444" }}>{card.duration}</div>
            </div>
          ))}
          {rpTab === "saved" && (
            saved.length === 0
              ? <div style={{ padding:"32px 14px", textAlign:"center" as const, color:"#444", fontSize:12 }}>No saved resources yet.<br/>Press Save on any card.</div>
              : saved.map(idx => {
                const card = FEED[idx];
                return (
                  <div key={idx} onClick={() => goTo(idx)} style={{ padding:"12px", background:"#161616", border:"1px solid rgba(255,255,255,0.05)", marginBottom:"5px", cursor:"pointer" }}>
                    <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase" as const, color:"#444", marginBottom:5 }}>{card.type} — {card.source}</div>
                    <div style={{ fontSize:12, fontWeight:500, color:"#f0ede8", lineHeight:1.4 }}>{card.title} {card.italic}</div>
                  </div>
                );
              })
          )}
          {rpTab === "universes" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, padding:"2px" }}>
              {UNIVERS.map((u,i) => (
                <div key={i} style={{ padding:"14px 12px", background:"#161616", border:"1px solid rgba(255,255,255,0.05)", cursor:"pointer" }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#f0ede8", marginBottom:4 }}>{u.title}</div>
                  <div style={{ fontSize:10, color:"#444", lineHeight:1.4 }}>{u.sub}</div>
                  <div style={{ fontSize:12, color:"#c0001a", marginTop:8 }}>→</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding:"12px", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize:9, letterSpacing:"2.5px", textTransform:"uppercase" as const, color:"#444", marginBottom:8 }}>Your Passions</div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" as const }}>
            {PASSIONS.map(p => (
              <button key={p} onClick={() => setActivePassion(p)} style={{ padding:"5px 10px", background: activePassion === p ? "rgba(192,0,26,0.06)" : "#161616", border: activePassion === p ? "1px solid rgba(192,0,26,0.3)" : "1px solid rgba(255,255,255,0.06)", fontSize:10, color: activePassion === p ? "#c0001a" : "#555", fontFamily:"'DM Sans',sans-serif", letterSpacing:".5px" }}>{p}</button>
            ))}
            <button style={{ padding:"5px 10px", background:"transparent", border:"1px dashed rgba(255,255,255,0.09)", fontSize:10, color:"#444", fontFamily:"'DM Sans',sans-serif" }}>+ Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
