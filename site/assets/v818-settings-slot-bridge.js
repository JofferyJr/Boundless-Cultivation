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

  function buildExtraRow(list, native) {
    const parent = list.parentElement;
    if (!parent) return null;

    // If React recreated the native tab list, discard a stale utility row.
    const stale = [...parent.children].filter((el) =>
      el.classList?.contains("boundless-extra-settings-slots") && el !== list
    );
    // Never remove a current row; only rows outside this parent are cleaned below.
    stale.forEach((el) => el.remove());

    let extra = [...parent.children].find((el) =>
      el.classList?.contains("boundless-extra-settings-slots")
    );

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

    const template = native[0];

    const get = (key) => extra.querySelector(`[${CUSTOM}="${key}"]`);

    let save = get("save");
    if (!save) {
      save = makeUtilityButton(
        "💾 Simpan & Export",
        "save",
        () => {
          if (typeof window.__boundlessOpenSaveManager !== "function") {
            console.warn("[Boundless Settings] Save Manager belum tersedia.");
            return;
          }
          window.__boundlessOpenSaveManager();
        },
        template
      );
      extra.appendChild(save);
    }

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

    for (const key of ["empty-1", "empty-2"]) {
      if (!get(key)) extra.appendChild(makeUtilityButton("Slot Akan Datang", key, () => {}, template, true));
    }

    // Hard order: Save, AI, Empty, Empty.
    const ordered = ["save", "ai", "empty-1", "empty-2"]
      .map(get)
      .filter(Boolean);
    ordered.forEach((el) => extra.appendChild(el));

    return extra;
  }

  function cleanOrphans(currentList) {
    document.querySelectorAll(".boundless-extra-settings-slots").forEach((row) => {
      if (row.parentElement !== currentList?.parentElement) row.remove();
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
      extra.querySelector('[data-boundless-custom-tab="save"]') &&
      extra.querySelector('[data-boundless-custom-tab="ai"]') &&
      extra.querySelector('[data-boundless-custom-tab="empty-1"]') &&
      extra.querySelector('[data-boundless-custom-tab="empty-2"]');
  }

  // Global capture fallback: React/Radix can stop bubbling events on the Settings surface.
  // Handling the utility slots at document capture guarantees their actions still run
  // when the slot itself receives the pointer event.
  let utilityCaptureInstalled = false;
  function installUtilityCapture() {
    if (utilityCaptureInstalled) return;
    utilityCaptureInstalled = true;
    document.addEventListener("click", (event) => {
      const button = event.target?.closest?.('[data-boundless-custom-tab="save"],[data-boundless-custom-tab="ai"]');
      if (!button || button.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      if (button.dataset.boundlessBusy === "1") return;
      button.dataset.boundlessBusy = "1";
      try {
        if (button.dataset.boundlessCustomTab === "save") {
          if (typeof window.__boundlessOpenSaveManager === "function") window.__boundlessOpenSaveManager();
        } else if (typeof window.__boundlessOpenAIControl === "function") {
          window.__boundlessOpenAIControl();
        }
      } catch (error) {
        console.error("[Boundless Settings] utility action", error);
      } finally {
        setTimeout(() => { button.dataset.boundlessBusy = "0"; }, 0);
      }
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
