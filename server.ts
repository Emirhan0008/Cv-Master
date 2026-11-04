import express from "express";
import path from "path";
import dotenv from "dotenv";
import { hasApiKey, importCvFromText, optimizeText } from "./src/server/ai.ts";
import { checkAuth, putCV, readIndex, getLatest, getCV, deleteCV, assertSlug, storeInfo } from "./api/_store.ts";

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

/* ------------------------------------------------------------------ */
/* CV toplama API'si — CLI / MCP / LLM'ler buradan CV yazar ve okur.   */
/* ------------------------------------------------------------------ */

app.get("/api/cv/latest", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const auth = checkAuth(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error, store: storeInfo });
  try {
    const slug = req.query?.slug ? assertSlug(req.query.slug) : null;
    const record = slug ? await getCV(slug) : await getLatest();
    if (!record) return res.status(404).json({ error: "Kayıtlı CV yok.", store: storeInfo });
    return res.json({
      slug: record.slug,
      title: record.title,
      updatedAt: record.updatedAt,
      data: record.data,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || "Okuma başarısız." });
  }
});

app.all("/api/cv", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET, POST, DELETE, OPTIONS");
    return res.status(204).end();
  }

  const auth = checkAuth(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error, store: storeInfo });

  try {
    if (req.method === "GET") {
      const drafts = await readIndex();
      return res.json({ count: drafts.length, drafts, store: storeInfo });
    }

    if (req.method === "POST") {
      const body = req.body ?? {};
      const cv = body.cv ?? body;
      const slug = body.slug ?? body.cvSlug ?? undefined;
      const entry = await putCV(cv, slug);
      return res.json({ ok: true, ...entry, store: storeInfo });
    }

    if (req.method === "DELETE") {
      const slug = req.query?.slug ?? req.body?.slug;
      if (!slug) return res.status(400).json({ error: "slug gerekli." });
      const removed = await deleteCV(String(slug));
      if (!removed) return res.status(404).json({ error: `CV bulunamadı: ${slug}` });
      return res.json({ ok: true, deleted: slug });
    }

    res.setHeader("Allow", "GET, POST, DELETE, OPTIONS");
    return res.status(405).json({ error: "Desteklenmeyen metot." });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || "İşlem başarısız." });
  }
});

/* ------------------------------------------------------------------ */
/* Headless Print Endpoint — Site headless Chromium ile PDF üretir   */
/* ------------------------------------------------------------------ */

app.post("/api/cv/print", async (req, res) => {
  const auth = checkAuth(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error, store: storeInfo });

  try {
    const slug = typeof req.query?.slug === 'string' ? req.query.slug : '';
    if (!slug) return res.status(400).json({ error: "slug gerekli." });

    const record = await getCV(slug);
    if (!record) return res.status(404).json({ error: `CV bulunamadı: ${slug}` });

    const cv = record.data;
    const cvTitle = cv.title || cv.personalInfo?.name || slug;

    // Site headless print için HTML döndür - client tarafında print eder
    const html = generatePrintHTML(cv, cvTitle);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Print HTML üretilemedi.' });
  }
});

// Print için HTML template (client tarafında window.print() çağırır)
function generatePrintHTML(cv: any, title: string): string {
  const fontName = cv.styles?.font === 'inter' ? 'Inter' :
    cv.styles?.font === 'spaceGrotesk' ? 'Space Grotesk' :
    cv.styles?.font === 'playfair' ? 'Playfair Display' : 'JetBrains Mono';
  
  const primary = cv.styles?.primaryColor || '#2b5c8f';
  const secondary = cv.styles?.secondaryColor || '#334155';
  const accent = cv.styles?.accentColor || '#10b981';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,420;0,600;0,700;1,400&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "${fontName}", sans-serif; background: #fff; color: #1e293b; }
    .page { width: 210mm; min-height: 297mm; padding: 0; margin: 0 auto; position: relative; }
    .sidebar { width: 34%; float: left; background: #2b5c8f; color: #fff; padding: 12px; min-height: 297mm; box-sizing: border-box; }
    .main { width: 66%; float: right; padding: 12px; min-height: 297mm; box-sizing: border-box; }
    .avatar { width: 80px; height: 80px; border-radius: 50%; background: #e2e8f0; margin: 0 auto 16px; border: 3px solid rgba(255,255,255,0.2); }
    .section { margin-bottom: 16px; }
    .section-title { font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; color: #a5c9f0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px; }
    .main .section-title { color: #1e293b; border-color: #e2e8f0; }
    .label { font-weight: 700; font-size: 7px; color: #a5c9f0; margin-bottom: 2px; text-transform: uppercase; }
    .main .label { color: #475569; }
    .value { font-size: 8px; color: #fff; margin-bottom: 8px; }
    .main .value { color: #334155; font-size: 7px; margin-bottom: 6px; }
    .skill-group { margin-bottom: 10px; }
    .skill-name { font-size: 7px; color: #fff; margin: 3px 0; }
    .main .skill-name { color: #334155; font-size: 6.5px; }
    .skill-bar { height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; overflow: hidden; margin-top: 2px; }
    .main .skill-bar { background: #e2e8f0; }
    .skill-fill { height: 100%; background: #10b981; border-radius: 2px; }
    .entry { margin-bottom: 12px; }
    .role { font-weight: 700; font-size: 8px; color: #fff; }
    .main .role { color: #1e293b; font-size: 7.5px; }
    .meta { font-size: 7px; color: #a5c9f0; margin-bottom: 4px; }
    .main .meta { color: #475569; font-size: 6.5px; }
    .desc { font-size: 7px; color: #fff; line-height: 1.3; }
    .main .desc { color: #334155; font-size: 6.5px; line-height: 1.3; }
    .section-header { font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 8px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .sidebar .section-header { color: #fff; }
    @media print {
      body { margin: 0; padding: 0; }
      .page { width: 210mm; min-height: 297mm; }
      .sidebar, .main { min-height: 297mm; }
      @page { margin: 0; size: A4; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sidebar">
      ${cv.personalInfo?.avatarUrl ? `<img src="${cv.personalInfo.avatarUrl}" class="avatar" alt="Avatar" />` : '<div class="avatar"></div>'}
      <div class="section">
        <div class="section-header">KİŞİSEL / İLETİŞİM</div>
        ${renderContact(cv.personalInfo || {})}
        ${cv.socialLinks?.length ? renderSocial(cv.socialLinks) : ''}
        ${cv.skills?.length ? renderSkills(cv.skills) : ''}
      </div>
    </div>
    <div class="main">
      <h1 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">${cv.personalInfo?.name || ''}</h1>
      <p style="font-size: 10px; color: #475569; margin-bottom: 16px;">${cv.personalInfo?.title || ''}</p>
      ${cv.personalInfo?.summary ? `<div class="section"><div class="section-header">PROFESYONEL ÖZET</div><p style="font-size: 8px; line-height: 1.4; color: #334155;">${cv.personalInfo.summary}</p></div>` : ''}
      ${cv.workExperiences?.length ? renderExperiences(cv.workExperiences) : ''}
      ${cv.educations?.length ? renderEducations(cv.educations) : ''}
      ${cv.projects?.length ? renderProjects(cv.projects) : ''}
      ${cv.customSections?.length ? cv.customSections.map(s => `<div class="section"><div class="section-header">${s.title.toUpperCase()}</div><p style="font-size: 7px; line-height: 1.3; color: #334155;">${s.content.replace(/\n/g, '<br>')}</p></div>`).join('') : ''}
    </div>
  </div>
  <script>
    window.onload = () => { window.print(); };
  </script>
</body>
</html>`;
}

function renderContact(pi: any): string {
  const items = [
    { label: 'TELEFON', value: pi.phone },
    { label: 'E-POSTA', value: pi.email },
    { label: 'ADRES', value: pi.location },
    { label: 'DOĞUM TARİHİ', value: pi.birthDate },
    { label: 'DOĞUM YERİ', value: pi.birthPlace },
    { label: 'MEDENİ DURUM', value: pi.maritalStatus },
    { label: 'EHLIYET', value: pi.driverLicense },
    { label: 'WEB / PORTFOLYO', value: pi.website },
  ].filter(i => i.value);
  return items.map(i => `<div class="label">${i.label}</div><div class="value">${i.value}</div>`).join('');
}

function renderSocial(links: any[]): string {
  if (!links.length) return '';
  let html = '<div class="section"><div class="section-header">SOSYAL MEDYA / BAĞLANTILAR</div>';
  for (const link of links) {
    html += `<div class="label">${link.platform}</div><div class="value">${link.url}</div>`;
  }
  return html + '</div>';
}

function renderSkills(groups: any[]): string {
  let html = '<div class="section"><div class="section-header">YETKİNLİKLER VE BECERİLER</div>';
  for (const group of groups) {
    html += `<div class="skill-group"><div class="section-title">${group.categoryName}</div>`;
    for (const skill of group.skills || []) {
      const name = typeof skill === 'string' ? skill : skill.name;
      const level = typeof skill === 'object' ? (skill.level || 3) : 3;
      const pct = (level / 5) * 100;
      html += `<div class="skill-name">${name}<div class="skill-bar"><div class="skill-fill" style="width:${pct}%"></div></div></div>`;
    }
    html += '</div>';
  }
  return html + '</div>';
}

function renderExperiences(exps: any[]): string {
  let html = '<div class="section"><div class="section-header">İŞ DENEYİMLERİ</div>';
  for (const exp of exps) {
    const dateStr = formatDateRange(exp.startDate, exp.endDate, exp.current);
    html += `<div class="entry"><div class="role">${exp.role || ''}</div><div class="meta">${exp.company || ''}  •  ${dateStr}</div>`;
    if (exp.description) html += `<div class="desc">${exp.description}</div>`;
    html += '</div>';
  }
  return html + '</div>';
}

function renderEducations(edus: any[]): string {
  let html = '<div class="section"><div class="section-header">EĞİTİM BİLGİLERİ</div>';
  for (const edu of edus) {
    const dateStr = formatDateRange(edu.startDate, edu.endDate, edu.current);
    html += `<div class="entry"><div class="role">${edu.degree || ''} - ${edu.field || ''}</div><div class="meta">${edu.school || ''}  •  ${dateStr}</div>`;
    if (edu.description) html += `<div class="desc">${edu.description}</div>`;
    html += '</div>';
  }
  return html + '</div>';
}

function renderProjects(projects: any[]): string {
  let html = '<div class="section"><div class="section-header">PROJELER</div>';
  for (const proj of projects) {
    html += `<div class="entry"><div class="role">${proj.name || ''}  •  ${proj.role || ''}</div>`;
    if (proj.description) html += `<div class="desc">${proj.description}</div>`;
    if (proj.technologies) html += `<div class="meta">Teknolojiler: ${proj.technologies}</div>`;
    html += '</div>';
  }
  return html + '</div>';
}

function formatDateRange(start: string, end: string, current: boolean): string {
  const fmt = (d: string) => {
    if (!d) return '';
    const m = d.match(/^(\d{4})-(\d{2})$/);
    return m ? `${m[2]}.${m[1]}` : d;
  };
  const s = fmt(start);
  const e = current ? 'Devam Ediyor' : fmt(end);
  return s ? (e ? s + ' - ' + e : s) : e;
}

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
