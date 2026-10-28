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

// Gemini yoğun saatlerde 503/429 dönebiliyor — kısa beklemeyle 3 kez dene.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRetryable(error: any): boolean {
  const status = error?.status ?? error?.code;
  const msg = String(error?.message || "").toLowerCase();
  return (
    status === 503 ||
    status === 429 ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("rate limit")
  );
}

async function generateWithRetry(params: any, attempts = 3): Promise<any> {
  let lastError: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await getAI().models.generateContent(params);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || i === attempts - 1) break;
      await sleep(1200 * (i + 1));
    }
  }
  throw lastError;
}

const SYSTEM_INSTRUCTION =
  "Sen profesyonel, deneyimli bir insan kaynakları (İK) asistanı ve veri ayrıştırma uzmanısın. " +
  "Görevin, sana verilen ham, yapılandırılmamış CV metnini analiz etmek ve bilgileri " +
  "tam olarak belirtilen Türkçe JSON formatına dönüştürmektir. " +
  "Bulamadığın veya metinde eksik olan alanları boş bırak ya da boş dizi/nesne olarak yansıt. " +
  "Tarihleri 'Mayıs 2023 - Halen', '2019 - 2023' veya 'Devam Ediyor' gibi CV kültürüne uygun formatlarda temizle. " +
  "Becerileri (yetenekleri) temiz, tek kelimelik veya kısa kelime öbekleri halinde ayrıştır. " +
  "İletişim bilgilerini (varsa telefon, e-posta, şehir veya tam adres) bulunca ilgili nesnelere yerleştir. " +
  "Çıktıyı SADECE geçerli bir JSON formatında döndür.";

const JSON_SHAPE = `{
  "kisisel_bilgiler": {
    "ad_soyad": "[Adayın Adı Soyadı]",
    "dogum_tarihi": "[Örn: 15.06.1997 veya boş]",
    "dogum_yeri": "[Örn: İstanbul veya boş]",
    "medeni_durum": "[Örn: Bekar, Evli veya boş]",
    "ehliyet": "[Örn: B Sınıfı veya boş]"
  },
  "iletisim": {
    "telefon": "[Örn: +90 532 000 0000 veya boş]",
    "e_posta": "[Örn: ornek@eposta.com veya boş]",
    "adres": "[Örn: Kadıköy, İstanbul veya boş]"
  },
  "profesyonel_ozet": "[Hakkında / Kariyer Özeti paragrafı]",
  "is_deneyimleri": [
    {
      "kurum_firma": "[Firma veya Kurum Adı]",
      "pozisyon": "[Pozisyon unvanı]",
      "tarih": "[Örn: 'Mayıs 2022 - Halen' veya '2019 - 2021']",
      "aciklama": "[Yapılan işlerin ve başarıların detaylı açıklaması]"
    }
  ],
  "egitim_bilgileri": [
    {
      "universite": "[Okul veya Üniversite Adı]",
      "bolum": "[Kazandığı bölüm]",
      "tarih": "[Örn: '2018 - 2022' veya 'Devam Ediyor']"
    }
  ],
  "beceriler": ["[Yetenek 1]", "[Yetenek 2]"],
  "ilgi_alanlari_ve_hobiler": ["[İlgi alanı veya hobi 1]"]
}`;

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
    const rawText = req.body?.rawText;
    if (!rawText || !String(rawText).trim()) {
      return res.status(400).json({ error: "İçerik boş olamaz." });
    }

    const prompt =
      "Lütfen aşağıdaki özgeçmiş (CV) metnini analiz et ve belirtilen JSON yapısına dönüştür:\n\n" +
      `[METİN BAŞLANGICI]\n${rawText}\n[METİN BİTİŞİ]\n\n` +
      `JSON Yapısı:\n${JSON_SHAPE}`;

    const response = await generateWithRetry({
      model: AI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "{}";
    return res.status(200).json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error("[AI] import-cv error:", error);
    if (isRetryable(error)) {
      return res
        .status(503)
        .json({ error: "Yapay zeka şu anda yoğun. Lütfen birkaç saniye sonra tekrar deneyin." });
    }
    return res.status(500).json({ error: error.message || "Yapay zeka ayrıştırma hatası." });
  }
}
