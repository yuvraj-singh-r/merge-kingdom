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
  const startScreen=document.getElementById("startScreen");
  startScreen.classList.add("fade-out");
  setTimeout(()=>{
    startScreen.classList.add("hidden");
    startScreen.classList.remove("fade-in","fade-out");
  },420);
  const app=document.getElementById("app");
  app.classList.add("show");
  document.documentElement.setAttribute("data-theme", state.settings.theme==="light"?"light":"");
  applySwitch(document.getElementById("toggleMusic"), state.settings.music);
  applySwitch(document.getElementById("toggleSound"), state.settings.sound);
  document.getElementById("musicVolumeSlider").value=Math.round((state.settings.musicVolume!==undefined?state.settings.musicVolume:0.35)*100);
  document.getElementById("sfxVolumeSlider").value=Math.round((state.settings.sfxVolume!==undefined?state.settings.sfxVolume:0.7)*100);
  applyVolumeSettings();
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

// ============================================================
// BOOT SEQUENCE
// Gates the loading screen on three real signals — asset load,
// Firebase init, save-data check — rather than a fake timer.
// A max Firebase-wait timeout means players with no network or a
// blocked connection still reach the start screen (local play
// must never be held hostage by an optional cloud feature).
// ============================================================
const LOADING_TIPS=[
  "Tip: Merge 3 matching items to create something greater.",
  "Tip: Visit the World Map to discover new islands and merge chains.",
  "Tip: Claim your Daily Reward every day to build a login streak.",
  "Tip: Complete Daily Quests for bonus Coins, Gems, and XP.",
  "Tip: Spend Gems in the Shop on special packs and boosts.",
  "Tip: Check the Leaderboard to see how your realm ranks.",
  "Tip: Claim Achievements for bonus Coins, Gems, and XP.",
  "Tip: Upgrade your buildings to boost their income."
];
let loadingTipTimer=null;
function startLoadingTips(){
  const el=document.getElementById("loadingTip");
  if(!el) return;
  let i=0;
  el.textContent=LOADING_TIPS[0];
  loadingTipTimer=setInterval(()=>{
    i=(i+1)%LOADING_TIPS.length;
    el.classList.add("tip-fade");
    setTimeout(()=>{
      el.textContent=LOADING_TIPS[i];
      el.classList.remove("tip-fade");
    },220);
  },2400);
}
function stopLoadingTips(){ if(loadingTipTimer){ clearInterval(loadingTipTimer); loadingTipTimer=null; } }

function finishBoot(){
  stopLoadingTips();
  if(typeof hideNativeSplash==="function") hideNativeSplash();
  document.getElementById("loading").classList.add("fade");
  setTimeout(()=>{
    document.getElementById("loading").style.display="none";
    const startScreen=document.getElementById("startScreen");
    startScreen.classList.remove("hidden");
    startScreen.classList.add("fade-in");
    document.getElementById("btnContinue").disabled=!hasSave();
    if(!hasSave()) document.getElementById("btnContinue").style.display="none";
  },650);
}

function bootSequence(){
  const FIREBASE_WAIT_TIMEOUT_MS=4000;
  const MIN_DISPLAY_MS=900;
  const bootStart=Date.now();

  // Stage 1: assets — real <img class="crest"> load signal
  let assetsReady=false;
  const crestImgs=document.querySelectorAll("img.crest");
  let pending=crestImgs.length;
  const markAssetDone=()=>{ pending--; if(pending<=0) assetsReady=true; };
  if(pending===0){ assetsReady=true; }
  crestImgs.forEach(img=>{
    if(img.complete){ markAssetDone(); return; }
    img.addEventListener("load", markAssetDone, {once:true});
    img.addEventListener("error", markAssetDone, {once:true});
  });

  // Stage 2: save data — localStorage reads are synchronous, always instantly ready
  const saveDataReady=true;

  // Stage 3: firebase — real window.firebaseApp signal, or timeout fallback
  const firebaseWaitStart=Date.now();
  function firebaseStageReady(){
    return !!window.firebaseApp || (Date.now()-firebaseWaitStart>FIREBASE_WAIT_TIMEOUT_MS);
  }

  startLoadingTips();

  let displayPct=0;
  function frame(){
    const stagesDone=(assetsReady?1:0)+(saveDataReady?1:0)+(firebaseStageReady()?1:0);
    const targetPct=Math.min(100,(stagesDone/3)*100);
    displayPct += (targetPct-displayPct)*0.15;
    if(targetPct>=100 && displayPct>98.5) displayPct=100;
    document.getElementById("loadbarFill").style.width=Math.min(100,displayPct)+"%";

    const allReady=assetsReady && saveDataReady && firebaseStageReady();
    const minTimeElapsed=(Date.now()-bootStart)>=MIN_DISPLAY_MS;
    if(allReady && minTimeElapsed && displayPct>=99.3){
      finishBoot();
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
bootSequence();
