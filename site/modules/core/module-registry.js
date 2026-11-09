/* Boundless Modular Runtime — Module Registry
 * Modules register with explicit IDs, versions and dependencies.
 * Registration does not execute game logic until start() is called.
 */
(function (root) {
  "use strict";
  const host = root.BoundlessModules || (root.BoundlessModules = {});
  if (host.registry) return;

  const modules = new Map();
  const started = new Set();

  function register(definition) {
    if (!definition || typeof definition.id !== "string" || !definition.id.trim()) {
      throw new TypeError("Module definition requires an id");
    }
    if (modules.has(definition.id)) throw new Error("Duplicate Boundless module: " + definition.id);
    modules.set(definition.id, Object.freeze({
      id: definition.id,
      version: definition.version || "1.0.0",
      dependencies: Object.freeze([...(definition.dependencies || [])]),
      init: typeof definition.init === "function" ? definition.init : function () {}
    }));
    return modules.get(definition.id);
  }

  function start(id, context = {}) {
    if (started.has(id)) return modules.get(id);
    const definition = modules.get(id);
    if (!definition) throw new Error("Unknown Boundless module: " + id);
    for (const dependency of definition.dependencies) {
      if (!modules.has(dependency)) throw new Error("Missing dependency " + dependency + " required by " + id);
      if (!started.has(dependency)) start(dependency, context);
    }
    definition.init(Object.freeze({ ...context, modules: api, events: host.events || null }));
    started.add(id);
    if (host.events) host.events.emit("module:started", { id, version: definition.version });
    return definition;
  }

  function startAll(context = {}) {
    for (const id of modules.keys()) start(id, context);
    return list();
  }

  function list() {
    return Array.from(modules.values(), item => ({
      id: item.id, version: item.version, dependencies: [...item.dependencies], started: started.has(item.id)
    }));
  }

  const api = Object.freeze({ register, start, startAll, list });
  host.registry = api;
})(window);
