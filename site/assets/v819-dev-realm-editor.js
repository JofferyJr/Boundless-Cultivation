/* Boundless Cultivation — DEV-only Cultivation Realm Editor
 * IMPORTANT: The editor belongs to the in-game Settings > Dev tab.
 * It is never rendered on Character Creation.
 * DEV must have been unlocked through the existing character-creation Dev flow.
 */
(()=>{"use strict";
const DEV_KEY="boundless-dev-mode",SAVE_KEY="boundless-save";
const REALMS=["Body Refinement","Qi Condensation","Foundation Establishment","Core Formation","Nascent Soul","Soul Transformation","Void Refinement","Dao Integration","Tribulation Transcendence","Immortal Ascension"];
const PHASES=["Tahap Awal","Tahap Pertengahan","Tahap Akhir","Kesempurnaan Agung"];
const unlocked=()=>sessionStorage.getItem(DEV_KEY)==="1";
const read=()=>{try{return JSON.parse(localStorage.getItem(SAVE_KEY)||"null")}catch{return null}};
const write=o=>localStorage.setItem(SAVE_KEY,JSON.stringify(o));
const reload=()=>typeof window.__boundlessLoadCurrent==="function"?window.__boundlessLoadCurrent():location.reload();

function settingsRoot(){return [...document.querySelectorAll(".bc-settings-tabs")].find(t=>{const s=getComputedStyle(t);return s.display!=="none"&&s.visibility!=="hidden"})}
function devActive(){
 const t=settingsRoot();if(!t)return false;
 const a=[...t.querySelectorAll('[role="tab"]')].find(x=>x.getAttribute("aria-selected")==="true"||x.dataset.state==="active");
 return !!a&&/dev/i.test(a.textContent||"");
}
function panel(){
 const t=settingsRoot();if(!t)return null;const root=t.parentElement;
 return [...root.querySelectorAll('[role="tabpanel"]')].find(p=>p.getAttribute("data-state")==="active"&&getComputedStyle(p).display!=="none")||[...root.querySelectorAll('[role="tabpanel"]')].find(p=>getComputedStyle(p).display!=="none")||null;
}
function remove(){document.getElementById("bc-dev-realm-editor")?.remove()}
function apply(){
 const save=read();if(!save){alert("Tiada save Boundless aktif.");return}
 const r=Number(document.getElementById("bc-dev-realm")?.value||0),p=Number(document.getElementById("bc-dev-phase")?.value||0),q=Math.max(1,Math.min(13,Number(document.getElementById("bc-dev-layer")?.value||1)));
 save.realm=r;save.realmPhase=PHASES[p]||PHASES[0];save.qiLayer=q;save.gameVersion=save.gameVersion||"8.2";write(save);
 const st=document.getElementById("bc-dev-realm-status");if(st)st.textContent="✓ "+REALMS[r]+" · "+save.realmPhase+" · Lapisan "+q;
 setTimeout(reload,80);
}
function render(){
 if(!unlocked()||!devActive()){remove();return}
 const host=panel();if(!host){remove();return}
 let box=document.getElementById("bc-dev-realm-editor");
 if(!box){box=document.createElement("section");box.id="bc-dev-realm-editor";box.innerHTML='<div class="bc-dev-head"><b>🛠 Dev · Tukar Ranah Kultivasi</b><small>DEV aktif · hanya untuk ujian pemain semasa</small></div><p class="bc-dev-note">Panel ini hanya muncul dalam permainan apabila DEV telah diaktifkan. Ia tidak muncul pada Penciptaan Watak.</p><div class="bc-dev-grid"><label>Ranah<select id="bc-dev-realm">'+REALMS.map((x,i)=>'<option value="'+i+'">'+(i+1)+'. '+x+'</option>').join("")+'</select></label><label>Tahap<select id="bc-dev-phase">'+PHASES.map((x,i)=>'<option value="'+i+'">'+x+'</option>').join("")+'</select></label><label>Lapisan Qi<input id="bc-dev-layer" type="number" min="1" max="13" value="1"></label></div><div class="bc-dev-actions"><button type="button" id="bc-dev-apply">⚡ Tukar Ranah</button><button type="button" id="bc-dev-max">⟐ Kesempurnaan Agung</button></div><small id="bc-dev-realm-status" class="bc-dev-status">Pilih ranah dan tekan Tukar Ranah.</small>';host.appendChild(box);
 box.querySelector("#bc-dev-apply").onclick=apply;box.querySelector("#bc-dev-max").onclick=()=>{box.querySelector("#bc-dev-phase").value="3";box.querySelector("#bc-dev-layer").value="13";apply()}
 }
 const s=read();if(s){box.querySelector("#bc-dev-realm").value=String(Math.max(0,Math.min(REALMS.length-1,Number(s.realm)||0)));const pi=Math.max(0,PHASES.indexOf(s.realmPhase));box.querySelector("#bc-dev-phase").value=String(pi);box.querySelector("#bc-dev-layer").value=String(Math.max(1,Math.min(13,Number(s.qiLayer)||1)))}
}
function start(){if(!unlocked())return;const o=new MutationObserver(()=>render());o.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["data-state","aria-selected","aria-expanded"]});let i=0;const t=setInterval(()=>{render();if(++i>300)clearInterval(t)},250);render()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();