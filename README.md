# CV-Master

Tarayıcıda çalışan, Türkçe odaklı profesyonel CV hazırlama uygulaması. Google AI Studio'da üretilmiş sürümden türetilmiş, **Google Cloud bağımlılıkları tamamen kaldırılmış** bağımsız sürüm.

## Ne yapar

- 12+ hazır CV şablonu, canlı önizleme, renk/font ince ayarı
- A4'e birebir oturan **PDF** (tek/çok sayfa), PNG, Word ve JSON çıktısı
- Yapay zeka ile ham metinden CV içe aktarma ve metin optimizasyonu (Gemini)
- Tüm CV'ler tarayıcının `localStorage`'ında saklanır; JSON dışa/içe aktarma ile cihaz taşınabilir

## Veri modeli

Kalıcı depo **`localStorage`** (`cv_builder_saved_cvs`). Sunucu tarafında veritabanı, kimlik doğrulama veya bulut senkronizasyonu **yoktur**. AI dışında hiçbir veri cihazdan çıkmaz.

## Kurulum (geliştirme)

```bash
npm install
cp .env.example .env     # GEMINI_API_KEY doldur
npm run dev              # http://localhost:3000
```

`.env`:

```env
GEMINI_API_KEY=...       # https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-3.5-flash   # opsiyonel
PORT=3000                # opsiyonel
```

AI anahtarı yoksa uygulama çalışmaya devam eder; sadece AI butonları hata verir.

## Betikler

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Express + Vite dev sunucusu (AI endpoint'leri dahil) |
| `npm run build` | İstemci (`dist/`) + sunucu (`dist/server.cjs`) derlemesi |
| `npm start` | Derlenmiş sürümü üretim modunda çalıştırır |
| `npm run lint` | `tsc --noEmit` tip kontrolü |
| `npm run vercel-build` | Yalnızca istemci derlemesi (Vercel) |

## Vercel'e deploy

Mimari hibrit: **statik frontend** + iki **serverless** AI endpoint'i.

```
api/ai/import-cv.ts      -> POST /api/ai/import-cv
api/ai/optimize-text.ts  -> POST /api/ai/optimize-text
```

```bash
vercel link
vercel env add GEMINI_API_KEY production
vercel --prod
```

`GEMINI_MODEL` de opsiyonel ortam değişkeni olarak eklenebilir.

> **Hobby planı notu:** Vercel Hobby ticari kullanım için lisanslı değildir ve aylık 4 CPU-saat / 1M invocation ile sınırlıdır. Ticari kullanımda Pro plan gerekir.

## PDF çıktısı nasıl çalışıyor

1. Önizleme DOM'u `html2canvas-pro` ile canvas'a alınır (modern `oklch`/`oklab`/`color-mix` renkleri desteklenir).
2. Canvas'ın altındaki boş beyaz alan kırpılır — A4'ü aşan fazlalık yüzünden oluşan **boş ikinci sayfa** engellenir.
3. Canvas, A4 mm/px oranı korunarak dikey dilimlere bölünür; her dilim **ölçeklenmeden** kendi sayfasına basılır (hiza kayması olmaz).
4. Kalan artık 3 mm'den küçükse basılmaz.

## Google Cloud kalıntıları

Eski sürümün Firebase Auth, Firestore/Postgres (Drizzle), Google Drive ve Cloud SQL kodu silinmedi; `legacy/google-cloud/` altında `.disabled` uzantısıyla referans olarak duruyor. Çalışma zamanında hiçbiri yüklenmez.

## Teknoloji

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · Express 4 · jsPDF · html2canvas-pro · @google/genai
