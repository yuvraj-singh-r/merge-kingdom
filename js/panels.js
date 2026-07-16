"use strict";

/* ============================================================
   BUILDINGS TAB
   ============================================================ */
function buildingCost(b){
  const owned=state.buildings[b.id]||0;
  return Math.round(b.cost*Math.pow(1.6,owned));
}
function renderBuildings(){
  const grid=document.getElementById("buildingsGrid");
  grid.innerHTML="";
  let totalIncome=0;
  BUILDINGS.forEach(b=>{
    const owned=state.buildings[b.id]||0;
    totalIncome += owned*b.income*buildingIncomeMultiplier();
    const unlocked = state.level>=b.unlock;
    const cost=buildingCost(b);
    const card=document.createElement("div");
    card.className="card"+(unlocked?"":" locked");
    card.innerHTML=
      '<div class="top"><div class="icon">'+b.icon+'</div><div><div class="name">'+b.name+'</div>'+(owned?'<div class="lvl">Owned: '+owned+'</div>':'')+'</div></div>'+
      '<div class="desc">'+b.desc+'</div>'+
      '<div class="desc">Income: '+(b.income*buildingIncomeMultiplier()).toFixed(2)+' 🪙/s each</div>'+
      (unlocked? '<button class="buy" data-id="'+b.id+'">Build — '+fmt(cost)+' 🪙</button>' : '<div class="lockmsg">Unlocks at Level '+b.unlock+'</div>');
    grid.appendChild(card);
  });
  document.getElementById("incomeSummary").textContent = "Total: "+totalIncome.toFixed(1)+" 🪙/s";
  grid.querySelectorAll(".buy").forEach(btn=>{
    const b=BUILDINGS.find(x=>x.id===btn.dataset.id);
    btn.disabled = state.coins < buildingCost(b);
    btn.onclick=()=>{
      const cost=buildingCost(b);
      if(spendCoins(cost)){
        state.buildings[b.id]=(state.buildings[b.id]||0)+1;
        sfx.upgrade(); toast("🏗️ Built "+b.name+"!");
        checkAchievements();
        renderBuildings(); save();
      }
    };
  });
}

/* ============================================================
   UPGRADES TAB
   ============================================================ */
function upgradeCost(u){
  const lv=state.upgrades[u.id]||0;
  return Math.round(u.baseCost*Math.pow(u.growth,lv));
}
function renderUpgrades(){
  const grid=document.getElementById("upgradesGrid");
  grid.innerHTML="";
  UPGRADES.forEach(u=>{
    const lv=state.upgrades[u.id]||0;
    const maxed=lv>=u.max;
    const cost=upgradeCost(u);
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=
      '<div class="top"><div class="icon">'+u.icon+'</div><div><div class="name">'+u.name+'</div><div class="lvl">Level '+lv+' / '+u.max+'</div></div></div>'+
      '<div class="desc">'+u.desc+'</div>'+
      (maxed? '<button class="buy" disabled>Maxed Out</button>' : '<button class="buy" data-id="'+u.id+'">Upgrade — '+fmt(cost)+' 🪙</button>');
    grid.appendChild(card);
  });
  grid.querySelectorAll(".buy:not([disabled])").forEach(btn=>{
    const u=UPGRADES.find(x=>x.id===btn.dataset.id);
    btn.disabled = state.coins < upgradeCost(u);
    btn.onclick=()=>{
      const cost=upgradeCost(u);
      if(spendCoins(cost)){
        state.upgrades[u.id]=(state.upgrades[u.id]||0)+1;
        sfx.upgrade(); toast("⚗️ "+u.name+" upgraded!");
        checkAchievements();
        renderUpgrades(); save();
      }
    };
  });
}

/* ============================================================
   QUESTS TAB
   ============================================================ */
function questStateValue(q){
  switch(q.type){
    case "totalMerges": return state.totalMerges;
    case "coinsEarned": return state.lifetimeCoins;
    case "levelReached": return state.level;
    case "buildingOwned": return state.buildings[q.building]||0;
    case "maxTierChain": return state.maxTier[q.chain]||0;
    default: return 0;
  }
}
function renderQuests(){
  const list=document.getElementById("questList");
  list.innerHTML="";
  const defs=questDefs();
  let doneCount=0;
  defs.forEach(q=>{
    const claimed=state.questsClaimed.includes(q.id);
    if(claimed) doneCount++;
    const val=Math.min(q.target, questStateValue(q));
    const complete = val>=q.target;
    const div=document.createElement("div");
    div.className="qitem"+(claimed?" done":"");
    div.innerHTML=
      '<div class="icon">'+q.icon+'</div>'+
      '<div class="body"><div class="t">'+q.name+'</div><div class="desc" style="font-size:11px;color:var(--text-dim);">'+q.desc+'</div>'+
      '<div class="prog"><i style="width:'+(val/q.target*100)+'%"></i></div>'+
      '<div class="reward">Reward: '+(q.reward.coins?q.reward.coins+" 🪙 ":"")+(q.reward.xp?q.reward.xp+" XP":"")+'</div></div>'+
      '<button class="claim" '+((complete&&!claimed)?"":"disabled")+'>'+(claimed?"Claimed":"Claim")+'</button>';
    div.querySelector(".claim").onclick=()=>{
      if(complete && !claimed){
        state.questsClaimed.push(q.id);
        addCoins(q.reward.coins||0); addXP(q.reward.xp||0);
        sfx.victory(); toast("📜 Quest complete: "+q.name+"!");
        checkAchievements();
        renderQuests(); save();
      }
    };
    list.appendChild(div);
  });
  document.getElementById("questProgress").textContent = doneCount+" / "+defs.length+" complete";
}

/* ============================================================
   ACHIEVEMENTS TAB
   ============================================================ */
function checkAchievements(){
  const defs=achievementDefs();
  let newly=[];
  defs.forEach(a=>{
    if(!state.achievementsUnlocked.includes(a.id) && a.cond(state)){
      state.achievementsUnlocked.push(a.id);
      newly.push(a);
    }
  });
  if(newly.length){
    save();
    newly.forEach(a=>toast("🏆 Achievement: "+a.name+"!"));
    const tab=document.getElementById("tab-achievements");
    if(tab && !tab.classList.contains("hidden")) renderAchievements();
  }
}
function renderAchievements(){
  const grid=document.getElementById("achGrid");
  grid.innerHTML="";
  const defs=achievementDefs();
  defs.forEach(a=>{
    const unlocked=state.achievementsUnlocked.includes(a.id);
    const div=document.createElement("div");
    div.className="ach"+(unlocked?" unlocked":"");
    div.innerHTML='<div class="icon">'+(unlocked?a.icon:"🔒")+'</div><div class="name">'+a.name+'</div><div class="desc">'+a.desc+'</div>';
    grid.appendChild(div);
  });
  document.getElementById("achProgress").textContent = state.achievementsUnlocked.length+" / "+defs.length;
}

/* ============================================================
   COLLECTION TAB
   ============================================================ */
function renderCollection(){
  const grid=document.getElementById("collGrid");
  grid.innerHTML="";
  Object.keys(CHAINS).forEach(ck=>{
    CHAINS[ck].tiers.forEach((t,ti)=>{
      const key=ck+":"+ti;
      const found=state.collection.includes(key);
      const div=document.createElement("div");
      div.className="coll"+(found?"":" undiscovered");
      div.innerHTML=(found?t.icon:"❔")+'<span class="cname">'+(found?t.name:"???")+'</span>';
      grid.appendChild(div);
    });
  });
  SPECIALS.forEach(sp=>{
    const key="special:"+sp.id;
    const found=state.collection.includes(key);
    const div=document.createElement("div");
    div.className="coll"+(found?"":" undiscovered");
    div.innerHTML=(found?sp.icon:"❔")+'<span class="cname">'+(found?sp.name:"???")+'</span>';
    grid.appendChild(div);
  });
  document.getElementById("collProgress").textContent = state.collection.length+" / "+totalCollectibles();
}

/* ============================================================
   INVENTORY TAB
   ============================================================ */
function renderInventory(){
  const grid=document.getElementById("invGrid");
  grid.innerHTML="";
  const counts={};
  state.board.forEach(item=>{
    if(!item) return;
    const key=item.special?("Special: "+nameFor(item)):(CHAINS[item.chain].label+" — "+nameFor(item));
    counts[key]=(counts[key]||0)+1;
  });
  const keys=Object.keys(counts);
  if(!keys.length){
    grid.innerHTML='<div class="statbox"><div class="val">🎒</div><div class="lbl">Your board is empty. Start merging!</div></div>';
    return;
  }
  keys.forEach(k=>{
    const box=document.createElement("div");
    box.className="statbox";
    box.innerHTML='<div class="val">'+counts[k]+'</div><div class="lbl">'+k+'</div>';
    grid.appendChild(box);
  });
}

/* ============================================================
   STATS TAB
   ============================================================ */
function renderStats(){
  const grid=document.getElementById("statsGrid");
  const playH=(state.playSeconds/3600).toFixed(1);
  const totalBuildings=Object.values(state.buildings).reduce((a,b)=>a+b,0);
  const items=[
    ["🪙 Coins", fmt(state.coins)],
    ["💰 Lifetime Coins", fmt(state.lifetimeCoins)],
    ["⭐ Kingdom Score", fmt(state.score)],
    ["📈 Level", state.level],
    ["🔀 Total Merges", fmt(state.totalMerges)],
    ["🏗️ Buildings Owned", totalBuildings],
    ["🏆 Achievements", state.achievementsUnlocked.length+"/50"],
    ["📖 Collection", state.collection.length+"/"+totalCollectibles()],
    ["📜 Quests Done", state.questsClaimed.length+"/"+questDefs().length],
    ["🎁 Daily Streak", state.dailyStreak],
    ["⏱️ Time Played", playH+" hrs"]
  ];
  grid.innerHTML="";
  items.forEach(([lbl,val])=>{
    const box=document.createElement("div");
    box.className="statbox";
    box.innerHTML='<div class="val">'+val+'</div><div class="lbl">'+lbl+'</div>';
    grid.appendChild(box);
  });
}

/* ============================================================
   TOP BAR
   ============================================================ */
function updateTopbar(){
  document.getElementById("coinDisplay").textContent=fmt(state.coins);
  document.getElementById("scoreDisplay").textContent=fmt(state.score);
  document.getElementById("levelBadge").textContent=state.level;
  document.getElementById("xpFill").style.width=Math.min(100,(state.xp/xpNeeded(state.level))*100)+"%";
}

/* ============================================================
   TABS
   ============================================================ */
function refreshActiveTab(){
  const active=document.querySelector(".tabbtn.active");
  if(!active) return;
  renderForTab(active.dataset.tab);
}
function renderForTab(tab){
  if(tab==="build") renderBuildings();
  if(tab==="upgrades") renderUpgrades();
  if(tab==="quests") renderQuests();
  if(tab==="achievements") renderAchievements();
  if(tab==="collection") renderCollection();
  if(tab==="inventory") renderInventory();
  if(tab==="stats") renderStats();
}
document.getElementById("tabs").addEventListener("click",(e)=>{
  const btn=e.target.closest(".tabbtn");
  if(!btn) return;
  document.querySelectorAll(".tabbtn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".tabpanel").forEach(p=>p.classList.add("hidden"));
  document.getElementById("tab-"+btn.dataset.tab).classList.remove("hidden");
  sfx.click();
  renderForTab(btn.dataset.tab);
});
