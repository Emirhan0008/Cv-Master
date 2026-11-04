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
npm run cv -- validate rehber-2026      # bütçe ön kontrolü; hata varsa çıkış kodu 2
npm run cv -- fit rehber-2026           # GERÇEK A4 ölçümü; taşma varsa çıkış kodu 2
npm run cv -- style rehber-2026 --density compact --font inter
npm run cv -- read rehber-2026 --out cikti.json
npm run cv -- list
npm run cv -- export rehber-2026 --downloads
npm run cv -- pdf rehber-2026           # PDF → ~/Downloads/<slug>.pdf
```

Çıkış kodları: **0** başarılı · **1** kullanım/ortam hatası · **2** doğrulama veya A4
taşması · **3** önizleme sunucusu kapalı. Boru hattı `if ($LASTEXITCODE -ne 0)` ile
gerçek hatayı yakalar.

`apply` ayrıca stdin kabul eder:

```powershell
Get-Content payload.json -Raw | npm run cv -- apply rehber-2026
```

### En hızlı akış (LLM için)

1. `npm run cv -- schema` → şemayı öğren
2. Tek bir `payload.json` üret (tüm bölümler)
3. `npm run cv -- apply <slug> --file payload.json` → yaz + otomatik doğrula
4. `npm run cv -- fit <slug>` → gerçek A4 ölçümü (taşma varsa çıktı "~N karakter kısaltın" der)
5. `npm run cv -- pdf <slug>` → PDF
6. `npm run cv -- export <slug> --downloads` → uygulamaya yükle

Adım 4 atlanırsa PDF üretilir ama **alt kısım sessizce kırpılır**. `pdf` artık bunu
taşma varsa `çıkış kodu 2` + "ALT KISIM KIRPILIR" ile bildirir.

## Gerçek sığma ölçümü — `fit`

`validate` **karakter bütçesidir**, `fit` **gerçek piksel ölçümüdür**. İkisi ±%15
sapabilir; karar ölçümle verilir.

```powershell
npm run cv -- fit rehber-2026                          # sadece taslaktaki şablon (hızlı, ~6 sn)
npm run cv -- fit rehber-2026 --templates modern-geometric,crimson-split
npm run cv -- fit rehber-2026 --all                    # 11 şablonu karşılaştır
npm run cv -- fit rehber-2026 --verbose                # taşan öğeleri göster
npm run cv -- fit rehber-2026 --json                   # makine okunur
```

```
A4 = 1123 px (297 mm) · http://localhost:3010 · rehber-2026
Şablon: modern-geometric (taslaktaki)

ŞABLON              DURUM   YÜKSEKLİK        TAŞMA      METİN   BÜTÇE
*modern-geometric   SIGAR    1068px     -14.4mm    2640  %  87
```

- Ölçüm **print medyasında** yapılır → PDF ile birebir aynı geometri.
- Baseline **A4 = 1122.52 px**, elementin kendi kutusu değil (bkz. aşağıdaki tuzak).
- Taşmada tahmini kısaltma: `~N karakter`. Sıra: uzun deneyim → uzun proje → özet →
  eğitim açıklaması. Yetmezse kayıt çıkar veya `density="compact"`.

> Önizleme sunucusu kapalıysa `fit`, `pdf` ve `preview` net hata + başlatma komutu
> verip çıkar (kod 1 veya 3); Playwright'ın anlaşılmaz hatasını göstermez.

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

## Hata analizi / debug

Tek komut, altı katmanı sırayla kontrol eder:

```powershell
npm run cv -- debug rehber-2026
npm run cv -- debug rehber-2026 --api http://localhost:3010
npm run cv:debug -- rehber-2026
```

| Katman | Neyi kontrol eder |
|---|---|
| 1. Ortam | Node ≥18, taslak dosyası, Playwright, PDF üretici, dev sunucu (`:3010`) |
| 2. Şema | `validate` → hatalar, uyarılar, kısaltma önerileri |
| 3. İçerik | Bütçe aşımı, bilinmeyen şablon, boş yetkinlik grubu, tarih biçimi, fotoğraf |
| 4. Render | Gerçek DOM ölçümü (print medyası, A4 px) — sınırı aşan öğe (etiket + px + mm) |
| 5. Çıktı | Var olan PDF (boyut, sayfa sayısı), export dosyası |
| 6. Uzak API | Erişim, token, depo adaptörü (blob/upstash/dosya/bellek) |

Çıkış kodu: **2** bloklayan hata · **1** sadece uyarı · **0** temiz.
Rapor JSON olarak `%TEMP%\opencode\debug-<slug>.json` dosyasına da yazılır.

Render katmanı, `no-print` dekoratif öğeleri ayıklar; bu yüzden `depth3d` gibi
şablonlarda blur/glow katmanı "taşma" diye yanlış alarm vermez.

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
`split-sidebar` ~3450, `modern-geometric` ~3050, `modern` ~2900. Bu sayı **yalnızca ön
kontroldür** — gerçek sığma şablona, fonta ve satır kırılmalarına göre ±%15 sapar.
Kesin cevap `fit` komutundadır.

## Bilinen tuzaklar (ve neden böyle davranıyor)

### 1. `#cv-preview-page` A4'ten uzun olabilir

Elementte `min-height:297mm` + `overflow:visible` var. Yani elementin kendi kutusu
1. sayfadan büyük olabilir. Taşma **elementin kutusuna göre değil, gerçek
A4 yüksekliğine (1122.52 px) göre** ölçülür. Bu yanlış yapılırsa araçlar "taşma yok,
1 sayfa" der ama PDF'in alt kısmı sessizce kırpılır. Ölçüm tek yerdedir:
`mcp/measure.mjs`. Bu dosyayı değiştirmeden ölçüm mantığını başka yere kopyalamayın.

### 2. Ölçüm print medyasında yapılmalı

Ekran ve baskı stilleri farklı yükseklik üretir. Galeri bir zamanlar ekran medyasında
ölçtüğü için "tek sayfa" derken PDF "taşma var" diyebiliyordu. `measureA4()` artık
`emulateMedia({media:'print'})` uygular. Ekran görüntüsü ayrıca ekran medyasında alınır.

### 3. `apply` içinde `styles.template` + renk birlikte verilebilir

Şablon varsayılanları yalnızca **açıkça verilmeyen** alanları doldurur. Aynı payload'da
`template` ile birlikte `primaryColor` verirsen renk korunur. Şablonu değiştirip
paleti de değiştirmek istiyorsan ikisini aynı `styles` objesinde gönder.

### 4. `pick --template <numara>` galeri manifestine bağlıdır

Numara, `~/Downloads/cv-preview-<slug>/gallery.json` içindeki `index → id` eşlemesinden
çözülür. Galeri yeniden üretildiğinde eski `NN-*.png` dosyaları temizlenir (aksi halde
iki farklı `01-…` yan yana kalıp kafa karıştırıyordu). Manifest yoksa sabit şablon
sırasına düşer — o yüzden numara yerine **id** kullanmak daha güvenlidir.

### 5. Önizleme sunucusu şart

`fit`, `pdf`, `preview` ve `debug` render katmanı `http://localhost:3010` üzerinde
çalışır (`CV_PREVIEW_URL` ile değiştirilebilir). Kapalıysa:

```powershell
$env:PORT=3010; npx tsx server.ts
```

`apply`, `validate`, `style`, `read`, `list`, `export`, `push`, `pull` sunucuya ihtiyaç
duymaz.

### 6. PowerShell `&&` kabul etmez

Komutları `;` ile zincirleyin. Karmaşık `node -e "..."` tek satırları
"invalid-structure" hatası verebilir; geçici bir `.mjs` dosyası yazıp çalıştırın.
