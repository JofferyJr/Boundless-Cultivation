/* Boundless Settings Slot Bridge v3
 * Owns the eight-slot Settings tab strip and survives React/Radix rerenders.
 */
(() => {
  "use strict";

  const SLOT_COUNT = 8;
  const CUSTOM = "data-boundless-custom-tab";
  const SLOT_ATTR = "data-boundless-settings-slot";

  const visible = (el) => {
    if (!el) return false;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
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
    b.style.setProperty("min-height", "58px", "important");
    b.style.setProperty("width", "100%", "important");
    b.style.setProperty("box-sizing", "border-box", "important");
    b.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
    return b;
  }

  function nativeTabs(list) {
    return [...list.querySelectorAll('[role="tab"]')]
      .filter((el) => !el.hasAttribute(CUSTOM));
  }

  function sameOrder(list, ordered) {
    const children = [...list.children];
    return ordered.every((el, index) => children[index] === el)
      && children.length === ordered.length;
  }

  function ensure() {
    const list = findTabs();
    if (!list) return false;

    const native = nativeTabs(list).slice(0, 4);
    if (native.length < 1) return false;

    // React/Radix owns the native tab list. Do NOT move native children:
    // doing so can make React immediately restore the original four tabs.
    // Instead, keep the native four untouched and add a second, persistent
    // four-slot row directly beside/below it.
    let extra = document.querySelector(".boundless-extra-settings-slots");
    const parent = list.parentElement;
    if (!parent) return false;

    if (!extra) {
      extra = document.createElement("div");
      extra.className = "boundless-extra-settings-slots";
      extra.setAttribute("aria-label", "Boundless additional Settings");
      parent.appendChild(extra);
    }

    const template = native[0];
    extra.style.setProperty("display", "grid", "important");
    extra.style.setProperty("grid-template-columns", "repeat(4, minmax(0, 1fr))", "important");
    extra.style.setProperty("gap", "12px", "important");
    extra.style.setProperty("width", "100%", "important");
    extra.style.setProperty("margin-top", "12px", "important");
    extra.style.setProperty("box-sizing", "border-box", "important");


    let save = extra.querySelector('[data-boundless-custom-tab="save"]');
    if (!save) {
      save = makeButton(
        "💾 Simpan & Export",
        "save",
        () => window.__boundlessOpenSaveManager?.(),
        template
      );
      extra.appendChild(save);
    }

    let ai = extra.querySelector('[data-boundless-custom-tab="ai"]');
    if (!ai) {
      ai = makeButton(
        "🧠 AI Control Center",
        "ai",
        () => window.__boundlessOpenAIControl?.(),
        template
      );
      extra.appendChild(ai);
    }

    let empties = [...extra.querySelectorAll("[data-boundless-empty-slot]")];
    while (empties.length < 2) {
      const empty = makeButton("Slot akan datang", "empty", () => {}, template);
      empty.dataset.boundlessEmptySlot = "1";
      empty.disabled = true;
      empty.setAttribute("aria-label", "Slot kosong");
      extra.appendChild(empty);
      empties.push(empty);
    }
    if (empties.length > 2) empties.slice(2).forEach((el) => el.remove());

    const extras = [save, ai, empties[0], empties[1]];
    extras.forEach((el, index) => {
      el.dataset[SLOT_ATTR] = String(native.length + index + 1);
      el.style.setProperty("min-height", "58px", "important");
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("box-sizing", "border-box", "important");
      el.style.setProperty("font-size", "0.82rem", "important");
      el.style.setProperty("padding", "0.45rem 0.35rem", "important");
    });

    // Keep the native row compact as well, without changing its children/order.
    list.style.setProperty("display", "grid", "important");
    list.style.setProperty("grid-template-columns", "repeat(4, minmax(0, 1fr))", "important");
    list.style.setProperty("grid-auto-flow", "row", "important");
    list.style.setProperty("gap", "12px", "important");
    list.style.setProperty("width", "100%", "important");
    list.style.setProperty("box-sizing", "border-box", "important");

    [...list.children].filter((el) => el.matches?.('[role="tab"]')).forEach((el) => {
      el.style.setProperty("min-height", "58px", "important");
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("max-width", "none", "important");
      el.style.setProperty("box-sizing", "border-box", "important");
      el.style.setProperty("white-space", "normal", "important");
      el.style.setProperty("font-size", "0.82rem", "important");
      el.style.setProperty("padding", "0.45rem 0.35rem", "important");
    });

    return extras.every((el) => extra.contains(el));
  }


  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      ensure();
    });
  }

  function start() {
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "childList" || record.type === "attributes") {
          if (
            record.target.closest?.(".bc-settings-tabs")
            || record.target.closest?.("[role=dialog]")
            || record.addedNodes?.length
          ) {
            schedule();
            break;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
