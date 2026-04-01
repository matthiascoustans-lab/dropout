import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function searchYouTube(query: string, maxResults = 6) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${process.env.YOUTUBE_API_KEY}&relevanceLanguage=fr`
    );
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      type: "VIDEO",
      title: item.snippet.title,
      italic: item.snippet.channelTitle,
      excerpt: item.snippet.description?.slice(0, 120) || "",
      source: item.snippet.channelTitle,
      duration: "YouTube",
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      bg: "linear-gradient(135deg,#000510,#001030,#080808)",
      xp: 15,
    }));
  } catch { return []; }
}

export async function POST(request: Request) {
  const { passion, type, page = 1 } = await request.json();

  if (type === "feed") {
    const videos = await searchYouTube(`${passion} ${page > 1 ? "advanced guide tips" : "documentary guide"}`);

    if (videos.length > 0) {
      const aiRes = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: `Génère 3 ressources textuelles (ARTICLE, PODCAST, FORUM) sur "${passion}". Titres accrocheurs, sources réalistes. JSON uniquement : {"resources":[{"type":"ARTICLE|PODCAST|FORUM","source":"nom","title":"titre","italic":"sous-titre","excerpt":"2 phrases","duration":"X min","url":"#","thumbnail":null,"bg":"linear-gradient(135deg,#050a00,#0a1500,#080808)","xp":10}]}` }],
      });
      const text = aiRes.content[0].type === "text" ? aiRes.content[0].text : "";
      try {
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        const mixed = [...videos, ...parsed.resources].sort(() => Math.random() - 0.5);
        return NextResponse.json({ resources: mixed.map((r, i) => ({ ...r, id: Date.now() + i })) });
      } catch {
        return NextResponse.json({ resources: videos });
      }
    }

    return NextResponse.json({ resources: [] });
  }

  if (type === "videos") {
    const videos = await searchYouTube(`${passion} short clip highlights`, 12);
    return NextResponse.json({ resources: videos });
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Tu es l'explorateur d'AkoLab. L'utilisateur dit : "${passion}". Ouvre-lui un univers — connexions inattendues, ressources concrètes. 150 mots max, en français.` }],
  });

  return NextResponse.json({ response: message.content[0].type === "text" ? message.content[0].text : "" });
}
