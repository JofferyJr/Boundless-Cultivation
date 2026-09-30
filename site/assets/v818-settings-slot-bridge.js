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
    b.className = "boundless-settings-utility-button";
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
      "pointer-events:" + (disabled ? "none" : "auto") + " !important",
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

  function openAIControlCenter() {
    const existing = document.getElementById("boundless-ai-panel");
    if (existing) {
      existing.hidden = false;
      existing.style.display = "block";
      existing.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    const finish = () => {
      const panel = document.getElementById("boundless-ai-panel");
      if (panel) {
        panel.hidden = false;
        panel.style.display = "block";
      }
    };

    if (window.BoundlessAI) {
      finish();
      return;
    }

    if (document.querySelector('script[data-boundless-ai-loader="lazy"]')) {
      window.addEventListener("boundless-ai-ready", finish, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/Boundless-Cultivation/assets/v816-ai-world.js?v=8.2.2-ai-control";
    script.defer = true;
    script.dataset.boundlessAiLoader = "lazy";
    script.onload = finish;
    script.onerror = () => console.error("[Boundless Settings] AI Control Center gagal dimuat.");
    document.head.appendChild(script);
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
          openAIControlCenter();
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

  function installAIEventFallback() {\n    if (window.__boundlessAISettingsClickHook) return;\n    window.__boundlessAISettingsClickHook = true;\n    document.addEventListener("click", (event) => {\n      const button = event.target?.closest?.("[data-boundless-custom-tab=\\"ai\\"]");\n      if (!button || button.disabled) return;\n      event.preventDefault();\n      event.stopPropagation();\n      if (typeof window.__boundlessOpenAIControl === "function") {\n        window.__boundlessOpenAIControl();\n      } else {\n        console.warn("[Boundless Settings] AI Control Center belum tersedia.");\n      }\n    }, true);\n  }\n\n  function start() {
    if (observerStarted) return;
    observerStarted = true;\n    installAIEventFallback();

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
