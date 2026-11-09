/* Boundless Persistence Adapter v1
 * Namespaced module data is merged into the existing save without deleting legacy fields.
 * Not connected to the live save flow until explicit integration and migration tests.
 */
(function (root) {
  "use strict";
  const host = root.BoundlessModules || (root.BoundlessModules = {});
  if (host.persistence) return;
  const SAVE_KEY = "boundless-save";
  const MODULE_DATA_KEY = "moduleData";
  const MODULE_SCHEMA_KEY = "_moduleSchemaVersion";

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }
  function parse(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }
  function read() {
    let save;
    try { save = parse(root.localStorage.getItem(SAVE_KEY)); }
    catch (error) { throw new Error("Boundless save could not be read: " + error.message); }
    return save && typeof save === "object" && !Array.isArray(save) ? save : null;
  }
  function write(save) {
    if (!save || typeof save !== "object" || Array.isArray(save)) throw new TypeError("A save object is required");
    const serialized = JSON.stringify(save);
    try { root.localStorage.setItem(SAVE_KEY, serialized); }
    catch (error) { throw new Error("Boundless save could not be written: " + error.message); }
    return true;
  }
  function readModule(moduleId, fallback = null) {
    if (typeof moduleId !== "string" || !moduleId.trim()) throw new TypeError("Module ID is required");
    const save = read();
    const value = save?.[MODULE_DATA_KEY]?.[moduleId];
    return value === undefined ? clone(fallback) : clone(value);
  }
  function writeModule(moduleId, value, options = {}) {
    if (typeof moduleId !== "string" || !moduleId.trim()) throw new TypeError("Module ID is required");
    const save = read();
    if (!save) throw new Error("No active Boundless save exists; refusing to create or overwrite one");
    const next = { ...save };
    const moduleData = { ...(save[MODULE_DATA_KEY] || {}) };
    moduleData[moduleId] = clone(value);
    next[MODULE_DATA_KEY] = moduleData;
    next[MODULE_SCHEMA_KEY] = Math.max(Number(save[MODULE_SCHEMA_KEY] || 0), Number(options.schemaVersion || 1));
    write(next);
    host.events?.emit("persistence:module-written", { moduleId, schemaVersion: next[MODULE_SCHEMA_KEY] });
    return true;
  }
  function removeModule(moduleId) {
    const save = read();
    if (!save || !save[MODULE_DATA_KEY] || !(moduleId in save[MODULE_DATA_KEY])) return false;
    const moduleData = { ...save[MODULE_DATA_KEY] };
    delete moduleData[moduleId];
    const next = { ...save };
    if (Object.keys(moduleData).length) next[MODULE_DATA_KEY] = moduleData;
    else delete next[MODULE_DATA_KEY];
    write(next);
    return true;
  }
  function snapshot() {
    const save = read();
    return save ? clone(save[MODULE_DATA_KEY] || {}) : {};
  }
  const api = Object.freeze({ saveKey: SAVE_KEY, read, write, readModule, writeModule, removeModule, snapshot });
  host.persistence = api;
  if (host.registry && !host.registry.list().some(item => item.id === "persistence")) {
    host.registry.register({ id: "persistence", version: "1.0.0", dependencies: [], init() {} });
  }
})(window);
