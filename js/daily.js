"use strict";

/* ============================================================
   DAILY REWARD
   ============================================================ */
const DAILY_TABLE=[
  {coins:50,xp:10},{coins:80,xp:20},{coins:120,xp:30},{coins:180,xp:40},
  {coins:250,xp:60},{coins:320,xp:80},{coins:500,xp:150}
];
function isNewDay(ts1,ts2){
  const d1=new Date(ts1), d2=new Date(ts2);
  return d1.toDateString()!==d2.toDateString();
}
function checkDailyAvailable(){
  const dot=document.getElementById("dailyDot");
  const available = !state.lastDailyClaim || isNewDay(state.lastDailyClaim, Date.now());
  dot.classList.toggle("hidden", !available);
  return available;
}
document.getElementById("btnDaily").addEventListener("click", ()=>{
  if(!checkDailyAvailable()){ toast("Come back tomorrow for your next reward!"); return; }
  openDailyWheel();
});
function openDailyWheel(){
  const idx = state.dailyStreak % DAILY_TABLE.length;
  const segCount=DAILY_TABLE.length;
  const overlay=document.createElement("div");
  overlay.className="overlay";
  const colors=["#c0392b","#2d9d6f","#f0c419","#8e6bd8","#3a8bd8","#e07b39","#d63a8f"];
  let gradient = "conic-gradient(";
  const slice=360/segCount;
  for(let i=0;i<segCount;i++){
    gradient += colors[i%colors.length]+" "+(i*slice)+"deg "+((i+1)*slice)+"deg"+(i<segCount-1?", ":"");
  }
  gradient+=")";
  overlay.innerHTML=
    '<div class="modal"><h2>🎁 Daily Reward</h2><p>Spin the wheel for today\u2019s reward! Streak: '+state.dailyStreak+' days</p>'+
    '<div class="wheel-wrap"><div class="ptr">🔻</div><div class="wheel" id="dailyWheel" style="background:'+gradient+'"></div>'+
    '<button class="royal-btn" id="spinBtn">Spin the Wheel</button></div></div>';
  document.body.appendChild(overlay);
  document.getElementById("spinBtn").onclick=()=>{
    const wheel=document.getElementById("dailyWheel");
    const spins=4+Math.floor(Math.random()*2);
    const target = 360*spins + (segCount-1-idx)*slice + slice/2;
    wheel.style.transform="rotate("+target+"deg)";
    document.getElementById("spinBtn").disabled=true;
    sfx.upgrade();
    setTimeout(()=>{
      const reward=DAILY_TABLE[idx];
      addCoins(reward.coins); addXP(reward.xp);
      state.dailyStreak++; state.lastDailyClaim=Date.now();
      sfx.dailyReward(); sfx.victory(); confettiBurst();
      const wb=wheel.getBoundingClientRect();
      burstParticles(wb.left+wb.width/2, wb.top+wb.height/2, "#f0c419", 18);
      burstParticles(wb.left+wb.width/2, wb.top+wb.height/2, "#fbe28a", 12);
      floatText(wb.left+wb.width/2-24, wb.top, "+"+reward.coins+"🪙 +"+reward.xp+"xp", "#f0c419");
      checkAchievements(); checkDailyAvailable(); save();
      const modal=overlay.querySelector(".modal");
      modal.innerHTML='<div class="bigicon">🎉</div><h2>You won!</h2><p>+'+reward.coins+' Coins, +'+reward.xp+' XP</p><div style="margin-top:16px;"><button class="royal-btn" id="modalClose2">Nice!</button></div>';
      overlay.querySelector("#modalClose2").onclick=()=>closeOverlay(overlay);
    },3600);
  };
}
