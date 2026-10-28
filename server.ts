import express from "express";
import path from "path";
import dotenv from "dotenv";
import { hasApiKey, importCvFromText, optimizeText } from "./src/server/ai.ts";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "15mb" }));

/** Sağlık kontrolü */
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    ai: hasApiKey() ? "configured" : "missing-key",
  });
});

/**
 * Ham CV metnini yapılandırılmış JSON'a dönüştürür.
 */
app.post("/api/ai/import-cv", async (req, res) => {
  try {
    if (!hasApiKey()) {
      return res.status(500).json({
        error:
          "GEMINI_API_KEY tanımlı değil. .env dosyasına anahtarınızı ekleyip sunucuyu yeniden başlatın.",
      });
    }
    const structured = await importCvFromText(req.body?.rawText);
    return res.json(structured);
  } catch (error: any) {
    console.error("[AI] import-cv error:", error);
    return res.status(500).json({ error: error.message || "Yapay zeka ayrıştırma hatası." });
  }
});

/**
 * Kariyer özeti / deneyim açıklaması optimizasyonu.
 */
app.post("/api/ai/optimize-text", async (req, res) => {
  try {
    if (!hasApiKey()) {
      return res.status(500).json({
        error:
          "GEMINI_API_KEY tanımlı değil. .env dosyasına anahtarınızı ekleyip sunucuyu yeniden başlatın.",
      });
    }
    const { text, type, context } = req.body ?? {};
    const result = await optimizeText(text, type, context);
    return res.json({ result });
  } catch (error: any) {
    console.error("[AI] optimize-text error:", error);
    return res.status(500).json({ error: error.message || "Yapay zeka optimizasyon hatası." });
  }
});

// Vite middleware (dev) / statik dosyalar (prod)
const isProd = process.env.NODE_ENV === "production" || process.argv.includes("--prod");

async function start() {
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CV-Master] Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
    console.log(`[CV-Master] Gemini anahtarı: ${hasApiKey() ? "tanımlı ✓" : "YOK ✗"}`);
  });
}

start().catch((err) => {
  console.error("Sunucu başlatılamadı:", err);
});
