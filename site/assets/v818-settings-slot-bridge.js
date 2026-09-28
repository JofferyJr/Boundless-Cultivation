/* Boundless Settings Slot Bridge v2
 * Owns the eight-slot Settings tab strip and survives React/Radix rerenders.
 */
(() => {
  "use strict";
  const SLOT_COUNT = 8;
  const CUSTOM = "data-boundless-custom-tab";

  const visible = (el) => {
    if (!el) return false;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
  };

  function findTabs() {
    return [...document.querySelectorAll(".bc-settings-tabs")].find(visible)
      || document.querySelector(".bc-settings-tabs");
  }

  function makeButton(label, key, handler, template) {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.dataset.boundlessCustomTab = key;
    b.textContent = label;
    b.setAttribute("aria-selected", "false");
    b.dataset.state = "inactive";
    b.className = template?.className || "dao-tab justify-center";
    b.style.setProperty("min-height", "96px", "important");
    b.style.setProperty("width", "100%", "important");
    b.style.setProperty("box-sizing", "border-box", "important");
    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handler();
    });
    return b;
  }

  function ensure() {
    const list = findTabs();
    if (!list) return false;

    // React can recreate the native buttons. Always derive them from the current DOM.
    const all = [...list.querySelectorAll('[role="tab"]')];
    const native = all.filter(el => !el.hasAttribute(CUSTOM)).slice(0, 4);
    if (native.length !== 4) return false;

    const template = native[0];
    let save = list.querySelector('[data-boundless-custom-tab="save"]');
    if (!save) save = makeButton("💾 Simpan & Export", "save", () => window.__boundlessOpenSaveManager?.(), template);

    let ai = list.querySelector('[data-boundless-custom-tab="ai"]');
    if (!ai) ai = makeButton("🧠 AI Control Center", "ai", () => window.__boundlessOpenAIControl?.(), template);

    let empties = [...list.querySelectorAll('[data-boundless-empty-slot]')];
    while (empties.length < 2) {
      const empty = makeButton("Slot akan datang", "empty", () => {}, template);
      empty.dataset.boundlessEmptySlot = "1";
      empty.disabled = true;
      empty.setAttribute("aria-label", "Slot kosong");
      empties.push(empty);
    }
    if (empties.length > 2) empties.slice(2).forEach(x => x.remove());
    empties = empties.slice(0, 2);

    const ordered = [native[0], native[1], native[2], native[3], save, ai, empties[0], empties[1]];
    ordered.forEach((el, i) => {
      el.dataset.boundlessSettingsSlot = String(i + 1);
      list.appendChild(el);
    });

    list.style.setProperty("display", "grid", "important");
    list.style.setProperty("grid-template-columns", "repeat(4, minmax(0, 1fr))", "important");
    list.style.setProperty("grid-template-rows", "repeat(2, minmax(96px, auto))", "important");
    list.style.setProperty("grid-auto-flow", "row", "important");
    list.style.setProperty("gap", "12px", "important");
    list.style.setProperty("width", "100%", "important");
    list.style.setProperty("min-width", "0", "important");
    list.style.setProperty("box-sizing", "border-box", "important");

    ordered.forEach((el) => {
      el.style.setProperty("min-height", "96px", "important");
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("max-width", "none", "important");
      el.style.setProperty("box-sizing", "border-box", "important");
      el.style.setProperty("white-space", "normal", "important");
    });
    return list.querySelectorAll('[role="tab"]').length >= SLOT_COUNT;
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; ensure(); });
  }

  function start() {
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "childList" || r.type === "attributes") {
          if (r.target.closest?.(".bc-settings-tabs") || r.target.closest?.("[role=dialog]") || r.addedNodes?.length) {
            schedule();
            break;
          }
        }
      }
    });
    observer.observe(document.body, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ["data-state", "aria-expanded", "class", "style", "role", "aria-selected"]
    });

    let tries = 0;
    const timer = setInterval(() => {
      ensure();
      if (++tries >= 240) clearInterval(timer);
    }, 250);

    ensure();
    window.__boundlessEnsureSettingsSlots = ensure;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
