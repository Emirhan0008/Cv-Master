/**
 * CV deposu — API'nin arkasındaki kalıcı katman.
 *
 * Üç adaptör, ortam değişkenlerine göre otomatik seçilir:
 *   1) upstash  → UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *                 (Vercel'de önerilen; SDK gerekmez, düz fetch)
 *   2) file     → CV_STORE_DIR (varsayılan <proje>/.cv-store)
 *                 (yerel geliştirme; sunucu diski kalıcı)
 *   3) memory   → hiçbiri yoksa. Sadece okuma testleri içindir,
 *                 süreç yeniden başlayınca veri kaybolur.
 *
 * Kayıt biçimi (her iki adaptörde de aynı anahtar düzeni):
 *   cv:<slug>        → CV JSON (string)
 *   cv:index         → [{ slug, title, updatedAt }, ...] (JSON, yeniden eskiye)
 *
 * Not: Vercel yalnızca `api/` altını paketlediği için bu modül `api/_`
 * önekiyle durur; Vercel `_` ile başlayan dosyaları rota saymaz ama
 * import edildiğinde pakete dahil eder.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface StoredCV {
  slug: string;
  title: string;
  updatedAt: string;
  data: any;
}

export interface IndexEntry {
  slug: string;
  title: string;
  updatedAt: string;
}

const INDEX_KEY = 'cv:index';

export function assertSlug(slug: unknown): string {
  const s = String(slug ?? '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,60}$/.test(s)) {
    throw new Error(
      `Geçersiz slug: ${JSON.stringify(slug)}. Küçük harf, rakam ve tire kullanın (örn. "rehber-ogretmen-2026").`,
    );
  }
  return s;
}

/* ------------------------------------------------------------------ */
/* Adaptör seçimi                                                      */
/* ------------------------------------------------------------------ */

type Adapter = 'upstash' | 'file' | 'memory';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

const adapter = ((): Adapter => {
  if (UPSTASH_URL && UPSTASH_TOKEN) return 'upstash';
  // Vercel/Lambda gibi salt-okunur dosya sistemlerinde dosya adaptörü çalışmaz.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) return 'memory';
  return 'file';
})();

export const storeInfo = {
  adapter,
  persistent: adapter !== 'memory',
  hint:
    adapter === 'memory'
      ? 'Kalıcı depo yok. Vercel için UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN ekleyin.'
      : adapter === 'file'
        ? `Yerel dosya deposu: ${storeDir()}`
        : 'Upstash Redis deposu.',
};

function storeDir(): string {
  return (
    process.env.CV_STORE_DIR ||
    path.join(process.env.CV_MASTER_DIR || process.cwd(), '.cv-store')
  );
}

/* ------------------------------------------------------------------ */
/* Upstash adaptörü                                                    */
/* ------------------------------------------------------------------ */

async function upstash(command: (string | number)[]): Promise<any> {
  const res = await fetch(UPSTASH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Depo hatası (${res.status}): ${body.slice(0, 200)}`);
  }
  const json: any = await res.json();
  return json?.result;
}

/* ------------------------------------------------------------------ */
/* Bellek adaptörü                                                     */
/* ------------------------------------------------------------------ */

const mem = new Map<string, string>();

/* ------------------------------------------------------------------ */
/* Ortak okuma/yazma                                                   */
/* ------------------------------------------------------------------ */

async function rawGet(key: string): Promise<string | null> {
  if (adapter === 'upstash') return (await upstash(['GET', key])) ?? null;
  if (adapter === 'memory') return mem.get(key) ?? null;
  const p = path.join(storeDir(), `${key.replace(/:/g, '__')}.json`);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

async function rawSet(key: string, value: string): Promise<void> {
  if (adapter === 'upstash') {
    await upstash(['SET', key, value]);
    return;
  }
  if (adapter === 'memory') {
    mem.set(key, value);
    return;
  }
  const dir = storeDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${key.replace(/:/g, '__')}.json`), value, 'utf8');
}

async function rawDel(key: string): Promise<void> {
  if (adapter === 'upstash') {
    await upstash(['DEL', key]);
    return;
  }
  if (adapter === 'memory') {
    mem.delete(key);
    return;
  }
  const p = path.join(storeDir(), `${key.replace(/:/g, '__')}.json`);
  if (fs.existsSync(p)) fs.rmSync(p);
}

/* ------------------------------------------------------------------ */
/* Genel API                                                           */
/* ------------------------------------------------------------------ */

export async function readIndex(): Promise<IndexEntry[]> {
  const raw = await rawGet(INDEX_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function writeIndex(entries: IndexEntry[]): Promise<void> {
  // Tek sayfalık depoda sınırsız büyümeyi engelle
  await rawSet(INDEX_KEY, JSON.stringify(entries.slice(0, 100)));
}

export async function putCV(cv: any, slugInput?: string): Promise<IndexEntry> {
  if (!cv || typeof cv !== 'object') throw new Error('CV objesi gerekli.');

  const slug = assertSlug(
    slugInput || cv.id || cv.slug || slugify(cv.title || cv.personalInfo?.name || 'cv'),
  );

  const record: StoredCV = {
    slug,
    title: String(cv.title || cv.personalInfo?.name || 'İsimsiz Özgeçmiş'),
    updatedAt: new Date().toISOString(),
    data: cv,
  };

  await rawSet(`cv:${slug}`, JSON.stringify(record));

  const index = await readIndex();
  const entry: IndexEntry = { slug, title: record.title, updatedAt: record.updatedAt };
  await writeIndex([entry, ...index.filter((e) => e.slug !== slug)]);

  return entry;
}

export async function getCV(slug: string): Promise<StoredCV | null> {
  const raw = await rawGet(`cv:${assertSlug(slug)}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getLatest(): Promise<StoredCV | null> {
  const index = await readIndex();
  if (!index.length) return null;
  return getCV(index[0].slug);
}

export async function deleteCV(slug: string): Promise<boolean> {
  const s = assertSlug(slug);
  const exists = (await getCV(s)) !== null;
  if (!exists) return false;
  await rawDel(`cv:${s}`);
  const index = await readIndex();
  await writeIndex(index.filter((e) => e.slug !== s));
  return true;
}

function slugify(input: string): string {
  const map: Record<string, string> = {
    ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
    Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u',
  };
  const ascii = String(input)
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return ascii || `cv-${Date.now().toString(36)}`;
}

/* ------------------------------------------------------------------ */
/* Yetkilendirme                                                       */
/* ------------------------------------------------------------------ */

/**
 * Token doğrulaması.
 *
 * Öncelik sırası:
 *   1) CV_API_TOKEN ortam değişkeni (prod'da zorunlu)
 *   2) Yerel geliştirmede `.cv-store/token.txt` — yoksa üretilir
 *
 * Böylece yerelde sıfır yapılandırmayla çalışır; Vercel'de
 * (process.env.VERCEL) yalnızca ortam değişkeni kabul edilir.
 */
export function localTokenPath(): string {
  return path.join(storeDir(), 'token.txt');
}

export function resolveToken(): string {
  const fromEnv = String(process.env.CV_API_TOKEN || '').trim();
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL) return '';

  const p = localTokenPath();
  try {
    if (fs.existsSync(p)) {
      const t = fs.readFileSync(p, 'utf8').trim();
      if (t) return t;
    }
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const generated = `cvm_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    fs.writeFileSync(p, generated, 'utf8');
    return generated;
  } catch {
    return '';
  }
}

/** CLI tarafında da aynı token'a erişmek için */
export function readLocalToken(): string {
  return resolveToken();
}

export interface AuthCheck {
  ok: boolean;
  status: number;
  error: string;
}

export function checkAuth(req: any): AuthCheck {
  const expected = resolveToken();
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error:
        'CV_API_TOKEN tanımlı değil. API kapalı. Sunucu ortam değişkenlerine CV_API_TOKEN ekleyin.',
    };
  }

  // req.get() case-insensitive header alır (Express standard)
  const header = req.get('Authorization') || '';
  const fromHeader = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  const fromQuery = String(req.query?.token || '').trim();
  const provided = fromHeader || fromQuery;

  if (!provided || !timingSafeEqual(provided, expected)) {
    return { ok: false, status: 401, error: 'Yetkisiz. Geçerli token gerekli.' };
  }
  return { ok: true, status: 200, error: '' };
}

/** Uzunluk sızdırmayan sabit-zamanlı karşılaştırma */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
