/* Boundless v8.9.8 — global Spirit Beast encounter settings/editor.
 * Replaces the obsolete one-deer-only editor. Canonical species and habitats come from v897.
 */
(() => {
  "use strict";
  if (window.__BC_SPIRIT_BEAST_EDITOR_V898__) return;
  window.__BC_SPIRIT_BEAST_EDITOR_V898__ = true;
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const TIERS = ["Fana","Spiritual","Bumi","Purba","Diraja","Suci","Ilahi","Primordial","Asal Dao"];
  function style() {
    if ($("#bc-spirit-editor-v898-style")) return;
    const s = document.createElement("style");
    s.id = "bc-spirit-editor-v898-style";
    s.textContent = `
      #bc-spirit-editor-v898{color:#efe7d3;display:grid;gap:14px}
      #bc-spirit-editor-v898 .bse-box{padding:16px;border:1px solid #304737;border-radius:13px;background:#0c1710}
      #bc-spirit-editor-v898 h3{margin:0 0 8px;color:#f2e6c8;font:1.2rem Georgia,serif}
      #bc-spirit-editor-v898 p,#bc-spirit-editor-v898 small{color:#9fb2a2;line-height:1.6}
      #bc-spirit-editor-v898 .bse-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
      #bc-spirit-editor-v898 label{display:grid;gap:6px;color:#d9cfad;font-size:.82rem}
      #bc-spirit-editor-v898 input:not([type=checkbox]):not([type=range]),#bc-spirit-editor-v898 select{box-sizing:border-box;width:100%;padding:10px;border:1px solid #3b5543;border-radius:9px;background:#07110b;color:#f5ecd7;font:inherit}
      #bc-spirit-editor-v898 input[type=range]{width:100%;accent-color:#c6a95e}
      #bc-spirit-editor-v898 .bse-check{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #2f4937;border-radius:9px;background:#101e14}
      #bc-spirit-editor-v898 input[type=checkbox]{accent-color:#c6a95e}
      #bc-spirit-editor-v898 .bse-actions{display:flex;gap:10px;flex-wrap:wrap}
      #bc-spirit-editor-v898 button{padding:10px 14px;border:1px solid #9b8247;border-radius:9px;background:#c1a35d;color:#10170f;font-weight:750;cursor:pointer}
      #bc-spirit-editor-v898 button.secondary{background:#14241a;color:#e1d5b1;border-color:#3c5945}
      #bc-spirit-editor-v898 [data-status]{color:#d6c27d;min-height:1.5em}
      #bc-spirit-editor-v898 .bse-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      #bc-spirit-editor-v898 .bse-species{padding:10px;border:1px solid #2c4536;border-radius:9px;background:#0a150e;min-width:0}
      #bc-spirit-editor-v898 .bse-species strong{display:block;color:#f1e6ca;overflow-wrap:anywhere}
      #bc-spirit-editor-v898 .bse-species span{display:block;margin-top:4px;color:#d0bd82;font-size:.74rem}
      #bc-spirit-editor-v898 .bse-species p{font-size:.76rem;margin:.35rem 0 0;overflow-wrap:anywhere}
      @media(max-width:650px){#bc-spirit-editor-v898 .bse-grid,#bc-spirit-editor-v898 .bse-list{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }
  function api() { return window.BoundlessSpiritBeastEncounters; }
  function mount(root) {
    const grid = root && $(".bc-revamp-grid", root);
    if (!grid || $('[data-action="spirit-beasts"]', grid)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bc-revamp-card";
    button.dataset.action = "spirit-beasts";
    button.innerHTML = '<span class="bc-revamp-card-top"><span class="bc-revamp-icon">🐾</span><span class="bc-revamp-tag">SISTEM</span></span><strong>Haiwan Roh</strong><span class="bc-revamp-desc">Urus pencarian wilayah, peluang penemuan dan katalog 35 spesies.</span><span class="bc-revamp-arrow">↗</span>';
    button.addEventListener("click", () => open(root));
    grid.appendChild(button);
  }
  function open(root) {
    style();
    const scope = root.closest(".bc-settings-sheet,[role=dialog]");
    scope?.querySelectorAll('[role="tabpanel"]').forEach(p => {
      p.hidden = true; p.style.display = "none"; p.setAttribute("aria-hidden","true");
    });
    root.dataset.view = "local:spirit-beasts";
    root.hidden = false; root.style.display = "block"; root.setAttribute("aria-hidden","false");
    root.querySelectorAll(".bc-revamp-hero,.bc-revamp-section-head,.bc-revamp-grid").forEach(el => el.hidden = true);
    let panel = $(".bc-revamp-local-panel", root);
    if (!panel) { panel = document.createElement("section"); panel.className = "bc-revamp-local-panel"; root.appendChild(panel); }
    panel.hidden = false;
    const engine = api();
    const config = engine?.getConfig?.() || { enabled:true, encounterChance:.38, dailySearchLimit:3 };
    const beasts = engine?.list?.() || window.BoundlessSpiritBeastTiers?.list?.() || [];
    const tiers = engine?.tiers?.() || TIERS;
    panel.innerHTML = `
      <button type="button" class="bc-revamp-back">← Kembali ke Pusat Tetapan</button>
      <div class="bc-revamp-local-kicker">BOUNDLESS · SISTEM HIDUPAN LIAR · v8.9.8</div>
      <h2>Haiwan Roh — Sistem Wilayah</h2>
      <p class="bc-revamp-local-subtitle">Editor ini mengawal sistem penemuan wilayah untuk semua 35 spesies. Habitat diambil daripada katalog rasmi dan hanya menggunakan 41 wilayah peta sedia ada. Tingkatan asal tidak berubah apabila individu berevolusi; kelangkaan kekal berasingan.</p>
      <div id="bc-spirit-editor-v898">
        <div class="bse-box"><h3>Tetapan penemuan</h3>
          <label class="bse-check"><input name="enabled" type="checkbox" ${config.enabled ? "checked" : ""}> Aktifkan penemuan Haiwan Roh di wilayah</label>
          <div class="bse-grid" style="margin-top:12px">
            <label>Peluang penemuan <strong data-chance>${Math.round(config.encounterChance*100)}%</strong><input name="chance" type="range" min="5" max="90" step="1" value="${Math.round(config.encounterChance*100)}"></label>
            <label>Had pencarian setiap hari permainan<select name="limit">${[1,2,3,4,5,6,7,8,9,10].map(n=>'<option value="'+n+'" '+(Number(config.dailySearchLimit)===n?'selected':'')+'>'+n+' pencarian</option>').join("")}</select></label>
            <label>Jumlah katalog<input value="${beasts.length} spesies · ${tiers.length} tingkatan" readonly></label>
          </div>
          <p>Peluang penemuan mengawal sama ada sesuatu pencarian menghasilkan pertemuan. Pemilihan tingkatan menggunakan pemberat dalaman; spesies yang dipilih sentiasa ditapis berdasarkan habitat wilayah semasa.</p>
          <div class="bse-actions"><button type="button" data-save>Simpan tetapan</button><button type="button" class="secondary" data-reset>Reset tetapan asal</button></div>
          <p data-status role="status" aria-live="polite"></p>
        </div>
        <div class="bse-box"><h3>9 tingkatan rasmi</h3><p>${tiers.map(esc).join(" · ")}</p><div class="bse-list">${beasts.slice().sort((a,b)=>tiers.indexOf(a.tier)-tiers.indexOf(b.tier)||a.id-b.id).map(b=>'<article class="bse-species"><strong>'+esc(b.id+'. '+b.name)+'</strong><span>'+esc(b.tier)+' · Kelangkaan: '+esc(b.rarity)+'</span><p>Elemen: '+esc(b.element)+'</p><p>Habitat: '+b.habitat.map(esc).join(" · ")+'</p></article>').join("")}</div></div>
      </div>`;
    panel.querySelector(".bc-revamp-back").addEventListener("click", () => {
      panel.hidden = true;
      root.querySelectorAll(".bc-revamp-hero,.bc-revamp-section-head,.bc-revamp-grid").forEach(el => el.hidden = false);
      root.dataset.view = "dashboard";
    });
    const editor = $("#bc-spirit-editor-v898", panel);
    editor.querySelector('[name="chance"]').addEventListener("input", e => { editor.querySelector("[data-chance]").textContent = e.target.value + "%"; });
    editor.querySelector("[data-save]").addEventListener("click", () => {
      const currentApi = api();
      if (!currentApi?.setConfig) { editor.querySelector("[data-status]").textContent = "Enjin v8.9.8 belum tersedia. Muat semula permainan selepas penerbitan."; return; }
      try {
        currentApi.setConfig({
          enabled: editor.querySelector('[name="enabled"]').checked,
          encounterChance: Number(editor.querySelector('[name="chance"]').value)/100,
          dailySearchLimit: Number(editor.querySelector('[name="limit"]').value)
        });
        editor.querySelector("[data-status]").textContent = "Tetapan disimpan dan digunakan oleh sistem penemuan wilayah.";
      } catch (_) { editor.querySelector("[data-status]").textContent = "Tetapan gagal disimpan pada peranti ini."; }
    });
    editor.querySelector("[data-reset]").addEventListener("click", () => {
      const currentApi = api();
      if (!currentApi?.setConfig) return;
      try {
        const defaults = currentApi.setConfig({ enabled:true, encounterChance:.38, dailySearchLimit:3 });
        editor.querySelector('[name="enabled"]').checked = defaults.enabled;
        editor.querySelector('[name="chance"]').value = String(Math.round(defaults.encounterChance*100));
        editor.querySelector("[data-chance]").textContent = Math.round(defaults.encounterChance*100)+"%";
        editor.querySelector('[name="limit"]').value = String(defaults.dailySearchLimit);
        editor.querySelector("[data-status]").textContent = "Tetapan asal dipulihkan.";
      } catch (_) { editor.querySelector("[data-status]").textContent = "Reset gagal."; }
    });
  }
  const observe = () => mount($("#bc-settings-revamp"));
  const observer = new MutationObserver(observe);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once:true });
  else observe();
})();