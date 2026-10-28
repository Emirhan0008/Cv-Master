# CV-Master Derinlemesine Analiz

> **Kapsam:** `W:\Cv-Master` — React 19 + Vite 6 + TS + Tailwind CSS v4 + Express + Gemini.
> **Metodoloji:** Kaynak kod incelemesi + `node_modules` içi html2canvas 1.4.1 / jsPDF 4.2.1 kaynak doğrulaması + **canlı tarayıcı oturumunda (http://localhost:3000) runtime ölçümleri ve gerçek PDF export denemesi**. Her iddia `dosya:satır` veya canlı ölçüm kanıtına dayanır.
> **Not:** Kodda değişiklik yapılmamıştır; tek üretilen dosya bu rapordur.

---

## 1. Yönetici Özeti

Kullanıcı şikayeti "PDF'e çevirince hizalar kayıyor" olarak raporlansa da, teknik analiz **iki ayrı ve daha derin sorun** ortaya çıkardı:

1. **Doğrudan PDF export ("PDF İndir") hattı şu anda çöküyor.** Canlı testte `html2canvas`, Tailwind v4'ün ürettiği `oklch()` renk değerini parse edemiyor ve üretim `Attempting to parse an unsupported color function "oklch"` hatasıyla sonlanıyor (kayıtlı console log kanıtı, §2-N1). Uygulamanın kendi workaround'ı (`convertOklchToRgb`) yalnız `<style>` etiketi metnini düzeltiyor; html2canvas'ın SVG elemanlara **computed stili inline olarak kopyalama** davranışını (document-cloner.js:301-303) atladığı için delik kalıyor.
2. **Üretim başarılı olduğunda bile hizalama bozuluyor.** Bunun başlıca mekanizmaları: (a) çok sayfalı dilimlemenin sabit 297 mm kesim mantığı (blok ortasından kesme, son sayfa artığının kaybı, tek sayfa dalında en-boy bozulması), (b) `window.print()` yolunda form panelinin ve global `div { height:auto }` kuralının layout'u ezmesi, (c) html2canvas'ın `text-align: justify`'ı **center** olarak render etmesi, (d) `md:/sm:` responsive kırılımlarının 794 px'lik A4 sayfanın **içinde** pencere genişliğine bağlı çalışması.

**En olası tek kök neden:** `html2canvas 1.4.1` + `Tailwind v4 oklch renkleri` uyumsuzluğu — hem export çökmesini hem de (renkler şeffaf/siyah düştüğünde veya kısmi render'da) "bozulmuş çıktı" algısını doğrudan üretir. İkinci en güçlü aday (kullanıcı gerçekten çok sayfalı PDF alabiliyorsa) **§2-N2'deki pixel-tabanlı sayfa dilimleme** mantığıdır.

---

## 2. PDF Hiza Kayması: Kök Nedenler

### N1 — html2canvas 1.4.1, Tailwind v4'ün `oklch()/oklab()` renklerini parse edemiyor; SVG klonlarına inline kopyalanan stiller workaround'ı baypas ediyor
**Etki: KRİTİK (export tamamen başarısız / renk ve taşma bozulmaları)**

**Belirti:** "PDF İndir" sonrası PDF oluşmuyor ya da renkler/kenarlıklar kayıp, kutular içi boş görünüyor. Canlı testte export **bizzat çöktü**.

**Kanıt 1 — canlı runtime hatası** (Playwright console kaydı, uygulama çalışırken "PDF İndir" butonuna basılarak üretildi):
```
[ERROR] PDF generation error: Error: Attempting to parse an unsupported color function "oklch"
    at Object.parse (html2canvas.js:1673)
    at new CSSParsedDeclaration2 (html2canvas.js:3558)
    at SVGElementContainer2.ElementContainer2 (html2canvas.js:3756)
    at new SVGElementContainer2 (svg-element-container.js)
    at createContainer (node-parser.js) ...
    @ src/App.tsx  (generateDirectPdf catch bloğu)
```

**Kanıt 2 — html2canvas renk parser'ı yalnız rgb/hsl destekliyor** (`node_modules/html2canvas/dist/lib/css/types/color.js:127-132` ve `:13`):
```js
var SUPPORTED_COLOR_FUNCTIONS = { hsl: hsl, hsla: hsl, rgb: rgb, rgba: rgb };
...
throw new Error("Attempting to parse an unsupported color function \"" + value.name + "\"");
```

**Kanıt 3 — SVG elemanlarda computed stiller inline kopyalanıyor** (`node_modules/html2canvas/dist/lib/dom/document-cloner.js:301-303`):
```js
if ((style && (this.options.copyStyles || node_parser_1.isSVGElementNode(node)) && !node_parser_1.isIFrameElement(node)) || copyStyles) {
    exports.copyCSSStyles(style, clone);   // color: oklch(...) değerini inline style olarak basar
}
```
`copyCSSStyles` (`document-cloner.js:471-479`) computed stilin **tüm** özelliklerini `target.style.setProperty(...)` ile klonun üzerine yazar — yani `color: oklch(0.704 0.04 256.788)` ifadesi klon ağacında **inline style** olarak yaşar.

**Kanıt 4 — uygulamanın workaround'ı bu deliği kapatmıyor** (`src/App.tsx:871-876`): yalnız `clonedDoc.querySelectorAll('style')` içindeki CSS **metni** düzeltiliyor:
```ts
clonedDoc.querySelectorAll('style').forEach((tag) => {
  if (tag.textContent && (tag.textContent.includes('oklch') || tag.textContent.includes('oklab'))) {
    tag.textContent = convertOklchToRgb(tag.textContent);
  }
});
```
Inline stiller (`[style]` attribute) ve `color-mix()` sonucu oluşan computed değerler kapsam dışı.

**Kanıt 5 — canlı ölçümler** (tarayıcı, `http://localhost:3000`):
- Önizlemede computed renkler **1045 kez** `oklch(...)` olarak dönüyor (ör. `text-slate-400` → `oklch(0.704 0.04 256.788)`); stiller metninde 207+ ham `oklch(` değeri var.
- Opacity modifier'lı sınıflar (ör. `text-white/90`, `border-white/20`) computed olarak **`oklab(0.999994 ... / 0.9)`** üretiyor — `convertOklchToRgb` bunu da düzeltmiyor (CSS metnindeki `color-mix(in oklab, ...)` ifadesi `oklab(` kalıbıyla eşleşmez, §2-N5).
- Sorunlu değer lucide ikonlarının (`<svg class="lucide lucide-mail ...">`, `stroke="currentColor"`) computed `color` değeri; hata yığınındaki `SVGElementContainer` ile birebir örtüşüyor.

**Etki mekanizması:** `CSSParsedDeclaration` her eleman için (`css/index.js:69,92`) çalıştığından tek bir `oklch` değeri tüm render'ı düşürür. Farklı şablon/zamanda hata tetiklenmezse bile `oklch` → şeffaf/siyah renk ve kaybolan kenarlıklar "kayık" bir çıktı izlenimi verir.

**Çözüm:** §4-D1 (onclone'da `[style]` attribute'larını da normalize et + `color-mix/color()/lab` desteği) veya html2canvas'ın modern klonu olan `html2canvas-pro` / `modern-screenshot`'a geçiş (§6).

---

### N2 — Çok sayfalı dilimleme: sabit 297 mm pixel kesimi, blok ortasından bölme, son sayfa artığı kaybı ve tek sayfa dalında en-boy oranı bozulması
**Etki: KRİTİK (1 sayfadan uzun CV'lerde "hizalar kayıyor"un birebir kaynağı)**

**Belirti:** Önizlemede tek ve kesintisiz görünen CV, PDF'te satırın/paragrafın ortasından kesilerek sayfaya bölünüyor; son satırlar yok oluyor; çok kısa taşmalarda tüm içerik dikey olarak eziliyor.

**Kanıt — `src/App.tsx:960-982`:**
```ts
const pageWidth = 210;  // A4 width in mm
const pageHeight = 297;
const imgWidth = pageWidth;
const imgHeight = (canvas.height * imgWidth) / canvas.width;

if (imgHeight <= pageHeight + 2) {
  // Single Page CV
  pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight), undefined, 'FAST');
} else {
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;
  while (heightLeft > 5) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }
}
```
Teknik alt sorunlar:
1. **Blok ortasından kesme:** Dilimleme tamamen piksel tabanlı; `break-inside: avoid` benzeri bir blok bilgisi yok. 297 mm sınırı bir başlığı/paragrafı ikiye bölebilir. Önizlemede ise hiç sayfa sınırı yoktur (tek akışkan sayfa, `min-h-[297mm]`, `CVPreview.tsx:1490`) — ekran ile PDF geometrik olarak farklı modellerdir.
2. **Son sayfa artığı kaybı:** `while (heightLeft > 5)` koşulu, kalan yükseklik 0-5 mm aralığındaysa yeni sayfa açmaz. Örn. `imgHeight = 598 mm`: 1. sayfa 0-297, 2. sayfa 297-594 gösterir; 594-598 mm arası (4 mm içerik) **hiçbir sayfaya basılmaz**. Kanıt: döngü koşulu App.tsx:976.
3. **En-boy oranı bozulması (aspect squash):** `imgHeight <= pageHeight + 2` dalında `Math.min(imgHeight, pageHeight)` (App.tsx:967) 297-299 mm arası içerikleri 297 mm'ye **ezerek** yerleştirir → %0,7'ye kadar dikey bozulma; kutu/satır yükseklikleri orantısız görünür ("hizalar kayıyor" hissi).
4. **Yuvarlama zinciri:** html2canvas yüksekliği `Math.ceil` ile yuvarlar (`dist/lib/index.js:126`), `imgHeight` mm'ye `(canvas.height * 210) / canvas.width` ile çevrilir (App.tsx:963); her adımda ≤1 px'lik kaymalar sayfa sınırında ~0,3 mm'ye denk gelir ve 2. sayfadan itibaren blokların dikey kaymasına neden olur.

**Çözüm:** §4-D2 (canvas'ı sayfa sayfa dilimleyen, artığı da basan, oranı bozmayan döngü).

---

### N3 — `window.print()` yolunda: form paneli yazdırılıyor, global `div { height:auto }` kuralı layout'u eziyor, `break-inside: avoid` dev blokları kaçırıyor
**Etki: KRİTİK (kullanıcı "yazdır → PDF olarak kaydet" yolunu kullanıyorsa şikayetin doğrudan kaynağı)**

**Kanıt 1 — form ve mobil konteynerlerde `no-print` yok:** `src/App.tsx:1401` (`<div className="hidden md:flex w-full h-full ...">`), `src/App.tsx:1571` (`<div className="flex md:hidden ...">`) ve `src/components/CVForm.tsx:980` (`<div className="flex flex-col h-full ...">`) — hiçbiri `no-print` değil. `index.css:42-51` yalnız `header, footer, aside, button, .no-print` gizler. (`aside` gizlendiği için sağ/sol drawer'lar gitse de, `hidden md:flex` sarmalayıcı ve mobil blok kalır.)
**Kanıt 2 — print anında inline padding ezilmiyor:** `src/App.tsx:1556-1559` → `paddingLeft/Right: 420px` (drawer açıkken) inline style olarak durur; `@media print` bunu sıfırlamaz → 794 px'lik CV sayfası 840 px padding içine sıkışır/taşar.
**Kanıt 3 — global kural tüm sabit yükseklikleri yok eder:** `src/index.css:33-40`:
```css
#root, main, aside, div {
  overflow: visible !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
}
```
`h-28` avatar sarmalayıcıları, `h-[2px]` ayırıcılar, ilerleme çubukları `height:auto` ile ezilir → PDF'te sütun yükseklikleri ekrandan farklı olur.
**Kanıt 4 — aşırı geniş kaçınma:** `src/index.css:80-85` → `#cv-preview-page .group { break-inside: avoid !important }`. `.group` sınıfı CVPreview'da tüm deneyim/eğitim bloklarında kullanılıyor (`CVPreview.tsx:371,388,596,...`) → dev bloklar sayfa sonundan kaçar, sayfa dibinde büyük beyaz boşluklar oluşur.
**Kanıt 5 — `@page` doğru:** `src/index.css:11-14` (`size: A4 portrait; margin: 0`) ve `print-color-adjust: exact` (`:23-24`) uygun.

**Çözüm:** §4-D4 (print CSS'i `#cv-preview-page` kapsamına alma + `no-print` ekleme + `.group` yerine hedefli `break-inside`).

---

### N4 — `text-align: justify` html2canvas'ta **center** olarak render ediliyor
**Etki: ORTA (özet/açıklama paragraflarının sağ kenarı PDF'te düzensiz; "hizalama kaydı" olarak görülür)**

**Kanıt 1 — kullanım:** `src/components/CVPreview.tsx:1166` (`text-slate-600 leading-relaxed text-justify whitespace-pre-wrap`), `:1721`, `:2046`.
**Kanıt 2 — html2canvas eşlemesi** (`node_modules/html2canvas/dist/lib/css/property-descriptors/text-align.js:7-15`):
```js
case 'right': return RIGHT;
case 'center':
case 'justify': return CENTER;   // justify -> center!
```
Metin satırları `Range.getClientRects()` ile ölçülür (`css/layout/text.js:20-45`) ve `ctx.textAlign='left'` ile satır başına çizilir; justify'ın iki yana yaslama boşlukları yeniden üretilmez → sağ kenar ekranda düz, PDF'te kayık.

**Çözüm:** Şablonlarda `text-justify` yerine `text-left`, veya kabul edilebilir ise rapor notu.

---

### N5 — `color-mix()` (opacity modifier) değerleri dönüştürücünün dışında kalıyor
**Etki: ORTA (şablon ve sınıfa göre renk/kenarlık kaybı veya N1 ile birleşip çökme)**

**Kanıt 1 — Tailwind v4 opacity modifier üretimi (canlı ölçüm):** `text-white/90` → `getComputedStyle().color = "oklab(0.999994 0.0000455678 0.0000200868 / 0.9)"`, `border-white/20` → `oklab(... / 0.2)`.
**Kanıt 2 — CSS metninde `color-mix` mevcut (canlı ölçüm):** `color-mix(in oklab, currentcolor 50%, transparent)`, `color-mix(in oklab, #2D3139 40%, transparent)` vb.
**Kanıt 3 — dönüştürücünün regex kapsamı:** `src/App.tsx:68-69` yalnız `oklch(...)`/`oklab(...)` kalıplarını yakalar; `color-mix(in oklab, X %, transparent)` metni `oklab(` ile eşleşmez ve **computed sonuç** zaten `oklab(...)`/`color(srgb ...)` olarak döner ki bunlar da html2canvas'ta desteksizdir (`color.js:127-132`). Ayrıca `App.tsx:119-120`'deki catch-all `oklch\([^)]+\)` iç içe parantezli değerlerde (ör. `calc(...)`) kısır kalır.
**Kanıt 4 — kullanım yoğunluğu:** `text-white/90`, `border-white/20`, `bg-white/95`, `border-slate-300/40` vb. `split-sidebar`/`depth3d` şablonlarında yaygın (`CVPreview.tsx:388,1503,1510,1522`).

**Çözüm:** §4-D1'e `color-mix()` çözümlemesi eklemek veya `html2canvas-pro`'ya geçiş.

---

### N6 — Yazı tipi yarışması ve `text-rendering` enjeksiyonu
**Etki: ORTA (satır kırılmaları ve dolayısıyla sütun yükseklikleri ekrandan farklı olabilir)**

**Kanıt 1 — font bekleme yalnız ana belge için:** `src/App.tsx:803-805` → `await document.fonts.ready` (owner document). html2canvas ise belgeyi bir **klon iframe**'e kopyalar (`document-cloner.js:273`+); iframe'in kendi `FontFaceSet`'i vardır ve html2canvas webfont yüklenmesini beklemez (`toIFrame` yalnız `load` + görsel havuzu bekler, `document-cloner.js` iframeLoader). Klon anında font hazır değilse metrikler fallback font ile ölçülür → satır kaymaları.
**Kanıt 2 — ekran ve capture arasında tipografik fark:** `src/App.tsx:854-858` onclone içinde `* { text-rendering: geometricPrecision !important; -webkit-font-smoothing: antialiased !important; }` enjekte ediliyor. `text-rendering: geometricPrecision` kerning/harf genişliklerini değiştirir; ekran (buna tabi değil) ile capture farklı ölçüm yapar.
**Kanıt 3 — fontlar Google Fonts'tan:** `index.html:6-8` ve `src/index.css:1` (Inter, Space Grotesk, Playfair Display, JetBrains Mono). Doğrulandı: canlı sayfada `document.fonts.status = "loaded"`.
**Not:** `text-align: justify` (N4) ile birleşince satır içi boşluk dağılımı da değişir.

**Çözüm:** §4-D3 (aile bazlı `document.fonts.load(...)` bekleme + `geometricPrecision` kaldırma).

---

### N7 — Yinelenen DOM kimlikleri: stabilize edilen eleman yakalanan eleman olmayabilir
**Etki: ORTA (mobil/çift render senaryolarında transform, gölge, kenarlık temizliği yanlış elemana uygulanır)**

**Kanıt 1 — canlı ölçüm:** `document.querySelectorAll('#cv-preview-page').length === 2` ve `#cv-zoom-wrapper` için `=== 2` (App desktop + mobil olmak üzere `<CVPreview>` iki kez basılıyor: `src/App.tsx:1564` ve `:1623`).
**Kanıt 2 — seçim mantığı:** `src/App.tsx:790-797` (`getTargetPreviewElement`) ilk görünür elemanı seçer; ama onclone içindeki `clonedDoc.getElementById('cv-zoom-wrapper')` (`:879`) ve `getElementById('cv-preview-page')` (`:889`) **ilk** eşleşmeyi döndürür. Mobilde yakalanan 2. örnek, stabilize edilen ise 1. örnektir.
**Kanıt 3 — diğer tekil-ID kullanımları:** `src/components/CVPreview.tsx:228` (yükseklik ölçümü `document.getElementById('cv-preview-page')` — mobilde gizli elemanı ölçer), `src/App.tsx:814` (fallback `document.getElementById('cv-zoom-wrapper')`).
Ayrıca HTML'de `id` yinelenmesi geçersiz yapıdır; `#cv-preview-page` seçimli CSS kuralları (`index.css:97-119`) yanlış elemana da uygulanır.

**Çözüm:** ID yerine `data-cv-page` / `data-cv-zoom` attribute + `querySelector`, veya React `ref` üzerinden yakalama.

---

### N8 — Responsive kırılımlar (`md:`/`sm:`) 794 px'lik A4 sayfanın **içinde** pencereye bağlı çalışıyor
**Etki: ORTA (aynı CV, pencere genişliğine göre farklı sütun düzeninde PDF'e dönüşüyor — "hiza" tutarsız)**

**Kanıt — `src/components/CVPreview.tsx`:** `:596` (`flex flex-col md:flex-row`), `:608` (`text-2xl md:text-3xl`), `:1020-1028` (`w-full sm:w-[48%] mr-[2%]`), `:1299` (`grid grid-cols-1 md:grid-cols-2 gap-4`). Bunlar **viewport** genişliğine göre kırılır; oysa CV sayfası her zaman 794 px'tir (`CVPreview.tsx:1486-1488`). 768 px'ten dar bir pencerede tek sütunlu, geniş pencerede iki sütunlu CV üretilir. html2canvas klon iframe'i `windowWidth: window.innerWidth` ile açtığından (`dist/lib/index.js` renderElement) ekranla PDF aynı olur; ancak **farklı oturumlarda farklı PDF** çıkar.

**Çözüm:** Şablon kırılımlarını `container query`'ye taşımak ya da sabit `794px` altında statik düzen kullanmak.

---

### N9 — px → mm dönüşümü ve ölçek/çözünürlük hesabı (kısmen doğru)
**Etki: DÜŞÜK**

**Kanıt — `src/App.tsx:842-848` (`scale: 2`, `width: 794`) + `:953-963`:** jsPDF `unit: 'mm'`, `format: 'a4'` doğru. 794 px @96dpi = 209,97 mm; `imgWidth = 210` mm olarak basıldığından yatayda %0,016 gerilme var (gözle görülmez). `scale: 2` → 1588 px / 210 mm ≈ 7,56 px/mm ≈ **192 dpi**, baskı için yeterli. `Math.ceil` yükseklik yuvarlaması (html2canvas `dist/lib/index.js:126`) ≤1 px sapma üretir. Teknik olarak sağlam; asıl bozulma N2'den gelir.

---

### N10 — html2canvas'ın desteklemediği görsel efektler
**Etki: DÜŞÜK (kaybolan süslemeler; hizadan çok görünüm farkı)**

**Kanıt:** `CVPreview.tsx:1493-1497` (`blur-[80px]` dekoratif daireler — `no-print` ile gizli), `:388` (`inset_0_1px_2px_rgba(...)` iç gölgeler), `:602` (`[transform:translateZ(15px)]`), `:196-199/1381` (3D `rotateX/rotateY` perspektif). html2canvas'ta `box-shadow` kısmi (`dist/lib/css/property-descriptors/box-shadow.js`), `filter: blur` ve 3D perspektif desteklenmez; `transform` parser yalnız `matrix/matrix3d` kabul eder (`transform.js:28-30`), tarayıcı computed değeri matrix3d'ye indirdiğinde sorun çıkmaz ama perspektif kaybolur.

---

### N11 — Görseller ve CORS (genel olarak doğru, küçük yarışlar var)
**Etki: DÜŞÜK**

**Kanıt — `src/App.tsx:704-780` (`inlineImagesForCapture`):** dış görseller (Unsplash avatar vb.) base64'e çevrilerek canvas taint'i önleniyor; `useCORS: true`, `allowTaint: false` (`:844-845`) doğru kombinasyon. Zayıf nokta: `toDataUrl` fallback'inde `testImg.complete` senkron kontrolü (`:729`) asenkron yüklemede güvenilmez; `imageTimeout` varsayılan 15 sn bırakılmış. Profil fotoğrafı `crossOrigin="anonymous"` + `referrerPolicy="no-referrer"` ile işaretli (`CVPreview.tsx:1511-1512`) — uygun.

---

### N12 — Çift indirme tetikleniyor
**Etki: DÜŞÜK (kullanıcı iki dosya görür; "bozuk çıktı" algısını besleyebilir)**

**Kanıt — `src/App.tsx:989` (`pdf.save(fileName)`) ve `:992-1007` (blob fallback ikinci bir `downloadLink.click()`)** → her export'ta iki indirme.

---

## 3. Doğrulama Planı

Her hipotezi lokalde şu adımlarla izole edebilirsiniz (geçici değişiklikler, commit edilmez):

1. **N1 (oklch çökmesi):**
   - Chrome'da http://localhost:3000 aç → "PDF İndir" → F12 Console: `Attempting to parse an unsupported color function "oklch"` görmelisin (bu raporda zaten doğrulandı).
   - `onclone` içine geçici olarak `clonedDoc.querySelectorAll('[style]').forEach(el => { const s = el.getAttribute('style'); if (s && /oklch|oklab/.test(s)) el.setAttribute('style', convertOklchToRgb(s)); });` ekle ve tekrar dene. Hata kayboluyorsa kök neden doğrulanmış olur.
   - Alternatif teşhis: Console'da `getComputedStyle(document.querySelector('#cv-preview-page svg.lucide')).color` → `oklch(...)` görmelisin.
2. **N2 (dilimleme):** 2 sayfayı aşan bir CV ile "PDF İndir". 297 mm'ye denk gelen satırın ikiye bölündüğünü gör; `imgHeight`'ı `App.tsx:963` sonrasına `console.log(imgHeight, heightLeft)` ekleyerek izle; son 5 mm'lik içeriğin PDF'te olmadığını doğrula. Ardından §4-D2 yamasını uygula ve aynı CV ile karşılaştır.
3. **N3 (print):** Bir yan panel açıkken Ctrl+P → "PDF olarak kaydet". CV'nin yarı genişliğe sıkıştığını/yanında form çıktığını gör. `App.tsx:1401` ve `:1571`'e `no-print`, `index.css:35`'teki `div` seçicisini `#cv-preview-page *` ile sınırla ve tekrar dene.
4. **N4 (justify):** Özet alanı dolu bir CV ile `text-justify`'ı `text-left` yapıp iki PDF'i karşılaştır; sağ kenar düzelirse doğrulandı.
5. **N5 (color-mix):** `split-sidebar` şablonuna geç ve PDF al; kenarlıkların/şeffaf katmanların kayıp olduğunu gör. Console'da `oklab(` hatası ara.
6. **N6 (font):** Network sekgesinde "Slow 3G" throttle + cache temizle → PDF al; satır kırılmalarının değiştiğini gör. `document.fonts.load('700 16px "Space Grotesk"')` bekleme ekleyip farkı ölç.
7. **N7 (yinelenen ID):** Console: `document.querySelectorAll('#cv-preview-page').length` → `2` (doğrulandı). `getTargetPreviewElement` içine seçilen elemanın `dataset` işaretini logla ve onclone'daki `getElementById` ile aynı olduğunu doğrula.
8. **N8 (responsive):** Pencereyi 700 px ve 1400 px yapıp aynı CV'yi iki kez PDF'e çevir; beceriler ızgarasının 1 vs 2 sütun olduğunu karşılaştır.

---

## 4. Önerilen Düzeltmeler (kod örnekleriyle)

### D1 — oklch/oklab/color-mix kırılması: onclone'da inline stilleri de normalize et (N1 + N5)
Mevcut `captureCVToCanvas` içindeki `onclone`'a, mevcut `convertOklchToRgb`'yi bozmadan şu bloğu ekleyin (App.tsx:871-876'dan hemen sonra):

```ts
// 1) Klonlanmış inline stiller (html2canvas'ın SVG'lere kopyaladığı computed değerler dahil)
clonedDoc.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
  const s = el.getAttribute('style');
  if (s && /oklch|oklab|color-mix|color\(/i.test(s)) {
    el.setAttribute('style', convertOklchToRgb(s));
  }
});

// 2) color-mix() / color(srgb ...) desteği için dönüştürücüyü genişletin (App.tsx:118'den önce)
cleaned = cleaned.replace(/color-mix\(\s*in\s+[a-z-]+\s*,\s*([^,]+?)\s+(\d+(?:\.\d+)?%)\s*,\s*transparent\s*\)/gi,
  (_m, base, pct) => {
    const alpha = parseFloat(pct) / 100;
    const rgb = convertOklchToRgb(base).replace(/^rgb\(/, 'rgba(').replace(/\)$/, `, ${alpha})`);
    return rgb;
  });
cleaned = cleaned.replace(/color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/gi,
  (_m, r, g, b, a) => `rgba(${Math.round(+r * 255)}, ${Math.round(+g * 255)}, ${Math.round(+b * 255)}, ${a ? (a.includes('%') ? parseFloat(a) / 100 : parseFloat(a)) : 1})`);
```

> Daha kalıcı çözüm: `html2canvas` yerine **`html2canvas-pro`** (oklch/oklab/lab/color-mix destekli drop-in fork) kullanmak — `import html2canvas from 'html2canvas-pro'` dışında çağrı noktası aynı kalır.

### D2 — Sayfa dilimleme: oranı bozmayan, artığı da basan, blok bilgisini koruyan döngü (N2)
`generateDirectPdf` içindeki `if (imgHeight <= pageHeight + 2) { ... } else { ... }` bloğunun tamamını (App.tsx:965-982) değiştirin:

```ts
const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
const MM_PER_PX = 210 / canvas.width;              // 794px -> 209.97mm; oran korunur
const pageHeightPx = 297 / MM_PER_PX;              // bir A4'e sığan piksel yüksekliği

let offsetY = 0;
let pageIndex = 0;
while (offsetY < canvas.height) {
  const sliceH = Math.min(pageHeightPx, canvas.height - offsetY);
  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = canvas.width;
  pageCanvas.height = Math.ceil(sliceH);
  pageCanvas.getContext('2d')!.drawImage(
    canvas,
    0, offsetY, canvas.width, sliceH,          // kaynak dilim
    0, 0, canvas.width, sliceH                 // hedef (oran birebir)
  );
  if (pageIndex > 0) pdf.addPage();
  pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0,
    210, sliceH * MM_PER_PX, undefined, 'FAST');
  offsetY += pageHeightPx;
  pageIndex++;
}
```
Etkiler: son sayfa artığı asla kaybolmaz, dikey ezilme olmaz, her sayfa tam 297 mm'ye oturur. Blok ortasından kesmeyi tamamen engellemek için (opsiyonel) dilim sınırını en yakın `data-break-safe="true"` işaretli elemanın üstüne kaydırmak üzere §6-3'teki yaklaşım önerilir.

### D3 — Font garantisi ve tipografi tutarlılığı (N6)
`captureCVToCanvas` başındaki `document.fonts.ready` bloğunu (App.tsx:803-805) genişletin ve `geometricPrecision` enjeksiyonunu (App.tsx:856) kaldırın:

```ts
const families = ['Inter', 'Space Grotesk', 'Playfair Display', 'JetBrains Mono'];
const weights = [400, 500, 600, 700];
await Promise.all(
  families.flatMap((f) => weights.map((w) =>
    document.fonts.load(`${w} 16px "${f}"`).catch(() => undefined)))
);
await document.fonts.ready;
```

### D4 — Print CSS onarımı (N3)
`src/index.css` içinde:
```css
/* ESKİ (çok geniş):  #root, main, aside, div { height:auto !important; ... }  */
/* YENİ: yalnız CV ağacını serbest bırak */
#cv-preview-page, #cv-preview-page * {
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
}
/* ESKİ: #cv-preview-page .group { break-inside: avoid } */
/* YENİ: sadece gerçekten bölünmemesi gereken küçük birimler */
#cv-preview-page [data-break-safe="true"] { break-inside: avoid !important; page-break-inside: avoid !important; }
```
`src/App.tsx:1401` ve `:1571`'deki sarmalayıcılara `no-print` sınıfı ekleyin; `:1556-1559`'daki inline `paddingLeft/Right` için `@media print { #cv-print-area { padding: 0 !important } }` ilave edin.

### D5 — Yinelenen ID'lerin kaldırılması (N7)
`CVPreview.tsx:1481` → `id="cv-preview-page"` yerine `data-cv-page`; `:1469` → `data-cv-zoom`. Tüm seçimler: `document.querySelectorAll('[data-cv-page]')`, onclone içinde:
```ts
const pages = Array.from(clonedDoc.querySelectorAll<HTMLElement>('[data-cv-page]'));
const target = pages.find((el) => el.getBoundingClientRect().width > 0) ?? pages[0];
```

### D6 — Çift indirmeyi engelleme (N12)
`App.tsx:991-1007`'deki blob fallback'i yalnız `pdf.save` hata fırlatırsa çalıştırın (`try { pdf.save(fileName); } catch { /* blob fallback */ }`).

---

## 5. Diğer Bulgular (mimari, performans, güvenlik)

**Mimari**
- **Bileşen hacmi:** `CVPreview.tsx` ~2544, `CVForm.tsx` ~3293, `App.tsx` ~1848 satır. PDF motoru (`captureCVToCanvas`, `generateDirectPdf`, `convertOklchToRgb`) `App.tsx:21-1066` içinde yaşıyor; ayrı bir `src/utils/pdfExport.ts` modülüne taşınmalı. `CVPreview.tsx` şablon başına (`templates/` klasörü) bölünebilir; `renderSectionHeader` benzeri yardımcılar (":409-600") zaten kısmi soyutlama.
- **State yönetimi:** Tüm durum `App.tsx` içinde tek seviyede (`cvData`, `savedCVs`, `cvHistory`, 10+ UI flag). Prop drilling yoğun (`CVForm` 15+ prop alıyor, `CVForm.tsx:1532-1550`). `useReducer` veya context mantıklı.
- **Undo geçmişi sınırsız:** `src/App.tsx:204` (`setCvHistory(prev => [...prev, ...])`) her değişiklikte tüm `CVData` kopyası ekler; uzun oturumda bellek ve localStorage yazım yükü artar (50 adım sınırı önerilir).
- **Veri kalıcılığı üçlüsü:** Kodda **Firestore kullanılmıyor** — `src/lib/firebase.ts` yalnız Firebase Auth + Drive scope'ları içeriyor (doğrulandı). Gerçek mimari: `localStorage` (`cv_builder_saved_cvs`, App.tsx:277-307) + **Cloud SQL/Postgres** (`src/db/index.ts`, drizzle) + `localFileDb` dosya tabanlı fallback (`src/db/repository.ts:19-23` tüm sorgularda) + Google Drive senkronu (`server.ts:115-216`). Risk: fallback sessizce devreye girdiğinde iki veri kaynağı (localStorage ↔ Postgres) kopyalanır; `App.tsx:546`'daki merge mantığı tek yönlü. "Firestore" beklentisi kodda yok — doğrulanamadı.

**Performans**
- `html2canvas({ scale: 2 })` çok sayfalı CV'de 1588×~3500 px canvas + her sayfada tam görsel `addImage` (jsPDF aynı görsel nesnesini tekrar kullanır, ancak D2'deki dilimleme belleği düşürür).
- Her tuş vuruşunda `localStorage`'a tüm CV listesi `JSON.stringify` ediliyor (App.tsx:351,435,...) — debounce önerilir.
- `CVPreview` her render'da tüm şablon ağacını yeniden üretiyor; `React.memo`/`useMemo` yok (yalnız `useRef`/`useState`), `ResizeObserver` kullanımı yerinde (CVPreview.tsx:210-225).

**Güvenlik**
- **`/api/db-diagnostics` kimliksiz ve SQL_HOST/SQL_USER/SQL_DB_NAME gibi ortam değişkenlerini + stack trace döndürüyor** (`server.ts:25-61`) — KRİTİK bilgi sızıntısı; `requireAuth` eklenmeli veya production'da kapatılmalı.
- **AI uç noktaları kimliksiz:** `POST /api/ai/import-cv` (`server.ts:241`) ve `POST /api/ai/optimize-text` (`server.ts:330`) `requireAuth` içermiyor → Gemini kotası suistimal edilebilir.
- `.env` gitignore'da (`.gitignore:5` → `.env*`), `GEMINI_API_KEY` sunucu tarafında (server.ts:230) — doğru desen. Firebase web config'i public olması normal (`firebase-applet-config.json`).
- XSS: `dangerouslySetInnerHTML` yok (yalnız App.tsx:854'teki sabit stil şablonu), `sanitizeCVData` (`src/utils/sanitizer.ts`) yapısal normalizasyon yapıyor ve React metni kaçırıyor — risk düşük. Not: `sanitizeCVData` HTML escape yapmaz; içerik ileride HTML olarak render edilirse yeniden değerlendirilmeli.

---

## 6. Öncelikli Yol Haritası

| # | İş | Etki | Tahmini |
|---|----|------|---------|
| P0 | **D1** — oklch/oklab/color-mix normalize (inline style geçişi) veya `html2canvas-pro`'ya geçiş | Export'ın çalışması (N1/N5) | 0,5-1 gün |
| P0 | **D2** — sayfa dilimleme döngüsünün yeniden yazımı | Çok sayfalı hizalama (N2) | 0,5 gün |
| P1 | **D4** — print CSS onarımı + `no-print` | Yazdırma/PDF hizası (N3) | 0,5 gün |
| P1 | **D3** — font yükleme garantisi, `geometricPrecision` kaldırma | Satır/sütun tutarlılığı (N6) | 2-3 saat |
| P1 | **D6** — çift indirme kaldırma | UX | 15 dk |
| P2 | **D5** — yinelenen ID temizliği (data-attribute + ref) | Sağlamlık (N7) | 2-3 saat |
| P2 | Şablonlardaki `md:/sm:` kırılımlarını sabit A4 düzenine taşıma | Çıktı tutarlılığı (N8) | 1 gün |
| P2 | `text-justify` → `text-left` (veya justify destekli render yolu) | Tipografik hiza (N4) | 1 saat |
| P3 | `/api/db-diagnostics` ve AI uç noktalarına `requireAuth` | Güvenlik | 1 saat |
| P3 | PDF motorunu `src/utils/pdfExport.ts`'e taşıma + bileşen bölme, debounce, undo sınırı | Bakım/performans | 2-3 gün |