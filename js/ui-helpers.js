"use strict";

/* ============================================================
   UI HELPERS
   ============================================================ */
function toast(msg){
  const el=document.createElement("div");
  el.className="toast"; el.textContent=msg;
  document.getElementById("toasts").appendChild(el);
  setTimeout(()=>el.remove(),3100);
}
function floatText(x,y,text,color){
  const el=document.createElement("div");
  el.className="floattext"; el.textContent=text; el.style.left=x+"px"; el.style.top=y+"px"; el.style.color=color||"#f0c419";
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1000);
}
function burstParticles(x,y,color,count){
  for(let i=0;i<(count||10);i++){
    const p=document.createElement("div");
    p.className="particle";
    const size=4+Math.random()*5;
    p.style.width=size+"px"; p.style.height=size+"px";
    p.style.left=x+"px"; p.style.top=y+"px";
    p.style.background=color||"#f0c419";
    const angle=Math.random()*Math.PI*2, dist=30+Math.random()*50;
    p.style.setProperty("--dx",(Math.cos(angle)*dist)+"px");
    p.style.setProperty("--dy",(Math.sin(angle)*dist)+"px");
    document.body.appendChild(p);
    setTimeout(()=>p.remove(),720);
  }
}
function confettiBurst(){
  const layer=document.getElementById("confettiLayer");
  const colors=["#f0c419","#c0392b","#2d9d6f","#f4e8d0","#8e6bd8"];
  for(let i=0;i<60;i++){
    const c=document.createElement("div");
    c.className="confetti";
    c.style.left=Math.random()*100+"vw";
    c.style.background=colors[i%colors.length];
    c.style.animationDuration=(2+Math.random()*1.8)+"s";
    c.style.opacity=String(0.7+Math.random()*0.3);
    layer.appendChild(c);
    setTimeout(()=>c.remove(),4200);
  }
}

/* ============================================================
   RIPPLE EFFECT — one delegated listener covers every button
   class project-wide. CSS (.ripple-span/@keyframes rippleFx in
   styles.css) drives the actual animation on the compositor
   thread; this only measures the click position and appends/
   removes a span, so it's cheap even on low-end mobile.
   ============================================================ */
const RIPPLE_SELECTOR=".royal-btn, .iconbtn, .tabbtn, .lb-cat-btn, .qitem .claim, .card .buy, .settrow-link";
document.addEventListener("pointerdown",(e)=>{
  const btn=e.target.closest(RIPPLE_SELECTOR);
  if(!btn || btn.disabled) return;
  const rect=btn.getBoundingClientRect();
  const size=Math.max(rect.width,rect.height)*1.6;
  const span=document.createElement("span");
  span.className="ripple-span";
  span.style.width=span.style.height=size+"px";
  span.style.left=(e.clientX-rect.left-size/2)+"px";
  span.style.top=(e.clientY-rect.top-size/2)+"px";
  btn.appendChild(span);
  span.addEventListener("animationend", ()=>span.remove(), {once:true});
});

function closeOverlay(overlay, onRemoved){
  if(!overlay || overlay.dataset.closing) return;
  overlay.dataset.closing="1";
  overlay.classList.add("closing");
  setTimeout(()=>{ overlay.remove(); if(onRemoved) onRemoved(); },220);
}

/* ============================================================
   MODAL
   ============================================================ */
function showModal(icon,title,body,extraHtml,onClose){
  const overlay=document.createElement("div");
  overlay.className="overlay";
  overlay.innerHTML='<div class="modal"><div class="bigicon">'+icon+'</div><h2>'+title+'</h2><p>'+body+'</p>'+(extraHtml||"")+'<div style="margin-top:16px;"><button class="royal-btn" id="modalClose">Continue</button></div></div>';
  document.body.appendChild(overlay);
  overlay.querySelector("#modalClose").onclick=()=>{ closeOverlay(overlay); if(onClose) onClose(); };
  return overlay;
}
