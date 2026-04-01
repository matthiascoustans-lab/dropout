import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function searchYouTube(query: string) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=3&key=${process.env.YOUTUBE_API_KEY}`
  );
  const data = await res.json();
  return data.items?.map((item: any) => ({
    title: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    thumbnail: item.snippet.thumbnails.high.url,
    source: item.snippet.channelTitle,
  })) || [];
}

async function searchArticles(query: string) {
  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API_KEY}&cx=017576662512468239146:omuauf10dve&num=3`
  );
  const data = await res.json();
  return data.items?.map((item: any) => ({
    title: item.title,
    url: item.link,
    source: item.displayLink,
    thumbnail: item.pagemap?.cse_image?.[0]?.src || null,
  })) || [];
}

export async function POST(request: Request) {
  const { passion, type } = await request.json();

  if (type === "feed") {
    const [videos, articles] = await Promise.all([
      searchYouTube(`${passion} guide documentary`),
      searchArticles(`${passion} best resources guide`),
    ]);

    const prompt = `Tu es le moteur de DropOut. Génère 6 ressources sur "${passion}" en utilisant ces vraies ressources trouvées :

VIDEOS YOUTUBE REELLES : ${JSON.stringify(videos)}
ARTICLES REELS : ${JSON.stringify(articles)}

Complète avec d'autres ressources (podcasts, forums) si besoin.
Réponds UNIQUEMENT en JSON valide :
{"resources": [{"type": "VIDEO|ARTICLE|PODCAST|FORUM", "source": "nom", "title": "titre court accrocheur", "italic": "sous-titre", "excerpt": "2 phrases max", "duration": "X min", "url": "URL REELLE ou # si pas disponible", "thumbnail": "URL image ou null", "bg": "linear-gradient(135deg,#0a0005,#1a0008,#080808)"}]}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(clean));
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Tu es l'explorateur de DropOut. L'utilisateur dit : "${passion}". Ouvre-lui un univers — connexions inattendues, ressources concrètes. 150 mots max, en français, enthousiaste et précis.` }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ response: text });
}
