/* Boundless v8.1.6 draft — Universal NPC AI + Jianghu world simulation
 * Static/GitHub Pages compatible. No server required.
 */
(() => {
  "use strict";
  if (window.__BOUNDLESS_AI_ENGINE__) return;

  const VERSION = "8.1.6-ai-draft";
  const STORAGE = "boundless-ai-world-v1";
  const DAY_MIN = 1, DAY_MAX = 31;
  const REGIONS = [
    "Qinghe", "Xuanbei", "Jinsha", "Luoshui", "Chiyan", "Xuanyun",
    "Tianjian", "Yongbing", "Moyan", "Lingnan", "Beiyuan", "Canglan"
  ];
  const TYPES = [
    { id:"wulin", name:"Wulin", goals:["investigate","protect","return"] },
    { id:"lulin", name:"Lulin", goals:["trade","hide","escape"] },
    { id:"wanderer", name:"Pengembara Jianghu", goals:["travel","seek","rest"] },
    { id:"merchant", name:"Pedagang", goals:["trade","travel","rest"] },
    { id:"villager", name:"Orang Awam", goals:["work","travel","rest"] },
    { id:"cultivator", name:"Cultivator", goals:["cultivate","travel","seek"] },
    { id:"official", name:"Pegawai", goals:["patrol","investigate","return"] }
  ];
  const EVENT_TYPES = [
    {id:"wulin_dispute", title:"Pertikaian Wulin", actor:["wulin","lulin"]},
    {id:"escort", title:"Pengiring Perdagangan", actor:["wulin","merchant"]},
    {id:"missing_manual", title:"Jejak Manual Jianghu", actor:["wanderer","wulin"]},
    {id:"lulin_trade", title:"Pertemuan Rahsia Lulin", actor:["lulin","merchant"]},
    {id:"martial_meeting", title:"Pertemuan Pendekar", actor:["wulin","wanderer"]},
    {id:"road_conflict", title:"Gangguan Laluan", actor:["official","lulin","merchant"]}
  ];

  const clone = v => JSON.parse(JSON.stringify(v));
  const hash = s => {
    let h = 2166136261 >>> 0;
    for (let i=0;i<s.length;i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  function rng(seed) {
    let x = seed >>> 0;
    return () => {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      return (x >>> 0) / 4294967296;
    };
  }
  const pick = (r, a) => a[Math.floor(r()*a.length)];
  const id = (prefix, n) => prefix + "-" + String(n).padStart(4,"0");

  function makeNpc(r, n) {
    const type = pick(r, TYPES);
    const home = type.id === "wulin" || type.id === "wanderer" || type.id === "lulin"
      ? "Hutan Moyan" : pick(r, REGIONS);
    return {
      id:id("npc",n), name: "NPC Jianghu " + n,
      type:type.id, faction:type.name, home, region:home,
      x:Math.floor(r()*9), y:Math.floor(r()*9),
      age:16 + Math.floor(r()*55),
      cultivation:1 + Math.floor(r()*10),
      mood:Math.floor(r()*101),
      goal:pick(r,type.goals), alive:true,
      memory:[], relations:{}, lastAction:"idle",
      ai:{state:"idle", targetRegion:home, targetNpc:null, path:[], ticks:0}
    };
  }

  function makeEvent(r, day, index) {
    const e = pick(r, EVENT_TYPES);
    const region = pick(r, REGIONS);
    return {
      id:"jianghu-"+day+"-"+index+"-"+Math.floor(r()*9999),
      day, title:e.title, region,
      status:"active", progress:0, maxProgress:3+Math.floor(r()*5),
      actors:e.actor, actorIds:[], log:[],
      startedAt:Date.now(), playerJoined:false
    };
  }

  class BoundlessAI {
    constructor() {
      this.version = VERSION;
      this.seed = "CELESTIAL-71";
      this.year = 1; this.day = 1;
      this.npcs = [];
      this.events = [];
      this.news = [];
      this.lastProcessedDay = null;
      this.ui = null;
      this.load();
      this.ensurePopulation();
      this.renderUI();
      this.expose();
      this.syncFromGameSave();
      this.processDay(this.day);
    }

    load() {
      try {
        const raw = localStorage.getItem(STORAGE);
        if (raw) Object.assign(this, JSON.parse(raw));
      } catch {}
      this.npcs = Array.isArray(this.npcs) ? this.npcs : [];
      this.events = Array.isArray(this.events) ? this.events : [];
      this.news = Array.isArray(this.news) ? this.news : [];
    }

    save() {
      try { localStorage.setItem(STORAGE, JSON.stringify({
        version:this.version, seed:this.seed, year:this.year, day:this.day,
        npcs:this.npcs, events:this.events.slice(-60), news:this.news.slice(-100)
      })); } catch {}
    }

    ensurePopulation() {
      const target = 72;
      if (this.npcs.length >= target) return;
      const r = rng(hash(this.seed + ":" + this.year + ":population"));
      for (let i=this.npcs.length+1;i<=target;i++) this.npcs.push(makeNpc(r,i));
      this.save();
    }

    syncFromGameSave() {
      const candidates = [];
      const keys = ["jalan-dao-save"];
      for (const k of keys) {
        try { const v=JSON.parse(localStorage.getItem(k)||"null"); if(v) candidates.push(v); } catch {}
      }
      for (let i=1;i<=5;i++) {
        try {
          const v=JSON.parse(localStorage.getItem("boundless-cultivation-save-slot-"+i)||"null");
          if (v?.save) candidates.push(v.save); else if(v) candidates.push(v);
        } catch {}
      }
      const s = candidates.find(v => Number.isFinite(Number(v.day))) || candidates[0];
      if (s) {
        if (s.gameVersion) this.gameVersion=s.gameVersion;
        if (s.seed) this.seed=String(s.seed);
        const d=Math.max(1,Math.min(31,Number(s.day)||1));
        const y=Math.max(1,Number(s.year||s.gameYear||1));
        this.setDate(y,d);
        if (Array.isArray(s.npcs)) this.ingestNpcs(s.npcs);
      }
    }

    ingestNpcs(list) {
      for (const raw of list) {
        if (!raw || !raw.id) continue;
        const found=this.npcs.find(n=>String(n.id)===String(raw.id));
        if (found) Object.assign(found, raw, {ai:found.ai||{state:"idle",ticks:0}});
        else this.npcs.push({
          id:String(raw.id), name:String(raw.name||"NPC"),
          type:String(raw.type||raw.faction||"villager"),
          faction:String(raw.faction||"Penduduk"), home:String(raw.home||raw.location||"Qinghe"),
          region:String(raw.region||raw.location||"Qinghe"), x:Number(raw.x||0), y:Number(raw.y||0),
          age:Number(raw.age||20), cultivation:Number(raw.cultivation||1),
          mood:Number(raw.mood||50), goal:"live", memory:[], relations:raw.relations||{},
          lastAction:"synced", alive:raw.alive!==false, ai:{state:"idle",ticks:0}
        });
      }
      this.save();
    }

    setDate(year, day) {
      year=Math.max(1,Number(year)||1);
      day=Math.max(DAY_MIN,Math.min(DAY_MAX,Number(day)||1));
      const changed = year!==this.year || day!==this.day;
      this.year=year; this.day=day;
      if (changed) this.processDay(day);
      else this.renderUI();
    }

    processDay(day) {
      const key=this.year+"-"+day;
      if (this.lastProcessedDay===key) return;
      this.lastProcessedDay=key;
      const r=rng(hash(this.seed+":"+key+":events"));
      this.ensurePopulation();
      this.tickNPCs(r, 2 + Math.floor(r()*3));
      // Random Jianghu event: checked only on in-game days 1–31.
      // The event exists independently of the player's current region.
      const chance = day===1 ? 0.72 : 0.16;
      if (r() < chance) {
        const count = day===1 ? 1 + (r()<0.28?1:0) : 1;
        for(let i=0;i<count;i++) {
          const ev=makeEvent(r,day,i);
          this.startEvent(ev,r);
        }
      }
      this.advanceEvents(r);
      this.save();
      this.renderUI();
    }

    tickNPCs(r, steps=1) {
      for (const n of this.npcs) {
        if (!n.alive) continue;
        for(let i=0;i<steps;i++) this.stepNpc(n,r);
      }
    }

    stepNpc(n,r) {
      n.ai=n.ai||{state:"idle",ticks:0};
      n.ai.ticks=(n.ai.ticks||0)+1;
      const active=this.events.find(e=>e.status==="active" && e.actorIds.includes(n.id));
      if(active) {
        n.ai.state="event";
        n.ai.targetRegion=active.region;
      } else if(n.region==="Hutan Moyan" && r()<0.22) {
        n.ai.state="depart";
        n.ai.targetRegion=pick(r,REGIONS);
      } else if(r()<0.10) {
        n.ai.state="return";
        n.ai.targetRegion=n.home;
      } else {
        n.ai.state="routine";
      }
      if (n.region!==n.ai.targetRegion && r()<0.62) {
        n.region=n.ai.targetRegion;
        n.lastAction="bergerak ke "+n.region;
      } else {
        const actions=["bekerja","berlatih","berdagang","berehat","mencari maklumat","berinteraksi"];
        n.lastAction=pick(r,actions);
      }
      n.mood=Math.max(0,Math.min(100,n.mood+(r()<0.5?-1:1)));
    }

    startEvent(ev,r) {
      const candidates=this.npcs.filter(n=>n.alive && ev.actors.includes(n.type));
      const shuffled=candidates.slice().sort(()=>r()-0.5);
      const selected=shuffled.slice(0,2+Math.floor(r()*3));
      ev.actorIds=selected.map(n=>n.id);
      for(const n of selected) {
        n.ai.targetRegion=ev.region; n.ai.state="event";
        n.lastAction="menuju event Jianghu";
        n.memory.push({day:this.day,text:"Terlibat dalam "+ev.title});
        n.memory=n.memory.slice(-12);
      }
      ev.log.push("NPC bergerak sendiri menuju "+ev.region+".");
      this.events.push(ev);
      this.news.unshift({
        day:this.day, year:this.year, type:"jianghu",
        text:ev.title+" tercetus di "+ev.region+". NPC AI meneruskan event walaupun pemain tiada di sana."
      });
      this.news=this.news.slice(0,100);
    }

    advanceEvents(r) {
      for(const ev of this.events.filter(e=>e.status==="active")) {
        ev.progress++;
        if(r()<0.72) ev.log.push("AI NPC melaksanakan tindakan di "+ev.region+".");
        if(ev.progress>=ev.maxProgress) {
          ev.status="completed";
          const outcome=pick(r,["berakhir aman","berakhir dengan perubahan reputasi","membuka berita baharu","menyebabkan beberapa NPC berpindah"]);
          ev.outcome=outcome;
          ev.log.push("Event selesai: "+outcome+".");
          for(const id of ev.actorIds) {
            const n=this.npcs.find(x=>x.id===id);
            if(n) { n.ai.state="return"; n.ai.targetRegion=n.home; n.lastAction="event selesai"; }
          }
          this.news.unshift({day:this.day,year:this.year,type:"jianghu",text:ev.title+" di "+ev.region+" "+outcome+"."});
        }
      }
      this.events=this.events.slice(-60);
    }

    joinEvent(eventId) {
      const ev=this.events.find(e=>e.id===eventId && e.status==="active");
      if(!ev) return false;
      ev.playerJoined=true;
      ev.log.push("Pemain menyertai event.");
      this.news.unshift({day:this.day,year:this.year,type:"player",text:"Pemain menyertai "+ev.title+" di "+ev.region+"."});
      this.save(); this.renderUI(); return true;
    }

    getEvents() { return clone(this.events); }
    getNPCs() { return clone(this.npcs); }
    getNews() { return clone(this.news); }

    renderUI() {
      if (!this.ui || !document.body.contains(this.ui)) this.createUI();
      if (!this.ui) return;
      const active=this.events.filter(e=>e.status==="active").slice(-8).reverse();
      const recent=this.news.slice(0,6);
      this.ui.innerHTML =
        '<div class="bai-head"><b>🧠 Dunia AI Boundless</b><span>v8.1.6 draft</span></div>'+
        '<div class="bai-date">Tahun '+this.year+' · Hari '+this.day+'/31</div>'+
        '<div class="bai-section"><strong>Jianghu · Hutan Moyan</strong><small>Markas utama · Event boleh berlaku di wilayah rawak</small></div>'+
        '<div class="bai-events">'+(active.length?active.map(e=>
          '<button data-join="'+e.id+'" class="bai-event"><b>'+e.title+'</b><span>'+e.region+' · '+e.progress+'/'+e.maxProgress+'</span><em>'+ (e.playerJoined?"Disertai":"AI sedang bergerak") +'</em></button>'
        ).join(""):'<small>Tiada event Jianghu aktif.</small>')+'</div>'+
        '<div class="bai-section"><strong>Berita AI</strong></div>'+
        '<div class="bai-news">'+(recent.length?recent.map(n=>'<div>Hari '+n.day+' — '+n.text+'</div>').join(""):'<div>Belum ada berita.</div>')+'</div>'+
        '<div class="bai-footer">'+this.npcs.filter(n=>n.alive).length+' NPC AI aktif · '+active.length+' event berjalan</div>';
      this.ui.querySelectorAll("[data-join]").forEach(b=>b.onclick=()=>this.joinEvent(b.dataset.join));
    }

    createUI() {
      if(!document.body) return;
      const style=document.createElement("style");
      style.textContent=`
      #boundless-ai-panel{position:fixed;right:14px;bottom:14px;width:min(360px,calc(100vw - 28px));max-height:58vh;overflow:auto;z-index:99999;background:rgba(7,16,13,.96);border:1px solid #69582f;border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.35);color:#f4ead1;font:13px/1.45 system-ui,sans-serif}
      #boundless-ai-panel .bai-head{display:flex;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid #29443a}
      #boundless-ai-panel .bai-head span,#boundless-ai-panel small{color:#9fb4a8;font-size:11px}
      #boundless-ai-panel .bai-date,.bai-section{padding:8px 14px}
      #boundless-ai-panel .bai-section{border-top:1px solid #29443a;margin-top:3px}
      #boundless-ai-panel .bai-section small{display:block}
      #boundless-ai-panel .bai-events,#boundless-ai-panel .bai-news{padding:0 10px 10px}
      #boundless-ai-panel .bai-event{display:block;width:100%;text-align:left;margin:6px 0;padding:9px;border:1px solid #355347;border-radius:9px;background:#0c1914;color:#f4ead1;cursor:pointer}
      #boundless-ai-panel .bai-event:hover{border-color:#a98945}
      #boundless-ai-panel .bai-event span,#boundless-ai-panel .bai-event em{display:block;font-size:11px;color:#9fb4a8;font-style:normal}
      #boundless-ai-panel .bai-news div{padding:5px 0;border-bottom:1px solid rgba(53,83,71,.45);font-size:11px}
      #boundless-ai-panel .bai-footer{padding:9px 14px;border-top:1px solid #29443a;color:#9fb4a8;font-size:10px}
      `;
      document.head.appendChild(style);
      this.ui=document.createElement("aside");
      this.ui.id="boundless-ai-panel";
      document.body.appendChild(this.ui);
    }

    expose() {
      window.BoundlessAI = {
        version:this.version,
        engine:this,
        registerNPC:npc=>this.ingestNpcs([npc]),
        registerNPCs:list=>this.ingestNpcs(list),
        setDate:(year,day)=>this.setDate(year,day),
        tick:(steps=1)=>{const r=rng(hash(this.seed+Date.now()));this.tickNPCs(r,Math.max(1,steps));this.advanceEvents(r);this.save();this.renderUI();},
        getNPCs:()=>this.getNPCs(),
        getEvents:()=>this.getEvents(),
        getNews:()=>this.getNews(),
        joinEvent:id=>this.joinEvent(id)
      };
      window.dispatchEvent(new CustomEvent("boundless-ai-ready",{detail:window.BoundlessAI}));
    }
  }

  function boot() {
    try {
      window.__BOUNDLESS_AI_ENGINE__=new BoundlessAI();
    } catch (err) {
      console.warn("[BoundlessAI] disabled after boot error", err);
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
