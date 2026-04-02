import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function searchYouTube(query: string, max = 6, options: {
  order?: "viewCount"|"date"|"relevance",
  publishedAfter?: string,
} = {}) {
  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: String(max),
      key: process.env.YOUTUBE_API_KEY || "",
      videoDuration: "medium",
      order: options.order || "viewCount",
      relevanceLanguage: "fr",
    });
    if (options.publishedAfter) params.set("publishedAfter", options.publishedAfter);
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item: any) => ({
      type: "VIDEO",
      source: item.snippet.channelTitle,
      title: item.snippet.title,
      excerpt: item.snippet.description?.slice(0, 150) || "",
      duration: "YouTube",
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.high?.url,
      publishedAt: item.snippet.publishedAt,
      xp: 15,
    }));
  } catch (e) { console.error("YouTube error:", e); return []; }
}

function buildQueries(passion: string, profile: any): string[] {
  if (!profile || passion !== "Porsche 911") {
    return [
      `${passion} documentary`,
      `${passion} guide complet`,
      `${passion} meilleur`,
    ];
  }

  const queries: string[] = [];
  const { interests = [], style = [], context = "", watchStyle = [] } = profile;

  if (interests.includes("Mécanique")) {
    queries.push("Porsche 911 engine mechanics explained");
    queries.push("Porsche 911 flat six restoration");
  }
  if (interests.includes("Histoire")) {
    queries.push("Porsche 911 histoire origines documentary");
    queries.push("Porsche 911 evolution 1963 aujourd'hui");
  }
  if (interests.includes("Esthétique")) {
    queries.push("Porsche 911 design iconique");
    queries.push("Porsche 911 most beautiful models");
  }
  if (interests.includes("Course")) {
    queries.push("Porsche 911 GT3 circuit track day");
    queries.push("Porsche 911 racing Le Mans motorsport");
  }
  if (interests.includes("Acheter")) {
    queries.push("Porsche 911 guide achat buyer guide");
    queries.push("Porsche 911 best model to buy investment");
  }

  if (style.includes("Vintage")) {
    queries.push("Porsche 964 993 air cooled review");
    queries.push("Porsche 911 classic air cooled restoration");
  }
  if (style.includes("Moderne")) {
    queries.push("Porsche 911 992 997 review test drive");
    queries.push("Porsche 911 GT3 Turbo S modern review");
  }

  if (context === "Futur acheteur") {
    queries.push("Porsche 911 buying guide what to check");
    queries.push("Porsche 911 which model buy budget");
  }
  if (context === "Propriétaire") {
    queries.push("Porsche 911 maintenance tips owner");
    queries.push("Porsche 911 modifications upgrades owner");
  }

  if (watchStyle.includes("Tutoriels mécanique")) {
    queries.push("Porsche 911 DIY repair tutorial");
  }
  if (watchStyle.includes("Reviews")) {
    queries.push("Porsche 911 review road test 2024");
  }
  if (watchStyle.includes("Circuit")) {
    queries.push("Porsche 911 track day nurburgring");
  }
  if (watchStyle.includes("Documentaires")) {
    queries.push("Porsche 911 documentary full film");
  }

  // Toujours au moins 3 requêtes
  if (queries.length === 0) {
    queries.push("Porsche 911 best videos");
    queries.push("Porsche 911 documentary");
    queries.push("Porsche 911 guide");
  }

  // Shuffle pour varier à chaque rechargement
  return queries.sort(() => Math.random() - 0.5).slice(0, 3);
}

function getPublishedAfter(dateFilter: string): string | undefined {
  const now = Date.now();
  const map: Record<string, number> = {
    "day": 24 * 60 * 60 * 1000,
    "week": 7 * 24 * 60 * 60 * 1000,
    "month": 30 * 24 * 60 * 60 * 1000,
    "year": 365 * 24 * 60 * 60 * 1000,
  };
  return map[dateFilter] ? new Date(now - map[dateFilter]).toISOString() : undefined;
}

function cleanText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/`(.*?)`/g, "$1")
    .trim();
}

export async function POST(request: Request) {
  const { passion, type, page = 1, userProfile, subcategory, dateFilter, order, chatQuery } = await request.json();

  if (type === "feed") {
    const queries = subcategory
      ? [`${passion} ${subcategory}`]
      : buildQueries(passion, userProfile);

    const allVideos = await Promise.all(
      queries.map(q => searchYouTube(q, 3, {
        order: order || "viewCount",
        publishedAfter: dateFilter ? getPublishedAfter(dateFilter) : undefined,
      }))
    );

    // Déduplique par videoId
    const seen = new Set<string>();
    const videos = allVideos.flat().filter(v => {
      if (seen.has(v.videoId)) return false;
      seen.add(v.videoId);
      return true;
    });

    return NextResponse.json({
      resources: videos.map((r, i) => ({ ...r, id: `${Date.now()}-${i}` })),
    });
  }

  if (type === "search") {
    // Recherche directe depuis le chatbot
    const videos = await searchYouTube(chatQuery || passion, 6, { order: "relevance" });
    return NextResponse.json({
      resources: videos.map((r, i) => ({ ...r, id: `search-${Date.now()}-${i}` })),
    });
  }

  if (type === "news") {
    const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const videos = await searchYouTube(`${passion} news actualité`, 8, {
      order: "date",
      publishedAfter: since48h,
    });
    return NextResponse.json({
      resources: videos.map((r, i) => ({ ...r, id: `news-${Date.now()}-${i}` })),
    });
  }

  if (type === "chat") {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `Tu es l'assistant AkoLab, expert en ${passion}. 
Quand l'utilisateur demande des vidéos sur un sujet précis, réponds avec le préfixe SEARCH: suivi de la requête YouTube optimale en anglais.
Exemple: si l'utilisateur dit "montre-moi des 964 RS", réponds "SEARCH:Porsche 964 RS restoration review"
Sinon réponds normalement en français, sans markdown, de façon conversationnelle.`,
      messages: [{ role: "user", content: passion }],
    });
    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = cleanText(raw);

    if (cleaned.startsWith("SEARCH:")) {
      const query = cleaned.replace("SEARCH:", "").trim();
      const videos = await searchYouTube(query, 6, { order: "relevance" });
      return NextResponse.json({
        response: `Voilà ce que j'ai trouvé sur "${query}" :`,
        searchResults: videos.map((r, i) => ({ ...r, id: `chat-${Date.now()}-${i}` })),
      });
    }

    return NextResponse.json({ response: cleaned });
  }

  return NextResponse.json({ resources: [] });
}
