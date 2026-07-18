"use strict";

/* ============================================================
   DAILY QUESTS
   ------------------------------------------------------------
   A separate, resetting sibling to the permanent quests in
   questDefs() (js/panels.js / js/data.js) — see data.js's
   dailyQuestDefs() for the template pool this picks 3 from.

   Reuses daily.js's existing isNewDay() for the 24h rollover
   check (same pattern as checkDailyAvailable()), rather than
   introducing a second date-comparison helper.

   Progress is tracked as a delta from a baseline snapshot taken
   the moment today's quests were generated — the same
   "read straight from state" approach questStateValue() already
   uses for permanent quests, just offset by that baseline. No new
   counters or hooks into board.js/economy.js/panels.js are needed.
   ============================================================ */

function dailyQuestCumulativeValue(type){
  switch(type){
    case "merges": return state.totalMerges;
    case "coinsEarned": return state.lifetimeCoins;
    case "buildingsBuilt": return Object.values(state.buildings).reduce((a,b)=>a+b,0);
    default: return 0;
  }
}

function generateDailyQuests(){
  const pool = dailyQuestDefs();
  const indices = pool.map((_,i)=>i);
  for(let i=indices.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [indices[i],indices[j]] = [indices[j],indices[i]];
  }
  const questIds = indices.slice(0,3).map(i=>pool[i].id);
  state.dailyQuests = {
    generatedAt: Date.now(),
    questIds: questIds,
    claimed: [],
    baseline: {
      merges: state.totalMerges,
      coinsEarned: state.lifetimeCoins,
      buildingsBuilt: Object.values(state.buildings).reduce((a,b)=>a+b,0)
    }
  };
}

function ensureDailyQuests(){
  const dq = state.dailyQuests;
  if(!dq || !dq.generatedAt || isNewDay(dq.generatedAt, Date.now())){
    generateDailyQuests();
    save();
  }
}

function renderDailyQuests(){
  ensureDailyQuests();
  const list=document.getElementById("dailyQuestList");
  if(!list) return;
  list.innerHTML="";
  const pool=dailyQuestDefs();
  const dq=state.dailyQuests;
  dq.questIds.forEach(qid=>{
    const q=pool.find(p=>p.id===qid);
    if(!q) return;
    const claimed=dq.claimed.includes(qid);
    const cumulative=dailyQuestCumulativeValue(q.type);
    const baselineVal=dq.baseline[q.type]||0;
    const val=Math.max(0, Math.min(q.target, cumulative-baselineVal));
    const complete = val>=q.target;
    const rewardParts=[];
    if(q.reward.coins) rewardParts.push(q.reward.coins+" 🪙");
    if(q.reward.gems) rewardParts.push(q.reward.gems+" 💎");
    if(q.reward.xp) rewardParts.push(q.reward.xp+" XP");
    const div=document.createElement("div");
    div.className="qitem"+(claimed?" done":"");
    div.innerHTML=
      '<div class="icon">'+q.icon+'</div>'+
      '<div class="body"><div class="t">'+q.name+'</div><div class="desc" style="font-size:11px;color:var(--text-dim);">'+q.desc+'</div>'+
      '<div class="prog"><i style="width:'+(val/q.target*100)+'%"></i></div>'+
      '<div class="reward">Reward: '+rewardParts.join(" + ")+'</div></div>'+
      '<button class="claim" '+((complete&&!claimed)?"":"disabled")+'>'+(claimed?"Claimed":"Claim")+'</button>';
    div.querySelector(".claim").onclick=()=>{
      if(complete && !claimed){
        dq.claimed.push(qid);
        state.totalDailyQuestsClaimed=(state.totalDailyQuestsClaimed||0)+1;
        addCoins(q.reward.coins||0);
        addGems(q.reward.gems||0);
        addXP(q.reward.xp||0);
        sfx.victory(); toast("🗓️ Daily quest complete: "+q.name+"!");
        checkAchievements();
        renderDailyQuests(); save();
      }
    };
    list.appendChild(div);
  });
  const resetEl=document.getElementById("dailyQuestReset");
  if(resetEl) resetEl.textContent = dq.claimed.length+" / "+dq.questIds.length+" claimed today";
}
