/* Boundless v8.9.8 — habitat bridge for the native Spirit Beast system.
 * The main game's nest-search, contract, inventory and Bestiary handlers remain authoritative.
 * This module only filters the official 35-species catalogue by the active world region.
 */
(() => {
  "use strict";
  if (window.__BOUNDLESS_SPIRIT_ENCOUNTERS_V898__) return;
  window.__BOUNDLESS_SPIRIT_ENCOUNTERS_V898__ = true;
  const ROOT_ID = "bc-spirit-encounter-runtime";
  const SAVE_KEY = "boundless-save";
  const CONFIG_KEY = "boundless-spirit-encounter-settings-v898";
  const DEFAULT_CONFIG = Object.freeze({ enabled: true, encounterChance: 0.06 });
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const norm = value => String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase();
  const parse = value => { try { return JSON.parse(value || "null"); } catch (_) { return null; } };
  const readSave = () => { try { return parse(localStorage.getItem(SAVE_KEY)); } catch (_) { return null; } };
  const readConfig = () => {
    try {
      const stored = parse(localStorage.getItem(CONFIG_KEY)) || {};
      return {
        enabled: stored.enabled !== false,
        encounterChance: Math.max(0.01, Math.min(0.5, Number(stored.encounterChance ?? DEFAULT_CONFIG.encounterChance) || DEFAULT_CONFIG.encounterChance))
      };
    } catch (_) { return { ...DEFAULT_CONFIG }; }
  };
  function setConfig(value = {}) {
    const next = {
      enabled: value.enabled !== false,
      encounterChance: Math.max(0.01, Math.min(0.5, Number(value.encounterChance ?? DEFAULT_CONFIG.encounterChance) || DEFAULT_CONFIG.encounterChance))
    };
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(next)); } catch (_) {}
    window.dispatchEvent(new CustomEvent("boundless-spirit-encounter-config-updated", { detail: next }));
    return next;
  }
  function regionFromValue(value, regions) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const n = norm(raw);
    const direct = regions.find(region => n === norm(region) || n.includes(norm(region)));
    if (direct) return direct;
    const idMatch = raw.match(/region_(\d{1,2})(?:_|-|$)/i);
    if (idMatch) {
      const index = Number(idMatch[1]) - 1;
      if (regions[index]) return regions[index];
    }
    return "";
  }
  function currentLocation(save = readSave()) {
    const regions = window.BoundlessSpiritBeastTiers?.regions?.() || [];
    if (!save || !regions.length) return "";
    const candidates = [
      save.location, save.region, save.currentRegion, save.currentLocation,
      save.current_region, save.current_location, save.activeLocalPlace,
      save.world?.location, save.world?.region, save.player?.location,
      save.player?.region, save.exploration?.region, save.map?.currentRegion
    ];
    for (const candidate of candidates) {
      const found = regionFromValue(candidate, regions);
      if (found) return found;
    }
    return "";
  }
  function catalog() {
    return window.BoundlessSpiritBeastTiers?.list?.() || [];
  }
  function eligibleAt(region = currentLocation()) {
    if (!region) return [];
    const key = norm(region);
    return catalog().filter(beast => Array.isArray(beast.habitat) &&
      beast.habitat.some(habitat => norm(habitat) === key));
  }
  function findGamePanel() {
    return [...document.querySelectorAll('[role="tabpanel"]')].find(panel => {
      const trigger = document.querySelector('[role="tab"][data-state="active"][aria-controls="' + panel.id + '"]');
      return trigger && /Haiwan Roh|Binatang Roh/i.test(trigger.textContent || "");
    }) || null;
  }
  function findNativeSearchButton(panel) {
    const card = panel?.querySelector(".beast-encounter-card");
    if (!card) return null;
    return [...card.querySelectorAll("button")].find(button =>
      /Cari Telur|Cari Sarang Lain|Cari Sarang/i.test(button.textContent || "")
    ) || null;
  }
  function style() {
    if ($("#bc-spirit-encounter-style-v898")) return;
    const s = document.createElement("style");
    s.id = "bc-spirit-encounter-style-v898";
    s.textContent = `
      #${ROOT_ID}{margin:16px 0;padding:16px;border:1px solid #655333;border-radius:14px;background:linear-gradient(145deg,#111e17,#09120e);color:#f0e8d4}
      #${ROOT_ID} *{box-sizing:border-box}#${ROOT_ID} h2{margin:0;color:#e8cd86;font:700 1.3rem Georgia,serif}
      #${ROOT_ID} p{color:#aab9ad;line-height:1.55;font-size:.86rem;margin:.5rem 0}
      #${ROOT_ID} .ber-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
      #${ROOT_ID} .ber-region{color:#d8c18a;font-size:.82rem;margin-top:5px}
      #${ROOT_ID} .ber-count{border:1px solid #5a4a2d;border-radius:9px;padding:7px 10px;color:#e5cb86;font-size:.78rem}
      #${ROOT_ID} .ber-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
      #${ROOT_ID} button{border:1px solid #8d7541;border-radius:9px;background:#c3a55f;color:#10180f;padding:9px 12px;font:600 .82rem system-ui;cursor:pointer}
      #${ROOT_ID} button.secondary{background:#14251a;color:#e2d5b2;border-color:#405a45}
      #${ROOT_ID} button:disabled{opacity:.45;cursor:not-allowed}
      #${ROOT_ID} .ber-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      #${ROOT_ID} .ber-beast{padding:10px;border:1px solid #2d4837;border-radius:9px;background:#0b1710;min-width:0}
      #${ROOT_ID} .ber-beast strong{display:block;color:#f0e6cd;font-size:.87rem;overflow-wrap:anywhere}
      #${ROOT_ID} .ber-beast span{display:block;margin-top:4px;color:#c9b77e;font-size:.72rem}
      #${ROOT_ID} .ber-status{min-height:1.4em;color:#d9c98d!important}
      @media(max-width:650px){#${ROOT_ID}{padding:12px}#${ROOT_ID} .ber-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:420px){#${ROOT_ID} .ber-grid{grid-template-columns:1fr}#${ROOT_ID} .ber-actions button{flex:1}}
    `;
    document.head.appendChild(s);
  }
  function renderKey(panel) {
    const region = currentLocation();
    const eligible = eligibleAt(region);
    const native = findNativeSearchButton(panel);
    return [region, eligible.map(b => b.id).join(","), readConfig().enabled,
      readConfig().encounterChance, native?.disabled ? 1 : 0, native?.textContent || ""].join("|");
  }
  function render(root, panel) {
    const save = readSave();
    const region = currentLocation(save);
    const beasts = eligibleAt(region).sort((a,b) => a.id-b.id);
    const config = readConfig();
    const native = findNativeSearchButton(panel);
    const canSearch = !!save && config.enabled && beasts.length > 0 && !!native && !native.disabled;
    root.innerHTML = `
      <div class="ber-top"><div><h2>Habitat Haiwan Roh · 9 Tingkatan</h2><div class="ber-region">Wilayah watak: <strong>${esc(region || "Belum dikenal pasti")}</strong></div><p>Senarai ini menggunakan katalog rasmi 35 spesies. Kemunculan telur atau bayi, kontrak, masa perjalanan, inventori dan Bestiary diproses oleh sistem permainan asal.</p></div><div class="ber-count">${beasts.length} spesies di habitat ini</div></div>
      <div class="ber-actions"><button type="button" data-native-search ${canSearch ? "" : "disabled"}>Cari melalui Ekspedisi Sarang asal</button><button type="button" class="secondary" data-refresh>Segarkan habitat</button></div>
      <p class="ber-status" data-status role="status" aria-live="polite">${!save ? "Save permainan tidak ditemui. Muatkan watak dahulu." : !region ? "Lokasi save tidak dapat dipadankan dengan 41 wilayah peta sedia ada." : !beasts.length ? "Tiada spesies dalam katalog yang ditetapkan untuk wilayah ini; tiada spesies rawak akan dipaksa muncul." : !config.enabled ? "Penemuan Haiwan Roh dinyahaktifkan dalam Tetapan." : !native ? "Kad Ekspedisi Sarang asal belum tersedia. Buka tab Haiwan Roh dan cuba lagi." : native.disabled ? "Pilih kawasan liar atau Grotto-Heaven dengan Bahaya 3–5 untuk memulakan ekspedisi." : "Pencarian akan menggunakan sistem permainan asal dan menyimpan hasilnya bersama save watak."}</p>
      <div class="ber-grid">${beasts.map(b => '<article class="ber-beast"><strong>'+esc(b.name)+'</strong><span>Tingkatan asal: '+esc(b.tier)+'</span><span>Kelangkaan: '+esc(b.rarity)+'</span><span>Elemen: '+esc(b.element)+'</span></article>').join("") || '<article class="ber-beast"><strong>Tiada habitat untuk wilayah ini</strong><span>Data tidak akan diganti dengan kemunculan rawak.</span></article>'}</div>`;
    root.dataset.renderKey = renderKey(panel);
    root.querySelector("[data-native-search]")?.addEventListener("click", () => {
      const button = findNativeSearchButton(panel);
      const status = root.querySelector("[data-status]");
      if (!button || button.disabled) {
        if (status) status.textContent = "Ekspedisi belum tersedia. Pilih kawasan liar Bahaya 3–5 dahulu.";
        return;
      }
      button.click();
      if (status) status.textContent = "Permintaan dihantar kepada Ekspedisi Sarang asal. Keputusan, masa dan rekod akan dikendalikan oleh save permainan.";
    });
    root.querySelector("[data-refresh]")?.addEventListener("click", () => render(root, panel));
  }
  function mount() {
    style();
    document.getElementById("bc-ice-deer-card")?.remove();
    const panel = findGamePanel();
    if (!panel) return;
    let root = panel.querySelector("#" + ROOT_ID);
    if (!root) {
      root = document.createElement("section");
      root.id = ROOT_ID;
      const nativeCard = panel.querySelector(".beast-encounter-card");
      if (nativeCard) nativeCard.insertAdjacentElement("beforebegin", root);
      else panel.prepend(root);
      render(root, panel);
    } else if (root.dataset.renderKey !== renderKey(panel)) {
      render(root, panel);
    }
  }
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; mount(); });
  }
  window.BoundlessSpiritBeastEncounters = Object.freeze({
    version: "8.9.8",
    tiers: () => window.BoundlessSpiritBeastTiers?.tiers?.() || [],
    regions: () => window.BoundlessSpiritBeastTiers?.regions?.() || [],
    list: () => catalog().map(beast => ({ ...beast, habitat: beast.habitat.slice() })),
    currentLocation: () => currentLocation(),
    eligibleAt: region => eligibleAt(region).map(beast => ({ ...beast, habitat: beast.habitat.slice() })),
    getConfig: readConfig,
    setConfig,
    refresh: schedule
  });
  function boot() {
    mount();
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:["data-state"] });
    window.addEventListener("storage", schedule);
    window.addEventListener("boundless-spirit-encounter-config-updated", schedule);
    window.addEventListener("boundless-spirit-beast-config-updated", schedule);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
  else boot();
})();