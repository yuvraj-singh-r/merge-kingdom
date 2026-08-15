"use strict";

/* ============================================================
   BOARD / MERGE LOGIC
   ============================================================ */

/* ---------- Spawn / Item Helpers ---------- */

function randomBaseChain(){
  const island =
    ISLAND_DEFS.find(
      i => i.id === (state.activeIsland || "grassland")
    ) || ISLAND_DEFS[0];

  const pool = island.chains;

  return pool[Math.floor(Math.random() * pool.length)];
}

function makeSpawnItem(){
  if(Math.random() < rareChance()){
    const sp =
      SPECIALS[Math.floor(Math.random() * SPECIALS.length)];

    return { special: sp.id };
  }

  return {
    chain: randomBaseChain(),
    tier: 0
  };
}

function iconFor(item){
  if(!item) return "";

  if(item.special){
    const sp = SPECIALS.find(
      s => s.id === item.special
    );

    return sp ? sp.icon : "❓";
  }

  if(
    !CHAINS[item.chain] ||
    !CHAINS[item.chain].tiers[item.tier]
  ){
    return "❓";
  }

  return CHAINS[item.chain].tiers[item.tier].icon || "❓";
}

function nameFor(item){
  if(!item) return "";

  if(item.special){
    const sp = SPECIALS.find(
      s => s.id === item.special
    );

    return sp ? sp.name : "?";
  }

  if(
    !CHAINS[item.chain] ||
    !CHAINS[item.chain].tiers[item.tier]
  ){
    return "?";
  }

  return CHAINS[item.chain].tiers[item.tier].name;
}

function imageFor(item){
  if(
    !item ||
    item.special ||
    !CHAINS[item.chain] ||
    !CHAINS[item.chain].tiers[item.tier]
  ){
    return null;
  }

  return CHAINS[item.chain].tiers[item.tier].image || null;
}


/* ---------- Collection ---------- */

function discover(item){
  if(!item) return;

  let key;

  if(item.special){
    key = "special:" + item.special;
  }else{
    key = item.chain + ":" + item.tier;
  }

  if(!state.collection.includes(key)){
    state.collection.push(key);

    if(
      item.special &&
      !state.specialsFound.includes(item.special)
    ){
      state.specialsFound.push(item.special);
    }

    toast(
      "📖 New discovery: " +
      nameFor(item) +
      "!"
    );
  }
}


/* ============================================================
   BOARD RENDERING
   ============================================================ */

let lastMergedTileIndex = null;

function renderBoard(){
  const board = document.getElementById("board");

  if(!board) return;

  board.innerHTML = "";

  state.board.forEach((item, i) => {

    const cell = document.createElement("div");

    cell.className = "cell";
    cell.dataset.index = i;

    if(item){

      const tile = document.createElement("div");

      tile.className =
        "tile" +
        (item.special ? " special" : "") +
        (i === lastMergedTileIndex ? " tile-pop" : "");

      tile.dataset.index = i;
      tile.title = nameFor(item);

      /*
       * If the item has an image, use the image.
       * Otherwise use the normal emoji icon.
       */
      const image = imageFor(item);

      if(image){

        const img = document.createElement("img");

        img.src = image;
        img.alt = nameFor(item);
        img.draggable = false;

        img.onerror = function(){
          img.remove();
          tile.textContent = iconFor(item);
        };

        tile.appendChild(img);

      }else{

        tile.textContent = iconFor(item);

      }

      tile.addEventListener(
        "pointerdown",
        onTilePointerDown
      );

      cell.appendChild(tile);
    }

    board.appendChild(cell);
  });

  lastMergedTileIndex = null;
}


/* ============================================================
   BOARD DRAG & DROP
   ============================================================ */

let dragCtx = null;

function onTilePointerDown(e){

  e.preventDefault();

  const srcIndex =
    parseInt(
      e.currentTarget.dataset.index,
      10
    );

  const item = state.board[srcIndex];

  if(!item) return;

  sfx.click();

  const rect =
    e.currentTarget.getBoundingClientRect();

  const clone =
    e.currentTarget.cloneNode(true);

  clone.classList.add("dragging");

  clone.style.width =
    rect.width + "px";

  clone.style.height =
    rect.height + "px";

  clone.style.left =
    rect.left + "px";

  clone.style.top =
    rect.top + "px";

  document.body.appendChild(clone);

  e.currentTarget.style.opacity = "0.25";

  dragCtx = {
    srcIndex,
    clone,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    origEl: e.currentTarget,
    moved: false
  };

  document.addEventListener(
    "pointermove",
    onDragMove
  );

  document.addEventListener(
    "pointerup",
    onDragEnd
  );
}

function onDragMove(e){

  if(!dragCtx) return;

  dragCtx.moved = true;

  dragCtx.clone.style.left =
    (e.clientX - dragCtx.offsetX) + "px";

  dragCtx.clone.style.top =
    (e.clientY - dragCtx.offsetY) + "px";

  document
    .querySelectorAll(".cell.dragover")
    .forEach(c =>
      c.classList.remove("dragover")
    );

  const el =
    document.elementFromPoint(
      e.clientX,
      e.clientY
    );

  const cell =
    el && el.closest
      ? el.closest(".cell")
      : null;

  if(cell){
    cell.classList.add("dragover");
  }
}

function onDragEnd(e){

  document.removeEventListener(
    "pointermove",
    onDragMove
  );

  document.removeEventListener(
    "pointerup",
    onDragEnd
  );

  if(!dragCtx) return;

  document
    .querySelectorAll(".cell.dragover")
    .forEach(c =>
      c.classList.remove("dragover")
    );

  const el =
    document.elementFromPoint(
      e.clientX,
      e.clientY
    );

  const cell =
    el && el.closest
      ? el.closest(".cell")
      : null;

  const wasMoved = dragCtx.moved;
  const srcIndex = dragCtx.srcIndex;

  dragCtx.clone.remove();

  if(dragCtx.origEl){
    dragCtx.origEl.style.opacity = "1";
  }

  dragCtx = null;

  /*
   * Simple tap
   */
  if(!wasMoved){
    tapTile(srcIndex);
    return;
  }

  /*
   * Drag to a board cell
   */
  if(cell){

    const targetIndex =
      parseInt(
        cell.dataset.index,
        10
      );

    handleDrop(
      srcIndex,
      targetIndex
    );
  }
}


/* ============================================================
   BOARD DROP / MERGE
   ============================================================ */

function handleDrop(
  srcIndex,
  targetIndex
){

  if(srcIndex === targetIndex) return;

  const src =
    state.board[srcIndex];

  const tgt =
    state.board[targetIndex];

  if(!src) return;

  /*
   * Empty cell
   */
  if(!tgt){

    state.board[targetIndex] = src;
    state.board[srcIndex] = null;

  }

  /*
   * Same item
   */
  else if(
    !src.special &&
    !tgt.special &&
    tgt.chain === src.chain &&
    tgt.tier === src.tier
  ){

    state.board[targetIndex] = src;
    state.board[srcIndex] = null;

  }

  /*
   * Swap
   */
  else{

    state.board[targetIndex] = src;
    state.board[srcIndex] = tgt;
  }

  renderBoard();

  if(!src.special){
    runAutoMergeLoop(targetIndex);
  }

  save();
}


/* ============================================================
   NEIGHBOURS
   ============================================================ */

function neighbors(i){

  const r = Math.floor(i / 6);
  const c = i % 6;

  const out = [];

  if(r > 0) out.push(i - 6);
  if(r < 5) out.push(i + 6);
  if(c > 0) out.push(i - 1);
  if(c < 5) out.push(i + 1);

  return out;
}


/* ============================================================
   FIND CONNECTED GROUP
   ============================================================ */

function findGroup(startIndex){

  const item =
    state.board[startIndex];

  if(!item || item.special){
    return [];
  }

  const seen =
    new Set([startIndex]);

  const stack =
    [startIndex];

  const group =
    [startIndex];

  while(stack.length){

    const cur =
      stack.pop();

    neighbors(cur).forEach(n => {

      if(seen.has(n)) return;

      const it =
        state.board[n];

      if(
        it &&
        !it.special &&
        it.chain === item.chain &&
        it.tier === item.tier
      ){

        seen.add(n);
        group.push(n);
        stack.push(n);
      }
    });
  }

  return group;
}


/* ============================================================
   AUTO MERGE LOOP
   ============================================================ */

function runAutoMergeLoop(
  preferIndex
){

  let mergedAny = false;
  let safety = 0;
  let comboCount = 0;

  while(safety++ < 200){

    let didOne = false;

    const order =
      preferIndex != null
        ? [
            preferIndex,
            ...state.board.map((_, i) => i)
          ]
        : state.board.map(
            (_, i) => i
          );

    const already = new Set();

    for(const idx of order){

      if(already.has(idx)) continue;
      if(!state.board[idx]) continue;

      const group =
        findGroup(idx);

      group.forEach(g =>
        already.add(g)
      );

      if(group.length >= 3){

        performMerge(
          group,
          idx
        );

        comboCount++;
        mergedAny = true;
        didOne = true;

        preferIndex = null;

        break;
      }
    }

    if(!didOne) break;
  }

  if(
    comboCount >
    (state.highestCombo || 0)
  ){
    state.highestCombo =
      comboCount;
  }

  if(mergedAny){

    renderBoard();

    if(typeof refreshActiveTab === "function"){
      refreshActiveTab();
    }
  }
}


/* ============================================================
   PERFORM MERGE
   ============================================================ */

function performMerge(
  group,
  landIndex
){

  const item =
    state.board[group[0]];

  if(
    !item ||
    item.special ||
    !CHAINS[item.chain]
  ){
    return;
  }

  const chain =
    CHAINS[item.chain];

  const useCells =
    group.slice(0, 3);

  const rect =
    document.querySelector(
      '.cell[data-index="' +
      landIndex +
      '"]'
    );

  const rectBox =
    rect
      ? rect.getBoundingClientRect()
      : null;

  /*
   * Remove the other two items.
   */
  useCells.forEach(idx => {

    if(idx !== landIndex){
      state.board[idx] = null;
    }

  });

  const nextTier =
    item.tier + 1;

  let resultItem;

  /*
   * Normal tier progression
   */
  if(nextTier < chain.tiers.length){

    resultItem = {
      chain: item.chain,
      tier: nextTier
    };

  }

  /*
   * Already at final tier.
   * Keep final tier instead of creating an invalid tier.
   */
  else{

    resultItem = {
      chain: item.chain,
      tier: item.tier
    };
  }

  state.board[landIndex] =
    resultItem;

  state.totalMerges++;

  state.maxTier[item.chain] =
    Math.max(
      state.maxTier[item.chain] || 0,
      resultItem.tier
    );

  discover(resultItem);

  /*
   * Rewards
   */
  let coinGain =
    3 * (item.tier + 1);

  let xpGain =
    2 * (item.tier + 1);

  /*
   * Wood bonus
   */
  if(item.chain === "wood"){

    coinGain *=
      1 +
      (state.upgrades.village || 0) * 0.1;
  }

  /*
   * Coin chain bonus
   */
  if(item.chain === "coins"){

    coinGain *=
      1 +
      (state.upgrades.economy || 0) * 0.1;
  }

  /*
   * Luck bonus
   */
  if(Math.random() < luckChance()){

    coinGain *= 2;
    xpGain *= 2;
  }

  state.score +=
    5 * (item.tier + 1);

  addCoins(coinGain);
  addXP(xpGain);

  sfx.merge();

  lastMergedTileIndex =
    landIndex;

  if(rectBox){

    burstParticles(
      rectBox.left +
        rectBox.width / 2,

      rectBox.top +
        rectBox.height / 2,

      "#f0c419",
      12
    );

    floatText(
      rectBox.left +
        rectBox.width / 2 -
        16,

      rectBox.top,

      "+" +
        Math.round(coinGain) +
        "🪙 +" +
        Math.round(xpGain) +
        "xp"
    );
  }

  checkAchievements();
}


/* ============================================================
   SPECIAL ITEM TAP
   ============================================================ */

function tapTile(index){

  const item =
    state.board[index];

  if(!item) return;

  if(item.special){

    const sp =
      SPECIALS.find(
        s => s.id === item.special
      );

    if(!sp) return;

    addCoins(sp.coins);
    addXP(sp.xp);

    discover(item);

    sfx.chestOpen();

    const rect =
      document.querySelector(
        '.cell[data-index="' +
        index +
        '"]'
      );

    if(rect){

      const rb =
        rect.getBoundingClientRect();

      burstParticles(
        rb.left + rb.width / 2,
        rb.top + rb.height / 2,
        "#8e6bd8",
        16
      );

      floatText(
        rb.left + rb.width / 2 - 20,
        rb.top,
        "+" +
          sp.coins +
          "🪙 +" +
          sp.xp +
          "XP",
        "#8e6bd8"
      );
    }

    toast(
      "✨ You opened the " +
      sp.name +
      "!"
    );

    state.board[index] = null;

    renderBoard();
    save();
    checkAchievements();
  }
}


/* ============================================================
   SPAWNER
   ============================================================ */

function updateSpawnerUI(){

  if(!state) return;

  const el =
    document.getElementById("spawnIcon");

  const ring =
    document.getElementById("spawnRing");

  if(!el || !ring) return;

  if(state.spawnReady){

    el.textContent = "➕";

    ring.style.transform =
      "rotate(360deg)";

  }else{

    const total =
      spawnCooldownMs();

    const remaining =
      Math.max(
        0,
        state.spawnNext - Date.now()
      );

    const pct =
      Math.min(
        1,
        Math.max(
          0,
          1 - remaining / total
        )
      );

    el.textContent = "⏳";

    ring.style.transform =
      "rotate(" +
      (pct * 360) +
      "deg)";
  }

  renderQueue();
}


/* ============================================================
   HOLDING QUEUE
   ============================================================ */

function renderQueue(){

  const row =
    document.getElementById("queueRow");

  if(!row || !state) return;

  row.innerHTML = "";

  const cap =
    queueCapacity();

  for(let i = 0; i < cap; i++){

    const slot =
      document.createElement("div");

    slot.className =
      "qslot" +
      (state.queue[i]
        ? " filled"
        : "");

    if(state.queue[i]){

      const item =
        state.queue[i];

      const image =
        imageFor(item);

      if(image){

        const img =
          document.createElement("img");

        img.src = image;
        img.alt = nameFor(item);
        img.draggable = false;

        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.style.pointerEvents = "none";

        img.onerror = function(){

          img.remove();

          slot.textContent =
            iconFor(item);
        };

        slot.appendChild(img);

      }else{

        slot.textContent =
          iconFor(item);
      }

      slot.dataset.qindex = i;
      slot.title = nameFor(item);

      slot.addEventListener(
        "pointerdown",
        onQueuePointerDown
      );
    }

    row.appendChild(slot);
  }
}


/* ============================================================
   QUEUE ITEM DRAG
   ============================================================ */

function onQueuePointerDown(e){

  e.preventDefault();

  const qi =
    parseInt(
      e.currentTarget.dataset.qindex,
      10
    );

  const item =
    state.queue[qi];

  if(!item) return;

  sfx.click();

  const rect =
    e.currentTarget.getBoundingClientRect();

  const clone =
    e.currentTarget.cloneNode(true);

  clone.classList.add(
    "dragging",
    "tile"
  );

  clone.style.width =
    rect.width + "px";

  clone.style.height =
    rect.height + "px";

  clone.style.left =
    rect.left + "px";

  clone.style.top =
    rect.top + "px";

  document.body.appendChild(clone);

  const moveH = ev => {

    clone.style.left =
      (ev.clientX - rect.width / 2) +
      "px";

    clone.style.top =
      (ev.clientY - rect.height / 2) +
      "px";

    document
      .querySelectorAll(
        ".cell.dragover"
      )
      .forEach(c =>
        c.classList.remove("dragover")
      );

    const el2 =
      document.elementFromPoint(
        ev.clientX,
        ev.clientY
      );

    const cell =
      el2 && el2.closest
        ? el2.closest(".cell")
        : null;

    if(cell){
      cell.classList.add("dragover");
    }
  };

  const upH = ev => {

    document.removeEventListener(
      "pointermove",
      moveH
    );

    document.removeEventListener(
      "pointerup",
      upH
    );

    document
      .querySelectorAll(
        ".cell.dragover"
      )
      .forEach(c =>
        c.classList.remove("dragover")
      );

    clone.remove();

    const el2 =
      document.elementFromPoint(
        ev.clientX,
        ev.clientY
      );

    const cell =
      el2 && el2.closest
        ? el2.closest(".cell")
        : null;

    if(!cell) return;

    const targetIndex =
      parseInt(
        cell.dataset.index,
        10
      );

    if(!state.board[targetIndex]){

      state.board[targetIndex] =
        item;

      state.queue.splice(
        qi,
        1
      );

      renderBoard();
      renderQueue();

      if(!item.special){
        runAutoMergeLoop(
          targetIndex
        );
      }

      save();

    }else{

      toast(
        "That spot is occupied!"
      );
    }
  };

  document.addEventListener(
    "pointermove",
    moveH
  );

  document.addEventListener(
    "pointerup",
    upH
  );
}


/* ============================================================
   SPAWNER CLICK
   ============================================================ */

const spawnerElement =
  document.getElementById("spawner");

if(spawnerElement){

  spawnerElement.addEventListener(
    "click",
    () => {

      if(!state) return;

      if(!state.spawnReady){

        toast(
          "⏳ Spawner is still charging!"
        );

        return;
      }

      collectSpawn();
    }
  );
}


/* ============================================================
   COLLECT SPAWN
   ============================================================ */

function collectSpawn(){

  if(!state) return;

  if(
    state.queue.length >=
    queueCapacity()
  ){

    toast(
      "Holding queue is full!"
    );

    return;
  }

  const item =
    makeSpawnItem();

  state.queue.push(item);

  state.spawnReady = false;

  state.spawnNext =
    Date.now() +
    spawnCooldownMs();

  renderQueue();
  updateSpawnerUI();
  save();

  if(item.special){

    toast(
      "✨ A rare treasure appeared!"
    );
  }
}
