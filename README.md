# Boundless Cultivation v8.1.5 · Dunia Xianxia

Repository rasmi **GitHub standalone** untuk Boundless Cultivation.

- Game version: **8.1.5**
- Save format: **saveVersion 30**
- Deployment: **GitHub Pages / Static HTML**
- Runtime source: `site/`
- Auto-sync with the former site: **disabled**

## Sorotan 8.1.5

- **Kertas Pemilihan Muka** untuk pemain dan pasangan True Love menggunakan satu helaian responsif yang kekal terbuka selepas pemilihan.
- Pemain boleh memilih **1–4 bakat** dan semua kesan digunakan secara additive.
- **True Love** hanya tersedia apabila usia permulaan sekurang-kurangnya 18 tahun.
- Gambar **9 herba, 10 logam, 7 serpihan Kunci Portal Laut dan 1 kunci lengkap** dipulihkan daripada aset canonical apabila save lama tidak menyimpan art.
- Save v8.1.4 dimigrasi kepada **saveVersion 30** tanpa memadam kemajuan.
- Layout penciptaan watak dibataskan kepada viewport tanpa global `body { overflow-x: hidden; }`.

## Reincarnated Tree Spirit

**Reincarnated Tree Spirit** ialah latar belakang untuk jiwa roh pokok yang dilahirkan semula sebagai manusia. Disebabkan asal-usulnya sebagai roh tumbuhan, beberapa jenis akar roh tidak serasi dan tidak boleh digunakan.

### Akar yang boleh digunakan

- **Akar Air (水)** — boleh digunakan.
- **Akar Kayu (木)** — boleh digunakan dan memberikan bonus khas.
- **Akar Tanah (土)** — boleh digunakan.
- **Akar Angin (风)** — boleh digunakan.
- **Akar Cahaya/Yang (光/阳)** — boleh digunakan.

### Akar yang tidak boleh digunakan

- **Akar Api (火)**
- **Akar Logam (金)**
- **Akar Kilat (雷)**
- **Akar Ais (冰)**
- **Akar Yin/Gelap (暗/阴)**
- **Akar Ruang (空间)**
- **Akar Masa (时间)**
- **Akar Penelan (吞噬)**
- **Akar Kekacauan Primordial (混沌)**
- **Akar Abadi/Ilahi (仙/神)**

Akar yang tidak serasi tidak ditawarkan sebagai pilihan untuk latar belakang ini.

### Bonus Akar Kayu

Apabila watak **Reincarnated Tree Spirit** mempunyai **Akar Kayu (木)**:

> **+45% Cultivation Speed**

Bonus ini hanya aktif apabila jenis akar watak ialah **Akar Kayu**. Memilih latar belakang Reincarnated Tree Spirit sahaja tidak memberikan bonus +45%.

**Reroll gred akar** kekal sebagai sistem berasingan dan tidak menukar sekatan jenis akar khusus latar belakang ini.

## Play

https://jofferyjr.github.io/Cultivation/

## Save manager

Tetapan → Permainan mengandungi lima slot manual dengan Simpan, Muat, Padam, Import, Export dan Export Semua. Tiada butang save terapung atau quick-save pada UI utama.

## Verification

Repository menjalankan static-runtime audit, release audit 8.1.5/saveVersion 30, unit tests dan Playwright browser tests untuk hydration, save manager, multi-talent, True Love, Kertas Pemilihan Muka dan kawalan overflow.
