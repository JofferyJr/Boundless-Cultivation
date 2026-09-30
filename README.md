# Boundless Cultivation · Dunia Xianxia

Repository rasmi **Boundless Cultivation** — game RPG kultivasi Xianxia standalone yang berjalan sebagai static HTML melalui GitHub Pages.

- **Repository:** https://github.com/JofferyJr/Boundless-Cultivation
- **Game:** Boundless Cultivation
- **Current runtime:** `site/`
- **Deployment:** GitHub Pages / Static HTML
- **Repository standalone:** Ya — tidak diselaraskan dengan projek lama.
- **GitHub Pages:** https://jofferyjr.github.io/Boundless-Cultivation/

## Dunia & Peta

Boundless menggunakan dua pengalaman peta yang berasingan.

### Peta Dunia Utama

Peta utama menggunakan:

`site/assets/uploads/Peta Xianxia dengan Laut Tenggara Tenang.png`

Peta ini kekal sebagai dunia utama dan mempunyai kawasan portal menuju **Dunia Laut**.

### Dunia Laut

Dunia Laut mempunyai peta khusus:

`site/world-map/v3/dunia_laut/Peta Laut Xianxia yang Harmoni.png.webp`

Dunia Laut dibuka melalui sistem portal laut dan tidak menggantikan peta dunia utama.

## Sistem Utama

- Penciptaan watak Xianxia dengan nama, usia, jantina dan potret.
- **Kertas Pemilihan Muka** untuk pemain dan pasangan apabila pilihan pasangan tersedia.
- Pemilihan **1–4 bakat**.
- **True Love** hanya tersedia untuk watak berusia 18 tahun ke atas.
- Sistem **Spiritual Root** dengan reroll gred.
- Bloodline, physique, keluarga, sekte dan salasilah.
- Bestari dengan koleksi makhluk dan penerangan.
- Item, herba, bijih, pil, artifak, senjata, manual dan kunci portal.
- Sistem hubungan, keluarga, pasangan dan perkembangan watak.
- Sistem dunia hidup dan AI untuk entiti dunia.
- Muzik latar dan pemulihan kedudukan muzik ketika save/load.
- Save/Export melalui **Tetapan → Permainan**.

## Spiritual Root · Reroll Gred

Reroll hanya menentukan **gred akar**, bukan menukar kategori jenis akar.

| Gred | Kebarangkalian |
|---|---:|
| Akar Palsu 5 | 35% |
| Akar Palsu 4 | 25% |
| Akar Sejati 3 | 20% |
| Akar Sejati 2 | 15% |
| Akar Surgawi | 5% |

Kategori asas:
- **Akar Palsu:** Api, Air, Kayu, Logam, Tanah.
- **Akar Sejati:** Kilat, Ais, Angin, Cahaya, Gelap.
- **Akar Surgawi:** pilihan khas dengan satu slot akar.

## Reincarnated Tree Spirit

**Reincarnated Tree Spirit** ialah latar belakang jiwa roh pokok yang dilahirkan semula sebagai manusia.

Akar yang serasi termasuk:
- Akar Air
- Akar Kayu
- Akar Tanah
- Akar Angin
- Akar Cahaya/Yang

Apabila watak ini mempunyai **Akar Kayu**, bonus khusus latar belakang ialah **+45% Cultivation Speed**. Bonus tersebut hanya aktif apabila jenis akar yang dipilih ialah Akar Kayu.

## Save & Export

Sistem save berada di **Tetapan → Permainan**.

Panel native ini mengendalikan:
- Simpan
- Muat
- Padam
- Import
- Export
- Export Semua

Save lama dimigrasi secara berperingkat supaya kemajuan pemain tidak hilang apabila struktur save berubah.

## Tetapan

Tetapan Boundless mengandungi fungsi seperti:
- Paparan
- Permainan
- Help & Tips
- Dev
- AI Control Center
- Muzik
- Sistem save/export
- Refresh paparan versi

## Aset Penting

- `site/assets/` — runtime dan aset permainan.
- `site/game-assets/bestiary/` — koleksi Bestari.
- `site/game-assets/items/` — aset item.
- `site/assets/music/` — muzik permainan, termasuk `Xian Dao Chang (仙道长).mp3`.
- `site/assets/uploads/` — aset peta dan bahan tambahan.

## Identiti Projek

Nama rasmi semasa ialah **Boundless Cultivation**.

Nama projek lama **Jalan Dao / Cultivation** tidak lagi digunakan sebagai nama game atau repository rasmi.

## Development

Fail runtime utama berada di dalam `site/`. Untuk GitHub Pages, deployment menggunakan kandungan folder tersebut dan path asset disesuaikan dengan repository baharu **Boundless-Cultivation**.

Perubahan runtime hendaklah mengekalkan keserasian dengan save lama dan tidak memadam aset canonical yang masih digunakan oleh sistem permainan.