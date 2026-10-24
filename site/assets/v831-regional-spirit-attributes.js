/* Boundless v8.9.8 — regional affinity bridge backed by the official Spirit Beast catalogue.
 * Removes the obsolete hard-coded four-region/70% ice roll. Species affinity and habitat are authoritative.
 */
(() => {
  "use strict";
  if (window.__BOUNDLESS_REGIONAL_SPIRIT_ATTRIBUTES_V898__) return;
  window.__BOUNDLESS_REGIONAL_SPIRIT_ATTRIBUTES_V898__ = true;

  const norm = value => String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase();
  function regions() { return window.BoundlessSpiritBeastTiers?.regions?.() || []; }
  function catalog() { return window.BoundlessSpiritBeastTiers?.list?.() || []; }
  function normalizeRegion(region) {
    const value = norm(region);
    return regions().find(name => value === norm(name) || value.includes(norm(name))) || "";
  }
  function speciesAt(region) {
    const location = normalizeRegion(region);
    if (!location) return [];
    return catalog().filter(beast => Array.isArray(beast.habitat) && beast.habitat.includes(location));
  }
  function isIceRegion(region) {
    return speciesAt(region).some(beast => /ais|ice|frost|glacier/i.test(String(beast.element || "")));
  }
  function rollBucket(region, random = Math.random) {
    const beasts = speciesAt(region);
    if (!beasts.length) return "other";
    const iceCount = beasts.filter(beast => /ais|ice|frost|glacier/i.test(String(beast.element || ""))).length;
    return random() < iceCount / beasts.length ? "ice" : "other";
  }
  function chooseAttribute(region, attributes, random = Math.random) {
    const list = Array.isArray(attributes) ? attributes.filter(Boolean) : [];
    if (!list.length) return null;
    const available = new Set(speciesAt(region).flatMap(beast =>
      String(beast.element || "").split(/[\/·,]+/).map(value => norm(value))
    ));
    const matching = list.filter(item => {
      const value = norm(typeof item === "string" ? item : item?.attribute ?? item?.element ?? item?.name ?? "");
      return available.has(value) || [...available].some(attribute => value && (value.includes(attribute) || attribute.includes(value)));
    });
    const pool = matching.length ? matching : list;
    return pool[Math.min(pool.length - 1, Math.floor(Math.max(0, Math.min(.999999, random())) * pool.length))] ?? pool[0];
  }

  window.BoundlessRegionalSpiritAttributes = Object.freeze({
    version: "8.9.8",
    regions,
    normalizeRegion,
    speciesAt,
    isIceRegion,
    rollBucket,
    chooseAttribute
  });
})();