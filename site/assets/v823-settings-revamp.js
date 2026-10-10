/* Boundless Settings REVAMP — original dashboard layer */
(()=>{"use strict";
const ROOT_ID="bc-settings-revamp";
const tabs=[["display","◈","Paparan","Rupa, gerakan dan kebolehbacaan"],["game","✦","Permainan","Muzik, save dan pilihan permainan"],["help","⌘","Help & Tips","Panduan sistem Boundless"],["dev","⚒","DEV","Alat pembangun dan ranah awal"]];
function sheet(){return document.querySelector(".bc-settings-sheet")}
function nativeTab(value){return document.querySelector('.bc-settings-tabs [data-value="'+value+'"]')}
function activate(value){const t=nativeTab(value);if(t)t.click()}
function setStatus(root,msg){const el=root?.querySelector("[data-revamp-status]");if(el)el.textContent=msg}
function openSave(){activate("game");setTimeout(()=>{const target=document.getElementById("bc-save-manager-mount");target?.scrollIntoView({behavior:"smooth",block:"start"});target?.classList.add("bc-revamp-focus");setTimeout(()=>target?.classList.remove("bc-revamp-focus"),1400)},120)}
function openAI(){
 const show=()=>{const p=document.getElementById("boundless-ai-panel");if(p){p.hidden=false;p.style.display="block";p.style.visibility="visible";p.style.pointerEvents="auto";p.style.zIndex="2147483647";p.scrollIntoView?.({behavior:"smooth",block:"start"});try{window.BoundlessAI?.engine?.renderUI?.()}catch(e){console.warn("[Boundless AI]",e)}}else setStatus(document.getElementById(ROOT_ID),"AI Control Center sedang dimuat. Cuba sekali lagi sebentar lagi.")};
 if(window.BoundlessAI){show();return}
 let s=document.querySelector('script[data-boundless-ai-loader="lazy"]');
 if(!s){s=document.createElement("script");s.src="/Boundless-Cultivation/assets/v816-ai-world.js?v=8.2.5-ai-control";s.defer=true;s.dataset.boundlessAiLoader="lazy";s.onload=()=>setTimeout(show,0);s.onerror=()=>setStatus(document.getElementById(ROOT_ID),"AI Control Center gagal dimuat. Semak sambungan dan cuba lagi.");document.head.appendChild(s)}
 else {s.addEventListener("load",show,{once:true});if(window.BoundlessAI)show()}
}
function makeCard({id,icon,title,desc,action,disabled=false,tag=""}){
 const b=document.createElement("button");b.type="button";b.className="bc-revamp-card";b.dataset.action=id;b.disabled=disabled;
 b.innerHTML='<span class="bc-revamp-card-top"><span class="bc-revamp-icon" aria-hidden="true">'+icon+'</span><span class="bc-revamp-tag">'+tag+'</span></span><strong>'+title+'</strong><span class="bc-revamp-desc">'+desc+'</span><span class="bc-revamp-arrow" aria-hidden="true">↗</span>';
 if(action)b.addEventListener("click",action);return b
}
function mount(){
 const panel=sheet(),tabbar=panel?.querySelector(".bc-settings-tabs");
 if(!panel||!tabbar||panel.querySelector("#"+ROOT_ID))return;
 const root=document.createElement("section");root.id=ROOT_ID;root.setAttribute("aria-label","Pusat tetapan Boundless");
 root.innerHTML='<div class="bc-revamp-hero"><div class="bc-revamp-kicker"><span class="bc-revamp-orbit"></span> BOUNDLESS CULTIVATION · CONTROL HALL</div><div class="bc-revamp-hero-line"><div><h2>Pusat Tetapan</h2><p>Semua kawalan dunia anda, disusun dalam satu ruang.</p></div><div class="bc-revamp-seal" aria-hidden="true">道</div></div><div class="bc-revamp-status" data-revamp-status>SESI AKTIF <span>·</span> Tetapan disimpan pada peranti ini</div></div><div class="bc-revamp-section-head"><div><small>PILIH RUANG</small><h3>Kawalan utama</h3></div><span>01 — 08</span></div><div class="bc-revamp-grid" data-revamp-grid></div><div class="bc-revamp-foot"><span class="bc-revamp-foot-mark">B</span><span><b>BOUNDLESS</b><small>Setiap perubahan membentuk perjalanan anda.</small></span><span class="bc-revamp-build">SETTINGS REVAMP</span></div>';
 const grid=root.querySelector("[data-revamp-grid]");
 tabs.insertAdjacentElement("beforebegin",root);
 for(const [value,icon,title,desc] of tabs)grid.appendChild(makeCard({id:value,icon,title,desc,tag:"OPEN",action:()=>activate(value)}));
 grid.appendChild(makeCard({id:"save",icon:"▣",title:"Save & Export",desc:"Urus slot, muat, eksport atau import kemajuan.",tag:"SAVE",action:openSave}));
 grid.appendChild(makeCard({id:"ai",icon:"🧠",title:"AI Control Center",desc:"Pantau simulasi dunia, NPC dan peristiwa aktif.",tag:"AI",action:openAI}));
 grid.appendChild(makeCard({id:"future-world",icon:"⌁",title:"Ruang Dunia",desc:"Slot masa depan untuk kawalan dunia lanjutan.",tag:"AKAN DATANG",disabled:true}));
 grid.appendChild(makeCard({id:"future-data",icon:"◇",title:"Arkib & Diagnostik",desc:"Slot masa depan untuk alat data dan diagnostik.",tag:"AKAN DATANG",disabled:true}));
 tabbar.setAttribute("aria-label","Navigasi tetapan asal");
}
function boot(){
 const tryMount=()=>{mount();};
 document.addEventListener("click",e=>{
  const trigger=e.target?.closest?.("button[data-slot='sheet-trigger'],button[aria-haspopup='dialog']");
  if(trigger&&/tetapan|settings/i.test((trigger.textContent||"")+" "+(trigger.getAttribute("aria-label")||""))){setTimeout(tryMount,40);setTimeout(tryMount,180);setTimeout(tryMount,450)}
  if(e.target?.closest?.("#"+ROOT_ID+" [data-action='ai']")){}
 },true);
 tryMount();
 window.__boundlessSettingsRevamp=tryMount;
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
