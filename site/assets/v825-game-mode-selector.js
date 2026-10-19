/* Boundless game-mode choice above Lembaran Takdir. The multiplayer option is a saved preference until live-session networking is integrated. */
(()=>{"use strict";
const KEY="boundless-game-mode";
const STYLE_ID="bc-game-mode-selector-style";
function installStyle(){if(document.getElementById(STYLE_ID))return;const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
.bc-mode-choice{margin:0 0 18px;padding:18px;border:1px solid #665832;border-radius:16px;background:radial-gradient(ellipse at 100% 0%,#b69a4112,transparent 40%),linear-gradient(145deg,#101d15,#09110d);color:#efe7d3}
.bc-mode-eyebrow{margin:0 0 7px;color:#d5b96d;font-size:.65rem;font-weight:800;letter-spacing:.18em}
.bc-mode-title{margin:0;color:#f5ecd6;font:clamp(1.2rem,2.6vw,1.65rem) Georgia,"Times New Roman",serif}
.bc-mode-subtitle{margin:7px 0 14px;color:#a9b9ab;font-size:.82rem;line-height:1.6}
.bc-mode-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.bc-mode-option{display:flex;align-items:flex-start;gap:11px;min-width:0;padding:14px;border:1px solid #30483a;border-radius:12px;background:#0b1510;color:#efe7d3;text-align:left;cursor:pointer;transition:border-color .15s,background .15s}
.bc-mode-option:hover,.bc-mode-option:focus-visible{border-color:#b49a54;outline:2px solid #b49a5433;outline-offset:1px}
.bc-mode-option[aria-pressed="true"]{border-color:#c3a75b;background:linear-gradient(135deg,#263322,#111b13);box-shadow:inset 0 0 0 1px #c3a75b33}
.bc-mode-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border:1px solid #665832;border-radius:10px;color:#e0c675;font-size:1.1rem}
.bc-mode-option-copy{display:grid;gap:5px}
.bc-mode-option-copy strong{font-size:.9rem;color:#f4e9d1}
.bc-mode-option-copy small{font-size:.72rem;line-height:1.5;color:#9eafa1}
.bc-mode-status{margin:8px 0 0;color:#d5bd7b;font-size:.68rem;line-height:1.4}
/* Balanced proportions: compact mode picker, wider destiny sheet. */
.bc-creation-form-column{display:grid;grid-template-columns:minmax(0,1fr);align-content:start;min-width:0}.bc-mode-choice{padding:12px;margin-bottom:12px;border-radius:13px}
.bc-mode-eyebrow{margin-bottom:4px;font-size:.59rem;letter-spacing:.14em}
.bc-mode-title{font-size:clamp(1.05rem,1.8vw,1.35rem)}
.bc-mode-subtitle{margin:4px 0 9px;font-size:.74rem;line-height:1.4}
.bc-mode-options{gap:8px}
.bc-mode-option{gap:8px;padding:9px;border-radius:10px}
.bc-mode-icon{width:29px;height:29px;border-radius:8px;font-size:.95rem}
.bc-mode-option-copy{gap:3px}
.bc-mode-option-copy strong{font-size:.82rem}
.bc-mode-option-copy small{font-size:.66rem;line-height:1.35}
@media(min-width:1024px){.bc-creation-shell{grid-template-columns:minmax(260px,.52fr) minmax(0,1.48fr)!important;column-gap:1.5rem!important}.bc-creation-shell>.dao-card{min-width:0}.bc-creation-shell>.bc-mode-choice{min-width:0}}
@media(max-width:520px){.bc-mode-options{grid-template-columns:1fr}.bc-mode-choice{padding:11px}.bc-mode-option{padding:10px}}
`;document.head.appendChild(s)}
function mount(){const all=[...document.querySelectorAll("h2,h3,[data-slot='card-title']")];const heading=all.find(el=>(el.textContent||"").trim()==="Lembaran Takdir");if(!heading)return false;const card=heading.closest(".dao-card")||heading.closest("[data-slot='card']")||heading.parentElement?.parentElement;if(!card||!card.parentElement)return false;if(document.querySelector(".bc-mode-choice")){document.documentElement.classList.add("bc-layout-ready");return true}installStyle();
const box=document.createElement("section");box.className="bc-mode-choice";box.setAttribute("aria-labelledby","bc-mode-title");box.innerHTML='<p class="bc-mode-eyebrow">LANGKAH 01 · JENIS PERMAINAN</p><h2 class="bc-mode-title" id="bc-mode-title">Pilih Game Mode</h2><p class="bc-mode-subtitle">Pilih cara anda mahu memulakan perjalanan di Boundless.</p><div class="bc-mode-options"><button type="button" class="bc-mode-option" data-game-mode="singleplayer" aria-pressed="false"><span class="bc-mode-icon" aria-hidden="true">◈</span><span class="bc-mode-option-copy"><strong>Singleplayer</strong><small>Main sendiri pada sesi permainan ini.</small></span></button><button type="button" class="bc-mode-option" data-game-mode="multiplayer" aria-pressed="false"><span class="bc-mode-icon" aria-hidden="true">♧</span><span class="bc-mode-option-copy"><strong>Multiplayer</strong><small>Masuk ke gerbang dalam talian yang sama dengan pemain lain.</small></span></button></div><p class="bc-mode-status" aria-live="polite"></p>';
card.parentElement.insertBefore(box,card);const column=document.createElement("div");column.className="bc-creation-form-column";card.parentElement.insertBefore(column,box);column.append(box,card);
const serverPanel=document.createElement("div");serverPanel.className="bc-server-picker";serverPanel.hidden=true;serverPanel.innerHTML='<label class="bc-server-label" for="bc-server-select">Pilih Server</label><select id="bc-server-select" class="bc-server-select" aria-label="Pilih server multiplayer"><option value="" selected>Pilih server…</option><option value="server-1">Server 1 · Gateway Dalam Talian</option></select><p class="bc-server-empty" aria-live="polite">Pilih Server 1 untuk menyertai ruang dalam talian bersama pemain lain.</p>';box.appendChild(serverPanel);
const serverStyle=document.createElement("style");serverStyle.textContent='.bc-server-picker{margin-top:12px;padding:12px;border:1px solid #665832;border-radius:11px;background:#09130f}.bc-server-picker[hidden]{display:none}.bc-server-label{display:block;margin-bottom:7px;color:#d5b96d;font-size:.76rem;font-weight:700}.bc-server-select{display:block;width:100%;min-height:40px;padding:8px 10px;border:1px solid #30483a;border-radius:8px;background:#101d15;color:#efe7d3;font:inherit}.bc-server-empty{margin:7px 0 0;color:#9eafa1;font-size:.7rem;line-height:1.4}';document.head.appendChild(serverStyle);
const buttons=[...box.querySelectorAll("[data-game-mode]")],status=box.querySelector(".bc-mode-status");
let current="singleplayer";try{const saved=localStorage.getItem(KEY);if(saved==="singleplayer"||saved==="multiplayer")current=saved}catch(_){}
function choose(mode){current=mode;try{localStorage.setItem(KEY,mode)}catch(_){}box.dataset.gameMode=mode;buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.gameMode===mode)));serverPanel.hidden=mode!=="multiplayer";status.textContent=mode==="singleplayer"?"Dipilih: Singleplayer. Pilihan disimpan pada peranti ini.":"Dipilih: Multiplayer. Pilih Server 1 untuk masuk ke gerbang dalam talian.";if(mode==="singleplayer")window.__boundlessServer1Gateway?.leave();window.__boundlessGameMode=mode;window.dispatchEvent(new CustomEvent("boundless-game-mode-change",{detail:{mode}}))}
buttons.forEach(b=>b.addEventListener("click",()=>choose(b.dataset.gameMode)));const serverSelect=serverPanel.querySelector("#bc-server-select"),serverNote=serverPanel.querySelector(".bc-server-empty");try{serverSelect.value=localStorage.getItem("boundless-selected-server")||""}catch(_){}serverSelect.addEventListener("change",()=>{try{localStorage.setItem("boundless-selected-server",serverSelect.value)}catch(_){}if(serverSelect.value==="server-1"){serverNote.textContent="Menyambung ke Server 1…";window.dispatchEvent(new CustomEvent("boundless-server-selected",{detail:{serverId:"server-1"}}));window.__boundlessServer1Gateway?.connect()}else{serverNote.textContent="Pilih Server 1 untuk menyertai ruang dalam talian bersama pemain lain.";window.__boundlessServer1Gateway?.leave()}});choose(current);document.documentElement.classList.add("bc-layout-ready");return true}
function boot(){if(mount())return;const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),20000)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();