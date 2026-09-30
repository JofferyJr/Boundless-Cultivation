/* Boundless Cultivation v8.2 Dev Realm Editor
 * DEV-only: changes the current player's cultivation realm in boundless-save.
 * Unlock is detected from the game's existing sessionStorage key.
 */
(()=>{"use strict";
const DEV_KEY="boundless-dev-mode";
const SAVE_KEY="boundless-save";
const REALMS=["Body Refinement","Qi Condensation","Foundation Establishment","Core Formation","Nascent Soul","Soul Transformation","Void Refinement","Dao Integration","Tribulation Transcendence","Immortal Ascension"];
const PHASES=["Tahap Awal","Tahap Pertengahan","Tahap Akhir","Kesempurnaan Agung"];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const unlocked=()=>sessionStorage.getItem(DEV_KEY)==="1";
function read(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||"null")}catch{return null}}
function write(obj){localStorage.setItem(SAVE_KEY,JSON.stringify(obj))}
function reload(){if(typeof window.__boundlessLoadCurrent==="function"){window.__boundlessLoadCurrent();return true}location.reload();return true}
function activePanel(){
 const tabs=[...document.querySelectorAll(".bc-settings-tabs")].find(t=>{const s=getComputedStyle(t);return s.display!=="none"&&s.visibility!=="hidden"})||document.querySelector(".bc-settings-tabs");
 if(!tabs)return null;
 const root=tabs.parentElement;
 const panels=[...root.querySelectorAll('[role="tabpanel"]')];
 return panels.find(p=>p.getAttribute("data-state")==="active")||panels.find(p=>getComputedStyle(p).display!=="none")||null;
}
function isDevTab(){
 const tabs=[...document.querySelectorAll(".bc-settings-tabs")].find(t=>getComputedStyle(t).display!=="none")||document.querySelector(".bc-settings-tabs");
 if(!tabs)return false;
 const active=[...tabs.querySelectorAll('[role="tab"]')].find(t=>t.getAttribute("aria-selected")==="true"||t.dataset.state==="active");
 return !!active&&/\bdev\b/i.test(active.textContent||"");
}
function apply(){
 if(!unlocked())return;
 const save=read(); if(!save){alert("Tiada save Boundless aktif.");return}
 const sel=document.getElementById("bc-dev-realm"); const phase=document.getElementById("bc-dev-phase"); const layer=document.getElementById("bc-dev-layer");
 const realm=Number(sel.value);
 const isQi=realm===1;
 save.realm=realm;
 save.realmPhase=isQi?PHASES[Number(phase.value)||0]:(realm===0?PHASES[0]:PHASES[Number(phase.value)||0]);
 save.qiLayer=isQi?Math.max(1,Math.min(13,Number(layer.value)||1)):Math.max(1,Math.min(13,Number(layer.value)||1));
 save.gameVersion=save.gameVersion||"8.2";
 write(save);
 window.__boundlessDevRealmLast={realm,realmName:REALMS[realm],phase:save.realmPhase,qiLayer:save.qiLayer,at:new Date().toISOString()};
 const status=document.getElementById("bc-dev-realm-status");
 if(status)status.textContent="✓ "+REALMS[realm]+" · "+save.realmPhase+(isQi?" · Lapisan "+save.qiLayer:"")+" — memuat semula state…";
 setTimeout(reload,80);
}
function render(){
 const host=activePanel();
 if(!host||!unlocked()||!isDevTab())return;
 let box=document.getElementById("bc-dev-realm-editor");
 if(!box){box=document.createElement("section");box.id="bc-dev-realm-editor";box.innerHTML=
 '<div class="bc-dev-head"><div><b>🛠 Dev · Cultivation Realm Editor</b><small>DEV aktif · hanya mempengaruhi pemain semasa</small></div></div>'+
 '<p class="bc-dev-note">Tukar ranah terus melalui save semasa. Sistem breakthrough biasa tidak diperlukan untuk ujian Dev.</p>'+
 '<div class="bc-dev-grid"><label>Ranah<select id="bc-dev-realm">'+REALMS.map((x,i)=>'<option value="'+i+'">'+(i+1)+'. '+esc(x)+'</option>').join("")+'</select></label>'+
 '<label>Tahap<select id="bc-dev-phase">'+PHASES.map((x,i)=>'<option value="'+i+'">'+esc(x)+'</option>').join("")+'</select></label>'+
 '<label>Lapisan Qi<input id="bc-dev-layer" type="number" min="1" max="13" value="1"></label></div>'+
 '<div class="bc-dev-actions"><button id="bc-dev-apply">⚡ Tukar Ranah</button><button id="bc-dev-max">⟐ Set Kesempurnaan Agung</button></div>'+
 '<small id="bc-dev-realm-status" class="bc-dev-status">Pilih ranah dan gunakan Tukar Ranah.</small>';
 host.appendChild(box);
 box.querySelector("#bc-dev-apply").onclick=apply;
 box.querySelector("#bc-dev-max").onclick=()=>{
   const r=document.getElementById("bc-dev-realm");const p=document.getElementById("bc-dev-phase");const l=document.getElementById("bc-dev-layer");
   p.value="3";l.value="13";apply();
 };
 }
 const save=read();if(save){
   const r=document.getElementById("bc-dev-realm");const p=document.getElementById("bc-dev-phase");const l=document.getElementById("bc-dev-layer");
   r.value=String(Math.max(0,Math.min(REALMS.length-1,Number(save.realm)||0)));
   p.value=String(Math.max(0,PHASES.indexOf(save.realmPhase)>=0?PHASES.indexOf(save.realmPhase):0));
   l.value=String(Math.max(1,Math.min(13,Number(save.qiLayer)||1)));
 }
}
function start(){
 if(!unlocked())return;
 let n=0;
 const timer=setInterval(()=>{render();if(++n>240)clearInterval(timer)},250);
 const obs=new MutationObserver(()=>render());
 obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["data-state","aria-selected"]});
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();