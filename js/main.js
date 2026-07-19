"use strict";

/* ============================================================
   BANNER — kingdom name grows with level
   ============================================================ */
function updateBanner(){
  const names=["Merge Realms","Growing Realm","Prosperous Realm","Royal Merge Realms","Legendary Merge Realms"];
  const idx=Math.min(names.length-1, Math.floor(state.level/8));
  document.getElementById("kingdomNameBanner").textContent=names[idx];
}

/* ============================================================
   GAME LOOP
   ============================================================ */
let tickTimer=null, saveTimer=null;
function tick(){
  let income=0;
  BUILDINGS.forEach(b=>{ income += (state.buildings[b.id]||0)*b.income; });
  income*=buildingIncomeMultiplier();
  if(income>0) addCoins(income);
  if(!state.spawnReady && Date.now()>=state.spawnNext){
    state.spawnReady=true;
  }
  updateSpawnerUI();
  state.playSeconds++;
  checkDailyAvailable();
  ensureDailyQuests();
  checkIslandUnlocks();
  if(document.querySelector(".tabbtn[data-tab='build'].active")) renderBuildings();
  if(document.querySelector(".tabbtn[data-tab='stats'].active")) renderStats();
}
function startLoops(){
  if(tickTimer) clearInterval(tickTimer);
  if(saveTimer) clearInterval(saveTimer);
  tickTimer=setInterval(tick,1000);
  saveTimer=setInterval(save,5000);
}

function applyOfflineEarnings(){
  const elapsedMs = Date.now()-(state.lastSeen||Date.now());
  const elapsedSec = Math.min(8*3600, Math.max(0, Math.floor(elapsedMs/1000)));
  if(elapsedSec<30) return;
  let incomePerSec=0;
  BUILDINGS.forEach(b=>{ incomePerSec += (state.buildings[b.id]||0)*b.income; });
  incomePerSec*=buildingIncomeMultiplier();
  const earned=Math.round(incomePerSec*elapsedSec);
  if(earned>0){
    addCoins(earned);
    showModal("🌙","Welcome Back!","Your kingdom kept working while you were away. You earned "+fmt(earned)+" coins!");
  }
}

/* ============================================================
   INIT
   ============================================================ */
function fullRender(){
  renderBoard(); renderQueue(); updateSpawnerUI(); updateTopbar(); updateBanner();
  renderForTab(document.querySelector(".tabbtn.active").dataset.tab);
  checkDailyAvailable();
}
function trackDaysPlayed(){
  if(!state.lastPlayedAt || isNewDay(state.lastPlayedAt, Date.now())){
    state.daysPlayed=(state.daysPlayed||0)+1;
  }
  state.lastPlayedAt=Date.now();
}
function beginGame(){
  document.getElementById("startScreen").classList.add("hidden");
  const app=document.getElementById("app");
  app.classList.add("show");
  document.documentElement.setAttribute("data-theme", state.settings.theme==="light"?"light":"");
  applySwitch(document.getElementById("toggleMusic"), state.settings.music);
  applySwitch(document.getElementById("toggleSound"), state.settings.sound);
  applyOfflineEarnings();
  trackDaysPlayed();
  fullRender();
  applyIslandTheme();
  startLoops();
  checkAchievements();
  document.addEventListener("click", ()=>{ if(state.settings.music) startMusic(); }, {once:true});
}
document.getElementById("btnContinue").addEventListener("click", ()=>{
  const loaded=load();
  state = loaded || defaultState();
  beginGame();
});
document.getElementById("btnNewGame").addEventListener("click", ()=>{
  if(hasSave() && !confirm("Starting a new kingdom will erase your current progress. Continue?")) return;
  localStorage.removeItem(SAVE_KEY);
  state=defaultState();
  beginGame();
});

window.addEventListener("beforeunload", ()=>{ if(state) save(); });

// boot sequence
let pct=0;
const loadInterval=setInterval(()=>{
  pct+=8+Math.random()*14;
  document.getElementById("loadbarFill").style.width=Math.min(100,pct)+"%";
  if(pct>=100){
    clearInterval(loadInterval);
    setTimeout(()=>{
      document.getElementById("loading").classList.add("fade");
      setTimeout(()=>{
        document.getElementById("loading").style.display="none";
        const startScreen=document.getElementById("startScreen");
        startScreen.classList.remove("hidden");
        document.getElementById("btnContinue").disabled=!hasSave();
        if(!hasSave()) document.getElementById("btnContinue").style.display="none";
      },650);
    },300);
  }
},180);
