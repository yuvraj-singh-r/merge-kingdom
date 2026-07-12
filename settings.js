"use strict";

/* ============================================================
   SETTINGS
   ============================================================ */
function applySwitch(btn,on){ btn.classList.toggle("on",on); }
document.getElementById("toggleMusic").addEventListener("click",(e)=>{
  state.settings.music=!state.settings.music;
  applySwitch(e.currentTarget,state.settings.music);
  if(state.settings.music) startMusic(); else stopMusic();
  save();
});
document.getElementById("toggleSound").addEventListener("click",(e)=>{
  state.settings.sound=!state.settings.sound;
  applySwitch(e.currentTarget,state.settings.sound);
  save();
});
document.getElementById("btnDark").addEventListener("click",()=>{ setTheme("dark"); });
document.getElementById("btnLight").addEventListener("click",()=>{ setTheme("light"); });
function setTheme(t){
  state.settings.theme=t;
  document.documentElement.setAttribute("data-theme", t==="light"?"light":"");
  save();
}
document.getElementById("btnCloud").addEventListener("click",()=>{
  toast("☁️ Cloud save coming soon — your kingdom is safe on this device.");
});
document.getElementById("btnReset").addEventListener("click",()=>{
  showModal("⚠️","Reset Kingdom?","This will permanently erase your entire kingdom. This cannot be undone.",
    '<div style="display:flex; gap:10px; justify-content:center; margin-top:10px;"><button class="royal-btn danger" id="confirmReset">Erase Everything</button></div>');
  setTimeout(()=>{
    const btn=document.getElementById("confirmReset");
    if(btn) btn.onclick=()=>{
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    };
  },0);
});
document.getElementById("btnSettingsTop").addEventListener("click",()=>{
  document.querySelector('.tabbtn[data-tab="settings"]').click();
});
