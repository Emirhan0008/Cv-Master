import { hasApiKey, importCvFromText } from "../../src/server/ai";

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
    const structured = await importCvFromText(req.body?.rawText);
    return res.status(200).json(structured);
  } catch (error: any) {
    console.error("[AI] import-cv error:", error);
    return res.status(500).json({ error: error.message || "Yapay zeka ayrıştırma hatası." });
  }
}
