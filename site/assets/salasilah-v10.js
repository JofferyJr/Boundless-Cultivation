(function () {
  "use strict";

  var BASE = "/Boundless-Cultivation";
  var SAVE_KEY = "boundless-save";
  var DATA_PREFIX = "boundless-salasilah-v10:";
  var UI_PREFIX = "boundless-salasilah-ui:";
  var SURNAMES = ["Li", "Jian", "Bing", "Feng", "Huang", "Long", "Kong", "He", "Su", "Xin", "Yue", "Bai", "Yan", "Tie", "Dugu"];
  var GIVEN = ["Wuyuan", "Yun", "Mei", "Lian", "Tian", "Shuang", "Rong", "Wei", "Ling", "Chen", "Yao", "Ming", "Xue", "Jun", "Lan", "Zhen", "Heng", "Jian", "Mo", "Hao"];

  function readSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch (_) { return null; }
  }
  function hash(value) {
    var s = String(value || ""), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function safeArray(value) { return Array.isArray(value) ? value : []; }
  function statusOf(value) {
    var s = String(value || "").toLowerCase();
    if (s.indexOf("meninggal") >= 0 || s === "mati" || s === "death confirmed") return "Meninggal dunia";
    if (s.indexOf("hilang") >= 0 || s === "missing") return "Hilang";
    if (s.indexOf("tidak diketahui") >= 0 || s.indexOf("belum diketahui") >= 0 || s === "unknown") return "Keadaan tidak diketahui";
    if (s.indexOf("pertikaian") >= 0) return "Dalam pertikaian";
    if (s.indexOf("pemeriksaan") >= 0) return "Dalam pemeriksaan";
    if (s.indexOf("cabang utama") >= 0 || s.indexOf("cabang keluarga") >= 0 || s === "aktif" || s === "status permulaan") return "Hidup";
    return value || "Hidup";
  }
  function inferredGeneration(raw, relation, fallback) {
    var s = String(relation || raw && (raw.relation || raw.familyRole) || "").toLowerCase();
    if (/datuk|nenek|leluhur|nenek moyang|grandparent|ancestor/.test(s)) return -2;
    if (/ayah|ibu|bapa|pakcik|makcik|uncle|aunt|father|mother/.test(s)) return -1;
    if (/abang|kakak|adik|saudara kandung|sepupu|sibling|cousin/.test(s)) return 0;
    if (/anak|child|keturunan/.test(s)) return Math.max(1, Number(raw && raw.generation) || 1);
    var g = raw && Number(raw.generation);
    return Number.isFinite(g) ? g : (fallback == null ? 0 : fallback);
  }
  function makePerson(raw, side, generation, relation, worldKey, index) {
    raw = raw && typeof raw === "object" ? raw : {};
    var name = String(raw.name || "Belum diketahui");
    var rel = String(relation || raw.relation || raw.familyRole || "Ahli keluarga");
    var branch = String(raw.familyBranch || raw.branch || (side === "spouse" ? "Cabang pasangan" : "Cabang utama"));
    var id = String(raw.id || ("sal-" + hash(worldKey + "|" + side + "|" + name + "|" + rel + "|" + branch + "|" + index)));
    var rawStatus = String(raw.status || "Hidup");
    var age = Number(raw.age);
    var gen = inferredGeneration(raw, rel, generation);
    return {
      id: id,
      name: name,
      surname: String(raw.surname || name.split(/\s+/)[0] || ""),
      honorific: String(raw.honorific || raw.honorificName || raw.courtesyName || ""),
      portraitIndex: Number.isFinite(Number(raw.portraitIndex)) ? Number(raw.portraitIndex) : null,
      portraitSource: String(raw.portraitSource || (side === "spouse" ? "family" : "family")),
      familySide: side,
      branch: branch,
      generation: gen,
      relationLabel: rel,
      age: Number.isFinite(age) && age >= 0 ? age : null,
      lifeStatus: statusOf(rawStatus),
      statusNote: rawStatus,
      realm: String(raw.realm || raw.cultivationRealm || "Belum diketahui"),
      stage: String(raw.stage || raw.realmStage || "Belum diketahui"),
      title: String(raw.daoTitle || raw.office || raw.title || "Tiada gelaran"),
      origin: String(raw.origin || "Sejarah permulaan"),
      adoption: raw.origin === "Anak Angkat" || raw.adopted === true,
      verified: raw.verified !== false,
      sourceId: String(raw.sourceId || raw.id || ""),
      createdDay: Number(raw.bornDay != null ? raw.bornDay : raw.createdDay) || 0
    };
  }
  function relationId(type, fromId, toId) { return "rel-" + hash(type + "|" + fromId + "|" + toId); }
  function addRelation(list, type, fromId, toId, day, status) {
    if (!fromId || !toId || fromId === toId) return;
    var id = relationId(type, fromId, toId);
    if (list.some(function (r) { return r.id === id; })) return;
    list.push({ id: id, type: type, fromId: fromId, toId: toId, status: status || "Disahkan", verified: status !== "Dalam pemeriksaan", createdDay: Number(day) || 0 });
  }
  function spouseSurname(spouse) {
    var name = String(spouse && spouse.name || "");
    if (spouse && spouse.surname) return String(spouse.surname);
    var parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "Feng";
    if (SURNAMES.indexOf(parts[0]) >= 0) return parts[0];
    if (parts.length > 1 && SURNAMES.indexOf(parts[parts.length - 1]) >= 0) return parts[parts.length - 1];
    return parts[0];
  }
  function makeSpouseRelatives(data, spouse, worldKey, day) {
    if (!spouse || !spouse.name) return data;
    var spouseId = String(spouse.id || ("spouse-" + hash(worldKey + "|" + spouse.name)));
    var people = data.people.slice(), relations = data.relationships.slice();
    var spousePerson = people.find(function (p) { return p.id === spouseId || p.relationLabel === "Pasangan"; });
    if (!spousePerson) return data;
    var source = spouse.familyArchive || spouse.family || spouse.familyRecords || {};
    var sourcePeople = safeArray(source.members || source.people || spouse.familyMembers);
    var sourceRelations = safeArray(source.relationships);
    var categories = [
      { key: "grandparents", generation: -2, label: "Leluhur pasangan" },
      { key: "parents", generation: -1, label: "Ibu bapa pasangan" },
      { key: "auntsUncles", generation: -1, label: "Pakcik / makcik pasangan" },
      { key: "siblings", generation: 0, label: "Adik-beradik pasangan" },
      { key: "cousins", generation: 0, label: "Sepupu pasangan" },
      { key: "children", generation: 1, label: "Keturunan pasangan" }
    ];
    if (!sourcePeople.length) {
      categories.forEach(function (category) {
        var records = safeArray(source[category.key] || spouse[category.key]);
        records.forEach(function (raw) {
          if (!raw || !raw.name) return;
          sourcePeople.push(Object.assign({}, raw, {
            relation: raw.relation || raw.relationLabel || raw.familyRole || category.label,
            generation: raw.generation == null ? category.generation : raw.generation
          }));
        });
      });
    }
    if (!sourcePeople.length && !sourceRelations.length) return data;
    var idMap = Object.create(null);
    sourcePeople.forEach(function (raw, index) {
      if (!raw || !raw.name) return;
      var relation = String(raw.relation || raw.relationLabel || raw.familyRole || "Ahli keluarga pasangan");
      var rawId = String(raw.id || ("spouse-family-" + hash(worldKey + "|" + spouseId + "|" + raw.name + "|" + relation + "|" + index)));
      if (rawId === spouseId || rawId === spousePerson.id) { idMap[rawId] = spousePerson.id; return; }
      var person = people.find(function (p) { return p.id === rawId; });
      if (!person) {
        person = makePerson(Object.assign({}, raw, { id: rawId, familySide: "spouse" }), "spouse", raw.generation == null ? 0 : raw.generation, relation, worldKey, rawId);
        person.familySide = "spouse";
        people.push(person);
      }
      idMap[String(raw.id || rawId)] = person.id;
      idMap[rawId] = person.id;
      idMap[String(raw.name)] = person.id;
    });
    function mapped(id) {
      if (!id) return "";
      return idMap[String(id)] || (String(id) === spouseId ? spousePerson.id : "");
    }
    sourceRelations.forEach(function (rel) {
      if (!rel) return;
      var from = mapped(rel.fromId || rel.parentId || rel.personAId);
      var to = mapped(rel.toId || rel.childId || rel.personBId);
      if (from && to) addRelation(relations, String(rel.type || rel.kind || "parent-child"), from, to, rel.createdDay == null ? day : rel.createdDay, rel.verified === false ? "Dalam pemeriksaan" : "Disahkan");
    });
    sourcePeople.forEach(function (raw) {
      if (!raw || !Array.isArray(raw.parentIds)) return;
      var childId = mapped(raw.id || raw.name);
      raw.parentIds.forEach(function (parentId) {
        var parent = mapped(parentId);
        if (parent && childId) addRelation(relations, "parent-child", parent, childId, day, raw.verified === false ? "Dalam pemeriksaan" : "Disahkan");
      });
    });
    var parentRecords = sourcePeople.filter(function (raw) { return /ibu bapa pasangan|ayah pasangan|ibu pasangan|parent/i.test(String(raw.relation || raw.relationLabel || raw.familyRole || "")); });
    parentRecords.forEach(function (raw) {
      var parentId = mapped(raw.id);
      if (parentId) addRelation(relations, "parent-child", parentId, spousePerson.id, day, raw.verified === false ? "Dalam pemeriksaan" : "Disahkan");
    });
    return Object.assign({}, data, { people: people, relationships: relations });
  }
  function seedData(props, worldKey) {
    var family = props.family || {}, spouse = props.spouse || null, day = Number(props.day) || 0;
    var people = [], relationships = [], branches = [], events = [];
    function add(raw, side, generation, relation, index) {
      var p = makePerson(raw, side, generation, relation, worldKey, index);
      var existing = people.find(function (x) { return x.id === p.id; });
      if (existing) return existing;
      people.push(p);
      return p;
    }
    var rawMembers = safeArray(family.members);
    rawMembers.forEach(function (raw, index) { add(raw, "main", raw && raw.generation, raw && (raw.relation || raw.familyRole), "member-" + index); });
    var grandparents = safeArray(family.grandparents).filter(Boolean);
    var parents = safeArray(family.parents).filter(Boolean);
    var auntsUncles = safeArray(family.auntsUncles).filter(Boolean);
    var cousins = safeArray(family.cousins).filter(Boolean);
    var siblings = safeArray(family.siblings).filter(Boolean);
    grandparents.forEach(function (raw, index) { add(raw, "main", -2, raw && raw.relation, "grandparent-" + index); });
    parents.forEach(function (raw, index) { add(raw, "main", -1, raw && raw.relation, "parent-" + index); });
    auntsUncles.forEach(function (raw, index) { add(raw, "main", -1, raw && raw.relation, "aunt-uncle-" + index); });
    cousins.forEach(function (raw, index) { add(raw, "main", 0, raw && raw.relation, "cousin-" + index); });
    siblings.forEach(function (raw, index) { add(raw, "main", 0, raw && raw.relation, "sibling-" + index); });
    var player = add(family.player || { name: "Pemain", relation: "Watak utama", status: "Hidup" }, "main", 0, "Watak utama", "player");
    player.surname = String(family.surname || player.surname || "Li");
    var spouseRaw = spouse ? Object.assign({}, spouse, { id: spouse.id || ("spouse-" + hash(worldKey + "|" + spouse.name)) }) : null;
    var spousePerson = spouseRaw ? add(spouseRaw, "spouse", 0, "Pasangan", "spouse") : null;
    safeArray(props.descendants).forEach(function (raw, index) {
      add(raw, "main", raw && raw.generation != null ? raw.generation : 1, raw && raw.origin === "Anak Angkat" ? "Anak angkat" : "Anak", "child-" + index);
    });
    function findByRelation(list, branch) {
      var item = list.find(function (raw) { return String(raw && (raw.branch || raw.familyBranch) || "").toLowerCase() === branch; });
      if (!item) item = list[branch === "ayah" ? 0 : 1];
      return item ? people.find(function (p) { return p.id === String(item.id || ""); }) || people.find(function (p) { return p.name === item.name && p.familySide === "main"; }) : null;
    }
    parents.forEach(function (raw) {
      var parent = people.find(function (p) { return p.id === String(raw.id || "") && p.familySide === "main"; }) || people.find(function (p) { return p.name === raw.name && p.familySide === "main" && p.generation === -1; });
      if (parent) addRelation(relationships, "parent-child", parent.id, player.id, day);
    });
    if (parents.length >= 2) {
      var parentA = people.find(function (p) { return p.id === String(parents[0].id || "") && p.familySide === "main"; }) || people.find(function (p) { return p.name === parents[0].name && p.familySide === "main" && p.generation === -1; });
      var parentB = people.find(function (p) { return p.id === String(parents[1].id || "") && p.familySide === "main"; }) || people.find(function (p) { return p.name === parents[1].name && p.familySide === "main" && p.generation === -1; });
      if (parentA && parentB) addRelation(relationships, "marriage", parentA.id, parentB.id, day);
    }
    grandparents.forEach(function (raw) {
      var gp = people.find(function (p) { return p.id === String(raw.id || "") && p.familySide === "main"; }) || people.find(function (p) { return p.name === raw.name && p.familySide === "main" && p.generation === -2; });
      var branch = String(raw.branch || raw.familyBranch || "").toLowerCase();
      var parentRaw = parents.find(function (p) { return String(p.branch || p.familyBranch || "").toLowerCase() === branch; });
      if (gp && parentRaw) {
        var parent = people.find(function (p) { return p.id === String(parentRaw.id || "") && p.familySide === "main"; }) || people.find(function (p) { return p.name === parentRaw.name && p.familySide === "main" && p.generation === -1; });
        if (parent) addRelation(relationships, "parent-child", gp.id, parent.id, day);
      }
    });
    siblings.forEach(function (raw) {
      var sibling = people.find(function (p) { return p.id === String(raw.id || "") && p.familySide === "main"; }) || people.find(function (p) { return p.name === raw.name && p.familySide === "main"; });
      if (sibling && sibling.id !== player.id) parents.forEach(function (parentRaw) {
        var parent = people.find(function (p) { return p.id === String(parentRaw.id || "") && p.familySide === "main"; }) || people.find(function (p) { return p.name === parentRaw.name && p.familySide === "main"; });
        if (parent) addRelation(relationships, "parent-child", parent.id, sibling.id, day);
      });
    });
    auntsUncles.forEach(function (raw) {
      var relative = people.find(function (p) { return p.id === String(raw.id || "") && p.familySide === "main"; }) || people.find(function (p) { return p.name === raw.name && p.familySide === "main"; });
      if (relative) addRelation(relationships, "branch-relative", player.id, relative.id, day);
    });
    cousins.forEach(function (raw) {
      var relative = people.find(function (p) { return p.id === String(raw.id || "") && p.familySide === "main"; }) || people.find(function (p) { return p.name === raw.name && p.familySide === "main"; });
      if (relative) addRelation(relationships, "cousin", player.id, relative.id, day);
    });
    if (spousePerson) addRelation(relationships, "marriage", player.id, spousePerson.id, day);
    safeArray(props.descendants).forEach(function (raw) {
      var child = people.find(function (p) { return p.id === String(raw.id || "") && p.familySide === "main"; }) || people.find(function (p) { return p.name === raw.name && p.generation >= 1; });
      if (child) {
        var kind = raw.origin === "Anak Angkat" ? "adoption" : "parent-child";
        addRelation(relationships, kind, player.id, child.id, raw.bornDay || day);
        if (spousePerson && kind === "parent-child") addRelation(relationships, kind, spousePerson.id, child.id, raw.bornDay || day);
      }
    });
    branches.push({ id: "branch-main-" + hash(worldKey), name: String(family.house || "Cabang utama") + " · Marga " + String(family.surname || "Li"), side: "main", status: "Aktif", founderId: player.id, createdDay: 0, rule: "Adat keluarga" });
    if (spousePerson) branches.push({ id: "branch-spouse-" + hash(worldKey), name: "Cabang pasangan · Marga " + spousePerson.surname, side: "spouse", status: "Aktif", founderId: spousePerson.id, createdDay: 0, rule: "Adat keluarga pasangan" });
    safeArray(family.history).forEach(function (item, index) {
      events.push({ id: String(item.id || ("origin-" + index)), type: String(item.kind || "origin"), title: String(item.title || "Sejarah keluarga"), description: String(item.description || ""), day: Number(item.createdAt) || 0, status: "Disahkan", createdAt: Number(item.createdAt) || 0, personIds: [] });
    });
    var data = {
      schemaVersion: 1,
      worldKey: worldKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastSimulatedDay: day,
      people: people,
      relationships: relationships,
      branches: branches,
      events: events,
      appointments: [],
      disputes: [],
      namingRules: { generationNames: "Mengikut adat setiap keluarga", surnameTieBreak: "Nama keluarga bapa jika kedua-dua keluarga seimbang dan tiada adat khusus", honorifics: "Melalui pencapaian, jawatan atau pengiktirafan sah" },
      permissions: { mode: "Gabungan", note: "Jawatan menentukan kuasa asas; kuasa tambahan memerlukan pelantikan rasmi." }
    };
    if (spousePerson) data = makeSpouseRelatives(data, spouse, worldKey, day);
    return data;
  }
  function persistData(worldKey, data, event) {
    data.updatedAt = Date.now();
    try { localStorage.setItem(DATA_PREFIX + worldKey, JSON.stringify(data)); } catch (_) {}
    try {
      var save = readSave();
      if (!save || !save.familyArchive) return;
      var archive = save.familyArchive;
      archive.salasilahV10 = data;
      if (event && event.id) {
        archive.history = safeArray(archive.history);
        if (!archive.history.some(function (h) { return h.id === event.id; })) {
          archive.history.push({ id: event.id, kind: event.type || "other", title: event.title || "Peristiwa keluarga", description: event.description || "", memberName: event.memberName || null, relatedMemberName: event.relatedMemberName || null, createdAt: event.createdAt || Date.now(), worldDay: event.day || 0, status: event.status || "Direkodkan" });
          archive.history = archive.history.slice(-200);
        }
      }
      archive.members = safeArray(archive.members);
      safeArray(data.people).filter(function (p) { return p.familySide === "main"; }).forEach(function (p) {
        if (!archive.members.some(function (m) { return m.id === p.id; })) archive.members.push({ id: p.id, name: p.name, relation: p.relationLabel, familyRole: p.relationLabel, status: p.lifeStatus, age: p.age, familyBranch: p.branch, generation: p.generation, portraitIndex: p.portraitIndex, origin: p.origin });
      });
      archive.children = safeArray(archive.children);
      safeArray(data.people).filter(function (p) { return p.familySide === "main" && p.generation >= 1; }).forEach(function (p) {
        if (!archive.children.some(function (child) { return child.id === p.id; })) archive.children.push({ id: p.id, name: p.name, origin: p.origin, bornDay: p.createdDay, generation: p.generation, portraitIndex: p.portraitIndex, portraitSource: p.portraitSource, parentId: "player-founder" });
      });
      save.familyArchive = archive;
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (_) {}
  }
  function loadData(props, worldKey) {
    var save = readSave();
    var archived = save && save.familyArchive && save.familyArchive.salasilahV10;
    if (archived && archived.worldKey === worldKey && archived.schemaVersion === 1 && Array.isArray(archived.people)) return archived;
    try {
      var local = JSON.parse(localStorage.getItem(DATA_PREFIX + worldKey) || "null");
      if (local && local.worldKey === worldKey && local.schemaVersion === 1 && Array.isArray(local.people)) return local;
    } catch (_) {}
    return seedData(props, worldKey);
  }
  function labelGeneration(g) {
    if (g <= -2) return "Leluhur";
    if (g === -1) return "Ibu bapa dan cabang terdahulu";
    if (g === 0) return "Pasangan utama dan generasi setara";
    if (g === 1) return "Anak";
    return "Keturunan generasi " + (g + 1);
  }
  function relationshipLabel(type, person, selected) {
    if (type === "parent-child") return person.generation < selected.generation ? "Ibu bapa / leluhur" : "Anak / keturunan";
    if (type === "adoption") return "Hubungan pengangkatan";
    if (type === "marriage") return "Pasangan";
    if (type === "cousin") return "Sepupu";
    if (type === "branch-relative") return "Cabang keluarga";
    return type.replace(/-/g, " ");
  }
  function mount(root, props) {
    if (!root) return function () {};
    var active = true;
    props = props || {};
    var family = props.family || {};
    var save = readSave();
    var worldKey = String(save && save.familyArchiveCharacterKey || family.familyId || ((family.house || "Pengembara") + "|" + (family.surname || "Li")));
    var uiKey = UI_PREFIX + worldKey;
    var ui = { view: "family", panel: "chart", selectedId: "", query: "", status: "all", eventType: "other", notice: "", branchName: "" };
    try { ui = Object.assign(ui, JSON.parse(localStorage.getItem(uiKey) || "null") || {}); } catch (_) {}
    var data = loadData(props, worldKey);
    var currentDay = Math.max(0, Number(props.day) || 0);
    var initialPlayer = data.people.find(function (p) { return p.relationLabel === "Watak utama" || p.id === (family.player && family.player.id); }) || data.people.find(function (p) { return p.familySide === "main" && p.generation === 0; });
    if (!ui.selectedId && initialPlayer) ui.selectedId = initialPlayer.id;

    function saveUi() { try { localStorage.setItem(uiKey, JSON.stringify(ui)); } catch (_) {} }
    function setNotice(message) { ui.notice = message; saveUi(); render(); }
    function persist(next, event) { data = next; persistData(worldKey, data, event); saveUi(); render(); }
    function addEvent(type, title, description, status, personId) {
      var stamp = Date.now();
      var event = { id: "salasilah-event-" + hash(worldKey + "|" + type + "|" + currentDay + "|" + stamp + "|" + title), type: type, title: title, description: description, status: status || "Dalam pemeriksaan", day: currentDay, createdAt: stamp, personIds: personId ? [personId] : [] };
      var next = Object.assign({}, data, { events: safeArray(data.events).concat([event]).slice(-300) });
      if (type === "branch") {
        var name = String(ui.branchName || "").trim();
        if (!name) { setNotice("Masukkan nama cabang sebelum menghantar cadangan."); return; }
        var branch = { id: "branch-proposal-" + hash(worldKey + "|" + name + "|" + currentDay), name: name, side: "main", status: "Dalam pemeriksaan", founderId: personId || ui.selectedId, createdDay: currentDay, rule: "Menunggu pengiktirafan rasmi", proposalEventId: event.id };
        next.branches = safeArray(data.branches).concat([branch]);
        event.description = "Cadangan cabang baharu: " + name + ". Cabang belum rasmi sehingga diluluskan mengikut adat dan bidang kuasa.";
      }
      persist(next, event);
      ui.notice = "Rekod disimpan. Hubungan atau hak terlindung tidak diubah secara automatik.";
      saveUi();
      render();
    }
    function syncChildren() {
      var descendants = safeArray(props.descendants);
      var next = Object.assign({}, data, { people: data.people.slice(), relationships: data.relationships.slice(), events: data.events.slice() });
      var changed = false;
      descendants.forEach(function (raw, index) {
        var id = String(raw.id || ("child-" + hash(worldKey + "|" + raw.name + "|" + index)));
        if (next.people.some(function (p) { return p.id === id; })) return;
        var child = makePerson(raw, "main", raw.generation == null ? 1 : raw.generation, raw.origin === "Anak Angkat" ? "Anak angkat" : "Anak", worldKey, index);
        child.id = id;
        child.createdDay = Number(raw.bornDay) || currentDay;
        next.people.push(child);
        var player = next.people.find(function (p) { return p.relationLabel === "Watak utama"; });
        var spouse = next.people.find(function (p) { return p.relationLabel === "Pasangan"; });
        addRelation(next.relationships, raw.origin === "Anak Angkat" ? "adoption" : "parent-child", player && player.id, child.id, child.createdDay);
        if (spouse && raw.origin !== "Anak Angkat") addRelation(next.relationships, "parent-child", spouse.id, child.id, child.createdDay);
        var ev = { id: "birth-sync-" + id, type: raw.origin === "Anak Angkat" ? "adoption" : "birth", title: raw.origin === "Anak Angkat" ? "Pengangkatan direkodkan" : "Kelahiran direkodkan", description: child.name + " disegerakkan daripada rekod permainan. Identiti dan hubungan dikekalkan tanpa mencipta rekod kedua.", status: "Disahkan", day: child.createdDay, createdAt: Date.now(), personIds: [child.id] };
        next.events.push(ev);
        changed = true;
        persistData(worldKey, next, ev);
      });
      if (changed) { data = next; saveUi(); render(); }
    }
    function ensureSpouseFamily() {
      var spouse = props.spouse;
      if (!spouse || !spouse.name) return;
      var spouseId = String(spouse.id || ("spouse-" + hash(worldKey + "|" + spouse.name)));
      if (data.people.some(function (p) { return p.id === spouseId; }) && data.people.some(function (p) { return p.familySide === "spouse" && p.id !== spouseId && p.relationLabel !== "Pasangan"; })) return;
      var next = makeSpouseRelatives(data, spouse, worldKey, currentDay);
      var player = next.people.find(function (p) { return p.relationLabel === "Watak utama"; });
      var spousePerson = next.people.find(function (p) { return p.id === spouseId; }) || next.people.find(function (p) { return p.relationLabel === "Pasangan"; });
      if (player && spousePerson) addRelation(next.relationships, "marriage", player.id, spousePerson.id, currentDay);
      if (!safeArray(next.branches).some(function (branch) { return branch.side === "spouse"; }) && spousePerson) {
        next.branches = safeArray(next.branches).concat([{ id: "branch-spouse-" + hash(worldKey), name: "Cabang pasangan · Marga " + spousePerson.surname, side: "spouse", status: "Aktif", founderId: spousePerson.id, createdDay: 0, rule: "Adat keluarga pasangan" }]);
      }
      if (next.people.length !== data.people.length || next.relationships.length !== data.relationships.length || next.branches.length !== data.branches.length) persist(next);
    }
    function simulateWorldTime() {
      var last = Number(data.lastSimulatedDay) || 0;
      if (currentDay <= last) return;
      var next = Object.assign({}, data, { people: data.people.slice(), relationships: data.relationships.slice(), events: data.events.slice() });
      var start = Math.max(last + 1, currentDay - 29);
      function ageAt(person, day) {
        if (person.age == null) return null;
        return Number(person.age) + Math.floor(Math.max(0, day - (Number(person.createdDay) || 0)) / 360);
      }
      function fatherFirst(a, b) {
        var aFather = /ayah|bapa|datuk/i.test(a.relationLabel || "");
        var bFather = /ayah|bapa|datuk/i.test(b.relationLabel || "");
        if (aFather !== bFather) return aFather ? [a, b] : [b, a];
        return [a, b];
      }
      function simulateNpcBirth(day) {
        var marriages = next.relationships.filter(function (rel) { return rel.type === "marriage" && rel.verified !== false; });
        marriages.forEach(function (marriage) {
          var a = next.people.find(function (p) { return p.id === marriage.fromId; });
          var b = next.people.find(function (p) { return p.id === marriage.toId; });
          if (!a || !b || a.id === playerId() || b.id === playerId() || a.id === spouseId() || b.id === spouseId()) return;
          if (a.lifeStatus !== "Hidup" || b.lifeStatus !== "Hidup") return;
          var ageA = ageAt(a, day), ageB = ageAt(b, day);
          if (ageA == null || ageB == null || ageA < 18 || ageA > 60 || ageB < 18 || ageB > 60) return;
          var coupleKey = [a.id, b.id].sort().join("|");
          var childIds = new Set(next.relationships.filter(function (rel) {
            return rel.type === "parent-child" && (rel.fromId === a.id || rel.fromId === b.id);
          }).map(function (rel) { return rel.toId; }));
          if (childIds.size >= 4) return;
          var cycle = Math.floor(day / 30);
          var roll = parseInt(hash(worldKey + "|npc-birth|" + coupleKey + "|" + cycle), 36) % 100;
          if (roll >= 12) return;
          var childId = "npc-child-" + hash(worldKey + "|" + coupleKey + "|" + cycle);
          if (next.people.some(function (p) { return p.id === childId; })) return;
          var pair = fatherFirst(a, b), father = pair[0], mother = pair[1];
          var surname = father.surname || mother.surname || "Li";
          var givenName = GIVEN[parseInt(hash(childId + "|name"), 36) % GIVEN.length];
          var child = makePerson({ id: childId, name: surname + " " + givenName, surname: surname, relation: "Anak simulasi", generation: Math.max(Number(father.generation) || 0, Number(mother.generation) || 0) + 1, age: 0, status: "Hidup", origin: "Simulasi berkala", portraitIndex: parseInt(hash(childId + "|portrait"), 36) % 16, bornDay: day }, father.familySide, Math.max(Number(father.generation) || 0, Number(mother.generation) || 0) + 1, "Anak simulasi", worldKey, childId);
          child.id = childId;
          child.createdDay = day;
          child.branch = father.branch || mother.branch || "Cabang utama";
          next.people.push(child);
          addRelation(next.relationships, "parent-child", father.id, child.id, day);
          addRelation(next.relationships, "parent-child", mother.id, child.id, day);
          var birthEvent = { id: "simulation-birth-" + childId, type: "birth", title: "Kelahiran NPC direkodkan", description: child.name + " dilahirkan melalui simulasi berkala bagi pasangan NPC yang memenuhi syarat. ID dan hubungan ibu bapa disimpan sekali sahaja.", status: "Disahkan", day: day, createdAt: Date.now(), personIds: [father.id, mother.id, child.id] };
          if (!next.events.some(function (event) { return event.id === birthEvent.id; })) next.events.push(birthEvent);
        });
      }
      for (var d = start; d <= currentDay; d++) {
        if (d > 0 && d % 30 === 0) {
          simulateNpcBirth(d);
          var id = "simulation-" + hash(worldKey + "|" + d);
          if (!next.events.some(function (event) { return event.id === id; })) next.events.push({ id: id, type: "simulation", title: "Penilaian berkala Hari " + d, description: "Kelayakan pasangan NPC dinilai. Pasangan pemain tidak menghasilkan anak secara automatik; hubungan terlindung tidak diubah tanpa peristiwa sah.", status: "Selesai", day: d, createdAt: Date.now(), personIds: [] });
        }
      }
      next.events = next.events.slice(-300);
      next.lastSimulatedDay = currentDay;
      persistData(worldKey, next);
      data = next;
      saveUi();
    }
    function personById(id) { return data.people.find(function (p) { return p.id === id; }); }
    function playerId() {
      var p = data.people.find(function (person) { return person.relationLabel === "Watak utama"; });
      return p ? p.id : "";
    }
    function spouseId() {
      var p = data.people.find(function (person) { return person.relationLabel === "Pasangan"; });
      return p ? p.id : "";
    }
    function visiblePeople() {
      var query = String(ui.query || "").trim().toLowerCase();
      return data.people.filter(function (p) {
        var side = ui.view === "family" ? (p.familySide === "main" || p.id === spouseId() || p.generation >= 1) : ui.view === "spouse" ? (p.familySide === "spouse" || p.id === playerId() || p.generation >= 1) : true;
        if (!side) return false;
        if (ui.status !== "all" && p.lifeStatus !== ui.status) return false;
        if (query && [p.name, p.surname, p.honorific, p.branch, p.relationLabel, p.title].join(" ").toLowerCase().indexOf(query) < 0) return false;
        return true;
      });
    }
    function card(p) {
      var selected = p.id === ui.selectedId;
      var idx = p.portraitIndex == null ? 0 : Math.max(0, Math.min(40, Number(p.portraitIndex)));
      var portrait = BASE + "/game-assets/characters/portraits/family-core/portrait-" + String(idx % 16).padStart(2, "0") + ".webp";
      return '<button type="button" class="salasilah-person-card' + (selected ? " is-selected" : "") + '" data-action="select-person" data-id="' + esc(p.id) + '" aria-pressed="' + selected + '">' +
        '<span class="salasilah-avatar"><img src="' + esc(portrait) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'"><span>' + esc((p.name || "?").slice(0, 1)) + '</span></span>' +
        '<span class="salasilah-person-copy"><strong>' + esc(p.name) + '</strong><small>' + esc(p.relationLabel) + '</small><em class="salasilah-status">' + esc(p.lifeStatus) + '</em></span></button>';
    }
    function renderChart() {
      var list = visiblePeople();
      if (!list.length) return '<div class="salasilah-empty">Tiada individu sepadan dengan carian atau penapis ini.</div>';
      var levels = Array.from(new Set(list.map(function (p) { return Number(p.generation) || 0; }))).sort(function (a, b) { return a - b; });
      return levels.map(function (g) {
        var members = list.filter(function (p) { return (Number(p.generation) || 0) === g; });
        members.sort(function (a, b) {
          var order = function (p) { return p.id === playerId() ? 0 : p.id === spouseId() ? 1 : 2; };
          return order(a) - order(b) || a.name.localeCompare(b.name);
        });
        var contents = members.map(card).join("");
        if (g === 0) {
          var player = members.find(function (p) { return p.id === playerId(); });
          var spouse = members.find(function (p) { return p.id === spouseId(); });
          var rest = members.filter(function (p) { return p.id !== playerId() && p.id !== spouseId(); });
          contents = (player ? card(player) : "") + (spouse ? '<span class="salasilah-couple-link" aria-label="Hubungan pasangan">— Pasangan —</span>' + card(spouse) : "") + rest.map(card).join("");
        }
        return '<section class="salasilah-generation" data-generation="' + g + '"><header><span>' + esc(labelGeneration(g)) + '</span><small>' + members.length + ' individu</small></header><div class="salasilah-generation-cards">' + contents + '</div></section>';
      }).join("");
    }
    function renderDetails() {
      var person = personById(ui.selectedId) || personById(playerId()) || data.people[0];
      if (!person) return '<div class="salasilah-empty">Pilih individu untuk melihat rekod.</div>';
      var links = data.relationships.filter(function (rel) { return rel.fromId === person.id || rel.toId === person.id; }).map(function (rel) {
        var otherId = rel.fromId === person.id ? rel.toId : rel.fromId;
        var other = personById(otherId);
        if (!other) return "";
        return '<li><span>' + esc(relationshipLabel(rel.type, other, person)) + '</span><button type="button" data-action="select-person" data-id="' + esc(other.id) + '">' + esc(other.name) + '</button><small>' + esc(rel.status) + '</small></li>';
      }).join("");
      var events = data.events.filter(function (event) { return safeArray(event.personIds).indexOf(person.id) >= 0 || event.description && event.description.indexOf(person.name) >= 0; }).slice(-5).reverse().map(function (event) {
        return '<li><strong>' + esc(event.title) + '</strong><small>Hari ' + esc(event.day) + ' · ' + esc(event.status) + '</small><p>' + esc(event.description) + '</p></li>';
      }).join("");
      return '<div class="salasilah-detail-heading"><span class="salasilah-detail-avatar">' + esc((person.name || "?").slice(0, 1)) + '</span><div><p class="salasilah-kicker">Kad individu · ID unik</p><h3>' + esc(person.name) + '</h3><p>' + esc(person.id) + '</p></div></div>' +
        '<dl class="salasilah-detail-grid"><div><dt>Nama kehormat</dt><dd>' + esc(person.honorific || "Belum ditetapkan") + '</dd></div><div><dt>Marga</dt><dd>' + esc(person.surname || "Belum diketahui") + '</dd></div><div><dt>Cabang / generasi</dt><dd>' + esc(person.branch) + ' · ' + esc(person.generation) + '</dd></div><div><dt>Umur / status</dt><dd>' + esc(person.age == null ? "Belum diketahui" : person.age + " tahun") + ' · ' + esc(person.lifeStatus) + '</dd></div><div><dt>Ranah / peringkat</dt><dd>' + esc(person.realm) + ' · ' + esc(person.stage) + '</dd></div><div><dt>Gelaran / jawatan</dt><dd>' + esc(person.title) + '</dd></div><div><dt>Asal-usul</dt><dd>' + esc(person.origin) + '</dd></div><div><dt>Pengesahan</dt><dd>' + (person.verified ? "Rekod permulaan / disahkan" : "Belum disahkan") + '</dd></div></dl>' +
        '<section class="salasilah-detail-section"><h4>Hubungan yang direkodkan</h4>' + (links ? '<ul class="salasilah-link-list">' + links + '</ul>' : '<p class="salasilah-muted">Belum ada hubungan tambahan yang direkodkan.</p>') + '</section>' +
        '<section class="salasilah-detail-section"><h4>Peristiwa kehidupan</h4>' + (events ? '<ul class="salasilah-event-list compact">' + events + '</ul>' : '<p class="salasilah-muted">Tiada peristiwa khusus bagi individu ini.</p>') + '</section>' +
        '<div class="salasilah-detail-actions"><button type="button" class="salasilah-button secondary" data-action="proposal" data-type="correction">Cadangkan pembetulan</button><button type="button" class="salasilah-button secondary" data-action="proposal" data-type="dispute">Pertikaikan rekod</button></div>';
    }
    function renderHistory() {
      var events = safeArray(data.events).slice().sort(function (a, b) { return (Number(b.day) || 0) - (Number(a.day) || 0); }).slice(0, 30);
      return '<div class="salasilah-section-heading"><div><p class="salasilah-kicker">Sejarah yang kekal</p><h3>Peristiwa keluarga</h3></div><span class="salasilah-count">' + data.events.length + ' rekod</span></div>' +
        (events.length ? '<ul class="salasilah-event-list">' + events.map(function (event) { return '<li><div class="salasilah-event-top"><strong>' + esc(event.title) + '</strong><span>' + esc(event.status || "Direkodkan") + '</span></div><small>Hari ' + esc(event.day) + '</small><p>' + esc(event.description) + '</p></li>'; }).join("") + '</ul>' : '<div class="salasilah-empty">Belum ada peristiwa baharu. Sejarah asal keluarga dikekalkan.</div>') +
        '<form class="salasilah-event-form" data-form="event"><h4>Rekod peristiwa atau tuntutan</h4><p>Perubahan keturunan, kematian, perkahwinan dan pewarisan tidak dilaksanakan secara automatik. Tuntutan terlindung direkodkan untuk pemeriksaan.</p><label>Jenis rekod<select name="eventType"><option value="other"' + (ui.eventType === "other" ? " selected" : "") + '>Catatan sejarah</option><option value="correction"' + (ui.eventType === "correction" ? " selected" : "") + '>Cadangan pembetulan</option><option value="dispute"' + (ui.eventType === "dispute" ? " selected" : "") + '>Pertikaian keluarga</option><option value="inheritance"' + (ui.eventType === "inheritance" ? " selected" : "") + '>Tuntutan pewarisan</option><option value="branch"' + (ui.eventType === "branch" ? " selected" : "") + '>Cadangan cabang baharu</option><option value="appointment"' + (ui.eventType === "appointment" ? " selected" : "") + '>Cadangan pelantikan rasmi</option></select></label><label>Nama / tajuk<input name="eventTitle" maxlength="100" placeholder="Contoh: Tuntutan cabang keluarga"></label><label>Butiran dan alasan<textarea name="eventDescription" rows="3" maxlength="1200" placeholder="Nyatakan fakta, sebab atau bukti yang perlu diperiksa"></textarea></label><label>Nama cabang (jika berkaitan)<input name="branchName" maxlength="80" placeholder="Nama cabang yang dicadangkan"></label><button class="salasilah-button primary" type="submit">Simpan rekod / hantar tuntutan</button></form>';
    }
    function renderManagement() {
      var roles = [
        ["Ahli keluarga", "Melihat rekod dan mengemukakan cadangan; mengurus medan peribadi yang dibenarkan."],
        ["Wakil keluarga", "Mengumpulkan bukti dan mengurus catatan yang dibenarkan."],
        ["Ketua keluarga", "Mengurus urusan keluarga mengikut adat dan bidang kuasa yang diiktiraf."],
        ["Majlis keluarga", "Menilai pertikaian dan keputusan yang memerlukan pertimbangan bersama."],
        ["Pentadbir dunia", "Mengendalikan perkara peringkat dunia dalam bidang kuasa rasmi."]
      ];
      var branches = safeArray(data.branches).map(function (branch) { return '<li><div><strong>' + esc(branch.name) + '</strong><small>' + esc(branch.side === "spouse" ? "Keluarga pasangan" : "Keluarga watak") + '</small></div><span class="salasilah-status">' + esc(branch.status) + '</span></li>'; }).join("");
      var disputes = safeArray(data.disputes).slice(-10).reverse().map(function (d) { return '<li><strong>' + esc(d.title || "Pertikaian") + '</strong><small>' + esc(d.status || "Dalam pemeriksaan") + '</small><p>' + esc(d.description || "") + '</p></li>'; }).join("");
      return '<div class="salasilah-section-heading"><div><p class="salasilah-kicker">Kawalan terlindung</p><h3>Pengurusan terhad · Gabungan</h3></div><span class="salasilah-count">v1.0</span></div><p class="salasilah-management-note">Jawatan memberikan kuasa asas. Kuasa tambahan memerlukan pelantikan rasmi yang direkodkan. Paparan ini membolehkan permohonan direkodkan; kelulusan sebenar memerlukan pengesahan peranan yang sah dan tidak boleh ditentukan oleh UI sahaja.</p><div class="salasilah-role-grid">' + roles.map(function (role) { return '<article><h4>' + esc(role[0]) + '</h4><p>' + esc(role[1]) + '</p></article>'; }).join("") + '</div><section class="salasilah-detail-section"><h4>Bidang yang dilindungi</h4><div class="salasilah-chip-row"><span>Identiti dan asal-usul</span><span>Hubungan ibu bapa-anak</span><span>Kelahiran / kematian</span><span>Perkahwinan / pengangkatan</span><span>Hak pewarisan</span><span>Pelantikan jawatan</span></div><p class="salasilah-muted">Pembetulan mesti melalui bukti, semakan dan rekod sejarah. Persamaan marga atau kekuatan kultivasi tidak membuktikan keturunan.</p></section><section class="salasilah-detail-section"><h4>Cabang keluarga</h4>' + (branches ? '<ul class="salasilah-branch-list">' + branches + '</ul>' : '<p class="salasilah-muted">Belum ada cabang direkodkan.</p>') + '</section><section class="salasilah-detail-section"><h4>Pertikaian</h4>' + (disputes ? '<ul class="salasilah-event-list">' + disputes + '</ul>' : '<p class="salasilah-muted">Tiada pertikaian baharu direkodkan.</p>') + '</section>';
    }
    function render() {
      if (!active) return;
      var spouse = props.spouse || null;
      var playerAge = Number(family.player && family.player.age);
      if (!Number.isFinite(playerAge)) playerAge = Number((readSave() || {}).startingAge) || 18;
      var spouseAge = Number(spouse && spouse.age) || 0;
      var canCreateChild = !!(spouse && playerAge >= 18 && spouseAge >= 18 && props.spouseLocation === props.currentLocation && Number(props.stones) >= 20 && spouse.gender !== props.playerGender);
      var canAdopt = !!(spouse && playerAge >= 18 && spouseAge >= 18 && props.spouseLocation === props.currentLocation && Number(props.stones) >= 20);
      var selected = personById(ui.selectedId) || personById(playerId()) || data.people[0];
      var filters = '<div class="salasilah-filters"><label class="salasilah-search"><span>Carian</span><input data-field="query" value="' + esc(ui.query) + '" placeholder="Nama, marga atau cabang"></label><label><span>Status</span><select data-field="status"><option value="all"' + (ui.status === "all" ? " selected" : "") + '>Semua status</option><option value="Hidup"' + (ui.status === "Hidup" ? " selected" : "") + '>Hidup</option><option value="Hilang"' + (ui.status === "Hilang" ? " selected" : "") + '>Hilang</option><option value="Keadaan tidak diketahui"' + (ui.status === "Keadaan tidak diketahui" ? " selected" : "") + '>Keadaan tidak diketahui</option><option value="Meninggal dunia"' + (ui.status === "Meninggal dunia" ? " selected" : "") + '>Meninggal dunia</option><option value="Dalam pertikaian"' + (ui.status === "Dalam pertikaian" ? " selected" : "") + '>Dalam pertikaian</option></select></label></div>';
      var chartViews = '<div class="salasilah-view-buttons" role="group" aria-label="Paparan carta"><button type="button" data-action="view" data-view="family" class="' + (ui.view === "family" ? "active" : "") + '">Carta Keluarga</button><button type="button" data-action="view" data-view="spouse" class="' + (ui.view === "spouse" ? "active" : "") + '">Keluarga Pasangan</button><button type="button" data-action="view" data-view="combined" class="' + (ui.view === "combined" ? "active" : "") + '">Carta Gabungan</button></div>';
      var panels = '<div class="salasilah-subnav"><button type="button" data-action="panel" data-panel="chart" class="' + (ui.panel === "chart" ? "active" : "") + '">Carta & kad individu</button><button type="button" data-action="panel" data-panel="history" class="' + (ui.panel === "history" ? "active" : "") + '">Sejarah & tuntutan</button><button type="button" data-action="panel" data-panel="management" class="' + (ui.panel === "management" ? "active" : "") + '">Pengurusan</button></div>';
      var chartPanel = '<div class="salasilah-chart-toolbar"><div><p class="salasilah-kicker">Carta keturunan dinamik</p><h3>' + (ui.view === "family" ? "Keluarga watak utama" : ui.view === "spouse" ? "Keluarga pasangan" : "Gabungan dua keluarga") + '</h3><p class="salasilah-muted">Leluhur di atas · pasangan utama di tengah · keturunan di bawah. Hubungan yang belum disahkan tidak dianggap fakta muktamad.</p></div>' + filters + '</div><div class="salasilah-chart-scroll"><div class="salasilah-chart">' + renderChart() + '</div></div><div class="salasilah-legend"><span><i class="verified"></i> Rekod disahkan / sejarah permulaan</span><span><i class="pending"></i> Tuntutan menunggu pemeriksaan</span><span><i class="unknown"></i> Keadaan belum diketahui</span></div><div class="salasilah-birth-actions"><div><strong>Peristiwa keturunan</strong><p>Umur dewasa, pasangan, lokasi dan sumber permainan mesti memenuhi syarat.</p></div><button type="button" class="salasilah-button primary" data-action="birth" ' + (canCreateChild ? "" : "disabled") + '>Rekod kelahiran biologi · 20 batu roh</button><button type="button" class="salasilah-button secondary" data-action="adopt" ' + (canAdopt ? "" : "disabled") + '>Terima anak angkat · 20 batu roh</button></div><div class="salasilah-detail-panel">' + renderDetails() + '</div>';
      var panelBody = ui.panel === "chart" ? chartPanel : ui.panel === "history" ? renderHistory() : renderManagement();
      root.innerHTML = '<div class="salasilah-app"><header class="salasilah-header"><div><p class="salasilah-kicker">SALASILAH · V1.0</p><h2>Arkib keturunan dan sejarah keluarga</h2><p>Asal-usul dijana sekali; perubahan berikutnya memerlukan peristiwa yang sah.</p></div><div class="salasilah-header-stats"><span><strong>' + data.people.length + '</strong> individu</span><span><strong>' + data.relationships.length + '</strong> hubungan</span><span><strong>' + data.events.length + '</strong> peristiwa</span></div></header>' + chartViews + panels + '<div class="salasilah-panel-body">' + panelBody + '</div>' + (ui.notice ? '<p class="salasilah-notice" role="status">' + esc(ui.notice) + '</p>' : '') + '<footer class="salasilah-footer">Adat penamaan mengikut setiap keluarga. Jika kedua-dua keluarga seimbang dan tiada adat khusus, nama keluarga bapa menjadi pilihan lalai. Marga yang sama bukan bukti hubungan darah.</footer></div>';
    }
    function handleClick(event) {
      var button = event.target.closest("[data-action]");
      if (!button || !root.contains(button)) return;
      var action = button.getAttribute("data-action");
      if (action === "view") ui.view = button.getAttribute("data-view") || "family";
      else if (action === "panel") ui.panel = button.getAttribute("data-panel") || "chart";
      else if (action === "select-person") ui.selectedId = button.getAttribute("data-id") || "";
      else if (action === "proposal") {
        ui.panel = "history";
        ui.eventType = button.getAttribute("data-type") || "correction";
        ui.notice = "Lengkapkan borang tuntutan. Rekod terlindung tidak akan diubah tanpa pengesahan.";
      } else if (action === "birth" || action === "adopt") {
        if (typeof props.onCreateChild === "function") {
          props.onCreateChild(action === "birth" ? "Biologi" : "Anak Angkat");
          ui.notice = action === "birth" ? "Permintaan kelahiran dihantar kepada peraturan permainan. Rekod akan disegerakkan apabila permainan mengesahkannya." : "Permintaan pengangkatan dihantar kepada peraturan permainan. Rekod akan disegerakkan apabila permainan mengesahkannya.";
        } else ui.notice = "Tindakan ini belum disambungkan kepada pengurus permainan.";
      }
      saveUi();
      render();
    }
    function handleInput(event) {
      var field = event.target && event.target.getAttribute("data-field");
      if (field === "query") {
        var start = event.target.selectionStart;
        ui.query = event.target.value;
        saveUi();
        render();
        var next = root.querySelector('[data-field="query"]');
        if (next) { next.focus(); try { next.setSelectionRange(start, start); } catch (_) {} }
      }
    }
    function handleChange(event) {
      var field = event.target && event.target.getAttribute("data-field");
      if (field === "status") { ui.status = event.target.value; saveUi(); render(); }
    }
    function handleSubmit(event) {
      var form = event.target;
      if (!form || form.getAttribute("data-form") !== "event") return;
      event.preventDefault();
      var type = String(form.querySelector('[name="eventType"]') && form.querySelector('[name="eventType"]').value || "other");
      var title = String(form.querySelector('[name="eventTitle"]') && form.querySelector('[name="eventTitle"]').value || "").trim();
      var description = String(form.querySelector('[name="eventDescription"]') && form.querySelector('[name="eventDescription"]').value || "").trim();
      ui.branchName = String(form.querySelector('[name="branchName"]') && form.querySelector('[name="branchName"]').value || "").trim();
      if (!description && !title && type !== "branch") { setNotice("Masukkan tajuk atau butiran supaya rekod mempunyai alasan yang boleh disemak."); return; }
      var titles = { other: "Catatan sejarah", correction: "Cadangan pembetulan", dispute: "Pertikaian keluarga", inheritance: "Tuntutan pewarisan", branch: "Cadangan cabang baharu", appointment: "Cadangan pelantikan rasmi" };
      var protectedType = ["correction", "dispute", "inheritance", "branch", "appointment"].indexOf(type) >= 0;
      var eventTitle = title || titles[type] || "Peristiwa keluarga";
      var eventDescription = description || "Cadangan dihantar untuk semakan rasmi.";
      if (type === "dispute") {
        var nextDisputes = safeArray(data.disputes).concat([{ id: "dispute-" + hash(worldKey + "|" + currentDay + "|" + eventTitle + "|" + Date.now()), title: eventTitle, description: eventDescription, status: "Dalam pemeriksaan", createdDay: currentDay, personId: ui.selectedId }]);
        data = Object.assign({}, data, { disputes: nextDisputes });
      }
      addEvent(type, eventTitle, eventDescription, protectedType ? "Dalam pemeriksaan" : "Direkodkan", ui.selectedId);
      ui.branchName = "";
      ui.notice = protectedType ? "Tuntutan direkodkan untuk pemeriksaan. Tiada hak atau hubungan terlindung diubah." : "Catatan sejarah disimpan.";
      saveUi();
      render();
    }
    root.addEventListener("click", handleClick);
    root.addEventListener("input", handleInput);
    root.addEventListener("change", handleChange);
    root.addEventListener("submit", handleSubmit);
    render();
    return function () {
      active = false;
      root.removeEventListener("click", handleClick);
      root.removeEventListener("input", handleInput);
      root.removeEventListener("change", handleChange);
      root.removeEventListener("submit", handleSubmit);
      root.replaceChildren();
    };
  }

  window.__boundlessSalasilahMount = mount;
})();