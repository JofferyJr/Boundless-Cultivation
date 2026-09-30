/* Boundless Cultivation v8.2 Weapon System
 * Modular weapon/item runtime. No opaque payloads; all state is JSON/localStorage.
 * Systems: weapon classes, grades, quality, core/catalyst/support materials,
 * refinement, tempering, Dao-rune matrix, affixes, mastery, weapon intent,
 * soul resonance, durability, karma alignment, set tags, repair and forging log.
 */
(()=>{"use strict";
const KEY="boundless-weapon-system-v1";
const VERSION=1;
const GRADES=[
 {id:"mortal",name:"Mortal",rank:1,base:1,trib:0},
 {id:"spiritual",name:"Spiritual",rank:2,base:1.35,trib:0},
 {id:"earth",name:"Earth",rank:3,base:1.8,trib:.15},
 {id:"heaven",name:"Heaven",rank:4,base:2.5,trib:.4},
 {id:"immortal",name:"Immortal",rank:5,base:3.5,trib:.7},
 {id:"divine",name:"Divine",rank:6,base:5,trib:.95}
];
const TYPES={
 sword:{name:"Pedang",atk:1.08,spd:1.05,crit:.03,reach:1.1,tags:["sword","blade"]},
 saber:{name:"Saber",atk:1.16,spd:.94,crit:.04,reach:1.0,tags:["blade","martial"]},
 spear:{name:"Tombak",atk:1.12,spd:.98,crit:.02,reach:1.3,tags:["polearm","pierce"]},
 bow:{name:"Busur",atk:1.02,spd:1.08,crit:.06,reach:1.5,tags:["ranged","pierce"]},
 staff:{name:"Tongkat",atk:.92,spd:.9,crit:.02,reach:1.1,tags:["focus","spell"]},
 fan:{name:"Kipas",atk:.88,spd:1.12,crit:.05,reach:1.0,tags:["focus","wind"]},
 guandao:{name:"Guandao",atk:1.22,spd:.82,crit:.03,reach:1.25,tags:["polearm","blade"]},
 hammer:{name:"Palu",atk:1.3,spd:.7,crit:.02,reach:.9,tags:["blunt","forge"]},
 dagger:{name:"Belati",atk:.86,spd:1.3,crit:.08,reach:.7,tags:["blade","assassin"]},
 orb:{name:"Orb",atk:.8,spd:1.0,crit:.04,reach:1.2,tags:["focus","spell"]}
};
const MATERIALS={
 iron:{name:"Iron",atk:1,def:1,stability:70,aff:["Kukuh"]},
 spiritSteel:{name:"Spirit Steel",atk:1.25,def:1.15,stability:82,aff:["Spirit Flow"]},
 coldJade:{name:"Cold Jade",atk:1.05,def:1.3,stability:86,aff:["Ais","Kukuh"]},
 thunderstone:{name:"Thunderstone",atk:1.3,def:.95,stability:72,aff:["Kilat"]},
 phoenixMetal:{name:"Phoenix Metal",atk:1.42,def:1.08,stability:68,aff:["Api","Rebirth"]},
 voidOre:{name:"Void Ore",atk:1.55,def:.9,stability:60,aff:["Ruang","Void Edge"]},
 starIron:{name:"Star Iron",atk:1.48,def:1.25,stability:78,aff:["Astral","Kukuh"]}
};
const CATALYSTS={
 flame:{name:"Flame Core",element:"Api",power:18,stability:-5,skill:"Flame Edge"},
 frost:{name:"Frost Core",element:"Ais",power:16,stability:-2,skill:"Frozen Veil"},
 storm:{name:"Storm Core",element:"Kilat",power:20,stability:-8,skill:"Thunder Arc"},
 gale:{name:"Gale Core",element:"Angin",power:14,stability:1,skill:"Gale Step"},
 light:{name:"Light Core",element:"Cahaya",power:13,stability:3,skill:"Radiant Guard"},
 shadow:{name:"Shadow Core",element:"Gelap",power:17,stability:-6,skill:"Silent Edge"},
 space:{name:"Void Core",element:"Ruang",power:24,stability:-12,skill:"Void Rend"}
};
const RUNES=[
 ["swordQi","Pedang Qi",5],["lightning","Kilat",4],["fire","Api",4],["ice","Ais",4],
 ["wind","Angin",3],["illusion","Ilusi",3],["defense","Pertahanan",3],["space","Ruang",5],["soul","Jiwa",5]
];
const KARMA={
 orthodox:{name:"Orthodox",damage:1,def:1.12,crit:.0,corrupt:0},
 neutral:{name:"Neutral",damage:1.06,def:1.04,crit:.02,corrupt:.01},
 asura:{name:"Asura/Demonic",damage:1.2,def:.94,crit:.06,corrupt:.08}
};
const INTENT=["Tiada","Kesedaran Senjata","Jiwa Senjata","Roh Senjata","Dewa Senjata"];
const AFF=[
 ["Kukuh","Durability +12%"],["Spirit Flow","Qi efficiency +8%"],["Flame Edge","Fire damage +12%"],
 ["Frozen Veil","Defense +10%"],["Thunder Arc","Lightning damage +14%"],["Gale Step","Speed +9%"],
 ["Radiant Guard","Defense +14%"],["Silent Edge","Crit damage +18%"],["Void Rend","Penetration +16%"],
 ["Rebirth","Repair regeneration +1%/min"],["Astral","Damage +7%, crit +3%"]
];
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||"null");if(x&&x.version===VERSION)return x}catch{}return {version:VERSION,weapons:[],materials:{iron:12,spiritSteel:8,coldJade:4,thunderstone:3,phoenixMetal:1,voidOre:1,starIron:1},active:null,log:[]}}
let state=load();
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function grade(id){return GRADES.find(g=>g.id===id)||GRADES[0]}
function rollQuality(){const r=Math.random();return r>.98?5:r>.9?4:r>.68?3:r>.3?2:1}
function weaponPower(w){
 const g=grade(w.grade),t=TYPES[w.type],m=MATERIALS[w.material],c=CATALYSTS[w.catalyst];
 let p=100*g.base*t.atk*m.atk*(1+w.refine*.065)*(1+(w.quality-1)*.055);
 p*=1+(w.runes.reduce((a,r)=>a+r[2],0)*.01);
 p*=KARMA[w.karma].damage;
 if(w.intent>0)p*=1+w.intent*.06;
 if(w.resonance>=80)p*=1.1;
 return Math.round(p);
}
function defense(w){return Math.round(30*grade(w.grade).base*TYPES[w.type].spd*MATERIALS[w.material].def*(1+w.tempering*.04)*KARMA[w.karma].def)}
function makeWeapon(type,gradeId,material,catalyst,karma){
 const g=grade(gradeId),m=MATERIALS[material],c=CATALYSTS[catalyst];
 const aff=[...m.aff];if(c.skill&&!aff.includes(c.skill))aff.push(c.skill);
 if(Math.random()<.28)aff.push(pick(AFF)[0]);
 const w={id:"WPN-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7).toUpperCase(),
 name:"Unnamed "+TYPES[type].name,type,grade:gradeId,quality:rollQuality(),material,catalyst,
 element:c.element,karma,intent:0,refine:0,tempering:0,mastery:0,resonance:0,
 durability:100,maxDurability:100,affixes:[...new Set(aff)],runes:[],soulBound:false,
 setTag:null,createdAt:new Date().toISOString()};
 w.power=weaponPower(w);w.guard=defense(w);return w;
}
function forge(){
 const type=document.querySelector("#bc-wpn-type").value, g=document.querySelector("#bc-wpn-grade").value;
 const mat=document.querySelector("#bc-wpn-material").value,cat=document.querySelector("#bc-wpn-catalyst").value;
 const karma=document.querySelector("#bc-wpn-karma").value;
 if(!state.materials[mat]){toast("Bahan teras tidak mencukupi.");return}
 const stability=clamp((MATERIALS[mat].stability+(CATALYSTS[cat].stability)+grade(g).rank*3),0,100);
 const purity=70+Math.floor(Math.random()*31);
 const trib=Math.round(grade(g).trib*100);
 if(stability<35){toast("Forge gagal: Stability terlalu rendah.");return}
 if(Math.random()<grade(g).trib*.22){toast("Forge gagal: Dao Tribulation memecahkan bentuk senjata.");return}
 state.materials[mat]--;const w=makeWeapon(type,g,mat,cat,karma);
 w.purity=purity;w.stability=stability;w.tribulation=trib;w.name=grade(g).name+" "+TYPES[type].name;
 state.weapons.unshift(w);state.active=w.id;
 state.log.unshift({at:new Date().toISOString(),event:"Forge",id:w.id,purity,stability});
 save();render();
}
function modify(id,fn,cost){
 const w=state.weapons.find(x=>x.id===id);if(!w)return;
 if(!fn(w)){toast("Tindakan tidak dapat dilakukan.");return}
 w.power=weaponPower(w);w.guard=defense(w);save();render();
}
function refine(){
 const w=state.weapons.find(x=>x.id===state.active);if(!w)return;
 const level=w.refine, chance=clamp(.92-level*.075, .18, .92);
 if(Math.random()>chance){w.durability=Math.max(1,w.durability-8);toast("Refinement gagal. Durability berkurang.");save();render();return}
 w.refine++;w.durability=Math.max(1,w.durability-3);toast("Refinement berjaya: +"+w.refine);save();render();
}
function temper(){
 const w=state.weapons.find(x=>x.id===state.active);if(!w)return;
 if(w.tempering>=10){toast("Tempering maksimum.");return}
 const chance=.88-w.tempering*.055;
 if(Math.random()>chance){w.tempering=Math.max(0,w.tempering-1);toast("Tempering backlash: tahap turun.");}
 else w.tempering++;
 w.durability=Math.max(1,w.durability-5);save();render();
}
function inscribe(){
 const w=state.weapons.find(x=>x.id===state.active);if(!w)return;
 const unused=RUNES.filter(r=>!w.runes.some(x=>x[0]===r[0]));
 if(!unused.length){toast("Matrix Dao Rune penuh.");return}
 w.runes.push(pick(unused));w.durability=Math.max(1,w.durability-2);save();render();
}
function awakenIntent(){
 const w=state.weapons.find(x=>x.id===state.active);if(!w)return;
 if(w.intent>=4){toast("Weapon God telah dicapai.");return}
 const req=[0,20,45,75,100][w.intent+1];
 if(w.mastery<req){toast("Mastery belum cukup: "+req+" diperlukan.");return}
 w.intent++;w.resonance=Math.max(w.resonance,20*w.intent);save();render();
}
function repair(){
 const w=state.weapons.find(x=>x.id===state.active);if(!w)return;
 w.durability=clamp(w.durability+25,0,w.maxDurability);save();render();
}
function gainMastery(){
 const w=state.weapons.find(x=>x.id===state.active);if(!w)return;
 w.mastery=clamp(w.mastery+5,0,100);w.resonance=clamp(w.resonance+3,0,100);save();render();
}
function rename(){
 const w=state.weapons.find(x=>x.id===state.active);if(!w)return;
 const n=prompt("Nama senjata",w.name);if(n&&n.trim()){w.name=n.trim();save();render()}
}
function toast(msg){let t=document.getElementById("bc-wpn-toast");if(!t){t=document.createElement("div");t.id="bc-wpn-toast";document.body.appendChild(t)}t.textContent=msg;t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),1800)}
function open(){let o=document.getElementById("bc-wpn-overlay");if(!o){build();o=document.getElementById("bc-wpn-overlay")}o.hidden=false;render()}
function close(){const o=document.getElementById("bc-wpn-overlay");if(o)o.hidden=true}
function opts(obj,selected){return Object.entries(obj).map(([k,v])=>"<option value="+esc(k)+(k===selected?" selected":"")+">"+esc(v.name)+"</option>").join("")}
function build(){
 const o=document.createElement("div");o.id="bc-wpn-overlay";o.hidden=true;o.innerHTML='<section class="bc-wpn-dialog" role="dialog" aria-modal="true"><header><div><small>BOUNDLESS · WEAPON SYSTEM v8.2</small><h2>⚔️ Weapon Forge & Arsenal</h2><p>Forge → Refine → Temper → Inscribe → Awaken Weapon Intent.</p></div><button id="bc-wpn-close">×</button></header><div class="bc-wpn-grid"><aside class="bc-wpn-panel"><h3>Forging</h3><label>Jenis<select id="bc-wpn-type">'+opts(TYPES,TYPES.sword.id)+'</select></label><label>Grade<select id="bc-wpn-grade">'+opts(Object.fromEntries(GRADES.map(g=>[g.id,g])), "spiritual")+'</select></label><label>Core Material<select id="bc-wpn-material">'+opts(MATERIALS,"spiritSteel")+'</select></label><label>Catalyst / Soul<select id="bc-wpn-catalyst">'+opts(CATALYSTS,"flame")+'</select></label><label>Karma<select id="bc-wpn-karma">'+opts(KARMA,"orthodox")+'</select></label><button id="bc-wpn-forge" class="gold">Forge Weapon</button><div id="bc-wpn-mats"></div></aside><main class="bc-wpn-panel"><h3>Arsenal</h3><div id="bc-wpn-list"></div></main><aside class="bc-wpn-panel"><h3>Weapon Core</h3><div id="bc-wpn-detail"></div></aside></div><footer><small>Grades Earth/Heaven mempunyai risiko tribulation; Immortal/Divine memerlukan kestabilan tinggi.</small></footer></section>';
 document.body.appendChild(o);
 o.querySelector("#bc-wpn-close").onclick=close;o.addEventListener("click",e=>{if(e.target===o)close()});o.querySelector("#bc-wpn-forge").onclick=forge;
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!o.hidden)close()});
}
function render(){
 const o=document.getElementById("bc-wpn-overlay");if(!o)return;
 const list=o.querySelector("#bc-wpn-list"),detail=o.querySelector("#bc-wpn-detail"),mats=o.querySelector("#bc-wpn-mats");
 mats.innerHTML="<b>Material</b><div class='bc-wpn-mats'>"+Object.entries(state.materials).map(([k,v])=>"<span>"+esc(MATERIALS[k].name)+": "+v+"</span>").join("")+"</div>";
 list.innerHTML=state.weapons.length?state.weapons.map(w=>"<button class='bc-wpn-card "+(w.id===state.active?"active":"")+"' data-id='"+esc(w.id)+"'><b>"+esc(w.name)+"</b><span>"+esc(GRADES.find(g=>g.id===w.grade)?.name)+" · "+esc(TYPES[w.type].name)+"</span><em>⚔ "+weaponPower(w)+" · Refine +"+w.refine+"</em></button>").join(""):"<p class='muted'>Belum ada senjata. Forge senjata pertama anda.</p>";
 list.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>{state.active=b.dataset.id;save();render()});
 const w=state.weapons.find(x=>x.id===state.active);
 if(!w){detail.innerHTML="<p class='muted'>Pilih senjata.</p>";return}
 detail.innerHTML='<div class="bc-wpn-name"><b>'+esc(w.name)+'</b><button id="bc-wpn-rename">Nama</button></div><div class="bc-wpn-stats"><span>⚔ Power <b>'+weaponPower(w)+'</b></span><span>🛡 Guard <b>'+defense(w)+'</b></span><span>❤ Durability <b>'+w.durability+'/'+w.maxDurability+'</b></span><span>✦ Purity <b>'+w.purity+'%</b></span><span>◈ Stability <b>'+w.stability+'%</b></span><span>☯ Karma <b>'+esc(KARMA[w.karma].name)+'</b></span></div><div class="bc-wpn-progress"><label>Mastery '+w.mastery+'%</label><div><i style="width:'+w.mastery+'%"></i></div><label>Resonance '+w.resonance+'%</label><div><i style="width:'+w.resonance+'%"></i></div></div><p><b>Intent:</b> '+esc(INTENT[w.intent])+' · <b>Element:</b> '+esc(w.element)+'</p><p><b>Affixes:</b> '+w.affixes.map(esc).join(" · ")+'</p><p><b>Dao Runes:</b> '+(w.runes.length?w.runes.map(r=>esc(r[1])).join(" · "):"Tiada")+'</p><div class="bc-wpn-actions"><button id="wp-refine">Refine +'+(w.refine+1)+'</button><button id="wp-temper">Temper</button><button id="wp-rune">Inscribe Rune</button><button id="wp-intent">Awaken Intent</button><button id="wp-mastery">Train Mastery</button><button id="wp-repair">Repair</button></div><details><summary>Technical data</summary><pre>'+esc(JSON.stringify(w,null,2))+'</pre></details>';
 o.querySelector("#bc-wpn-rename").onclick=rename;o.querySelector("#wp-refine").onclick=refine;o.querySelector("#wp-temper").onclick=temper;o.querySelector("#wp-rune").onclick=inscribe;o.querySelector("#wp-intent").onclick=awakenIntent;o.querySelector("#wp-mastery").onclick=gainMastery;o.querySelector("#wp-repair").onclick=repair;
}
function mountInventoryWeaponMenu(){
  const sections=[...document.querySelectorAll(".equipment-section")];
  const section=sections.find(el=>el.offsetParent!==null)||sections[0];
  if(!section)return false;
  if(section.querySelector(".boundless-weapon-menu-button"))return true;
  const heading=section.querySelector(":scope > div:first-child");
  const button=document.createElement("button");
  button.type="button";
  button.className="boundless-weapon-menu-button";
  button.textContent="⚔️ Senjata & Tempa";
  button.setAttribute("aria-label","Buka menu Senjata dan Tempa");
  button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();open();});
  if(heading){
    heading.style.display="flex";
    heading.style.alignItems="center";
    heading.style.justifyContent="space-between";
    heading.style.gap="12px";
    heading.appendChild(button);
  }else section.prepend(button);
  return true;
}
function observeInventoryWeaponMenu(){
  let scheduled=false;
  const ensure=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;mountInventoryWeaponMenu();});
  };
  const observer=new MutationObserver(records=>{
    if(records.some(r=>r.type==="childList"))ensure();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  let tries=0;
  const timer=setInterval(()=>{mountInventoryWeaponMenu();if(++tries>=240)clearInterval(timer);},250);
  mountInventoryWeaponMenu();
}
window.__boundlessOpenWeaponForge=open;
window.__boundlessWeaponState=()=>state;
window.__boundlessWeaponSystem={version:VERSION,open,forge,save};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{build();observeInventoryWeaponMenu();},{once:true});else{build();observeInventoryWeaponMenu();}
})();