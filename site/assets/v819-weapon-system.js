/* Boundless Cultivation v8.2 Weapon System - REFINED
 * Modular weapon/item runtime. No opaque payloads; all state is JSON/localStorage.
 * Fix: opts bug, XSS hardening, error handling, performance, null checks.
 */
(() => {
  "use strict";

  const KEY = "boundless-weapon-system-v1";
  const VERSION = 1;

  const GRADES = [
    { id: "mortal", name: "Mortal", rank: 1, base: 1, trib: 0 },
    { id: "spiritual", name: "Spiritual", rank: 2, base: 1.35, trib: 0 },
    { id: "earth", name: "Earth", rank: 3, base: 1.8, trib: 0.15 },
    { id: "heaven", name: "Heaven", rank: 4, base: 2.5, trib: 0.4 },
    { id: "immortal", name: "Immortal", rank: 5, base: 3.5, trib: 0.7 },
    { id: "divine", name: "Divine", rank: 6, base: 5, trib: 0.95 },
  ];

  const TYPES = {
    sword: { id: "sword", name: "Pedang", atk: 1.08, spd: 1.05, crit: 0.03, reach: 1.1, tags: ["sword", "blade"] },
    saber: { id: "saber", name: "Saber", atk: 1.16, spd: 0.94, crit: 0.04, reach: 1.0, tags: ["blade", "martial"] },
    spear: { id: "spear", name: "Tombak", atk: 1.12, spd: 0.98, crit: 0.02, reach: 1.3, tags: ["polearm", "pierce"] },
    bow: { id: "bow", name: "Busur", atk: 1.02, spd: 1.08, crit: 0.06, reach: 1.5, tags: ["ranged", "pierce"] },
    staff: { id: "staff", name: "Tongkat", atk: 0.92, spd: 0.9, crit: 0.02, reach: 1.1, tags: ["focus", "spell"] },
    fan: { id: "fan", name: "Kipas", atk: 0.88, spd: 1.12, crit: 0.05, reach: 1.0, tags: ["focus", "wind"] },
    guandao: { id: "guandao", name: "Guandao", atk: 1.22, spd: 0.82, crit: 0.03, reach: 1.25, tags: ["polearm", "blade"] },
    hammer: { id: "hammer", name: "Palu", atk: 1.3, spd: 0.7, crit: 0.02, reach: 0.9, tags: ["blunt", "forge"] },
    dagger: { id: "dagger", name: "Belati", atk: 0.86, spd: 1.3, crit: 0.08, reach: 0.7, tags: ["blade", "assassin"] },
    orb: { id: "orb", name: "Orb", atk: 0.8, spd: 1.0, crit: 0.04, reach: 1.2, tags: ["focus", "spell"] },
  };

  const MATERIALS = {
    iron: { name: "Iron", atk: 1, def: 1, stability: 70, aff: ["Kukuh"] },
    spiritSteel: { name: "Spirit Steel", atk: 1.25, def: 1.15, stability: 82, aff: ["Spirit Flow"] },
    coldJade: { name: "Cold Jade", atk: 1.05, def: 1.3, stability: 86, aff: ["Ais", "Kukuh"] },
    thunderstone: { name: "Thunderstone", atk: 1.3, def: 0.95, stability: 72, aff: ["Kilat"] },
    phoenixMetal: { name: "Phoenix Metal", atk: 1.42, def: 1.08, stability: 68, aff: ["Api", "Rebirth"] },
    voidOre: { name: "Void Ore", atk: 1.55, def: 0.9, stability: 60, aff: ["Ruang", "Void Edge"] },
    starIron: { name: "Star Iron", atk: 1.48, def: 1.25, stability: 78, aff: ["Astral", "Kukuh"] },
  };

  const CATALYSTS = {
    flame: { name: "Flame Core", element: "Api", power: 18, stability: -5, skill: "Flame Edge" },
    frost: { name: "Frost Core", element: "Ais", power: 16, stability: -2, skill: "Frozen Veil" },
    storm: { name: "Storm Core", element: "Kilat", power: 20, stability: -8, skill: "Thunder Arc" },
    gale: { name: "Gale Core", element: "Angin", power: 14, stability: 1, skill: "Gale Step" },
    light: { name: "Light Core", element: "Cahaya", power: 13, stability: 3, skill: "Radiant Guard" },
    shadow: { name: "Shadow Core", element: "Gelap", power: 17, stability: -6, skill: "Silent Edge" },
    space: { name: "Void Core", element: "Ruang", power: 24, stability: -12, skill: "Void Rend" },
  };

  const RUNES = [
    ["swordQi", "Pedang Qi", 5],
    ["lightning", "Kilat", 4],
    ["fire", "Api", 4],
    ["ice", "Ais", 4],
    ["wind", "Angin", 3],
    ["illusion", "Ilusi", 3],
    ["defense", "Pertahanan", 3],
    ["space", "Ruang", 5],
    ["soul", "Jiwa", 5],
  ];

  const KARMA = {
    orthodox: { name: "Orthodox", damage: 1, def: 1.12, crit: 0, corrupt: 0 },
    neutral: { name: "Neutral", damage: 1.06, def: 1.04, crit: 0.02, corrupt: 0.01 },
    asura: { name: "Asura/Demonic", damage: 1.2, def: 0.94, crit: 0.06, corrupt: 0.08 },
  };

  const INTENT = ["Tiada", "Kesedaran Senjata", "Jiwa Senjata", "Roh Senjata", "Dewa Senjata"];

  const AFF = [
    ["Kukuh", "Durability +12%"],
    ["Spirit Flow", "Qi efficiency +8%"],
    ["Flame Edge", "Fire damage +12%"],
    ["Frozen Veil", "Defense +10%"],
    ["Thunder Arc", "Lightning damage +14%"],
    ["Gale Step", "Speed +9%"],
    ["Radiant Guard", "Defense +14%"],
    ["Silent Edge", "Crit damage +18%"],
    ["Void Rend", "Penetration +16%"],
    ["Rebirth", "Repair regeneration +1%/min"],
    ["Astral", "Damage +7%, crit +3%"],
  ];

  const DEFAULT_MATERIALS = { iron: 12, spiritSteel: 8, coldJade: 4, thunderstone: 3, phoenixMetal: 1, voidOre: 1, starIron: 1 };

  // --- Helpers ---
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const x = raw ? JSON.parse(raw) : null;
      if (x && x.version === VERSION && Array.isArray(x.weapons)) return x;
    } catch {}
    return { version: VERSION, weapons: [], materials: { ...DEFAULT_MATERIALS }, active: null, log: [] };
  }

  let state = load();

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("[WeaponSystem] save failed", e);
    }
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const grade = (id) => GRADES.find((g) => g.id === id) || GRADES[0];

  function rollQuality() {
    const r = Math.random();
    return r > 0.98 ? 5 : r > 0.9 ? 4 : r > 0.68 ? 3 : r > 0.3 ? 2 : 1;
  }

  function weaponPower(w) {
    const g = grade(w.grade);
    const t = TYPES[w.type];
    const m = MATERIALS[w.material];
    if (!g || !t || !m) return 0;
    let p = 100 * g.base * t.atk * m.atk * (1 + w.refine * 0.065) * (1 + (w.quality - 1) * 0.055);
    p *= 1 + w.runes.reduce((a, r) => a + r[2], 0) * 0.01;
    p *= (KARMA[w.karma]?.damage || 1);
    if (w.intent > 0) p *= 1 + w.intent * 0.06;
    if (w.resonance >= 80) p *= 1.1;
    return Math.round(p);
  }

  function defense(w) {
    const g = grade(w.grade);
    const t = TYPES[w.type];
    const m = MATERIALS[w.material];
    if (!g || !t || !m) return 0;
    return Math.round(30 * g.base * t.spd * m.def * (1 + w.tempering * 0.04) * (KARMA[w.karma]?.def || 1));
  }

  function makeWeapon(type, gradeId, material, catalyst, karma) {
    const g = grade(gradeId);
    const m = MATERIALS[material];
    const c = CATALYSTS[catalyst];
    if (!m || !c) return null;
    const aff = [...m.aff];
    if (c.skill && !aff.includes(c.skill)) aff.push(c.skill);
    if (Math.random() < 0.28) aff.push(pick(AFF)[0]);

    const w = {
      id: "WPN-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      name: "Unnamed " + (TYPES[type]?.name || type),
      type,
      grade: gradeId,
      quality: rollQuality(),
      material,
      catalyst,
      element: c.element,
      karma,
      intent: 0,
      refine: 0,
      tempering: 0,
      mastery: 0,
      resonance: 0,
      durability: 100,
      maxDurability: 100,
      affixes: [...new Set(aff)],
      runes: [],
      soulBound: false,
      setTag: null,
      createdAt: new Date().toISOString(),
    };
    w.power = weaponPower(w);
    w.guard = defense(w);
    return w;
  }

  // --- Core Actions ---
  function forge() {
    const typeEl = document.querySelector("#bc-wpn-type");
    const gradeEl = document.querySelector("#bc-wpn-grade");
    const matEl = document.querySelector("#bc-wpn-material");
    const catEl = document.querySelector("#bc-wpn-catalyst");
    const karmaEl = document.querySelector("#bc-wpn-karma");
    if (!typeEl || !gradeEl || !matEl || !catEl || !karmaEl) return;

    const type = typeEl.value;
    const g = gradeEl.value;
    const mat = matEl.value;
    const cat = catEl.value;
    const karma = karmaEl.value;

    if (!state.materials[mat] || state.materials[mat] <= 0) {
      toast("Bahan teras tidak mencukupi.");
      return;
    }
    const gObj = grade(g);
    const stability = clamp((MATERIALS[mat].stability + CATALYSTS[cat].stability + gObj.rank * 3), 0, 100);
    const purity = 70 + Math.floor(Math.random() * 31);
    const trib = Math.round(gObj.trib * 100);

    if (stability < 35) {
      toast("Forge gagal: Stability terlalu rendah (" + stability + "%).");
      return;
    }
    if (Math.random() < gObj.trib * 0.22) {
      toast("Forge gagal: Dao Tribulation memecahkan bentuk senjata!");
      state.materials[mat]--;
      save();
      render();
      return;
    }

    state.materials[mat]--;
    const w = makeWeapon(type, g, mat, cat, karma);
    if (!w) {
      toast("Forge gagal: data tidak sah.");
      return;
    }
    w.purity = purity;
    w.stability = stability;
    w.tribulation = trib;
    w.name = gObj.name + " " + TYPES[type].name;

    state.weapons.unshift(w);
    state.active = w.id;
    state.log.unshift({ at: new Date().toISOString(), event: "Forge", id: w.id, purity, stability });
    if (state.log.length > 100) state.log.length = 100;
    save();
    render();
    toast("Berjaya forge: " + w.name);
  }

  function getActive() {
    return state.weapons.find((x) => x.id === state.active) || null;
  }

  function refine() {
    const w = getActive();
    if (!w) return;
    const chance = clamp(0.92 - w.refine * 0.075, 0.18, 0.92);
    if (Math.random() > chance) {
      w.durability = Math.max(1, w.durability - 8);
      toast("Refinement gagal. Durability -8");
      save();
      render();
      return;
    }
    w.refine++;
    w.durability = Math.max(1, w.durability - 3);
    toast("Refinement berjaya: +" + w.refine);
    save();
    render();
  }

  function temper() {
    const w = getActive();
    if (!w) return;
    if (w.tempering >= 10) {
      toast("Tempering maksimum (10).");
      return;
    }
    const chance = 0.88 - w.tempering * 0.055;
    if (Math.random() > chance) {
      w.tempering = Math.max(0, w.tempering - 1);
      toast("Tempering backlash: tahap turun.");
    } else {
      w.tempering++;
      toast("Tempering berjaya: " + w.tempering);
    }
    w.durability = Math.max(1, w.durability - 5);
    save();
    render();
  }

  function inscribe() {
    const w = getActive();
    if (!w) return;
    const unused = RUNES.filter((r) => !w.runes.some((x) => x[0] === r[0]));
    if (!unused.length) {
      toast("Matrix Dao Rune penuh.");
      return;
    }
    w.runes.push(pick(unused));
    w.durability = Math.max(1, w.durability - 2);
    save();
    render();
  }

  function awakenIntent() {
    const w = getActive();
    if (!w) return;
    if (w.intent >= 4) {
      toast("Weapon God telah dicapai.");
      return;
    }
    const req = [0, 20, 45, 75, 100][w.intent + 1];
    if (w.mastery < req) {
      toast("Mastery belum cukup: " + req + "% diperlukan.");
      return;
    }
    w.intent++;
    w.resonance = Math.max(w.resonance, 20 * w.intent);
    toast("Awaken: " + INTENT[w.intent]);
    save();
    render();
  }

  function repair() {
    const w = getActive();
    if (!w) return;
    w.durability = clamp(w.durability + 25, 0, w.maxDurability);
    save();
    render();
    toast("Repaired +" + 25);
  }

  function gainMastery() {
    const w = getActive();
    if (!w) return;
    w.mastery = clamp(w.mastery + 5, 0, 100);
    w.resonance = clamp(w.resonance + 3, 0, 100);
    save();
    render();
  }

  function rename() {
    const w = getActive();
    if (!w) return;
    const n = prompt("Nama senjata", w.name);
    if (n && n.trim()) {
      w.name = n.trim().slice(0, 40);
      save();
      render();
    }
  }

  function removeWeapon() {
    const w = getActive();
    if (!w) return;
    if (!confirm("Hapus " + w.name + "?")) return;
    state.weapons = state.weapons.filter((x) => x.id !== w.id);
    state.active = state.weapons[0]?.id || null;
    save();
    render();
  }

  // --- UI ---
  function toast(msg) {
    let t = document.getElementById("bc-wpn-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "bc-wpn-toast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function open() {
    let o = document.getElementById("bc-wpn-overlay");
    if (!o) {
      build();
      o = document.getElementById("bc-wpn-overlay");
    }
    if (o) o.hidden = false;
    render();
  }

  function close() {
    const o = document.getElementById("bc-wpn-overlay");
    if (o) o.hidden = true;
  }

  // FIX UTAMA: opts sekarang betul-betul handle selected value + escape attribute
  function opts(obj, selectedValue) {
    return Object.entries(obj)
      .map(([k, v]) => {
        const label = v?.name || k;
        const sel = k === selectedValue ? " selected" : "";
        return `<option value="${esc(k)}"${sel}>${esc(label)}</option>`;
      })
      .join("");
  }

  function build() {
    if (document.getElementById("bc-wpn-overlay")) return;
    const o = document.createElement("div");
    o.id = "bc-wpn-overlay";
    o.hidden = true;
    o.innerHTML = `
<section class="bc-wpn-dialog" role="dialog" aria-modal="true" aria-label="Weapon Forge">
  <header>
    <div>
      <small>BOUNDLESS · WEAPON SYSTEM v8.2</small>
      <h2>⚔ Weapon Forge & Arsenal</h2>
      <p>Forge → Refine → Temper → Inscribe → Awaken Weapon Intent.</p>
    </div>
    <button id="bc-wpn-close" aria-label="Tutup">×</button>
  </header>
  <div class="bc-wpn-grid">
    <aside class="bc-wpn-panel">
      <h3>Forging</h3>
      <label>Jenis<select id="bc-wpn-type">${opts(TYPES, "sword")}</select></label>
      <label>Grade<select id="bc-wpn-grade">${opts(Object.fromEntries(GRADES.map(g=>[g.id,g])), "spiritual")}</select></label>
      <label>Core Material<select id="bc-wpn-material">${opts(MATERIALS, "spiritSteel")}</select></label>
      <label>Catalyst / Soul<select id="bc-wpn-catalyst">${opts(CATALYSTS, "flame")}</select></label>
      <label>Karma<select id="bc-wpn-karma">${opts(KARMA, "orthodox")}</select></label>
      <button id="bc-wpn-forge" class="gold">Forge Weapon</button>
      <div id="bc-wpn-mats"></div>
    </aside>
    <main class="bc-wpn-panel"><h3>Arsenal</h3><div id="bc-wpn-list"></div></main>
    <aside class="bc-wpn-panel"><h3>Weapon Core</h3><div id="bc-wpn-detail"></div></aside>
  </div>
  <footer><small>Grades Earth/Heaven ada risiko tribulation; Immortal/Divine perlukan kestabilan tinggi. Data disimpan di localStorage.</small></footer>
</section>`;
    document.body.appendChild(o);
    o.querySelector("#bc-wpn-close").onclick = close;
    o.addEventListener("click", (e) => { if (e.target === o) close(); });
    const forgeBtn = o.querySelector("#bc-wpn-forge");
    if (forgeBtn) forgeBtn.onclick = forge;
    document.addEventListener("keydown", (e) => {
      const ov = document.getElementById("bc-wpn-overlay");
      if (e.key === "Escape" && ov && !ov.hidden) close();
    });
  }

  function render() {
    const o = document.getElementById("bc-wpn-overlay");
    if (!o) return;
    const list = o.querySelector("#bc-wpn-list");
    const detail = o.querySelector("#bc-wpn-detail");
    const mats = o.querySelector("#bc-wpn-mats");
    if (!list || !detail || !mats) return;

    mats.innerHTML = "<b>Material</b><div class='bc-wpn-mats'>" + Object.entries(state.materials).map(([k, v]) => "<span>" + esc(MATERIALS[k]?.name || k) + ": " + v + "</span>").join("") + "</div>";

    if (!state.weapons.length) {
      list.innerHTML = "<p class='muted'>Belum ada senjata. Forge senjata pertama anda.</p>";
    } else {
      list.innerHTML = state.weapons.map(w => `
        <button class="bc-wpn-card ${w.id === state.active ? "active" : ""}" data-id="${esc(w.id)}">
          <b>${esc(w.name)}</b>
          <span>${esc(GRADES.find(g=>g.id===w.grade)?.name)} · ${esc(TYPES[w.type]?.name)}</span>
          <em>⚔ ${weaponPower(w)} · Refine +${w.refine}</em>
        </button>`).join("");
      list.querySelectorAll("[data-id]").forEach(b => {
        b.onclick = () => { state.active = b.dataset.id; save(); render(); };
      });
    }

    const w = getActive();
    if (!w) {
      detail.innerHTML = "<p class='muted'>Pilih senjata di Arsenal.</p>";
      return;
    }

    detail.innerHTML = `
<div class="bc-wpn-name"><b>${esc(w.name)}</b>
  <div style="display:flex;gap:6px"><button id="bc-wpn-rename">Nama</button><button id="bc-wpn-remove" title="Hapus">🗑</button></div>
</div>
<div class="bc-wpn-stats">
  <span>⚔ Power <b>${weaponPower(w)}</b></span>
  <span>🛡 Guard <b>${defense(w)}</b></span>
  <span>❤ Durability <b>${w.durability}/${w.maxDurability}</b></span>
  <span>✦ Purity <b>${w.purity}%</b></span>
  <span>◈ Stability <b>${w.stability}%</b></span>
  <span>☯ Karma <b>${esc(KARMA[w.karma]?.name)}</b></span>
  <span>★ Quality <b>${w.quality}/5</b></span>
</div>
<div class="bc-wpn-progress">
  <label>Mastery ${w.mastery}%</label><div><i style="width:${w.mastery}%"></i></div>
  <label>Resonance ${w.resonance}%</label><div><i style="width:${w.resonance}%"></i></div>
</div>
<p><b>Intent:</b> ${esc(INTENT[w.intent])} · <b>Element:</b> ${esc(w.element)}</p>
<p><b>Affixes:</b> ${w.affixes.map(esc).join(" · ")}</p>
<p><b>Dao Runes:</b> ${w.runes.length ? w.runes.map(r=>esc(r[1])).join(" · ") : "Tiada"}</p>
<div class="bc-wpn-actions">
  <button id="wp-refine">Refine +${w.refine+1}</button>
  <button id="wp-temper">Temper</button>
  <button id="wp-rune">Inscribe Rune</button>
  <button id="wp-intent">Awaken Intent</button>
  <button id="wp-mastery">Train Mastery</button>
  <button id="wp-repair">Repair</button>
</div>
<details><summary>Technical data</summary><pre>${esc(JSON.stringify(w,null,2))}</pre></details>`;

    o.querySelector("#bc-wpn-rename").onclick = rename;
    const rem = o.querySelector("#bc-wpn-remove");
    if (rem) rem.onclick = removeWeapon;
    o.querySelector("#wp-refine").onclick = refine;
    o.querySelector("#wp-temper").onclick = temper;
    o.querySelector("#wp-rune").onclick = inscribe;
    o.querySelector("#wp-intent").onclick = awakenIntent;
    o.querySelector("#wp-mastery").onclick = gainMastery;
    o.querySelector("#wp-repair").onclick = repair;
  }

  // Inventory integration - lebih tahan lasak
  function mountInventoryWeaponMenu() {
    const sections = [...document.querySelectorAll(".equipment-section, [data-inventory], .inventory-panel")];
    const section = sections.find(el => el.offsetParent !== null) || sections[0] || document.querySelector("main");
    if (!section) return false;
    if (section.querySelector(".boundless-weapon-menu-button")) return true;

    const heading = section.querySelector(":scope > div:first-child, :scope > h2, :scope > h3");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "boundless-weapon-menu-button";
    button.textContent = "⚔ Senjata & Tempa";
    button.setAttribute("aria-label", "Buka menu Senjata dan Tempa");
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      open();
    });

    if (heading && heading.parentElement === section) {
      heading.style.display = "flex";
      heading.style.alignItems = "center";
      heading.style.justifyContent = "space-between";
      heading.style.gap = "12px";
      heading.appendChild(button);
    } else {
      section.prepend(button);
    }
    return true;
  }

  function observeInventoryWeaponMenu() {
    let scheduled = false;
    const ensure = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; mountInventoryWeaponMenu(); });
    };
    const observer = new MutationObserver((records) => {
      if (records.some(r => r.type === "childList")) ensure();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    let tries = 0;
    const timer = setInterval(() => {
      mountInventoryWeaponMenu();
      if (++tries >= 240) clearInterval(timer);
    }, 250);
    mountInventoryWeaponMenu();
  }

  // Public API - kekal sama untuk kompatibiliti
  window.__boundlessOpenWeaponForge = open;
  window.__boundlessWeaponState = () => ({ ...state, weapons: [...state.weapons] });
  window.__boundlessWeaponSystem = { version: VERSION, open, close, forge, save, render };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { build(); observeInventoryWeaponMenu(); }, { once: true });
  } else {
    build();
    observeInventoryWeaponMenu();
  }
})();
