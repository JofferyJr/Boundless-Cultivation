/* Boundless Settings — native tabs + AI utility slot
 * Weapon Forge is NOT a Settings feature.
 * Weapon access is provided by the inventory/equipment "⚔️ Senjata & Tempa" menu.
 * Save/Export remains the native Settings -> Permainan panel.
 */
(() => {
  "use strict";

  const CUSTOM = "data-boundless-custom-tab";
  let observerStarted = false;

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
    return [...list.children]
      .filter((el) => el.matches?.('[role="tab"]') && !el.hasAttribute(CUSTOM))
      .slice(0, 4);
  }

  function makeButton(label, key, handler, template, disabled = false) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.boundlessCustomTab = key;
    b.className = template?.className || "dao-tab justify-center";
    b.textContent = label;
    b.setAttribute("aria-label", label);
    b.disabled = disabled;
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
      "cursor:" + (disabled ? "default" : "pointer"),
      "touch-action:manipulation",
      "position:relative",
      "z-index:9999",
      "pointer-events:" + (disabled ? "none" : "auto"),
      "user-select:none",
      "opacity:" + (disabled ? ".45" : "1")
    ].join(";");

    if (!disabled) {
      b.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        try { handler(); } catch (error) {
          console.error("[Boundless Settings]", error);
        }
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
        parent.removeAttribute("data-boundless-custom-open");
        parent.querySelectorAll("[data-boundless-custom-panel]").forEach((panel) => panel.remove());
        document.getElementById("boundless-ai-control-center")?.remove();
        document.getElementById("bc-save-manager-inline")?.remove();
        parent.querySelectorAll("[" + CUSTOM + "]").forEach((button) => {
          button.setAttribute("aria-selected", "false");
          button.dataset.state = "inactive";
        });
      }, true);
    });
  }

  function buildUtilityRow(list, native) {
    // Keep the AI slot anchored directly below the native Settings tabs.
    // It no longer moves with individual tab panels, so React cannot make it disappear.
    const host = list.parentElement;
    if (!host) return null;

    let row = host.querySelector(":scope > .boundless-extra-settings-slots");
    if (!row) {
      row = document.createElement("div");
      row.className = "boundless-extra-settings-slots";
      row.setAttribute("aria-label", "Slot tambahan Boundless");
      list.insertAdjacentElement("afterend", row);
    }

    row.style.cssText = [
      "display:grid",
      "grid-template-columns:repeat(4,minmax(0,1fr))",
      "gap:12px",
      "width:100%",
      "margin-top:12px",
      "box-sizing:border-box",
      "position:relative",
      "z-index:2147483646",
      "pointer-events:auto",
      "isolation:isolate",
      "overflow:visible"
    ].join(";");

    const get = (key) => row.querySelector("[" + CUSTOM + '="' + key + '"]');
    const template = native[0];

    let ai = get("ai");
    if (!ai) {
      ai = makeButton(
        "🧠 AI Control Center",
        "ai",
        () => {
          if (typeof window.__boundlessOpenAIControl === "function") {
            window.__boundlessOpenAIControl();
          } else {
            console.warn("[Boundless Settings] AI Control Center belum tersedia.");
          }
        },
        template
      );
      row.appendChild(ai);
    }

    for (const key of ["empty-1", "empty-2", "empty-3"]) {
      if (!get(key)) {
        row.appendChild(makeButton("Slot Akan Datang", key, () => {}, template, true));
      }
    }

    ["ai", "empty-1", "empty-2", "empty-3"].forEach((key) => {
      const button = get(key);
      if (button) row.appendChild(button);
    });

    return row;
  }

  function cleanOrphans(list) {
    const host = list?.parentElement;
    document.querySelectorAll(".boundless-extra-settings-slots").forEach((row) => {
      if (row.parentElement !== host) row.remove();
    });
  }

  function ensure() {
    const list = findTabs();
    if (!list) return false;

    const native = nativeTabs(list);
    if (native.length !== 4) return false;

    applyNativeLayout(list);
    restoreNativeSettingsOnClick(list, native);
    const row = buildUtilityRow(list, native);
    cleanOrphans(list);

    return !!row && !!row.querySelector('[' + CUSTOM + '="ai"]');
  }

  function start() {
    if (observerStarted) return;
    observerStarted = true;

    const observer = new MutationObserver((records) => {
      if (records.some((r) =>
        r.type === "childList" ||
        (r.type === "attributes" &&
         (r.attributeName === "data-state" ||
          r.attributeName === "aria-selected" ||
          r.attributeName === "aria-expanded"))
      )) {
        requestAnimationFrame(ensure);
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
