import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function searchYouTube(query: string) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=3&key=${process.env.YOUTUBE_API_KEY}`
    );
    const data = await res.json();
    return data.items?.map((item: any) => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.high.url,
      source: item.snippet.channelTitle,
      type: "VIDEO",
    })) || [];
  } catch { return []; }
}

export async function POST(request: Request) {
  const { passion, type } = await request.json();

  if (type === "feed") {
    const videos = await searchYouTube(`${passion} documentary guide`);

    const prompt = `Tu es le moteur de DropOut. Génère 6 ressources sur "${passion}".

Utilise ces vraies vidéos YouTube : ${JSON.stringify(videos)}

Pour les autres ressources (ARTICLE, PODCAST, FORUM), invente des titres réalistes mais mets url="#".

Réponds UNIQUEMENT en JSON valide sans markdown :
{"resources":[{"type":"VIDEO|ARTICLE|PODCAST|FORUM","source":"nom de la source","title":"titre court","italic":"sous-titre accrocheur","excerpt":"description 2 phrases","duration":"X min","url":"URL REELLE pour les videos, # pour le reste","thumbnail":"URL thumbnail pour les videos, null pour le reste","bg":"linear-gradient(135deg,#0a0005,#1a0008,#080808)"}]}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    try {
      return NextResponse.json(JSON.parse(clean));
    } catch {
      return NextResponse.json({ resources: videos });
    }
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Tu es l'explorateur de DropOut. L'utilisateur dit : "${passion}". Ouvre-lui un univers — connexions inattendues, ressources concrètes. 150 mots max, en français.` }],
  });

  return NextResponse.json({ response: message.content[0].type === "text" ? message.content[0].text : "" });
}
