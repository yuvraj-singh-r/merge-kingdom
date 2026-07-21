"use strict";

/* ============================================================
   MODULE — cloudsave.js
   STATUS: Implemented — Cloud Save (Firestore).

   RESPONSIBILITY
   - Sync the existing `state` (js/state.js) to/from Firestore.
   - Reuses the existing save()/load() shape exactly: cloud writes
     store the same object save() already writes to localStorage,
     and cloud reads are applied by writing into SAVE_KEY and then
     calling the existing load() merge — never a parallel format
     (see PROJECT_RULES.md, Section 7 & 11).
   - Local localStorage stays authoritative on conflict unless the
     player explicitly chooses the cloud version (Section 7).

   FIRESTORE DOCUMENT SHAPE — users/{uid}
       {
         updatedAt: <ms timestamp>,
         version:   <schema version, currently 1>,
         state:     <the exact object save() persists locally>
       }

   EXPOSES (globally)
       saveToCloud(manual)   -> Promise<boolean>
       loadFromCloud()       -> Promise<{updatedAt,version,state}|null>
       manualCloudSync()     -> wired to the existing #btnCloud button
   ============================================================ */

const CLOUD_SAVE_VERSION = 1;
const CLOUD_AUTOSAVE_MS = 60000;      // auto save every 60s, per spec
const CLOUD_CONFLICT_WINDOW_MS = 5000; // clock-skew / autosave-jitter buffer

let lastCloudSyncAt = 0;
let cloudSyncInFlight = false;
let resolvedForUid = null;
let cloudAuthWatchAttempts = 0;
const CLOUD_AUTH_WATCH_MAX_ATTEMPTS = 40; // ~12s, matches auth.js's own retry budget

/* ----------------------------------------------------------------
   STATUS UI — small, optional. If #cloudStatus isn't in the page
   (older markup), everything else here still works fine.
   ---------------------------------------------------------------- */
function updateCloudStatusUI(text){
  const el = document.getElementById("cloudStatus");
  if(el) el.textContent = text || "";
}
function formatSyncTime(ts){
  try{ return new Date(ts).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}); }
  catch(e){ return ""; }
}

/* ----------------------------------------------------------------
   getCloudDoc() — unchanged from the reserved stub.
   ---------------------------------------------------------------- */
function getCloudDoc() {
    const user = getCurrentUser();

    if (!user) {
        throw new Error("User is not signed in.");
    }

    return window.usersCollection.doc(user.uid);
}

/* ----------------------------------------------------------------
   saveToCloud(manual)
   Pushes the current `state` up to Firestore. `manual` controls
   whether user-facing toasts are shown (the 60s autosave stays
   silent unless it fails loudly; the manual button always confirms).
   ---------------------------------------------------------------- */
async function saveToCloud(manual) {
  const user = getCurrentUser();
  if (!user) {
    if (manual && typeof toast === "function") toast("🔑 Sign in with Google first, then tap Sync.");
    return false;
  }
  if (!state) {
    if (manual && typeof toast === "function") toast("Start your kingdom before saving to the cloud.");
    return false;
  }
  if (!window.usersCollection) {
    console.warn("[cloudsave.js] Firestore isn't ready; skipping cloud save.");
    if (manual && typeof toast === "function") toast("☁️ Cloud save isn't available right now.");
    return false;
  }
  if (cloudSyncInFlight) return false;

  cloudSyncInFlight = true;
  try {
    const docRef = getCloudDoc();
    await docRef.set({
      updatedAt: Date.now(),
      version: CLOUD_SAVE_VERSION,
      state: state
    });
    lastCloudSyncAt = Date.now();
    updateCloudStatusUI("Synced " + formatSyncTime(lastCloudSyncAt));
    if (manual && typeof toast === "function") toast("☁️ Kingdom saved to the cloud!");
    return true;
  } catch (e) {
    console.warn("[cloudsave.js] saveToCloud failed:", e);
    if (manual && typeof toast === "function") { toast("☁️ Cloud save failed. Please try again."); if(typeof sfx!=="undefined") sfx.error(); }
    return false;
  } finally {
    cloudSyncInFlight = false;
  }
}

/* ----------------------------------------------------------------
   loadFromCloud()
   Pure fetch — returns the raw Firestore doc data, or null if the
   player isn't signed in / has no cloud save / the read fails.
   Does not touch localStorage or `state` by itself; see
   applyCloudSave() and resolveCloudSave() for that.
   ---------------------------------------------------------------- */
async function loadFromCloud() {
  const user = getCurrentUser();
  if (!user || !window.usersCollection) return null;
  try {
    const docRef = getCloudDoc();
    const snap = await docRef.get();
    if (!snap.exists) return null;
    const data = snap.data();
    if (!data || !data.state) return null;
    return data;
  } catch (e) {
    console.warn("[cloudsave.js] loadFromCloud failed:", e);
    return null;
  }
}

/* ----------------------------------------------------------------
   getLocalSaveTimestamp()
   Best-effort "how fresh is the save on this device" reading —
   from the live `state` if the game has started, otherwise by
   peeking at localStorage directly (mirrors load()'s own
   defensive JSON.parse/try-catch).
   ---------------------------------------------------------------- */
function getLocalSaveTimestamp() {
  if (state && state.lastSeen) return state.lastSeen;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return parsed.lastSeen || 0;
  } catch (e) {
    return 0;
  }
}

/* ----------------------------------------------------------------
   applyCloudSave(cloudDoc)
   Adopts a cloud save as the active save. Writes the cloud state
   into SAVE_KEY exactly as save() would have written it, then
   reuses the existing load() merge — so it is impossible for this
   to produce a shape load() doesn't already tolerate.
   ---------------------------------------------------------------- */
function applyCloudSave(cloudDoc) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(cloudDoc.state));
  } catch (e) {
    console.warn("[cloudsave.js] Could not write cloud save to localStorage.", e);
    return;
  }
  if (state) {
    // Game already running (mid-session) — merge in and re-render live.
    state = load();
    if (typeof fullRender === "function") fullRender();
    save();
  } else {
    // Still on the start screen — let the existing Continue flow pick it up.
    const btnContinue = document.getElementById("btnContinue");
    if (btnContinue) {
      btnContinue.disabled = false;
      btnContinue.style.display = "";
    }
  }
  lastCloudSyncAt = Date.now();
  updateCloudStatusUI("Cloud kingdom loaded");
}

/* ----------------------------------------------------------------
   promptCloudConflict(cloudDoc)
   Timestamp conflict UI. Local stays authoritative by default —
   the modal's built-in "Continue" button just closes it and does
   nothing, matching PROJECT_RULES.md Section 7. The extra button
   is the only path that overwrites local progress.
   ---------------------------------------------------------------- */
function promptCloudConflict(cloudDoc) {
  if (typeof showModal !== "function") return;
  const cloudDate = new Date(cloudDoc.updatedAt).toLocaleString();
  const overlay = showModal(
    "☁️",
    "Cloud Kingdom Found",
    "There's a save from " + cloudDate + " on your account, newer than this device's. " +
    "This device's kingdom is kept by default — choose below if you'd rather load the cloud version instead.",
    '<div style="display:flex; gap:10px; justify-content:center; margin-top:10px; flex-wrap:wrap;">' +
      '<button class="royal-btn ghost" id="btnLoadCloudSave">Load Cloud Kingdom</button>' +
    '</div>'
  );
  setTimeout(() => {
    const btnLoad = document.getElementById("btnLoadCloudSave");
    if (btnLoad) btnLoad.onclick = () => {
      overlay.remove();
      applyCloudSave(cloudDoc);
    };
  }, 0);
}

/* ----------------------------------------------------------------
   resolveCloudSave()
   Orchestrates auto-load after sign-in with timestamp conflict
   detection:
     - no cloud save yet          -> push local up (if any)
     - no local save on device    -> safe to adopt cloud directly
     - cloud clearly newer        -> ask the player (local kept by default)
     - local same age or newer    -> do nothing, local stays authoritative
   ---------------------------------------------------------------- */
async function resolveCloudSave() {
  if (!getCurrentUser()) return;
  const cloudDoc = await loadFromCloud();

  if (!cloudDoc) {
    if (state) saveToCloud(false);
    return;
  }

  if (!hasSave()) {
    applyCloudSave(cloudDoc);
    if (typeof toast === "function") toast("☁️ Cloud kingdom loaded!");
    return;
  }

  const localTs = getLocalSaveTimestamp();
  const cloudTs = cloudDoc.updatedAt || 0;
  if (cloudTs > localTs + CLOUD_CONFLICT_WINDOW_MS) {
    promptCloudConflict(cloudDoc);
  }
  // else: local is newer or the same age — leave it alone (Section 7).
}

/* ----------------------------------------------------------------
   manualCloudSync() — wired to the existing #btnCloud "Sync" button
   in the Settings tab (see js/settings.js).
   ---------------------------------------------------------------- */
function manualCloudSync() {
  if (!getCurrentUser()) {
    if (typeof toast === "function") toast("🔑 Sign in with Google first, then tap Sync.");
    return;
  }
  saveToCloud(true);
}

/* ----------------------------------------------------------------
   Auto save every 60 seconds. Silent no-op when signed out or the
   game hasn't started yet (both checked inside saveToCloud).
   ---------------------------------------------------------------- */
setInterval(() => { saveToCloud(false); }, CLOUD_AUTOSAVE_MS);

/* ----------------------------------------------------------------
   Auto load after Google login. This is a second, independent
   onAuthStateChanged subscription — auth.js keeps owning sign-in/
   sign-out and its own UI; this module only reacts to the result.
   Polls for window.firebaseAuth the same way auth.js's
   watchAuthState() does, in case this script's initial run beats
   firebase.js's async init.
   ---------------------------------------------------------------- */
function watchAuthForCloudSync() {
  if (!window.firebaseAuth) {
    cloudAuthWatchAttempts++;
    if (cloudAuthWatchAttempts > CLOUD_AUTH_WATCH_MAX_ATTEMPTS) {
      console.warn("[cloudsave.js] Gave up waiting for firebaseAuth to initialize cloud sync.");
      return;
    }
    setTimeout(watchAuthForCloudSync, 300);
    return;
  }
  window.firebaseAuth.onAuthStateChanged(function (user) {
    if (user && user.uid !== resolvedForUid) {
      resolvedForUid = user.uid;
      resolveCloudSave();
    } else if (!user) {
      resolvedForUid = null;
      updateCloudStatusUI("");
    }
  });
}
watchAuthForCloudSync();
