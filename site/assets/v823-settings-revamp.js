/* Boundless Settings REVAMP — dashboard-first navigation, resilient mounting */
(()=>{"use strict";
const ROOT_ID="bc-settings-revamp";
const tabs=[["display","◉","Paparan","Aksesibiliti, animasi dan paparan dunia"],["game","✦","Permainan","Muzik, audio dan pilihan sesi"],["help","⌘","Help & Tips","Panduan sistem dan mekanik Boundless"],["dev","⚒","DEV","Alat pembangun dan ranah awal"]];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function visible(el){if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0}
function findTabbar(){const all=$$(".bc-settings-tabs");return all.find(visible)||all[0]||null}
function findSheet(tabbar){return tabbar?.closest(".bc-settings-sheet")||tabbar?.closest('[role="dialog"]')||tabbar?.parentElement?.parentElement||null}
function nativeTab(value,scope){return $('[data-value="'+value+'"]',scope?.querySelector(".bc-settings-tabs")||document)}
function panels(scope){if(!scope)return [];const all=$('[role="tabpanel"]',scope);const tabRoot=scope.querySelector(".bc-settings-tabs");if(!tabRoot)return all;const ids=new Set([...(tabRoot.querySelectorAll("[aria-controls]"))].map(el=>el.getAttribute("aria-controls")).filter(Boolean));const related=all.filter(p=>ids.has(p.id)||[...tabRoot.querySelectorAll("[id]")].some(t=>p.getAttribute("aria-labelledby")===t.id));return related.length?related:all}
function setStatus(root,msg){const el=$("[data-revamp-status]",root);if(el)el.textContent=msg}
function hidePanels(scope){for(const p of panels(scope)){p.hidden=true;p.style.display="none";p.setAttribute("aria-hidden","true")}}
function showDashboard(scope,root){hidePanels(scope);root.dataset.view="dashboard";root.hidden=false;root.style.display="block";root.setAttribute("aria-hidden","false");for(const el of $(".bc-revamp-hero,.bc-revamp-section-head,.bc-revamp-grid",root))el.hidden=false;const local=$(".bc-revamp-local-panel",root);if(local)local.hidden=true;setStatus(root,"SESI AKTIF · Pilih satu ruang untuk bermula")}
function enhanceGamePanel(scope){
 const panel=$("#bc-music-manager-mount",scope)?.closest('[role="tabpanel"]')||$("#bc-save-manager-mount",scope)?.closest('[role="tabpanel"]');
 if(!panel)return;
 panel.dataset.bcGameRevamp="true";
 const oldTitle=$(".settings-section-title",panel);if(oldTitle)oldTitle.hidden=true;
 if(!$(".bc-game-revamp-heading",panel)){
  const head=document.createElement("header");head.className="bc-game-revamp-heading";
  head.innerHTML='<div class="bc-game-revamp-kicker">PILIHAN PENGALAMAN</div><h2>Permainan</h2><p>Urus muzik, simpanan dan pilihan sesi di satu tempat.</p><div class="bc-game-revamp-meta"><span>◈ <b>SESI</b> · Tetapan peribadi</span><span>BOUNDLESS / CONTROL</span></div>';
  panel.insertAdjacentElement("afterbegin",head);
 }
 const music=$("#bc-music-manager-mount",panel),save=$("#bc-save-manager-mount",panel);
 if(music&&!music.dataset.bcSectionReady){const h=document.createElement("div");h.className="bc-game-section-heading";h.innerHTML='<span class="bc-game-section-icon">♫</span><span><b>Muzik & Audio</b><small>Pilih runut dan kawal audio permainan.</small></span>';music.insertAdjacentElement("beforebegin",h);music.dataset.bcSectionReady="true"}
 if(save&&!save.dataset.bcSectionReady){const h=document.createElement("div");h.className="bc-game-section-heading bc-game-save-heading";h.innerHTML='<span class="bc-game-section-icon">▣</span><span><b>Simpanan & Pemindahan</b><small>Simpan, muat, eksport atau import kemajuan anda.</small></span>';save.insertAdjacentElement("beforebegin",h);save.dataset.bcSectionReady="true"}
 const tips=[...panel.querySelectorAll('button,[role="switch"],input[type="checkbox"]')].find(el=>/petua konteks/i.test((el.textContent||"")+" "+(el.getAttribute("aria-label")||"")));
 if(tips){const card=tips.closest(".settings-card")||tips.parentElement;if(card)card.classList.add("bc-game-tips-card")}
}
function showContent(scope,root,value){
 root.dataset.view="content:"+value;
 const trigger=nativeTab(value,scope);
 root.hidden=true;root.style.display="none";root.setAttribute("aria-hidden","true");
 const reveal=attempt=>{
  if(root.dataset.view!=="content:"+value)return;
  const list=panels(scope);
  let target=list.find(p=>p.dataset.value===value)||null;
  if(!target&&trigger?.getAttribute("data-state")==="active")target=list.find(p=>p.getAttribute("aria-labelledby")===trigger.id)||null;
  if(!target&&trigger?.id)target=list.find(p=>p.getAttribute("aria-labelledby")===trigger.id)||null;
  if(!target&&trigger?.getAttribute("aria-controls"))target=list.find(p=>p.id===trigger.getAttribute("aria-controls"))||null;
  if(!target)target=list.find(p=>p.dataset.state==="active"&&p.getAttribute("aria-labelledby")===trigger?.id)||null;
  if(!target&&attempt<8){requestAnimationFrame(()=>reveal(attempt+1));return}
  if(!target){root.hidden=false;root.style.display="block";root.setAttribute("aria-hidden","false");showDashboard(scope,root);setStatus(root,"Ruang ini belum dapat dibuka. Cuba sekali lagi.");return}
  for(const p of list){const active=p===target;p.hidden=!active;p.style.display=active?"block":"none";p.setAttribute("aria-hidden",active?"false":"true")}
  if(value==="game")enhanceGamePanel(scope);
  let back=target.querySelector(".bc-revamp-back");
  if(!back){back=document.createElement("button");back.type="button";back.className="bc-revamp-back";back.textContent="← Kembali ke Pusat Tetapan";back.addEventListener("click",()=>showDashboard(scope,root));target.insertAdjacentElement("afterbegin",back)}
 };
 if(trigger){try{const init={bubbles:true,cancelable:true,view:window,button:0,buttons:1};trigger.dispatchEvent(new PointerEvent("pointerdown",{...init,pointerId:1,pointerType:"mouse",isPrimary:true}));trigger.dispatchEvent(new MouseEvent("mousedown",init));trigger.dispatchEvent(new PointerEvent("pointerup",{...init,pointerId:1,pointerType:"mouse",isPrimary:true,buttons:0}));trigger.dispatchEvent(new MouseEvent("mouseup",{...init,buttons:0}));trigger.click();}catch(e){console.warn("[Boundless Settings] Tab activation failed",e);try{trigger.click()}catch(_){}} }
 requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>reveal(0))));
}
function openSave(scope,root){showContent(scope,root,"game");setTimeout(()=>{const target=$("#bc-save-manager-mount",scope);target?.scrollIntoView({behavior:"smooth",block:"start"});target?.classList.add("bc-revamp-focus");setTimeout(()=>target?.classList.remove("bc-revamp-focus"),1400)},250)}
function showLocalPanel(scope,root,id,title,subtitle,body){hidePanels(scope);root.dataset.view="local:"+id;root.hidden=false;root.style.display="block";root.setAttribute("aria-hidden","false");for(const el of $(".bc-revamp-hero,.bc-revamp-section-head,.bc-revamp-grid",root))el.hidden=true;let panel=$(".bc-revamp-local-panel",root);if(!panel){panel=document.createElement("section");panel.className="bc-revamp-local-panel";root.appendChild(panel)}panel.hidden=false;panel.innerHTML='<button type="button" class="bc-revamp-back">← Kembali ke Pusat Tetapan</button><div class="bc-revamp-local-kicker">BOUNDLESS · CONTROL SPACE</div><h2>'+title+'</h2><p class="bc-revamp-local-subtitle">'+subtitle+'</p><div class="bc-revamp-local-body">'+body+'</div>';panel.querySelector(".bc-revamp-back").addEventListener("click",()=>showDashboard(scope,root));setStatus(root,"RUANG DIPILIH · "+title)}
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
function mount(forceDashboard=false){
 const tabbar=findTabbar();if(!tabbar)return false;
 const scope=findSheet(tabbar);if(!scope)return false;
 let root=$("#"+ROOT_ID);
 if(root&&root.closest(".bc-settings-sheet, [role='dialog']")!==scope){root.remove();root=null}
 if(!root){
  root=document.createElement("section");root.id=ROOT_ID;root.setAttribute("aria-label","Pusat tetapan Boundless");
  root.innerHTML='<div class="bc-revamp-hero"><div class="bc-revamp-kicker"><span class="bc-revamp-orbit"></span> BOUNDLESS CULTIVATION · CONTROL HALL</div><div class="bc-revamp-hero-line"><div><h2>Pusat Tetapan</h2><p>Semua kawalan dunia anda, disusun dalam satu ruang.</p></div><div class="bc-revamp-seal" aria-hidden="true">道</div></div><div class="bc-revamp-status" data-revamp-status>SESI AKTIF · Pilih satu ruang untuk bermula</div></div><div class="bc-revamp-section-head"><div><small>PILIH RUANG</small></div></div><div class="bc-revamp-grid" data-revamp-grid></div>';
  tabbar.insertAdjacentElement("beforebegin",root);
  const grid=$("[data-revamp-grid]",root);
  for(const [value,icon,title,desc] of tabs)grid.appendChild(makeCard({id:value,icon,title,desc,tag:"BUKA",action:()=>showContent(scope,root,value)}));
  grid.appendChild(makeCard({id:"save",icon:"▣",title:"Save & Export",desc:"Urus slot, muatkan, eksport dan import kemajuan.",tag:"SIMPANAN",action:()=>openSave(scope,root)}));
  grid.appendChild(makeCard({id:"ai",icon:"✧",title:"AI Control Center",desc:"Pantau simulasi dunia, NPC dan peristiwa aktif.",tag:"SIMULASI",action:()=>openAI(scope,root)}));
  grid.appendChild(makeCard({id:"world",icon:"⌁",title:"Ruang Dunia",desc:"Pusat kawalan wilayah, masa dan keadaan dunia.",tag:"DUNIA",action:()=>showLocalPanel(scope,root,"world","Ruang Dunia","Pusat untuk kawalan dunia Boundless.",'<article class="bc-revamp-feature"><span>01 · WILAYAH</span><h3>Peta & Wilayah</h3><p>Pengurusan peta kekal melalui modul dunia sedia ada. Slot ini disediakan sebagai pintu masuk supaya kawalan wilayah boleh dipusatkan tanpa menggantikan data peta semasa.</p></article><article class="bc-revamp-feature"><span>02 · SIMULASI</span><h3>Masa & Peristiwa</h3><p>Kawalan masa dunia dan peristiwa akan dipautkan kepada sistem simulasi sebenar apabila modulnya tersedia.</p></article>')}));
  grid.appendChild(makeCard({id:"archive",icon:"◇",title:"Arkib & Diagnostik",desc:"Ringkasan versi, keadaan sistem dan panduan pemulihan.",tag:"SISTEM",action:()=>showLocalPanel(scope,root,"archive","Arkib & Diagnostik","Semakan sistem dan rujukan pemulihan.",'<article class="bc-revamp-feature"><span>01 · VERSI</span><h3>Boundless Cultivation</h3><p>Semakan kod dibuat melalui repositori; ruang ini tidak akan mendakwa ujian pelayar atau diagnostik automatik yang belum dijalankan.</p></article><article class="bc-revamp-feature"><span>02 · PEMULIHAN</span><h3>Langkah selamat</h3><p>Jika paparan bermasalah, catat ruang yang dibuka dan tindakan terakhir. Elakkan memadam simpanan permainan ketika menyiasat ralat UI.</p></article>')}));
 }
 tabbar.setAttribute("aria-label","Navigasi tetapan asal");tabbar.style.display="none";if(!root.dataset.view||forceDashboard||root.dataset.view==="dashboard")showDashboard(scope,root);if(root.dataset.view==="content:game")enhanceGamePanel(scope);return true
}
let scheduled=false;function scheduleMount(forceDashboard=false){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount(forceDashboard)})}
function boot(){
 document.addEventListener("click",e=>{const trigger=e.target?.closest?.("button[data-slot='sheet-trigger'],button[aria-haspopup='dialog']");if(trigger&&/tetapan|settings/i.test((trigger.textContent||"")+" "+(trigger.getAttribute("aria-label")||""))){setTimeout(()=>scheduleMount(true),30);setTimeout(()=>scheduleMount(true),150);setTimeout(()=>scheduleMount(true),400)}},true);
 const observer=new MutationObserver(scheduleMount);observer.observe(document.documentElement,{childList:true,subtree:true});scheduleMount();window.__boundlessSettingsRevamp=scheduleMount
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot()
})();