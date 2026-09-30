/* Boundless DEV Realm Editor — nested inside the DEV Settings slot */
(()=>{"use strict";
const DEV_KEY="boundless-dev-mode",PENDING_KEY="boundless-dev-start-realm";
const REALMS=["Body Refinement","Qi Condensation","Foundation Establishment","Core Formation","Nascent Soul","Soul Transformation","Void Refinement","Dao Integration","Tribulation Transcendence","Immortal Ascension"];
const PHASES=["Tahap Awal","Tahap Pertengahan","Tahap Akhir","Kesempurnaan Agung"];
const unlocked=()=>sessionStorage.getItem(DEV_KEY)==="1";
const pending=()=>{try{return JSON.parse(sessionStorage.getItem(PENDING_KEY)||"null")}catch{return null}};
const setPending=v=>sessionStorage.setItem(PENDING_KEY,JSON.stringify(v));
const clearPending=()=>sessionStorage.removeItem(PENDING_KEY);

function root(){return document.querySelector(".bc-settings-tabs")}
function slot(){return document.querySelector('[data-boundless-custom-tab="dev"]')}
function visible(el){if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0}
function normalize(p){const realm=Math.max(0,Math.min(9,Number(p?.realm)||0));const phase=Math.max(0,Math.min(3,Number(p?.phase)||0));const layer=realm===1?Math.max(1,Math.min(13,Number(p?.layer)||1)):1;return{realm,phase,layer}}
function remove(){document.getElementById("bc-dev-realm-editor")?.remove()}
function applyToSave(){
 const raw=localStorage.getItem("boundless-save"),p=pending();if(!raw||!p)return false;
 try{const save=JSON.parse(raw),v=normalize(p);save.realm=v.realm;save.realmPhase=PHASES[v.phase];if(v.realm===1)save.qiLayer=v.layer;else delete save.qiLayer;localStorage.setItem("boundless-save",JSON.stringify(save));clearPending();window.__boundlessLoadCurrent?.();return true}catch(e){console.warn("[Boundless DEV Realm]",e);return false}
}
function armStartHook(){
 if(window.__boundlessDevRealmStartHook)return;window.__boundlessDevRealmStartHook=true;
 document.addEventListener("click",e=>{if(!unlocked())return;const b=e.target?.closest?.("button");if(!b||!/^Masuki Dunia Kultivasi$/i.test((b.textContent||"").trim()))return;
 let tries=0;const t=setInterval(()=>{if(applyToSave()||++tries>=60)clearInterval(t)},100)},true)
}
function editor(){
 const s=slot();if(!s)return null;
 let box=document.getElementById("bc-dev-realm-editor");if(box)return box;
 box=document.createElement("section");box.id="bc-dev-realm-editor";box.hidden=true;
 box.innerHTML='<div class="bc-dev-head"><b>🛠 DEV · Tetapan Ranah Awal</b><button type="button" id="bc-dev-close" aria-label="Tutup">×</button></div><small>Editor DEV · Tetapan ini digunakan apabila watak memasuki dunia.</small><div class="bc-dev-grid"><label>Ranah<select id="bc-dev-realm">'+REALMS.map((x,i)=>'<option value="'+i+'">'+(i+1)+". "+x+"</option>").join("")+'</select></label><label>Tahap<select id="bc-dev-phase">'+PHASES.map((x,i)=>'<option value="'+i+'">'+x+"</option>").join("")+'</select></label><label id="bc-dev-layer-wrap">Lapisan Qi<input id="bc-dev-layer" type="number" min="1" max="13" step="1" value="1"></label></div><button type="button" id="bc-dev-arm">✓ Tetapkan Ranah DEV</button><small id="bc-dev-realm-status">Belum ditetapkan.</small>';
 s.insertAdjacentElement("afterend",box);
 box.querySelector("#bc-dev-close").onclick=()=>{box.hidden=true};
 box.querySelector("#bc-dev-realm").onchange=()=>controls(box);
 box.querySelector("#bc-dev-arm").onclick=()=>{const v=normalize({realm:box.querySelector("#bc-dev-realm").value,phase:box.querySelector("#bc-dev-phase").value,layer:box.querySelector("#bc-dev-layer").value});setPending(v);sync(box)};
 return box;
}
function controls(box){const r=box.querySelector("#bc-dev-realm"),w=box.querySelector("#bc-dev-layer-wrap"),l=box.querySelector("#bc-dev-layer"),q=Number(r.value)===1;w.hidden=!q;l.disabled=!q;if(!q)l.value="1"}
function sync(box){
 const p=pending();if(p){const v=normalize(p);box.querySelector("#bc-dev-realm").value=v.realm;box.querySelector("#bc-dev-phase").value=v.phase;box.querySelector("#bc-dev-layer").value=v.layer}
 controls(box);const v=pending();box.querySelector("#bc-dev-realm-status").textContent=v?"✓ Tetapan DEV disimpan untuk permulaan dunia.":"Belum ditetapkan."
}
function toggle(){
 if(!unlocked()||!visible(root()))return;
 const box=editor();if(!box)return;
 box.hidden=!box.hidden;if(!box.hidden){sync(box);box.scrollIntoView({block:"nearest"})}
}
function start(){
 armStartHook();
 document.addEventListener("boundless-open-dev",toggle);
 document.addEventListener("visibilitychange",()=>{if(document.hidden)remove()});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();