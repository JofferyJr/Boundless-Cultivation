/* Boundless Cultivation v8.1.7 — Cultivation World Systems
   Adds a living Jianghu layer: scarce resources, faction pressure, reputation,
   moral choices, consequences and non-player conflicts. It is deliberately
   system-driven rather than tied to any real-world political/cultural claim.
*/
(() => {
  "use strict";

  const KEY = "boundless-cultivation-world-v817";
  const VERSION = "8.1.7";

  const clamp = (n, a, b) => Math.max(a, Math.min(b, Number(n) || 0));
  const clone = v => JSON.parse(JSON.stringify(v));
  const uid = p => p + "-" + Math.random().toString(36).slice(2, 9);

  const RESOURCE_TYPES = [
    { id:"spirit-herb", name:"Herba Roh", base:72 },
    { id:"spirit-stone", name:"Batu Roh", base:58 },
    { id:"ore", name:"Bijih Roh", base:46 },
    { id:"beast-core", name:"Teras Binatang", base:38 },
    { id:"manual", name:"Manual Langka", base:18 }
  ];

  const FACTIONS = [
    { id:"sect", name:"Sekte", influence:50 },
    { id:"clan", name:"Klan", influence:45 },
    { id:"merchant", name:"Persatuan Pedagang", influence:35 },
    { id:"jianghu", name:"Pengembara Jianghu", influence:30 },
    { id:"official", name:"Penguasa Wilayah", influence:40 }
  ];

  const MORAL_STATES = {
    80:"Righteous", 60:"Benevolent", 40:"Pragmatic", 20:"Ruthless", 0:"Dreaded"
  };

  function defaultState() {
    return {
      version: VERSION,
      year: 1,
      day: 1,
      resources: Object.fromEntries(RESOURCE_TYPES.map(x => [x.id, x.base])),
      factions: Object.fromEntries(FACTIONS.map(x => [x.id, { influence:x.influence, trust:50, pressure:0 }])),
      player: {
        reputation: 50,
        morality: 50,
        infamy: 0,
        protectedBy: [],
        enemies: [],
        allies: []
      },
      conflicts: [],
      decisions: [],
      news: [],
      lastTick: ""
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed, {
        player:Object.assign(defaultState().player, parsed.player || {}),
        resources:Object.assign(defaultState().resources, parsed.resources || {}),
        factions:Object.assign(defaultState().factions, parsed.factions || {})
      });
    } catch (_) {
      return defaultState();
    }
  }

  const state = load();

  function save() {
    state.version = VERSION;
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function addNews(text, type="world") {
    state.news.unshift({ id:uid("news"), year:state.year, day:state.day, type, text });
    state.news = state.news.slice(0, 80);
  }

  function shiftFaction(id, trust=0, pressure=0, influence=0) {
    const f = state.factions[id];
    if (!f) return;
    f.trust = clamp(f.trust + trust, 0, 100);
    f.pressure = clamp(f.pressure + pressure, 0, 100);
    f.influence = clamp(f.influence + influence, 0, 100);
  }

  function applyDecision(kind) {
    const effects = {
      spare:{ morality:6, reputation:4, infamy:-3, sect:3, clan:2 },
      negotiate:{ morality:2, reputation:7, infamy:-1, merchant:5, official:3 },
      punish:{ morality:-8, reputation:2, infamy:8, sect:2, official:1 },
      exploit:{ morality:-12, reputation:-8, infamy:12, merchant:2 },
      protect:{ morality:8, reputation:9, infamy:-5, clan:5, jianghu:4 }
    };
    const e = effects[kind] || effects.negotiate;
    state.player.morality = clamp(state.player.morality + e.morality, 0, 100);
    state.player.reputation = clamp(state.player.reputation + e.reputation, 0, 100);
    state.player.infamy = clamp(state.player.infamy + e.infamy, 0, 100);
    for (const id of ["sect","clan","merchant","jianghu","official"]) {
      if (e[id]) shiftFaction(id, e[id]);
    }
    state.decisions.push({year:state.year,day:state.day,kind});
    state.decisions = state.decisions.slice(-50);
  }

  function generateConflict() {
    const resources = RESOURCE_TYPES.filter(r => state.resources[r.id] < r.base * 0.45);
    const resource = resources[Math.floor(Math.random() * Math.max(1, resources.length))] || RESOURCE_TYPES[0];
    const groups = FACTIONS.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    const conflict = {
      id:uid("conflict"),
      year:state.year, day:state.day,
      resource:resource.name,
      resourceId:resource.id,
      groups:groups.map(x=>x.id),
      intensity:20 + Math.floor(Math.random()*61),
      status:"active",
      playerJoined:false
    };
    state.conflicts.push(conflict);
    state.conflicts = state.conflicts.slice(-30);
    addNews(groups[0].name + " dan " + groups[1].name + " berebut " + resource.name + ".", "conflict");
  }

  function tick(year, day) {
    if (year != null) state.year = Math.max(1, Number(year) || state.year);
    if (day != null) state.day = clamp(day, 1, 31);

    const stamp = state.year + "-" + state.day;
    if (state.lastTick === stamp) return;
    state.lastTick = stamp;

    for (const r of RESOURCE_TYPES) {
      const drift = Math.floor(Math.random()*11) - 5;
      state.resources[r.id] = clamp(state.resources[r.id] + drift, 0, 100);
    }

    for (const f of FACTIONS) {
      const x = state.factions[f.id];
      x.pressure = clamp(x.pressure + (Math.random() < .25 ? 3 : -1), 0, 100);
      if (x.pressure > 75) x.trust = clamp(x.trust - 2, 0, 100);
    }

    const active = state.conflicts.filter(x=>x.status==="active");
    if (active.length < 4 && Math.random() < .28) generateConflict();

    for (const c of active) {
      c.intensity = clamp(c.intensity + Math.floor(Math.random()*13)-5, 0, 100);
      if (c.intensity >= 95 || Math.random() < .08) {
        c.status = "resolved";
        addNews("Konflik " + c.resource + " selesai selepas beberapa pihak berundur atau mencapai persetujuan.", "conflict");
      }
    }

    save();
    render();
  }

  function moralLabel() {
    const m = state.player.morality;
    if (m >= 80) return MORAL_STATES[80];
    if (m >= 60) return MORAL_STATES[60];
    if (m >= 40) return MORAL_STATES[40];
    if (m >= 20) return MORAL_STATES[20];
    return MORAL_STATES[0];
  }

  function render() {
    const root = document.getElementById("boundless-cultivation-world-panel");
    if (!root) return;
    const active = state.conflicts.filter(x=>x.status==="active").slice(-5).reverse();
    const factionRows = FACTIONS.map(f => {
      const x=state.factions[f.id];
      return '<div class="bcw-row"><span>'+f.name+'</span><b>'+Math.round(x.trust)+'</b><i>tekanan '+Math.round(x.pressure)+'</i></div>';
    }).join("");
    const conflictRows = active.length ? active.map(c =>
      '<div class="bcw-conflict"><b>'+c.resource+'</b><span>'+c.groups.map(id=>FACTIONS.find(f=>f.id===id)?.name||id).join(" × ")+'</span><small>Intensiti '+Math.round(c.intensity)+'</small><button data-bcw-join="'+c.id+'">'+(c.playerJoined?"Disertai":"Campur tangan")+'</button></div>'
    ).join("") : '<small>Tiada konflik aktif.</small>';

    root.innerHTML =
      '<div class="bcw-head"><div><b>⚔ Dunia Kultivasi</b><small>v'+VERSION+' · Sistem dunia hidup</small></div><button data-bcw-close>×</button></div>'+
      '<div class="bcw-stats">'+
        '<div><small>Reputasi</small><strong>'+Math.round(state.player.reputation)+'</strong></div>'+
        '<div><small>Morality</small><strong>'+moralLabel()+'</strong></div>'+
        '<div><small>Infamy</small><strong>'+Math.round(state.player.infamy)+'</strong></div>'+
      '</div>'+
      '<section><h4>Sumber Terhad</h4><div class="bcw-res">'+RESOURCE_TYPES.map(r=>'<span>'+r.name+' <b>'+Math.round(state.resources[r.id])+'%</b></span>').join("")+'</div></section>'+
      '<section><h4>Hubungan Kuasa</h4>'+factionRows+'</section>'+
      '<section><h4>Konflik Jianghu</h4>'+conflictRows+'</section>'+
      '<section><h4>Berita Dunia</h4><div class="bcw-news">'+state.news.slice(0,5).map(n=>'<div>Hari '+n.day+' — '+n.text+'</div>').join("")+'</div></section>';

    root.querySelector("[data-bcw-close]")?.addEventListener("click",()=>root.remove());
    root.querySelectorAll("[data-bcw-join]").forEach(btn=>btn.addEventListener("click",()=>{
      const c=state.conflicts.find(x=>x.id===btn.dataset.bcwJoin);
      if(!c) return;
      c.playerJoined=true;
      c.intensity=clamp(c.intensity-12,0,100);
      state.player.reputation=clamp(state.player.reputation+3,0,100);
      addNews("Pemain campur tangan dalam konflik "+c.resource+".","player");
      save(); render();
    }));
  }

  function injectStyle() {
    if (document.getElementById("boundless-cultivation-world-style")) return;
    const style=document.createElement("style");
    style.id="boundless-cultivation-world-style";
    style.textContent=
      '#boundless-cultivation-world-panel{position:fixed;inset:auto 18px 18px auto;width:min(470px,calc(100vw - 36px));max-height:78vh;overflow:auto;z-index:100000;background:#09120f;color:#f4ead1;border:1px solid #806936;border-radius:16px;box-shadow:0 18px 55px rgba(0,0,0,.5);font:13px/1.45 system-ui,sans-serif}'+
      '#boundless-cultivation-world-panel .bcw-head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #29443a}'+
      '#boundless-cultivation-world-panel .bcw-head small{display:block;color:#9fb4a8;margin-top:2px}'+
      '#boundless-cultivation-world-panel .bcw-head button{background:none;border:0;color:#e5c77d;font-size:24px;cursor:pointer}'+
      '#boundless-cultivation-world-panel .bcw-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 16px}'+
      '#boundless-cultivation-world-panel .bcw-stats div{border:1px solid #29443a;border-radius:10px;padding:9px;background:#0c1914}'+
      '#boundless-cultivation-world-panel small{color:#9fb4a8}'+
      '#boundless-cultivation-world-panel strong{display:block;color:#e5c77d;font-size:15px}'+
      '#boundless-cultivation-world-panel section{padding:10px 16px;border-top:1px solid #29443a}'+
      '#boundless-cultivation-world-panel h4{margin:0 0 8px;font-family:serif;color:#dfc477}'+
      '#boundless-cultivation-world-panel .bcw-res{display:grid;grid-template-columns:1fr 1fr;gap:6px}'+
      '#boundless-cultivation-world-panel .bcw-res span,#boundless-cultivation-world-panel .bcw-row{display:flex;justify-content:space-between;gap:8px;padding:7px 8px;background:#0c1914;border-radius:7px}'+
      '#boundless-cultivation-world-panel .bcw-row i{color:#9fb4a8;font-style:normal;font-size:11px}'+
      '#boundless-cultivation-world-panel .bcw-conflict{border:1px solid #355347;border-radius:9px;padding:9px;margin:6px 0}'+
      '#boundless-cultivation-world-panel .bcw-conflict span,#boundless-cultivation-world-panel .bcw-conflict small{display:block;color:#9fb4a8}'+
      '#boundless-cultivation-world-panel .bcw-conflict button{margin-top:7px;border:1px solid #806936;border-radius:7px;padding:5px 8px;background:#151d16;color:#e5c77d;cursor:pointer}'+
      '#boundless-cultivation-world-panel .bcw-news div{padding:5px 0;border-bottom:1px solid rgba(53,83,71,.45);font-size:11px}';
    document.head.appendChild(style);
  }

  function open() {
    injectStyle();
    injectAIStyle();
    hookAISettings();
    let root=document.getElementById("boundless-cultivation-world-panel");
    if (!root) {
      root=document.createElement("aside");
      root.id="boundless-cultivation-world-panel";
      document.body.appendChild(root);
    }
    render();
  }

  window.BoundlessCultivationWorld = {
    version:VERSION,
    state,
    open,
    tick,
    save,
    reset:()=>{ Object.assign(state,defaultState()); save(); render(); },
    applyDecision,
    generateConflict,
    getState:()=>clone(state)
  };

  function createLauncher() {
    if (!document.body || document.getElementById("boundless-cultivation-world-launcher")) return;
    const button=document.createElement("button");
    button.id="boundless-cultivation-world-launcher";
    button.type="button";
    button.textContent="⚔ Dunia Kultivasi";
    button.title="Buka sistem dunia kultivasi";
    button.addEventListener("click",open);
    Object.assign(button.style,{
      position:"fixed", right:"18px", bottom:"18px", zIndex:"99998",
      border:"1px solid #806936", borderRadius:"10px", padding:"9px 12px",
      background:"#111b16", color:"#e5c77d", cursor:"pointer",
      boxShadow:"0 8px 24px rgba(0,0,0,.3)", font:"600 12px system-ui,sans-serif"
    });
    document.body.appendChild(button);
  }

  const AI_KEY="boundless-entity-ai-v818", AI_TYPES=[["player","Pemain","Strategi"],["npc","NPC","Keperibadian"],["companion","Pasangan / Pengikut","Kesetiaan"],["sect","Sekte","Politik dan sumber"],["clan","Klan / Keluarga","Warisan dan hubungan"],["beast","Binatang Roh","Wilayah dan ancaman"],["merchant","Pedagang","Harga dan stok"],["faction","Puak","Diplomasi dan konflik"],["world","Dunia","Event dan perubahan"]];
  const aiState=(()=>{try{return JSON.parse(localStorage.getItem(AI_KEY))||{}}catch(_){return {}}})();
  const ensureAI=(type,id,name)=>aiState[id]||(aiState[id]={id,type,name:name||type,enabled:true,autonomy:70,decisions:0,lastDecision:"Menunggu keputusan"});
  let lastAIEntityScan=0;\n  function registerAIs(force=false){ensureAI("player","player","Pemain");AI_TYPES.slice(3).forEach(x=>ensureAI(x[0],"ai-"+x[0],x[1]));const now=Date.now();if(!force&&now-lastAIEntityScan<10000)return;lastAIEntityScan=now;document.querySelectorAll("[data-npc-id],[data-character-id],[data-beast-id],[data-faction-id]").forEach(e=>{const id=e.dataset.npcId||e.dataset.characterId||e.dataset.beastId||e.dataset.factionId;const type=e.dataset.beastId?"beast":e.dataset.factionId?"faction":"npc";ensureAI(type,id,e.dataset.name||e.textContent?.trim().slice(0,40))});localStorage.setItem(AI_KEY,JSON.stringify(aiState))}
  function runAIs(){registerAIs();Object.values(aiState).forEach(a=>{if(a.enabled&&Math.random()<a.autonomy/100*.35){a.decisions++;a.lastDecision=a.autonomy>70?"Menjalankan objektif sendiri":"Menunggu keadaan"}});localStorage.setItem(AI_KEY,JSON.stringify(aiState))}
  function renderAIWorldSection(){const active=state.conflicts.filter(x=>x.status==="active");const npcCount=Object.values(aiState).filter(a=>a.type==="npc"&&a.enabled).length;const news=state.news.slice(0,7).map(n=>'<div>Hari '+n.day+' — '+n.text+'</div>').join("")||'<div>Belum ada berita AI.</div>';return '<section class="bai-world"><div class="bai-world-title"><div><b>🧠 Dunia AI Boundless</b><small>v'+VERSION+' · Dunia berjalan secara autonomi</small></div></div><div class="bai-world-meta"><span><b>Tahun '+state.year+'</b> · Hari '+state.day+'/31</span><span>Jianghu · Hutan Moyan</span><small>Markas utama · Event boleh berlaku di wilayah rawak</small></div><div class="bai-world-status">'+(active.length?'Event AI sedang berjalan: '+active.length:'Tiada event Jianghu aktif.')+'</div><h4>Berita AI</h4><div class="bai-news">'+news+'</div><div class="bai-world-footer"><b>'+npcCount+' NPC AI aktif</b><span> · '+active.length+' event berjalan</span></div></section>';}
  let aiPanelOpen=false;
  function closeAIControl(){
    const r=document.getElementById("boundless-ai-control-center");
    aiPanelOpen=false;
    if(r) r.remove();
    document.removeEventListener("keydown",aiEscapeHandler,true);
  }
  function aiEscapeHandler(e){
    if(e.key==="Escape" && aiPanelOpen){
      e.preventDefault();
      e.stopPropagation();
      closeAIControl();
    }
  }
  function getSettingsSurface(){
    const tabs=[...document.querySelectorAll(".bc-settings-tabs")].find(t=>{
      const s=getComputedStyle(t);
      return s.display!=="none" && s.visibility!=="hidden";
    }) || document.querySelector(".bc-settings-tabs");
    if(!tabs) return null;
    const root=tabs.parentElement;
    return {dialog:tabs.closest("[role=dialog],[data-slot=sheet-content],[data-slot=dialog-content]")||root,tabs,root};
  }

  function closeCustomSettingsPages(){
    document.getElementById("boundless-ai-control-center")?.remove();
    document.getElementById("bc-save-manager-inline")?.remove();
    const surface=getSettingsSurface();
    if(!surface) return;
    surface.root.removeAttribute("data-boundless-custom-open");
    surface.root.querySelectorAll("[data-boundless-custom-tab]").forEach(b=>{
      b.setAttribute("aria-selected","false");
      b.dataset.state="inactive";
    });
  }

  function showExclusiveSettingsPage(panel){
    const surface=getSettingsSurface();
    if(!surface) return null;
    surface.root.setAttribute("data-boundless-custom-open","1");
    surface.root.querySelectorAll("[data-boundless-custom-panel]").forEach(p=>p.remove());
    surface.root.appendChild(panel);
    return surface;
  }

  function openAIControl(){
    registerAIs();
    const surface=getSettingsSurface();
    if(!surface) return;
    const old=document.getElementById("boundless-ai-control-center");
    if(old){ closeAIControl(); return; }
    document.getElementById("bc-save-manager-inline")?.remove();
    aiPanelOpen=true;
    const r=document.createElement("section");
    r.id="boundless-ai-control-center";
    r.dataset.boundlessCustomPanel="1";
    r.setAttribute("aria-label","AI Control Center");
    r.tabIndex=-1;
    r.innerHTML='<div class="bai-inline"><div class="bai-head"><b>🧠 AI Control Center</b></div><p class="bai-note">Setiap kategori entiti mempunyai AI tersendiri.</p>'+renderAIWorldSection()+'<div class="bai-grid">'+Object.values(aiState).map(a=>'<div class="bai-card"><b>'+a.name+'</b><small>'+((AI_TYPES.find(x=>x[0]===a.type)||[])[1]||a.type)+'</small><small>Keputusan: '+a.decisions+'</small><label><input type="checkbox" data-en="'+a.id+'" '+(a.enabled?"checked":"")+'> AI aktif</label><label>Autonomi '+a.autonomy+'%<input type="range" min="0" max="100" value="'+a.autonomy+'" data-au="'+a.id+'"></label></div>').join("")+'</div></div>';
    showExclusiveSettingsPage(r);
    r.querySelectorAll("[data-en]").forEach(x=>x.onchange=()=>{
      aiState[x.dataset.en].enabled=x.checked;
      localStorage.setItem(AI_KEY,JSON.stringify(aiState));
      openAIControl();
    });
    r.querySelectorAll("[data-au]").forEach(x=>x.oninput=()=>{
      aiState[x.dataset.au].autonomy=+x.value;
      localStorage.setItem(AI_KEY,JSON.stringify(aiState));
      x.parentNode.childNodes[0].textContent="Autonomi "+x.value+"%";
    });
    requestAnimationFrame(()=>r.focus());
  }

  let aiSettingsHooked=false;\n  function hookAISettings(){\n    if(aiSettingsHooked)return;\n    aiSettingsHooked=true;
    const inject=()=>{
      const surface=getSettingsSurface();
      if(!surface) return;
      const list=surface.tabs;
      if(!list.querySelector("[data-ai-open]")){
        const target=list.querySelector('[role="tab"]');
        if(target){
          const b=document.createElement("button");
          b.type="button"; b.role="tab"; b.dataset.aiOpen="1"; b.dataset.boundlessCustomTab="ai";
          b.textContent="🧠 AI Control Center"; b.setAttribute("aria-selected","false"); b.dataset.state="inactive";
          b.className=target.className||"dao-tab justify-center";
          b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openAIControl();});
          list.appendChild(b);
      }
      if(!list.querySelector("[data-boundless-empty-slot]")){
        const target=list.querySelector('[role="tab"]');
        for(let i=0;i<2;i++){
          const empty=document.createElement("button");
          empty.type="button"; empty.dataset.boundlessEmptySlot="1";
          empty.setAttribute("aria-label","Slot kosong"); empty.disabled=true;
          empty.className=target?.className||"dao-tab justify-center";
          list.appendChild(empty);
        }
        }
      }
      // Force the complete eight-slot layout: four columns × two rows.
      // Order is always: 4 native tabs, Save, AI, then 2 reserved slots.
      const nativeTabs=[...list.querySelectorAll('[role="tab"]:not([data-boundless-custom-tab])')].slice(0,4);
      const saveTab=list.querySelector('[data-save-open]');
      const aiTab=list.querySelector('[data-ai-open]');
      let emptyTabs=[...list.querySelectorAll('[data-boundless-empty-slot]')].slice(0,2);
      while(emptyTabs.length<2){
        const empty=document.createElement("button");
        empty.type="button";
        empty.disabled=true;
        empty.dataset.boundlessEmptySlot="1";
        empty.setAttribute("aria-label","Slot kosong");
        empty.textContent="Slot akan datang";
        empty.className=nativeTabs[0]?.className||"dao-tab justify-center";
        list.appendChild(empty);
        emptyTabs.push(empty);
      }
      const ordered=[...nativeTabs];
      if(saveTab) ordered.push(saveTab);
      if(aiTab) ordered.push(aiTab);
      ordered.push(...emptyTabs);
      ordered.forEach((item,index)=>{
        item.dataset.boundlessSettingsSlot=String(index+1);
        list.appendChild(item);
      });
      list.style.display="grid";
      list.style.gridTemplateColumns="repeat(4,minmax(0,1fr))";
      list.style.gridAutoFlow="row";
      list.style.gap="12px";
      list.querySelectorAll('[role="tab"]:not([data-boundless-custom-tab])').forEach(b=>{
        if(b.dataset.boundlessNativeHook)return;
        b.dataset.boundlessNativeHook="1";
        b.addEventListener("click",()=>{ closeCustomSettingsPages(); surface.root.removeAttribute("data-boundless-custom-open"); });
      });
    };
    inject();
    let tries=0;
    const timer=setInterval(()=>{ inject(); if(++tries>=120) clearInterval(timer); },250);
    new MutationObserver(inject).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["data-state","aria-expanded"]});
  }
  function injectAIStyle(){
    if(document.getElementById("bai-style"))return;
    const s=document.createElement("style");
    s.id="bai-style";
    s.textContent=
      '#boundless-ai-control-center .bai-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.55);pointer-events:auto}'+
      '#boundless-ai-control-center{width:100%;display:block;margin:12px 0 0;position:relative;z-index:auto}'+
      '#boundless-ai-control-center .bai-inline{position:relative;display:block;width:100%;max-height:none;overflow:visible;box-sizing:border-box;background:transparent;color:#f4ead1;border:0;border-top:1px solid #29443a;padding:16px 0;font:13px/1.45 system-ui,sans-serif}'+
      '#boundless-ai-control-center .bai-head{display:flex;justify-content:space-between;align-items:center;font-size:18px;padding:0 0 10px}'+
      '#boundless-ai-control-center .bai-head button{appearance:none!important;-webkit-appearance:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;background:#111b16!important;border:1px solid #806936!important;border-radius:8px!important;color:#e5c77d!important;font-size:24px!important;line-height:1!important;width:42px!important;height:38px!important;padding:0!important;margin:0!important;pointer-events:auto!important;position:relative!important;z-index:10!important;cursor:pointer!important;touch-action:manipulation!important}'+
      '#boundless-ai-control-center .bai-head button:hover{background:#20271c!important;color:#f3dda0!important}'+
      '.bc-settings-tabs{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-auto-flow:row!important;gap:12px!important;width:100%!important;box-sizing:border-box!important}.bc-settings-tabs>[role="tab"]{min-height:96px!important;width:100%!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;padding:18px!important;border:1px solid #806936!important;border-radius:12px!important;background:#111b16!important;color:#e5c77d!important;font:600 15px/1.25 system-ui,sans-serif!important}.bc-settings-tabs>[role="tab"]:hover{background:#20271c!important;color:#f3dda0!important}.bc-settings-tabs>[role="tab"][data-state="active"],.bc-settings-tabs>[role="tab"][aria-selected="true"]{border-color:#b29452!important;background:#20271c!important}.bc-settings-tabs>[data-boundless-empty-slot]{min-height:96px!important;opacity:.55!important;cursor:default!important;pointer-events:none!important;background:transparent!important;border:1px dashed #806936!important}.bc-settings-tabs[data-boundless-custom-open="1"]~[role="tabpanel"],[data-boundless-custom-open="1"] [role="tabpanel"]{display:none!important}.bai-note{color:#9fb4a8}.bai-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}.bai-card{padding:12px;border:1px solid #29443a;border-radius:10px;background:#0c1914}.bai-card small{display:block;color:#9fb4a8;margin:4px 0}.bai-card label{display:block;margin-top:8px}.bai-card input[type=range]{width:100%}.bai-settings-slot{display:flex!important;width:100%!important;min-height:96px!important;box-sizing:border-box!important;align-items:center!important;justify-content:center!important;text-align:center!important;padding:18px!important;border:1px solid #806936!important;border-radius:12px!important;background:#111b16!important;color:#e5c77d!important;font:600 15px/1.25 system-ui,sans-serif!important;cursor:pointer!important}.bai-settings-slot:hover{background:#20271c;color:#f3dda0}';
    document.head.appendChild(s);
  }

  function boot() {
    injectStyle();
    injectAIStyle();
    hookAISettings();
    registerAIs();
    const existing=window.BoundlessAI;
    if (existing) {
      const originalSetDate=existing.setDate;
      existing.setDate=(year,day)=>{
        originalSetDate(year,day);
        tick(year,day);
      };
    }
    window.addEventListener("boundless-ai-ready",e=>{
      if (e.detail?.setDate) {
        const original=e.detail.setDate;
        e.detail.setDate=(year,day)=>{ original(year,day); tick(year,day); };
      }
    });
    setTimeout(()=>{tick(state.year,state.day);registerAIs(true);runAIs()},250);
    setInterval(()=>{runAIs();},30000);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();