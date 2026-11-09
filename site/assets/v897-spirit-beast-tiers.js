/* Boundless v8.9.7 — 37-species Spirit Beast tier catalogue.
 * Official classification: nine tiers only. Rarity remains an independent property.
 * Uses only the existing 41 map regions; this module does not create new regions.
 */
(() => {
  "use strict";
  if (window.__BOUNDLESS_SPIRIT_BEAST_TIERS_V897__) return;
  window.__BOUNDLESS_SPIRIT_BEAST_TIERS_V897__ = true;

  const canonical = window.BoundlessModules?.spiritBeasts?.catalogue;
  if (!canonical) throw new Error("Boundless Spirit Beast canonical catalogue is not loaded.");
  const TIERS = canonical.tiers();
  const REGIONS = canonical.regions();
  const BEASTS = canonical.list();
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
        <div class="sbt-head"><div><h2>Bestiari Haiwan Roh · 9 Tingkatan</h2><p>37 spesies berdaftar. Tingkatan asal menentukan kedudukan kuasa; kelangkaan ialah sifat berasingan. Individu boleh berkembang melalui evolusi.</p></div><div class="sbt-total"><strong data-total>37</strong> spesies</div></div>
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
    }).sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || a.id - b.id);
    grid.innerHTML = visible.map(b => `
      <article class="sbt-card">
        <div class="sbt-card-top"><span class="sbt-number">Spesies ${b.id.toString().padStart(2,"0")}</span><span class="sbt-tier-tag">${esc(b.tier)}</span></div>
        <h3>${esc(b.name)}</h3>
        ${b.evolution ? '<p class="sbt-habitat"><strong>' + esc(b.evolution.stage) + ':</strong> ' + esc(b.evolution.from) + ' → ' + esc(b.name) + '. Evolusi pilihan sahaja; haiwan boleh kekal pada spesies asal dan tidak berevolusi secara automatik.</p>' : ''}
        <div class="sbt-meta"><span>Kelangkaan: ${esc(b.rarity)}</span><span>Elemen: ${esc(b.element)}</span></div>
        <p class="sbt-habitat"><strong>Habitat:</strong> ${b.habitat.map(esc).join(" · ")}</p>
      </article>`).join("");
    root.querySelectorAll("[data-tier-button]").forEach(button => button.setAttribute("aria-pressed", String(tier === button.dataset.tierButton)));
    root.querySelector("[data-total]").textContent = String(visible.length);
    root.querySelector("[data-results]").textContent = "Memaparkan " + visible.length + " daripada 37 spesies. Wilayah habitat semuanya dipilih daripada 41 wilayah peta sedia ada.";
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