"use strict";

/* ============================================================
   DAILY LOGIN REWARD — POPUP UI (Step 2)
   ------------------------------------------------------------
   This file owns the 7-day Daily Login Reward popup and nothing
   else. It reads the state.dailyReward namespace (added in Step 1
   — see js/state.js) purely for display: which day is current,
   which days are already claimed, and whether today can be
   claimed. It does not grant coins/XP, does not advance
   state.dailyReward, and does not call save() — that all belongs
   to a later "claim logic" step.

   Nothing here is wired to an existing button yet; call
   openDailyRewardPopup() to preview it (e.g. from the console)
   until a later step adds the trigger.

   EXPOSES (globally)
       openDailyRewardPopup()
       closeDailyRewardPopup()
   ============================================================ */

/* Display-only reward preview for the 7-day cycle. This is a new,
   separate table from daily.js's DAILY_TABLE (which belongs to the
   existing spin-wheel reward) — different feature, own data, per
   PROJECT_RULES.md Section 6.3/11.3 (new systems get their own
   namespaced data rather than repurposing an existing table). */
const DAILY_REWARD_TABLE = [
  { day:1, icon:"🪙", coins:50  },
  { day:2, icon:"🪙", coins:80  },
  { day:3, icon:"🪙", coins:120 },
  { day:4, icon:"🪙", coins:180 },
  { day:5, icon:"🪙", coins:250 },
  { day:6, icon:"🎁", coins:320 },
  { day:7, icon:"👑", coins:500 }
];

let dailyRewardOverlay = null;

function dailyRewardDayStatus(dayNum){
  const dr = state.dailyReward || defaultState().dailyReward;
  if(dayNum < dr.currentDay) return "claimed";
  if(dayNum === dr.currentDay) return "current";
  return "locked";
}

function renderDailyRewardGrid(){
  return DAILY_REWARD_TABLE.map(entry=>{
    const status = dailyRewardDayStatus(entry.day);
    return (
      '<div class="dr-day dr-'+status+'">'+
        '<div class="dr-daylabel">Day '+entry.day+'</div>'+
        '<div class="dr-icon">'+(status==="claimed" ? "✅" : entry.icon)+'</div>'+
        '<div class="dr-coins">'+entry.coins+'</div>'+
      '</div>'
    );
  }).join("");
}

function openDailyRewardPopup(){
  if(dailyRewardOverlay) return; // already open

  const overlay=document.createElement("div");
  overlay.className="overlay";
  overlay.innerHTML=
    '<div class="modal dr-modal">'+
      '<button class="dr-close" id="drClose" aria-label="Close">✕</button>'+
      '<div class="bigicon">🎁</div>'+
      '<h2>Daily Login Reward</h2>'+
      '<p>Come back each day to grow your streak and claim bigger rewards.</p>'+
      '<div class="dr-grid">'+renderDailyRewardGrid()+'</div>'+
      '<div class="dr-actions">'+
        '<button class="royal-btn" id="drClaimBtn" disabled>Claim Reward</button>'+
      '</div>'+
    '</div>';

  document.body.appendChild(overlay);
  dailyRewardOverlay = overlay;

  overlay.querySelector("#drClose").onclick = closeDailyRewardPopup;
  // Backdrop click closes too, matching the non-blocking-dialog rule (no alert/prompt).
  overlay.addEventListener("click",(e)=>{ if(e.target===overlay) closeDailyRewardPopup(); });
}

function closeDailyRewardPopup(){
  if(!dailyRewardOverlay) return;
  dailyRewardOverlay.remove();
  dailyRewardOverlay = null;
}
