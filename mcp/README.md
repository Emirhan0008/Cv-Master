# Cv-Master — LLM arayüzü (CLI + MCP)

İki giriş, tek çekirdek (`mcp/core.mjs`). Amaç: bir LLM'in CV alanlarını **tek turda** doldurması.

## Neden iki tane?

| | CLI | MCP |
|---|---|---|
| Tipik kullanım | Model tek JSON üretir → tek komut | Modelle araç çağrısı |
| Model↔araç turu | **1** | 1–5 (her alan grubu ayrı çağrı) |
| Ne zaman | Toplu doldurma, betik, CI | Sohbet içinde adım adım düzenleme |
| Bağlantı | `node mcp/cli.mjs …` | stdio JSON-RPC |

Aynı işi ikisi de yapar; **hızlı olan CLI**'dır. MCP, ajanın "şu alanı düzelt" gibi ara işlemler yapması gerektiğinde işe yarar.

## CLI

```powershell
npm run cv -- help                     # komut listesi
npm run cv -- schema                   # alanlar, şablonlar, sınırlar, tek sayfa bütçesi
npm run cv -- create rehber-2026 --template split-sidebar --title "Ad — Rehber Öğretmen"
npm run cv -- apply rehber-2026 --file payload.json
npm run cv -- validate rehber-2026      # hata varsa çıkış kodu 2
npm run cv -- style rehber-2026 --density compact --font inter
npm run cv -- read rehber-2026 --out cikti.json
npm run cv -- list
npm run cv -- export rehber-2026 --downloads
```

`apply` ayrıca stdin kabul eder:

```powershell
Get-Content payload.json -Raw | npm run cv -- apply rehber-2026
```

### En hızlı akış (LLM için)

1. `npm run cv -- schema` → şemayı öğren
2. Tek bir `payload.json` üret (tüm bölümler)
3. `npm run cv -- apply <slug> --file payload.json` → yaz + otomatik doğrula
4. `npm run cv -- export <slug> --downloads` → uygulamaya yükle

## Şablon galerisi (önce bak, sonra seç)

Tek komut, 11 tasarımın hepsini render eder:

```powershell
npm run cv -- preview rehber-2026                # tüm şablonlar
npm run cv -- preview rehber-2026 --templates corporate,modern,tech-mono
npm run cv -- preview rehber-2026 --out C:\temp\galeri --no-sheet
```

Çıktı: `~/Downloads/cv-preview-<slug>/`

| Dosya | İçerik |
|---|---|
| `gallery.html` | Tıklanabilir galeri (tarayıcıda aç) |
| `gallery.png` | Tek PNG özet sayfası — hepsi bir arada |
| `gallery.json` | `index → şablon` eşlemesi + ölçümler |
| `01-corporate.png` … | Her şablonun A4 önizlemesi |

Her kartta şablon adı, kategori, düzen tipi, taşma (mm), doluluk (%) ve
kopyalanabilir CLI komutu yer alır.

Beğendiğini numarayla (veya id ile) seç ve PDF'i üret:

```powershell
npm run cv -- pick rehber-2026 --template 6 --pdf          # numara galerideki sıra
npm run cv -- pick rehber-2026 --template minimalist-clean --pdf
npm run cv -- pick rehber-2026 --template 3 --pdf --out C:\CV\final.pdf
```

`pick` şablonu taslağa yazar ve istenirse PDF'i doğrudan `Downloads`'a üretir.

## MCP

`opencode.jsonc` içine:

```jsonc
"cv-master": {
  "type": "local",
  "command": ["node", "W:\\Cv-Master\\mcp\\server.mjs"]
}
```

Araçlar: `cv_schema`, `cv_create`, `cv_apply`, `cv_add`, `cv_remove`, `cv_set_style`, `cv_validate`, `cv_read`, `cv_list`, `cv_export`.

## Veri yeri

```
cv-data/drafts/<slug>.json    çalışma taslakları
cv-data/exports/<slug>.json   uygulamaya aktarılacak dosya
```

`cv-data/` `.gitignore`'da — kişisel veri repoya girmez.

## Uygulamaya aktarma

Cv-Master → **CV Geri Çağır** → **Yedek Yükle (JSON)** → `cv-data/exports/<slug>.json`.
Başlık `[İthal] …` önekiyle listeye eklenir; oradan düzenlemeye alınır.

## Tek sayfa kuralı

`validate` görünür karakter sayısını şablon bütçesiyle karşılaştırır:
`split-sidebar` ~3450, `modern-geometric` ~3050, `modern` ~2900.
Aşılırsa hangi alanın kaç karakter kısaltılacağını önerir. Uygulamada gerçek piksel ölçümü
PDF/önizleme aşamasında yapılır — buradaki sayı ön kontroldür.
