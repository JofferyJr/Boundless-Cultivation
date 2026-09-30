/* Boundless Settings — AI Control Center utility
 * Weapon Forge is NOT a Settings feature.
 */
(()=>{"use strict";
const CUSTOM="data-boundless-custom-tab";
let started=false;

function visible(el){if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0}
function tabs(){return [...document.querySelectorAll(".bc-settings-tabs")].find(visible)||document.querySelector(".bc-settings-tabs")}
function nativeTabs(list){return [...list.children].filter(el=>el.matches?.('[role="tab"]')&&!el.hasAttribute(CUSTOM)).slice(0,4)}

function openAI(){
 const show=()=>{
   const p=document.getElementById("boundless-ai-panel");
   if(p){p.hidden=false;p.style.display="block";p.style.visibility="visible";p.style.pointerEvents="auto";p.style.zIndex="2147483647"}
   try{window.BoundlessAI?.engine?.renderUI?.()}catch(e){console.warn("[Boundless AI]",e)}
 };
 if(window.BoundlessAI){show();return}
 let s=document.querySelector('script[data-boundless-ai-loader="lazy"]');
 if(!s){
   s=document.createElement("script");
   s.src="/Boundless-Cultivation/assets/v816-ai-world.js?v=8.2.5-ai-control";
   s.defer=true;s.dataset.boundlessAiLoader="lazy";
   s.onload=show;s.onerror=()=>console.error("[Boundless] AI Control Center gagal dimuat.");
   document.head.appendChild(s);
 }else window.addEventListener("boundless-ai-ready",show,{once:true});
}

function button(label,key,fn,disabled=false){
 const b=document.createElement("button");
 b.type="button";b.dataset.boundlessCustomTab=key;b.className="boundless-settings-utility-button";
 b.textContent=label;b.disabled=disabled;b.tabIndex=disabled?-1:0;
 Object.assign(b.style,{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",minHeight:"58px",boxSizing:"border-box",padding:".45rem .35rem",border:"1px solid #806936",borderRadius:"10px",background:"#111b16",color:"#e5c77d",font:"600 .82rem/1.15 system-ui,sans-serif",whiteSpace:"normal",textAlign:"center",cursor:disabled?"default":"pointer",touchAction:"manipulation",position:"relative",zIndex:"2147483647",pointerEvents:disabled?"none":"auto",userSelect:"none",opacity:disabled?".45":"1"});
 if(!disabled){
   b.addEventListener("pointerdown",e=>{e.stopImmediatePropagation()},true);
   b.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();fn()},true);
   b.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();fn()}},true);
 }
 return b;
}

function build(list){
 const host=list.parentElement;if(!host)return null;
 let row=host.querySelector(":scope > .boundless-extra-settings-slots");
 if(!row){row=document.createElement("div");row.className="boundless-extra-settings-slots";list.insertAdjacentElement("afterend",row)}
 row.style.cssText="display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;width:100%;margin-top:12px;box-sizing:border-box;position:relative;z-index:2147483647;pointer-events:auto;overflow:visible";
 const get=k=>row.querySelector("["+CUSTOM+'="'+k+'"]');
 let ai=get("ai");
 if(!ai){ai=button("🧠 AI Control Center","ai",openAI);row.appendChild(ai)}
 if(!get("dev-realm"))row.appendChild(button("🛠 DEV · Ranah Awal","dev-realm",()=>{},false));
 for(const k of ["empty-1","empty-2"])if(!get(k))row.appendChild(button("Slot Akan Datang",k,()=>{},true));
 for(const k of ["ai","dev-realm","empty-1","empty-2"]){const x=get(k);if(x&&x.parentElement===row)row.appendChild(x)}
 return ai;
}
function ensure(){const l=tabs();if(!l)return false;const n=nativeTabs(l);if(n.length!==4)return false;return !!build(l)}
function start(){
 if(started)return;started=true;
 document.addEventListener("click",e=>{const b=e.target?.closest?.('['+CUSTOM+'="ai"]');if(b&&!b.disabled){e.preventDefault();e.stopImmediatePropagation();openAI()}},true);
 document.addEventListener("pointerup",e=>{const b=e.target?.closest?.('['+CUSTOM+'="ai"]');if(b&&!b.disabled)e.stopImmediatePropagation()},true);
 const o=new MutationObserver(()=>requestAnimationFrame(ensure));o.observe(document.body,{childList:true,subtree:true});
 let i=0;const t=setInterval(()=>{ensure();if(++i>240)clearInterval(t)},250);ensure();
 window.__boundlessEnsureSettingsSlots=ensure;
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();