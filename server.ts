import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { 
  getOrCreateUser, 
  getUserCVs, 
  saveOrUpdateCV, 
  deleteUserCV, 
  logSyncAction, 
  getSyncLogs 
} from "./src/db/repository.ts";
import { GoogleDriveClient } from "./src/lib/drive.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Dynamic relational DB and Drive sync APIs
app.get("/api/db-diagnostics", async (req, res) => {
  try {
    const { createPool } = await import("./src/db/index.ts");
    const pool = createPool();
    const client = await pool.connect();
    const qRes = await client.query("SELECT 1 as val");
    client.release();
    res.json({
      success: true,
      connected: true,
      result: qRes.rows[0],
      envKeys: Object.keys(process.env).filter(k => k.startsWith("SQL_") || k.includes("DATABASE") || k.includes("PORT")),
      envValues: {
        SQL_HOST: process.env.SQL_HOST,
        SQL_USER: process.env.SQL_USER,
        SQL_ADMIN_USER: process.env.SQL_ADMIN_USER,
        SQL_DB_NAME: process.env.SQL_DB_NAME,
        SQL_PORT: process.env.SQL_PORT,
      }
    });
  } catch (error: any) {
    res.json({
      success: false,
      connected: false,
      error: error.message,
      stack: error.stack,
      envKeys: Object.keys(process.env).filter(k => k.startsWith("SQL_") || k.includes("DATABASE") || k.includes("PORT")),
      envValues: {
        SQL_HOST: process.env.SQL_HOST,
        SQL_USER: process.env.SQL_USER,
        SQL_ADMIN_USER: process.env.SQL_ADMIN_USER,
        SQL_DB_NAME: process.env.SQL_DB_NAME,
        SQL_PORT: process.env.SQL_PORT,
      }
    });
  }
});

app.post("/api/user/sync-profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const email = req.user?.email || "unknown@auth.com";
    const user = await getOrCreateUser(uid, email);
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Profil senkronizasyon hatası." });
  }
});

app.get("/api/user/db-cvs", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const cvList = await getUserCVs(uid);
    res.json({ success: true, cvs: cvList });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Özgeçmişler yüklenemedi." });
  }
});

app.post("/api/user/save-cv", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const { localId, title, data, driveFileId, driveSyncedAt } = req.body;
    if (!localId || !title || !data) {
      return res.status(400).json({ error: "Eksik parametreler (localId, title, data)." });
    }
    const cv = await saveOrUpdateCV(uid, {
      localId,
      title,
      data: typeof data === "object" ? JSON.stringify(data) : data,
      driveFileId,
      driveSyncedAt: driveSyncedAt ? new Date(driveSyncedAt) : undefined,
    });
    res.json({ success: true, cv });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Özgeçmiş veritabanına kaydedilemedi." });
  }
});

app.delete("/api/user/delete-cv/:localId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const { localId } = req.params;
    await deleteUserCV(uid, localId);
    res.json({ success: true, message: "Özgeçmiş veritabanından başarıyla silindi." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Özgeçmiş veritabanından silinemedi." });
  }
});

app.post("/api/drive/sync", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const { localId, title, data, googleAccessToken } = req.body;
    if (!localId || !title || !data || !googleAccessToken) {
      return res.status(400).json({ error: "Eksik parametre (localId, title, data, googleAccessToken)." });
    }

    const driveClient = new GoogleDriveClient(googleAccessToken);
    
    // Step 1: Initialize Backup App Folder
    const folderId = await driveClient.getOrCreateFolder("CV Master Backups");
    
    // Step 2: Search for possible existing file inside our folder
    const files = await driveClient.listBackupFiles(folderId);
    const existingFile = files.find(f => f.name === `${title}.json`);
    const existingFileId = existingFile?.id;

    // Step 3: Serialize and upload data json block representation
    const jsonPayload = typeof data === "object" ? JSON.stringify(data) : data;
    const uploadedFileId = await driveClient.uploadCvJson(title, jsonPayload, folderId, existingFileId);

    // Step 4: Track database state with synchronized properties
    await saveOrUpdateCV(uid, {
      localId,
      title,
      data: jsonPayload,
      driveFileId: uploadedFileId,
      driveSyncedAt: new Date()
    });

    // Step 5: Log operation successfully
    await logSyncAction(uid, {
      action: "google_drive_sync",
      status: "success",
      message: `"${title}" özgeçmişi başarıyla Google Drive'a yedeklendi/senkronize edildi.`
    });

    res.json({ success: true, driveFileId: uploadedFileId, message: "Google Drive senkronizasyonu tamamlandı!" });
  } catch (error: any) {
    console.error("Google Drive sync API error:", error);
    const uid = req.user?.uid!;
    const { title } = req.body;
    if (uid) {
      await logSyncAction(uid, {
        action: "google_drive_sync",
        status: "error",
        message: `"${title || "Bilinmeyen"}" özgeçmişi Google Drive'a yedeklenirken hata: ${error.message}`
      });
    }
    res.status(500).json({ error: error.message || "Google Drive yedekleme başarısız." });
  }
});

app.post("/api/drive/list", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const { googleAccessToken } = req.body;
    if (!googleAccessToken) {
      return res.status(400).json({ error: "Google Access Token gereklidir." });
    }

    const driveClient = new GoogleDriveClient(googleAccessToken);
    const folderId = await driveClient.getOrCreateFolder("CV Master Backups");
    const files = await driveClient.listBackupFiles(folderId);

    res.json({ success: true, files });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Google Drive yedekleri listelenemedi." });
  }
});

app.post("/api/drive/import", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const { fileId, googleAccessToken } = req.body;
    if (!fileId || !googleAccessToken) {
      return res.status(400).json({ error: "Eksik parametre (fileId, googleAccessToken)." });
    }

    const driveClient = new GoogleDriveClient(googleAccessToken);
    const content = await driveClient.downloadFileContent(fileId);

    // Log import operation
    let parsedTitle = "Yedekten İthal";
    try {
      const parsed = JSON.parse(content);
      parsedTitle = parsed.title || parsedTitle;
    } catch (_) {}

    await logSyncAction(uid, {
      action: "drive_import",
      status: "success",
      message: `"${parsedTitle}" özgeçmişi Google Drive yedeklerinden ithal edildi.`
    });

    res.json({ success: true, content });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Google Drive'dan ithal etme başarısız." });
  }
});

app.get("/api/user/sync-logs", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const logs = await getSyncLogs(uid);
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "İşlem geçmişi yüklenemedi." });
  }
});


// Initialize Google GenAI SDK (server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

/**
 * API route to parsing unstructured text to a clean structured CV JSON matching the Turkish schema.
 */
app.post("/api/ai/import-cv", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: "İçerik boş olamaz." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Yapay zeka anahtarı (GEMINI_API_KEY) sunucuda tanımlı değil. Lütfen Settings > Secrets panelinden kontrol edin.",
      });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "{}";
    const structuredData = JSON.parse(jsonText);
    return res.json(structuredData);
  } catch (error: any) {
    console.error("AI CV Import Error:", error);
    return res.status(500).json({ error: error.message || "Yapay zeka ayrıştırma hatası." });
  }
});

/**
 * API route to optimize summary or bullet points
 */
app.post("/api/ai/optimize-text", async (req, res) => {
  try {
    const { text, type, context } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Optimize edilecek metin boş olamaz." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Yapay zeka anahtarı (GEMINI_API_KEY) tanımlı değil. Settings > Secrets panelinden yapılandırın.",
      });
    }

    let systemInstruction = "";
    let prompt = "";

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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    return res.json({ result: response.text?.trim() || text });
  } catch (error: any) {
    console.error("AI Text Optimization Error:", error);
    return res.status(500).json({ error: error.message || "Yapay zeka optimizasyon hatası." });
  }
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CV-Master Server] Sunucu http://localhost:${PORT} üzerinde başlatıldı.`);
  });
}

start().catch(err => {
  console.error("Server failed to start:", err);
});
