import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function searchYouTube(query: string, max = 6, options: { order?: "viewCount"|"date"|"relevance"; publishedAfter?: string; } = {}) {
  try {
    const params = new URLSearchParams({
      part: "snippet", q: query, type: "video", maxResults: String(max),
      key: process.env.YOUTUBE_API_KEY || "", videoDuration: "medium",
      order: options.order || "viewCount", relevanceLanguage: "fr",
    });
    if (options.publishedAfter) params.set("publishedAfter", options.publishedAfter);
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item: any) => ({
      type: "VIDEO", source: item.snippet.channelTitle, title: item.snippet.title,
      excerpt: item.snippet.description?.slice(0, 150) || "", duration: "YouTube",
      videoId: item.id.videoId, url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.high?.url, publishedAt: item.snippet.publishedAt, xp: 15,
    }));
  } catch (e) { console.error("YouTube error:", e); return []; }
}

async function searchArticles(query: string, max = 4) {
  try {
    const key = process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY || "";
    const cx = process.env.GOOGLE_CSE_ID || "";
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${key}&cx=${cx}&num=${max}`);
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item: any) => ({
      type: "ARTICLE", source: item.displayLink, title: item.title,
      excerpt: item.snippet || "", duration: "Article", url: item.link,
      thumbnail: item.pagemap?.cse_image?.[0]?.src || null, xp: 10,
    }));
  } catch (e) { console.error("Article error:", e); return []; }
}

function buildQueries(passion: string, profile: any): string[] {
  if (!profile || passion !== "Porsche 911") {
    return [`${passion} documentary`, `${passion} guide complet`, `${passion} meilleur`];
  }
  const queries: string[] = [];
  const { interests = [], style = [], context = "", watchStyle = [] } = profile;
  if (interests.includes("Mecanique")) { queries.push("Porsche 911 engine mechanics explained"); queries.push("Porsche 911 flat six restoration"); }
  if (interests.includes("Histoire")) { queries.push("Porsche 911 histoire origines documentary"); queries.push("Porsche 911 evolution 1963"); }
  if (interests.includes("Esthetique")) { queries.push("Porsche 911 design iconique"); queries.push("Porsche 911 most beautiful models"); }
  if (interests.includes("Course")) { queries.push("Porsche 911 GT3 circuit track day"); queries.push("Porsche 911 racing Le Mans"); }
  if (interests.includes("Acheter")) { queries.push("Porsche 911 guide achat buyer guide"); queries.push("Porsche 911 best model to buy"); }
  if (style.includes("Vintage")) { queries.push("Porsche 964 993 air cooled review"); queries.push("Porsche 911 classic restoration"); }
  if (style.includes("Moderne")) { queries.push("Porsche 911 992 997 review test drive"); queries.push("Porsche 911 GT3 Turbo S modern"); }
  if (context === "Futur acheteur") queries.push("Porsche 911 buying guide what to check");
  if (context === "Proprietaire") queries.push("Porsche 911 maintenance tips owner");
  if (watchStyle.includes("Reviews")) queries.push("Porsche 911 review road test 2024");
  if (watchStyle.includes("Circuit")) queries.push("Porsche 911 track day nurburgring");
  if (watchStyle.includes("Documentaires")) queries.push("Porsche 911 documentary full film");
  if (queries.length === 0) { queries.push("Porsche 911 best videos"); queries.push("Porsche 911 documentary"); }
  return queries.sort(() => Math.random() - 0.5).slice(0, 3);
}

function getPublishedAfter(dateFilter: string): string | undefined {
  const now = Date.now();
  const map: Record<string, number> = { day: 86400000, week: 604800000, month: 2592000000, year: 31536000000 };
  return map[dateFilter] ? new Date(now - map[dateFilter]).toISOString() : undefined;
}

function cleanText(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/#{1,6}\s/g, "").replace(/`(.*?)`/g, "$1").trim();
}

export async function POST(request: Request) {
  const body = await request.json();
  const { passion, type, page = 1, userProfile, subcategory, dateFilter, order, chatQuery, topic, focus, level } = body;

  if (type === "feed") {
    const queries = subcategory ? [`${passion} ${subcategory}`] : buildQueries(passion, userProfile);
    const allVideos = await Promise.all(queries.map(q => searchYouTube(q, 3, { order: order || "viewCount", publishedAfter: dateFilter ? getPublishedAfter(dateFilter) : undefined })));
    const seen = new Set<string>();
    const videos = allVideos.flat().filter((v: any) => { if (seen.has(v.videoId)) return false; seen.add(v.videoId); return true; });
    return NextResponse.json({ resources: videos.map((r: any, i: number) => ({ ...r, id: `${Date.now()}-${i}` })) });
  }

  if (type === "articles") {
    const articles = await searchArticles(`${passion} guide review`);
    return NextResponse.json({ resources: articles.map((r: any, i: number) => ({ ...r, id: `article-${Date.now()}-${i}` })) });
  }

  if (type === "podcasts") {
    const videos = await searchYouTube(`${passion} podcast`, 8, { order: "relevance" });
    return NextResponse.json({ resources: videos.map((r: any, i: number) => ({ ...r, id: `podcast-${Date.now()}-${i}` })) });
  }

  if (type === "forums") {
    const articles = await searchArticles(`${passion} forum discussion reddit`, 6);
    return NextResponse.json({ resources: articles.map((r: any, i: number) => ({ ...r, id: `forum-${Date.now()}-${i}` })) });
  }

  if (type === "news") {
    const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const [videos, articles] = await Promise.all([
      searchYouTube(`${passion} news actualite`, 4, { order: "date", publishedAfter: since48h }),
      searchArticles(`${passion} actualite recent 2025`, 4),
    ]);
    return NextResponse.json({ resources: [...articles, ...videos].map((r: any, i: number) => ({ ...r, id: `news-${Date.now()}-${i}` })) });
  }

  if (type === "search") {
    const videos = await searchYouTube(chatQuery || passion, 6, { order: "relevance" });
    return NextResponse.json({ resources: videos.map((r: any, i: number) => ({ ...r, id: `search-${Date.now()}-${i}` })) });
  }

  if (type === "learning_path") {
    const t = topic || passion || "Porsche 911";
    const f = focus || "";
    const l = level || "Passionne";

    const promptContent = "Cree un parcours apprentissage sur " + t + " focus " + f + " niveau " + l + ". JSON uniquement sans markdown: {\"topic\":\"" + t + "\",\"focus\":\"" + f + "\",\"level\":\"" + l + "\",\"intro\":\"introduction 2 phrases\",\"steps\":[{\"title\":\"titre etape\",\"explanation\":\"explication 3-4 phrases\",\"searchQuery\":\"YouTube query in English\",\"summary\":\"resume 1 phrase\",\"quiz\":[{\"question\":\"question?\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"answer\":\"A\"}]}]}. Genere 3 etapes minimum.";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: "Tu es un expert pedagogique. Reponds UNIQUEMENT en JSON valide, sans markdown.",
      messages: [{ role: "user", content: promptContent }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(clean);
      const stepsWithResources = await Promise.all(
        (parsed.steps || []).map(async (step: any) => {
          const videos = await searchYouTube(step.searchQuery || (t + " " + step.title), 2, { order: "relevance" });
          return { ...step, resources: videos.map((v: any, i: number) => ({ ...v, id: "learn-" + Date.now() + "-" + i })) };
        })
      );
      return NextResponse.json({ ...parsed, steps: stepsWithResources });
    } catch {
      return NextResponse.json({ topic: t, focus: f, level: l, intro: "Parcours en cours.", steps: [] });
    }
  }

  if (type === "chat") {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: "Tu es assistant AkoLab. Si demande videos, reponds SEARCH: suivi requete YouTube anglais. Sinon reponds en francais sans markdown.",
      messages: [{ role: "user", content: passion }],
    });
    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = cleanText(raw);
    if (cleaned.startsWith("SEARCH:")) {
      const query = cleaned.replace("SEARCH:", "").trim();
      const videos = await searchYouTube(query, 6, { order: "relevance" });
      return NextResponse.json({ response: "Voila ce que j ai trouve sur " + query + " :", searchResults: videos.map((r: any, i: number) => ({ ...r, id: "chat-" + Date.now() + "-" + i })) });
    }
    return NextResponse.json({ response: cleaned });
  }

  return NextResponse.json({ resources: [] });
}
