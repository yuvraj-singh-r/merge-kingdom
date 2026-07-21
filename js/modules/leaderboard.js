"use strict";

/* ============================================================
   MODULE — leaderboard.js
   STATUS: Implemented — Online Leaderboard.

   RESPONSIBILITY
   Global Top-100 leaderboard across 6 categories (Kingdom Level,
   Coins, Gems, Achievements, Login Streak, Merge Count). Backed by
   a new Firestore collection, separate from the existing
   users/{uid} cloud-save document — this is public, cross-account
   data by design (every player's entry must be readable by every
   other player), so it cannot share the private cloud-save doc or
   its security rules.

   FIRESTORE DOCUMENT SHAPE — leaderboard/{uid}
       {
         displayName, photoURL,
         level, coins, gems, achievements, streak, merges,
         updatedAt
       }
   NOTE: the Firestore security rules for this collection need to
   be configured server-side (in the Firebase console) to allow
   public read access but restrict writes to
   `request.auth.uid == resource.id` — the same way users/{uid}
   needs its own rule for cloudsave.js. This file cannot set that
   up itself.

   - "Automatically upload player stats when values change" is
     implemented as a 60-second interval (mirroring cloudsave.js's
     own autosave cadence) plus an immediate sync whenever the
     Leaderboard panel is opened — not a write on every single
     coin/merge, which would be excessive Firestore traffic for a
     leaderboard's precision needs. Documented here so it reads as
     a deliberate choice, not a gap.
   - Sanitization (PROJECT_RULES.md Section 10): player display
     names and avatar URLs are remote, other-user-supplied data.
     They are always assigned via .textContent / .src (DOM
     properties), never concatenated into innerHTML strings.
   - UI follows the existing tab pattern (Section 8) — a real
     "🏅 Leaderboard" tab, not a popup, since (unlike Shop/Daily
     Reward) there's no existing overlay precedent for this kind of
     browsable, comparison-driven panel.

   EXPOSES (globally)
       openLeaderboardPanel()   — called from panels.js's
                                   renderForTab() when the tab opens
       syncLeaderboardEntry()
   ============================================================ */

const LEADERBOARD_CATEGORIES=[
  {id:"level",        label:"Highest Kingdom Level", icon:"⭐", field:"level"},
  {id:"coins",        label:"Highest Coins",         icon:"🪙", field:"coins"},
  {id:"gems",         label:"Highest Gems",          icon:"💎", field:"gems"},
  {id:"achievements", label:"Most Achievements",     icon:"🏆", field:"achievements"},
  {id:"streak",       label:"Longest Login Streak",  icon:"🎁", field:"streak"},
  {id:"merges",       label:"Highest Merge Count",   icon:"🔀", field:"merges"}
];
const LEADERBOARD_SYNC_MS=60000;

let lbActiveCategory="level";
let lbCache=null;
let lbLoading=false;
let lbError=null;

function getLeaderboardCollection(){
  return window.firebaseDB ? window.firebaseDB.collection("leaderboard") : null;
}

/* ----------------------------------------------------------------
   syncLeaderboardEntry()
   Uploads the current player's stats. Silent no-op when signed out
   or the game hasn't started — safe to call from an interval.
   ---------------------------------------------------------------- */
function syncLeaderboardEntry(){
  const user=getCurrentUser();
  if(!user || !state) return;
  const col=getLeaderboardCollection();
  if(!col) return;
  col.doc(user.uid).set({
    displayName: user.displayName || "Anonymous Ruler",
    photoURL: user.photoURL || null,
    level: state.level,
    coins: state.coins,
    gems: state.gems,
    achievements: state.achievementsClaimed.length,
    streak: state.dailyStreak,
    merges: state.totalMerges,
    updatedAt: Date.now()
  }).catch(e=>console.warn("[leaderboard.js] Failed to sync leaderboard entry:",e));
}
setInterval(syncLeaderboardEntry, LEADERBOARD_SYNC_MS);

/* ----------------------------------------------------------------
   Fetch + render
   ---------------------------------------------------------------- */
function fetchLeaderboardCategory(cat){
  const col=getLeaderboardCollection();
  if(!col) return Promise.reject(new Error("Firestore isn't ready."));
  return col.orderBy(cat.field,"desc").limit(100).get().then(snap=>{
    return snap.docs.map(d=>Object.assign({uid:d.id}, d.data()));
  });
}
function loadLeaderboard(){
  lbLoading=true; lbError=null;
  renderLeaderboardPanel();
  const results={};
  Promise.all(LEADERBOARD_CATEGORIES.map(cat=>
    fetchLeaderboardCategory(cat).then(entries=>{ results[cat.id]=entries; })
  )).then(()=>{
    lbCache=results;
  }).catch(e=>{
    console.warn("[leaderboard.js] Failed to load leaderboard:",e);
    lbError="Couldn't load the leaderboard. Check your connection and try again.";
    if(typeof sfx!=="undefined") sfx.error();
  }).finally(()=>{
    lbLoading=false;
    renderLeaderboardPanel();
  });
}

function leaderboardAvatarEl(entry){
  if(entry.photoURL){
    const img=document.createElement("img");
    img.className="lb-avatar";
    img.alt="";
    img.src=entry.photoURL; // assigned as a DOM property, never concatenated into HTML
    img.onerror=()=>{ img.replaceWith(leaderboardAvatarFallbackEl()); };
    return img;
  }
  return leaderboardAvatarFallbackEl();
}
function leaderboardAvatarFallbackEl(){
  const div=document.createElement("div");
  div.className="lb-avatar lb-avatar-fallback";
  div.textContent="👑";
  return div;
}
function leaderboardRowEl(entry, rank, isMe, valueLabel){
  const row=document.createElement("div");
  row.className="lb-row"+(isMe?" me":"");
  const rankEl=document.createElement("div");
  rankEl.className="lb-rank";
  rankEl.textContent="#"+rank;
  const nameEl=document.createElement("div");
  nameEl.className="lb-name";
  nameEl.textContent=entry.displayName || "Anonymous Ruler"; // .textContent — never innerHTML (Section 10)
  const valEl=document.createElement("div");
  valEl.className="lb-value";
  valEl.textContent=valueLabel;
  row.appendChild(rankEl);
  row.appendChild(leaderboardAvatarEl(entry));
  row.appendChild(nameEl);
  row.appendChild(valEl);
  return row;
}

function renderLeaderboardCategoryButtons(){
  const el=document.getElementById("lbCategories");
  if(!el) return;
  el.innerHTML="";
  LEADERBOARD_CATEGORIES.forEach(cat=>{
    const btn=document.createElement("button");
    btn.className="lb-cat-btn"+(cat.id===lbActiveCategory?" active":"");
    btn.textContent=cat.icon+" "+cat.label;
    btn.disabled=lbLoading;
    btn.onclick=()=>{ lbActiveCategory=cat.id; renderLeaderboardPanel(); };
    el.appendChild(btn);
  });
}
function renderLeaderboardStatus(){
  const el=document.getElementById("lbStatus");
  if(!el) return;
  el.innerHTML="";
  if(lbLoading){
    const div=document.createElement("div");
    div.className="lb-status";
    div.textContent="⏳ Loading leaderboard…";
    el.appendChild(div);
    return;
  }
  if(lbError){
    const div=document.createElement("div");
    div.className="lb-status lb-error";
    div.textContent="⚠️ "+lbError+" ";
    const retry=document.createElement("button");
    retry.className="royal-btn ghost";
    retry.style.cssText="padding:6px 12px; font-size:12px; margin-left:8px;";
    retry.textContent="Retry";
    retry.onclick=loadLeaderboard;
    div.appendChild(retry);
    el.appendChild(div);
    return;
  }
  if(!getCurrentUser()){
    const div=document.createElement("div");
    div.className="lb-status";
    div.textContent="Sign in with Google to appear on the leaderboard and track your rank.";
    const signIn=document.createElement("button");
    signIn.className="royal-btn ghost";
    signIn.style.cssText="padding:6px 12px; font-size:12px; margin-left:8px;";
    signIn.textContent="🔑 Sign in with Google";
    signIn.onclick=()=>{
      if(typeof loginWithGoogle==="function"){
        loginWithGoogle().then(()=>{ syncLeaderboardEntry(); loadLeaderboard(); }).catch(()=>{});
      }
    };
    div.appendChild(signIn);
    el.appendChild(div);
  }
}
function renderLeaderboardList(){
  const el=document.getElementById("lbList");
  if(!el) return;
  el.innerHTML="";
  if(lbLoading || lbError || !lbCache) return; // status area already covers these states
  const cat=LEADERBOARD_CATEGORIES.find(c=>c.id===lbActiveCategory);
  const entries=lbCache[cat.id]||[];
  const myUid=getCurrentUser() ? getCurrentUser().uid : null;
  if(!entries.length){
    const empty=document.createElement("div");
    empty.className="lb-status";
    empty.textContent="No rankings yet — be the first to appear here!";
    el.appendChild(empty);
    return;
  }
  entries.forEach((entry,i)=>{
    el.appendChild(leaderboardRowEl(entry, i+1, entry.uid===myUid, fmt(entry[cat.field]||0)));
  });
}
function renderLeaderboardPanel(){
  renderLeaderboardCategoryButtons();
  renderLeaderboardStatus();
  renderLeaderboardList();
}

/* ----------------------------------------------------------------
   openLeaderboardPanel()
   Called from panels.js's renderForTab() when the Leaderboard tab
   is opened — syncs this player's own entry, then downloads all 6
   Top-100 lists (Requirement 6: download on open).
   ---------------------------------------------------------------- */
function openLeaderboardPanel(){
  syncLeaderboardEntry();
  loadLeaderboard();
}
