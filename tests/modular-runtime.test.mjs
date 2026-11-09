import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../site/modules/", import.meta.url);
function load(relative, window = {}) {
  const context = { window, console, Map, Set, Object, Array, String, Number, JSON, TypeError, Error, RangeError };
  vm.runInNewContext(fs.readFileSync(new URL(relative, root), "utf8"), context, { filename: relative });
  return window;
}

test("event bus delivers events, unsubscribes and supports one-shot handlers", () => {
  const window = load("core/event-bus.js");
  const seen = [];
  const off = window.BoundlessModules.events.on("test:event", value => seen.push(value));
  window.BoundlessModules.events.emit("test:event", 1);
  off();
  window.BoundlessModules.events.emit("test:event", 2);
  window.BoundlessModules.events.on("test:once", value => seen.push(value), { once: true });
  window.BoundlessModules.events.emit("test:once", 3);
  window.BoundlessModules.events.emit("test:once", 4);
  assert.deepEqual(seen, [1, 3]);
});

test("module registry starts dependencies before dependants and only once", () => {
  const window = load("core/event-bus.js");
  load("core/module-registry.js", window);
  const registry = window.BoundlessModules.registry;
  const order = [];
  registry.register({ id: "base", init: () => order.push("base") });
  registry.register({ id: "feature", dependencies: ["base"], init: () => order.push("feature") });
  registry.start("feature");
  registry.start("feature");
  assert.deepEqual(order, ["base", "feature"]);
  assert.equal(registry.list().find(item => item.id === "feature").started, true);
});

test("Spirit Beast catalogue preserves all 37 species, nine tiers and 41 regions", () => {
  const window = load("spirit-beasts/catalogue.js");
  const catalogue = window.BoundlessSpiritBeastCatalogue;
  const report = catalogue.validate();
  assert.equal(catalogue.speciesCount, 37);
  assert.equal(catalogue.tiers().length, 9);
  assert.equal(catalogue.regions().length, 41);
  assert.equal(report.valid, true, report.errors.join("; "));
  assert.equal(catalogue.get(1).name, "Azure Wind Wolf");
  assert.equal(catalogue.get("Azure Tide Serpent").id, 37);
  assert.equal(catalogue.atRegion("Portal Dunia Laut").some(beast => beast.id === 16), true);
});

test("Spirit Beast tier UI consumes the canonical module without a duplicate species list", () => {
  const tiersUi = fs.readFileSync(new URL("../site/assets/v897-spirit-beast-tiers.js", import.meta.url), "utf8");
  const html = fs.readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
  assert.match(tiersUi, /window\.BoundlessModules\?\.spiritBeasts\?\.catalogue/);
  assert.doesNotMatch(tiersUi, /const BEASTS\s*=\s*\[/);
  const catalogueTag = html.indexOf("/modules/spirit-beasts/catalogue.js");
  const tiersTag = html.indexOf("/assets/v897-spirit-beast-tiers.js");
  assert.ok(catalogueTag >= 0, "canonical catalogue script must be loaded");
  assert.ok(tiersTag > catalogueTag, "canonical catalogue must load before the tier UI");
});

test("Spirit Beast domain resolves the optional two-step serpent evolution path", () => {
  const window = load("spirit-beasts/catalogue.js");
  load("spirit-beasts/index.js", window);
  const domain = window.BoundlessModules.spiritBeasts.domain;
  assert.deepEqual(
    JSON.parse(JSON.stringify(domain.evolutionPath(37).map(beast => beast.name))),
    ["Bluewater Serpent", "Serpent Aquarion", "Azure Tide Serpent"]
  );
  assert.equal(domain.listByTier("Suci").length > 0, true);
  assert.equal(domain.validate().valid, true);
});

test("persistence adapter writes module namespaces without losing legacy save fields", () => {
  const data = new Map([["boundless-save", JSON.stringify({
    saveVersion: 29,
    name: "Li Yun",
    spiritBeasts: [{ id: 1, name: "Azure Wind Wolf" }],
    inventory: [{ id: "DAN-001" }]
  })]]);
  const window = { localStorage: {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key)
  }};
  load("core/event-bus.js", window);
  load("persistence/save-adapter.js", window);
  const persistence = window.BoundlessModules.persistence;
  persistence.writeModule("spirit-beasts", { selected: 1, bonds: [] }, { schemaVersion: 2 });
  const saved = JSON.parse(data.get("boundless-save"));
  assert.equal(saved.saveVersion, 29);
  assert.equal(saved.name, "Li Yun");
  assert.equal(saved.spiritBeasts[0].id, 1);
  assert.equal(saved.inventory[0].id, "DAN-001");
  assert.deepEqual(JSON.parse(JSON.stringify(persistence.readModule("spirit-beasts"))), { selected: 1, bonds: [] });
  assert.equal(saved._moduleSchemaVersion, 2);
});
