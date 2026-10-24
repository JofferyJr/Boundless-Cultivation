/* Boundless v8.9.6 — in-game Spirit Beast tab enhancement.
 * Enhances the existing beasts tab only. The legacy nest-search encounter,
 * game state, save format, training and evolution handlers remain untouched.
 */
(() => {
  "use strict";
  const STYLE_ID = "boundless-spirit-beasts-tab-v896";
  const BAR_ID = "boundless-spirit-beasts-tools";
  let activePanel = null;

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = "/Boundless-Cultivation/assets/v896-spirit-beasts-tab.css";
    document.head.appendChild(link);
  }

  function isBeastsTab(panel) {
    if (!panel || panel.getAttribute("role") !== "tabpanel") return false;
    const trigger = document.querySelector('[role="tab"][data-state="active"][aria-controls="' + panel.id + '"]');
    return !!trigger && /Haiwan Roh/i.test(trigger.textContent || "");
  }

  function enhance(panel) {
    if (!isBeastsTab(panel)) return;
    // The v8.9.8 runtime owns regional encounters; remove the old duplicate toolbar.
    if (window.__BOUNDLESS_SPIRIT_ENCOUNTERS_V898__) {
      panel.querySelector("#" + BAR_ID)?.remove();
      return;
    }
    activePanel = panel;
    if (panel.querySelector("#" + BAR_ID)) {
      refresh(panel);
      return;
    }

    const bar = document.createElement("section");
    bar.id = BAR_ID;
    bar.className = "spirit-beast-toolbar";
    bar.innerHTML = `
      <div class="spirit-beast-toolbar-heading">
        <div><span class="spirit-beast-kicker">Ruang Ikatan Roh</span><h2>Pengurusan Haiwan Roh</h2>
        <p>Pantau kontrak, cari haiwan milik anda dan teruskan ekspedisi sarang seperti biasa.</p></div>
        <div class="spirit-beast-count" aria-live="polite"><strong data-beast-count>0</strong><span>Haiwan dimiliki</span></div>
      </div>
      <div class="spirit-beast-controls">
        <label class="spirit-beast-search"><span>Cari haiwan</span><input data-beast-search type="search" placeholder="Nama, atribut atau bentuk…" autocomplete="off"></label>
        <label><span>Status lokasi</span><select data-beast-location><option value="all">Semua lokasi</option><option value="here">Bersama saya</option><option value="away">Mengembara / pinjaman</option></select></label>
        <label><span>Susun mengikut</span><select data-beast-sort><option value="default">Asal</option><option value="name">Nama A–Z</option><option value="level">Level tertinggi</option><option value="loyalty">Kesetiaan tertinggi</option></select></label>
        <button type="button" data-beast-reset>Set semula</button>
      </div>
      <p class="spirit-beast-results" data-beast-results></p>`;
    const firstCard = panel.querySelector(".beast-encounter-card");
    if (firstCard) firstCard.insertAdjacentElement("beforebegin", bar);
    else panel.prepend(bar);

    bar.querySelector("[data-beast-search]").addEventListener("input", () => refresh(panel));
    bar.querySelector("[data-beast-location]").addEventListener("change", () => refresh(panel));
    bar.querySelector("[data-beast-sort]").addEventListener("change", () => refresh(panel));
    bar.querySelector("[data-beast-reset]").addEventListener("click", () => {
      bar.querySelector("[data-beast-search]").value = "";
      bar.querySelector("[data-beast-location]").value = "all";
      bar.querySelector("[data-beast-sort]").value = "default";
      refresh(panel);
    });
    refresh(panel);
  }

  function refresh(panel) {
    const bar = panel.querySelector("#" + BAR_ID);
    if (!bar) return;
    const cards = Array.from(panel.querySelectorAll(".contracted-beast"));
    const query = (bar.querySelector("[data-beast-search]").value || "").trim().toLocaleLowerCase();
    const location = bar.querySelector("[data-beast-location]").value;
    const sort = bar.querySelector("[data-beast-sort]").value;
    const grid = panel.querySelector(".contracted-beast-grid");
    if (grid && sort !== "default") {
      cards.sort((a, b) => {
        if (sort === "name") return (a.querySelector("h3")?.textContent || "").localeCompare(b.querySelector("h3")?.textContent || "");
        const value = (card, label) => {
          const row = Array.from(card.querySelectorAll("span")).find(el => (el.textContent || "").trim().startsWith(label));
          const match = (row?.textContent || "").match(/\d+/);
          return match ? Number(match[0]) : 0;
        };
        return sort === "level" ? value(b, "Level") - value(a, "Level") : value(b, "Setia") - value(a, "Setia");
      });
      cards.forEach(card => grid.appendChild(card));
    }
    let shown = 0;
    cards.forEach(card => {
      const text = (card.textContent || "").toLocaleLowerCase();
      const isHere = /Bersama/.test(card.textContent || "");
      const matches = (!query || text.includes(query)) &&
        (location === "all" || (location === "here" ? isHere : !isHere));
      card.hidden = !matches;
      if (matches) shown++;
    });
    const count = bar.querySelector("[data-beast-count]");
    const results = bar.querySelector("[data-beast-results]");
    if (count) count.textContent = String(cards.length);
    if (results) results.textContent = cards.length
      ? `Memaparkan ${shown} daripada ${cards.length} haiwan. Latihan, evolusi dan pencarian sarang lama kekal tersedia di bawah.`
      : "Belum ada haiwan dalam kontrak. Gunakan Pencarian Sarang di bawah untuk menjejaki telur atau bayi di kawasan liar yang sesuai.";
  }

  function scan() {
    addStyle();
    document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
      if (isBeastsTab(panel)) enhance(panel);
    });
    if (activePanel && !activePanel.isConnected) activePanel = null;
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; scan(); });
  };
  const start = () => {
    scan();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state"] });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();