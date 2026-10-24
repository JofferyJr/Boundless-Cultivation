/* Boundless v8.9.7 — 35-species Spirit Beast tier catalogue.
 * Official classification: nine tiers only. Rarity remains an independent property.
 * Uses only the existing 41 map regions; this module does not create new regions.
 */
(() => {
  "use strict";
  if (window.__BOUNDLESS_SPIRIT_BEAST_TIERS_V897__) return;
  window.__BOUNDLESS_SPIRIT_BEAST_TIERS_V897__ = true;

  const TIERS = ["Fana", "Spiritual", "Bumi", "Purba", "Diraja", "Suci", "Ilahi", "Primordial", "Asal Dao"];
  const REGIONS = [
    "Puncak Xuefeng", "Gunung Tianbing", "Dataran Beiming", "Pulau Gunung Bingyao", "Pulau Xuanshuang",
    "Banjaran Xuanbing", "Pergunungan Celestial Spine", "Pergunungan Terapung Yunxiao", "Tundra Hanshui",
    "Pulau Qingshuang", "Pulau Jinlei", "Pulau Gunung Hanluo", "Hutan Muyun", "Dataran Tinggi Xuanyun",
    "Gunung Heiyan", "Gurun Jinsha", "Pulau Qingzhu", "Lembah Tasik Qinghe", "Lembah Huoyun",
    "Dataran Longyuan", "Pulau Tianluo", "Teluk Canghai", "Ngarai Chiyan", "Lembah Bunga Bulan",
    "Oasis Luoshui", "Pulau Chijiao", "Lembah Sungai Qingluo", "Delta Lingshui", "Kepulauan Fengya",
    "Dataran Nanlin", "Lembah Yunhe", "Pesisir Canghai", "Kepulauan Shigu", "Pulau Chisha",
    "Hutan Lingshu", "Kepulauan Mutiara", "Kepulauan Yuelan", "Kepulauan Canglan", "Kepulauan Yunmu",
    "Pulau Lingkong", "Portal Dunia Laut"
  ];
  const BEASTS = [
    {id:1,name:"Azure Wind Wolf",tier:"Spiritual",rarity:"Tidak biasa",element:"Angin",habitat:["Pergunungan Terapung Yunxiao","Lembah Yunhe"]},
    {id:2,name:"Flamehorn Deer",tier:"Fana",rarity:"Biasa",element:"Api",habitat:["Lembah Huoyun","Gunung Heiyan"]},
    {id:3,name:"Moonlight Rabbit",tier:"Fana",rarity:"Biasa",element:"Bulan",habitat:["Lembah Bunga Bulan","Kepulauan Yuelan"]},
    {id:4,name:"Thunderclaw Leopard",tier:"Bumi",rarity:"Langka",element:"Kilat",habitat:["Pulau Jinlei","Gunung Tianbing"]},
    {id:5,name:"Ironback Turtle",tier:"Fana",rarity:"Biasa",element:"Tanah",habitat:["Teluk Canghai","Pulau Chijiao"]},
    {id:6,name:"Jade Feather Crane",tier:"Spiritual",rarity:"Tidak biasa",element:"Angin",habitat:["Pergunungan Terapung Yunxiao","Pulau Lingkong"]},
    {id:7,name:"Cloudstep Tiger",tier:"Bumi",rarity:"Langka",element:"Angin",habitat:["Pergunungan Celestial Spine","Pergunungan Terapung Yunxiao"]},
    {id:8,name:"Frostfang Wolf",tier:"Spiritual",rarity:"Tidak biasa",element:"Ais",habitat:["Puncak Xuefeng","Tundra Hanshui"]},
    {id:9,name:"Spiritfire Fox",tier:"Spiritual",rarity:"Langka",element:"Api / Roh",habitat:["Hutan Muyun","Hutan Lingshu"]},
    {id:10,name:"Bluewater Serpent",tier:"Spiritual",rarity:"Tidak biasa",element:"Air",habitat:["Lembah Tasik Qinghe","Lembah Sungai Qingluo"]},
    {id:11,name:"Golden Ant King",tier:"Fana",rarity:"Tidak biasa",element:"Tanah",habitat:["Gurun Jinsha","Ngarai Chiyan"]},
    {id:12,name:"White Jade Lion",tier:"Bumi",rarity:"Langka",element:"Cahaya / Logam",habitat:["Banjaran Xuanbing","Pergunungan Celestial Spine"]},
    {id:13,name:"Purple Lightning Eagle",tier:"Bumi",rarity:"Langka",element:"Kilat",habitat:["Pulau Jinlei","Gunung Tianbing"]},
    {id:14,name:"Green Scale Python",tier:"Fana",rarity:"Biasa",element:"Kayu",habitat:["Hutan Muyun","Dataran Nanlin"]},
    {id:15,name:"Red Flame Crow",tier:"Fana",rarity:"Biasa",element:"Api",habitat:["Gunung Heiyan","Lembah Huoyun"]},
    {id:16,name:"Heaven Devouring Dragon",tier:"Primordial",rarity:"Mitos",element:"Kekacauan",habitat:["Portal Dunia Laut","Pergunungan Celestial Spine"]},
    {id:17,name:"Nine-Tailed Heavenly Fox",tier:"Suci",rarity:"Mitos",element:"Ilusi / Yin",habitat:["Hutan Lingshu","Hutan Muyun"]},
    {id:18,name:"Golden Winged Roc",tier:"Suci",rarity:"Mitos",element:"Angin / Ruang",habitat:["Pulau Lingkong","Pergunungan Terapung Yunxiao"]},
    {id:19,name:"Heavenly Phoenix",tier:"Suci",rarity:"Mitos",element:"Api / Kelahiran Semula",habitat:["Gunung Heiyan","Lembah Huoyun"]},
    {id:20,name:"Ancient Qilin",tier:"Suci",rarity:"Mitos",element:"Tanah / Nasib",habitat:["Dataran Longyuan","Hutan Lingshu"]},
    {id:21,name:"Black Tortoise",tier:"Suci",rarity:"Mitos",element:"Air / Pertahanan",habitat:["Teluk Canghai","Portal Dunia Laut"]},
    {id:22,name:"White Tiger Emperor",tier:"Diraja",rarity:"Mitos",element:"Logam / Tempur",habitat:["Pergunungan Celestial Spine","Banjaran Xuanbing"]},
    {id:23,name:"Azure Dragon",tier:"Suci",rarity:"Mitos",element:"Kayu / Kehidupan",habitat:["Hutan Lingshu","Lembah Sungai Qingluo"]},
    {id:24,name:"Netherworld Black Phoenix",tier:"Ilahi",rarity:"Mitos",element:"Kegelapan",habitat:["Pulau Chisha","Portal Dunia Laut"]},
    {id:25,name:"Void Devouring Beast",tier:"Primordial",rarity:"Mitos",element:"Ruang",habitat:["Portal Dunia Laut","Pulau Lingkong"]},
    {id:26,name:"Blood Moon Wolf",tier:"Purba",rarity:"Sangat langka",element:"Darah / Bulan",habitat:["Kepulauan Yuelan","Hutan Lingshu"]},
    {id:27,name:"Nine-Headed Serpent Emperor",tier:"Diraja",rarity:"Mitos",element:"Racun",habitat:["Delta Lingshui","Lembah Sungai Qingluo"]},
    {id:28,name:"Heavenly Thunder Lion",tier:"Diraja",rarity:"Sangat langka",element:"Kilat",habitat:["Gunung Tianbing","Pulau Jinlei"]},
    {id:29,name:"Star Devouring Whale",tier:"Ilahi",rarity:"Mitos",element:"Bintang / Ruang",habitat:["Portal Dunia Laut","Kepulauan Canglan"]},
    {id:30,name:"Primordial Kun",tier:"Primordial",rarity:"Mitos",element:"Air / Kekacauan",habitat:["Portal Dunia Laut","Pesisir Canghai"]},
    {id:31,name:"Hellfire Ape",tier:"Purba",rarity:"Sangat langka",element:"Api / Kekuatan",habitat:["Gunung Heiyan","Ngarai Chiyan"]},
    {id:32,name:"Dream Eater",tier:"Ilahi",rarity:"Mitos",element:"Mimpi / Jiwa",habitat:["Lembah Bunga Bulan","Kepulauan Yuelan"]},
    {id:33,name:"Mountain Shaking Bear",tier:"Purba",rarity:"Langka",element:"Tanah / Kekuatan",habitat:["Puncak Xuefeng","Pergunungan Celestial Spine"]},
    {id:34,name:"Heavenly Jade Snake",tier:"Purba",rarity:"Sangat langka",element:"Ais / Racun",habitat:["Banjaran Xuanbing","Pulau Xuanshuang"]},
    {id:35,name:"Golden Blood War Ape",tier:"Diraja",rarity:"Sangat langka",element:"Darah / Pertempuran",habitat:["Ngarai Chiyan","Pergunungan Celestial Spine"]}
  ];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const STYLE_ID = "boundless-spirit-beast-tiers-v897-style";
  const PANEL_ID = "boundless-spirit-beast-tiers-v897";
  const TAB_BAR_ID = "boundless-spirit-beasts-tools";

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID}{margin:18px 0 22px;padding:18px;border:1px solid #655333;border-radius:15px;background:linear-gradient(145deg,#111d17,#0a120f);color:#efe7d3}
      #${PANEL_ID} *{box-sizing:border-box}
      #${PANEL_ID} .sbt-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
      #${PANEL_ID} h2{margin:0;color:#e6cc85;font:700 1.35rem Georgia,serif}
      #${PANEL_ID} p{margin:6px 0 0;color:#aab9ad;line-height:1.55;font-size:.88rem}
      #${PANEL_ID} .sbt-total{border:1px solid #6d5b35;border-radius:10px;padding:8px 12px;color:#e6cc85;white-space:nowrap}
      #${PANEL_ID} .sbt-filters{display:grid;grid-template-columns:minmax(180px,1.5fr) minmax(150px,1fr) minmax(150px,1fr);gap:10px;margin:16px 0}
      #${PANEL_ID} label{display:grid;gap:5px;color:#c6cdbf;font-size:.78rem}
      #${PANEL_ID} input,#${PANEL_ID} select{min-width:0;width:100%;padding:10px;border:1px solid #3c5144;border-radius:8px;background:#07100b;color:#f3ead4;font:inherit}
      #${PANEL_ID} .sbt-tier-strip{display:flex;gap:7px;overflow-x:auto;padding:2px 0 12px}
      #${PANEL_ID} .sbt-tier{flex:0 0 auto;border:1px solid #4c5b4c;border-radius:99px;padding:7px 11px;background:#122017;color:#c8d5c9;cursor:pointer;font:inherit;font-size:.78rem}
      #${PANEL_ID} .sbt-tier[aria-pressed="true"]{border-color:#d5b567;background:#4a3a1d;color:#ffe5a0}
      #${PANEL_ID} .sbt-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      #${PANEL_ID} .sbt-card{min-width:0;padding:12px;border:1px solid #2c4536;border-radius:11px;background:#0d1912}
      #${PANEL_ID} .sbt-card[hidden]{display:none}
      #${PANEL_ID} .sbt-card-top{display:flex;justify-content:space-between;align-items:center;gap:7px}
      #${PANEL_ID} .sbt-number{color:#879d8c;font-size:.72rem}
      #${PANEL_ID} .sbt-tier-tag{border:1px solid #8e7541;border-radius:99px;padding:3px 7px;color:#e8cf8c;font-size:.68rem;white-space:nowrap}
      #${PANEL_ID} h3{margin:10px 0 5px;color:#f0e5ca;font-size:.98rem;line-height:1.35}
      #${PANEL_ID} .sbt-meta{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
      #${PANEL_ID} .sbt-meta span{border:1px solid #35483a;border-radius:6px;padding:3px 6px;color:#c0cebf;font-size:.7rem}
      #${PANEL_ID} .sbt-habitat{margin-top:9px!important;font-size:.77rem!important}
      #${PANEL_ID} .sbt-results{margin:12px 0 0!important;color:#d9c58c!important}
      @media(max-width:760px){#${PANEL_ID} .sbt-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#${PANEL_ID} .sbt-filters{grid-template-columns:1fr 1fr}#${PANEL_ID} .sbt-search{grid-column:1/-1}}
      @media(max-width:480px){#${PANEL_ID}{padding:12px}#${PANEL_ID} .sbt-grid{grid-template-columns:1fr}#${PANEL_ID} .sbt-filters{grid-template-columns:1fr}#${PANEL_ID} .sbt-search{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function isBeastsTab(panel) {
    if (!panel || panel.getAttribute("role") !== "tabpanel") return false;
    const trigger = document.querySelector('[role="tab"][data-state="active"][aria-controls="' + panel.id + '"]');
    return !!trigger && /Haiwan Roh/i.test(trigger.textContent || "");
  }
  function mount(panel) {
    if (!isBeastsTab(panel)) return;
    installStyle();
    let root = panel.querySelector("#" + PANEL_ID);
    if (!root) {
      root = document.createElement("section");
      root.id = PANEL_ID;
      root.innerHTML = `
        <div class="sbt-head"><div><h2>Bestiari Haiwan Roh · 9 Tingkatan</h2><p>35 spesies tetap. Tingkatan asal menentukan kedudukan kuasa; kelangkaan ialah sifat berasingan. Individu boleh berkembang melalui evolusi.</p></div><div class="sbt-total"><strong data-total>35</strong> spesies</div></div>
        <div class="sbt-filters">
          <label class="sbt-search">Cari spesies<input type="search" data-search placeholder="Nama, elemen atau habitat…" autocomplete="off"></label>
          <label>Tingkatan<select data-tier><option value="all">Semua 9 tingkatan</option>${TIERS.map(t => '<option value="' + esc(t) + '">' + esc(t) + '</option>').join("")}</select></label>
          <label>Kelangkaan<select data-rarity><option value="all">Semua kelangkaan</option>${Array.from(new Set(BEASTS.map(b => b.rarity))).map(t => '<option value="' + esc(t) + '">' + esc(t) + '</option>').join("")}</select></label>
        </div>
        <div class="sbt-tier-strip" aria-label="Pilih tingkatan">${TIERS.map(t => '<button type="button" class="sbt-tier" data-tier-button="' + esc(t) + '" aria-pressed="false">' + esc(t) + ' <span>(' + BEASTS.filter(b => b.tier === t).length + ')</span></button>').join("")}</div>
        <div class="sbt-grid" data-grid></div><p class="sbt-results" data-results aria-live="polite"></p>`;
      const toolbar = panel.querySelector("#" + TAB_BAR_ID);
      if (toolbar) toolbar.insertAdjacentElement("beforebegin", root);
      else panel.prepend(root);
      root.querySelector("[data-search]").addEventListener("input", () => render(root));
      root.querySelector("[data-tier]").addEventListener("change", () => render(root));
      root.querySelector("[data-rarity]").addEventListener("change", () => render(root));
      root.querySelectorAll("[data-tier-button]").forEach(button => button.addEventListener("click", () => {
        const select = root.querySelector("[data-tier]");
        select.value = select.value === button.dataset.tierButton ? "all" : button.dataset.tierButton;
        render(root);
      }));
      render(root);
    }
  }
  function render(root) {
    const search = (root.querySelector("[data-search]").value || "").trim().toLocaleLowerCase();
    const tier = root.querySelector("[data-tier]").value;
    const rarity = root.querySelector("[data-rarity]").value;
    const grid = root.querySelector("[data-grid]");
    const visible = BEASTS.filter(b => {
      const haystack = [b.name,b.tier,b.rarity,b.element,...b.habitat].join(" ").toLocaleLowerCase();
      return (!search || haystack.includes(search)) && (tier === "all" || b.tier === tier) && (rarity === "all" || b.rarity === rarity);
    });
    grid.innerHTML = visible.map(b => `
      <article class="sbt-card">
        <div class="sbt-card-top"><span class="sbt-number">Spesies ${b.id.toString().padStart(2,"0")}</span><span class="sbt-tier-tag">${esc(b.tier)}</span></div>
        <h3>${esc(b.name)}</h3>
        <div class="sbt-meta"><span>Kelangkaan: ${esc(b.rarity)}</span><span>Elemen: ${esc(b.element)}</span></div>
        <p class="sbt-habitat"><strong>Habitat:</strong> ${b.habitat.map(esc).join(" · ")}</p>
      </article>`).join("");
    root.querySelectorAll("[data-tier-button]").forEach(button => button.setAttribute("aria-pressed", String(tier === button.dataset.tierButton)));
    root.querySelector("[data-total]").textContent = String(visible.length);
    root.querySelector("[data-results]").textContent = "Memaparkan " + visible.length + " daripada 35 spesies. Wilayah habitat semuanya dipilih daripada 41 wilayah peta sedia ada.";
  }
  function scan() { document.querySelectorAll('[role="tabpanel"]').forEach(mount); }
  let queued = false;
  const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; scan(); }); };
  function boot() {
    scan();
    new MutationObserver(schedule).observe(document.body, {childList:true,subtree:true,attributes:true,attributeFilter:["data-state"]});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
  window.BoundlessSpiritBeastTiers = {
    version: "8.9.7",
    tiers: () => TIERS.slice(),
    regions: () => REGIONS.slice(),
    list: () => BEASTS.map(b => ({...b, habitat:b.habitat.slice()}))
  };
})();