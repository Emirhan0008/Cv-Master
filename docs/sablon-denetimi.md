# Şablon Denetimi — 11 Tasarım Karşılaştırması

Kaynak: `src/components/CVPreview.tsx` (2728 satır). Tüm satır numaraları bu dosyaya aittir.
Ölçüm araçları: `node mcp/tpl-verify.mjs`, `node mcp/overlap-check.mjs`, `node mcp/tpl-pdf-check.mjs`.

Altı boyut: (1) profil fotoğrafı, (2) iletişim etiketi türü, (3) beceri kategori başlığı,
(4) kolon düzeni, (5) bölüm sırası, (6) bilinen görsel riskler.

Ortak yardımcılar:
`isGenericCategory` 188–207, `shouldShowCategoryHeader` 209–213 (ad yoksa, `skills.length <= 1` ise veya ad genelse başlık basılmaz),
`renderSidebarSectionHeader` 652–663 (yalnız split-sidebar), yazı boyutu ölçeği 526–556, yoğunluk/boşluk haritaları 559–594,
`getBlockCardClass` 615–627, arka plan stilleri 630–645, `isSidebarTemplate` listesi 603.

## Özet tablo

| # | Şablon | Fotoğraf | İletişim etiketi | Beceri kategori başlığı | Kolon düzeni | Bölüm sırası | Satır aralığı | Ana risk |
|---|---|---|---|---|---|---|---|---|
| 1 | corporate | Var — yuvarlak, `w-24 h-24 rounded-full`, 1321 | 5 lucide ikon + 3 kelime etiketi (`Doğum Yeri:` 1375, `Medeni Durum:` 1384, `Ehliyet:` 1393) + `platform:` | Basılıyor, 1585–1589 | Tek kolon (`flex flex-col`, 2878) | `sectionOrder` 2881 | 1317–1427 (header 817–828) | Tek kolon + sayfa `overflow-hidden` (1798) taşan içeriği sessizce kırpar |
| 2 | modern | Var — kare, `w-24 h-24 rounded-xl`, 924 | 5 lucide ikon + 3 kelime etiketi (978/987/996) + `platform:` | Basılıyor, 1585–1589 | Tek kolon (2878) | `sectionOrder` 2881 | 920–1030 (header 684–699) | `rounded-xl` kare fotoğraf; 10 px kelime etiketleri |
| 3 | depth3d | Var — kare, `w-24 h-24 rounded-2xl` + `translateZ(15px)`, 836 | 5 lucide ikon + 3 kelime etiketi (880/886/892) + `platform:` | Basılıyor, 1585–1589 | Kök `grid grid-cols-2` (2877); beceri `md:grid-cols-3` (1582) | `sectionOrder` 2881 (grid içinde) | 832–917 (header 670–681) | `grid-auto-flow:dense` bölüm sırasını görsel olarak kaydırabilir; `translateZ` baskıda kayma |
| 4 | modern-geometric | Var — SVG `<image href>` ile çiziliyor, 2007–2043 (image 2029) | 8 lucide ikon + `platform:` (2061–2129) | Basılıyor, 2151–2155 (`text-[8px]`) | İki kolon: `w-[34%]` 2005 / `w-[66%]` 2174 | `sectionOrder`, personal+summary+skills filtrelenir (2197–2199) | 2001–2215 (header 702–715) | Fotoğraf `<img>` değil → `img[src^="data:"]` seçicileri ve html2canvas görmez |
| 5 | split-sidebar | Var — yuvarlak, `w-20 h-20` / `w-32 h-32`, 1829 | 8 lucide ikon + `platform:` (1843–1909, platform 1900–1905) | Basılıyor, 1929–1933 (`text-[9px]`) | İki kolon: `w-[34%]` 1827 / `w-[66%]` 1960 | `sectionOrder`, personal+skills filtrelenir (1982–1984) | 1823–2000 (header 718–731) | Kenar çubuğu `overflow-hidden` (1825) + `rounded-br-[45px]` (1827) köşede içerik kırpar |
| 6 | minimalist-clean | Var — yuvarlak, `w-16 h-16` compact / `w-24 h-24`, 1038 | 5 lucide ikon + 3 kelime etiketi (1092/1101/1110, `text-[9px]`) + `platform:` | Basılıyor, 1585–1589 | Tek kolon (2878) | `sectionOrder` 2881 | 1033–1143 (header 734–745) | Compact yoğunlukta fotoğraf 64 px'e iner; en küçük portre |
| 7 | editorial-serif | Var — yuvarlak + `grayscale`, `w-16` / `w-24`, 1151 | 5 lucide ikon + 3 kelime etiketi (1205/1214/1223) + `platform:` | Basılıyor, 1585–1589 | Tek kolon (2878) | `sectionOrder` 2881 | 1146–1256 (header 748–759) | `grayscale` baskıda soluk portre; serif + 10 px etiket dengesi |
| 8 | tech-mono | Var — kare, `rounded`, `w-14 h-14` / `w-20 h-20`, 1264 | Kod etiketi: 8/8 alan (`email:` 1292, `phone:` 1293, `address:` 1294, `birthDate:` 1295, `birthPlace:` 1296, `maritalStatus:` 1297, `driverLicense:` 1298, `site:` 1301) + `platform.toLowerCase():` 1308 | Basılıyor, 1585–1589 | Tek kolon (2878); iletişim `w-full sm:w-[48%]` ızgara (1291) | `sectionOrder` 2881 | 1259–1314 (header 801–814) | `font-mono` kod etiketleri bilinçli tercih; `w-[48%]` baskıda tek kolona düşebilir |
| 9 | crimson-split | Var — yuvarlak, `w-28 h-28` / `w-36 h-36`, 2222 | 8 lucide ikon + `platform` (2248–2321; `Sosyal Medya / Bağlantılar` 2307 `text-[8px]`) | Basılıyor, 2345–2348 (`text-[9px]`, düz metin — düzenlenemez) | İki kolon: `w-[34%]` 2220 / `w-[66%]` 2366 | `sectionOrder`, personal+summary+skills filtrelenir (2395–2397) | 2216–2413 (header 762–770) | Kategori adı `Editable` değil (2347); 8 px başlık ve platform etiketi |
| 10 | teal-timeline | Var — yuvarlak, `w-26 h-26` / `w-34 h-34`, 2425; `-inset-1.5` halka 2429 | 8 lucide ikon + 6 kelime etiketi (2473/2482/2491/2500/2509/2520, `text-[8px]`) + `platform:` 2523 | Basılıyor, 2554–2557 (`text-[8px]`) | İki kolon: `w-[34%]` 2418 / `w-[66%]` 2591 | `sectionOrder`, personal+summary+skills filtrelenir (2623–2625) | 2414–2641 (header 773–781) | Mutlak konumlu `-inset-1.5` halka + animasyon; kenar çubuğu `overflow-hidden` 2416/2418 |
| 11 | dark-gold-arch | Var — yuvarlak, `w-22 h-22` / `w-30 h-30`, 2654; `-inset-1` degrade halka 2656 | 8 lucide ikon + 6 kelime etiketi (2719/2728/2737/2746/2755/2764, `text-[8px]`) + `platform:` 2768 | Basılıyor, 2801–2805 (`text-[8px]`) | İki kolon: `w-[34%]` 2646 / `w-[66%]` 2831 | `sectionOrder`, personal+summary+skills filtrelenir (2846–2848) | 2642–2866 (header 784–798) | `overflow-hidden` (2644) + degrade halka; 8 px etiketler |

## 1. corporate

- **Fotoğraf:** var. `836/924/…` dışındaki varsayılan dal; `personalInfo.photoVisible && personalInfo.avatarUrl` kapısı 1321, `img` etiketi 1321–1328, sınıf `w-24 h-24 rounded-full object-cover border border-slate-300 shadow-inner` → yuvarlak, 96 px.
- **İletişim etiketi:** 5 alan lucide ikonla (Mail/Phone/MapPin/Calendar/Globe aralığı 1337–1417), 3 alan kelime etiketiyle: `Doğum Yeri:` 1375, `Medeni Durum:` 1384, `Ehliyet:` 1393; sosyal bağlantılar `<span>platform:</span>` biçiminde. Harf kısaltması (`T:`, `@:`) yok.
- **Beceri kategori başlığı:** `shouldShowCategoryHeader` 209–213 kapısından geçer, 1585–1589'da `<h5>` + `Editable` olarak basılır; ad genelse (188–207) gizlenir.
- **Kolon düzeni:** tek kolon; kök `flex flex-col` 2878.
- **Bölüm sırası:** `sectionOrder.map` 2881 — kullanıcı sırasına tamamen açık.
- **Risk:** sayfa `min-h-[297mm]` + `overflow-hidden` (1798) olduğu için tek kolonda taşan son bölüm uyarı vermeden kırpılır; uzun özet + 4 deneyim bu şablonda en hızlı taşan kombinasyondur.

## 2. modern

- **Fotoğraf:** var, 924–931; `w-24 h-24 rounded-xl object-cover border border-slate-200` — kare (12 px köşe), 96 px.
- **İletişim etiketi:** 940–1020 aralığında 5 lucide ikon; kelime etiketleri `Doğum Yeri:` 978, `Medeni Durum:` 987, `Ehliyet:` 996; sosyal bağlantılarda `platform:`.
- **Beceri kategori başlığı:** 1585–1589, `shouldShowCategoryHeader` (209–213) ile aynı kapı.
- **Kolon düzeni:** tek kolon (2878).
- **Bölüm sırası:** `sectionOrder.map` 2881.
- **Risk:** `rounded-xl` kare portre, yuvarlak fotoğraf bekleyen kullanıcıda "kırpılmamış" hissi verir; ayrıca 10 px büyük harf kelime etiketleri (`Doğum Yeri:` vb.) iki kolonlu şablonlara göre daha çok yer kaplar.

## 3. depth3d

- **Fotoğraf:** var, 836–843; `w-24 h-24 rounded-2xl` + `[transform:translateZ(15px)]` + `border-4 border-violet-100` — kare, 96 px, 3B kalkık.
- **İletişim etiketi:** 853–907; 5 lucide ikon, kelime etiketleri 880/886/892, sosyal `platform:`.
- **Beceri kategori başlığı:** 1585–1589; ayrıca beceri ızgarası `grid-cols-1 md:grid-cols-3` (1582) olduğu için başlık üç kolonun üstünde tek satır kalır.
- **Kolon düzeni:** kök `grid grid-cols-2` + `[grid-auto-flow:dense]` (2877); kartlar `getBlockCardClass` 615–627.
- **Bölüm sırası:** `sectionOrder` 2881'den gelir, ancak grid akışına bırakılır.
- **Risk:** `grid-auto-flow:dense` boşluk doldurmak için bölümleri görsel olarak yeniden sıralayabilir — `sectionOrder`'daki mantıksal sıra ile ekrandaki sıra farklılaşır. `translateZ(15px)` dönüşümü yazdırmada alt piksel kaymasına ve gölge bantlaşmasına açıktır.

## 4. modern-geometric

- **Fotoğraf:** var ama `<img>` değil: 2007–2043 arası `<svg>` içinde `<image href={personalInfo.avatarUrl}>` (2029), `x="0" y="3" width="100" height="100"`, kapsayıcı `w-24 h-24` / `w-34 h-34` — yuvarlak maskeli SVG.
- **İletişim etiketi:** 2061–2129; 8 alanın tamamı lucide ikonla, sosyal bağlantılarda `platform:` etiketi.
- **Beceri kategori başlığı:** 2151–2155, `text-[8px] font-extrabold tracking-widest` + `Editable`.
- **Kolon düzeni:** iki kolon — `w-[34%]` 2005, `w-[66%]` 2174; sağ panel `overflow-hidden` 2174.
- **Bölüm sırası:** `sectionOrder` 2197–2199, `personal` + `summary` + `skills` filtrelenir (kenar çubuğunda sabit yer).
- **Risk:** fotoğraf SVG içinde olduğu için `img[src^="data:"]` seçicileri, `crossOrigin` ayarı ve html2canvas yedeği onu görmez; ayrıca 8 px kategori başlığı baskıda neredeyse okunmaz.

## 5. split-sidebar

- **Fotoğraf:** var, 1829–1836; `rounded-full` + `border-[5px] border-white/20 shadow-xl`, `w-20 h-20` compact / `w-32 h-32` — yuvarlak, 128 px'e kadar.
- **İletişim etiketi:** 1843–1909; 8 alanın tamamı lucide ikon (Phone/Mail/MapPin/Calendar/MapPinned/Heart/Car/Globe), platform adları 1900–1905.
- **Beceri kategori başlığı:** 1929–1933, `text-[9px] uppercase` + `Editable`; kenar çubuğu bölüm başlıkları `renderSidebarSectionHeader` 652–663 ile ikonlu.
- **Kolon düzeni:** iki kolon — `w-[34%]` 1827 (`rounded-br-[45px]`), `w-[66%]` 1960.
- **Bölüm sırası:** `sectionOrder` 1982–1984; `personal` ve `skills` filtrelenir, kalan bölümler kullanıcı sırasını korur.
- **Risk:** `overflow-hidden` 1825 + `rounded-br-[45px]` 1827 birleşimi sol kolonun alt köşesindeki uzun metni yuvarlak maskeyle keser; iki panel de kendi içinde taşma gizlediği için sığmayan içerik PDF'te sessizce kaybolur.

## 6. minimalist-clean

- **Fotoğraf:** var, 1036–1044; kapsayıcı `shrink-0 self-center` 1036, `img` 1038; `rounded-full`, `w-16 h-16` compact / `w-24 h-24`, `border-2 border-slate-200`.
- **İletişim etiketi:** 1054–1134; 5 lucide ikon, kelime etiketleri `text-[9px]` olarak 1092/1101/1110, sosyal `platform:`.
- **Beceri kategori başlığı:** 1585–1589, standart kapı.
- **Kolon düzeni:** tek kolon (2878).
- **Bölüm sırası:** `sectionOrder.map` 2881.
- **Risk:** compact yoğunlukta portre 64 px'e düşer — "profil fotoğrafı daha büyük olsun" beklentisiyle doğrudan çelişen tek şablon; 9 px etiketler ölçekli PDF'te bulanıklaşır.

## 7. editorial-serif

- **Fotoğraf:** var, 1149–1157; kapsayıcı 1149, `img` 1151; `rounded-full object-cover grayscale`, `w-16` / `w-24`, `border border-slate-300`.
- **İletişim etiketi:** 1167–1247; 5 lucide ikon, kelime etiketleri 1205/1214/1223, sosyal `platform:`.
- **Beceri kategori başlığı:** 1585–1589, standart kapı.
- **Kolon düzeni:** tek kolon (2878).
- **Bölüm sırası:** `sectionOrder.map` 2881.
- **Risk:** `grayscale` sınıfı portreyi baskıda soluklaştırır (renkli fotoğraf yükleyen kullanıcı siyah-beyaz görür); serif başlıklarla 10 px kelime etiketleri arasındaki kontrast düşüktür.

## 8. tech-mono

- **Fotoğraf:** var, 1264–1271; `rounded object-cover border border-slate-300`, `w-14 h-14` compact / `w-20 h-20` — kare, küçük.
- **İletişim etiketi:** kod etiketi, 8/8 alan: `email:` 1292, `phone:` 1293, `address:` 1294, `birthDate:` 1295, `birthPlace:` 1296, `maritalStatus:` 1297, `driverLicense:` 1298, `site:` 1301; sosyal bağlantılarda `{sLink.platform.toLowerCase()}:` 1308.
- **Beceri kategori başlığı:** 1585–1589, standart kapı.
- **Kolon düzeni:** tek kolon (2878); iletişim bloğu kendi içinde `w-full sm:w-[48%]` ızgara (1291).
- **Bölüm sırası:** `sectionOrder.map` 2881.
- **Risk:** `w-full sm:w-[48%]` kırılımı A4 baskı genişliğinde tek kolona düşebilir ve iletişim bloğu 8 satıra çıkarak dikey yer yer; kod etiketleri bilinçli tasarım tercihidir, kusur sayılmaz.

## 9. crimson-split

- **Fotoğraf:** var, 2222–2230; `rounded-full object-cover border-[6px] border-white/10`, `w-28 h-28` / `w-36 h-36` — yuvarlak, 144 px'e kadar (en büyük portrelerden biri).
- **İletişim etiketi:** 2248–2321; 8 alanın tamamı lucide ikon, platform adları 2314, `Sosyal Medya / Bağlantılar` başlığı 2307 (`text-[8px]`).
- **Beceri kategori başlığı:** 2345–2348, `text-[9px] uppercase` — burada `Editable` yok, kategori adı düz metin olarak basılır.
- **Kolon düzeni:** iki kolon — `w-[34%]` 2220, `w-[66%]` 2366.
- **Bölüm sırası:** `sectionOrder` 2395–2397; `personal` + `summary` + `skills` filtrelenir.
- **Risk:** 2347'deki kategori adı düzenlenemez olduğu için kullanıcı arayüzden değiştiremez; 8 px sosyal medya başlığı ve `text-[8px]` platform satırları baskıda okunmaz sınıra yakındır.

## 10. teal-timeline

- **Fotoğraf:** var, 2425–2436; `rounded-full object-cover border-[4px] border-white shadow-lg`, `w-26 h-26` / `w-34 h-34`; çevresinde mutlak konumlu `-inset-1.5 rounded-full border border-white/20 animate-pulse` halka 2429.
- **İletişim etiketi:** 2444–2531; 8 alanın tamamı lucide ikon, 6 kelime etiketi (`Doğum Tarihi` 2473, `Doğum Yeri` 2482, `Medeni Durum` 2491, `Ehliyet` 2500, `Websitesi` 2509, `Sosyal Medya` 2520 — hepsi `text-[8px]`), sosyal `platform:` 2523.
- **Beceri kategori başlığı:** 2554–2557, `text-[8px] font-extrabold tracking-widest` + `Editable`.
- **Kolon düzeni:** iki kolon — `w-[34%]` 2418 (`relative`, `overflow-hidden`), `w-[66%]` 2591.
- **Bölüm sırası:** `sectionOrder` 2623–2625; `personal` + `summary` + `skills` filtrelenir.
- **Risk:** `-inset-1.5` negatif konumlu halka fotoğrafın dışına taşar ve `overflow-hidden` (2416/2418) ile kesilebilir; `animate-pulse` ekran görüntüsünde farklı opaklıkta yakalanabilir; 8 px etiketler sınırda.

## 11. dark-gold-arch

- **Fotoğraf:** var, 2654–2665; `rounded-full object-cover relative z-10`, `w-22 h-22` / `w-30 h-30`, çevresinde `absolute -inset-1 rounded-full bg-gradient-to-b from-amber-400 to-yellow-600 shadow-md p-[2px]` degrade halka 2656.
- **İletişim etiketi:** 2690–2774; 8 alanın tamamı lucide ikon, 6 kelime etiketi (`Doğum Tarihi` 2719, `Doğum Yeri` 2728, `Medeni Durum` 2737, `Ehliyet` 2746, `Websitesi` 2755, `Sosyal Medya / Bağlantılar` 2764 — hepsi `text-[8px]`), sosyal `platform:` 2768.
- **Beceri kategori başlığı:** 2801–2805, `text-[8px] font-extrabold tracking-widest` + `Editable`.
- **Kolon düzeni:** iki kolon — `w-[34%]` 2646, `w-[66%]` 2831.
- **Bölüm sırası:** `sectionOrder` 2846–2848; `personal` + `summary` + `skills` filtrelenir.
- **Risk:** degrade halka `-inset-1` ile negatif konumda; sol kolon `overflow-hidden` (2644) ve kart `overflow-hidden` (2649) birlikte halka ile gölgeyi kırpabilir. `amber-550` sınıfı ancak `--color-amber-550` tanımlıysa üretilir (`src/index.css`, `@theme`).

## Ortak riskler

1. **Sayfa taşmasını gizleme:** A4 sayfası `min-h-[297mm]` + `overflow-hidden` (1798). Sığmayan içerik hata vermez, sessizce kırpılır; tek sayfa doğrulaması bu yüzden zorunludur (`node mcp/tpl-verify.mjs`).
2. **Panel içi ikinci taşma:** iki kolonlu şablonlarda sağ panel `overflow-hidden` (1960, 2174, 2366, 2591, 2831), sol panel 1825/2003/2218/2416/2644. İki katmanlı kırpma, taşan satırın nerede kaybolduğunu görünmez kılar.
3. **`min-h-[297mm] h-full` sarmalayıcılar:** 1825, 2003, 2218, 2416, 2644. `h-full` + `justify-between` içerik azaldığında bölümler arasında beklenmeyen boşluk üretir.
4. **8 px metinler:** 2152, 2307, 2314, 2473–2520, 2719–2764, 2802. Ölçekli PDF/PNG'de okunabilirlik sınırında.
5. **Negatif konumlu süsler:** `-inset-1.5` 2429, `-inset-1` 2656. Taşma gizleme ile birlikte halka kesilebilir.
6. **Zoom'lu fit kapsayıcısı:** 1814–1822. Ölçek `zoom` ile uygulandığı için tarayıcıya göre alt piksel farkı oluşur; ekran = baskı eşitliği ayrıca doğrulanmalıdır.
7. **Kategori adının düzenlenemez olması:** 2345–2348 (crimson-split) — diğer şablonlardan tek sapma.

## Bilinen ölçüm tuzakları

1. **`modern-geometric` fotoğrafı `<img>` değil:** `<svg><image href>` 2007–2043. `img[src^="data:"]` seçicisi eşleşmez; `image[href^="data:"]` gerekir. html2canvas yedeği bu portreyi çizmez, bu yüzden PNG export foreignObject yolunu kullanır.
2. **`id^="exp-"` seçicileri her şablonda yok:** deneyim varlığı metinden (küçük harfe normalize edilerek) doğrulanmalı; seçici tabanlı kontrol yanlış "içerik yok" verir.
3. **Telefon biçimi:** metin `538 933 5550` (boşluksuz). `538 933 55 50` araması yanlış negatif üretir.
4. **Web fontu yüklenmeden ölçüm:** `document.fonts.ready` + en az 2000 ms bekleme gerekir; 900 ms'de sahte satır farkı oluşur.
5. **`depth3d` iki kolon:** kök `grid grid-cols-2` (2877) — metin kutuları üst üste binmez ama bölüm sırası `grid-auto-flow:dense` ile görsel olarak değişir; sıra kontrolü `sectionOrder` ile değil, ekrandaki konumla yapılmalı.
6. **`text-[8px]` etiketler:** üst üste binme ölçümünde eşik %25 alınmalı; 8 px kutular küçük olduğu için mutlak piksel eşiği yanıltıcıdır.
7. **`overflow-hidden` sayfa:** kırpılan içerik DOM'da durur, ölçüm "sığıyor" sanabilir; gerçek PDF mutlaka üretilip `mcp/tpl-pdf-check.mjs` ile sayfa sayısı sayılmalıdır.
8. **`-inset-*` süsler:** kutu ölçümüne süs katmanları dahil edilmemeli; yalnız yaprak metin düğümleri karşılaştırılır.
