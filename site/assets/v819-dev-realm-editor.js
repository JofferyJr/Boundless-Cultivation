/* Boundless DEV Realm Editor — Settings only
 * The editor is never mounted in Character Creation or the world.
 * It is exposed only through the unlocked Settings DEV slot.
 */
(()=>{"use strict";
const DEV_KEY="boundless-dev-mode",PENDING_KEY="boundless-dev-start-realm";
const REALMS=["Body Refinement","Qi Condensation","Foundation Establishment","Core Formation","Nascent Soul","Soul Transformation","Void Refinement","Dao Integration","Tribulation Transcendence","Immortal Ascension"];
const PHASES=["Tahap Awal","Tahap Pertengahan","Tahap Akhir","Kesempurnaan Agung"];
const unlocked=()=>sessionStorage.getItem(DEV_KEY)==="1";
const pending=()=>{try{return JSON.parse(sessionStorage.getItem(PENDING_KEY)||"null")}catch{return null}};
const setPending=v=>sessionStorage.setItem(PENDING_KEY,JSON.stringify(v));
const clearPending=()=>sessionStorage.removeItem(PENDING_KEY);
const settingsRoot=()=>document.querySelector(".bc-settings-tabs");
const devSlot=()=>document.querySelector('[data-boundless-custom-tab="dev-realm"]');

function settingsVisible(){
 const el=settingsRoot();if(!el)return false;
 const s=getComputedStyle(el),r=el.getBoundingClientRect();
 return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0;
}
function remove(){document.getElementById("bc-dev-realm-editor")?.remove()}
function normalize(p){
 const realm=Math.max(0,Math.min(REALMS.length-1,Number(p?.realm)||0));
 const phase=Math.max(0,Math.min(PHASES.length-1,Number(p?.phase)||0));
 const layer=realm===1?Math.max(1,Math.min(13,Number(p?.layer)||1)):1;
 return {realm,phase,layer};
}
function applyToSave(){
 const raw=localStorage.getItem("boundless-save"),p=pending();if(!raw||!p)return false;
 try{
  const save=JSON.parse(raw),v=normalize(p);
  save.realm=v.realm;
  save.realmPhase=PHASES[v.phase];
  if(v.realm===1)save.qiLayer=v.layer;else delete save.qiLayer;
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
  setTimeout(()=>{
   let tries=0;
   const t=setInterval(()=>{if(applyToSave()||++tries>=80)clearInterval(t)},100);
  },0);
 },true);
}
function controls(box){
 const realm=box.querySelector("#bc-dev-realm"),phase=box.querySelector("#bc-dev-phase");
 const wrap=box.querySelector("#bc-dev-layer-wrap"),layer=box.querySelector("#bc-dev-layer");
 const isQi=Number(realm.value)===1;
 wrap.hidden=!isQi;layer.disabled=!isQi;
 if(!isQi)layer.value="1";
}
function updateStatus(box){
 const p=pending(),status=box.querySelector("#bc-dev-realm-status");
 if(!p){status.textContent="Belum ditetapkan.";return}
 const v=normalize(p);
 status.textContent="✓ "+REALMS[v.realm]+" · "+PHASES[v.phase]+(v.realm===1?" · Lapisan "+v.layer:"")+" — tetapan DEV disimpan untuk permulaan dunia.";
}
function build(){
 const slot=devSlot();if(!slot)return null;
 let box=document.getElementById("bc-dev-realm-editor");
 if(box)return box;
 box=document.createElement("section");box.id="bc-dev-realm-editor";box.hidden=true;
 box.innerHTML='<div class="bc-dev-head"><b>🛠 DEV · Tetapan Ranah Awal</b><small>DEV aktif · Settings permainan</small></div><p class="bc-dev-note">Tetapkan ranah yang akan digunakan selepas watak memasuki dunia. Editor ini hanya boleh dibuka melalui slot DEV.</p><div class="bc-dev-grid"><label>Ranah<select id="bc-dev-realm">'+REALMS.map((x,i)=>'<option value="'+i+'">'+(i+1)+". "+x+"</option>").join("")+'</select></label><label>Tahap<select id="bc-dev-phase">'+PHASES.map((x,i)=>'<option value="'+i+'">'+x+"</option>").join("")+'</select></label><label id="bc-dev-layer-wrap">Lapisan Qi<input id="bc-dev-layer" type="number" min="1" max="13" step="1" value="1"></label></div><div class="bc-dev-actions"><button type="button" id="bc-dev-arm">✓ Tetapkan Ranah DEV</button></div><small id="bc-dev-realm-status" class="bc-dev-status">Belum ditetapkan.</small>';
 slot.insertAdjacentElement("afterend",box);
 const realm=box.querySelector("#bc-dev-realm");
 realm.addEventListener("change",()=>controls(box));
 box.querySelector("#bc-dev-arm").addEventListener("click",()=>{
  if(!unlocked())return;
  const v=normalize({realm:realm.value,phase:box.querySelector("#bc-dev-phase").value,layer:box.querySelector("#bc-dev-layer").value});
  setPending(v);controls(box);updateStatus(box);
 });
 return box;
}
function syncBox(){
 if(!unlocked()||!settingsVisible()){remove();return}
 const slot=devSlot();if(!slot){remove();return}
 const box=build();if(!box)return;
 const p=pending();
 if(p){
  const v=normalize(p);
  box.querySelector("#bc-dev-realm").value=String(v.realm);
  box.querySelector("#bc-dev-phase").value=String(v.phase);
  box.querySelector("#bc-dev-layer").value=String(v.layer);
 }
 controls(box);updateStatus(box);
}
function toggle(){
 if(!unlocked()||!settingsVisible())return;
 const box=build();if(!box)return;
 box.hidden=!box.hidden;
 if(!box.hidden){syncBox();box.scrollIntoView({block:"nearest",behavior:"smooth"})}
}
function start(){
 armStartHook();
 document.addEventListener("boundless-open-dev-realm",toggle);
 document.addEventListener("click",e=>{
  const b=e.target?.closest?.('[data-boundless-custom-tab="dev-realm"]');
  if(!b||b.disabled)return;
  e.preventDefault();e.stopImmediatePropagation();toggle();
 },true);
 const observer=new MutationObserver(()=>requestAnimationFrame(syncBox));
 observer.observe(document.body,{childList:true,subtree:true});
 let i=0;const timer=setInterval(()=>{syncBox();if(++i>=240)clearInterval(timer)},250);
 syncBox();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();