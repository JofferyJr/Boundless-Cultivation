/* Boundless Spirit Beast Domain Module v1
 * Domain-level read API. Does not mutate the legacy game's beast state.
 */
(function (root) {
  "use strict";
  const host = root.BoundlessModules || (root.BoundlessModules = {});
  if (host.spiritBeasts?.domain) return;
  const catalogue = host.spiritBeasts?.catalogue;
  if (!catalogue) throw new Error("Spirit Beast catalogue must load before its domain module");

  function listByTier(tier) {
    return catalogue.list().filter(beast => beast.tier === tier);
  }
  function evolutionPath(beastId) {
    const current = catalogue.get(beastId);
    if (!current) return [];
    const all = catalogue.list();
    const path = [current];
    let cursor = current;
    const seen = new Set([cursor.id]);
    while (cursor.evolution?.from) {
      const previous = all.find(item => item.name === cursor.evolution.from);
      if (!previous || seen.has(previous.id)) break;
      path.unshift(previous);
      seen.add(previous.id);
      cursor = previous;
    }
    return path;
  }
  const api = Object.freeze({
    version: "1.0.0",
    catalogue,
    listByTier,
    evolutionPath,
    validate: () => catalogue.validate()
  });
  host.spiritBeasts.domain = api;
})(window);
