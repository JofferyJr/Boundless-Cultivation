/* Boundless Settings additions — lightweight, no polling */
(()=>{"use strict";
let started=false;
function visible(el){if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0}
function settings(){return [...document.querySelectorAll(".bc-settings-tabs")].find(visible)||null}
function openAI(){
 const show=()=>{const p=document.getElementById("boundless-ai-panel");if(p){p.hidden=false;p.style.display="block";p.style.visibility="visible";p.style.pointerEvents="auto";p.style.zIndex="2147483647"}try{window.BoundlessAI?.engine?.renderUI?.()}catch(e){console.warn("[Boundless AI]",e)}};
 if(window.BoundlessAI){show();return}
 let s=document.querySelector('script[data-boundless-ai-loader="lazy"]');
 if(!s){s=document.createElement("script");s.src="/Boundless-Cultivation/assets/v816-ai-world.js?v=8.2.5-ai-control";s.defer=true;s.dataset.boundlessAiLoader="lazy";s.onload=show;s.onerror=()=>console.error("[Boundless] AI Control Center gagal dimuat.");document.head.appendChild(s)}
 else window.addEventListener("boundless-ai-ready",show,{once:true});
}
function addAI(){
 const tabs=settings();if(!tabs)return;
 const host=tabs.parentElement;if(!host)return;
 let row=host.querySelector(":scope > .boundless-extra-settings-slots");
 if(!row){row=document.createElement("div");row.className="boundless-extra-settings-slots";row.style.cssText="display:grid;grid-template-columns:minmax(0,1fr);gap:10px;width:100%;margin-top:10px;box-sizing:border-box";tabs.insertAdjacentElement("afterend",row)}
 if(row.querySelector('[data-boundless-custom-tab="ai"]'))return;
 const b=document.createElement("button");b.type="button";b.dataset.boundlessCustomTab="ai";b.className="boundless-settings-utility-button";b.textContent="🧠 AI Control Center";
 Object.assign(b.style,{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",minHeight:"44px",boxSizing:"border-box",padding:".45rem .7rem",border:"1px solid #806936",borderRadius:"10px",background:"#111b16",color:"#e5c77d",font:"600 .82rem/1.15 system-ui,sans-serif",cursor:"pointer",touchAction:"manipulation"});
 b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openAI()});
 row.appendChild(b);
}
function start(){
 if(started)return;started=true;
 let queued=false;
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;addAI()})};
 document.addEventListener("click",e=>{if(e.target?.closest?.("button[data-slot=sheet-trigger]"))schedule()},true);
 window.__boundlessEnsureSettingsSlots=addAI;
 addAI();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();