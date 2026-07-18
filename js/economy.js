"use strict";

/* ============================================================
   ECONOMY / XP / LEVEL
   ============================================================ */
function addCoins(n){
  n=Math.round(n);
  state.coins+=n; state.lifetimeCoins+=n;
  updateTopbar();
}
function spendCoins(n){
  if(state.coins<n) return false;
  state.coins-=n; state.totalCoinsSpent=(state.totalCoinsSpent||0)+n; updateTopbar(); return true;
}
function addXP(n){
  n=Math.round(n*(1+(state.upgrades.xp||0)*0.1));
  state.xp+=n;
  let leveled=false;
  while(state.xp>=xpNeeded(state.level)){
    state.xp-=xpNeeded(state.level);
    state.level++; leveled=true;
  }
  updateTopbar();
  if(leveled) onLevelUp();
}
function onLevelUp(){
  sfx.levelup(); confettiBurst();
  updateBanner();
  const unlocked=BUILDINGS.filter(b=>b.unlock===state.level);
  showModal("⭐","Level "+state.level+"!", unlocked.length? "New building unlocked: "+unlocked.map(b=>b.name).join(", ")+"!" : "Your kingdom grows stronger.");
}
