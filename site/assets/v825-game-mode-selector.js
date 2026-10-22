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
.bc-mode-status{margin:4px 0 0;color:#d5bd7b;font-size:.6rem;line-height:1.3}.bc-mode-server{display:flex;align-items:center;gap:7px;margin-top:5px;font-size:.65rem;color:#c7d4c9}.bc-mode-server select{min-width:0;flex:1;padding:5px 7px;border:1px solid #365544;border-radius:7px;background:#101d15;color:#efe7d3;font:inherit}
/* Balanced proportions: compact mode picker, wider destiny sheet. */
.bc-creation-form-column{display:grid;grid-template-columns:minmax(0,1fr);align-content:start;min-width:0}.bc-mode-choice{padding:6px 8px;margin-bottom:6px;border-radius:9px}.bc-mode-eyebrow{display:none}.bc-mode-title{font-size:clamp(.9rem,1.2vw,1.05rem);line-height:1.2}.bc-mode-subtitle{margin:2px 0 5px;font-size:.62rem;line-height:1.25}
.bc-mode-eyebrow{margin-bottom:4px;font-size:.59rem;letter-spacing:.14em}
.bc-mode-title{font-size:clamp(1.05rem,1.8vw,1.35rem)}
.bc-mode-subtitle{margin:4px 0 9px;font-size:.74rem;line-height:1.4}
.bc-mode-options{gap:5px}
.bc-mode-option{gap:5px;padding:5px 7px;border-radius:7px}
.bc-mode-icon{width:23px;height:23px;border-radius:6px;font-size:.78rem}
.bc-mode-option-copy{gap:2px}
.bc-mode-option-copy strong{font-size:.74rem}
.bc-mode-option-copy small{font-size:.59rem;line-height:1.25}
@media(min-width:1024px){.bc-creation-shell{grid-template-columns:minmax(260px,.52fr) minmax(0,1.48fr)!important;column-gap:1.5rem!important}.bc-creation-shell>.dao-card{grid-column:2;min-width:0}.bc-creation-shell>.bc-mode-choice{grid-column:2;min-width:0}}
@media(max-width:520px){.bc-mode-options{grid-template-columns:repeat(2,minmax(0,1fr))}.bc-mode-choice{padding:6px 8px}.bc-mode-option{padding:5px 6px}.bc-mode-option-copy small{font-size:.56rem}}
/* Force the mode picker to size to its contents; never stretch into a tall empty panel. */
.bc-mode-choice{display:block!important;box-sizing:border-box!important;height:auto!important;min-height:0!important;max-height:none!important;align-self:start!important;flex:none!important;grid-row:auto!important;grid-column:auto!important;padding:5px 7px!important;margin:0 0 6px!important;overflow:visible!important}
.bc-mode-choice *{box-sizing:border-box}
.bc-mode-title{margin:0 0 4px!important;font-size:.88rem!important;line-height:1.15!important}
.bc-mode-subtitle,.bc-mode-eyebrow{display:none!important}
.bc-mode-options{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:4px!important}
.bc-mode-option{min-height:0!important;height:auto!important;align-items:center!important;gap:4px!important;padding:4px 5px!important;border-radius:6px!important}
.bc-mode-icon{width:18px!important;height:18px!important;font-size:.65rem!important;border-radius:5px!important}
.bc-mode-option-copy{gap:1px!important}
.bc-mode-option-copy strong{font-size:.68rem!important;line-height:1.15!important}
.bc-mode-option-copy small{font-size:.54rem!important;line-height:1.2!important}
.bc-mode-status{margin:3px 0 0!important;font-size:.54rem!important;line-height:1.2!important}
.bc-mode-server{margin-top:3px!important;font-size:.58rem!important}
.bc-mode-server select{padding:3px 5px!important}
@media(max-width:520px){.bc-mode-choice{padding:4px 5px!important}.bc-mode-option{padding:4px!important}.bc-mode-option-copy small{font-size:.5rem!important}}

`;document.head.appendChild(s)}
function mount(){const all=[...document.querySelectorAll("h2,h3,[data-slot='card-title']")];const heading=all.find(el=>(el.textContent||"").trim()==="Lembaran Takdir");if(!heading)return false;const card=heading.closest(".dao-card")||heading.closest("[data-slot='card']")||heading.parentElement?.parentElement;if(!card||!card.parentElement)return false;if(document.querySelector(".bc-mode-choice")){document.documentElement.classList.add("bc-layout-ready");return true}installStyle();
const box=document.createElement("section");box.className="bc-mode-choice";box.setAttribute("aria-labelledby","bc-mode-title");box.innerHTML='<h2 class="bc-mode-title" id="bc-mode-title">Pilih Game Mode</h2><div class="bc-mode-options"><button type="button" class="bc-mode-option" data-game-mode="singleplayer" aria-pressed="false"><span class="bc-mode-icon" aria-hidden="true">◈</span><span class="bc-mode-option-copy"><strong>Singleplayer</strong><small>Main sendiri pada sesi permainan ini.</small></span></button><button type="button" class="bc-mode-option" data-game-mode="multiplayer" aria-pressed="false"><span class="bc-mode-icon" aria-hidden="true">♧</span><span class="bc-mode-option-copy"><strong>Multiplayer</strong><small>Masuk ke gerbang dalam talian yang sama dengan pemain lain.</small></span></button></div><div class="bc-mode-server" hidden><label for="bc-mode-server-select">Server</label><select id="bc-mode-server-select" aria-label="Pilih server"><option value="server-1">Server 1 · Dunia Bersama</option></select></div><p class="bc-mode-status" aria-live="polite"></p>';
card.parentElement.insertBefore(box,card);
const buttons=[...box.querySelectorAll("[data-game-mode]")],status=box.querySelector(".bc-mode-status"),serverRow=box.querySelector(".bc-mode-server");
let current="singleplayer";try{const saved=localStorage.getItem(KEY);if(saved==="singleplayer"||saved==="multiplayer")current=saved}catch(_){}
function choose(mode){current=mode;try{localStorage.setItem(KEY,mode)}catch(_){}box.dataset.gameMode=mode;if(serverRow)serverRow.hidden=mode!=="multiplayer";buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.gameMode===mode)));status.textContent=mode==="singleplayer"?"Dipilih: Singleplayer. Pilihan disimpan pada peranti ini.":"Dipilih: Multiplayer. Tab Multiplayer akan tersedia di dalam dunia permainan.";window.__boundlessGameMode=mode;/* Mode selection is a preference only on character creation. Do not broadcast a live-session event here: the multiplayer social layer must mount only after the character enters the world. */}
buttons.forEach(b=>b.addEventListener("click",()=>choose(b.dataset.gameMode)));choose(current);document.documentElement.classList.add("bc-layout-ready");return true}
function boot(){
  let queued=false;
  const ensure=()=>{
    queued=false;
    const heading=[...document.querySelectorAll("h2,h3,[data-slot='card-title']")].find(el=>(el.textContent||"").trim()==="Lembaran Takdir");
    if(!heading)return;
    const card=heading.closest(".dao-card")||heading.closest("[data-slot='card']")||heading.parentElement?.parentElement;
    if(!card||!card.parentElement)return;
    const existing=document.querySelector(".bc-mode-choice");
    if(existing){
      if(existing.parentElement!==card.parentElement||existing.nextElementSibling!==card){
        card.parentElement.insertBefore(existing,card);
      }
      document.documentElement.classList.add("bc-layout-ready");
      return;
    }
    mount();
  };
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    queueMicrotask(ensure);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  ensure();
  /* React hydration can replace server-rendered nodes after first mount. Keep
     observing for the page lifetime so the selector is restored, not lost. */
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();