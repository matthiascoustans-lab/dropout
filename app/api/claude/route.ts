import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { passion, type, page = 1 } = await request.json();

  if (type === "feed" || type === "videos") {
    const prompt = `Génère 8 ressources sur "${passion}" (page ${page}).
Varie les types : VIDEO, ARTICLE, PODCAST, FORUM.
Pour les vidéos, utilise de vraies URLs YouTube qui existent probablement.
JSON uniquement, sans markdown :
{"resources":[{"type":"VIDEO|ARTICLE|PODCAST|FORUM","source":"nom source réelle","title":"titre accrocheur","italic":"sous-titre","excerpt":"2 phrases max","duration":"X min","url":"https://youtube.com/... ou #","thumbnail":null,"bg":"linear-gradient(135deg,#000510,#001030,#080808)","xp":10}]}`;

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
      return NextResponse.json({ resources: [] });
    }
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Tu es l'explorateur d'AkoLab. L'utilisateur dit : "${passion}". Ouvre-lui un univers en français, 150 mots max.` }],
  });

  return NextResponse.json({ response: message.content[0].type === "text" ? message.content[0].text : "" });
}
