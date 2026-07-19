"use strict";

/* ============================================================
   WORLD MAP
   ------------------------------------------------------------
   6 islands, each with its own merge-item chains (ISLAND_DEFS in
   js/data.js). Opens as a hand-rolled full-screen overlay from a
   new #btnWorldMap icon in the top nav — same established pattern
   as the Shop and Daily Reward popups.

   - Owns state.unlockedIslands / state.activeIsland (added
     additively in state.js's defaultState()). Both default to
     just "grassland" for old and new saves alike, and Grassland's
     chain pool is exactly the original BASE_CHAINS — so nothing
     about existing gameplay changes unless the player actually
     opens the map and travels somewhere else.
   - board.js's randomBaseChain() now spawns from the active
     island's chain pool instead of a hardcoded BASE_CHAINS — that
     one-line change is what makes "unique merge items per island"
     real rather than cosmetic.
   - checkIslandUnlocks() mirrors checkAchievements()'s shape
     exactly (target + valueFn, unlock once, toast, save) and is
     called from the same tick loop in main.js.
   - Unique backgrounds are CSS classes on the board itself
     (.board.isl-forest etc. in styles.css) with a CSS transition,
     not new images — swapped by applyIslandTheme() whenever the
     active island changes, which is what gives the "smooth
     transition between islands" (Requirement 4).
   ============================================================ */

let worldMapOverlay=null;

function islandProgressValue(island){
  if(island.target<=0) return 1;
  return Math.min(island.target, island.valueFn(state));
}
function islandUnlocked(id){
  return state.unlockedIslands.includes(id);
}

/* ----------------------------------------------------------------
   checkIslandUnlocks() — called every tick (main.js), mirrors
   checkAchievements(): unlock once, toast, save. Never re-locks.
   ---------------------------------------------------------------- */
function checkIslandUnlocks(){
  let newly=[];
  ISLAND_DEFS.forEach(island=>{
    if(!islandUnlocked(island.id) && islandProgressValue(island)>=island.target){
      state.unlockedIslands.push(island.id);
      newly.push(island);
    }
  });
  if(newly.length){
    save();
    newly.forEach(island=>toast("🗺️ "+island.name+" unlocked! Visit the World Map to travel there."));
    if(worldMapOverlay) renderWorldMapPanel();
  }
}

/* ----------------------------------------------------------------
   applyIslandTheme() — swaps the board's background class. Called
   on boot and whenever the active island changes. The CSS
   transition on .board (styles.css) is what makes this smooth.
   ---------------------------------------------------------------- */
function applyIslandTheme(){
  const board=document.getElementById("board");
  if(!board) return;
  ISLAND_DEFS.forEach(i=>board.classList.remove(i.themeClass));
  const island=ISLAND_DEFS.find(i=>i.id===(state.activeIsland||"grassland")) || ISLAND_DEFS[0];
  board.classList.add(island.themeClass);
}

function travelToIsland(id){
  if(!islandUnlocked(id) || state.activeIsland===id) return;
  state.activeIsland=id;
  save();
  applyIslandTheme();
  renderBoard();
  const island=ISLAND_DEFS.find(i=>i.id===id);
  toast("🧭 Welcome to "+island.name+"!");
  renderWorldMapPanel();
}

/* ----------------------------------------------------------------
   Rendering
   ---------------------------------------------------------------- */
function islandCardEl(island){
  const unlocked=islandUnlocked(island.id);
  const active=state.activeIsland===island.id;
  const card=document.createElement("div");
  card.className="isl-card "+island.themeClass+(unlocked?" unlocked":" locked")+(active?" active":"");

  const top=document.createElement("div");
  top.className="isl-card-top";
  const icon=document.createElement("span");
  icon.className="isl-icon";
  icon.textContent=unlocked?island.icon:"🔒";
  const name=document.createElement("span");
  name.className="isl-name";
  name.textContent=island.name;
  top.appendChild(icon); top.appendChild(name);
  card.appendChild(top);

  if(unlocked){
    const btn=document.createElement("button");
    btn.className="royal-btn"+(active?" ghost":"");
    btn.style.cssText="margin-top:8px; width:100%; padding:8px; font-size:12px;";
    btn.textContent=active?"Current Island":"Travel Here";
    btn.disabled=active;
    btn.onclick=()=>travelToIsland(island.id);
    card.appendChild(btn);
  } else {
    const val=islandProgressValue(island);
    const pct=island.target>0 ? Math.min(100, val/island.target*100) : 0;
    const prog=document.createElement("div");
    prog.className="prog";
    prog.innerHTML='<i style="width:'+pct+'%;"></i>';
    const label=document.createElement("div");
    label.className="isl-unlock-label";
    label.textContent=island.unlockLabel+" ("+fmt(val)+" / "+fmt(island.target)+")";
    card.appendChild(prog);
    card.appendChild(label);
  }
  return card;
}

function renderWorldMapPanel(){
  if(!worldMapOverlay) return;
  const grid=worldMapOverlay.querySelector("#islandGrid");
  grid.innerHTML="";
  ISLAND_DEFS.forEach(island=> grid.appendChild(islandCardEl(island)));
}

function openWorldMap(){
  if(worldMapOverlay) return;
  const overlay=document.createElement("div");
  overlay.className="overlay";
  overlay.innerHTML=
    '<div class="modal worldmap-modal">'+
      '<button class="shop-close" id="worldMapClose" aria-label="Close">✕</button>'+
      '<div class="bigicon">🗺️</div>'+
      '<h2>World Map</h2>'+
      '<p>Unlock new islands to discover unique merge chains.</p>'+
      '<div class="isl-grid" id="islandGrid"></div>'+
    '</div>';
  document.body.appendChild(overlay);
  worldMapOverlay=overlay;
  overlay.querySelector("#worldMapClose").onclick=closeWorldMap;
  overlay.addEventListener("click",(e)=>{ if(e.target===overlay) closeWorldMap(); });
  renderWorldMapPanel();
}
function closeWorldMap(){
  if(!worldMapOverlay) return;
  worldMapOverlay.remove();
  worldMapOverlay=null;
}

document.getElementById("btnWorldMap").addEventListener("click", openWorldMap);
