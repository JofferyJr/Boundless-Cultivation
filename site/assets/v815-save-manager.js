import {
  MAX_SAVE_SLOTS,
  BOUNDLESS_SAVE_KEY,
  slotKey,
  isGameSave,
  makeSlotRecord,
  normalizeSlotRecord,
  summarizeSave,
  createSingleExport,
  createBundleExport,
  parseImportPayload
} from "./v815-save-manager-core.mjs";

const $ = (selector, root = document) => root.querySelector(selector);
const GAME_SAVE_KEY = "boundless-save";
const PENDING_LOAD_KEY = "boundless-cultivation-pending-load";

function readJson(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function readActiveSave() {
  // The live game uses "boundless-save"; the legacy key remains for
  // backwards compatibility with older saves and the migration layer.
  const live = readJson(GAME_SAVE_KEY);
  if (isGameSave(live)) return live;
  const legacy = readJson(BOUNDLESS_SAVE_KEY);
  return isGameSave(legacy) ? legacy : null;
}

function writeActiveSave(save) {
  const payload = JSON.stringify(save);
  localStorage.setItem(GAME_SAVE_KEY, payload);
  localStorage.setItem(BOUNDLESS_SAVE_KEY, payload);
}

function readSlot(slot) {
  const value = readJson(slotKey(slot));
  if (!value) return null;
  try { return normalizeSlotRecord(value, slot); } catch { return null; }
}

function writeSlot(record) {
  localStorage.setItem(slotKey(record.slot), JSON.stringify(record));
}

function occupiedSlots() {
  return Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => readSlot(i + 1));
}

function safeFilenamePart(value) {
  return String(value || "save")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "save";
}

function stampForFilename(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function downloadJson(value, filename) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ms-MY", {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit"
  }).format(date);
}

function setStatus(root, message, kind = "") {
  const status = $(".bc-save-status", root);
  if (!status) return;
  status.textContent = message;
  status.dataset.kind = kind;
}

function render(root) {
  const active = readActiveSave();
  const activeBox = $('[data-role="active-summary"]', root);
  if (activeBox) {
    if (active) {
      const summary = summarizeSave(makeSlotRecord(active, 1));
      activeBox.innerHTML = `
        <strong>Save aktif</strong>
        <span>${escapeHtml(summary.name)}</span>
        <span>v${escapeHtml(summary.version)} · Hari ${summary.day}</span>
        <span>${escapeHtml(summary.realm)}</span>
      `;
    } else {
      activeBox.innerHTML = "<strong>Save aktif</strong><span>Belum ada save aktif.</span>";
    }
  }

  const slots = $('[data-role="slots"]', root);
  if (!slots) return;
  slots.innerHTML = Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => {
    const slot = index + 1;
    const record = readSlot(slot);
    if (!record) {
      return `
        <article class="bc-slot bc-slot-empty" data-slot="${slot}">
          <div class="bc-slot-title"><strong>Slot ${slot}</strong><span>Kosong</span></div>
          <input data-label-slot="${slot}" maxlength="40" placeholder="Nama slot (pilihan)" aria-label="Nama Slot ${slot}">
          <div class="bc-slot-actions">
            <button type="button" data-action="save" data-slot="${slot}">Simpan ke Slot ${slot}</button>
          </div>
        </article>
      `;
    }

    const s = summarizeSave(record);
    return `
      <article class="bc-slot" data-slot="${slot}">
        <div class="bc-slot-title"><strong>Slot ${slot}</strong><span>${escapeHtml(formatTime(s.savedAt))}</span></div>
        <input data-label-slot="${slot}" maxlength="40" value="${escapeHtml(s.label)}" placeholder="Nama slot" aria-label="Nama Slot ${slot}">
        <div class="bc-slot-meta">
          <b>${escapeHtml(s.name)}</b>
          <span>v${escapeHtml(s.version)} · save ${s.saveVersion}</span>
          <span>Hari ${s.day} · ${escapeHtml(s.realm)}</span>
          <span>${escapeHtml(s.location)}</span>
        </div>
        <div class="bc-slot-actions">
          <button type="button" data-action="save" data-slot="${slot}">Simpan</button>
          <button type="button" data-action="load" data-slot="${slot}">Muat</button>
          <button type="button" data-action="export" data-slot="${slot}">Export</button>
          <button type="button" data-action="delete" data-slot="${slot}" class="danger">Padam</button>
        </div>
      </article>
    `;
  }).join("");
}

function bindManager(root) {
  if (root.dataset.boundlessSaveBound === "true") return;
  root.dataset.boundlessSaveBound = "true";

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const slot = Number(button.dataset.slot || 0);

    if (action === "save") {
      if (typeof window.__boundlessSaveCurrent === "function") {
        window.__boundlessSaveCurrent();
      }
      const active = readActiveSave();
      if (!active) {
        setStatus(root, "Belum ada permainan aktif untuk disimpan.", "error");
        return;
      }
      const labelInput = root.querySelector(`input[data-label-slot="${slot}"]`);
      const existing = readSlot(slot);
      const label = labelInput?.value?.trim() || existing?.label || `Slot ${slot}`;
      writeSlot(makeSlotRecord(active, slot, new Date().toISOString(), label));
      render(root);
      setStatus(root, `Slot ${slot} disimpan.`, "ok");
      return;
    }

    if (action === "load") {
      const record = readSlot(slot);
      if (!record) return;
      if (!confirm(`Muat Slot ${slot}? Kemajuan aktif yang belum disimpan boleh hilang.`)) return;
      writeActiveSave(record.save);
      if (typeof window.__boundlessLoadCurrent === "function") {
        window.__boundlessLoadCurrent();
        restoreSavedView(record.save);
        setStatus(root, `Slot ${slot} dimuat ke keadaan terakhir.`, "ok");
      } else {
        localStorage.setItem(PENDING_LOAD_KEY, JSON.stringify({ slot, requestedAt: Date.now() }));
        location.reload();
      }
      return;
    }

    if (action === "export") {
      const record = readSlot(slot);
      if (!record) return;
      const summary = summarizeSave(record);
      downloadJson(
        createSingleExport(record),
        `boundless-cultivation-slot-${slot}-${safeFilenamePart(summary.name)}-${stampForFilename()}.json`
      );
      setStatus(root, `Slot ${slot} diexport.`, "ok");
      return;
    }

    if (action === "delete") {
      const record = readSlot(slot);
      if (!record) return;
      if (!confirm(`Padam Slot ${slot}? Tindakan ini tidak memadam save aktif.`)) return;
      localStorage.removeItem(slotKey(slot));
      render(root);
      setStatus(root, `Slot ${slot} dipadam.`, "ok");
      return;
    }

    if (action === "import") {
      $("#bc-save-file", root)?.click();
      return;
    }

    if (action === "export-all") {
      const records = occupiedSlots();
      if (!records.some(Boolean)) {
        setStatus(root, "Tiada slot untuk diexport.", "error");
        return;
      }
      downloadJson(createBundleExport(records), `boundless-cultivation-all-saves-${stampForFilename()}.json`);
      setStatus(root, "Semua slot berisi diexport.", "ok");
    }
  });

  const fileInput = $("#bc-save-file", root);
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const targetSlot = Number($("#bc-save-import-slot", root)?.value || 1);
    try {
      const parsed = parseImportPayload(await file.text(), targetSlot);
      if (parsed.kind === "bundle") {
        if (!confirm("Import bundle akan menggantikan slot yang sepadan. Teruskan?")) {
          fileInput.value = "";
          return;
        }
        for (const record of parsed.records) writeSlot(record);
        render(root);
        setStatus(root, `${parsed.records.length} slot diimport.`, "ok");
      } else {
        const incoming = parsed.records[0];
        const record = makeSlotRecord(
          incoming.save,
          targetSlot,
          new Date().toISOString(),
          incoming.label || `Import Slot ${targetSlot}`
        );
        if (readSlot(targetSlot) && !confirm(`Slot ${targetSlot} sudah berisi. Gantikan?`)) {
          fileInput.value = "";
          return;
        }
        writeSlot(record);
        render(root);
        setStatus(root, `Save diimport ke Slot ${targetSlot}.`, "ok");
      }
    } catch (error) {
      setStatus(root, error?.message || "Import gagal.", "error");
    } finally {
      fileInput.value = "";
    }
  });
}

function mountIntoSettings(host) {
  if (!host || host.dataset.boundlessSaveMounted === "true") return;
  host.dataset.boundlessSaveMounted = "true";
  host.innerHTML = `
    <section id="bc-save-manager-panel" class="bc-save-panel" aria-labelledby="bc-save-title">
      <header class="bc-save-head">
        <div>
          <p class="bc-save-kicker">Data kemajuan</p>
          <h3 id="bc-save-title">Simpan & Export</h3>
          <p>5 slot manual · Import / Export JSON · save lama kekal serasi</p>
        </div>
      </header>

      <div class="bc-active-save" data-role="active-summary"></div>
      <div class="bc-save-status" role="status" aria-live="polite"></div>
      <div class="bc-save-slots" data-role="slots"></div>

      <footer class="bc-save-tools">
        <label>
          <span>Import ke slot</span>
          <select id="bc-save-import-slot">
            ${Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => `<option value="${i + 1}">Slot ${i + 1}</option>`).join("")}
          </select>
        </label>
        <input id="bc-save-file" type="file" accept=".json,application/json" hidden>
        <button type="button" data-action="import">Import Save</button>
        <button type="button" data-action="export-all">Export Semua</button>
      </footer>
    </section>
  `;
  const root = $("#bc-save-manager-panel", host);
  bindManager(root);
  render(root);
}

function visibleElement(element) {
  if (!element) return false;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

function getSettingsDialog() {
  return [...document.querySelectorAll("[role=dialog],[data-slot=sheet-content],[data-slot=dialog-content]")]
    .filter(visibleElement)
    .at(-1) || null;
}

function openSaveManager() {
  const dialog = getSettingsDialog();
  if (!dialog) return;
  const row = dialog.querySelector("[data-save-open]");
  if (!row) return;

  let panel = document.getElementById("bc-save-manager-inline");
  if (panel) {
    panel.remove();
    return;
  }

  panel = document.createElement("section");
  panel.id = "bc-save-manager-inline";
  panel.setAttribute("aria-label", "Simpan & Export");
  row.parentElement?.insertBefore(panel, row.nextSibling);

  const source = document.getElementById("bc-save-manager-mount");
  if (source) {
    panel.appendChild(source);
    source.style.display = "";
  } else {
    const host = document.createElement("div");
    host.id = "bc-save-manager-mount";
    panel.appendChild(host);
    mountIntoSettings(host);
  }
}

function closeSaveManager() {
  document.getElementById("bc-save-manager-inline")?.remove();
}

function onSaveEscape(event) {
  if (event.key === "Escape") closeSaveManager();
}

function injectSaveSettingsItem() {
  const dialog = getSettingsDialog();
  if (!dialog || dialog.querySelector("[data-save-open]")) return;

  const controls = [...dialog.querySelectorAll("button,[role=button]")].filter(visibleElement);
  const target = controls.find((button) =>
    /paparan|permainan|tips|muzik/i.test((button.textContent || "").trim())
  );
  if (!target || !target.parentElement) return;

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.saveOpen = "1";
  button.dataset.slot = "settings-item";
  button.textContent = "💾 Simpan & Export";
  button.setAttribute("aria-label", "Buka Simpan & Export");

  button.className = target.className || "";
  for (const name of ["data-variant", "data-size"]) {
    if (target.hasAttribute(name)) button.setAttribute(name, target.getAttribute(name));
  }
  button.style.cssText = target.style.cssText;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openSaveManager();
  });

  target.parentElement.insertBefore(button, target);
}

function hookSaveSettings() {
  const scan = () => {
    injectSaveSettingsItem();
    const settingsTriggers = [...document.querySelectorAll("button")].filter((button) =>
      /tetapan|settings/i.test(button.textContent || "")
    );
    settingsTriggers.forEach((trigger) => {
      if (trigger.dataset.saveHook) return;
      trigger.dataset.saveHook = "1";
      trigger.addEventListener("click", () => [80, 180, 350, 700].forEach((delay) =>
        setTimeout(injectSaveSettingsItem, delay)
      ));
    });
  };
  scan();
  new MutationObserver(scan).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-state", "aria-expanded"]
  });
}

function findAndMount() {
  const host = document.getElementById("bc-save-manager-mount");
  // Keep the host hidden until the native Settings Save row is selected.
  if (host && !document.getElementById("bc-save-manager-inline")) host.style.display = "none";
}

function hookSaveSettings() {
  const scan = () => {
    injectSaveSettingsItem();
    const settingsTriggers = [...document.querySelectorAll("button")].filter((button) =>
      /tetapan|settings/i.test(button.textContent || "")
    );
    settingsTriggers.forEach((trigger) => {
      if (trigger.dataset.saveHook) return;
      trigger.dataset.saveHook = "1";
      trigger.addEventListener("click", () => [80, 180, 350, 700].forEach((delay) =>
        setTimeout(injectSaveSettingsItem, delay)
      ));
    });
  };
  scan();
  new MutationObserver(scan).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-state", "aria-expanded"]
  });
}

function findAndMount() {
  const host = document.getElementById("bc-save-manager-mount");
  // Do not render the save panel inside Settings/Permainan. It is opened
  // from its own native Settings row and mounted into the save modal.
  if (host && !document.getElementById("bc-save-manager-overlay")) host.style.display = "none";
}




function restoreSavedView(save) {
  const activeTab = String(save?.activeTab || "").trim().toLowerCase();
  if (!activeTab) return;
  const tabNames = {
    inventory: /inventori/i,
    world: /^dunia$/i,
    cultivation: /kultivasi/i,
    character: /watak|karakter/i,
    sect: /sekte/i
  };
  const pattern = tabNames[activeTab];
  if (!pattern) return;
  const apply = () => {
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    const tab = tabs.find((el) => pattern.test((el.textContent || "").trim()));
    if (tab && tab.getAttribute("aria-selected") !== "true") tab.click();
    if (typeof window.__boundlessRefreshView === "function") window.__boundlessRefreshView();
  };
  apply();
  [50, 150, 300].forEach((delay) => setTimeout(apply, delay));
}

function restorePendingLoad() {
  if (!localStorage.getItem(PENDING_LOAD_KEY)) return;
  let attempts = 0;
  const tryLoad = () => {
    if (typeof window.__boundlessLoadCurrent === "function") {
      localStorage.removeItem(PENDING_LOAD_KEY);
      window.__boundlessLoadCurrent();
      return;
    }
    attempts += 1;
    if (attempts < 120) setTimeout(tryLoad, 50);
  };
  tryLoad();
}

function injectSaveStyle() {
  if (document.getElementById("bc-save-modal-style")) return;
  const style = document.createElement("style");
  style.id = "bc-save-modal-style";
  style.textContent =
    '#bc-save-manager-inline{width:100%;margin:0 0 12px}' +
    '#bc-save-manager-inline #bc-save-manager-mount{display:block!important}' +
    '#bc-save-manager-inline .bc-save-panel{margin-top:8px}';
  document.head.appendChild(style);
}

function buildUi() {
  injectSaveStyle();
  hookSaveSettings();
  findAndMount();
  restorePendingLoad();
  const observer = new MutationObserver(() => findAndMount());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return observer;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildUi, { once: true });
} else {
  buildUi();
}

export { buildUi, mountIntoSettings, readActiveSave, readSlot };
