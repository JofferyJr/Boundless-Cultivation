/* Boundless v8.9.4 — Ice-Soul Spirit Deer wildlife encounter
 * Registers 冰魄灵鹿仙君 as a regional living beast, not just a loose image.
 * Static/GitHub Pages compatible. */
(() => {
  "use strict";
  if (window.__BOUNDLESS_ICE_SOUL_DEER__) return;
  window.__BOUNDLESS_ICE_SOUL_DEER__ = true;

  const SAVE_KEY = "boundless-save";
  const STATE_KEY = "boundless-spirit-deer-v1";
  const IMAGE = "/Boundless-Cultivation/game-assets/beasts/" + encodeURIComponent("冰魄灵鹿仙君_Beast.webp");
  const HABITATS = ["Dataran Beiming", "Puncak Xuefeng", "Gunung Tianbing", "Pulau Xuanshuang"];
  const BEAST = {
    id: "ice-soul-spirit-deer",
    name: "冰魄灵鹿仙君",
    localName: "Rusa Roh Jiwa Ais",
    type: "Binatang Roh",
    rarity: "Langka · Atribut Ais",
    description: "Rusa roh yang hidup di kawasan bersalji dan tanah tinggi berais. Ia bergerak tenang di antara kabus sejuk dan biasanya mengelak daripada manusia.",
    habitats: HABITATS
  };
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function readSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch (_) { return null; }
  }
  function readState() {
    try {
      const s = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
      return s && typeof s === "object" ? s : { sightings: 0, recorded: false, lastObservedDay: null };
    } catch (_) { return { sightings: 0, recorded: false, lastObservedDay: null }; }
  }
  function saveState(s) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch (_) {}
  }
  function currentLocation(save) {
    if (!save) return "";
    return String(save.location || save.region || save.currentRegion || save.currentLocation || "");
  }
  function findHabitat(location) {
    return HABITATS.find(name => location === name || location.includes(name)) || "";
  }
  function ensureStyle() {
    if (document.getElementById("bc-ice-deer-style")) return;
    const style = document.createElement("style");
    style.id = "bc-ice-deer-style";
    style.textContent = `
      #bc-ice-deer-card{position:fixed;left:16px;bottom:16px;z-index:99990;width:min(370px,calc(100vw - 32px));max-height:76vh;overflow:auto;background:linear-gradient(145deg,#10201f 0%,#0a1317 100%);color:#eef7f4;border:1px solid #8dbdc5;border-radius:15px;box-shadow:0 14px 40px #0009;font:13px/1.5 system-ui,sans-serif}
      #bc-ice-deer-card *{box-sizing:border-box}
      #bc-ice-deer-card .bcid-head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:11px 13px;border-bottom:1px solid #31545a}
      #bc-ice-deer-card .bcid-head strong{font-size:14px;color:#d6f4f4}
      #bc-ice-deer-card .bcid-close{border:1px solid #45656a;border-radius:8px;background:#122326;color:#e8f6f5;padding:2px 9px;cursor:pointer}
      #bc-ice-deer-card .bcid-art{display:block;width:100%;height:210px;object-fit:contain;background:radial-gradient(ellipse,#d8f3f41a,transparent 70%);padding:6px}
      #bc-ice-deer-card .bcid-body{padding:0 13px 13px}
      #bc-ice-deer-card .bcid-name{font-size:18px;font-weight:750;color:#e5f7f7}
      #bc-ice-deer-card .bcid-sub{color:#a9d5dc;margin-bottom:7px}
      #bc-ice-deer-card .bcid-tag{display:inline-block;border:1px solid #5c929b;border-radius:99px;padding:2px 8px;margin:0 4px 8px 0;color:#d0eff1;font-size:11px}
      #bc-ice-deer-card .bcid-actions{display:flex;gap:8px;margin-top:10px}
      #bc-ice-deer-card .bcid-actions button{flex:1;border:1px solid #659da5;border-radius:8px;padding:8px 9px;background:#183337;color:#eafafa;cursor:pointer;font-weight:650}
      #bc-ice-deer-card .bcid-actions button:hover{background:#24464b}
      #bc-ice-deer-card .bcid-note{color:#b4d3d6;font-size:11px;margin-top:8px}
      @media(max-width:480px){#bc-ice-deer-card{left:8px;bottom:8px;width:calc(100vw - 16px)}#bc-ice-deer-card .bcid-art{height:165px}}
    `;
    document.head.appendChild(style);
  }
  function render(habitat, location) {
    ensureStyle();
    let card = document.getElementById("bc-ice-deer-card");
    if (!card) {
      card = document.createElement("aside");
      card.id = "bc-ice-deer-card";
      card.setAttribute("aria-label", "Binatang roh di kawasan ini");
      document.body.appendChild(card);
    }
    const state = readState();
    card.dataset.habitat = habitat;
    card.style.display = "";
    card.innerHTML =
      '<div class="bcid-head"><strong>🐾 Binatang Roh di Kawasan Ini</strong><button class="bcid-close" type="button" aria-label="Tutup">×</button></div>' +
      '<img class="bcid-art" src="' + IMAGE + '" alt="冰魄灵鹿仙君 — Rusa Roh Jiwa Ais" loading="lazy">' +
      '<div class="bcid-body"><div class="bcid-name">' + esc(BEAST.name) + '</div>' +
      '<div class="bcid-sub">' + esc(BEAST.localName) + '</div>' +
      '<span class="bcid-tag">' + esc(BEAST.type) + '</span><span class="bcid-tag">' + esc(BEAST.rarity) + '</span>' +
      '<p>' + esc(BEAST.description) + '</p>' +
      '<div><b>Habitat:</b> ' + esc(habitat) + '</div>' +
      '<div><b>Keadaan:</b> ' + (state.lastObservedDay === (Number(readSave()?.day) || 1) ? 'Sedang diperhatikan' : 'Kelihatan di kawasan ini') + '</div>' +
      '<div class="bcid-actions"><button type="button" data-observe>Perhatikan</button><button type="button" data-record>' + (state.recorded ? '✓ Dicatat dalam Bestiary' : 'Catat Bestiary') + '</button></div>' +
      '<div class="bcid-note" data-note>' + (state.recorded ? 'Rekod penemuan disimpan pada peranti ini.' : 'Ia boleh diperhatikan apabila watak berada di habitatnya.') + '</div></div>';
    card.querySelector(".bcid-close").addEventListener("click", () => { card.style.display = "none"; });
    card.querySelector("[data-observe]").addEventListener("click", () => {
      const s = readState();
      s.sightings = (Number(s.sightings) || 0) + 1;
      s.lastObservedDay = Number(readSave()?.day) || 1;
      saveState(s);
      const note = card.querySelector("[data-note]");
      if (note) note.textContent = "Anda memerhatikan Rusa Roh Jiwa Ais dengan tenang. Jumlah pemerhatian: " + s.sightings + ".";
      const condition = card.querySelector(".bcid-body > div:nth-of-type(3)");
      if (condition) condition.innerHTML = "<b>Keadaan:</b> Sedang diperhatikan";
    });
    card.querySelector("[data-record]").addEventListener("click", () => {
      const s = readState();
      s.recorded = true;
      s.recordedAtLocation = habitat;
      s.recordedAtDay = Number(readSave()?.day) || 1;
      saveState(s);
      const btn = card.querySelector("[data-record]");
      if (btn) btn.textContent = "✓ Dicatat dalam Bestiary";
      const note = card.querySelector("[data-note]");
      if (note) note.textContent = "Rekod penemuan disimpan pada peranti ini.";
    });
  }
  function update() {
    const save = readSave();
    const habitat = findHabitat(currentLocation(save));
    const card = document.getElementById("bc-ice-deer-card");
    if (!save || !habitat) {
      card?.remove();
      return;
    }
    if (!card || card.dataset.habitat !== habitat) render(habitat, currentLocation(save));
  }
  function boot() {
    update();
    window.addEventListener("storage", update);
    const observer = new MutationObserver(() => update());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setInterval(update, 1800);
    window.BoundlessSpiritBeasts = {
      version: "8.9.4",
      list: () => [Object.assign({}, BEAST)],
      habitats: () => HABITATS.slice(),
      getState: readState
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
