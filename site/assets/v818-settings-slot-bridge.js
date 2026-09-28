/* Boundless Settings Slot Bridge
 * Keeps the Settings surface deterministic after React/Radix rerenders.
 * Layout: 4 native tabs + Save & Export + AI Control Center + 2 future slots.
 */
(() => {
  "use strict";
  const SLOT_COUNT = 8;
  const CUSTOM = "data-boundless-custom-tab";

  function visible(el) {
    if (!el) return false;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
  }

  function findTabs() {
    return [...document.querySelectorAll(".bc-settings-tabs")].find(visible) || document.querySelector(".bc-settings-tabs");
  }

  function makeButton(text, key, handler, template) {
    const b = document.createElement("button");
    b.type = "button";
    b.role = "tab";
    b.dataset[key] = "1";
    b.dataset.boundlessCustomTab = key.replace("data-", "");
    b.textContent = text;
    b.setAttribute("aria-selected", "false");
    b.dataset.state = "inactive";
    b.className = template?.className || "dao-tab justify-center";
    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handler?.();
    });
    return b;
  }

  function ensure() {
    const list = findTabs();
    if (!list) return false;

    const native = [...list.querySelectorAll('[role="tab"]')]
      .filter(el => !el.matches('[' + CUSTOM + ']'))
      .slice(0, 4);
    if (native.length < 4) return false;
    const template = native[0];

    let save = list.querySelector('[data-boundless-custom-tab="save"]');
    if (!save) {
      save = makeButton("💾 Simpan & Export", "data-save-open", () => {
        window.__boundlessOpenSaveManager?.();
      }, template);
    }

    let ai = list.querySelector('[data-boundless-custom-tab="ai"]');
    if (!ai) {
      ai = makeButton("🧠 AI Control Center", "data-ai-open", () => {
        window.__boundlessOpenAIControl?.();
      }, template);
    }

    let empties = [...list.querySelectorAll('[data-boundless-empty-slot]')].slice(0, 2);
    while (empties.length < 2) {
      const empty = document.createElement("button");
      empty.type = "button";
      empty.disabled = true;
      empty.dataset.boundlessEmptySlot = "1";
      empty.dataset.boundlessCustomTab = "empty";
      empty.textContent = "Slot akan datang";
      empty.setAttribute("aria-label", "Slot kosong");
      empty.className = template.className || "dao-tab justify-center";
      empties.push(empty);
    }

    const ordered = [...native, save, ai, ...empties];
    for (let i = 0; i < ordered.length; i++) {
      ordered[i].dataset.boundlessSettingsSlot = String(i + 1);
      list.appendChild(ordered[i]);
    }

    list.style.setProperty("display", "grid", "important");
    list.style.setProperty("grid-template-columns", "repeat(4,minmax(0,1fr))", "important");
    list.style.setProperty("grid-template-rows", "repeat(2,minmax(96px,auto))", "important");
    list.style.setProperty("grid-auto-flow", "row", "important");
    list.style.setProperty("gap", "12px", "important");
    list.style.setProperty("width", "100%", "important");
    list.style.setProperty("box-sizing", "border-box", "important");

    ordered.forEach((el) => {
      el.style.setProperty("min-height", "96px", "important");
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("box-sizing", "border-box", "important");
    });
    return list.children.length >= SLOT_COUNT;
  }

  function start() {
    let ticks = 0;
    const timer = setInterval(() => {
      ensure();
      if (++ticks >= 80) clearInterval(timer);
    }, 250);
    ensure();
    const observer = new MutationObserver(() => {
      if (document.querySelector('.bc-settings-sheet [data-state="open"], .bc-settings-sheet[ data-state="open" ]')) ensure();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__boundlessEnsureSettingsSlots = ensure;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
