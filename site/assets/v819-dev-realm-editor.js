/* Boundless DEV Realm Selector
 * DEV realm controls exist ONLY during Character Creation.
 * They are never mounted in the in-game Settings or world UI.
 */
(()=>{"use strict";
const DEV_KEY="boundless-dev-mode",PENDING_KEY="boundless-dev-start-realm";
const REALMS=["Body Refinement","Qi Condensation","Foundation Establishment","Core Formation","Nascent Soul","Soul Transformation","Void Refinement","Dao Integration","Tribulation Transcendence","Immortal Ascension"];
const PHASES=["Tahap Awal","Tahap Pertengahan","Tahap Akhir","Kesempurnaan Agung"];
const unlocked=()=>sessionStorage.getItem(DEV_KEY)==="1";
const creation=()=>!!document.querySelector(".bc-character-creation");

function pending(){try{return JSON.parse(sessionStorage.getItem(PENDING_KEY)||"null")}catch{return null}}
function setPending(v){sessionStorage.setItem(PENDING_KEY,JSON.stringify(v))}
function clearPending(){sessionStorage.removeItem(PENDING_KEY)}

function remove(){document.getElementById("bc-dev-realm-editor")?.remove()}

function applyToSave(){
 const p=pending();if(!p)return false;
 let raw=localStorage.getItem("boundless-save");if(!raw)return false;
 try{
   const save=JSON.parse(raw);
   save.realm=Math.max(0,Math.min(REALMS.length-1,Number(p.realm)||0));
   save.realmPhase=PHASES[Math.max(0,Math.min(PHASES.length-1,Number(p.phase)||0))];
   save.qiLayer=Math.max(1,Math.min(13,Number(p.layer)||1));
   localStorage.setItem("boundless-save",JSON.stringify(save));
   clearPending();
   if(typeof window.__boundlessLoadCurrent==="function")window.__boundlessLoadCurrent();
   return true;
 }catch(e){console.warn("[Boundless DEV Realm]",e);return false}
}

function armStartHook(){
 if(window.__boundlessDevRealmStartHook)return;
 window.__boundlessDevRealmStartHook=true;
 document.addEventListener("click",e=>{
   if(!unlocked())return;
   const b=e.target?.closest?.("button");
   if(!b||!/^Masuki Dunia Kultivasi$/i.test((b.textContent||"").trim()))return;
   setTimeout(()=>{let tries=0;const t=setInterval(()=>{if(applyToSave()||++tries>40)clearInterval(t)},100)},0);
 },true);
}

function settingsOpen(){
 const el=document.querySelector(".bc-settings-tabs");
 if(!el)return false;
 const r=el.getBoundingClientRect(),st=getComputedStyle(el);
 return st.display!=="none"&&st.visibility!=="hidden"&&r.width>0&&r.height>0;
}
function devSlot(){return document.querySelector('[data-boundless-custom-tab="dev-realm"]')}
function render(){
 if(!unlocked()||!settingsOpen()){remove();return}
 const slot=devSlot();
 if(!slot)return;
 let box=document.getElementById("bc-dev-realm-editor");
 if(!box){
   box=document.createElement("section");box.id="bc-dev-realm-editor";box.hidden=true;
   box.innerHTML='<div class="bc-dev-head"><b>🛠 DEV · Tetapan Ranah Awal</b><small>DEV aktif · Settings permainan</small></div><p class="bc-dev-note">Tetapkan ranah yang akan digunakan apabila watak memasuki dunia. Tetapan ini hanya boleh dibuka melalui slot DEV.</p><div class="bc-dev-grid"><label>Ranah<select id="bc-dev-realm">'+REALMS.map((x,i)=>'<option value="'+i+'">'+(i+1)+". "+x+"</option>").join("")+'</select></label><label>Tahap<select id="bc-dev-phase">'+PHASES.map((x,i)=>'<option value="'+i+'">'+x+"</option>").join("")+'</select></label><label id="bc-dev-layer-wrap">Lapisan Qi<input id="bc-dev-layer" type="number" min="1" max="13" value="1"></label></div><div class="bc-dev-actions"><button type="button" id="bc-dev-arm">✓ Tetapkan Ranah DEV</button></div><small id="bc-dev-realm-status" class="bc-dev-status">Belum ditetapkan.</small>';
   slot.insertAdjacentElement("afterend",box);
   slot.addEventListener("click",()=>{box.hidden=!box.hidden;renderControls();},true);
   box.querySelector("#bc-dev-realm").addEventListener("change",renderControls);
   box.querySelector("#bc-dev-arm").onclick=()=>{
     const realm=Number(box.querySelector("#bc-dev-realm").value);
     const phase=Number(box.querySelector("#bc-dev-phase").value);
     const layer=realm===1?Math.max(1,Math.min(13,Number(box.querySelector("#bc-dev-layer").value)||1)):1;
     const p={realm,phase,layer};
     setPending(p);
     box.querySelector("#bc-dev-realm-status").textContent="✓ "+REALMS[p.realm]+" · "+PHASES[p.phase]+(p.realm===1?" · Lapisan "+p.layer:"")+" — akan digunakan apabila masuk dunia.";
   };
 }
 box.hidden=false;
 renderControls();
}
function renderControls(){
 const box=document.getElementById("bc-dev-realm-editor");if(!box)return;
 const realmEl=box.querySelector("#bc-dev-realm"),layerWrap=box.querySelector("#bc-dev-layer-wrap"),layerEl=box.querySelector("#bc-dev-layer");
 const isQi=Number(realmEl.value)===1;
 layerWrap.hidden=!isQi;layerEl.disabled=!isQi;
 if(!isQi)layerEl.value="1";
 const p=pending();
 if(p){realmEl.value=String(p.realm);box.querySelector("#bc-dev-phase").value=String(p.phase);layerEl.value=String(p.layer);}
 const current=Number(realmEl.value)===1;
 layerWrap.hidden=!current;layerEl.disabled=!current;
}

function start(){
 armStartHook();
 let last=false;const o=new MutationObserver(()=>{const now=settingsOpen();if(now!==last||now)requestAnimationFrame(render);last=now});
 o.observe(document.body,{childList:true,subtree:true});
 let i=0;const t=setInterval(()=>{render();if(++i>240)clearInterval(t)},250);
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();