/* Boundless Settings utility slots — lightweight/event driven */
(()=>{"use strict";
const CUSTOM="data-boundless-custom-tab";
let started=false;

function visible(el){if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0}
function tabs(){return [...document.querySelectorAll(".bc-settings-tabs")].find(visible)||null}
function nativeTabs(list){return [...list.children].filter(el=>el.matches?.('[role="tab"]')&&!el.hasAttribute(CUSTOM)).slice(0,4)}

function openAI(){
 const show=()=>{
  const p=document.getElementById("boundless-ai-panel");
  if(p){p.hidden=false;p.style.display="block";p.style.visibility="visible";p.style.pointerEvents="auto";p.style.zIndex="2147483647"}
  try{window.BoundlessAI?.engine?.renderUI?.()}catch(e){console.warn("[Boundless AI]",e)}
 };
 if(window.BoundlessAI){show();return}
 let s=document.querySelector('script[data-boundless-ai-loader="lazy"]');
 if(!s){s=document.createElement("script");s.src="/Boundless-Cultivation/assets/v816-ai-world.js?v=8.2.5-ai-control";s.defer=true;s.dataset.boundlessAiLoader="lazy";s.onload=show;s.onerror=()=>console.error("[Boundless] AI Control Center gagal dimuat.");document.head.appendChild(s)}
 else window.addEventListener("boundless-ai-ready",show,{once:true});
}
function emit(name){document.dispatchEvent(new CustomEvent(name))}
function button(label,key,fn,disabled=false){
 const b=document.createElement("button");b.type="button";b.dataset.boundlessCustomTab=key;b.className="boundless-settings-utility-button";b.textContent=label;b.disabled=disabled;b.tabIndex=disabled?-1:0;
 Object.assign(b.style,{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",minHeight:"52px",boxSizing:"border-box",padding:".45rem .35rem",border:"1px solid #806936",borderRadius:"10px",background:"#111b16",color:"#e5c77d",font:"600 .82rem/1.15 system-ui,sans-serif",whiteSpace:"normal",textAlign:"center",cursor:disabled?"default":"pointer",touchAction:"manipulation",userSelect:"none",opacity:disabled?".45":"1"});
 if(!disabled)b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();fn()},false);
 return b;
}
function build(list){
 const host=list.parentElement;if(!host)return false;
 let row=host.querySelector(":scope > .boundless-extra-settings-slots");
 if(!row){row=document.createElement("div");row.className="boundless-extra-settings-slots";list.insertAdjacentElement("afterend",row)}
 row.style.cssText="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;width:100%;margin-top:10px;box-sizing:border-box;position:relative;overflow:visible";
 const get=k=>row.querySelector("["+CUSTOM+'="'+k+'"]');
 if(!get("ai"))row.appendChild(button("🧠 AI Control Center","ai",openAI));
 if(!get("dev"))row.appendChild(button("🛠 DEV","dev",()=>emit("boundless-open-dev")));
 for(const k of ["empty-1","empty-2"])if(!get(k))row.appendChild(button("Slot Akan Datang",k,()=>{},true));
 for(const k of ["ai","dev","empty-1","empty-2"]){const x=get(k);if(x&&x.parentElement===row)row.appendChild(x)}
 return true;
}
function ensure(){const l=tabs();return !!(l&&nativeTabs(l).length===4&&build(l))}
function start(){
 if(started)return;started=true;
 let scheduled=false;
 const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;ensure()})};
 const observer=new MutationObserver(schedule);
 observer.observe(document.body,{childList:true,subtree:true});
 ensure();
 window.__boundlessEnsureSettingsSlots=ensure;
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();