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
 if(value==="dev"&&!["dev","admin"].includes(window.__boundlessSpecialAccountRole)){showDashboard(scope,root);setStatus(root,"Akses DEV memerlukan tingkatan akaun khas DEV atau ADMIN.");return}
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
 const body='<section class="bc-account-panel"><div class="bc-account-status" data-account-state-text>Memeriksa status akaun…</div><form data-account-form><label>Username<input name="username" autocomplete="username" minlength="3" maxlength="24" pattern="[a-zA-Z0-9_]{3,24}" required placeholder="nama_pemain"></label><label>Kata laluan<input name="password" type="password" autocomplete="current-password" minlength="8" required placeholder="Minimum 8 aksara"></label><div class="bc-account-actions"><button type="submit" data-account-mode="login">Log masuk</button><button type="submit" data-account-mode="signup" class="secondary">Daftar akaun</button></div></form><section class="bc-account-tier" data-account-tier hidden><h3>Tingkatan Akaun</h3><p class="bc-account-tier-current" data-tier-current>Memuatkan tingkatan…</p><p class="bc-account-special-role" data-special-role hidden></p><p class="bc-account-tier-exp" data-tier-exp></p><p class="bc-account-tier-achievements" data-tier-achievements></p><form data-tier-request-form><label>Mohon tingkatan seterusnya<select name="tier"><option value="cultivator">Cultivator</option><option value="immortal">Immortal</option></select></label><label>Nota permohonan (pilihan)<input name="note" maxlength="500" placeholder="Pencapaian atau sebab permohonan"></label><button type="submit">Hantar permohonan</button></form><p class="bc-account-tier-review" data-tier-review></p><p data-tier-requirements></p></section><section class="bc-account-admin" data-account-admin hidden><h3>Panel Admin Akaun</h3><p>Ganjaran dan kelulusan direkodkan pada pelayan. EXP memerlukan ID rujukan unik untuk mengelakkan pendua.</p><label>Akaun sasaran<select data-admin-user required></select></label><form data-admin-exp-form><h4>Berikan EXP Akaun</h4><label>Jumlah EXP<input name="amount" type="number" min="1" max="1000000" required value="100"></label><label>Sebab/kod<input name="reason" maxlength="80" required placeholder="quest_complete"></label><label>ID rujukan unik<input name="reference" maxlength="160" required placeholder="event-id-unik"></label><button type="submit">Berikan EXP</button></form><form data-admin-achievement-form><h4>Berikan Pencapaian</h4><label>Kod pencapaian<input name="code" maxlength="100" pattern="[a-zA-Z0-9_.:-]{2,100}" required placeholder="first_quest"></label><button type="submit">Rekod pencapaian</button></form><form data-admin-review-form><h4>Permohonan menunggu</h4><label>Permohonan<select name="request" data-admin-request required></select></label><label>Nota admin (pilihan)<input name="note" maxlength="500" placeholder="Sebab penolakan atau catatan"></label><div class="bc-account-actions"><button type="button" data-admin-review="approve">Luluskan</button><button type="button" data-admin-review="reject" class="secondary">Tolak</button></div></form><form data-admin-requirements-form><h4>Syarat kenaikan</h4><label>Tingkatan<select name="tier"><option value="cultivator">Mortal → Cultivator</option><option value="immortal">Cultivator → Immortal</option></select></label><label>EXP minimum<input name="exp" type="number" min="0" required></label><label>Pencapaian minimum<input name="achievements" type="number" min="0" max="10000" required></label><button type="submit">Simpan syarat</button></form><p data-admin-status role="status" aria-live="polite"></p></section><section class="bc-account-cloud" data-account-cloud hidden><h3>Backup awan</h3><p>Simpan kemajuan akaun anda di awan atau pulihkan simpanan yang tersedia.</p><button type="button" data-account-action="backup">Backup Awan</button><button type="button" data-account-action="restore" class="secondary">Pulihkan Backup</button><button type="button" data-account-action="logout" class="danger">Log keluar</button></section><p class="bc-account-message" data-account-message role="status" aria-live="polite">Save tempatan tidak terjejas.</p><small>Backup awan memerlukan konfigurasi Supabase. Mod tetamu dan save tempatan kekal tersedia.</small><p><a class="bc-account-setup-link" href="https://github.com/JofferyJr/Boundless-Cultivation/blob/main/docs/SUPABASE-AUTH-SETUP.md" target="_blank" rel="noopener noreferrer">Panduan sambungan Supabase ↗</a></p></section>';
 showLocalPanel(scope,root,"account","Akaun & Login","Urus akaun Boundless, sesi log masuk dan backup awan di dalam ruang Tetapan.",body);
 const panel=$(".bc-revamp-local-panel",root),account=panel?.querySelector(".bc-account-panel");if(!account)return;
 if(!document.getElementById("bc-account-panel-style")){const style=document.createElement("style");style.id="bc-account-panel-style";style.textContent='.bc-account-panel{display:grid;gap:16px;max-width:900px}.bc-account-panel form,.bc-account-panel .bc-account-status,.bc-account-panel .bc-account-cloud,.bc-account-panel .bc-account-message{box-sizing:border-box;padding:16px;border:1px solid #304637;border-radius:12px;background:#0b1711;color:#f0e6d0}.bc-account-panel form{display:grid;gap:12px}.bc-account-panel label{display:grid;gap:6px;font-size:13px}.bc-account-panel input{box-sizing:border-box;width:100%;min-height:44px;padding:10px;border:1px solid #405746;border-radius:8px;background:#06100b;color:#f5ecd5}.bc-account-panel button{margin:3px;padding:10px 14px;border:1px solid #b49750;border-radius:8px;background:#c0a15a;color:#10170f;font-weight:700;cursor:pointer}.bc-account-panel button.secondary{border-color:#3a5547;background:#14231a;color:#dbe5dc}.bc-account-panel button.danger{border-color:#784941;background:#281814;color:#efb5a7}.bc-account-panel [hidden]{display:none!important}.bc-account-panel h3{margin:0 0 8px;color:#e8cf83}.bc-account-panel small{color:#9eafa1;line-height:1.6}.bc-account-panel [data-account-message]{overflow-wrap:anywhere}.bc-account-tier{box-sizing:border-box;padding:16px;border:1px solid #77663b;border-radius:12px;background:linear-gradient(135deg,#191b12,#0b1711);color:#f0e6d0}.bc-account-tier h3{margin:0 0 10px;color:#e8cf83}.bc-account-tier form{margin-top:12px;padding:12px;border-color:#4d4931}.bc-account-tier select{box-sizing:border-box;width:100%;min-height:42px;padding:8px;border:1px solid #405746;border-radius:8px;background:#06100b;color:#f5ecd5}.bc-account-tier [data-tier-review]{color:#d9c98f}.bc-account-admin{box-sizing:border-box;padding:16px;border:1px solid #8c7540;border-radius:12px;background:#11150f;color:#f0e6d0}.bc-account-admin h3,.bc-account-admin h4{color:#e8cf83;margin:0 0 10px}.bc-account-admin form{margin-top:12px;padding:12px;border-color:#51472e}.bc-account-admin select,.bc-account-admin input{box-sizing:border-box;width:100%;min-height:40px;padding:8px;border:1px solid #405746;border-radius:8px;background:#06100b;color:#f5ecd5}.bc-account-panel .bc-account-setup-link{color:#e8cf83;text-decoration:underline;text-underline-offset:3px}';document.head.appendChild(style)}
 const form=account.querySelector("[data-account-form]"),status=account.querySelector("[data-account-state-text]"),cloud=account.querySelector("[data-account-cloud]"),message=account.querySelector("[data-account-message]");
 const say=(t,err=false)=>{message.textContent=t;message.style.borderColor=err?"#a6534a":"#304637"};
 const tierBox=account.querySelector("[data-account-tier]"),tierCurrent=account.querySelector("[data-tier-current]"),tierExp=account.querySelector("[data-tier-exp]"),tierAchievements=account.querySelector("[data-tier-achievements]"),tierReview=account.querySelector("[data-tier-review]"),tierForm=account.querySelector("[data-tier-request-form]");
 const adminBox=account.querySelector("[data-account-admin]"),tierRequirements=account.querySelector("[data-tier-requirements]"),adminStatus=account.querySelector("[data-admin-status]"),adminUser=account.querySelector("[data-admin-user]"),adminRequest=account.querySelector("[data-admin-request]");
 const refresh=()=>{const api=window.__boundlessAccountService;if(!api){status.textContent="Modul akaun belum dimuatkan. Muat semula halaman.";return}try{const state=api.status();status.textContent=state.user?"Log masuk sebagai "+state.user:state.configured?"Belum log masuk · mod tetamu aktif":"Supabase belum dikonfigurasi · mod tetamu aktif";cloud.hidden=!state.user;tierBox.hidden=!state.user;form.hidden=!!state.user;if(state.user&&api.accountProgress){api.accountProgress().then(async result=>{const {progress,achievements,requirements,isAdmin,isDev,specialRole}=result;if(!account.isConnected)return;window.__boundlessAccountTierRequirements=requirements||[];window.__boundlessSpecialAccountRole=specialRole||null;adminBox.hidden=!isAdmin;const specialLabel=account.querySelector("[data-special-role]");if(specialLabel){specialLabel.hidden=!(isAdmin||isDev);specialLabel.textContent=specialRole==="dev"?"TINGKAT KHAS · DEV · AKSES PENUH":isAdmin?"TINGKAT KHAS · ADMIN":isDev?"TINGKAT KHAS · DEV":"";}const names={mortal:"Mortal",cultivator:"Cultivator",immortal:"Immortal"};tierCurrent.textContent="Tingkatan semasa: "+(names[progress?.account_tier]||"Mortal");tierExp.textContent="EXP akaun: "+Number(progress?.account_exp||0).toLocaleString();tierAchievements.textContent="Pencapaian direkodkan: "+achievements.length;tierRequirements.textContent=(requirements||[]).map(r=>(names[r.tier]||r.tier)+": "+Number(r.minimum_exp).toLocaleString()+" EXP + "+r.minimum_achievements+" pencapaian").join(" · ");tierReview.textContent=progress?.request_status==="pending"?"Permohonan "+(names[progress?.requested_tier]||progress?.requested_tier)+" sedang menunggu semakan admin.":progress?.request_status==="approved"?"Permohonan terakhir diluluskan.":progress?.request_status==="rejected"?"Permohonan terakhir ditolak.":"";if(isAdmin){try{const adminData=await api.adminList();if(!account.isConnected)return;const selected=adminUser.value;adminUser.replaceChildren();for(const u of adminData.accounts||[]){const o=document.createElement("option");o.value=u.user_id;o.textContent=u.username+" · "+u.user_id.slice(0,8);adminUser.append(o)}if([...adminUser.options].some(o=>o.value===selected))adminUser.value=selected;const selectedRequest=adminRequest.value;adminRequest.replaceChildren();for(const p of adminData.pending||[]){const o=document.createElement("option");o.value=p.user_id;o.textContent=p.username+" → "+(names[p.requested_tier]||p.requested_tier)+" ("+Number(p.account_exp).toLocaleString()+" EXP)";adminRequest.append(o)}if([...adminRequest.options].some(o=>o.value===selectedRequest))adminRequest.value=selectedRequest;if(!adminRequest.options.length){const o=document.createElement("option");o.value="";o.textContent="Tiada permohonan menunggu";adminRequest.append(o)}const reqForm=account.querySelector("[data-admin-requirements-form]");const reqTier=reqForm?.elements.tier;const chosen=(requirements||[]).find(r=>r.tier===reqTier?.value)||requirements?.[0];if(chosen&&reqForm){reqForm.elements.exp.value=chosen.minimum_exp;reqForm.elements.achievements.value=chosen.minimum_achievements}}catch(err){if(adminStatus)adminStatus.textContent=err?.message||"Panel admin tidak dapat dimuatkan."}}if(tierForm){const tierSelect=tierForm.elements.tier;if(tierSelect){tierSelect.disabled=false;tierForm.querySelector("button").disabled=false;tierSelect.querySelectorAll("option").forEach(option=>option.removeAttribute("disabled"));if(progress?.account_tier==="mortal"){tierSelect.value="cultivator";tierSelect.querySelector("option[value=immortal]")?.setAttribute("disabled","")}else if(progress?.account_tier==="cultivator"){tierSelect.value="immortal";tierSelect.querySelector("option[value=cultivator]")?.setAttribute("disabled","")}else{tierSelect.disabled=true;tierForm.querySelector("button").disabled=true}}}}).catch(err=>{tierCurrent.textContent="Data tingkatan tidak dapat dimuatkan.";tierReview.textContent=err?.message||"Cuba semula kemudian."})}}catch(err){status.textContent="Status akaun tidak dapat dibaca: "+(err?.message||"ralat tidak diketahui")}};
 refresh();window.setTimeout(()=>{if(account.isConnected)refresh()},800);
 form.addEventListener("click",e=>{const b=e.target.closest("[data-account-mode]");if(b)form.dataset.mode=b.dataset.accountMode});
 tierForm?.addEventListener("submit",async e=>{e.preventDefault();const api=window.__boundlessAccountService;if(!api?.requestAccountTier){say("Modul tingkatan belum tersedia.",true);return}const data=new FormData(tierForm),button=tierForm.querySelector("button[type=submit]");if(button)button.disabled=true;try{await api.requestAccountTier(data.get("tier"),data.get("note"));say("Permohonan tingkatan dihantar untuk semakan admin.");tierForm.reset();refresh()}catch(err){say(err?.message||"Permohonan gagal.",true)}finally{if(button)button.disabled=false}});
 const adminExpForm=account.querySelector("[data-admin-exp-form]"),adminAchievementForm=account.querySelector("[data-admin-achievement-form]"),adminReviewForm=account.querySelector("[data-admin-review-form]"),adminRequirementsForm=account.querySelector("[data-admin-requirements-form]");
 const adminRun=async fn=>{if(!window.__boundlessAccountService)return;try{adminStatus.textContent="Memproses…";const result=await fn();adminStatus.textContent=result?.message||"Berjaya.";refresh()}catch(err){adminStatus.textContent=err?.message||"Operasi admin gagal."}};
 adminExpForm?.addEventListener("submit",e=>{e.preventDefault();const d=new FormData(adminExpForm);adminRun(()=>window.__boundlessAccountService.adminAwardExp(adminUser.value,Number(d.get("amount")),d.get("reason"),d.get("reference"))).then(()=>adminExpForm.reset())});
 adminAchievementForm?.addEventListener("submit",e=>{e.preventDefault();const d=new FormData(adminAchievementForm);adminRun(()=>window.__boundlessAccountService.adminAwardAchievement(adminUser.value,d.get("code"))).then(()=>adminAchievementForm.reset())});
 adminReviewForm?.querySelectorAll("[data-admin-review]").forEach(b=>b.addEventListener("click",()=>{if(!adminRequest.value){adminStatus.textContent="Tiada permohonan dipilih.";return}const d=new FormData(adminReviewForm);adminRun(()=>window.__boundlessAccountService.adminReview(adminRequest.value,b.dataset.adminReview,d.get("note")))}));
 adminRequirementsForm?.elements.tier.addEventListener("change",()=>{const requirements=window.__boundlessAccountTierRequirements||[];const r=requirements.find(x=>x.tier===adminRequirementsForm.elements.tier.value);if(r){adminRequirementsForm.elements.exp.value=r.minimum_exp;adminRequirementsForm.elements.achievements.value=r.minimum_achievements}});
 adminRequirementsForm?.addEventListener("submit",e=>{e.preventDefault();const d=new FormData(adminRequirementsForm);adminRun(()=>window.__boundlessAccountService.adminSetRequirements(d.get("tier"),d.get("exp"),d.get("achievements")))});
 form.addEventListener("submit",async e=>{e.preventDefault();const api=window.__boundlessAccountService;if(!api){say("Modul akaun belum tersedia. Muat semula halaman.",true);return}const data=new FormData(form),buttons=[...form.querySelectorAll("button")];buttons.forEach(b=>b.disabled=true);say("Sedang memproses…");try{await api.authenticate(data.get("username"),data.get("password"),form.dataset.mode||"login");say("Berjaya.");form.reset();refresh()}catch(err){say(err?.message||"Operasi akaun gagal.",true)}finally{buttons.forEach(b=>b.disabled=false)}});
 account.addEventListener("click",async e=>{const b=e.target.closest("[data-account-action]");if(!b)return;const api=window.__boundlessAccountService;if(!api){say("Modul akaun belum tersedia.",true);return}b.disabled=true;try{if(b.dataset.accountAction==="backup")await api.backup();if(b.dataset.accountAction==="restore")await api.restore();if(b.dataset.accountAction==="logout")await api.logout();say("Permintaan selesai.");refresh()}catch(err){say(err?.message||"Operasi gagal.",true)}finally{b.disabled=false}});
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
 tabbar.setAttribute("aria-label","Navigasi tetapan asal");tabbar.style.display="none";if(!root.dataset.view||forceDashboard||root.dataset.view==="dashboard")showDashboard(scope,root);if(root.dataset.view==="content:game")enhanceGamePanel(scope);syncSpecialRole(root);return true
}
async function syncSpecialRole(root){const card=root?.querySelector('[data-action="dev"]');if(!card)return;const api=window.__boundlessAccountService;if(!api?.accountProgress){card.hidden=true;return}try{const state=api.status();if(!state.user){window.__boundlessSpecialAccountRole=null;card.hidden=true;return}const result=await api.accountProgress();window.__boundlessSpecialAccountRole=result.specialRole||null;card.hidden=!(result.isDev||result.isAdmin)}catch(_){card.hidden=true}}
let scheduled=false;function scheduleMount(forceDashboard=false){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount(forceDashboard)})}
function boot(){
 document.addEventListener("click",e=>{const trigger=e.target?.closest?.("button[data-slot='sheet-trigger'],button[aria-haspopup='dialog']");if(trigger&&/tetapan|settings/i.test((trigger.textContent||"")+" "+(trigger.getAttribute("aria-label")||""))){setTimeout(()=>scheduleMount(true),30);setTimeout(()=>scheduleMount(true),150);setTimeout(()=>scheduleMount(true),400)}},true);
 const observer=new MutationObserver(()=>scheduleMount(false));observer.observe(document.documentElement,{childList:true,subtree:true});scheduleMount();window.__boundlessSettingsRevamp=scheduleMount
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot()
})();