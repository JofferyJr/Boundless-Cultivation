/* Boundless v8.2.2 — nested exploration grids with automatic sizing and DEV overrides.
   Additive navigation layer: preserves the native 3x3 map and its original travel handler. */
(function () {
  "use strict";
  if (window.__boundlessNestedGridV822) return;
  window.__boundlessNestedGridV822 = true;
  var DEV_KEY = "boundless-dev-mode", STORE_KEY = "boundless-nested-grid-v1";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var isDev = function () { try { return sessionStorage.getItem(DEV_KEY) === "1"; } catch (_) { return false; } };
  var safeRead = function () { try { var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); return raw && typeof raw === "object" && raw.entries && typeof raw.entries === "object" ? raw : { version: 1, entries: {} }; } catch (_) { return { version: 1, entries: {} }; } };
  var safeWrite = function (data) { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); return true; } catch (_) { return false; } };
  var slug = function (v) { return String(v || "wilayah").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "wilayah"; };
  var regionName = function (shell) { var text = $(".local-region-heading .eyebrow", shell); return String(text ? text.textContent : "Wilayah").split("·").slice(1).join("·").trim() || "Wilayah"; };
  var tileName = function (tile, index) { var label = $(".local-place-copy b", tile); return String(label ? label.textContent : "Slot " + (index + 1)).trim() || "Slot " + (index + 1); };
  var tileDescription = function (tile) { var label = $(".local-place-copy small", tile); return String(label ? label.textContent : "").trim(); };
  var tileIndex = function (tile, shell) { var index = $$(".local-place-tile", shell).indexOf(tile); return index < 0 ? 0 : index; };
  var tileKey = function (shell, tile) { var index = tile.dataset.bcLoreIndex; if (index == null || index === "") index = String(tileIndex(tile, shell)); return slug(regionName(shell)) + "::" + index; };
  var defaults = function (shell, tile, index) {
    var type = String(tile.className || "").split(/\s+/).filter(function (n) { return ["city", "village", "sect", "heritage", "portal", "market", "grotto", "association"].indexOf(n) >= 0; })[0] || "wilderness";
    var name = tileName(tile, index), biomeClass = String(($(".local-region-map", shell) || {}).className || "");
    var broad = /hutan|forest|laut|sea|pulau|island|gurun|desert|padang|plain|gunung|mountain|lembah|valley|pegunungan|tundra/i.test(biomeClass + " " + regionName(shell));
    var narrow = /selat|jambatan|gerbang|laluan|lorong|pintu kecil|jalan sempit|titian|passage|bridge|strait/i.test(name);
    var rows = 3, cols = 3, reason = "Kawasan biasa";
    if (narrow) { rows = index % 2 === 0 ? 1 : 2; cols = index % 2 === 0 ? 2 : 1; reason = "Laluan sempit"; }
    else if (type === "portal") { rows = index % 2 === 0 ? 2 : 1; cols = index % 2 === 0 ? 1 : 2; reason = "Portal atau pintu masuk"; }
    else if (type === "city" || type === "sect" || type === "heritage" || type === "grotto") { rows = 4; cols = 4; reason = "Lokasi penting"; }
    else if (type === "village" || type === "market" || type === "association") { rows = index % 2 === 0 ? 3 : 2; cols = index % 2 === 0 ? 2 : 3; reason = "Petempatan atau pusat aktiviti"; }
    else if (index === 4 && broad) { rows = 6; cols = 6; reason = "Jubin pusat kawasan luas"; }
    else if (broad) { rows = 4; cols = 4; reason = "Kawasan luas"; }
    return { name: name, description: tileDescription(tile) || ("Grid penerokaan bagi " + name + "."), mode: "auto", rows: rows, cols: cols, reason: reason, cells: {}, visited: [] };
  };
  var getEntry = function (shell, tile) {
    var data = safeRead(), key = tileKey(shell, tile), base = defaults(shell, tile, tileIndex(tile, shell)), entry = data.entries[key] || {};
    return { key: key, name: typeof entry.name === "string" && entry.name.trim() ? entry.name : base.name, description: typeof entry.description === "string" ? entry.description : base.description, mode: entry.mode === "manual" ? "manual" : "auto", rows: entry.mode === "manual" ? Math.max(1, Math.min(6, Number(entry.rows) || base.rows)) : base.rows, cols: entry.mode === "manual" ? Math.max(1, Math.min(6, Number(entry.cols) || base.cols)) : base.cols, reason: base.reason, cells: entry.cells && typeof entry.cells === "object" ? entry.cells : {}, visited: Array.isArray(entry.visited) ? entry.visited : [], raw: entry };
  };
  var persistEntry = function (key, entry) { var data = safeRead(); data.version = 1; data.entries[key] = entry; return safeWrite(data); };
  var cellId = function (row, col) { return row + "-" + col; };
  var cellData = function (entry, row, col) { var id = cellId(row, col), cell = entry.cells[id] || {}, number = row * entry.cols + col + 1; return { id: id, number: number, name: typeof cell.name === "string" && cell.name.trim() ? cell.name : "Petak " + number, description: typeof cell.description === "string" && cell.description.trim() ? cell.description : ("Bahagian " + number + " dalam " + entry.name + "."), visited: entry.visited.indexOf(id) >= 0 }; };
  var style = document.createElement("style"); style.id = "bc-nested-grid-v822-style";
  style.textContent = [
    "#bc-nested-grid-v822{position:fixed;inset:0;z-index:2147483001;display:grid;place-items:center;padding:12px;background:rgba(2,8,5,.88);box-sizing:border-box;color:#f4ead1;font:14px/1.45 system-ui,sans-serif}",
    "#bc-nested-grid-v822[hidden]{display:none!important}#bc-nested-grid-v822 .bcng-card{box-sizing:border-box;width:min(900px,100%);max-height:94vh;overflow:auto;border:1px solid #806936;border-radius:15px;background:#0c1914;box-shadow:0 20px 80px #000b;padding:16px}",
    "#bc-nested-grid-v822 .bcng-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-bottom:1px solid #29443a;padding-bottom:12px;margin-bottom:12px}#bc-nested-grid-v822 h2{margin:0;color:#e5c77d;font:600 21px/1.25 Georgia,serif}#bc-nested-grid-v822 h3{margin:0 0 5px;font:600 16px Georgia,serif}",
    "#bc-nested-grid-v822 p{margin:5px 0;color:#aebdb4;font-size:12px;white-space:pre-wrap}#bc-nested-grid-v822 button,#bc-nested-grid-v822 select,#bc-nested-grid-v822 input,#bc-nested-grid-v822 textarea{font:inherit;box-sizing:border-box}",
    "#bc-nested-grid-v822 button{border:1px solid #5b4d30;border-radius:8px;background:#18231b;color:#e5c77d;padding:8px 10px;cursor:pointer}#bc-nested-grid-v822 button:disabled{opacity:.45;cursor:not-allowed}#bc-nested-grid-v822 button.primary{background:#b49148;color:#09110e;font-weight:700}",
    "#bc-nested-grid-v822 .bcng-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#bc-nested-grid-v822 .bcng-grid{display:grid;grid-template-columns:repeat(var(--bcng-cols,3),minmax(0,1fr));gap:6px;margin-top:12px}",
    "#bc-nested-grid-v822 .bcng-cell{position:relative;min-width:0;min-height:72px;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;text-align:left;gap:7px;padding:8px!important;border-color:#29443a!important;background:linear-gradient(145deg,#14251c,#0a130f)!important;color:#f4ead1!important;overflow-wrap:anywhere}#bc-nested-grid-v822 .bcng-cell[aria-pressed=true]{border-color:#e5c77d!important;box-shadow:inset 0 0 0 1px #e5c77d}#bc-nested-grid-v822 .bcng-cell.is-visited:after{content:'✓';position:absolute;right:7px;top:4px;color:#9ad5a7;font-weight:800}#bc-nested-grid-v822 .bcng-cell small{color:#9fb4a8;font-size:10px}",
    "#bc-nested-grid-v822 .bcng-breadcrumb{color:#e5c77d;font-size:11px;letter-spacing:.04em;margin-bottom:5px}#bc-nested-grid-v822 .bcng-detail{border:1px solid #355347;border-radius:10px;background:#08120e;padding:14px;margin-top:12px}#bc-nested-grid-v822 .bcng-dev{margin-top:14px;border-top:1px solid #355347;padding-top:14px}",
    "#bc-nested-grid-v822 .bcng-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}#bc-nested-grid-v822 label{display:grid;gap:5px;margin:8px 0;color:#dfc477;font-size:12px}#bc-nested-grid-v822 input,#bc-nested-grid-v822 textarea,#bc-nested-grid-v822 select{width:100%;border:1px solid #355347;border-radius:8px;background:#07100d;color:#f4ead1;padding:9px}#bc-nested-grid-v822 textarea{min-height:78px;resize:vertical}#bc-nested-grid-v822 .bcng-status{min-height:18px;color:#9ad5a7;font-size:12px;margin-top:8px}@media(max-width:560px){#bc-nested-grid-v822 .bcng-card{padding:11px}#bc-nested-grid-v822 .bcng-cell{min-height:55px;padding:5px!important;font-size:11px}#bc-nested-grid-v822 .bcng-form-grid{grid-template-columns:1fr}}"
  ].join("\n"); (document.head || document.documentElement).appendChild(style);
  var modal = document.createElement("div"); modal.id = "bc-nested-grid-v822"; modal.hidden = true;
  modal.innerHTML = '<section class="bcng-card" role="dialog" aria-modal="true" aria-labelledby="bcng-title"><header class="bcng-head"><div><div class="bcng-breadcrumb" id="bcng-breadcrumb">WILAYAH → GRID 3×3 → GRID DALAMAN</div><h2 id="bcng-title">Grid Dalaman</h2><p id="bcng-summary"></p></div><button type="button" id="bcng-close" aria-label="Kembali ke grid 3x3">Kembali ke 3×3</button></header><div id="bcng-main"><div id="bcng-grid" class="bcng-grid"></div><div id="bcng-cell-detail" class="bcng-detail" hidden><h3 id="bcng-cell-title"></h3><p id="bcng-cell-description"></p><p id="bcng-cell-status"></p><div class="bcng-actions"><button type="button" id="bcng-mark-visited">Tandakan diteroka</button><button type="button" id="bcng-enter-parent" class="primary">Masuki lokasi permainan</button></div></div></div><section id="bcng-dev" class="bcng-dev" hidden><h3>Editor Grid Dalaman (DEV)</h3><p>Saiz automatik ialah tetapan awal. Pilih Manual untuk mengatasi saiz bagi slot ini sahaja. Nama, deskripsi dan petak disimpan dalam pelayar ini.</p><div class="bcng-form-grid"><label>Kaedah saiz<select id="bcng-mode"><option value="auto">Automatik</option><option value="manual">Manual (DEV)</option></select></label><label>Nama grid<input id="bcng-name" maxlength="90"></label><label>Bilangan baris (1–6)<select id="bcng-rows"></select></label><label>Bilangan lajur (1–6)<select id="bcng-cols"></select></label></div><label>Deskripsi grid<textarea id="bcng-description" maxlength="700"></textarea></label><div class="bcng-form-grid"><label>Petak dipilih<select id="bcng-cell-choice"></select></label><label>Nama petak<input id="bcng-cell-name" maxlength="90"></label></div><label>Deskripsi petak<textarea id="bcng-cell-description" maxlength="500"></textarea></label><div class="bcng-actions"><button type="button" id="bcng-save-grid" class="primary">Simpan tetapan grid</button><button type="button" id="bcng-save-cell">Simpan nama & deskripsi petak</button><button type="button" id="bcng-reset-size">Kembali kepada saiz automatik</button><button type="button" id="bcng-dev-close">Tutup editor</button></div><div id="bcng-dev-status" class="bcng-status" aria-live="polite"></div></section><div class="bcng-actions" id="bcng-footer"><button type="button" id="bcng-dev-toggle">✎ Sunting grid (DEV)</button><button type="button" id="bcng-return" class="primary">Kembali ke grid 3×3</button></div></section>';
  document.body.appendChild(modal);
  var active = null, selected = null, editorOpen = false, allowNativeTravel = new WeakSet();
  var gridRoot = $("#bcng-grid", modal), detail = $("#bcng-cell-detail", modal), devPanel = $("#bcng-dev", modal);
  var rowsSelect = $("#bcng-rows", modal), colsSelect = $("#bcng-cols", modal), cellChoice = $("#bcng-cell-choice", modal);
  for (var n = 1; n <= 6; n++) { var ro = document.createElement("option"); ro.value = String(n); ro.textContent = n + " baris"; rowsSelect.appendChild(ro); var co = document.createElement("option"); co.value = String(n); co.textContent = n + " lajur"; colsSelect.appendChild(co); }
  var closeModal = function () { modal.hidden = true; active = null; selected = null; detail.hidden = true; devPanel.hidden = true; editorOpen = false; };
  var currentEntry = function () { return active ? getEntry(active.shell, active.tile) : null; };
  var updateEntry = function (mutator) { var entry = currentEntry(); if (!entry) return false; var next = Object.assign({}, entry.raw || {}); next.cells = Object.assign({}, entry.cells || {}); next.visited = (entry.visited || []).slice(); mutator(next, entry); return persistEntry(entry.key, next); };
  var selectedCoordinates = function () { var entry = currentEntry(); if (!entry || !selected) return null; var p = selected.split("-"); return { row: Number(p[0]), col: Number(p[1]) }; };
  var fillCellChoices = function (entry) {
    cellChoice.innerHTML = "";
    for (var r = 0; r < entry.rows; r++) for (var c = 0; c < entry.cols; c++) { var cell = cellData(entry, r, c), opt = document.createElement("option"); opt.value = cell.id; opt.textContent = cell.number + ". " + cell.name; cellChoice.appendChild(opt); }
    if (selected && cellChoice.querySelector('option[value="' + selected + '"]')) cellChoice.value = selected;
    else { selected = cellChoice.value || "0-0"; cellChoice.value = selected; }
  };
  var loadSelectedCellEditor = function () { var entry = currentEntry(), coords = selectedCoordinates(); if (!entry || !coords) return; var cell = cellData(entry, coords.row, coords.col); $("#bcng-cell-name", modal).value = entry.cells[cell.id] && entry.cells[cell.id].name || ""; $("#bcng-cell-description", modal).value = entry.cells[cell.id] && entry.cells[cell.id].description || ""; };
  var loadEditor = function () {
    var entry = currentEntry(); if (!entry) return;
    $("#bcng-mode", modal).value = entry.mode; $("#bcng-name", modal).value = entry.name; $("#bcng-description", modal).value = entry.description;
    rowsSelect.value = String(entry.rows); colsSelect.value = String(entry.cols); rowsSelect.disabled = entry.mode !== "manual"; colsSelect.disabled = entry.mode !== "manual";
    fillCellChoices(entry); loadSelectedCellEditor();
  };
  var showSelectedDetail = function () {
    var entry = currentEntry(), coords = selectedCoordinates(); if (!entry || !coords) { detail.hidden = true; return; }
    var cell = cellData(entry, coords.row, coords.col);
    $("#bcng-cell-title", modal).textContent = cell.name; $("#bcng-cell-description", modal).textContent = cell.description;
    $("#bcng-cell-status", modal).textContent = cell.visited ? "Status: sudah diteroka." : "Status: belum diteroka.";
    $("#bcng-mark-visited", modal).textContent = cell.visited ? "Diteroka ✓" : "Tandakan diteroka"; $("#bcng-mark-visited", modal).disabled = cell.visited; detail.hidden = false;
  };
  var renderGrid = function () {
    var entry = currentEntry(); if (!entry) return;
    $("#bcng-title", modal).textContent = entry.name; $("#bcng-summary", modal).textContent = entry.description + "  •  Saiz " + entry.rows + "×" + entry.cols + (entry.mode === "manual" ? " · Tetapan DEV" : " · Auto: " + entry.reason);
    gridRoot.style.setProperty("--bcng-cols", String(entry.cols)); gridRoot.innerHTML = "";
    for (var r = 0; r < entry.rows; r++) for (var c = 0; c < entry.cols; c++) {
      var cell = cellData(entry, r, c), button = document.createElement("button"); button.type = "button"; button.className = "bcng-cell" + (cell.visited ? " is-visited" : "");
      button.setAttribute("aria-pressed", String(selected === cell.id)); button.setAttribute("aria-label", cell.name + ". " + cell.description);
      var strong = document.createElement("strong"); strong.textContent = cell.name; var small = document.createElement("small"); small.textContent = "Petak " + cell.number + (cell.visited ? " · Diteroka" : ""); button.appendChild(strong); button.appendChild(small);
      button.addEventListener("click", function (id) { return function () { selected = id; showSelectedDetail(); renderGrid(); if (!devPanel.hidden) loadEditor(); }; }(cell.id)); gridRoot.appendChild(button);
    }
    fillCellChoices(entry); showSelectedDetail();
    if (isDev()) $("#bcng-dev-toggle", modal).hidden = false;
    else { $("#bcng-dev-toggle", modal).hidden = true; devPanel.hidden = true; editorOpen = false; }
    if (!devPanel.hidden) loadEditor();
  };
  var openGrid = function (shell, tile) {
    active = { shell: shell, tile: tile }; selected = null; detail.hidden = true; devPanel.hidden = true; editorOpen = false;
    var entry = currentEntry(); if (!entry) return;
    selected = entry.visited.length ? entry.visited[entry.visited.length - 1] : "0-0";
    var coords = selected.split("-").map(Number); if (coords[0] >= entry.rows || coords[1] >= entry.cols) selected = "0-0";
    $("#bcng-breadcrumb", modal).textContent = "WILAYAH: " + regionName(shell) + "  →  GRID 3×3: " + tileName(tile, tileIndex(tile, shell)) + "  →  GRID DALAMAN";
    modal.hidden = false; renderGrid(); $("#bcng-return", modal).focus();
  };
  var enterParent = function () { if (!active || !active.tile) return; var tile = active.tile; if (tile.classList.contains("fog")) { var status = $("#bcng-cell-status", modal); if (status) status.textContent = "Jubin ini belum boleh dimasuki. Teroka jubin yang bersebelahan dahulu melalui sistem perjalanan asal."; return; } modal.hidden = true; allowNativeTravel.add(tile); tile.click(); if (active) active = null; selected = null; };
  $("#bcng-close", modal).addEventListener("click", closeModal); $("#bcng-return", modal).addEventListener("click", closeModal); $("#bcng-enter-parent", modal).addEventListener("click", enterParent);
  $("#bcng-mark-visited", modal).addEventListener("click", function () {
    var coords = selectedCoordinates(); if (!coords) return; var id = cellId(coords.row, coords.col);
    var ok = updateEntry(function (next) { if (next.visited.indexOf(id) < 0) next.visited.push(id); });
    $("#bcng-cell-status", modal).textContent = ok ? "✓ Petak ditandakan diteroka dan disimpan." : "Tidak dapat menyimpan. Semak ruang storan pelayar."; renderGrid();
  });
  $("#bcng-dev-toggle", modal).addEventListener("click", function () { if (!isDev()) return; editorOpen = !editorOpen; devPanel.hidden = !editorOpen; if (editorOpen) loadEditor(); });
  $("#bcng-dev-close", modal).addEventListener("click", function () { devPanel.hidden = true; editorOpen = false; });
  $("#bcng-mode", modal).addEventListener("change", function () { rowsSelect.disabled = this.value !== "manual"; colsSelect.disabled = this.value !== "manual"; });
  cellChoice.addEventListener("change", function () { selected = this.value; showSelectedDetail(); loadSelectedCellEditor(); renderGrid(); });
  $("#bcng-save-grid", modal).addEventListener("click", function () {
    if (!isDev()) return; var name = $("#bcng-name", modal).value.trim(); if (!name) { $("#bcng-dev-status", modal).textContent = "Nama grid diperlukan."; return; }
    var mode = $("#bcng-mode", modal).value === "manual" ? "manual" : "auto", rows = Math.max(1, Math.min(6, Number(rowsSelect.value) || 3)), cols = Math.max(1, Math.min(6, Number(colsSelect.value) || 3));
    var ok = updateEntry(function (next) { next.name = name; next.description = $("#bcng-description", modal).value.trim(); next.mode = mode; if (mode === "manual") { next.rows = rows; next.cols = cols; } else { delete next.rows; delete next.cols; } });
    $("#bcng-dev-status", modal).textContent = ok ? "✓ Tetapan grid disimpan." : "Gagal menyimpan tetapan grid."; renderGrid();
  });
  $("#bcng-save-cell", modal).addEventListener("click", function () {
    if (!isDev()) return; var coords = selectedCoordinates(); if (!coords) return; var name = $("#bcng-cell-name", modal).value.trim(); if (!name) { $("#bcng-dev-status", modal).textContent = "Nama petak diperlukan."; return; }
    var id = cellId(coords.row, coords.col); var ok = updateEntry(function (next) { next.cells[id] = { name: name, description: $("#bcng-cell-description", modal).value.trim() }; });
    $("#bcng-dev-status", modal).textContent = ok ? "✓ Nama dan deskripsi petak disimpan." : "Gagal menyimpan nama petak."; renderGrid();
  });
  $("#bcng-reset-size", modal).addEventListener("click", function () { if (!isDev()) return; var ok = updateEntry(function (next) { next.mode = "auto"; delete next.rows; delete next.cols; }); $("#bcng-dev-status", modal).textContent = ok ? "✓ Saiz automatik dipulihkan." : "Gagal memulihkan saiz."; renderGrid(); });
  modal.addEventListener("click", function (event) { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !modal.hidden) { event.preventDefault(); event.stopPropagation(); if (!devPanel.hidden) { devPanel.hidden = true; editorOpen = false; } else closeModal(); } }, true);
  document.addEventListener("click", function (event) {
    var tile = event.target && event.target.closest ? event.target.closest(".local-place-tile") : null; if (!tile) return;
    if (allowNativeTravel.has(tile)) { allowNativeTravel.delete(tile); return; }
    var shell = tile.closest(".local-region-shell"); if (!shell) return;
    event.preventDefault(); event.stopPropagation(); if (event.stopImmediatePropagation) event.stopImmediatePropagation(); openGrid(shell, tile);
  }, true);
  var scan = function () {
    $(".local-region-shell").forEach(function (shell) {
      $(".local-place-tile", shell).forEach(function (tile) { if (tile.disabled) tile.disabled = false; tile.setAttribute("aria-disabled", tile.classList.contains("fog") ? "true" : "false"); });
      var note = $(".local-map-note", shell);
      if (note && !note.dataset.bcNestedGridHint) { var hint = document.createElement("span"); hint.className = "bcng-map-hint"; hint.textContent = " Klik jubin untuk membuka grid dalaman; gunakan “Masuki lokasi permainan” untuk perjalanan asal."; hint.style.color = "#e5c77d"; note.appendChild(hint); note.dataset.bcNestedGridHint = "1"; }
    });
  };
  var start = function () { scan(); var queued = false; new MutationObserver(function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; scan(); }); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "class"] }); window.addEventListener("boundless-open-dev", scan); window.__boundlessNestedGridRefresh = scan; };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();