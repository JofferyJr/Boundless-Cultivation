/* Boundless regional spirit-beast attribute weights.
 * Ice affinity has a 70% roll in the four cold regions; other affinities share 30%.
 * This module exposes a small shared API for encounter/spawn code and is safe on GitHub Pages.
 */
(() => {
  "use strict";
  if (window.BoundlessRegionalSpiritAttributes) return;

  const ICE_REGIONS = Object.freeze([
    "Dataran Beiming",
    "Puncak Xuefeng",
    "Gunung Tianbing",
    "Pulau Xuanshuang"
  ]);
  const ICE_CHANCE = 0.70;
  const NORMAL_CHANCES = Object.freeze({ ice: 0.70, other: 0.30 });

  function normalizeRegion(region) {
    return String(region ?? "").trim().toLocaleLowerCase();
  }
  function isIceRegion(region) {
    const value = normalizeRegion(region);
    return ICE_REGIONS.some(name => {
      const target = normalizeRegion(name);
      return value === target || value.includes(target);
    });
  }
  // Return the desired affinity bucket for one spawn roll.
  function rollBucket(region, random = Math.random) {
    if (!isIceRegion(region)) return "other";
    return random() < ICE_CHANCE ? "ice" : "other";
  }
  // Pick from caller-supplied affinities without forcing an ice result when no ice option exists.
  function chooseAttribute(region, attributes, random = Math.random) {
    const list = Array.isArray(attributes) ? attributes.filter(Boolean) : [];
    if (!list.length) return null;
    if (!isIceRegion(region)) return list[Math.floor(random() * list.length)] ?? list[0];

    const ice = list.filter(item => /冰|ais|ice|frost|glacier/i.test(String(
      typeof item === "string" ? item : item?.attribute ?? item?.element ?? item?.name ?? ""
    )));
    const other = list.filter(item => !ice.includes(item));
    if (!ice.length) return list[Math.floor(random() * list.length)] ?? list[0];
    if (!other.length) return ice[Math.floor(random() * ice.length)] ?? ice[0];

    const pool = random() < ICE_CHANCE ? ice : other;
    return pool[Math.floor(random() * pool.length)] ?? pool[0];
  }

  window.BoundlessRegionalSpiritAttributes = Object.freeze({
    version: "1.0.0",
    iceRegions: ICE_REGIONS,
    chances: NORMAL_CHANCES,
    isIceRegion,
    rollBucket,
    chooseAttribute
  });
})();