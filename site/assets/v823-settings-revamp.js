/* Boundless Settings REVAMP — dashboard-first navigation, resilient mounting */
(()=>{"use strict";
const ROOT_ID="bc-settings-revamp";
const tabs=[["display","◉","Paparan","Aksesibiliti, animasi dan paparan dunia"],["game","✦","Permainan","Muzik, audio dan pilihan sesi"],["help","⌘","Help & Tips","Panduan sistem dan mekanik Boundless"],["dev","⚒","DEV","Alat pembangun dan ranah awal"]];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function visible(el){if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0}
function findTabbar(){const all=$$(".bc-settings-tabs");return all.find(visible)||all[0]||null}
function findSheet(tabbar){return tabbar?.closest(".bc-settings-sheet")||tabbar?.closest('[role="dialog"]')||tabbar?.parentElement?.parentElement||null}
function nativeTab(value,scope){const bar=scope?.querySelector(".bc-settings-tabs");if(!bar)return null;const labels={display:/paparan/i,game:/permainan/i,help:/help\s*&?\s*tips|bantuan/i,dev:/dev/i};return [...bar.querySelectorAll("button,[role=\"tab\"]")].find(el=>labels[value]?.test((el.textContent||"").trim()))||null}
function panels(scope){if(!scope)return [];const all=$$('[role="tabpanel"]',scope);const tabRoot=scope.querySelector(".bc-settings-tabs");if(!tabRoot)return all;const ids=new Set([...(tabRoot.querySelectorAll("[aria-controls]"))].map(el=>el.getAttribute("aria-controls")).filter(Boolean));const related=all.filter(p=>ids.has(p.id)||[...tabRoot.querySelectorAll("[id]")].some(t=>p.getAttribute("aria-labelledby")===t.id));return related.length?related:all}
function setStatus(root,msg){const el=$("[data-revamp-status]",root);if(el)el.textContent=msg}
function hidePanels(scope){for(const p of panels(scope)){p.hidden=true;p.style.display="none";p.setAttribute("aria-hidden","true")}}
function showDashboard(scope,root){hidePanels(scope);root.dataset.view="dashboard";root.hidden=false;root.style.display="block";root.setAttribute("aria-hidden","false");for(const el of $$(".bc-revamp-hero,.bc-revamp-section-head,.bc-revamp-grid",root))el.hidden=false;const local=$(".bc-revamp-local-panel",root);if(local)local.hidden=true;setStatus(root,"SESI AKTIF · Pilih satu ruang untuk bermula")}
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
function enhanceNativePanel(scope,value){
 const list=panels(scope);
 const panel=list.find(p=>p.dataset.value===value)||list.find(p=>p.getAttribute("aria-labelledby")===nativeTab(value,scope)?.id);
 if(!panel)return;
 panel.dataset.bcRevampPanel=value;
 const meta={display:["PAPARAN & KEBOLEHCAPAIAN","Sesuaikan cara Boundless dipaparkan tanpa mengubah kemajuan permainan.","PAPARAN"],game:["PENGALAMAN PERMAINAN","Kawal petua, muzik dan pengurusan sesi daripada satu ruang.","PERMAINAN"],help:["PANDUAN PENGEMBARA","Rujukan untuk peluang akar, kultivasi, keluarga, dunia dan sistem permainan.","RUJUKAN"],dev:["KAWALAN PEMBANGUN","Alat ujian kekal di sebalik kunci DEV dan tidak mengubah peluang pemain biasa.","AKSES TERHAD"]}[value];
 if(!meta)return;
 const oldTitle=$(".settings-section-title",panel);if(oldTitle)oldTitle.hidden=true;
 if(!$(".bc-native-panel-hero",panel)){
  const head=document.createElement("header");head.className="bc-native-panel-hero";
  const titles={display:"Paparan",game:"Permainan",help:"Help & Tips",dev:"DEV"};
  head.innerHTML='<div class="bc-native-panel-kicker">'+meta[0]+'</div><h2>'+titles[value]+'</h2><p>'+meta[1]+'</p><span class="bc-native-panel-mark">'+meta[2]+'</span>';
  panel.insertAdjacentElement("afterbegin",head);
 }
 if(value==="display"){panel.classList.add("bc-panel-display");panel.querySelectorAll(".settings-card").forEach((card,i)=>card.dataset.bcSettingIndex=String(i+1))}
 if(value==="game")enhanceGamePanel(scope);
 if(value==="help"){panel.classList.add("bc-panel-help");panel.querySelectorAll(".settings-card").forEach(card=>card.classList.add("bc-help-card"))}
 if(value==="dev"){panel.classList.add("bc-panel-dev");panel.querySelectorAll(".settings-card").forEach(card=>card.classList.add("bc-dev-card"))}
}
function fallbackCopy(text,root){const area=document.createElement("textarea");area.value=text;area.setAttribute("readonly","");area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();let ok=false;try{ok=document.execCommand("copy")}catch(_){}area.remove();setStatus(root,ok?"LAPORAN DISALIN":"Salin laporan secara manual tidak tersedia dalam pelayar ini")}
function showDiagnostics(scope,root){
 const rows=[["Antara muka","Skrip tetapan dimuat",!!window.__boundlessSettingsRevamp],["Enjin AI","Modul AI telah dimuat",!!window.BoundlessAI],["Pengurus simpanan","Mount simpanan tersedia",!!$("#bc-save-manager-mount",scope)],["Pengurus muzik","Mount muzik tersedia",!!$("#bc-music-manager-mount",scope)],["Penyimpanan pelayar","localStorage boleh dicapai",(()=>{try{const k="__bc_diag__";localStorage.setItem(k,"1");localStorage.removeItem(k);return true}catch(_){return false}})()],["Paparan","Sokongan ResizeObserver",typeof ResizeObserver==="function"]];
 const list=rows.map(([name,detail,ok])=>'<div class="bc-diag-row"><span class="bc-diag-indicator '+(ok?"is-ok":"is-warn")+'"></span><span class="bc-diag-copy"><b>'+name+'</b><small>'+detail+'</small></span><strong class="bc-diag-state">'+(ok?"TERSEDIA":"SEMAK")+'</strong></div>').join("");
 showLocalPanel(scope,root,"archive","Arkib & Diagnostik","Semakan asas persekitaran pelayar pada sesi ini. Pemeriksaan ini tidak mengubah atau memadam simpanan.",'<div class="bc-diag-summary"><span class="bc-diag-summary-number">'+rows.filter(r=>r[2]).length+' / '+rows.length+'</span><span><b>Pemeriksaan tersedia</b><small>Semakan setempat · bukan ujian penuh permainan</small></span></div><div class="bc-diag-list">'+list+'</div><div class="bc-revamp-feature"><span>PEMULIHAN SELAMAT</span><h3>Sebelum melaporkan ralat</h3><p>Catat slot yang ditekan, hasil yang muncul dan langkah terakhir. Jangan padam data pelayar atau simpanan sebagai langkah pertama.</p><button type="button" class="bc-local-action" data-copy-diagnostics>Salin laporan diagnostik</button></div>');
 const btn=$("[data-copy-diagnostics]",root);
 btn?.addEventListener("click",()=>{const report=["Boundless Cultivation · Diagnostik",...rows.map(r=>r[0]+": "+r[1]+" — "+(r[2]?"TERSEDIA":"SEMAK"))].join("\n");if(navigator.clipboard?.writeText)navigator.clipboard.writeText(report).then(()=>setStatus(root,"LAPORAN DISALIN")).catch(()=>fallbackCopy(report,root));else fallbackCopy(report,root)});
}
function showContent(scope,root,value){
 root.dataset.view="content:"+value;
 const trigger=nativeTab(value,scope);
 root.hidden=true;root.style.display="none";root.setAttribute("aria-hidden","true");
 const reveal=attempt=>{
  if(root.dataset.view!=="content:"+value)return;
  const list=panels(scope);
  const triggerList=[...scope.querySelectorAll(".bc-settings-tabs button,.bc-settings-tabs [role=tab]")];
  const tabIndex=trigger?triggerList.indexOf(trigger):-1;
  let target=list.find(p=>p.dataset.value===value)||null;
  if(!target&&trigger?.getAttribute("aria-controls"))target=list.find(p=>p.id===trigger.getAttribute("aria-controls"))||null;
  if(!target&&trigger?.id)target=list.find(p=>p.getAttribute("aria-labelledby")===trigger.id)||null;
  if(!target)target=list.find(p=>p.dataset.state==="active"||p.getAttribute("data-state")==="active")||null;
  if(!target&&tabIndex>=0&&list[tabIndex])target=list[tabIndex];
  if(!target&&attempt<12){requestAnimationFrame(()=>reveal(attempt+1));return}
  if(!target){root.hidden=false;root.style.display="block";root.setAttribute("aria-hidden","false");showDashboard(scope,root);setStatus(root,"Panel asal tidak dikenal pasti. Navigasi dipulihkan; cuba slot sekali lagi.");return}
  for(const p of list){const active=p===target;p.hidden=!active;p.style.display=active?"block":"none";p.removeAttribute("inert");p.setAttribute("aria-hidden",active?"false":"true")}
  if(value==="game")delete target.dataset.bcSaveOnly;
  enhanceNativePanel(scope,value);
  if(value==="dev"){
   window.dispatchEvent(new CustomEvent("boundless-open-dev"));
   window.__boundlessSyncDevRealm?.();
  }
  let back=target.querySelector(".bc-revamp-back");
  if(!back){back=document.createElement("button");back.type="button";back.className="bc-revamp-back";back.textContent="← Kembali ke Pusat Tetapan";back.addEventListener("click",()=>showDashboard(scope,root));target.insertAdjacentElement("afterbegin",back)}
 };
 if(trigger){try{const init={bubbles:true,cancelable:true,view:window,button:0,buttons:1};trigger.focus();trigger.dispatchEvent(new MouseEvent("mousedown",init));trigger.click();}catch(e){console.warn("[Boundless Settings] Tab activation failed",e);try{trigger.click()}catch(_){}} }
 requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>reveal(0))));
}
function openSave(scope,root){showContent(scope,root,"game");setTimeout(()=>{const panel=$("#bc-save-manager-mount",scope)?.closest("[role=\"tabpanel\"]");if(panel){panel.dataset.bcSaveOnly="true";const target=$("#bc-save-manager-mount",scope);target?.scrollIntoView({behavior:"smooth",block:"start"});target?.classList.add("bc-revamp-focus");setTimeout(()=>target?.classList.remove("bc-revamp-focus"),1400)}},320)}
function showLocalPanel(scope,root,id,title,subtitle,body){hidePanels(scope);root.dataset.view="local:"+id;root.hidden=false;root.style.display="block";root.setAttribute("aria-hidden","false");for(const el of $$(".bc-revamp-hero,.bc-revamp-section-head,.bc-revamp-grid",root))el.hidden=true;let panel=$(".bc-revamp-local-panel",root);if(!panel){panel=document.createElement("section");panel.className="bc-revamp-local-panel";root.appendChild(panel)}panel.hidden=false;panel.innerHTML='<button type="button" class="bc-revamp-back">← Kembali ke Pusat Tetapan</button><div class="bc-revamp-local-kicker">BOUNDLESS · CONTROL SPACE</div><h2>'+title+'</h2><p class="bc-revamp-local-subtitle">'+subtitle+'</p><div class="bc-revamp-local-body">'+body+'</div>';panel.querySelector(".bc-revamp-back").addEventListener("click",()=>showDashboard(scope,root));panel.querySelector("[data-open-ai]")?.addEventListener("click",()=>openAI(scope,root));setStatus(root,"RUANG DIPILIH · "+title)}
function openAI(scope,root){
 showLocalPanel(scope,root,"ai","🧠 Dunia AI Boundless","Pantau event Jianghu, sertai peristiwa dan baca berita NPC AI dalam ruang tetapan ini.",'<div class="bc-ai-tab-host" data-bc-ai-tab-host><p class="bc-ai-loading">Memuatkan simulasi AI Boundless…</p></div>');
 const mount=()=>{
  const host=$("[data-bc-ai-tab-host]",root),p=$("#boundless-ai-panel");
  if(!host){return}
  if(!p){setStatus(root,"Panel AI belum tersedia. Cuba buka semula tab Dunia AI.");return}
  p.classList.add("bc-ai-embedded");
  p.hidden=false;
  p.removeAttribute("aria-hidden");
  p.style.setProperty("position","relative","important");
  p.style.setProperty("inset","auto","important");
  p.style.setProperty("right","auto","important");
  p.style.setProperty("bottom","auto","important");
  p.style.setProperty("width","100%","important");
  p.style.setProperty("max-width","none","important");
  p.style.setProperty("max-height","none","important");
  p.style.setProperty("height","auto","important");
  p.style.setProperty("overflow","visible","important");
  p.style.setProperty("z-index","1","important");
  p.style.setProperty("margin","0","important");
  p.style.setProperty("box-sizing","border-box","important");
  host.replaceChildren(p);
  try{window.BoundlessAI?.engine?.renderUI?.()}catch(e){console.warn("[Boundless AI]",e)}
  setStatus(root,"RUANG DIPILIH · Dunia AI Boundless");
 };
 if(window.BoundlessAI){mount();return}
 let script=$('script[data-boundless-ai-loader="lazy"]');
 if(!script){
  script=document.createElement("script");
  script.src="/Boundless-Cultivation/assets/v816-ai-world.js?v=8.2.6-ai-tab";
  script.defer=true;
  script.dataset.boundlessAiLoader="lazy";
  script.onload=()=>setTimeout(mount,0);
  script.onerror=()=>{const host=$("[data-bc-ai-tab-host]",root);if(host)host.innerHTML='<p class="bc-ai-loading">AI Control Center gagal dimuat. Semak sambungan dan cuba lagi.</p>';setStatus(root,"AI Control Center gagal dimuat.")};
  document.head.appendChild(script);
 }else{
  script.addEventListener("load",mount,{once:true});
  if(window.BoundlessAI)mount();
 }
}
function ensureAiTabStyle(){
 let style=$("#bc-ai-tab-style");
 if(!style){style=document.createElement("style");style.id="bc-ai-tab-style";style.textContent=`
 .bc-ai-tab-host{width:100%;min-width:0}
 #boundless-ai-panel.bc-ai-embedded{display:block!important;position:relative!important;inset:auto!important;width:100%!important;max-width:none!important;max-height:none!important;height:auto!important;overflow:visible!important;z-index:1!important;margin:0!important;border-radius:14px!important;box-shadow:none!important}
 #boundless-ai-panel.bc-ai-embedded .bai-head{position:sticky;top:0;z-index:2;background:#09120f}
 #boundless-ai-panel.bc-ai-embedded .bai-events,#boundless-ai-panel.bc-ai-embedded .bai-news{max-height:none}
 .bc-ai-loading{padding:16px;border:1px solid #29443a;border-radius:10px;color:#9fb4a8}
 `;document.head.appendChild(style)}
}
function mountAccountCenter(scope,root){
 const body='<section class="bc-account-center"><div class="bc-account-center-hero"><span class="bc-account-center-seal">♙</span><div><div class="bc-account-kicker">IDENTITI · PENYELARASAN</div><h3>Pusat Akaun</h3><p>Satu akaun untuk mengakses kemajuan Boundless pada peranti lain melalui backup awan.</p></div></div><div class="bc-account-state" data-account-state><span class="bc-account-state-dot"></span><span data-account-state-text>Memeriksa status akaun…</span></div><form class="bc-account-form" data-account-form><label>Username<input name="username" autocomplete="username" minlength="3" maxlength="24" pattern="[a-zA-Z0-9_]{3,24}" placeholder="nama_pemain" required></label><label>Kata laluan<input name="password" type="password" autocomplete="current-password" minlength="8" placeholder="Sekurang-kurangnya 8 aksara" required></label><div class="bc-account-form-meta">3–24 aksara untuk username · minimum 8 aksara untuk kata laluan</div><div class="bc-account-form-actions"><button type="submit" data-account-mode="login">Log masuk</button><button type="submit" data-account-mode="signup" class="is-secondary">Daftar akaun</button></div></form><div class="bc-account-cloud" data-account-cloud hidden><div><b>Backup awan</b><p>Upload simpanan peranti ini atau pulihkan simpanan yang tersimpan pada akaun.</p></div><div class="bc-account-cloud-actions"><button type="button" data-account-action="backup">Backup Awan</button><button type="button" data-account-action="restore" class="is-secondary">Pulihkan Backup</button><button type="button" data-account-action="logout" class="is-danger">Log keluar</button></div></div><p class="bc-account-message" data-account-message role="status" aria-live="polite">Mod tetamu kekal tersedia. Akaun adalah pilihan.</p><div class="bc-account-notes"><b>Perkara penting</b><ul><li>Save tempatan kekal pada peranti ini.</li><li>Untuk pindah peranti, log masuk pada kedua-dua peranti dan gunakan Backup Awan / Pulihkan Backup.</li><li>Jika Supabase belum dikonfigurasi oleh pemilik permainan, log masuk dan backup awan belum boleh digunakan.</li></ul></div></section>';
 showLocalPanel(scope,root,"account","Akaun & Login","Urus identiti pemain dan simpanan awan.",'<div data-account-center-host>'+body+'</div>');
 const host=$("[data-account-center-host]",root);if(!host)return;
 let style=$("#bc-account-center-style");if(!style){style=document.createElement("style");style.id="bc-account-center-style";style.textContent='.bc-account-center{display:grid;gap:18px;max-width:900px}.bc-account-center-hero{display:flex;gap:16px;align-items:center;padding:22px;border:1px solid #66542f;border-radius:16px;background:linear-gradient(120deg,#18271e,#101913 70%)}.bc-account-center-seal{display:grid;place-items:center;flex:0 0 56px;height:56px;border:1px solid #b79a56;border-radius:14px;color:#e4c879;font-size:28px}.bc-account-kicker{font-size:10px;letter-spacing:.18em;color:#c7a85e}.bc-account-center h3{margin:5px 0;color:#f3e6c4;font:26px Georgia,serif}.bc-account-center-hero p,.bc-account-cloud p{margin:5px 0 0;color:#aabbb0;font-size:13px;line-height:1.6}.bc-account-state{display:flex;align-items:center;gap:10px;padding:13px 15px;border:1px solid #2d493b;border-radius:10px;background:#0b1711;color:#d8e4da;font-size:13px}.bc-account-state-dot{width:9px;height:9px;border-radius:50%;background:#d0ae58;box-shadow:0 0 0 4px #d0ae581c}.bc-account-form{display:grid;gap:13px;padding:20px;border:1px solid #2b4337;border-radius:14px;background:#0b1510}.bc-account-form label{display:grid;gap:7px;color:#d5dfd7;font-size:13px}.bc-account-form input{box-sizing:border-box;width:100%;min-height:44px;padding:10px 12px;border:1px solid #3a5547;border-radius:8px;background:#07100c;color:#f5ecd5;outline:none}.bc-account-form input:focus{border-color:#c4a45b;box-shadow:0 0 0 3px #c4a45b22}.bc-account-form-meta{font-size:11px;color:#879b8d}.bc-account-form-actions,.bc-account-cloud-actions{display:flex;gap:9px;flex-wrap:wrap}.bc-account-center button{min-height:40px;padding:9px 14px;border:1px solid #b49750;border-radius:8px;background:#c0a15a;color:#10170f;font-weight:700;cursor:pointer}.bc-account-center button.is-secondary{border-color:#3a5547;background:#14231a;color:#dbe5dc}.bc-account-center button.is-danger{border-color:#784941;background:#281814;color:#efb5a7}.bc-account-center button:disabled{opacity:.55;cursor:wait}.bc-account-cloud{display:grid;gap:14px;padding:20px;border:1px solid #2b493a;border-radius:14px;background:#0d1b13}.bc-account-cloud b{color:#e3d09a}.bc-account-message{margin:0;padding:13px 15px;border-left:3px solid #b99a53;background:#111b14;color:#c6d4c9;font-size:13px;line-height:1.6;overflow-wrap:anywhere}.bc-account-message[data-error=true]{border-left-color:#bc6959;color:#f0b7a9}.bc-account-notes{padding:17px;border:1px solid #273c31;border-radius:12px;color:#9fb2a5;font-size:12px;line-height:1.7}.bc-account-notes>b{color:#d9c17f}.bc-account-notes ul{margin:8px 0 0;padding-left:18px}.bc-account-form[hidden],.bc-account-cloud[hidden]{display:none!important}';document.head.appendChild(style)}
 const form=$("[data-account-form]",host),message=$("[data-account-message]",host),stateText=$("[data-account-state-text]",host),cloud=$("[data-account-cloud]",host);
 const say=(msg,error=false)=>{message.textContent=msg;message.dataset.error=error?"true":"false"};
 const refresh=()=>{const api=window.__boundlessAccountService;if(!api){stateText.textContent="Modul akaun sedang dimuatkan. Muat semula halaman jika berterusan.";return false}const s=api.status();stateText.textContent=s.user?"Log masuk sebagai "+s.user:s.configured?"Belum log masuk · mod tetamu aktif":"Supabase belum dikonfigurasi · mod tetamu aktif";cloud.hidden=!s.user;form.hidden=!!s.user;return true};
 refresh();setTimeout(refresh,500);setTimeout(refresh,1600);
 form?.addEventListener("click",e=>{const b=e.target.closest("[data-account-mode]");if(b)form.dataset.mode=b.dataset.accountMode});
 form?.addEventListener("submit",async e=>{e.preventDefault();const api=window.__boundlessAccountService;if(!api){say("Modul akaun belum tersedia. Cuba muat semula halaman.",true);return}const data=new FormData(form),username=data.get("username"),password=data.get("password"),mode=form.dataset.mode||"login",btns=[...form.querySelectorAll("button")];btns.forEach(b=>b.disabled=true);say(mode==="signup"?"Sedang mendaftarkan akaun…":"Sedang log masuk…");try{await api.authenticate(username,password,mode);say(mode==="signup"?"Pendaftaran berjaya. Semak status backup awan di bawah.":"Log masuk berjaya. Semak status backup awan di bawah.");form.reset();refresh()}catch(err){say(err?.message||"Operasi akaun gagal.",true)}finally{btns.forEach(b=>b.disabled=false)}});
 host.addEventListener("click",async e=>{const b=e.target.closest("[data-account-action]");if(!b)return;const api=window.__boundlessAccountService;if(!api){say("Modul akaun belum tersedia.",true);return}const action=b.dataset.accountAction;b.disabled=true;try{if(action==="backup"){await api.backup();say("Backup awan selesai.")}else if(action==="restore"){await api.restore();say("Permintaan pemulihan selesai. Muat semula permainan jika backup berjaya dipulihkan.")}else if(action==="logout"){await api.logout();say("Log keluar berjaya. Save tempatan tidak dipadam.")}refresh()}catch(err){say(err?.message||"Operasi gagal.",true)}finally{b.disabled=false}});
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
  grid.appendChild(makeCard({id:"account",icon:"♙",title:"Akaun & Login",desc:"Pusat akaun baharu, log masuk dan backup awan.",tag:"AKAUN",action:()=>mountAccountCenter(scope,root)}));
  grid.appendChild(makeCard({id:"save",icon:"▣",title:"Save & Export",desc:"Urus slot, muatkan, eksport dan import kemajuan.",tag:"SIMPANAN",action:()=>openSave(scope,root)}));
  grid.appendChild(makeCard({id:"ai",icon:"✧",title:"AI Control Center",desc:"Pantau simulasi dunia, NPC dan peristiwa aktif.",tag:"SIMULASI",action:()=>openAI(scope,root)}));
  grid.appendChild(makeCard({id:"world",icon:"⌁",title:"Ruang Dunia",desc:"Pusat maklumat dunia, simulasi dan kitaran permainan.",tag:"DUNIA",action:()=>showLocalPanel(scope,root,"world","Ruang Dunia","Ringkasan sistem dunia dan pintu masuk ke kawalan simulasi yang tersedia.",'<article class="bc-revamp-feature"><span>01 · SIMULASI</span><h3>AI & Simulasi Dunia</h3><p>Buka pusat simulasi untuk menyemak alat NPC dan sistem dunia yang dimuatkan dalam sesi ini.</p><button type="button" class="bc-local-action" data-open-ai>✧ Buka AI Control Center</button></article><article class="bc-revamp-feature"><span>02 · KITARAN DUNIA</span><h3>Masa, peristiwa & aktiviti</h3><p>Peristiwa dunia bergantung pada modul permainan yang sedang aktif. Panel ini tidak mengubah masa atau mencipta peristiwa secara palsu.</p></article><article class="bc-revamp-feature"><span>03 · PETA</span><h3>Peta & wilayah</h3><p>Peta permainan kekal pada modul peta sedia ada. Slot ini tidak menggantikan data peta atau menulis perubahan tanpa tindakan yang jelas.</p></article><article class="bc-revamp-feature"><span>04 · KESELAMATAN</span><h3>Perubahan terkawal</h3><p>Gunakan editor peta yang tersedia dalam permainan atau repositori. Jangan ubah fail peta utama hanya untuk menyelesaikan masalah paparan Settings.</p></article>')}));grid.appendChild(makeCard({id:"archive",icon:"◇",title:"Arkib & Diagnostik",desc:"Semakan persekitaran dan panduan pemulihan.",tag:"SISTEM",action:()=>showDiagnostics(scope,root)}));
 }
 tabbar.setAttribute("aria-label","Navigasi tetapan asal");tabbar.style.display="none";if(!root.dataset.view||forceDashboard||root.dataset.view==="dashboard")showDashboard(scope,root);if(root.dataset.view==="content:game")enhanceGamePanel(scope);return true
}
let scheduled=false;function scheduleMount(forceDashboard=false){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount(forceDashboard)})}
function boot(){
 document.addEventListener("click",e=>{const trigger=e.target?.closest?.("button[data-slot='sheet-trigger'],button[aria-haspopup='dialog']");if(trigger&&/tetapan|settings/i.test((trigger.textContent||"")+" "+(trigger.getAttribute("aria-label")||""))){setTimeout(()=>scheduleMount(true),30);setTimeout(()=>scheduleMount(true),150);setTimeout(()=>scheduleMount(true),400)}},true);
 const observer=new MutationObserver(()=>scheduleMount(false));observer.observe(document.documentElement,{childList:true,subtree:true});scheduleMount();window.__boundlessSettingsRevamp=scheduleMount
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot()
})();