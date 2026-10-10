/* Boundless DEV Realm Editor — embedded inside native Settings > Dev */
(()=>{"use strict";
const DEV_KEY="boundless-dev-mode",PENDING_KEY="boundless-dev-start-realm";
const REALMS=["Body Refinement","Qi Condensation","Foundation Establishment","Core Formation","Nascent Soul","Soul Transformation","Void Refinement","Dao Integration","Tribulation Transcendence","Immortal Ascension"];
const PHASES=["Tahap Awal","Tahap Pertengahan","Tahap Akhir","Kesempurnaan Agung"];
const unlocked=()=>sessionStorage.getItem(DEV_KEY)==="1";
const pending=()=>{try{return JSON.parse(sessionStorage.getItem(PENDING_KEY)||"null")}catch{return null}};
const setPending=v=>sessionStorage.setItem(PENDING_KEY,JSON.stringify(v));
const clearPending=()=>sessionStorage.removeItem(PENDING_KEY);
function activeDevPanel(){
 return document.querySelector('[role="tabpanel"][data-value="dev"][data-state="active"]')||
 document.querySelector('[data-value="dev"][role="tabpanel"]')||
 [...document.querySelectorAll('[data-value="dev"]')].find(el=>el.getAttribute("role")==="tabpanel"||el.dataset.state==="active");
}
function normalize(p){const realm=Math.max(0,Math.min(9,Number(p?.realm)||0));const phase=Math.max(0,Math.min(3,Number(p?.phase)||0));const layer=realm===1?Math.max(1,Math.min(13,Number(p?.layer)||1)):1;return{realm,phase,layer}}
function remove(){document.getElementById("bc-dev-realm-editor")?.remove()}
function applyToSave(){
 const raw=localStorage.getItem("boundless-save"),p=pending();if(!raw||!p)return false;
 try{const save=JSON.parse(raw),v=normalize(p);save.realm=v.realm;save.realmPhase=PHASES[v.phase];if(v.realm===1)save.qiLayer=v.layer;else delete save.qiLayer;localStorage.setItem("boundless-save",JSON.stringify(save));clearPending();window.__boundlessLoadCurrent?.();return true}catch(e){console.warn("[Boundless DEV Realm]",e);return false}
}
function armStartHook(){
 if(window.__boundlessDevRealmStartHook)return;window.__boundlessDevRealmStartHook=true;
 document.addEventListener("click",e=>{if(!unlocked())return;const b=e.target?.closest?.("button");if(!b||!/^Masuki Dunia Kultivasi$/i.test((b.textContent||"").trim()))return;let tries=0;const t=setInterval(()=>{if(applyToSave()||++tries>=60)clearInterval(t)},100)},true)
}
function controls(box){
 const r=box.querySelector("#bc-dev-realm"),w=box.querySelector("#bc-dev-layer-wrap"),l=box.querySelector("#bc-dev-layer"),q=Number(r.value)===1;w.hidden=!q;l.disabled=!q;if(!q)l.value="1";
}
function sync(box){
 const p=pending();if(p){const v=normalize(p);box.querySelector("#bc-dev-realm").value=String(v.realm);box.querySelector("#bc-dev-phase").value=String(v.phase);box.querySelector("#bc-dev-layer").value=String(v.layer)}
 controls(box);box.querySelector("#bc-dev-realm-status").textContent=pending()?"✓ Tetapan DEV disimpan untuk permulaan dunia.":"Belum ditetapkan."
}
function currentSave(){
 try{return JSON.parse(localStorage.getItem("boundless-save")||"null")}catch{return null}
}
function saveCurrentRealm(box){
 const raw=localStorage.getItem("boundless-save");
 if(!raw){box.querySelector("#bc-dev-current-status").textContent="Tiada save aktif ditemui. Masuk ke dunia dan muatkan watak dahulu.";return}
 try{
  const save=JSON.parse(raw),v=normalize({realm:box.querySelector("#bc-dev-current-realm").value,phase:box.querySelector("#bc-dev-current-phase").value,layer:box.querySelector("#bc-dev-current-layer").value});
  save.realm=v.realm;save.realmPhase=PHASES[v.phase];
  if(v.realm===1)save.qiLayer=v.layer;else delete save.qiLayer;
  localStorage.setItem("boundless-save",JSON.stringify(save));
  try{window.__boundlessLoadCurrent?.()}catch(e){console.warn("[Boundless DEV Realm] refresh",e)}
  window.dispatchEvent(new CustomEvent("boundless-dev-realm-changed",{detail:{...v,realmName:REALMS[v.realm],phaseName:PHASES[v.phase]}}));
  box.querySelector("#bc-dev-current-status").textContent="✓ Ranah watak semasa ditukar kepada "+REALMS[v.realm]+" · "+PHASES[v.phase]+(v.realm===1?" · Lapisan "+v.layer:"")+".";
 }catch(e){console.warn("[Boundless DEV Realm]",e);box.querySelector("#bc-dev-current-status").textContent="Gagal menyimpan perubahan ranah. Semak konsol untuk ralat."}
}
function currentControls(box){
 const r=box.querySelector("#bc-dev-current-realm"),w=box.querySelector("#bc-dev-current-layer-wrap"),l=box.querySelector("#bc-dev-current-layer");
 const q=Number(r.value)===1;w.hidden=!q;l.disabled=!q;if(!q)l.value="1";
}
function syncCurrent(box){
 const save=currentSave(),r=box.querySelector("#bc-dev-current-realm"),p=box.querySelector("#bc-dev-current-phase"),l=box.querySelector("#bc-dev-current-layer");
 if(save){
  const realm=Number(save.realm);r.value=String(Number.isFinite(realm)?Math.max(0,Math.min(9,realm)):0);
  const phase=PHASES.indexOf(save.realmPhase);p.value=String(phase>=0?phase:0);
  l.value=String(Math.max(1,Math.min(13,Number(save.qiLayer)||1)));
  box.querySelector("#bc-dev-current-status").textContent="Save aktif dikesan · "+(REALMS[Number(r.value)]||REALMS[0])+" · "+(save.realmPhase||PHASES[0])+".";
 }else box.querySelector("#bc-dev-current-status").textContent="Tiada save aktif ditemui. Masuk ke dunia dan muatkan watak dahulu.";
 currentControls(box);
}
function editor(panel){
 if(!panel)return null;let box=document.getElementById("bc-dev-realm-editor");if(box)return box;
 box=document.createElement("section");box.id="bc-dev-realm-editor";
 box.innerHTML='<div class="bc-dev-head"><div><b>🛠 Editor Ranah DEV</b><small>Ubah ranah watak semasa atau tetapkan ranah permulaan. Hanya tersedia apabila DEV dibuka.</small></div><button type="button" id="bc-dev-close" aria-label="Tutup">×</button></div><section class="bc-dev-realm-section"><h3>Ranah Watak Semasa</h3><p>Perubahan disimpan pada save aktif.</p><div class="bc-dev-grid"><label>Ranah<select id="bc-dev-current-realm">'+REALMS.map((x,i)=>'<option value="'+i+'">'+(i+1)+". "+x+"</option>").join("")+'</select></label><label>Tahap<select id="bc-dev-current-phase">'+PHASES.map((x,i)=>'<option value="'+i+'">'+x+"</option>").join("")+'</select></label><label id="bc-dev-current-layer-wrap">Lapisan Qi<input id="bc-dev-current-layer" type="number" min="1" max="13" step="1" value="1"></label></div><button type="button" id="bc-dev-apply-current">✓ Ubah Ranah Watak</button><small id="bc-dev-current-status">Menyemak save aktif…</small></section><section class="bc-dev-realm-section"><h3>Ranah Awal</h3><p>Digunakan apabila watak baharu memasuki dunia.</p><div class="bc-dev-grid"><label>Ranah<select id="bc-dev-realm">'+REALMS.map((x,i)=>'<option value="'+i+'">'+(i+1)+". "+x+"</option>").join("")+'</select></label><label>Tahap<select id="bc-dev-phase">'+PHASES.map((x,i)=>'<option value="'+i+'">'+x+"</option>").join("")+'</select></label><label id="bc-dev-layer-wrap">Lapisan Qi<input id="bc-dev-layer" type="number" min="1" max="13" step="1" value="1"></label></div><button type="button" id="bc-dev-arm">✓ Tetapkan Ranah Awal DEV</button><small id="bc-dev-realm-status">Belum ditetapkan.</small></section>';
 panel.appendChild(box);
 box.querySelector("#bc-dev-close").onclick=()=>{box.hidden=true};
 box.querySelector("#bc-dev-realm").addEventListener("change",()=>controls(box));
 box.querySelector("#bc-dev-arm").onclick=()=>{const v=normalize({realm:box.querySelector("#bc-dev-realm").value,phase:box.querySelector("#bc-dev-phase").value,layer:box.querySelector("#bc-dev-layer").value});setPending(v);sync(box)};
 box.querySelector("#bc-dev-current-realm").addEventListener("change",()=>currentControls(box));
 box.querySelector("#bc-dev-apply-current").onclick=()=>saveCurrentRealm(box);
 syncCurrent(box);
 return box;
}
function sync(){
 if(!unlocked()){remove();return}
 const panel=activeDevPanel();if(!panel){remove();return}
 const box=editor(panel);if(!box)return;
 const active=panel.dataset.state==="active"||getComputedStyle(panel).display!=="none";
 box.hidden=!active;if(active){sync(box);syncCurrent(box)}
}
function start(){
 armStartHook();
 document.addEventListener("click",e=>{
  const trigger=e.target?.closest?.('[data-value="dev"][role="tab"],button[value="dev"],[data-state][data-value="dev"]');
  if(!trigger)return;
  requestAnimationFrame(sync);setTimeout(sync,60);
 },true);
 document.addEventListener("boundless-open-dev",()=>{requestAnimationFrame(sync);setTimeout(sync,60)});
 window.__boundlessSyncDevRealm=sync;
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();