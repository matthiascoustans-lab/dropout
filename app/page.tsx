"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const SUGGESTED_PASSIONS = [
  "Porsche 911",
  "Running",
  "Photographie",
  "Histoire",
  "Cuisine japonaise",
  "Jazz",
  "Architecture",
  "Investissement",
  "Yoga",
  "Astronomie",
  "Surf",
  "Vin",
  "Tennis",
  "Littérature",
];

const LEVELS = ["Débutant", "Passionné", "Expert"];

const BADGES = [
  { id: "first", label: "Premier pas", xp: 0, icon: "◈", desc: "Bienvenue" },
  { id: "curious", label: "Curieux", xp: 50, icon: "◉", desc: "50 XP" },
  { id: "learner", label: "Apprenant", xp: 150, icon: "◇", desc: "150 XP" },
  { id: "expert", label: "Expert", xp: 400, icon: "◆", desc: "400 XP" },
];

const TABS = [
  { id: "feed", label: "Explorer", icon: "▶" },
  { id: "learn", label: "Apprendre", icon: "🧠" },
  { id: "articles", label: "Articles", icon: "📄" },
  { id: "podcasts", label: "Podcasts", icon: "🎧" },
  { id: "forums", label: "Forums", icon: "💬" },
  { id: "news", label: "Actualités", icon: "⚡" },
];

const UI = {
  bg: "#f4f7fb",
  panel: "#ffffff",
  panelSoft: "#fbfcff",
  border: "#e5ebf5",
  borderStrong: "#d8e2f0",
  text: "#0f172a",
  textSoft: "#5f6c80",
  textMuted: "#97a3b6",
  blue: "#2563eb",
  blueDark: "#1d4ed8",
  blueSoft: "#edf4ff",
  blueSoft2: "#dbeafe",
  success: "#168a5b",
  successBg: "#edfdf5",
  orange: "#b86a1f",
  orangeBg: "#fff4e8",
  neutralBg: "#f5f7fb",
  shadowSm: "0 6px 20px rgba(15, 23, 42, 0.05)",
  shadowMd: "0 16px 40px rgba(15, 23, 42, 0.09)",
  radius: 18,
  radiusLg: 24,
};

type Resource = {
  id?: string;
  type?: string;
  title?: string;
  excerpt?: string;
  source?: string;
  url?: string;
  thumbnail?: string;
  videoId?: string;
  xp?: number;
};

type LearningQuiz = {
  question: string;
  options: string[];
  answer: string;
};

type LearningStep = {
  title: string;
  description?: string;
  explanation: string;
  resources?: Resource[];
  summary?: string;
  quiz?: LearningQuiz[];
};

type LearningPath = {
  topic: string;
  focus: string;
  level: string;
  intro: string;
  steps: LearningStep[];
};

const LEARNING_FOCUS_MAP: Record<string, Array<{ title: string; desc: string; emoji: string; levels?: string[] }>> = {
  "Porsche 911": [
    { title: "Histoire", desc: "Comprendre l’évolution de la 911, ses générations et ses grandes ruptures.", emoji: "📖" },
    { title: "Mécanique", desc: "Découvrir les bases techniques, les moteurs, l’entretien et les points sensibles.", emoji: "🔧" },
    { title: "Guide d’achat", desc: "Apprendre quelles générations regarder, quels budgets prévoir et quels pièges éviter.", emoji: "🛒" },
    { title: "Performance", desc: "Comprendre les différences de conduite, de philosophie et de comportement entre les versions.", emoji: "🏁" },
    { title: "Investissement", desc: "Analyser la cote, la rareté, la désirabilité et la logique du marché.", emoji: "📈", levels: ["Passionné", "Expert"] },
  ],
  Running: [
    { title: "Entraînement", desc: "Comprendre comment progresser, structurer ses séances et éviter les erreurs classiques.", emoji: "🏃" },
    { title: "Nutrition", desc: "Découvrir comment mieux manger avant, pendant et après l’effort.", emoji: "🥗" },
    { title: "Biomécanique", desc: "Comprendre la foulée, les appuis, la technique et la prévention des blessures.", emoji: "🦵" },
    { title: "Équipement", desc: "Choisir ses chaussures, sa montre, ses accessoires et comprendre ce qui compte vraiment.", emoji: "👟" },
    { title: "Préparation course", desc: "Construire un plan pour 10 km, semi ou marathon avec une logique progressive.", emoji: "🎯" },
  ],
};

function getLearningFocuses(topic: string, level: string) {
  const defaultFocuses = [
    { title: "Bases", desc: "Comprendre les fondamentaux du sujet avec une approche claire et structurée.", emoji: "📘" },
    { title: "Histoire", desc: "Découvrir l’origine, l’évolution et les grandes étapes du sujet.", emoji: "🕰️" },
    { title: "Technique", desc: "Approfondir les mécanismes, les méthodes et le vocabulaire important.", emoji: "🛠️" },
    { title: "Guide pratique", desc: "Apprendre à prendre de meilleures décisions et éviter les erreurs fréquentes.", emoji: "🧭" },
  ];

  const focuses = LEARNING_FOCUS_MAP[topic] || defaultFocuses;
  return focuses.filter((item) => !item.levels || item.levels.includes(level));
}

export default function Home() {
  const [phase, setPhase] = useState<"onboarding" | "dashboard">("onboarding");
  const [obStep, setObStep] = useState(0);
  const [profile, setProfile] = useState({ name: "", passions: [] as string[], levels: {} as Record<string, string> });
  const [newPassionInput, setNewPassionInput] = useState("");
  const [activePassion, setActivePassion] = useState("");
  const [activeTab, setActiveTab] = useState("feed");
  const [feeds, setFeeds] = useState<Record<string, any[]>>({ feed: [], articles: [], podcasts: [], forums: [], news: [] });
  const [loadingTab, setLoadingTab] = useState<Record<string, boolean>>({ feed: false, articles: false, podcasts: false, forums: false, news: false });
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<any[]>([]);
  const [xp, setXp] = useState(0);
  const [consumed, setConsumed] = useState<Set<string>>(new Set());
  const [showXpPop, setShowXpPop] = useState<string | null>(null);
  const [rpTab, setRpTab] = useState("chat");
  const [chatMsgs, setChatMsgs] = useState<any[]>([]);
  const [chatIn, setChatIn] = useState("");
  const [chatLoad, setChatLoad] = useState(false);
  const [addingPassion, setAddingPassion] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("viewCount");
  const [learningFocus, setLearningFocus] = useState<string | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [learningLoading, setLearningLoading] = useState(false);
  const [quizSelections, setQuizSelections] = useState<Record<string, string>>({});
  const [quizRevealed, setQuizRevealed] = useState<Record<string, boolean>>({});
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  const buildStableId = (tab: string, resource: any, i: number) => {
    return resource.url || resource.videoId || `${tab}-${resource.title || "item"}-${i}`;
  };

  const loadTab = useCallback(
    async (passion: string, tab: string, append = false, forcedPage?: number) => {
      const currentPage = forcedPage ?? page;
      if (!append) setLoadingTab((prev) => ({ ...prev, [tab]: true }));
      else setLoadingMore(true);

      try {
        const body: any = { passion, type: tab, page: currentPage };
        if (tab === "feed") {
          body.dateFilter = dateFilter;
          body.order = sortOrder;
        }

        const res = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (data.resources?.length) {
          const items = data.resources.map((r: any, i: number) => ({
            ...r,
            id: buildStableId(tab, r, i),
            xp: r.xp || (r.videoId ? 15 : 10),
          }));

          if (append) {
            setFeeds((prev) => ({ ...prev, [tab]: [...prev[tab], ...items] }));
          } else {
            setFeeds((prev) => ({ ...prev, [tab]: items }));
          }
        } else if (!append) {
          setFeeds((prev) => ({ ...prev, [tab]: [] }));
        }
      } catch (e) {
        console.error(e);
      }

      if (!append) setLoadingTab((prev) => ({ ...prev, [tab]: false }));
      else setLoadingMore(false);
    },
    [page, dateFilter, sortOrder]
  );

  const generateLearningPath = useCallback(
    async (focus: string) => {
      setLearningLoading(true);
      setLearningPath(null);
      setQuizSelections({});
      setQuizRevealed({});

      try {
        const res = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "learning_path",
            topic: activePassion,
            focus,
            level: profile.levels[activePassion],
          }),
        });

        const data = await res.json();
        setLearningPath(data);
      } catch (e) {
        console.error(e);
      }

      setLearningLoading(false);
    },
    [activePassion, profile.levels]
  );

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    setPlayingVideo(null);
    setPage(1);

    if (tab === "learn") {
      setLearningPath(null);
      setLearningFocus(null);
      return;
    }

    if (feeds[tab].length === 0) loadTab(activePassion, tab, false, 1);
  };

  const startDashboard = () => {
    const p = profile.passions[0];
    setActivePassion(p);
    setChatMsgs([
      {
        role: "ai",
        content: `Bonjour ${profile.name} ! Je centralise vidéos, articles, podcasts et forums sur ${profile.passions.join(", ")}. Que voulez-vous explorer ?`,
      },
    ]);
    loadTab(p, "feed", false, 1);
    setPhase("dashboard");
  };

  const switchPassion = (p: string) => {
    setActivePassion(p);
    setActiveTab("feed");
    setPage(1);
    setPlayingVideo(null);
    setLearningFocus(null);
    setLearningPath(null);
    setQuizSelections({});
    setQuizRevealed({});
    setFeeds({ feed: [], articles: [], podcasts: [], forums: [], news: [] });
    loadTab(p, "feed", false, 1);
  };

  const addPassion = (passion: string) => {
    if (!passion.trim() || profile.passions.includes(passion)) return;
    setProfile((prev) => ({
      ...prev,
      passions: [...prev.passions, passion],
      levels: { ...prev.levels, [passion]: "Débutant" },
    }));
    setNewPassionInput("");
    setAddingPassion(false);
    setActivePassion(passion);
    setActiveTab("feed");
    setFeeds({ feed: [], articles: [], podcasts: [], forums: [], news: [] });
    setPage(1);
    loadTab(passion, "feed", false, 1);
  };

  const consumeResource = (id: string, earnXp: number) => {
    if (consumed.has(id)) return;
    setConsumed((prev) => new Set([...prev, id]));
    setXp((prev) => prev + earnXp);
    setShowXpPop(`+${earnXp} XP`);
    setTimeout(() => setShowXpPop(null), 1400);
  };

  const toggleSave = (item: any) => {
    setSaved((prev) => (prev.find((s) => s.url === item.url) ? prev.filter((s) => s.url !== item.url) : [...prev, item]));
  };

  const isSaved = (item: any) => saved.some((s) => s.url === item.url);

  const sendChat = async (text?: string) => {
    const q = text || chatIn.trim();
    if (!q) return;

    setChatMsgs((prev) => [...prev, { role: "user", content: q }]);
    setChatIn("");
    setChatLoad(true);

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passion: `${q} (contexte: ${profile.name} explore ${activePassion})`, type: "chat" }),
      });

      const data = await res.json();
      setChatMsgs((prev) => [...prev, { role: "ai", content: data.response }]);

      if (data.searchResults?.length) {
        const items = data.searchResults.map((r: any, i: number) => ({
          ...r,
          id: buildStableId("feed", r, i),
        }));
        setFeeds((prev) => ({ ...prev, feed: [...items, ...prev.feed] }));
        setActiveTab("feed");
      }
    } catch {
      setChatMsgs((prev) => [...prev, { role: "ai", content: "Erreur." }]);
    }

    setChatLoad(false);
  };

  const displayFeed = feeds[activeTab] || [];
  const isLoading = activeTab === "learn" ? learningLoading : loadingTab[activeTab];
  const level = Math.floor(xp / 100) + 1;
  const earnedBadges = BADGES.filter((b) => xp >= b.xp);
  const activeTabMeta = TABS.find((t) => t.id === activeTab);
  const levelForPassion = profile.levels[activePassion] || "Débutant";
  const learningFocuses = getLearningFocuses(activePassion, levelForPassion);

  const styles = {
    chip: (active = false) => ({
      padding: "8px 14px",
      borderRadius: 999,
      border: `1px solid ${active ? UI.blueSoft2 : UI.border}`,
      background: active ? UI.blueSoft : UI.panel,
      color: active ? UI.blue : UI.textSoft,
      fontSize: 12,
      fontWeight: active ? 700 : 500,
      cursor: "pointer",
      transition: "all .18s ease",
    }),
    select: {
      padding: "9px 12px",
      border: `1px solid ${UI.border}`,
      borderRadius: 12,
      fontSize: 11,
      color: UI.textSoft,
      background: UI.panel,
      outline: "none",
      boxShadow: "none",
    } as const,
    primaryBtn: {
      padding: "10px 16px",
      border: "none",
      borderRadius: 12,
      background: `linear-gradient(135deg, ${UI.blue}, ${UI.blueDark})`,
      color: "white",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 10px 24px rgba(37, 99, 235, 0.22)",
    } as const,
    secondaryBtn: {
      padding: "10px 16px",
      borderRadius: 12,
      border: `1px solid ${UI.borderStrong}`,
      background: UI.panel,
      color: UI.textSoft,
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
    } as const,
  };

  const renderLearningSelection = () => (
    <div style={{ padding: "28px 24px 32px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: UI.blueSoft, color: UI.blue, border: `1px solid ${UI.blueSoft2}`, borderRadius: 999, fontSize: 11, fontWeight: 700, marginBottom: 14 }}>
          🧠 Mode apprentissage
        </div>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: 34, fontWeight: 700, color: UI.text, lineHeight: 1.15 }}>
          Choisis ce que tu veux apprendre sur {activePassion}
        </div>
        <div style={{ fontSize: 14, color: UI.textSoft, marginTop: 10, maxWidth: 760, lineHeight: 1.7 }}>
          Parcours recommandés pour ton niveau <strong style={{ color: UI.text }}>{levelForPassion}</strong>. Sélectionne un angle d’apprentissage et AkoLab te construit un chemin clair, pédagogique et enrichi par l’IA.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {learningFocuses.map((item, i) => (
          <div
            key={item.title}
            className="ak-card"
            onClick={() => {
              setLearningFocus(item.title);
              generateLearningPath(item.title);
            }}
            style={{
              background: UI.panel,
              border: `1px solid ${UI.border}`,
              borderRadius: 24,
              padding: 22,
              cursor: "pointer",
              boxShadow: UI.shadowSm,
              animation: `fadeInUp .32s ease ${i * 0.04}s both`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: UI.blueSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `1px solid ${UI.blueSoft2}` }}>
                {item.emoji}
              </div>
              <div style={{ fontSize: 10, color: UI.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>Parcours</div>
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, color: UI.text, marginBottom: 8 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: UI.textSoft, lineHeight: 1.7, marginBottom: 18 }}>{item.desc}</div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ padding: "6px 10px", borderRadius: 999, fontSize: 11, background: UI.neutralBg, color: UI.textSoft }}>Niveau {levelForPassion}</span>
                <span style={{ padding: "6px 10px", borderRadius: 999, fontSize: 11, background: UI.neutralBg, color: UI.textSoft }}>IA guidée</span>
              </div>
              <div style={{ fontSize: 12, color: UI.blue, fontWeight: 700 }}>Commencer →</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLearningPath = () => {
    if (learningLoading) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "56%", gap: 16 }}>
          <div style={{ width: 38, height: 38, border: `3px solid ${UI.blueSoft2}`, borderTop: `3px solid ${UI.blue}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          <div style={{ fontSize: 14, color: UI.textSoft }}>AkoLab construit ton parcours {learningFocus?.toLowerCase()}...</div>
        </div>
      );
    }

    if (!learningPath) return null;

    return (
      <div style={{ padding: "26px 24px 34px" }}>
        <button
          onClick={() => {
            setLearningFocus(null);
            setLearningPath(null);
            setQuizSelections({});
            setQuizRevealed({});
          }}
          style={{ ...styles.secondaryBtn, marginBottom: 18 }}
        >
          ← Retour aux parcours
        </button>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ padding: "6px 10px", borderRadius: 999, background: UI.blueSoft, border: `1px solid ${UI.blueSoft2}`, fontSize: 11, color: UI.blue, fontWeight: 700 }}>
              {learningPath.level}
            </span>
            <span style={{ padding: "6px 10px", borderRadius: 999, background: UI.neutralBg, fontSize: 11, color: UI.textSoft }}>
              {learningPath.steps?.length || 0} étapes
            </span>
          </div>

          <div style={{ fontFamily: "Playfair Display, serif", fontSize: 34, fontWeight: 700, lineHeight: 1.12, color: UI.text, marginBottom: 10 }}>
            {learningPath.focus}
          </div>
          <div style={{ fontSize: 15, color: UI.textSoft, lineHeight: 1.8, maxWidth: 860 }}>{learningPath.intro}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {learningPath.steps?.map((step, i) => (
            <div key={`${step.title}-${i}`} style={{ background: UI.panel, border: `1px solid ${UI.border}`, borderRadius: 26, overflow: "hidden", boxShadow: UI.shadowSm }}>
              <div style={{ padding: 20, borderBottom: `1px solid ${UI.border}`, background: i % 2 === 0 ? UI.panel : UI.panelSoft }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 12, background: UI.blueSoft, color: UI.blue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, border: `1px solid ${UI.blueSoft2}` }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 21, fontWeight: 800, color: UI.text }}>{step.title}</div>
                    {step.description && <div style={{ fontSize: 12, color: UI.textMuted, marginTop: 4 }}>{step.description}</div>}
                  </div>
                </div>

                <div style={{ fontSize: 14, color: UI.textSoft, lineHeight: 1.8 }}>{step.explanation}</div>
              </div>

              <div style={{ padding: 20 }}>
                {step.resources && step.resources.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: UI.textMuted, fontWeight: 700, marginBottom: 10 }}>
                      Ressources recommandées
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {step.resources.map((resource, j) => {
                        const id = resource.id || buildStableId("learn-resource", resource, j);
                        const type = resource.type || (resource.videoId ? "VIDEO" : "ARTICLE");
                        const typeColor = type === "VIDEO" ? UI.blue : type === "ARTICLE" ? UI.success : type === "PODCAST" ? UI.orange : UI.textSoft;
                        const typeBg = type === "VIDEO" ? UI.blueSoft : type === "ARTICLE" ? UI.successBg : type === "PODCAST" ? UI.orangeBg : UI.neutralBg;
                        return (
                          <div key={id} className="ak-card" style={{ background: UI.panelSoft, border: `1px solid ${UI.border}`, borderRadius: 18, padding: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                              <span style={{ fontSize: 9, letterSpacing: 1.4, textTransform: "uppercase", padding: "4px 8px", fontWeight: 800, color: typeColor, background: typeBg, borderRadius: 999 }}>{type}</span>
                              <span style={{ fontSize: 11, color: UI.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{resource.source}</span>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: UI.text, lineHeight: 1.45, marginBottom: 12 }}>{resource.title}</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              {resource.url && resource.url !== "#" && (
                                <button
                                  onClick={() => {
                                    window.open(resource.url, "_blank");
                                    consumeResource(id, resource.xp || 10);
                                  }}
                                  style={{ ...styles.primaryBtn, flex: 1, padding: "9px 12px", fontSize: 11 }}
                                >
                                  Ouvrir
                                </button>
                              )}
                              <button onClick={() => toggleSave(resource)} style={{ ...styles.secondaryBtn, padding: "9px 12px", color: isSaved(resource) ? UI.blue : UI.textSoft, background: isSaved(resource) ? UI.blueSoft : UI.panel }}>
                                {isSaved(resource) ? "✓" : "Sauver"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step.summary && (
                  <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: UI.blueSoft, border: `1px solid ${UI.blueSoft2}` }}>
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: UI.blue, fontWeight: 700, marginBottom: 8 }}>À retenir</div>
                    <div style={{ fontSize: 13, color: UI.textSoft, lineHeight: 1.8 }}>{step.summary}</div>
                  </div>
                )}

                {step.quiz && step.quiz.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: UI.textMuted, fontWeight: 700, marginBottom: 10 }}>
                      Quiz rapide
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {step.quiz.map((q, qIndex) => {
                        const qid = `${i}-${qIndex}`;
                        const selected = quizSelections[qid];
                        const revealed = quizRevealed[qid];
                        return (
                          <div key={qid} style={{ border: `1px solid ${UI.border}`, borderRadius: 18, padding: 14, background: UI.panelSoft }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: UI.text, marginBottom: 12, lineHeight: 1.6 }}>{q.question}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 12 }}>
                              {q.options.map((option) => {
                                const isSelected = selected === option;
                                const isCorrect = q.answer === option;
                                const showCorrect = revealed && isCorrect;
                                const showWrong = revealed && isSelected && !isCorrect;
                                return (
                                  <button
                                    key={option}
                                    onClick={() => setQuizSelections((prev) => ({ ...prev, [qid]: option }))}
                                    style={{
                                      textAlign: "left",
                                      padding: "11px 12px",
                                      borderRadius: 12,
                                      border: `1px solid ${showCorrect ? "#b7f0cf" : showWrong ? "#ffd3cf" : isSelected ? UI.blueSoft2 : UI.border}`,
                                      background: showCorrect ? UI.successBg : showWrong ? "#fff4f3" : isSelected ? UI.blueSoft : UI.panel,
                                      color: UI.text,
                                      fontSize: 12,
                                      fontWeight: isSelected ? 700 : 500,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              <button
                                onClick={() => {
                                  if (!selected) return;
                                  setQuizRevealed((prev) => ({ ...prev, [qid]: true }));
                                }}
                                disabled={!selected}
                                style={{ ...styles.primaryBtn, padding: "9px 12px", fontSize: 11, opacity: selected ? 1 : 0.45 }}
                              >
                                Vérifier
                              </button>
                              {revealed && (
                                <div style={{ fontSize: 12, fontWeight: 700, color: selected === q.answer ? UI.success : "#d94841" }}>
                                  {selected === q.answer ? "Bonne réponse" : `Bonne réponse : ${q.answer}`}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (phase === "onboarding") {
    return (
      <>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes xpPop { 0% { opacity:0; transform:translate(-50%, 20px) scale(.95); } 20% { opacity:1; transform:translate(-50%, 0) scale(1); } 80% { opacity:1; transform:translate(-50%, -18px) scale(1.02); } 100% { opacity:0; transform:translate(-50%, -36px) scale(.98); } }
          @keyframes bounce { 0%,80%,100% { transform: scale(.6); opacity: .4; } 40% { transform: scale(1); opacity: 1; } }
          .ak-card:hover { transform: translateY(-4px); box-shadow: 0 18px 38px rgba(15,23,42,.1); }
          .ak-transition { transition: all .18s ease; }
          input, select, button { font-family: inherit; }
          * { box-sizing: border-box; }
        `}</style>
        <div style={{ minHeight: "100vh", background: UI.panel, fontFamily: "DM Sans, sans-serif", display: "flex" }}>
          <div
            style={{
              width: "43%",
              background: "radial-gradient(circle at top left, rgba(255,255,255,.14), transparent 26%), linear-gradient(155deg,#123cb9 0%,#2563eb 52%,#5da5ff 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 56,
              position: "sticky",
              top: 0,
              height: "100vh",
              color: "white",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", right: -80, top: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,.09)", filter: "blur(4px)" }} />
            <div style={{ position: "absolute", left: -60, bottom: -90, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontFamily: "Bebas Neue, cursive", fontSize: 34, letterSpacing: 4 }}>AKOLAB</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.62)", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>Explore sans limites</div>
            </div>

            <div style={{ position: "relative", zIndex: 1, maxWidth: 460 }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 48, fontWeight: 700, lineHeight: 1.08, marginBottom: 22 }}>
                Apprends tout ce qui te <em style={{ fontStyle: "italic" }}>passionne.</em>
              </div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,.76)", lineHeight: 1.8, fontWeight: 300 }}>
                Vidéos, articles, podcasts, forums et désormais parcours d’apprentissage guidés par l’IA pour transformer l’exploration en compréhension réelle.
              </div>
            </div>

            <div style={{ display: "flex", gap: 28, position: "relative", zIndex: 1 }}>
              {[["∞", "Sujets"], ["0", "Connaissance perdue"], ["1", "Hub unique"]].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: "Bebas Neue, cursive", fontSize: 32 }}>{n}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.48)" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48, overflowY: "auto", background: UI.bg }}>
            <div
              style={{
                maxWidth: 520,
                width: "100%",
                background: UI.panel,
                border: `1px solid ${UI.border}`,
                borderRadius: UI.radiusLg,
                boxShadow: UI.shadowMd,
                padding: 36,
              }}
            >
              <div style={{ display: "flex", gap: 8, marginBottom: 36 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: i <= obStep ? `linear-gradient(90deg, ${UI.blue}, ${UI.blueDark})` : UI.border }} />
                ))}
              </div>

              {obStep === 0 && (
                <div style={{ animation: "fadeInUp .35s ease" }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: UI.blue, marginBottom: 12, fontWeight: 700 }}>Étape 1 sur 3</div>
                  <div style={{ fontFamily: "Playfair Display, serif", fontSize: 40, fontWeight: 700, color: UI.text, marginBottom: 10 }}>Ton prénom</div>
                  <div style={{ fontSize: 15, color: UI.textSoft, marginBottom: 34, fontWeight: 300 }}>Pour personnaliser toute ton expérience.</div>
                  <input
                    autoFocus
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && profile.name.trim().length > 1 && setObStep(1)}
                    placeholder="Écris ton prénom..."
                    style={{
                      width: "100%",
                      border: `1px solid ${UI.border}`,
                      borderRadius: 16,
                      padding: "18px 20px",
                      fontSize: 24,
                      fontFamily: "Playfair Display, serif",
                      color: UI.text,
                      background: UI.panelSoft,
                      marginBottom: 28,
                      outline: "none",
                    }}
                  />
                  <button onClick={() => setObStep(1)} disabled={profile.name.trim().length < 2} style={{ ...styles.primaryBtn, width: "100%", opacity: profile.name.trim().length > 1 ? 1 : 0.45 }}>
                    Continuer →
                  </button>
                </div>
              )}

              {obStep === 1 && (
                <div style={{ animation: "fadeInUp .35s ease" }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: UI.blue, marginBottom: 12, fontWeight: 700 }}>Étape 2 sur 3</div>
                  <div style={{ fontFamily: "Playfair Display, serif", fontSize: 40, fontWeight: 700, color: UI.text, marginBottom: 10 }}>Tes passions</div>
                  <div style={{ fontSize: 15, color: UI.textSoft, marginBottom: 26, fontWeight: 300 }}>Sélectionne ou écris n'importe quoi.</div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                    {SUGGESTED_PASSIONS.map((p) => {
                      const active = profile.passions.includes(p);
                      return (
                        <button
                          key={p}
                          onClick={() => {
                            if (active) setProfile((prev) => ({ ...prev, passions: prev.passions.filter((x) => x !== p) }));
                            else setProfile((prev) => ({ ...prev, passions: [...prev.passions, p], levels: { ...prev.levels, [p]: "Débutant" } }));
                          }}
                          style={styles.chip(active)}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                    <input
                      value={newPassionInput}
                      onChange={(e) => setNewPassionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newPassionInput.trim()) {
                          setProfile((p) => ({
                            ...p,
                            passions: [...p.passions, newPassionInput.trim()],
                            levels: { ...p.levels, [newPassionInput.trim()]: "Débutant" },
                          }));
                          setNewPassionInput("");
                        }
                      }}
                      placeholder="Autre chose ? Ex: Histoire de Bretagne..."
                      style={{ flex: 1, border: `1px solid ${UI.border}`, borderRadius: 14, padding: "12px 14px", fontSize: 13, color: UI.text, background: UI.panelSoft, outline: "none" }}
                    />
                    <button
                      onClick={() => {
                        if (newPassionInput.trim()) {
                          setProfile((p) => ({
                            ...p,
                            passions: [...p.passions, newPassionInput.trim()],
                            levels: { ...p.levels, [newPassionInput.trim()]: "Débutant" },
                          }));
                          setNewPassionInput("");
                        }
                      }}
                      style={{ ...styles.primaryBtn, padding: "0 18px" }}
                    >
                      +
                    </button>
                  </div>

                  {profile.passions.length > 0 && (
                    <div style={{ marginBottom: 20, padding: 14, background: UI.blueSoft, border: `1px solid ${UI.blueSoft2}`, borderRadius: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {profile.passions.map((p) => (
                        <span key={p} style={{ fontSize: 12, color: UI.blue, padding: "6px 10px", background: UI.panel, border: `1px solid ${UI.blueSoft2}`, borderRadius: 999, display: "flex", alignItems: "center", gap: 8 }}>
                          {p}
                          <span onClick={() => setProfile((prev) => ({ ...prev, passions: prev.passions.filter((x) => x !== p) }))} style={{ cursor: "pointer", color: UI.textMuted, fontSize: 14 }}>
                            ×
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  <button onClick={() => setObStep(2)} disabled={profile.passions.length === 0} style={{ ...styles.primaryBtn, width: "100%", opacity: profile.passions.length > 0 ? 1 : 0.45 }}>
                    Continuer — {profile.passions.length} passion{profile.passions.length > 1 ? "s" : ""}
                  </button>
                </div>
              )}

              {obStep === 2 && (
                <div style={{ animation: "fadeInUp .35s ease" }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: UI.blue, marginBottom: 12, fontWeight: 700 }}>Étape 3 sur 3</div>
                  <div style={{ fontFamily: "Playfair Display, serif", fontSize: 40, fontWeight: 700, color: UI.text, marginBottom: 10 }}>Ton niveau</div>
                  <div style={{ fontSize: 15, color: UI.textSoft, marginBottom: 26, fontWeight: 300 }}>Pour adapter les ressources et les parcours d’apprentissage.</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                    {profile.passions.map((p) => (
                      <div key={p} style={{ border: `1px solid ${UI.border}`, borderRadius: 18, padding: "14px 16px", background: UI.panelSoft }}>
                        <div style={{ fontSize: 14, color: UI.text, fontWeight: 600, marginBottom: 10 }}>{p}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {LEVELS.map((l) => (
                            <button
                              key={l}
                              onClick={() => setProfile((prev) => ({ ...prev, levels: { ...prev.levels, [p]: l } }))}
                              style={{
                                flex: 1,
                                padding: "9px",
                                borderRadius: 12,
                                background: profile.levels[p] === l ? UI.blue : UI.panel,
                                border: `1px solid ${profile.levels[p] === l ? UI.blue : UI.border}`,
                                fontSize: 12,
                                color: profile.levels[p] === l ? "white" : UI.textSoft,
                                fontWeight: profile.levels[p] === l ? 700 : 500,
                                cursor: "pointer",
                              }}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={startDashboard} style={{ ...styles.primaryBtn, width: "100%", padding: "16px" }}>
                    Lancer AkoLab →
                  </button>
                </div>
              )}

              {obStep > 0 && (
                <button onClick={() => setObStep((o) => o - 1)} style={{ background: "none", border: "none", color: UI.textMuted, fontSize: 12, marginTop: 18, width: "100%", textAlign: "center", letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer" }}>
                  ← Retour
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes xpPop { 0% { opacity:0; transform:translate(-50%, 20px) scale(.95); } 20% { opacity:1; transform:translate(-50%, 0) scale(1); } 80% { opacity:1; transform:translate(-50%, -18px) scale(1.02); } 100% { opacity:0; transform:translate(-50%, -36px) scale(.98); } }
        @keyframes bounce { 0%,80%,100% { transform: scale(.6); opacity: .4; } 40% { transform: scale(1); opacity: 1; } }
        .ak-card { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
        .ak-card:hover { transform: translateY(-4px); box-shadow: 0 18px 38px rgba(15,23,42,.1); border-color: #dbe5f3; }
        * { box-sizing: border-box; }
      `}</style>
      <div style={{ display: "grid", gridTemplateColumns: "230px 1fr 320px", height: "100vh", overflow: "hidden", background: UI.bg, color: UI.text, fontFamily: "DM Sans, sans-serif" }}>
        {showXpPop && (
          <div style={{ position: "fixed", top: "45%", left: "50%", zIndex: 1000, fontFamily: "Bebas Neue, cursive", fontSize: 48, color: UI.blue, letterSpacing: 3, animation: "xpPop 1.4s ease forwards", pointerEvents: "none", textShadow: "0 10px 30px rgba(37,99,235,.25)" }}>
            {showXpPop}
          </div>
        )}

        <aside style={{ background: UI.panel, borderRight: `1px solid ${UI.border}`, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
          <div style={{ padding: "24px 20px 18px", borderBottom: `1px solid ${UI.border}` }}>
            <div style={{ fontFamily: "Bebas Neue, cursive", fontSize: 24, letterSpacing: 3, color: UI.text }}>AKO<span style={{ color: UI.blue }}>LAB</span></div>
            <div style={{ fontSize: 11, color: UI.textMuted, marginTop: 2 }}>Explore sans limites</div>
          </div>

          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${UI.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${UI.blue}, #60a5fa)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "white", boxShadow: "0 12px 24px rgba(37,99,235,.18)" }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{profile.name}</div>
                <div style={{ fontSize: 11, color: UI.textMuted }}>Niveau {level} · {xp} XP</div>
              </div>
            </div>
            <div style={{ height: 8, background: UI.neutralBg, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", background: `linear-gradient(90deg, ${UI.blue}, ${UI.blueDark})`, width: `${xp % 100}%`, borderRadius: 999, transition: "width .6s" }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: UI.textMuted, marginBottom: 10, padding: "0 8px", fontWeight: 700 }}>Mes passions</div>
            {profile.passions.map((p) => {
              const active = activePassion === p;
              return (
                <div
                  key={p}
                  onClick={() => switchPassion(p)}
                  style={{
                    padding: "12px 12px",
                    marginBottom: 6,
                    background: active ? UI.blueSoft : "transparent",
                    border: `1px solid ${active ? UI.blueSoft2 : "transparent"}`,
                    borderRadius: 16,
                    cursor: "pointer",
                    transition: "all .15s",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? UI.blue : UI.text }}>{p}</div>
                  <div style={{ fontSize: 10, color: UI.textMuted, marginTop: 2 }}>{profile.levels[p]}</div>
                </div>
              );
            })}

            {addingPassion ? (
              <div style={{ padding: "8px 10px", marginTop: 8, background: UI.panelSoft, border: `1px solid ${UI.border}`, borderRadius: 16 }}>
                <input
                  autoFocus
                  value={newPassionInput}
                  onChange={(e) => setNewPassionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addPassion(newPassionInput);
                    if (e.key === "Escape") setAddingPassion(false);
                  }}
                  placeholder="Nouvelle passion..."
                  style={{ width: "100%", border: `1px solid ${UI.blueSoft2}`, borderRadius: 12, padding: "10px 12px", fontSize: 12, color: UI.text, background: UI.panel, outline: "none", marginBottom: 8 }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => addPassion(newPassionInput)} style={{ ...styles.primaryBtn, flex: 1, padding: "9px" }}>Ajouter</button>
                  <button onClick={() => setAddingPassion(false)} style={{ ...styles.secondaryBtn, padding: "9px 12px" }}>Annuler</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingPassion(true)} style={{ width: "100%", padding: "11px 12px", background: UI.panel, border: `1px dashed ${UI.borderStrong}`, borderRadius: 14, fontSize: 12, color: UI.textMuted, textAlign: "left", marginTop: 8, cursor: "pointer" }}>
                + Nouvelle passion
              </button>
            )}
          </div>

          <div style={{ padding: "12px 16px", borderTop: `1px solid ${UI.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: UI.textMuted, fontWeight: 700 }}>Badges</div>
              <div style={{ fontSize: 10, color: UI.textMuted }}>{earnedBadges.length}/{BADGES.length}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {BADGES.map((b) => {
                const earned = xp >= b.xp;
                return (
                  <div key={b.id} title={`${b.label} — ${b.desc}`} style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: earned ? UI.blueSoft : UI.neutralBg, border: `1px solid ${earned ? UI.blueSoft2 : UI.border}`, borderRadius: 12, fontSize: 14, color: earned ? UI.blue : UI.textMuted }}>
                    {b.icon}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <main style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: UI.bg }}>
          <div style={{ padding: "18px 24px 0", borderBottom: `1px solid ${UI.border}`, background: "rgba(255,255,255,.88)", backdropFilter: "blur(10px)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
              <div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 700 }}>{activePassion}</div>
                <div style={{ fontSize: 12, color: UI.textMuted, marginTop: 3 }}>
                  {activeTab === "learn" ? `Parcours adaptés · ${levelForPassion}` : `${profile.levels[activePassion]} · ${displayFeed.length} ressource${displayFeed.length > 1 ? "s" : ""}`}
                </div>
              </div>

              {activeTab === "feed" && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setFeeds((prev) => ({ ...prev, feed: [] })); setPage(1); }} style={styles.select}>
                    <option value="">Toutes les dates</option>
                    <option value="day">24h</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                    <option value="year">Cette année</option>
                  </select>
                  <select value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setFeeds((prev) => ({ ...prev, feed: [] })); setPage(1); }} style={styles.select}>
                    <option value="viewCount">Plus vus</option>
                    <option value="date">Plus récents</option>
                    <option value="relevance">Pertinents</option>
                  </select>
                  <button onClick={() => { setFeeds((prev) => ({ ...prev, feed: [] })); setPage(1); loadTab(activePassion, "feed", false, 1); }} style={{ ...styles.secondaryBtn, color: UI.blue }}>
                    ↻ Rafraîchir
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, paddingBottom: 14, overflowX: "auto" }}>
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => switchTab(tab.id)} style={{ ...styles.chip(active), display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: activeTab === "learn" ? 0 : "22px 24px 26px" }}>
            {activeTab === "learn" ? (
              learningFocus ? renderLearningPath() : renderLearningSelection()
            ) : isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50%", gap: 14 }}>
                <div style={{ width: 36, height: 36, border: `3px solid ${UI.blueSoft2}`, borderTop: `3px solid ${UI.blue}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                <div style={{ fontSize: 13, color: UI.textMuted }}>Chargement des {activeTabMeta?.label.toLowerCase()}...</div>
              </div>
            ) : displayFeed.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "52%", gap: 14, background: UI.panel, border: `1px solid ${UI.border}`, borderRadius: 28, boxShadow: UI.shadowSm }}>
                <div style={{ fontSize: 40, opacity: 0.25 }}>{activeTabMeta?.icon}</div>
                <div style={{ fontSize: 14, color: UI.textMuted }}>Aucun contenu chargé</div>
                <button onClick={() => loadTab(activePassion, activeTab, false, 1)} style={styles.primaryBtn}>Charger</button>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  {displayFeed.map((item: Resource, i: number) => {
                    const type = item.type || (item.videoId ? "VIDEO" : "ARTICLE");
                    const typeColor = type === "VIDEO" ? UI.blue : type === "ARTICLE" ? UI.success : type === "PODCAST" ? UI.orange : UI.textSoft;
                    const typeBg = type === "VIDEO" ? UI.blueSoft : type === "ARTICLE" ? UI.successBg : type === "PODCAST" ? UI.orangeBg : UI.neutralBg;
                    const itemId = item.id || `${activeTab}-${i}`;

                    return (
                      <div key={itemId} className="ak-card" style={{ background: UI.panel, border: `1px solid ${UI.border}`, borderRadius: 22, overflow: "hidden", animation: `fadeInUp .32s ease ${i * 0.035}s both`, boxShadow: UI.shadowSm }}>
                        {item.videoId ? (
                          playingVideo === itemId ? (
                            <iframe src={`https://www.youtube.com/embed/${item.videoId}?autoplay=1&controls=1&rel=0`} style={{ width: "100%", height: 210, border: "none" }} allow="autoplay; fullscreen" allowFullScreen />
                          ) : (
                            <div style={{ position: "relative", height: 190, cursor: "pointer", overflow: "hidden", background: "#0f172a" }} onClick={() => { setPlayingVideo(itemId); consumeResource(itemId, item.xp || 15); }}>
                              {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.94 }} />}
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,23,42,.38), rgba(15,23,42,.12))" }} />
                              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <div style={{ width: 58, height: 58, borderRadius: "50%", background: "rgba(255,255,255,.16)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.24)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 20 }}>
                                  ▶
                                </div>
                              </div>
                            </div>
                          )
                        ) : item.thumbnail ? (
                          <img src={item.thumbnail} alt="" style={{ width: "100%", height: 160, objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div style={{ height: 92, background: UI.neutralBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ fontSize: 30, opacity: 0.35 }}>{type === "ARTICLE" ? "📄" : type === "PODCAST" ? "🎧" : "💬"}</div>
                          </div>
                        )}

                        <div style={{ padding: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <span style={{ fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 8px", fontWeight: 800, color: typeColor, background: typeBg, borderRadius: 999 }}>{type}</span>
                            <span style={{ fontSize: 11, color: UI.textMuted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.source}</span>
                            {consumed.has(itemId) && <span style={{ fontSize: 10, color: UI.blue, fontWeight: 700 }}>+{item.xp} XP</span>}
                          </div>

                          <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, color: UI.text, lineHeight: 1.25, marginBottom: 8 }}>{item.title}</div>

                          {item.excerpt && <div style={{ fontSize: 12, color: UI.textSoft, lineHeight: 1.7, marginBottom: 12 }}>{item.excerpt.slice(0, 125)}{item.excerpt.length > 125 ? "..." : ""}</div>}

                          <div style={{ display: "flex", gap: 8 }}>
                            {item.videoId ? (
                              <button onClick={() => { setPlayingVideo(itemId); consumeResource(itemId, item.xp || 15); }} style={{ ...styles.primaryBtn, flex: 1, padding: "9px 12px", fontSize: 11 }}>
                                Regarder
                              </button>
                            ) : item.url && item.url !== "#" ? (
                              <button onClick={() => { window.open(item.url, "_blank"); consumeResource(itemId, item.xp || 10); }} style={{ ...styles.primaryBtn, flex: 1, padding: "9px 12px", fontSize: 11 }}>
                                Lire →
                              </button>
                            ) : null}

                            <button onClick={() => toggleSave(item)} style={{ ...styles.secondaryBtn, padding: "9px 12px", color: isSaved(item) ? UI.blue : UI.textSoft, background: isSaved(item) ? UI.blueSoft : UI.panel }}>
                              {isSaved(item) ? "✓" : "Sauvegarder"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeTab === "feed" && displayFeed.length > 0 && (
                  <div style={{ textAlign: "center", padding: "28px 0 4px" }}>
                    <button
                      onClick={() => {
                        const next = page + 1;
                        setPage(next);
                        loadTab(activePassion, "feed", true, next);
                      }}
                      disabled={loadingMore}
                      style={{ ...styles.secondaryBtn, minWidth: 170, color: UI.blue, boxShadow: UI.shadowSm }}
                    >
                      {loadingMore ? "Chargement..." : "Charger plus"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <aside style={{ background: UI.panel, borderLeft: `1px solid ${UI.border}`, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
          <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${UI.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>Assistant AkoLab</div>
            <div style={{ fontSize: 11, color: UI.textMuted }}>{profile.name} · {activePassion}</div>
          </div>

          <div style={{ display: "flex", borderBottom: `1px solid ${UI.border}`, padding: 8, gap: 8 }}>
            {[
              { id: "chat", label: "Chat" },
              { id: "saved", label: `Sauvegardés (${saved.length})` },
            ].map((t) => {
              const active = rpTab === t.id;
              return (
                <button key={t.id} onClick={() => setRpTab(t.id)} style={{ ...styles.chip(active), flex: 1, justifyContent: "center" }}>
                  {t.label}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 12, background: UI.panelSoft }}>
            {rpTab === "chat" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {chatMsgs.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: m.role === "ai" ? UI.blue : UI.neutralBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: m.role === "ai" ? "white" : UI.textSoft, flexShrink: 0, fontWeight: 800 }}>
                      {m.role === "ai" ? "AK" : profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ padding: "10px 12px", fontSize: 12, lineHeight: 1.7, maxWidth: "86%", fontWeight: 400, background: m.role === "ai" ? UI.panel : UI.blueSoft, color: UI.text, border: `1px solid ${m.role === "ai" ? UI.border : UI.blueSoft2}`, borderRadius: 16, whiteSpace: "pre-wrap", boxShadow: UI.shadowSm }}>
                      {m.content}
                    </div>
                  </div>
                ))}

                {chatLoad && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: UI.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "white", fontWeight: 800 }}>AK</div>
                    <div style={{ padding: "10px 12px", background: UI.panel, border: `1px solid ${UI.border}`, borderRadius: 16, display: "flex", gap: 4, alignItems: "center", boxShadow: UI.shadowSm }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: UI.blue, opacity: 0.4, animation: `bounce 1.1s ease infinite ${i * 0.18}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
            )}

            {rpTab === "saved" && (
              saved.length === 0 ? (
                <div style={{ textAlign: "center", padding: "54px 16px", color: UI.textMuted, fontSize: 13 }}>Rien de sauvegardé encore.</div>
              ) : (
                saved.map((item, i) => (
                  <div key={i} style={{ padding: 10, background: UI.panel, border: `1px solid ${UI.border}`, borderRadius: 16, marginBottom: 7, cursor: "pointer", display: "flex", gap: 8, boxShadow: UI.shadowSm }} onClick={() => item.url && item.url !== "#" && window.open(item.url, "_blank")}>
                    {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: 56, height: 40, objectFit: "cover", flexShrink: 0, borderRadius: 10 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, color: UI.textMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "1px" }}>{item.type}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: UI.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleSave(item); }} style={{ background: "none", border: "none", color: UI.textMuted, fontSize: 15, cursor: "pointer" }}>×</button>
                  </div>
                ))
              )
            )}
          </div>

          {rpTab === "chat" && (
            <div style={{ padding: 12, borderTop: `1px solid ${UI.border}`, background: UI.panel }}>
              <div style={{ fontSize: 10, color: UI.textMuted, marginBottom: 8 }}>Ex: “montre les dernières 911 GT3”, “articles sur la 964”, “explique-moi la 993”</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={chatIn}
                  onChange={(e) => setChatIn(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
                  placeholder={`Demander sur ${activePassion}...`}
                  style={{ flex: 1, border: `1px solid ${UI.border}`, borderRadius: 14, padding: "10px 12px", fontSize: 12, color: UI.text, background: UI.panelSoft, outline: "none" }}
                />
                <button onClick={() => sendChat()} disabled={chatLoad || !chatIn.trim()} style={{ width: 40, height: 40, borderRadius: 14, background: `linear-gradient(135deg, ${UI.blue}, ${UI.blueDark})`, border: "none", color: "white", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 10px 24px rgba(37,99,235,.2)" }}>
                  →
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
