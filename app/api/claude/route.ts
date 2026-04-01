import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const { passion, type } = await request.json();

  const prompt = type === "feed"
    ? `Tu es le moteur de DropOut, une plateforme qui centralise les meilleures ressources sur les passions. 
       Génère 6 ressources réelles et concrètes sur "${passion}".
       Réponds UNIQUEMENT en JSON valide, sans markdown :
       {"resources": [{"type": "VIDEO|ARTICLE|PODCAST|FORUM", "source": "nom de la source", "title": "titre accrocheur", "italic": "sous-titre en italique", "excerpt": "description de 2 phrases max", "duration": "X min", "url": "#", "bg": "linear-gradient(135deg,#0a0005,#1a0008,#080808)"}]}`
    : `Tu es l'explorateur de DropOut. L'utilisateur te dit : "${passion}".
       Ouvre-lui un univers de découvertes — connexions inattendues, ressources concrètes, rabbit holes.
       Réponds en français, 150 mots max, sois enthousiaste et précis.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  
  if (type === "feed") {
    const clean = text.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(clean));
  }
  
  return NextResponse.json({ response: text });
}
