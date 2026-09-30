/* Boundless Settings bridge
 * AI Control Center is a clickable utility in Settings.
 * Weapon Forge is intentionally NOT part of Settings.
 */
(()=>{"use strict";
const CUSTOM="data-boundless-custom-tab";
let started=false;

function visible(el){if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0}
function tabs(){return [...document.querySelectorAll(".bc-settings-tabs")].find(visible)||document.querySelector(".bc-settings-tabs")}
function nativeTabs(list){return [...list.children].filter(el=>el.matches?.('[role="tab"]')&&!el.hasAttribute(CUSTOM)).slice(0,4)}

function button(label,key,fn,disabled=false){
 const b=document.createElement("button");b.type="button";b.dataset.boundlessCustomTab=key;b.className="boundless-settings-utility-button";b.textContent=label;b.disabled=disabled;
 Object.assign(b.style,{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",minHeight:"58px",boxSizing:"border-box",padding:".45rem .35rem",border:"1px solid #806936",borderRadius:"10px",background:"#111b16",color:"#e5c77d",font:"600 .82rem/1.15 system-ui,sans-serif",whiteSpace:"normal",textAlign:"center",cursor:disabled?"default":"pointer",touchAction:"manipulation",position:"relative",zIndex:"2147483647",pointerEvents:disabled?"none":"auto",userSelect:"none",opacity:disabled?".45":"1"});
 if(!disabled)b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();fn()});
 return b;
}

function openAI(){
 const show=()=>{const p=document.getElementById("boundless-ai-panel");if(p){p.hidden=false;p.style.display="block"};window.BoundlessAI?.engine?.renderUI?.()};
 if(window.BoundlessAI){show();return}
 let s=document.querySelector('script[data-boundless-ai-loader="lazy"]');
 if(s){window.addEventListener("boundless-ai-ready",show,{once:true});return}
 s=document.createElement("script");s.src="/Boundless-Cultivation/assets/v816-ai-world.js?v=8.2.4-ai-click";s.defer=true;s.dataset.boundlessAiLoader="lazy";s.onload=()=>show();s.onerror=()=>console.error("[Boundless] AI Control Center gagal dimuat.");document.head.appendChild(s);
}

function build(list){
 const host=list.parentElement;if(!host)return;
 let row=host.querySelector(":scope > .boundless-extra-settings-slots");
 if(!row){row=document.createElement("div");row.className="boundless-extra-settings-slots";list.insertAdjacentElement("afterend",row)}
 row.style.cssText="display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;width:100%;margin-top:12px;box-sizing:border-box;position:relative;z-index:2147483646;pointer-events:auto;overflow:visible";
 const get=k=>row.querySelector('['+CUSTOM+'="'+k+'"]');
 let ai=get("ai");if(!ai){ai=button("🧠 AI Control Center","ai",openAI);row.appendChild(ai)}
 for(const k of ["empty-1","empty-2","empty-3"])if(!get(k))row.appendChild(button("Slot Akan Datang",k,()=>{},true));
 for(const k of ["ai","empty-1","empty-2","empty-3"]){const x=get(k);if(x)row.appendChild(x)}
 return ai
}
function ensure(){const l=tabs();if(!l)return false;const n=nativeTabs(l);if(n.length!==4)return false;return !!build(l)}
function start(){if(started)return;started=true;const o=new MutationObserver(()=>requestAnimationFrame(ensure));o.observe(document.body,{childList:true,subtree:true});let i=0;const t=setInterval(()=>{ensure();if(++i>240)clearInterval(t)},250);ensure();window.__boundlessEnsureSettingsSlots=ensure}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();