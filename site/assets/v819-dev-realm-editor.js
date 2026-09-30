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
   if(!unlocked()||!creation())return;
   const b=e.target?.closest?.("button");
   if(!b||!/^Masuki Dunia Kultivasi$/i.test((b.textContent||"").trim()))return;
   setTimeout(()=>{let tries=0;const t=setInterval(()=>{if(applyToSave()||++tries>40)clearInterval(t)},100)},0);
 },true);
}

function render(){
 if(!unlocked()||!creation()){remove();return}
 // Keep the DEV panel outside the main creation grid. The previous commit inserted it
 // as a grid child, which changed the whole character-creation layout.
 const host=document.querySelector(".bc-character-creation");
 const shell=document.querySelector(".bc-creation-shell");
 if(!host||!shell)return;
 let box=document.getElementById("bc-dev-realm-editor");
 if(!box){
   box=document.createElement("section");box.id="bc-dev-realm-editor";
   box.innerHTML='<div class="bc-dev-head"><b>🛠 DEV · Tetapan Ranah Awal</b><small>DEV aktif · hanya muncul dalam Penciptaan Watak</small></div><p class="bc-dev-note">Tetapkan ranah yang akan digunakan selepas watak memasuki dunia. Panel ini tidak muncul selepas masuk ke permainan.</p><div class="bc-dev-grid"><label>Ranah<select id="bc-dev-realm">'+REALMS.map((x,i)=>'<option value="'+i+'">'+(i+1)+". "+x+"</option>").join("")+'</select></label><label>Tahap<select id="bc-dev-phase">'+PHASES.map((x,i)=>'<option value="'+i+'">'+x+"</option>").join("")+'</select></label><label id="bc-dev-layer-wrap">Lapisan Qi<input id="bc-dev-layer" type="number" min="1" max="13" value="1"></label></div><div class="bc-dev-actions"><button type="button" id="bc-dev-arm">✓ Tetapkan Ranah DEV</button></div><small id="bc-dev-realm-status" class="bc-dev-status">Belum ditetapkan.</small>';
   shell.insertAdjacentElement("beforebegin",box);
   box.querySelector("#bc-dev-arm").onclick=()=>{
     const realm=Number(box.querySelector("#bc-dev-realm").value);
     const phase=Number(box.querySelector("#bc-dev-phase").value);
     const layer=realm===1?Math.max(1,Math.min(13,Number(box.querySelector("#bc-dev-layer").value)||1)):1;
     const p={realm,phase,layer};
     setPending(p);
     box.querySelector("#bc-dev-realm-status").textContent="✓ "+REALMS[p.realm]+" · "+PHASES[p.phase]+(p.realm===1?" · Lapisan "+p.layer:"")+" — akan digunakan apabila masuk dunia.";
   };
 }
 const realmEl=box.querySelector("#bc-dev-realm");
 const layerWrap=box.querySelector("#bc-dev-layer-wrap");
 const layerEl=box.querySelector("#bc-dev-layer");
 // Qi Condensation (index 1) is the only realm with Qi Layers 1–13.
 const isQi=Number(realmEl.value)===1;
 layerWrap.hidden=!isQi;
 layerEl.disabled=!isQi;
 if(!isQi) layerEl.value="1";
 const p=pending();
 if(p){
   box.querySelector("#bc-dev-realm").value=String(p.realm);
   box.querySelector("#bc-dev-phase").value=String(p.phase);
   box.querySelector("#bc-dev-layer").value=String(p.layer);
 }
}

function start(){
 armStartHook();
 let last=false;const o=new MutationObserver(()=>{const now=creation();if(now!==last||now)requestAnimationFrame(render);last=now});
 o.observe(document.body,{childList:true,subtree:true});
 let i=0;const t=setInterval(()=>{render();if(++i>240)clearInterval(t)},250);
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();