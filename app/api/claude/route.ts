import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function searchYouTube(query: string, max = 5) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${max}&key=${process.env.YOUTUBE_API_KEY}&videoDuration=medium&order=relevance`
    );
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item: any) => ({
      type: "VIDEO",
      source: item.snippet.channelTitle,
      title: item.snippet.title,
      italic: item.snippet.channelTitle,
      excerpt: item.snippet.description?.slice(0, 150) || "",
      duration: "YouTube",
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.high?.url,
      bg: "linear-gradient(135deg,#000510,#001030,#080808)",
      xp: 15,
    }));
  } catch (e) {
    console.error("YouTube error:", e);
    return [];
  }
}

async function searchArticles(query: string, max = 4) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}&num=${max}`
    );
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item: any) => ({
      type: "ARTICLE",
      source: item.displayLink,
      title: item.title,
      italic: item.displayLink,
      excerpt: item.snippet || "",
      duration: "Article",
      url: item.link,
      thumbnail: item.pagemap?.cse_image?.[0]?.src || null,
      bg: "linear-gradient(135deg,#050a00,#0a1500,#080808)",
      xp: 10,
    }));
  } catch (e) {
    console.error("Search error:", e);
    return [];
  }
}

async function generateTextResources(passion: string) {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: `Génère 4 ressources textuelles réalistes sur "${passion}" : 2 ARTICLE et 2 PODCAST.
Pour les articles, utilise de vraies URLs de sites connus (roadandtrack.com, caranddriver.com, motortrend.com, wikipedia.org, etc).
Pour les podcasts, utilise de vraies URLs Spotify ou Apple Podcasts si possible.
JSON uniquement sans markdown :
{"resources":[{"type":"ARTICLE|PODCAST","source":"nom du site","title":"titre réaliste","italic":"sous-titre","excerpt":"description 2 phrases","duration":"X min","url":"https://...","thumbnail":null,"xp":10}]}` }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean).resources || [];
  } catch (e) {
    return [];
  }
}

export async function POST(request: Request) {
  const { passion, type, page = 1 } = await request.json();

  if (type === "feed") {
    const query = page === 1 ? `${passion} documentary` : `${passion} guide tutorial`;
    
    const [videos, googleArticles, claudeResources] = await Promise.all([
      searchYouTube(query, 5),
      searchArticles(`${passion} guide`, 3),
      generateTextResources(passion),
    ]);

    const articles = googleArticles.length > 0 ? googleArticles : claudeResources;
    const resources = [...videos, ...articles]
      .map((r, i) => ({ ...r, id: `${Date.now()}-${i}` }));

    return NextResponse.json({ resources });
  }

  if (type === "videos") {
    const videos = await searchYouTube(`${passion} documentary full`, 10);
    return NextResponse.json({ resources: videos });
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Tu es l'assistant d'AkoLab. L'utilisateur dit : "${passion}". Réponds en français, 150 mots max, sois précis et enthousiaste.` }],
  });

  return NextResponse.json({
    response: message.content[0].type === "text" ? message.content[0].text : ""
  });
}
