import { hasApiKey, optimizeText } from "../../src/server/ai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Yalnızca POST destekleniyor." });
  }

  if (!hasApiKey()) {
    return res.status(500).json({
      error:
        "GEMINI_API_KEY tanımlı değil. Vercel proje ayarlarından Environment Variable olarak ekleyin.",
    });
  }

  try {
    const { text, type, context } = req.body ?? {};
    const result = await optimizeText(text, type, context);
    return res.status(200).json({ result });
  } catch (error: any) {
    console.error("[AI] optimize-text error:", error);
    return res.status(500).json({ error: error.message || "Yapay zeka optimizasyon hatası." });
  }
}
