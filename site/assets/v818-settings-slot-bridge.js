/* Boundless Settings — stable 8-slot controller
 * Fixed layout: 4 native tabs + 4 Boundless utility slots.
 * Native Settings tabs remain React/Radix-owned; utility slots are isolated.
 */
(() => {
  "use strict";

  const CUSTOM = "data-boundless-custom-tab";

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

  function nativeTabs(list) {
    return [...list.children].filter((el) =>
      el.matches?.('[role="tab"]') && !el.hasAttribute(CUSTOM)
    ).slice(0, 4);
  }

  function makeUtilityButton(label, key, handler, template, empty = false) {
    const b = document.createElement("button");
    b.type = "button";
    // Deliberately NOT role=tab: these buttons do not belong to Radix's tab state.
    b.dataset.boundlessCustomTab = key;
    b.className = template?.className || "dao-tab justify-center";
    b.textContent = label;
    b.setAttribute("aria-label", label);
    b.style.cssText = [
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "width:100%",
      "min-height:58px",
      "box-sizing:border-box",
      "padding:.45rem .35rem",
      "border:1px solid #806936",
      "border-radius:10px",
      "background:#111b16",
      "color:#e5c77d",
      "font:600 .82rem/1.15 system-ui,sans-serif",
      "white-space:normal",
      "text-align:center",
      "cursor:" + (empty ? "default" : "pointer"),
      "touch-action:manipulation",
      "position:relative",
      "z-index:9999",
      "pointer-events:auto",
      "user-select:none"
    ].join(";");
    if (empty) {
      b.disabled = true;
      b.style.opacity = ".45";
      b.style.pointerEvents = "none";
    } else {
      b.disabled = false;
      b.removeAttribute("aria-disabled");
      // Do not cancel pointerdown: cancelling it can suppress the browser's native click event.
      // The click handler below is sufficient to isolate these utility buttons from Radix tabs.
      b.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        // The document capture handler owns utility-button activation.
        // Avoid firing a second time (which previously opened then immediately
        // closed the Save/Export panel).
        if (b.dataset.boundlessBusy === "1") return;
        try { handler(); } catch (error) { console.error("[Boundless Settings]", error); }
      });
    }
    return b;
  }

  function applyNativeLayout(list) {
    list.style.setProperty("display", "grid", "important");
    list.style.setProperty("grid-template-columns", "repeat(4,minmax(0,1fr))", "important");
    list.style.setProperty("grid-auto-flow", "row", "important");
    list.style.setProperty("gap", "12px", "important");
    list.style.setProperty("width", "100%", "important");
    list.style.setProperty("box-sizing", "border-box", "important");

    nativeTabs(list).forEach((el) => {
      el.style.setProperty("min-height", "58px", "important");
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("max-width", "none", "important");
      el.style.setProperty("box-sizing", "border-box", "important");
      el.style.setProperty("white-space", "normal", "important");
      el.style.setProperty("font-size", ".82rem", "important");
      el.style.setProperty("padding", ".45rem .35rem", "important");
    });
  }

  function restoreNativeSettingsOnClick(list, native) {
    native.forEach((tab) => {
      if (tab.dataset.boundlessRestoreHook === "1") return;
      tab.dataset.boundlessRestoreHook = "1";
      tab.addEventListener("click", () => {
        const parent = list.parentElement;
        if (!parent) return;
        // A custom Settings page temporarily hides the native tab panel.
        // Restore the native surface BEFORE React/Radix processes this click.
        parent.removeAttribute("data-boundless-custom-open");
        parent.querySelectorAll("[data-boundless-custom-panel]").forEach((panel) => panel.remove());
        document.getElementById("boundless-ai-control-center")?.remove();
        document.getElementById("bc-save-manager-inline")?.remove();
        parent.querySelectorAll("[data-boundless-custom-tab]").forEach((button) => {
          button.setAttribute("aria-selected", "false");
          button.dataset.state = "inactive";
        });
      }, true);
    });
  }

  function getActiveTabPanel(list) {
    const root = list.parentElement;
    if (!root) return null;

    // Radix keeps each tab's content in its own tabpanel. The utility row must
    // belong to the ACTIVE panel so it naturally moves with that tab's content,
    // including when Help & Tips/Dev becomes much taller than Permainan.
    const active = [...root.querySelectorAll('[role="tabpanel"]')].find((panel) => {
      const state = panel.getAttribute("data-state");
      return state === "active" || (state == null && visible(panel));
    });
    return active || null;
  }

  function buildExtraRow(list, native) {
    // Mount the four utility slots inside the currently active tabpanel.
    // This makes the row part of the tab's normal document flow rather than a
    // fixed row attached to the Settings dialog.
    const activePanel = getActiveTabPanel(list);
    const dialog = list.closest("[role=dialog],[data-slot=sheet-content],[data-slot=dialog-content]");
    const parent = activePanel || dialog || list.parentElement;
    if (!parent) return null;

    // If the active tab changed, move the existing utility row into that panel.
    const rows = [...document.querySelectorAll(".boundless-extra-settings-slots")];
    let extra = rows.find((el) => el.parentElement === parent) || null;
    rows.filter((el) => el !== extra).forEach((el) => el.remove());

    if (!extra) {
      extra = document.createElement("div");
      extra.className = "boundless-extra-settings-slots";
      extra.setAttribute("aria-label", "Slot tambahan Boundless");
      parent.appendChild(extra);
    }

    if (!extra) {
      extra = document.createElement("div");
      extra.className = "boundless-extra-settings-slots";
      extra.setAttribute("aria-label", "Slot tambahan Boundless");
      parent.appendChild(extra);
    }

    extra.style.setProperty("display", "grid", "important");
    extra.style.setProperty("grid-template-columns", "repeat(4,minmax(0,1fr))", "important");
    extra.style.setProperty("gap", "12px", "important");
    extra.style.setProperty("width", "100%", "important");
    extra.style.setProperty("margin-top", "12px", "important");
    extra.style.setProperty("box-sizing", "border-box", "important");
    extra.style.setProperty("position", "relative", "important");
    extra.style.setProperty("z-index", "2147483646", "important");
    extra.style.setProperty("pointer-events", "auto", "important");
    extra.style.setProperty("isolation", "isolate", "important");
    extra.style.setProperty("overflow", "visible", "important");
    extra.style.setProperty("isolation", "isolate", "important");
    extra.style.setProperty("overflow", "visible", "important");

    const template = native[0];

    const get = (key) => extra.querySelector(`[${CUSTOM}="${key}"]`);

    // Save & Export is intentionally NOT a utility slot anymore.
    // It is the original native panel inside Settings -> Permainan.
    let ai = get("ai");
    if (!ai) {
      ai = makeUtilityButton(
        "🧠 AI Control Center",
        "ai",
        () => {
          if (typeof window.__boundlessOpenAIControl !== "function") {
            console.warn("[Boundless Settings] AI Control Center belum tersedia.");
            return;
          }
          window.__boundlessOpenAIControl();
        },
        template
      );
      extra.appendChild(ai);
    }

    if (!get("weapon")) {
      extra.appendChild(makeUtilityButton(
        "⚔️ Weapon Forge",
        "weapon",
        () => {
          if (typeof window.__boundlessOpenWeaponForge !== "function") {
            console.warn("[Boundless Settings] Weapon Forge belum tersedia.");
            return;
          }
          window.__boundlessOpenWeaponForge();
        },
        template
      ));
    }

    for (const key of ["empty-2", "empty-3"]) {
      if (!get(key)) extra.appendChild(makeUtilityButton("Slot Akan Datang", key, () => {}, template, true));
    }

    // Hard order: AI, Empty, Empty, Empty.
    const ordered = ["ai", "weapon", "empty-2", "empty-3"]
      .map(get)
      .filter(Boolean);
    ordered.forEach((el) => extra.appendChild(el));

    return extra;
  }

  function cleanOrphans(currentList) {
    const activePanel = currentList ? getActiveTabPanel(currentList) : null;
    const dialog = currentList?.closest?.("[role=dialog],[data-slot=sheet-content],[data-slot=dialog-content]");
    const expected = activePanel || dialog || currentList?.parentElement;
    document.querySelectorAll(".boundless-extra-settings-slots").forEach((row) => {
      if (row.parentElement !== expected) row.remove();
    });
  }

  function ensure() {
    installUtilityCapture();
    const list = findTabs();
    if (!list) return false;

    const native = nativeTabs(list);
    if (native.length !== 4) return false;

    applyNativeLayout(list);
    restoreNativeSettingsOnClick(list, native);
    const extra = buildExtraRow(list, native);
    cleanOrphans(list);

    return !!extra &&
      extra.querySelector('[data-boundless-custom-tab="ai"]') &&
      extra.querySelector('[data-boundless-custom-tab="weapon"]') &&
      extra.querySelector('[data-boundless-custom-tab="empty-2"]') &&
      extra.querySelector('[data-boundless-custom-tab="empty-3"]');
  }

  // Global hit-test fallback:
  // Some React/Radix layers can sit above the utility row in the stacking
  // context. In that case the browser's event target is the overlay instead
  // of the visible Save/Export button. Match the pointer coordinates against
  // the visible utility button so the action still works.
  let utilityCaptureInstalled = false;
  function runUtilityAction(button) {
    if (!button || button.disabled || button.dataset.boundlessBusy === "1") return;
    button.dataset.boundlessBusy = "1";
    try {
      if (button.dataset.boundlessCustomTab === "save") {
        if (typeof window.__boundlessOpenSaveManager === "function") {
          window.__boundlessOpenSaveManager();
        }
      } else if (button.dataset.boundlessCustomTab === "ai") {
        if (typeof window.__boundlessOpenAIControl === "function") {
          window.__boundlessOpenAIControl();
        }
      } else if (button.dataset.boundlessCustomTab === "weapon") {
        if (typeof window.__boundlessOpenWeaponForge === "function") {
          window.__boundlessOpenWeaponForge();
        }
      }
    } catch (error) {
      console.error("[Boundless Settings] utility action", error);
    } finally {
      setTimeout(() => { button.dataset.boundlessBusy = "0"; }, 0);
    }
  }

  function utilityAtPoint(x, y) {
    const buttons = [...document.querySelectorAll(
      '[data-boundless-custom-tab="save"],[data-boundless-custom-tab="ai"],[data-boundless-custom-tab="weapon"]'
    )].filter((button) => visible(button) && !button.disabled);
    return buttons.find((button) => {
      const r = button.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }) || null;
  }

  function installUtilityCapture() {
    if (utilityCaptureInstalled) return;
    utilityCaptureInstalled = true;

    // Capture at WINDOW on pointerup so React/Radix root delegation cannot
    // swallow the utility action. We intentionally do not preventDefault().
    const resolve = (event) => {
      const direct = event.target?.closest?.(
        '[data-boundless-custom-tab="save"],[data-boundless-custom-tab="ai"]'
      );
      return direct || utilityAtPoint(event.clientX, event.clientY);
    };

    window.addEventListener("pointerup", (event) => {
      const button = resolve(event);
      if (!button || button.disabled) return;
      runUtilityAction(button);
    }, true);

    window.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const active = document.activeElement?.closest?.(
        '[data-boundless-custom-tab="save"],[data-boundless-custom-tab="ai"]'
      );
      if (!active || active.disabled) return;
      runUtilityAction(active);
    }, true);
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
    // Observe DOM replacement/state changes, but NOT style/class changes.
    // Our own inline style changes must never trigger an observer loop.
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "childList" ||
            (record.type === "attributes" &&
             (record.attributeName === "data-state" ||
              record.attributeName === "aria-selected" ||
              record.attributeName === "aria-expanded"))) {
          schedule();
          break;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "aria-selected", "aria-expanded"]
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
