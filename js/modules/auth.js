"use strict";
/* ============================================================
   MODULE — auth.js
   STATUS: Implemented — Google Sign-In authentication only.
   NOT IN SCOPE: Cloud Save, Firestore, or any sync of game data.
   Gameplay `state` (js/state.js) is never read or written here.
   See PROJECT_RULES.md, Section 7 & 11.

   RESPONSIBILITY
   - Google Sign In / Sign Out.
   - Detect and track login state.
   - Keep the session persistent across reloads (Firebase's LOCAL
     persistence).

   EXPOSES (globally, for other files such as js/settings.js)
       loginWithGoogle()
       logout()
       getCurrentUser()
   ============================================================ */

let currentUser = null;
let authWatchAttempts = 0;
const AUTH_WATCH_MAX_ATTEMPTS = 40; // ~12s of retrying if firebase.js hasn't initialized yet

function getCurrentUser(){
  return currentUser;
}

function loginWithGoogle(){
  if(!window.firebaseAuth){
    if(typeof toast === "function") toast("Sign-in isn't available right now.");
    return Promise.reject(new Error("[auth.js] firebaseAuth is not initialized."));
  }
  const provider = new firebase.auth.GoogleAuthProvider();
  return window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(function(){ return window.firebaseAuth.signInWithPopup(provider); })
    .then(function(result){
      currentUser = result.user;
      if(typeof toast === "function") toast("Signed in as " + (currentUser.displayName || currentUser.email || "Player") + "!");
      if(typeof renderAuthUI === "function") renderAuthUI();
      return currentUser;
    })
    .catch(function(err){
      console.warn("[auth.js] Google sign-in failed:", err);
      if(typeof toast === "function") toast("Sign-in failed. Please try again.");
      if(typeof sfx!=="undefined") sfx.error();
      throw err;
    });
}

function logout(){
  if(!window.firebaseAuth) return Promise.resolve();
  return window.firebaseAuth.signOut()
    .then(function(){
      currentUser = null;
      if(typeof toast === "function") toast("Signed out.");
      if(typeof renderAuthUI === "function") renderAuthUI();
    })
    .catch(function(err){
      console.warn("[auth.js] Sign-out failed:", err);
    });
}

function watchAuthState(){
  if(!window.firebaseAuth){
    authWatchAttempts++;
    if(authWatchAttempts>AUTH_WATCH_MAX_ATTEMPTS){
      console.warn("[auth.js] Gave up waiting for firebaseAuth to initialize. Sign-in UI will stay in its default logged-out state until the page is reloaded with a valid firebaseConfig.");
      return;
    }
    setTimeout(watchAuthState, 300);
    return;
  }
  window.firebaseAuth.onAuthStateChanged(function(user){
    currentUser = user;
    if(typeof renderAuthUI === "function") renderAuthUI();
  });
}

watchAuthState();
