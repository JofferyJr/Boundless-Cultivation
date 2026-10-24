/* Boundless v8.9.8 — compatibility bridge for the retired single-deer overlay.
 * The former standalone Ice-Soul Deer is not a 36th species. The official catalogue is the sole source.
 */
(() => {
  "use strict";
  if (window.__BOUNDLESS_SPIRIT_BEAST_LEGACY_BRIDGE_V898__) return;
  window.__BOUNDLESS_SPIRIT_BEAST_LEGACY_BRIDGE_V898__ = true;

  function removeLegacyOverlay() {
    document.getElementById("bc-ice-deer-card")?.remove();
  }
  // Keep the historical API name for any old UI integration, but delegate to the official catalogue.
  window.BoundlessSpiritBeasts = Object.freeze({
    version: "8.9.8",
    list: () => window.BoundlessSpiritBeastTiers?.list?.() || [],
    habitats: () => window.BoundlessSpiritBeastTiers?.regions?.() || [],
    getState: () => ({ sightings: [], recorded: false, legacyOverlayDisabled: true })
  });

  removeLegacyOverlay();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removeLegacyOverlay, { once: true });
  }
  const observer = new MutationObserver(removeLegacyOverlay);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();