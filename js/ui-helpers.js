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
   MODAL
   ============================================================ */
function showModal(icon,title,body,extraHtml,onClose){
  const overlay=document.createElement("div");
  overlay.className="overlay";
  overlay.innerHTML='<div class="modal"><div class="bigicon">'+icon+'</div><h2>'+title+'</h2><p>'+body+'</p>'+(extraHtml||"")+'<div style="margin-top:16px;"><button class="royal-btn" id="modalClose">Continue</button></div></div>';
  document.body.appendChild(overlay);
  overlay.querySelector("#modalClose").onclick=()=>{ overlay.remove(); if(onClose) onClose(); };
  return overlay;
}
