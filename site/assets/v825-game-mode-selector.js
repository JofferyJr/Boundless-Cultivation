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
.bc-mode-status{margin:12px 0 0;color:#d5bd7b;font-size:.72rem;line-height:1.5}
@media(max-width:520px){.bc-mode-options{grid-template-columns:1fr}.bc-mode-choice{padding:14px}}
`;document.head.appendChild(s)}
function mount(){const all=[...document.querySelectorAll("h2,h3,[data-slot='card-title']")];const heading=all.find(el=>(el.textContent||"").trim()==="Lembaran Takdir");if(!heading)return false;const card=heading.closest(".dao-card")||heading.closest("[data-slot='card']")||heading.parentElement?.parentElement;if(!card||!card.parentElement)return false;if(document.querySelector(".bc-mode-choice"))return true;installStyle();
const box=document.createElement("section");box.className="bc-mode-choice";box.setAttribute("aria-labelledby","bc-mode-title");box.innerHTML='<p class="bc-mode-eyebrow">LANGKAH 01 · JENIS PERMAINAN</p><h2 class="bc-mode-title" id="bc-mode-title">Pilih Game Mode</h2><p class="bc-mode-subtitle">Pilih cara anda mahu memulakan perjalanan di Boundless.</p><div class="bc-mode-options"><button type="button" class="bc-mode-option" data-game-mode="singleplayer" aria-pressed="false"><span class="bc-mode-icon" aria-hidden="true">◈</span><span class="bc-mode-option-copy"><strong>Singleplayer</strong><small>Main sendiri pada sesi permainan ini.</small></span></button><button type="button" class="bc-mode-option" data-game-mode="multiplayer" aria-pressed="false"><span class="bc-mode-icon" aria-hidden="true">♧</span><span class="bc-mode-option-copy"><strong>Multiplayer</strong><small>Pilihan mod berbilang pemain; sambungan sesi masa nyata belum diaktifkan.</small></span></button></div><p class="bc-mode-status" aria-live="polite"></p>';
card.parentElement.insertBefore(box,card);
const buttons=[...box.querySelectorAll("[data-game-mode]")],status=box.querySelector(".bc-mode-status");
let current="singleplayer";try{const saved=localStorage.getItem(KEY);if(saved==="singleplayer"||saved==="multiplayer")current=saved}catch(_){}
function choose(mode){current=mode;try{localStorage.setItem(KEY,mode)}catch(_){}box.dataset.gameMode=mode;buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.gameMode===mode)));status.textContent=mode==="singleplayer"?"Dipilih: Singleplayer. Pilihan disimpan pada peranti ini.":"Dipilih: Multiplayer. Pilihan disimpan, tetapi permainan dalam talian masa nyata belum tersedia.";window.__boundlessGameMode=mode;window.dispatchEvent(new CustomEvent("boundless-game-mode-change",{detail:{mode}}))}
buttons.forEach(b=>b.addEventListener("click",()=>choose(b.dataset.gameMode)));choose(current);return true}
function boot(){if(mount())return;const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),20000)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();