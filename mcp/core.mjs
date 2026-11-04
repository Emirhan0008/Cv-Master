/**
 * Cv-Master çekirdek mantığı — taşıma katmanından bağımsız.
 * Hem CLI (mcp/cli.mjs) hem MCP sunucusu (mcp/server.mjs) bunu kullanır.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_DIR = process.env.CV_MASTER_DIR
  ? path.resolve(process.env.CV_MASTER_DIR)
  : path.resolve(HERE, '..');

export const DATA_DIR = path.join(PROJECT_DIR, 'cv-data');
export const DRAFTS_DIR = path.join(DATA_DIR, 'drafts');
export const EXPORTS_DIR = path.join(DATA_DIR, 'exports');

/* ------------------------------------------------------------------ */
/* Şablonlar                                                           */
/* ------------------------------------------------------------------ */

export const TEMPLATES = [
  { id: 'corporate', name: 'Geleneksel & Kurumsal', tag: 'Kurumsal', bestFor: 'Kamu, banka, resmi kurum', layout: 'single', pageBudget: 3200,
    styles: { primaryColor: '#0f172a', secondaryColor: '#475569', accentColor: '#0284c7', textColor: '#334155', backgroundColor: '#ffffff', font: 'inter', fontSize: 'sm', shadowIntensity: 'none', glassEffect: false } },
  { id: 'modern', name: 'Yenilikçi & Modern', tag: 'Teknoloji & Tasarım', bestFor: 'Teknoloji, ürün, pazarlama', layout: 'cards', pageBudget: 2900,
    styles: { primaryColor: '#064e3b', secondaryColor: '#10b981', accentColor: '#f59e0b', textColor: '#1f2937', backgroundColor: '#f0fdf4', font: 'spaceGrotesk', fontSize: 'sm', shadowIntensity: 'subtle', glassEffect: true } },
  { id: 'modern-geometric', name: 'Geometrik & Altın Şema', tag: 'Mühendislik & Üretim', bestFor: 'Mühendislik, yazılım; güçlü başlık bloku', layout: 'single', pageBudget: 3050,
    styles: { primaryColor: '#1b2a47', secondaryColor: '#f59e0b', accentColor: '#3b82f6', textColor: '#1e293b', backgroundColor: '#ffffff', font: 'spaceGrotesk', fontSize: 'sm', shadowIntensity: 'subtle', glassEffect: false } },
  { id: 'split-sidebar', name: 'İki Sütunlu Yan Panel', tag: 'Akademik & Danışmanlık', bestFor: 'Eğitim, PDR, akademik kadro, sağlık', layout: 'sidebar', pageBudget: 3450,
    styles: { primaryColor: '#2b5c8f', secondaryColor: '#334155', accentColor: '#10b981', textColor: '#334155', backgroundColor: '#f8fafc', font: 'inter', fontSize: 'sm', shadowIntensity: 'none', glassEffect: false } },
  { id: 'depth3d', name: '3D Gölge Katmanlı', tag: 'Kreatif Tasarım', bestFor: 'Kreatif direktör, tasarımcı', layout: 'cards', pageBudget: 2800,
    styles: { primaryColor: '#7c3aed', secondaryColor: '#db2777', accentColor: '#3b82f6', textColor: '#0f172a', backgroundColor: '#faf5ff', font: 'jetbrains', fontSize: 'md', shadowIntensity: 'depth3d', glassEffect: true } },
  { id: 'minimalist-clean', name: 'Minimalist & Arı Düzlük', tag: 'Sade & Her Sektör', bestFor: 'Her sektör; en okunaklı ve ATS dostu', layout: 'single', pageBudget: 3300,
    styles: { primaryColor: '#1e293b', secondaryColor: '#64748b', accentColor: '#0f172a', textColor: '#1e293b', backgroundColor: '#ffffff', font: 'inter', fontSize: 'sm', shadowIntensity: 'none', glassEffect: false } },
  { id: 'editorial-serif', name: 'Editorial Serif Akışı', tag: 'Lüks & Kitap Tarzı', bestFor: 'Yayıncılık, hukuk, lüks marka', layout: 'single', pageBudget: 3100,
    styles: { primaryColor: '#451a03', secondaryColor: '#b45309', accentColor: '#78350f', textColor: '#1a1d20', backgroundColor: '#fdfdfc', font: 'playfair', fontSize: 'sm', shadowIntensity: 'none', glassEffect: false } },
  { id: 'tech-mono', name: 'Tech Monospace', tag: 'Terminal & Konsol', bestFor: 'Yazılım geliştirici, DevOps', layout: 'single', pageBudget: 3250,
    styles: { primaryColor: '#0f172a', secondaryColor: '#0891b2', accentColor: '#10b981', textColor: '#0f172a', backgroundColor: '#fafbfc', font: 'jetbrains', fontSize: 'sm', shadowIntensity: 'none', glassEffect: false } },
  { id: 'crimson-split', name: 'Crimson & Serif Classic', tag: 'Lüks & Finans', bestFor: 'Finans, hukuk, üst düzey yönetim', layout: 'sidebar', pageBudget: 3300,
    styles: { primaryColor: '#A22A38', secondaryColor: '#5C1D24', accentColor: '#1e293b', textColor: '#22252a', backgroundColor: '#ffffff', font: 'playfair', fontSize: 'sm', shadowIntensity: 'none', glassEffect: false } },
  { id: 'teal-timeline', name: 'Teal Timeline', tag: 'Tasarım & Proje', bestFor: 'Proje yöneticisi, tasarım, zaman çizelgesi', layout: 'timeline', pageBudget: 3150,
    styles: { primaryColor: '#005E5D', secondaryColor: '#008B8B', accentColor: '#2b5c8f', textColor: '#1e293b', backgroundColor: '#ffffff', font: 'inter', fontSize: 'sm', shadowIntensity: 'subtle', glassEffect: false } },
  { id: 'dark-gold-arch', name: 'Charcoal & Gold Arch', tag: 'Kreatif & Sanat', bestFor: 'Sanat, kreatif, premium marka', layout: 'sidebar', pageBudget: 3000,
    styles: { primaryColor: '#171717', secondaryColor: '#D4AF37', accentColor: '#FFDF00', textColor: '#1a1a1a', backgroundColor: '#ffffff', font: 'spaceGrotesk', fontSize: 'sm', shadowIntensity: 'subtle', glassEffect: false } },
];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);
export const FONTS = ['inter', 'spaceGrotesk', 'playfair', 'jetbrains'];
export const FONT_SIZES = ['xs', 'sm', 'md', 'lg'];
export const LINE_HEIGHTS = ['tight', 'normal', 'relaxed'];
export const DENSITIES = ['compact', 'comfortable', 'loose'];
export const SHADOWS = ['none', 'subtle', 'depth3d'];
export const SECTION_KEYS = ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'custom'];
export const LINK_PLATFORMS = ['LinkedIn', 'GitHub', 'Web Sitesi', 'Behance', 'Dribbble', 'X', 'Instagram', 'YouTube', 'Medium', 'ORCID', 'Google Scholar'];

export const DEFAULT_ORDER = ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'custom'];

export const LIMITS = {
  summary: 520,
  experienceDesc: 340,
  educationDesc: 140,
  projectDesc: 280,
  customContent: 420,
  maxExperience: 4,
  maxEducation: 4,
  maxProjects: 5,
  maxSkillGroups: 4,
  maxCustomSections: 3,
  maxSocialLinks: 4,
};

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

const nowISO = () => new Date().toISOString();
const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));
const isHex = (v) => typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

export function templateById(id) {
  return TEMPLATES.find((t) => t.id === id);
}

export function assertSlug(slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9][a-z0-9-]{0,60}$/.test(slug)) {
    throw new Error(`Geçersiz slug: ${JSON.stringify(slug)}. Küçük harf, rakam, tire (örn. "rehber-ogretmen-2026").`);
  }
  return slug;
}

function ensureDirs() {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

function draftPath(slug) {
  return path.join(DRAFTS_DIR, `${assertSlug(String(slug).replace(/\.json$/, ''))}.json`);
}

export function readDraft(slug) {
  const p = draftPath(slug);
  if (!fs.existsSync(p)) {
    ensureDirs();
    const avail = fs.readdirSync(DRAFTS_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
    throw new Error(`Taslak bulunamadı: "${slug}". Mevcut: ${avail.length ? avail.join(', ') : '(yok)'}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function writeDraft(slug, data) {
  ensureDirs();
  const p = draftPath(slug);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  return p;
}

function clampLevel(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(5, Math.max(1, Math.round(n))) : 3;
}

function normalizeDate(v) {
  const s = str(v);
  if (!s) return '';
  if (/^(günümüz|gumuz|halen|present|current|devam)$/i.test(s)) return '';
  const m = s.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (m) return `${m[1]}-${String(Number(m[2])).padStart(2, '0')}`;
  if (/^\d{4}$/.test(s)) return `${s}-01`;
  return s;
}

export function blankCV({ slug, title, template = 'minimalist-clean' } = {}) {
  const tpl = templateById(template) || templateById('minimalist-clean');
  return {
    id: slug || uid('cv'),
    title: title || 'Yeni Özgeçmiş',
    updatedAt: nowISO(),
    personalInfo: {
      name: '', title: '', email: '', phone: '', location: '', website: '',
      summary: '', avatarUrl: '', photoVisible: false,
      birthDate: '', birthPlace: '', maritalStatus: '', driverLicense: '',
    },
    workExperiences: [], educations: [], projects: [], skills: [],
    socialLinks: [], customSections: [],
    sectionOrder: [...DEFAULT_ORDER],
    styles: {
      template: tpl.id,
      ...tpl.styles,
      lineHeight: 'normal',
      density: tpl.layout === 'sidebar' ? 'compact' : 'comfortable',
      pageGuide: false,
      qrCodeUrl: '',
      qrCodePosition: 'none',
    },
  };
}

const normalizeExperience = (e = {}) => {
  const current = !!e.current;
  return {
    id: str(e.id) || uid('exp'), company: str(e.company), role: str(e.role), location: str(e.location),
    startDate: normalizeDate(e.startDate), endDate: current ? '' : normalizeDate(e.endDate),
    current, description: str(e.description),
  };
};
const normalizeEducation = (e = {}) => {
  const current = !!e.current;
  return {
    id: str(e.id) || uid('edu'), school: str(e.school), degree: str(e.degree), field: str(e.field),
    location: str(e.location), startDate: normalizeDate(e.startDate),
    endDate: current ? '' : normalizeDate(e.endDate), current, description: str(e.description),
  };
};
const normalizeProject = (p = {}) => ({
  id: str(p.id) || uid('proj'), name: str(p.name), role: str(p.role), url: str(p.url),
  description: str(p.description), technologies: str(p.technologies),
});
const normalizeSkillGroup = (g = {}) => {
  const rawItems = Array.isArray(g.skills) ? g.skills
    : Array.isArray(g.items) ? g.items
      : Array.isArray(g.list) ? g.list
        : Array.isArray(g.skillList) ? g.skillList
          : [];
  return {
    id: str(g.id) || uid('cat'),
    categoryName: str(g.categoryName) || str(g.category) || str(g.name) || str(g.title) || 'Yetkinlikler',
    skills: rawItems
      .map((s) => (typeof s === 'string' ? { name: s, level: 3 } : s))
      .filter((s) => s && (str(s.name) || str(s.skillName)))
      .map((s) => ({ name: str(s.name) || str(s.skillName), level: clampLevel(s.level) })),
  };
};
const normalizeSocial = (s = {}) => ({ id: str(s.id) || uid('soc'), platform: str(s.platform) || 'LinkedIn', url: str(s.url) });
const normalizeCustom = (c = {}) => ({ id: str(c.id) || uid('cust'), title: str(c.title) || 'Ek Bilgi', content: str(c.content) });

export function applyPatch(cv, patch = {}) {
  const notes = [];
  const next = { ...cv };

  if (patch.title !== undefined) next.title = str(patch.title) || next.title;

  if (patch.personalInfo && typeof patch.personalInfo === 'object') {
    const pi = { ...next.personalInfo };
    for (const [k, v] of Object.entries(patch.personalInfo)) {
      pi[k] = k === 'photoVisible' ? !!v : str(v);
    }
    next.personalInfo = pi;
  }

  if (Array.isArray(patch.workExperiences)) next.workExperiences = patch.workExperiences.map(normalizeExperience);
  if (Array.isArray(patch.educations)) next.educations = patch.educations.map(normalizeEducation);
  if (Array.isArray(patch.projects)) next.projects = patch.projects.map(normalizeProject);
  if (Array.isArray(patch.skills)) next.skills = patch.skills.map(normalizeSkillGroup);
  if (Array.isArray(patch.socialLinks)) next.socialLinks = patch.socialLinks.map(normalizeSocial);
  if (Array.isArray(patch.customSections)) next.customSections = patch.customSections.map(normalizeCustom);

  if (Array.isArray(patch.sectionOrder)) {
    const valid = patch.sectionOrder.filter((s) => SECTION_KEYS.includes(s));
    const missing = SECTION_KEYS.filter((s) => !valid.includes(s));
    next.sectionOrder = [...valid, ...missing];
    if (valid.length !== patch.sectionOrder.length) notes.push('sectionOrder: bilinmeyen anahtar atıldı.');
  }

  if (patch.styles && typeof patch.styles === 'object') {
    const s = { ...next.styles, ...patch.styles };
    if (patch.styles.template) {
      const tpl = templateById(patch.styles.template);
      if (!tpl) {
        notes.push(`Bilinmeyen şablon "${patch.styles.template}" yok sayıldı.`);
        s.template = next.styles.template;
      } else {
        Object.assign(s, tpl.styles, { template: tpl.id });
        if (patch.styles.fontSize) s.fontSize = patch.styles.fontSize;
        if (patch.styles.density) s.density = patch.styles.density;
        notes.push(`Şablon "${tpl.id}" → palet varsayılana çekildi.`);
      }
    }
    next.styles = s;
  }

  next.updatedAt = nowISO();
  return { next, notes };
}

/* ------------------------------------------------------------------ */
/* Doğrulama                                                           */
/* ------------------------------------------------------------------ */

export function validateCV(cv) {
  const errors = [];
  const warnings = [];
  const suggestions = [];
  const pi = cv.personalInfo || {};

  if (!str(pi.name)) errors.push('personalInfo.name zorunlu.');
  if (!str(pi.title)) errors.push('personalInfo.title zorunlu (hedef pozisyon).');
  if (!str(pi.email)) warnings.push('personalInfo.email boş.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(pi.email)) errors.push('personalInfo.email geçersiz.');
  if (!str(pi.phone)) warnings.push('personalInfo.phone boş.');
  if (!str(pi.location)) warnings.push('personalInfo.location boş.');
  if (!str(pi.summary)) warnings.push('personalInfo.summary boş.');
  else if (pi.summary.length > LIMITS.summary) warnings.push(`summary ${pi.summary.length} karakter (≤ ${LIMITS.summary} önerilir).`);

  if (!cv.workExperiences.length) warnings.push('workExperiences boş.');
  if (!cv.educations.length) errors.push('educations boş — en az bir mezuniyet gerekli.');
  if (!cv.skills.length) warnings.push('skills boş.');

  const seen = new Set();
  const dup = (arr, label) => {
    for (const it of arr) {
      if (!it.id) errors.push(`${label}: id eksik.`);
      else if (seen.has(it.id)) errors.push(`Tekrarlanan id: ${it.id} (${label}).`);
      else seen.add(it.id);
    }
  };
  dup(cv.workExperiences, 'deneyim'); dup(cv.educations, 'eğitim');
  dup(cv.projects, 'proje'); dup(cv.skills, 'yetkinlik');
  dup(cv.socialLinks, 'bağlantı'); dup(cv.customSections, 'bölüm');

  const dateOk = (v) => !v || /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
  for (const e of cv.workExperiences) {
    if (!str(e.company)) errors.push(`Deneyim "${e.role || e.id}": company boş.`);
    if (!str(e.role)) errors.push(`Deneyim "${e.company || e.id}": role boş.`);
    if (e.startDate && !dateOk(e.startDate)) warnings.push(`"${e.company}" startDate "${e.startDate}" YYYY-MM değil.`);
    if (!e.current && e.endDate && !dateOk(e.endDate)) warnings.push(`"${e.company}" endDate "${e.endDate}" YYYY-MM değil.`);
    if (e.description.length > LIMITS.experienceDesc) warnings.push(`"${e.company}" açıklaması ${e.description.length} karakter (≤ ${LIMITS.experienceDesc}).`);
  }
  for (const e of cv.educations) {
    if (!str(e.school)) errors.push(`Eğitim "${e.id}": school boş.`);
    if (!str(e.field) && !str(e.degree)) warnings.push(`Eğitim "${e.school}": bölüm/derece boş.`);
  }
  for (const p of cv.projects) {
    if (!str(p.name)) errors.push(`Proje "${p.id}": name boş.`);
    if (p.description.length > LIMITS.projectDesc) warnings.push(`"${p.name}" açıklaması ${p.description.length} karakter (≤ ${LIMITS.projectDesc}).`);
  }
  for (const g of cv.skills) {
    if (!g.skills.length) warnings.push(`Yetkinlik grubu "${g.categoryName}" boş.`);
  }

  const tpl = templateById(cv.styles?.template);
  if (!tpl) errors.push(`styles.template bilinmiyor: "${cv.styles?.template}". Geçerli: ${TEMPLATE_IDS.join(', ')}`);
  if (!FONTS.includes(cv.styles?.font)) warnings.push(`styles.font bilinmiyor: "${cv.styles?.font}".`);
  for (const k of ['primaryColor', 'secondaryColor', 'accentColor', 'textColor', 'backgroundColor']) {
    if (!isHex(cv.styles?.[k])) warnings.push(`styles.${k} hex değil ("${cv.styles?.[k]}").`);
  }

  const chars =
    str(pi.name).length + str(pi.title).length + str(pi.location).length + str(pi.summary).length +
    cv.workExperiences.reduce((a, e) => a + e.company.length + e.role.length + e.description.length + 40, 0) +
    cv.educations.reduce((a, e) => a + e.school.length + e.degree.length + e.field.length + e.description.length + 26, 0) +
    cv.projects.reduce((a, p) => a + p.name.length + p.description.length + p.technologies.length + 34, 0) +
    cv.skills.reduce((a, g) => a + g.categoryName.length + g.skills.reduce((b, s) => b + s.name.length + 4, 0) + 18, 0) +
    cv.customSections.reduce((a, c) => a + c.title.length + c.content.length + 22, 0) +
    cv.socialLinks.reduce((a, l) => a + l.platform.length + 12, 0);

  let budget = tpl ? tpl.pageBudget : 3050;
  if (cv.styles?.fontSize === 'lg') budget *= 0.82;
  else if (cv.styles?.fontSize === 'md') budget *= 0.92;
  else if (cv.styles?.fontSize === 'xs') budget *= 1.08;
  if (cv.styles?.density === 'loose') budget *= 0.88;
  else if (cv.styles?.density === 'compact') budget *= 1.06;
  budget = Math.round(budget);

  const ratio = chars / budget;
  if (ratio > 1.02) {
    warnings.push(`Tek sayfa bütçesi aşılıyor: ~${chars}/${budget} karakter (%${Math.round(ratio * 100)}).`);
    const lo = [...cv.workExperiences].sort((a, b) => b.description.length - a.description.length)[0];
    const lp = [...cv.projects].sort((a, b) => b.description.length - a.description.length)[0];
    if (lo && lo.description.length > 220) suggestions.push(`"${lo.company}" açıklamasını ~${lo.description.length - 130} karakter kısaltın.`);
    if (lp && lp.description.length > 180) suggestions.push(`"${lp.name}" açıklamasını ~${lp.description.length - 110} karakter kısaltın.`);
    if (pi.summary.length > 420) suggestions.push(`Özeti ${pi.summary.length}→380 karaktere indirin.`);
    suggestions.push('Alternatif: styles.density="compact", styles.fontSize="sm".');
    if (cv.projects.length > 3) suggestions.push(`Alternatif: ${cv.projects.length} projeden en az değerli 1'ini çıkarın.`);
  }
  if (ratio < 0.55) suggestions.push(`Sayfa %${Math.round(ratio * 100)} dolu — daha uzun açıklama eklenebilir.`);
  if (cv.workExperiences.length > LIMITS.maxExperience) suggestions.push(`${cv.workExperiences.length} deneyim var; tek sayfa için ${LIMITS.maxExperience} önerilir.`);
  if (cv.projects.length > LIMITS.maxProjects) suggestions.push(`${cv.projects.length} proje var; tek sayfa için ${LIMITS.maxProjects} önerilir.`);

  return {
    ok: errors.length === 0, errors, warnings, suggestions,
    stats: {
      chars, budget, fillRatio: Number(ratio.toFixed(2)),
      estimatedPages: Math.max(1, Math.ceil(ratio)),
      experience: cv.workExperiences.length, education: cv.educations.length,
      projects: cv.projects.length, skillGroups: cv.skills.length,
      customSections: cv.customSections.length,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Komut çalıştırıcı — CLI ve MCP aynı yolu kullanır                   */
/* ------------------------------------------------------------------ */

export function schema() {
  return {
    app: 'Cv-Master',
    projectDir: PROJECT_DIR,
    workflow: [
      '1) schema → alanları ve sınırları öğren',
      '2) create → taslak aç (slug + hedef şablon)',
      '3) apply → TÜM içeriği tek çağrıda yaz',
      '4) validate → tek sayfa ve hata kontrolü',
      '5) export → uygulamaya aktarılabilir JSON',
    ],
    sections: {
      personalInfo: 'Ad, ünvan, iletişim, özet, fotoğraf, kişisel bilgiler',
      workExperiences: `İş deneyimi (≤ ${LIMITS.maxExperience})`,
      educations: `Eğitim (≤ ${LIMITS.maxEducation})`,
      projects: `Projeler (≤ ${LIMITS.maxProjects})`,
      skills: 'Yetkinlik grupları; her yetenek 1-5',
      socialLinks: 'LinkedIn, GitHub, kişisel site',
      customSections: 'Sertifika, dil, yayın, gönüllülük',
      sectionOrder: SECTION_KEYS.join(', '),
      styles: 'Şablon, renk, font, yoğunluk',
    },
    fieldSchema: {
      personalInfo: {
        name: 'string (zorunlu)', title: 'string (zorunlu) — hedef pozisyon',
        email: 'string', phone: 'string', location: 'string "Bursa / Gürsu"', website: 'string',
        summary: `string ≤ ${LIMITS.summary}`, avatarUrl: 'string', photoVisible: 'boolean',
        birthDate: 'string "GG.AA.YYYY"', birthPlace: 'string', maritalStatus: 'string', driverLicense: 'string',
      },
      workExperiences: [{ id: 'otomatik', company: 'string', role: 'string', location: 'string', startDate: 'YYYY-MM', endDate: 'YYYY-MM (current=true ise boş)', current: 'boolean', description: `≤ ${LIMITS.experienceDesc}` }],
      educations: [{ school: 'string', degree: '"Lisans" | "Sertifika"', field: 'string', location: 'string', startDate: 'YYYY-MM', endDate: 'YYYY-MM', current: 'boolean', description: `≤ ${LIMITS.educationDesc}` }],
      projects: [{ name: 'string', role: 'string', url: 'string', description: `≤ ${LIMITS.projectDesc}`, technologies: 'string' }],
      skills: [{ categoryName: 'string', skills: [{ name: 'string', level: '1-5' }] }],
      socialLinks: [{ platform: LINK_PLATFORMS.join(' | '), url: 'string' }],
      customSections: [{ title: 'string', content: `satırlar "• " ile ≤ ${LIMITS.customContent}` }],
      styles: {
        template: TEMPLATE_IDS.join(' | '), primaryColor: '#hex', secondaryColor: '#hex',
        accentColor: '#hex', textColor: '#hex', backgroundColor: '#hex',
        font: FONTS.join(' | '), fontSize: FONT_SIZES.join(' | '),
        lineHeight: LINE_HEIGHTS.join(' | '), density: DENSITIES.join(' | '),
        shadowIntensity: SHADOWS.join(' | '), glassEffect: 'boolean',
        pageGuide: 'boolean', qrCodeUrl: 'string', qrCodePosition: 'header | footer | sidebar | none',
      },
    },
    templates: TEMPLATES.map((t) => ({ id: t.id, name: t.name, tag: t.tag, bestFor: t.bestFor, layout: t.layout, pageBudget: t.pageBudget })),
    limits: LIMITS,
    onePageRule: 'A4 tek sayfa. Varsayılan ~3050 görünür karakter (compact + sm). cv_validate kesin sayıyı verir.',
    writingRules: [
      'Geçmiş zaman kipi; her deneyim 2-3 cümle (ne yaptın + kime + sonuç).',
      'Projede teknoloji listesi technologies alanına; açıklama "ne işe yarıyor" dilinde.',
      'Devam eden kayıtta date boş; "Günümüz" yazılmaz.',
      'Uydurma sayı/kurum/tarih yok; bilinmeyen alan boş kalır.',
    ],
  };
}

export function createDraft(args) {
  const slug = assertSlug(args.slug);
  const exists = fs.existsSync(draftPath(slug));
  if (exists && args.overwrite === false) throw new Error(`"${slug}" zaten var. overwrite=true gönderin.`);
  const cv = blankCV({ slug, title: args.title, template: args.template });
  if (args.photo) cv.personalInfo.photoVisible = true;
  const file = writeDraft(slug, cv);
  return { ok: true, slug, file, replacedExisting: exists, template: cv.styles.template };
}

export function applyDraft(args) {
  const slug = assertSlug(args.slug);
  const cv = fs.existsSync(draftPath(slug)) ? readDraft(slug) : blankCV({ slug, title: args.title });
  const { next, notes } = applyPatch(cv, args);
  writeDraft(slug, next);
  const check = validateCV(next);
  return {
    ok: true, slug, notes,
    written: Object.keys(args).filter((k) => k !== 'slug'),
    validation: { ok: check.ok, errors: check.errors, warnings: check.warnings, stats: check.stats },
  };
}

const NORMALIZERS = {
  workExperiences: normalizeExperience, educations: normalizeEducation, projects: normalizeProject,
  skills: normalizeSkillGroup, socialLinks: normalizeSocial, customSections: normalizeCustom,
};

export function addItems(args) {
  const cv = readDraft(args.slug);
  const fn = NORMALIZERS[args.section];
  if (!fn) throw new Error(`Bilinmeyen bölüm: ${args.section}`);
  const items = Array.isArray(args.items) ? args.items : [args.items];
  cv[args.section] = [...cv[args.section], ...items.map(fn)];
  writeDraft(args.slug, cv);
  return { ok: true, section: args.section, added: items.length, total: cv[args.section].length };
}

export function removeItem(args) {
  const cv = readDraft(args.slug);
  const arr = cv[args.section];
  if (!Array.isArray(arr)) throw new Error(`Bilinmeyen bölüm: ${args.section}`);
  let idx = -1;
  if (args.id) idx = arr.findIndex((x) => x.id === args.id);
  else if (typeof args.index === 'number') idx = args.index;
  if (idx < 0 || idx >= arr.length) throw new Error('Kayıt bulunamadı (id veya index geçersiz).');
  const [removed] = arr.splice(idx, 1);
  writeDraft(args.slug, cv);
  return { ok: true, removed, remaining: arr.length };
}

export function setStyle(args) {
  const cv = readDraft(args.slug);
  const { slug, ...stylePatch } = args;
  const { next, notes } = applyPatch(cv, { styles: stylePatch });
  writeDraft(slug, next);
  return { ok: true, styles: next.styles, notes };
}

export function validateDraft(args) {
  const cv = readDraft(args.slug);
  return { slug: args.slug, title: cv.title, ...validateCV(cv) };
}

export function readOne(args) {
  return { slug: args.slug, cv: readDraft(args.slug) };
}

export function listDrafts() {
  ensureDirs();
  const items = [];
  for (const file of fs.readdirSync(DRAFTS_DIR).filter((f) => f.endsWith('.json'))) {
    const p = path.join(DRAFTS_DIR, file);
    const slug = file.replace(/\.json$/, '');
    try {
      const cv = JSON.parse(fs.readFileSync(p, 'utf8'));
      const check = validateCV(cv);
      items.push({
        slug, title: cv.title, template: cv.styles?.template,
        updatedAt: cv.updatedAt, fillRatio: check.stats.fillRatio,
        errors: check.errors.length, warnings: check.warnings.length,
      });
    } catch {
      items.push({ slug, error: 'okunamadı' });
    }
  }
  items.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return { count: items.length, drafts: items };
}

export function exportDraft(args) {
  const cv = readDraft(args.slug);
  const check = validateCV(cv);
  ensureDirs();
  const exportPath = path.join(EXPORTS_DIR, `${args.slug}.json`);
  fs.writeFileSync(exportPath, JSON.stringify({ ...cv, updatedAt: nowISO() }, null, 2), 'utf8');

  let downloadsPath = null;
  if (args.copyToDownloads) {
    const dl = path.join(process.env.USERPROFILE || process.env.HOME || PROJECT_DIR, 'Downloads');
    if (fs.existsSync(dl)) {
      downloadsPath = path.join(dl, `cv-${args.slug}.json`);
      fs.copyFileSync(exportPath, downloadsPath);
    }
  }

  return {
    ok: check.ok, exportPath, downloadsPath, bytes: fs.statSync(exportPath).size,
    importInstruction: 'Cv-Master → "CV Geri Çağır" → "Yedek Yükle (JSON)" → bu dosya. Başlık "[İthal]" önekiyle eklenir.',
    validation: { errors: check.errors, warnings: check.warnings, stats: check.stats },
  };
}

/* ------------------------------------------------------------------ */
/* Uzak API — CLI/MCP, siteye CV gönderir ve siteden CV çeker          */
/* ------------------------------------------------------------------ */

export function remoteConfig(overrides = {}) {
  const base =
    overrides.apiUrl ||
    process.env.CV_API_URL ||
    process.env.CV_MASTER_API_URL ||
    'http://localhost:3010';

  let token = overrides.apiToken || process.env.CV_API_TOKEN || '';

  // Yerel geliştirmede sunucu token'ı .cv-store/token.txt içine üretir; onu kullan.
  if (!token) {
    const local = path.join(PROJECT_DIR, '.cv-store', 'token.txt');
    try {
      if (fs.existsSync(local)) token = fs.readFileSync(local, 'utf8').trim();
    } catch {
      /* yoksay */
    }
  }

  return { base: String(base).replace(/\/+$/, ''), token };
}

export async function pushRemote(args = {}) {
  const { slug } = args;
  const cv = readDraft(slug);
  const check = validateCV(cv);
  if (!check.ok) {
    throw new Error(`CV doğrulamadan geçmedi, gönderilmedi: ${check.errors.join(' ')}`);
  }

  const { base, token } = remoteConfig(args);
  if (!token) {
    throw new Error(
      'CV_API_TOKEN yok. Sunucudaki token ile aynı değeri ortam değişkenine ekleyin: ' +
        'setx CV_API_TOKEN "<token>" (veya .env).',
    );
  }

  const res = await fetch(`${base}/api/cv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ slug, cv }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`API hatası (${res.status}): ${body.error || res.statusText}`);

  return {
    ok: true,
    slug: body.slug,
    title: body.title,
    updatedAt: body.updatedAt,
    target: `${base}/api/cv`,
    store: body.store,
    next: 'Sitede: "CV Geri Çağır" → "API\'den Yükle" düğmesi bu CV\'yi listeler.',
    stats: check.stats,
  };
}

export async function pullRemote(args = {}) {
  const { base, token } = remoteConfig(args);
  if (!token) throw new Error('CV_API_TOKEN yok. Sunucudaki token ile aynı değeri girin.');

  const qs = new URLSearchParams({ token });
  if (args.slug) qs.set('slug', args.slug);

  const res = await fetch(`${base}/api/cv/latest?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`API hatası (${res.status}): ${body.error || res.statusText}`);

  const slug = assertSlug(args.as || body.slug || 'remote-cv');
  writeDraft(slug, body.data);
  const check = validateCV(body.data);

  return {
    ok: true,
    slug,
    remoteSlug: body.slug,
    title: body.title,
    updatedAt: body.updatedAt,
    written: draftPath(slug),
    validation: { ok: check.ok, errors: check.errors, warnings: check.warnings, stats: check.stats },
  };
}

export async function listRemote(args = {}) {
  const { base, token } = remoteConfig(args);
  if (!token) throw new Error('CV_API_TOKEN yok.');

  const res = await fetch(`${base}/api/cv`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`API hatası (${res.status}): ${body.error || res.statusText}`);
  return body;
}

/** Tek giriş noktası: ad → sonuç. MCP de CLI de bunu çağırır. */
export const COMMANDS = {
  schema: () => schema(),
  create: createDraft,
  apply: applyDraft,
  add: addItems,
  remove: removeItem,
  style: setStyle,
  validate: validateDraft,
  read: readOne,
  list: () => listDrafts(),
  export: exportDraft,
  push: pushRemote,
  pull: pullRemote,
  remote: listRemote,
};

export function runCommand(name, args = {}) {
  const fn = COMMANDS[name];
  if (!fn) throw new Error(`Bilinmeyen komut: ${name}. Geçerli: ${Object.keys(COMMANDS).join(', ')}`);
  return fn(args);
}

/** Ağ komutları için: sync ve async komutları birlikte çalıştırır. */
export async function runCommandAsync(name, args = {}) {
  return await runCommand(name, args);
}

/* MCP araç tanımı — CLI ile aynı şemayı üretir */
export function toolDefinitions() {
  const obj = (properties = {}, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
  const S = (description) => ({ type: 'string', description });
  const A = (description) => ({ type: 'array', description });
  const SLUG = S('Taslak kimliği: küçük harf + tire, örn. "rehber-ogretmen-2026"');

  return [
    { name: 'cv_schema', description: 'Cv-Master şeması, şablonları, sınırları ve tek sayfa bütçesi. CV doldurmadan ÖNCE çağır.', inputSchema: obj() },
    {
      name: 'cv_create',
      description: 'Yeni CV taslağı açar (boş iskelet).',
      inputSchema: obj({ slug: SLUG, title: S('CV başlığı'), template: { type: 'string', enum: TEMPLATE_IDS }, photo: { type: 'boolean' }, overwrite: { type: 'boolean' } }, ['slug']),
    },
    {
      name: 'cv_apply',
      description: 'Taslağa içerik yazar. TEK çağrıda tüm CV doldurulabilir (önerilen). Objeler birleşir, diziler değişir.',
      inputSchema: obj({
        slug: SLUG, title: S('CV başlığı'),
        personalInfo: { type: 'object', description: 'Kişisel bilgiler (kısmi birleştirme)' },
        workExperiences: A('İş deneyimleri (diziyi değiştirir)'),
        educations: A('Eğitim'), projects: A('Projeler'), skills: A('Yetkinlik grupları'),
        socialLinks: A('Sosyal bağlantılar'), customSections: A('Serbest bölümler'),
        sectionOrder: A('Bölüm sırası'), styles: { type: 'object', description: 'Şablon/renk/font' },
      }, ['slug']),
    },
    {
      name: 'cv_add',
      description: 'Tek bölüme kayıt ekler.',
      inputSchema: obj({ slug: SLUG, section: { type: 'string', enum: Object.keys(NORMALIZERS) }, items: A('Eklenecek kayıt(lar)') }, ['slug', 'section', 'items']),
    },
    {
      name: 'cv_remove',
      description: 'Bölümden kaydı id veya index ile siler.',
      inputSchema: obj({ slug: SLUG, section: { type: 'string', enum: Object.keys(NORMALIZERS) }, id: S('Kayıt id'), index: { type: 'number' } }, ['slug', 'section']),
    },
    {
      name: 'cv_set_style',
      description: 'Şablon/renk/font değiştirir. Şablon değişince palet varsayılana döner.',
      inputSchema: obj({
        slug: SLUG, template: { type: 'string', enum: TEMPLATE_IDS },
        primaryColor: S('#hex'), secondaryColor: S('#hex'), accentColor: S('#hex'),
        textColor: S('#hex'), backgroundColor: S('#hex'),
        font: { type: 'string', enum: FONTS }, fontSize: { type: 'string', enum: FONT_SIZES },
        lineHeight: { type: 'string', enum: LINE_HEIGHTS }, density: { type: 'string', enum: DENSITIES },
        shadowIntensity: { type: 'string', enum: SHADOWS }, glassEffect: { type: 'boolean' },
      }, ['slug']),
    },
    { name: 'cv_validate', description: 'Zorunlu alanlar, tarih biçimi, tekrarlanan id, tek sayfa doluluk ve kısaltma önerileri.', inputSchema: obj({ slug: SLUG }, ['slug']) },
    { name: 'cv_read', description: 'Taslağın tam JSON içeriği.', inputSchema: obj({ slug: SLUG }, ['slug']) },
    { name: 'cv_list', description: 'Kayıtlı taslaklar (slug, başlık, şablon, doluluk).', inputSchema: obj() },
    {
      name: 'cv_export',
      description: 'Uygulamaya aktarılabilir JSON üretir (CV Geri Çağır → Yedek Yükle).',
      inputSchema: obj({ slug: SLUG, copyToDownloads: { type: 'boolean' } }, ['slug']),
    },
    {
      name: 'cv_push',
      description:
        'CV taslağını siteye gönderir (POST /api/cv). Sitede "CV Geri Çağır" → "API\'den Yükle" ile görünür. CV_API_TOKEN gerekir.',
      inputSchema: obj({
        slug: SLUG,
        apiUrl: S('Site adresi (varsayılan CV_API_URL veya http://localhost:3010)'),
        apiToken: S('API token (varsayılan CV_API_TOKEN ortam değişkeni)'),
      }, ['slug']),
    },
    {
      name: 'cv_pull',
      description: 'Sitedeki en son CV\'yi (veya verilen slug\'ı) indirip yerel taslak olarak yazar.',
      inputSchema: obj({
        slug: S('Sitedeki slug (boşsa en son CV)'),
        as: S('Yerel taslak slug\'ı'),
        apiUrl: S('Site adresi'),
        apiToken: S('API token'),
      }),
    },
    { name: 'cv_remote', description: 'Sitedeki CV listesini getirir (slug, başlık, tarih).', inputSchema: obj({ apiUrl: S('Site adresi'), apiToken: S('API token') }) },
  ];
} 

export const TOOL_TO_COMMAND = {
  cv_schema: 'schema', cv_create: 'create', cv_apply: 'apply', cv_add: 'add',
  cv_remove: 'remove', cv_set_style: 'style', cv_validate: 'validate',
  cv_read: 'read', cv_list: 'list', cv_export: 'export',
  cv_push: 'push', cv_pull: 'pull', cv_remote: 'remote',
};
