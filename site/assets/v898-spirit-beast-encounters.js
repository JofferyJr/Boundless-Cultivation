/* Boundless v8.9.8 — unified regional Spirit Beast encounter runtime.
 * Uses the canonical 35-species / nine-tier catalogue. No region or species is added here.
 * GitHub Pages compatible; encounter history is device-local and never claims capture/inventory.
 */
(() => {
  "use strict";
  if (window.__BOUNDLESS_SPIRIT_ENCOUNTERS_V898__) return;
  window.__BOUNDLESS_SPIRIT_ENCOUNTERS_V898__ = true;

  const SAVE_KEY = "boundless-save";
  const STATE_KEY = "boundless-spirit-encounters-v898";
  const CONFIG_KEY = "boundless-spirit-encounter-settings-v898";
  const ROOT_ID = "bc-spirit-encounter-runtime";
  const TIER_WEIGHT = Object.freeze({
    "Fana": 40, "Spiritual": 25, "Bumi": 15, "Purba": 8,
    "Diraja": 5, "Suci": 3, "Ilahi": 2, "Primordial": 1.5, "Asal Dao": 0.5
  });
  const DEFAULT_CONFIG = Object.freeze({ enabled: true, encounterChance: 0.38, dailySearchLimit: 3 });

  const safeParse = value => { try { return JSON.parse(value || "null"); } catch (_) { return null; } };
  const readSave = () => safeParse(localStorage.getItem(SAVE_KEY));
  const readConfig = () => ({ ...DEFAULT_CONFIG, ...(safeParse(localStorage.getItem(CONFIG_KEY)) || {}) });
  const writeConfig = config => {
    const next = {
      enabled: config.enabled !== false,
      encounterChance: Math.max(0.05, Math.min(0.9, Number(config.encounterChance) || DEFAULT_CONFIG.encounterChance)),
      dailySearchLimit: Math.max(1, Math.min(10, Math.floor(Number(config.dailySearchLimit) || DEFAULT_CONFIG.dailySearchLimit)))
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("boundless-spirit-encounter-config-updated", { detail: next }));
    return next;
  };
  const normalize = value => String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase();
  const locationValue = value => {
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (value && typeof value === "object") return String(value.name || value.region || value.title || value.label || "");
    return "";
  };
  function currentLocation(save) {
    if (!save || typeof save !== "object") return "";
    const candidates = [
      save.location, save.region, save.currentRegion, save.currentLocation,
      save.current_region, save.current_location, save.world?.location,
      save.world?.region, save.player?.location, save.player?.region,
      save.exploration?.region, save.map?.currentRegion
    ].map(locationValue).filter(Boolean);
    const regions = window.BoundlessSpiritBeastTiers?.regions?.() || [];
    for (const candidate of candidates) {
      const n = normalize(candidate);
      const match = regions.find(region => n === normalize(region) || n.includes(normalize(region)));
      if (match) return match;
    }
    return candidates[0] || "";
  }
  function getCatalog() {
    const api = window.BoundlessSpiritBeastTiers;
    if (!api || typeof api.list !== "function") return [];
    return api.list().filter(beast => beast && Number.isFinite(Number(beast.id)) &&
      beast.name && Array.isArray(beast.habitat) && beast.habitat.length);
  }
  function characterScope(save) {
    return String(save?.slotId ?? save?.slot ?? save?.characterId ?? save?.character?.id ??
      save?.character?.name ?? save?.name ?? "default").slice(0, 100);
  }
  function readState(save = readSave()) {
    const all = safeParse(localStorage.getItem(STATE_KEY)) || {};
    const key = characterScope(save);
    const state = all[key] && typeof all[key] === "object" ? all[key] : {};
    return { all, key, state: {
      searches: state.searches && typeof state.searches === "object" ? state.searches : {},
      sightings: Array.isArray(state.sightings) ? state.sightings : [],
      bestiary: Array.isArray(state.bestiary) ? state.bestiary : [],
      activeEncounter: state.activeEncounter || null
    }};
  }
  function writeState(next, save = readSave()) {
    try {
      const current = readState(save);
      current.all[current.key] = next;
      localStorage.setItem(STATE_KEY, JSON.stringify(current.all));
      window.dispatchEvent(new CustomEvent("boundless-spirit-encounter-state-updated", { detail: { character: current.key } }));
      return true;
    } catch (_) { return false; }
  }
  const gameDay = save => Math.max(1, Number(save?.day ?? save?.calendar?.day ?? save?.time?.day) || 1);
  function eligibleAt(region) {
    if (!region) return [];
    const n = normalize(region);
    return getCatalog().filter(beast => beast.habitat.some(h => {
      const hn = normalize(h);
      return n === hn || n.includes(hn) || hn.includes(n);
    }));
  }
  function weightedTierPick(beasts, random = Math.random) {
    const tiers = [...new Set(beasts.map(b => b.tier))].filter(t => TIER_WEIGHT[t] > 0);
    const weights = tiers.map(t => TIER_WEIGHT[t]);
    let roll = random() * weights.reduce((sum, weight) => sum + weight, 0);
    let chosen = tiers[0];
    for (let i = 0; i < tiers.length; i++) {
      roll -= weights[i];
      if (roll < 0) { chosen = tiers[i]; break; }
    }
    const pool = beasts.filter(b => b.tier === chosen);
    return pool[Math.floor(random() * pool.length)] || beasts[0] || null;
  }
  function search(region, random = Math.random) {
    const save = readSave();
    const config = readConfig();
    if (!config.enabled) return { ok: false, reason: "disabled" };
    if (!save) return { ok: false, reason: "no-save" };
    const actualRegion = currentLocation(save);
    if (!actualRegion || normalize(actualRegion) !== normalize(region)) return { ok: false, reason: "location-changed" };
    const eligible = eligibleAt(actualRegion);
    if (!eligible.length) return { ok: false, reason: "no-habitat" };
    const current = readState(save);
    const day = gameDay(save);
    const key = normalize(actualRegion) + "|" + day;
    const used = Number(current.state.searches[key]) || 0;
    if (used >= config.dailySearchLimit) return { ok: false, reason: "limit", used, limit: config.dailySearchLimit };
    current.state.searches[key] = used + 1;
    if (random() >= config.encounterChance) {
      current.state.activeEncounter = null;
      writeState(current.state, save);
      return { ok: true, found: false, region: actualRegion, used: used + 1, limit: config.dailySearchLimit };
    }
    const beast = weightedTierPick(eligible, random);
    if (!beast) return { ok: false, reason: "no-habitat" };
    const encounter = {
      id: "enc-" + day + "-" + Date.now().toString(36) + "-" + Math.floor(random() * 1e6).toString(36),
      beastId: Number(beast.id), name: beast.name, tier: beast.tier, rarity: beast.rarity,
      element: beast.element, region: actualRegion, day, status: "spotted"
    };
    current.state.activeEncounter = encounter;
    current.state.sightings.unshift({ ...encounter, status: "spotted" });
    current.state.sightings = current.state.sightings.slice(0, 200);
    writeState(current.state, save);
    return { ok: true, found: true, encounter, used: used + 1, limit: config.dailySearchLimit };
  }
  function recordEncounter(action) {
    const save = readSave();
    const current = readState(save);
    const encounter = current.state.activeEncounter;
    if (!encounter || !["observe", "record"].includes(action)) return false;
    const sighting = current.state.sightings.find(item => item.id === encounter.id);
    if (action === "observe") {
      if (sighting) sighting.status = "observed";
      current.state.activeEncounter = { ...encounter, status: "observed" };
    } else {
      if (!current.state.bestiary.includes(encounter.beastId)) current.state.bestiary.push(encounter.beastId);
      if (sighting) sighting.status = "recorded";
      current.state.activeEncounter = { ...encounter, status: "recorded" };
    }
    return writeState(current.state, save);
  }
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function addStyle() {
    if (document.getElementById("bc-spirit-encounter-style-v898")) return;
    const style = document.createElement("style");
    style.id = "bc-spirit-encounter-style-v898";
    style.textContent = `
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
      #${ROOT_ID} .ber-encounter{margin-top:12px;padding:12px;border:1px solid #78643a;border-radius:10px;background:#191a11}
      #${ROOT_ID} .ber-status{min-height:1.4em;color:#d9c98d!important}
      #${ROOT_ID} .ber-history{margin-top:12px;border-top:1px solid #2e4435;padding-top:10px}
      #${ROOT_ID} .ber-history li{margin:4px 0;color:#b8c7b9;font-size:.78rem}
      @media(max-width:650px){#${ROOT_ID}{padding:12px}#${ROOT_ID} .ber-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:420px){#${ROOT_ID} .ber-grid{grid-template-columns:1fr}#${ROOT_ID} .ber-actions button{flex:1}}
    `;
    document.head.appendChild(style);
  }
  function findGamePanel() {
    const panels = [...document.querySelectorAll('[role="tabpanel"]')];
    return panels.find(panel => {
      const trigger = document.querySelector('[role="tab"][data-state="active"][aria-controls="' + panel.id + '"]');
      return trigger && /Haiwan Roh/i.test(trigger.textContent || "");
    }) || null;
  }
  function renderKey() {
    const save = readSave();
    const region = currentLocation(save);
    const state = readState(save).state;
    const day = gameDay(save);
    const used = Number(state.searches[normalize(region) + "|" + day]) || 0;
    const config = readConfig();
    return [characterScope(save), region, day, used, state.sightings.length, state.bestiary.length,
      state.activeEncounter?.id || "", state.activeEncounter?.status || "", config.enabled,
      config.encounterChance, config.dailySearchLimit].join("|");
  }
  function render(root) {
    const save = readSave();
    const region = currentLocation(save);
    const beasts = eligibleAt(region);
    const config = readConfig();
    const current = readState(save).state;
    const day = gameDay(save);
    const used = Number(current.searches[normalize(region) + "|" + day]) || 0;
    const active = current.activeEncounter;
    root.innerHTML = `
      <div class="ber-top"><div><h2>Penemuan Haiwan Roh · Sistem Wilayah</h2><div class="ber-region">Lokasi watak: <strong>${esc(region || "Belum dikenal pasti")}</strong></div><p>Haiwan hanya boleh ditemui apabila habitat spesies sepadan dengan wilayah watak. Kelangkaan dan tingkatan ialah sifat berasingan. Penemuan direkodkan pada peranti ini.</p></div><div class="ber-count">${beasts.length} spesies habitat</div></div>
      <div class="ber-actions"><button type="button" data-search ${(!config.enabled || !save || !region || !beasts.length || used >= config.dailySearchLimit) ? "disabled" : ""}>Jelajah kawasan</button><button type="button" class="secondary" data-refresh>Segarkan lokasi</button></div>
      <p class="ber-status" data-status role="status" aria-live="polite">${!save ? "Tiada save aktif dikesan. Mulakan atau muatkan permainan dahulu." : !region ? "Lokasi semasa tidak dapat dipadankan dengan 41 wilayah peta." : !beasts.length ? "Tiada spesies dalam katalog ditetapkan untuk habitat ini." : used >= config.dailySearchLimit ? "Had pencarian hari ini telah digunakan. Cuba lagi pada hari permainan seterusnya." : "Pencarian hari ini: " + used + " / " + config.dailySearchLimit + ". Peluang penemuan setiap pencarian: " + Math.round(config.encounterChance * 100) + "%."}</p>
      ${active ? '<div class="ber-encounter"><strong>Penemuan terkini: ' + esc(active.name) + '</strong><p>Tingkatan ' + esc(active.tier) + ' · Kelangkaan ' + esc(active.rarity) + ' · ' + esc(active.element) + '<br>Wilayah: ' + esc(active.region) + ' · Hari ' + active.day + '</p><div class="ber-actions"><button type="button" data-action="observe">Perhatikan</button><button type="button" class="secondary" data-action="record">Catat dalam Bestiary</button></div><p class="ber-status">' + (active.status === "recorded" ? "Spesies sudah direkodkan dalam Bestiary setempat." : active.status === "observed" ? "Pemerhatian disimpan." : "Haiwan ditemui; rekodkan pemerhatian atau masukkan spesies ke Bestiary.") + '</p></div>' : ""}
      <div class="ber-grid">${beasts.map(b => '<article class="ber-beast"><strong>' + esc(b.name) + '</strong><span>' + esc(b.tier) + ' · ' + esc(b.rarity) + '</span><span>' + esc(b.element) + '</span></article>').join("") || '<article class="ber-beast"><strong>Belum ada habitat</strong><span>Senarai ini menggunakan wilayah katalog rasmi sahaja.</span></article>'}</div>
      <div class="ber-history"><strong>Rekod setempat</strong><p>${current.sightings.length} penemuan · ${current.bestiary.length} spesies dalam Bestiary</p><ul>${current.sightings.slice(0,5).map(s => '<li>' + esc(s.name) + ' — ' + esc(s.region) + ' · Hari ' + s.day + ' · ' + esc(s.status) + '</li>').join("") || '<li>Belum ada penemuan direkodkan.</li>'}</ul></div>`;
    root.dataset.renderKey = renderKey();
    root.querySelector("[data-search]")?.addEventListener("click", () => {
      const result = search(region);
      render(root);
      const status = root.querySelector("[data-status]");
      if (!result.ok && status) {
        status.textContent = result.reason === "limit" ? "Had pencarian harian dicapai (" + result.used + "/" + result.limit + ")." : "Pencarian tidak dapat dijalankan: semak save, lokasi dan tetapan.";
      } else if (result.ok && !result.found && status) {
        status.textContent = "Anda menjelajah " + region + ", tetapi tiada Haiwan Roh muncul kali ini. Pencarian " + result.used + "/" + result.limit + ".";
      }
    });
    root.querySelector("[data-refresh]")?.addEventListener("click", () => render(root));
    root.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
      recordEncounter(button.dataset.action);
      render(root);
    }));
  }
  function mount() {
    addStyle();
    document.getElementById("bc-ice-deer-card")?.remove();
    const panel = findGamePanel();
    if (!panel) return;
    let root = panel.querySelector("#" + ROOT_ID);
    if (!root) {
      root = document.createElement("section");
      root.id = ROOT_ID;
      const legacyToolbar = panel.querySelector("#boundless-spirit-beasts-tools");
      if (legacyToolbar) legacyToolbar.insertAdjacentElement("beforebegin", root);
      else panel.prepend(root);
      render(root);
    } else if (root.dataset.renderKey !== renderKey()) {
      render(root);
    }
  }
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; mount(); });
  }
  function boot() {
    mount();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state"] });
    window.addEventListener("storage", schedule);
    window.addEventListener("boundless-spirit-encounter-config-updated", schedule);
    window.addEventListener("boundless-spirit-encounter-state-updated", schedule);
    window.addEventListener("boundless-spirit-beast-config-updated", schedule);
  }
  window.BoundlessSpiritBeastEncounters = Object.freeze({
    version: "8.9.8",
    tiers: () => window.BoundlessSpiritBeastTiers?.tiers?.() || [],
    regions: () => window.BoundlessSpiritBeastTiers?.regions?.() || [],
    list: () => getCatalog().map(beast => ({ ...beast, habitat: beast.habitat.slice() })),
    currentLocation: () => currentLocation(readSave()),
    eligibleAt: region => eligibleAt(region).map(beast => ({ ...beast, habitat: beast.habitat.slice() })),
    search,
    record: recordEncounter,
    getState: () => readState().state,
    getConfig: readConfig,
    setConfig: writeConfig
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();