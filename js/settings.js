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
  if(typeof manualCloudSync==="function") manualCloudSync();
  else toast("☁️ Cloud save coming soon — your kingdom is safe on this device.");
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

/* ============================================================
   AUTH UI (Google Sign-In) — additive, authentication display only.
   Owns rendering of #authPanel inside the Settings tab. Reads
   identity via getCurrentUser()/loginWithGoogle()/logout() exposed
   by js/modules/auth.js. Does not read or write gameplay `state`,
   and does not implement cloud save or any data sync — see
   PROJECT_RULES.md, Section 7 & 11.
   ============================================================ */
function renderAuthUI(){
  const panel=document.getElementById("authPanel");
  if(!panel) return;
  const user=(typeof getCurrentUser==="function")?getCurrentUser():null;
  if(user){
    const photo=user.photoURL||"";
    const name=user.displayName||"Player";
    const email=user.email||"";
    panel.innerHTML=
      (photo?'<img class="auth-avatar" src="'+photo+'" alt="" referrerpolicy="no-referrer" onerror="this.style.visibility=\'hidden\'">':'<div class="auth-avatar"></div>')+
      '<div class="auth-info"><div class="auth-name">'+name+'</div><div class="auth-email">'+email+'</div></div>'+
      '<button class="royal-btn ghost auth-btn" id="btnGoogleLogin" data-mode="logout">Logout</button>';
  } else {
    panel.innerHTML=
      '<div class="auth-desc">Sign in to link your account for future cloud features.</div>'+
      '<button class="royal-btn ghost auth-btn" id="btnGoogleLogin" data-mode="login">🔑 Continue with Google</button>';
  }
}
const authRowEl=document.getElementById("authRow");
if(authRowEl){
  authRowEl.addEventListener("click",(e)=>{
    const btn=e.target.closest("#btnGoogleLogin");
    if(!btn) return;
    if(btn.dataset.mode==="logout"){
      if(typeof logout==="function") logout();
    } else {
      if(typeof loginWithGoogle==="function") loginWithGoogle();
    }
  });
}
renderAuthUI();
