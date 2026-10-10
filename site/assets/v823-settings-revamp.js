/* Boundless Settings REVAMP — dashboard-first navigation, resilient mounting */
(()=>{"use strict";
const ROOT_ID="bc-settings-revamp";
const tabs=[["display","◈","Paparan","Rupa, gerakan dan kebolehbacaan"],["game","✦","Permainan","Muzik, save dan pilihan permainan"],["help","⌘","Help & Tips","Panduan sistem Boundless"],["dev","⚒","DEV","Alat pembangun dan ranah awal"]];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function visible(el){if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0}
function findTabbar(){const all=$$(".bc-settings-tabs");return all.find(visible)||all[0]||null}
function findSheet(tabbar){return tabbar?.closest(".bc-settings-sheet")||tabbar?.closest('[role="dialog"]')||tabbar?.parentElement?.parentElement||null}
function nativeTab(value,scope){return $('[data-value="'+value+'"]',scope?.querySelector(".bc-settings-tabs")||document)}
function panels(scope){const tabRoot=scope?.querySelector(".bc-settings-tabs")?.parentElement;let list=tabRoot?$$('[role="tabpanel"]',tabRoot):[];if(!list.length&&scope)list=$$('[role="tabpanel"]',scope);return list}
function setStatus(root,msg){const el=$("[data-revamp-status]",root);if(el)el.textContent=msg}
function hidePanels(scope){for(const p of panels(scope)){p.hidden=true;p.style.display="none";p.setAttribute("aria-hidden","true")}}
function showDashboard(scope,root){hidePanels(scope);root.hidden=false;root.style.display="block";root.setAttribute("aria-hidden","false")}
function showContent(scope,root,value){
 const trigger=nativeTab(value,scope);if(trigger)trigger.click();
 root.hidden=true;root.style.display="none";root.setAttribute("aria-hidden","true");
 const list=panels(scope);let target=list.find(p=>p.dataset.value===value)||null;
 if(!target){const active=list.find(p=>p.dataset.state==="active");if(active)target=active}
 for(const p of list){const active=p===target;p.hidden=!active;p.style.display=active?"block":"none";p.setAttribute("aria-hidden",active?"false":"true")}
 if(!target){root.hidden=false;root.style.display="block";root.setAttribute("aria-hidden","false");setStatus(root,"Ruang ini belum dapat dibuka. Cuba sekali lagi.");return}
 let back=target.querySelector(".bc-revamp-back");
 if(!back){back=document.createElement("button");back.type="button";back.className="bc-revamp-back";back.textContent="← Kembali ke Pusat Tetapan";back.addEventListener("click",()=>showDashboard(scope,root));target.insertAdjacentElement("afterbegin",back)}
}
function openSave(scope,root){showContent(scope,root,"game");setTimeout(()=>{const target=$("#bc-save-manager-mount",scope);target?.scrollIntoView({behavior:"smooth",block:"start"});target?.classList.add("bc-revamp-focus");setTimeout(()=>target?.classList.remove("bc-revamp-focus"),1400)},150)}
function openAI(scope,root){
 showDashboard(scope,root);
 const show=()=>{const p=$("#boundless-ai-panel");if(p){p.hidden=false;p.style.display="block";p.style.visibility="visible";p.style.pointerEvents="auto";p.style.zIndex="2147483647";p.scrollIntoView?.({behavior:"smooth",block:"start"});try{window.BoundlessAI?.engine?.renderUI?.()}catch(e){console.warn("[Boundless AI]",e)}}else setStatus(root,"AI Control Center sedang dimuat. Cuba sekali lagi sebentar lagi.")};
 if(window.BoundlessAI){show();return}
 let s=$('script[data-boundless-ai-loader="lazy"]');
 if(!s){s=document.createElement("script");s.src="/Boundless-Cultivation/assets/v816-ai-world.js?v=8.2.5-ai-control";s.defer=true;s.dataset.boundlessAiLoader="lazy";s.onload=()=>setTimeout(show,0);s.onerror=()=>setStatus(root,"AI Control Center gagal dimuat. Semak sambungan dan cuba lagi.");document.head.appendChild(s)}
 else{s.addEventListener("load",show,{once:true});if(window.BoundlessAI)show()}
}
function makeCard({id,icon,title,desc,tag,action,disabled=false}){
 const b=document.createElement("button");b.type="button";b.className="bc-revamp-card";b.dataset.action=id;b.disabled=disabled;
 b.innerHTML='<span class="bc-revamp-card-top"><span class="bc-revamp-icon" aria-hidden="true">'+icon+'</span><span class="bc-revamp-tag">'+tag+'</span></span><strong>'+title+'</strong><span class="bc-revamp-desc">'+desc+'</span><span class="bc-revamp-arrow" aria-hidden="true">↗</span>';
 if(action)b.addEventListener("click",action);return b
}
function mount(){
 const tabbar=findTabbar();if(!tabbar)return false;
 const scope=findSheet(tabbar);if(!scope)return false;
 let root=$("#"+ROOT_ID);
 if(root&&root.closest(".bc-settings-sheet, [role='dialog']")!==scope){root.remove();root=null}
 if(!root){
  root=document.createElement("section");root.id=ROOT_ID;root.setAttribute("aria-label","Pusat tetapan Boundless");
  root.innerHTML='<div class="bc-revamp-hero"><div class="bc-revamp-kicker"><span class="bc-revamp-orbit"></span> BOUNDLESS CULTIVATION · CONTROL HALL</div><div class="bc-revamp-hero-line"><div><h2>Pusat Tetapan</h2><p>Semua kawalan dunia anda, disusun dalam satu ruang.</p></div><div class="bc-revamp-seal" aria-hidden="true">道</div></div><div class="bc-revamp-status" data-revamp-status>SESI AKTIF · Pilih satu ruang untuk bermula</div></div><div class="bc-revamp-section-head"><div><small>PILIH RUANG</small><h3>Kawalan utama</h3></div><span>08 RUANG</span></div><div class="bc-revamp-grid" data-revamp-grid></div><div class="bc-revamp-foot"><span class="bc-revamp-foot-mark">B</span><span><b>BOUNDLESS</b><small>Setiap perubahan membentuk perjalanan anda.</small></span><span class="bc-revamp-build">SETTINGS REVAMP</span></div>';
  tabbar.insertAdjacentElement("beforebegin",root);
  const grid=$("[data-revamp-grid]",root);
  for(const [value,icon,title,desc] of tabs)grid.appendChild(makeCard({id:value,icon,title,desc,tag:"BUKA",action:()=>showContent(scope,root,value)}));
  grid.appendChild(makeCard({id:"save",icon:"▣",title:"Save & Export",desc:"Urus slot, muat, eksport atau import kemajuan.",tag:"SAVE",action:()=>openSave(scope,root)}));
  grid.appendChild(makeCard({id:"ai",icon:"🧠",title:"AI Control Center",desc:"Pantau simulasi dunia, NPC dan peristiwa aktif.",tag:"AI",action:()=>openAI(scope,root)}));
  grid.appendChild(makeCard({id:"future-world",icon:"⌁",title:"Ruang Dunia",desc:"Slot masa depan untuk kawalan dunia lanjutan.",tag:"AKAN DATANG",disabled:true}));
  grid.appendChild(makeCard({id:"future-data",icon:"◇",title:"Arkib & Diagnostik",desc:"Slot masa depan untuk alat data dan diagnostik.",tag:"AKAN DATANG",disabled:true}));
 }
 tabbar.setAttribute("aria-label","Navigasi tetapan asal");tabbar.style.display="none";showDashboard(scope,root);return true
}
let scheduled=false;function scheduleMount(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount()})}
function boot(){
 document.addEventListener("click",e=>{const trigger=e.target?.closest?.("button[data-slot='sheet-trigger'],button[aria-haspopup='dialog']");if(trigger&&/tetapan|settings/i.test((trigger.textContent||"")+" "+(trigger.getAttribute("aria-label")||""))){setTimeout(scheduleMount,30);setTimeout(scheduleMount,150);setTimeout(scheduleMount,400)}},true);
 const observer=new MutationObserver(scheduleMount);observer.observe(document.documentElement,{childList:true,subtree:true});scheduleMount();window.__boundlessSettingsRevamp=scheduleMount
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot()
})();