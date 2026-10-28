import { GoogleGenAI } from "@google/genai";

export const AI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

let cachedClient: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY tanımlı değil. .env dosyasına anahtarınızı ekleyin (https://aistudio.google.com/apikey).",
    );
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "cv-master" } },
    });
  }
  return cachedClient;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Ham, yapılandırılmamış CV metnini Türkçe CV şemasına dönüştürür.
 */
export async function importCvFromText(rawText: string): Promise<unknown> {
  if (!rawText || !rawText.trim()) {
    throw new Error("İçerik boş olamaz.");
  }

  const systemInstruction =
    "Sen profesyonel, deneyimli bir insan kaynakları (İK) asistanı ve veri ayrıştırma uzmanısın. " +
    "Görevin, sana verilen ham, yapılandırılmamış CV metnini analiz etmek ve bilgileri " +
    "tam olarak belirtilen Türkçe JSON formatına dönüştürmektir. " +
    "Bulamadığın veya metinde eksik olan alanları boş bırak ya da boş dizi/nesne olarak yansıt. " +
    "Tarihleri 'Mayıs 2023 - Halen', '2019 - 2023' veya 'Devam Ediyor' gibi CV kültürüne uygun formatlarda temizle. " +
    "Becerileri (yetenekleri) temiz, tek kelimelik veya kısa kelime öbekleri halinde ayrıştır. " +
    "İletişim bilgilerini (varsa telefon, e-posta, şehir veya tam adres) bulunca ilgili nesnelere yerleştir. " +
    "Çıktıyı SADECE geçerli bir JSON formatında döndür.";

  const prompt = `Lütfen aşağıdaki özgeçmiş (CV) metnini analiz et ve belirtilen JSON yapısına dönüştür:

[METİN BAŞLANGICI]
${rawText}
[METİN BİTİŞİ]

JSON Yapısı:
{
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
  "beceriler": [
    "[Yetenek 1]",
    "[Yetenek 2]"
  ],
  "ilgi_alanlari_ve_hobiler": [
    "[İlgi alanı veya hobi 1]"
  ]
}`;

  const response = await getAI().models.generateContent({
    model: AI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
    },
  });

  const jsonText = response.text || "{}";
  return JSON.parse(jsonText);
}

/**
 * Kariyer özeti veya iş deneyimi açıklamasını profesyonelleştirir.
 */
export async function optimizeText(
  text: string,
  type: "summary" | "experience" | string,
  context?: string,
): Promise<string> {
  if (!text || !text.trim()) {
    throw new Error("Optimize edilecek metin boş olamaz.");
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

  return response.text?.trim() || text;
}
