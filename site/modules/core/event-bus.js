/* Boundless Modular Runtime — Event Bus
 * Small dependency-free event layer shared by extracted game modules.
 * This file is intentionally not loaded by the live page until integration tests pass.
 */
(function (root) {
  "use strict";
  const host = root.BoundlessModules || (root.BoundlessModules = {});
  if (host.events) return;

  const listeners = new Map();
  let sequence = 0;

  function on(type, handler, options = {}) {
    if (typeof type !== "string" || !type.trim()) throw new TypeError("Event type is required");
    if (typeof handler !== "function") throw new TypeError("Event handler must be a function");
    const record = { id: ++sequence, handler, once: options.once === true, owner: options.owner || "anonymous" };
    const bucket = listeners.get(type) || new Set();
    bucket.add(record);
    listeners.set(type, bucket);
    return function unsubscribe() {
      bucket.delete(record);
      if (!bucket.size) listeners.delete(type);
    };
  }

  function emit(type, detail) {
    const bucket = listeners.get(type);
    if (!bucket) return [];
    const results = [];
    for (const record of Array.from(bucket)) {
      try {
        results.push(record.handler(detail));
      } catch (error) {
        results.push(Promise.reject(error));
        if (root.console && console.error) console.error("[Boundless event]", type, record.owner, error);
      }
      if (record.once) bucket.delete(record);
    }
    if (!bucket.size) listeners.delete(type);
    return results;
  }

  function offOwner(owner) {
    for (const [type, bucket] of listeners) {
      for (const record of bucket) if (record.owner === owner) bucket.delete(record);
      if (!bucket.size) listeners.delete(type);
    }
  }

  host.events = Object.freeze({ on, emit, offOwner });
})(window);
