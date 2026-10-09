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

## Weapon System · Expert

Boundless kini mempunyai sistem senjata berlapis yang menggunakan prefix item **WPN-** dan boleh diakses melalui **Inventori → Slot Peralatan → ⚔️ Senjata & Tempa**.

### Lapisan Senjata

- **10 jenis senjata:** Pedang, Saber, Tombak, Busur, Tongkat, Kipas, Guandao, Palu, Belati dan Orb.
- **6 grade:** Mortal, Spiritual, Earth, Heaven, Immortal dan Divine.
- **Core Material:** menentukan asas Attack, Defense, Stability dan affix.
- **Catalyst / Soul:** memberikan elemen dan skill khas.
- **Karma:** Orthodox, Neutral atau Asura/Demonic.
- **Quality:** 1–5.
- **Purity & Stability:** mempengaruhi hasil forging.
- **Dao Tribulation:** risiko meningkat pada grade Earth ke atas.
- **Refinement:** peningkatan kuasa dengan risiko kegagalan dan kehilangan durability.
- **Tempering:** sehingga tahap 10 dengan kemungkinan backlash.
- **Dao Rune Matrix:** Sword Qi, Kilat, Api, Ais, Angin, Ilusi, Pertahanan, Ruang dan Jiwa.
- **Affixes:** kesan sekunder seperti Kukuh, Spirit Flow, Flame Edge, Void Rend dan Astral.
- **Durability:** senjata boleh rosak dan dibaiki.
- **Mastery:** latihan senjata meningkatkan penguasaan.
- **Weapon Intent:** Kesedaran Senjata → Jiwa Senjata → Roh Senjata → Dewa Senjata.
- **Soul Resonance:** berkembang melalui penggunaan dan latihan.
- **Permanent identity:** setiap senjata mempunyai ID unik `WPN-...` dan boleh dinamakan semula.
- **Arsenal persistence:** data senjata disimpan sebagai JSON dalam runtime tempatan.

### Aliran Forging

**Furnace → Core Material → Catalyst/Soul → Purity/Stability → Shape → Dao Runes → Tribulation → Weapon Intent**

Sistem ini berdiri sebagai modul runtime tersendiri supaya senjata boleh diperluaskan kemudian tanpa perlu mengubah bundle utama permainan.

### Material & Grade

Grade lebih tinggi mempunyai multiplier kuasa yang lebih besar dan risiko tribulation yang lebih tinggi. Material seperti **Spirit Steel, Cold Jade, Thunderstone, Phoenix Metal, Void Ore** dan **Star Iron** mempunyai ciri asas yang berbeza.
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

## Dev Mode · Cultivation Realm Editor

Apabila **Dev Mode** Boundless telah diaktifkan, tab **Dev** menyediakan **Cultivation Realm Editor** untuk ujian development.

Ranah yang boleh ditukar:
1. Body Refinement
2. Qi Condensation — 13 lapisan
3. Foundation Establishment
4. Core Formation
5. Nascent Soul
6. Soul Transformation
7. Void Refinement
8. Dao Integration
9. Tribulation Transcendence
10. Immortal Ascension

Editor juga membenarkan pemilihan **Tahap Awal, Tahap Pertengahan, Tahap Akhir** atau **Kesempurnaan Agung**, serta lapisan Qi untuk ujian Qi Condensation.

Perubahan dibuat pada save pemain semasa dan dimuatkan semula melalui loader save native supaya UI permainan menggunakan state yang sama.
## Item Atlas & Accessory Atlas

The inventory uses atlas images as item artwork sources. Keep the existing filenames and canonical paths when replacing the artwork so references remain compatible:

- **Item Atlas:** `site/game-assets/items/item-atlas-v1.webp`
- **Accessory Atlas:** `site/game-assets/items/Assesoris.webp`

The repository also contains `site/game-art/item-atlas-v1.webp`; do not assume this file is the inventory's active source. The runtime may reference a specific path, so update the canonical file that the inventory actually loads.

### Replacing an atlas image

1. Replace the image at the existing path; keep the filename, capitalization, and `.webp` extension unchanged.
2. Preserve the atlas layout/grid and the relative positions of existing item sprites unless the sprite-coordinate data is updated too.
3. Commit the replacement to the `main` branch and wait for GitHub Pages to finish deploying.
4. Test the live game with a hard refresh (`Ctrl+Shift+R` on most desktop browsers) or in a private window. Browsers and GitHub Pages may continue serving a cached image.
5. If the old artwork remains after a hard refresh, inspect the image URL requested by the inventory and verify that it points to the exact file replaced. If the app uses a different atlas path, replacing another copy will not change the inventory.

Replacing the image alone does not change item names, IDs, or item definitions. It only changes the artwork source; item mapping depends on the existing atlas layout and runtime references.

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