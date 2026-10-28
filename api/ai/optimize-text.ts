import { GoogleGenAI } from "@google/genai";

// Not: Vercel yalnızca `api/` altını paketlediği için paylaşılan modül import edilemiyor;
// bu dosya kendi kendine yeterlidir. Geliştirme sunucusu için ortak mantık
// `src/server/ai.ts` içinde durur — iki tarafı birlikte güncelleyin.

const AI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tanımlı değil.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "cv-master" } },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Yalnızca POST destekleniyor." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error:
        "GEMINI_API_KEY tanımlı değil. Vercel proje ayarlarından Environment Variable olarak ekleyin.",
    });
  }

  try {
    const { text, type, context } = req.body ?? {};

    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: "Optimize edilecek metin boş olamaz." });
    }

    let systemInstruction: string;
    let prompt: string;

    if (type === "summary") {
      systemInstruction =
        "Sen üst düzey bir İK yazarı ve kariyer danışmanısın. " +
        "Görevin, kullanıcının girdiği ham veya zayıf başlık/özet yazısını profesyonel, " +
        "etkileyici, ATS-dostu ve akıcı bir ön yazı / kariyer profili özeti haline getirmektir. " +
        "Dili Türkçe olmalıdır. " +
        "Maksimum 3-4 cümle olmalı ve iddialı ama samimi bir iş tonu taşımalıdır. " +
        "Sadece optimize edilmiş metni döndür, giriş/açıklama metni veya tırnak işaretleri ekleme.";

      prompt = `Kullanıcı profili / kariyer özeti verisi:\n${text}\n\nEğer ek unvan/deneyim bağlamı varsa göz önünde bulundur:\n${context || ""}`;
    } else {
      systemInstruction =
        "Sen profesyonel bir CV editörüsün. " +
        "Görevin, kullanıcının iş tecrübesine yazdığı ham görevleri ve açıklamaları, " +
        "aktif eylem kelimeleri (yardımcı oldu, yönetti, koordine etti, optimize etti, tasarladı) içeren, " +
        "iş başvurusundaki İK uzmanlarının ilgisini çekecek, " +
        "sonuç odaklı ve net maddeler / paragraflar haline getirmektir. " +
        "Dili Türkçe olmalıdır. " +
        "Gereksiz dolgu kelimelerini at ve profesyonel değer teklifini yansıt. " +
        "Sadece optimize edilmiş açıklamayı döndür, açıklama veya tırnak ekleme.";

      prompt = `İş deneyimi açıklaması:\n${text}\n\nPozisyon / Unvan:\n${context || "Belirtilmedi"}`;
    }

    const response = await getAI().models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: { systemInstruction },
    });

    const result = response.text?.trim() || text;
    return res.status(200).json({ result });
  } catch (error: any) {
    console.error("[AI] optimize-text error:", error);
    return res.status(500).json({ error: error.message || "Yapay zeka optimizasyon hatası." });
  }
}
