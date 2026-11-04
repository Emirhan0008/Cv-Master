---
name: cv-master-cli
description: Drive the Cv-Master project (W:\Cv-Master) entirely from the command line to build, restyle, measure, preview and export a single-page A4 CV as PDF. Use when asked to create or edit a CV, change its template/colors, fix "content is cut off in the PDF", find out whether a CV really fits one page, or produce a PDF/JSON export without opening the web UI. Covers the apply → fit → pdf → export pipeline, the A4 pixel measurement (1122.52 px) that character budgets do not predict, and the exit codes that make failures visible.
---

# Cv-Master — CLI ile CV üretme

Proje: `W:\Cv-Master`. Tek çekirdek (`mcp/core.mjs`), iki arayüz: CLI (`mcp/cli.mjs`)
ve MCP (`mcp/server.mjs`). Bu skill **CLI** yolunu anlatır; toplu doldurmada en hızlısı.

Kullanıcı "CV hazırla / güncelle / PDF al" dediğinde tarayıcı açma, form doldurma yok.
Her şey terminalden, arka planda.

---

## 0. Altın kural

> **`validate` karakter bütçesidir, `fit` gerçek piksel ölçümüdür.**
> Karar `fit` ile verilir. Bütçe %99 derken içerik 141 mm taşabilir.

Sığmıyorsa PDF üretilir ama **alt kısmı sessizce kırpılır**. `pdf` artık taşmada
çıkış kodu 2 + "ALT KISIM KIRPILIR" verir; yine de önce `fit` çalıştır.

---

## 1. Ortam

```powershell
cd W:\Cv-Master
```

Render gerektiren komutlar (`fit`, `pdf`, `preview`, `debug`) önizleme sunucusuna
ihtiyaç duyar — **kapalıysa başlat**:

```powershell
$env:PORT=3010; node node_modules/tsx/dist/cli.mjs server.ts   # arka planda bırak
```

`CV_PREVIEW_URL` ile başka adres verilebilir (`--url` bayrağı da var).

Sunucu gerektirmeyen komutlar: `apply`, `validate`, `style`, `read`, `list`, `export`,
`add`, `remove`, `push`, `pull`, `remote`.

---

## 2. Tek standart akış

```powershell
# 1) Şemayı oku (ilk seferde; şablonlar, sınırlar, alan adları)
node mcp/cli.mjs schema

# 2) Taslak aç (slug: küçük harf + tire)
node mcp/cli.mjs create rehber-ogretmen-2026 --template modern-geometric --title "Ad — Rehber Öğretmen"

# 3) TÜM içeriği TEK payload ile yaz
node mcp/cli.mjs apply rehber-ogretmen-2026 --file cv-data/rehber-ogretmen-2026-payload.json

# 4) Gerçek A4 ölçümü  ← atlanmaz
node mcp/cli.mjs fit rehber-ogretmen-2026

# 5) PDF
node mcp/cli.mjs pdf rehber-ogretmen-2026

# 6) Uygulamaya aktarılacak JSON
node mcp/cli.mjs export rehber-ogretmen-2026 --downloads
```

`apply` tek çağrıda tüm bölümleri yazar: objeler birleşir, diziler **değiştirir**
(kısmi dizi gönderirsen diğer kayıtlar silinir).

Payload dosyasını `cv-data/<slug>-payload.json` altında tutmak, taslağı
(`cv-data/drafts/<slug>.json`) elle düzenlemekten daha güvenli: tekrar uygulanabilir.

---

## 3. Ölçüm ve sığdırma

```powershell
node mcp/cli.mjs fit <slug>                                  # taslaktaki şablon (~6 sn)
node mcp/cli.mjs fit <slug> --templates modern-geometric,crimson-split
node mcp/cli.mjs fit <slug> --all                            # 11 şablonu karşılaştır (~25 sn)
node mcp/cli.mjs fit <slug> --verbose                        # taşan öğeleri göster
node mcp/cli.mjs fit <slug> --json                           # makine okunur
```

Çıktı:

```
ŞABLON              DURUM   YÜKSEKLİK        TAŞMA      METİN   BÜTÇE
*modern-geometric   SIGAR    1068px     -14.4mm    2640  %  87
```

Taşmada araç tahmini kısaltmayı da verir: `~508 karakter kısaltın`.

### Kısaltma sırası (bu sırayı izle)

1. **Eski/alakasız deneyim kaydını çıkar** (öğrenci stajı vb.) — en çok yer kazandırır.
2. Uzun **deneyim açıklamasını** kısalt (hedef ~120-180 karakter).
3. Uzun **proje açıklamasını** kısalt.
4. **Özeti** kısalt.
5. **Eğitim açıklamalarını** tek satıra indir.
6. Hâlâ sığmıyorsa proje sayısını azalt → `density="compact"` → `fontSize="sm"`.

Tek turda hedefle: `--verbose`'daki mm farkını oku, o oranda kısalt, tekrar ölç.
Mm başına ~7-8 karakter (sm/compact varsayımı) kaba tahmindir; kesin sayı araçtan gelir.

---

## 4. Şablon ve stil

```powershell
node mcp/cli.mjs style <slug> --template tech-mono
node mcp/cli.mjs style <slug> --density compact --fontSize sm
node mcp/cli.mjs style <slug> --primaryColor "#0b1f3a" --accentColor "#0ea5e9" --font inter
```

**Kritik:** `styles` içinde `template` ile renkleri **aynı objede** gönder.
Şablon varsayılanları yalnızca *açıkça verilmeyen* alanları doldurur; ayrı iki
`style` çağrısında ikinci çağrı birinciyi ezmez ama şablon çağrısı sonrası gelen
renk çağrısı doğru sırada olmalı.

Görsel seçim için galeri (11 şablonu PNG olarak üretir):

```powershell
node mcp/cli.mjs preview <slug> --no-sheet                 # hepsi → ~/Downloads/cv-preview-<slug>/
node mcp/cli.mjs preview <slug> --templates tech-mono,modern-geometric --no-sheet
node mcp/cli.mjs pick <slug> --template 3 --pdf             # numara galeri manifestinden çözülür
node mcp/cli.mjs pick <slug> --template modern-geometric --pdf
```

Numara yerine **şablon id**'si kullanmak daha güvenli (manifest yoksa sabit sıraya düşer).

`gallery.json` içindeki `singlePage` alanı `fit` ile aynı ölçümü kullanır.

---

## 5. PDF ve doğrulama

```powershell
node mcp/cli.mjs pdf <slug>                       # → ~/Downloads/<slug>.pdf
node mcp/cli.mjs pdf <slug> --out D:\CV\final.pdf
node mcp/cli.mjs pdf <slug> --url http://localhost:4000
```

`pdf` çıktısı: sayfa sayısı, içerik yüksekliği (px / A4 px), taşma (mm), kırpılan öğe
sayısı, dosya yolu.

Tek komutta tüm teşhis:

```powershell
node mcp/cli.mjs debug <slug>
```

6 katman: ortam → şema → içerik → render → çıktı → uzak API. Rapor:
`%TEMP%\opencode\debug-<slug>.json`.

PDF'in gerçekten tam olduğunu **gözle** doğrulamak istersen metnin sonunu oku
(kırpılmış PDF'te son bölüm eksiktir):

```powershell
python -c "import pymupdf,sys; d=pymupdf.open(sys.argv[1]); print(d.page_count); print(d[0].get_text()[-400:])" "C:\Users\YILMAZ\Downloads\<slug>.pdf"
```

PNG önizleme için:

```powershell
python -c "import pymupdf,sys; p=pymupdf.open(sys.argv[1])[0]; p.get_pixmap(dpi=110).save(sys.argv[2])" "<pdf>" "<png>"
```

---

## 6. Çıkış kodları — boru hattında kullan

| Kod | Anlamı | Ne yapmalı |
|---|---|---|
| 0 | Başarılı | — |
| 1 | Kullanım/ortam hatası (slug yok, dosya yok, sunucu kapalı) | mesajı oku |
| 2 | Doğrulama hatası **veya** A4 taşması | `fit --verbose` → kısalt |
| 3 | Önizleme sunucusu kapalı (pdf) | sunucuyu başlat |

```powershell
node mcp/cli.mjs apply <slug> --file payload.json; if ($LASTEXITCODE -ne 0) { "DUR" }
node mcp/cli.mjs fit <slug>; if ($LASTEXITCODE -eq 2) { "taşma var" }
```

`apply` doğrulama hatası varsa artık kod 2 döner (önceden sessizce 0 dönüyordu).

---

## 7. İçerik kuralları (uydurma yasak)

- Tüm kişisel/iş/eğitim bilgileri **doğrulanmış kaynaktan** gelir:
  `C:\Users\YILMAZ\Downloads\My-Vault\HAKKIMDA.md` ve
  `...\Notlar\2- Yazılım\Portföy\`. Vault'ta olmayanı yazma.
- Devam eden kayıtta `endDate` boş + `current: true`; **"Günümüz" yazılmaz**
  (`normalizeDate` zaten temizler).
- Tarih biçimi `YYYY-MM` veya `YYYY/MM` (normalize edilir).
- Yetkinlik seviyesi 1-5, kullanıcının kendi değerlendirmesi (abartma yok).
- Tek web adresi: `personalInfo.website`; sosyal bağlantı listesine aynı siteyi
  ikinci kez koyma.
- Farklı iş hedefleri için **ayrı taslak** aç; aynı CV'yi iki mesleğe uydurmaya çalışma.
  Alan dışı işi deneyim listesinin **sonuna** al, projelerden iş hedefine uzak olanı çıkar.
- Sektör CV'sinde (ör. öğretmen) proje `technologies` alanını **boş bırak**; teknoloji
  etiketleri yazılım CV'sine ait.

---

## 8. Bilinen tuzaklar

| Belirti | Gerçek sebep | Çözüm |
|---|---|---|
| "Bütçe %99, 1 sayfa" ama PDF'te alt kısım yok | Bütçe karakter sayısıdır, geometri değil | `fit` çalıştır; A4 = 1122.52 px baseline |
| `fit`/`pdf` "hedef sayfa bulunamadı" | Önizleme sunucusu kapalı | `$env:PORT=3010; npx tsx server.ts` |
| Renk değişmiyor | Şablon varsayılanları renkleri eziyordu (düzeltildi) | `template` + renkleri aynı payload'da ver |
| Galeride iki farklı `01-*.png` | Eski çalıştırmanın PNG'leri silinmiyordu (düzeltildi) | galeri artık `NN-*.png`'leri temizler |
| `node -e "..."` → "invalid-structure" | PowerShell tırnak/pipe ayrıştırması | geçici `.mjs` yaz, çalıştır, sil |
| `&&` çalışmıyor | PowerShell 5 kullanılıyor | `;` kullan |
| Playwright `ERR_MODULE_NOT_FOUND` | Betik `%TEMP%`'de, `node_modules` orada yok | betiği `W:\Cv-Master\mcp\` altına yaz veya `NODE_PATH` ver |
| PDF 2 sayfa | `pdf` sayfa sayısını `preferCSSPageSize` ile üretir; A4'ü aşan içerik ikinci sayfa açar | içeriği kısalt, `fit` ile doğrula |

Ölçüm mantığı **tek yerdedir**: `mcp/measure.mjs` (`A4_HEIGHT_PX`, `measureA4`,
`mountDraft`). Ölçüm kodunu başka dosyaya kopyalama — geçmişte 4 kopya ayrışmıştı
(galeri ekran medyasında, PDF print medyasında ölçüyordu).

---

## 9. Hızlı referans

| Komut | Ne yapar | Sunucu |
|---|---|---|
| `schema` | alanlar, 11 şablon, sınırlar | – |
| `create <slug>` | boş taslak | – |
| `apply <slug> --file p.json` | tüm içeriği yaz + doğrula | – |
| `add` / `remove` | tek kayıt ekle/sil | – |
| `style <slug> --template X` | şablon/renk/font | – |
| `validate <slug>` | bütçe + hata kontrolü | – |
| **`fit <slug>`** | **gerçek A4 ölçümü** | ✔ |
| `preview <slug>` | 11 şablon PNG galerisi | ✔ |
| `pick <slug> --template N --pdf` | şablon seç + PDF | ✔ |
| `pdf <slug>` | PDF üret | ✔ |
| `debug <slug>` | 6 katmanlı teşhis | ✔ |
| `export <slug> --downloads` | uygulama JSON'u | – |
| `list` / `read` | taslak listesi / içerik | – |
| `push` / `pull` / `remote` | site API senkronu | – |

Test: `node mcp/test.mjs` (16 test, şablon+renk regresyonu dahil).
