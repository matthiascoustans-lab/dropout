import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function searchYouTube(query: string, max = 4) {
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${max}&key=${process.env.YOUTUBE_API_KEY}`);
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item: any) => ({
      type: "VIDEO",
      source: item.snippet.channelTitle,
      title: item.snippet.title,
      italic: item.snippet.channelTitle,
      excerpt: item.snippet.description?.slice(0, 120) || "",
      duration: "YouTube",
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.high?.url,
      bg: "linear-gradient(135deg,#000510,#001030,#080808)",
      xp: 15,
    }));
  } catch { return []; }
}

async function searchArticles(query: string, max = 4) {
  try {
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}&num=${max}&searchType=`);
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item: any) => ({
      type: "ARTICLE",
      source: item.displayLink,
      title: item.title,
      italic: item.snippet?.slice(0, 40) || "",
      excerpt: item.snippet || "",
      duration: "Article",
      url: item.link,
      thumbnail: item.pagemap?.cse_image?.[0]?.src || null,
      bg: "linear-gradient(135deg,#050a00,#0a1500,#080808)",
      xp: 10,
    }));
  } catch { return []; }
}

export async function POST(request: Request) {
  const { passion, type, page = 1 } = await request.json();

  if (type === "feed") {
    const [videos, articles] = await Promise.all([
      searchYouTube(`${passion} ${page > 1 ? "review guide tips" : "documentary"}`),
      searchArticles(`${passion} guide review`),
    ]);

    const combined = [...videos, ...articles].sort(() => Math.random() - 0.5);

    if (combined.length > 0) {
      return NextResponse.json({ resources: combined.map((r, i) => ({ ...r, id: Date.now() + i })) });
    }

    // Fallback Claude si APIs vides
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: `Génère 8 ressources sur "${passion}". JSON uniquement : {"resources":[{"type":"VIDEO|ARTICLE|PODCAST|FORUM","source":"source réelle","title":"titre","italic":"sous-titre","excerpt":"2 phrases","duration":"X min","url":"#","thumbnail":null,"bg":"linear-gradient(135deg,#000510,#001030,#080808)","xp":10}]}` }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    try { return NextResponse.json(JSON.parse(clean)); }
    catch { return NextResponse.json({ resources: [] }); }
  }

  if (type === "videos") {
    const videos = await searchYouTube(`${passion} shorts highlights`, 12);
    return NextResponse.json({ resources: videos });
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Tu es l'explorateur d'AkoLab. L'utilisateur dit : "${passion}". Ouvre-lui un univers en français, 150 mots max.` }],
  });

  return NextResponse.json({ response: message.content[0].type === "text" ? message.content[0].text : "" });
}
