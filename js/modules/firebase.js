"use strict";
/* ============================================================
   MODULE — firebase.js
   STATUS: Implemented — Authentication foundation only.
   Cloud Save / Firestore / game-data sync are explicitly OUT of
   scope for this file (see PROJECT_RULES.md, Section 7 & 11).

   RESPONSIBILITY
   - Initialize the Firebase App.
   - Initialize Firebase Authentication.
   - Expose globally, for other reserved modules to consume:
       window.firebaseApp
       window.firebaseAuth

   This file must never touch gameplay `state`, never render UI,
   and never be depended on by any existing gameplay file
   (data.js, state.js, board.js, panels.js, etc.).
   ============================================================ */

/* ----------------------------------------------------------------
   PASTE YOUR FIREBASE CONFIG BELOW
   Replace the placeholder values with the config object from your
   Firebase project:
   Firebase Console → Project settings → General → Your apps →
   SDK setup and configuration → Config

   Example shape (do not commit real secrets to a public repo —
   Firebase web config is designed to be public, per
   PROJECT_RULES.md Section 10, but keep this in mind for any
   other reserved module).
   ---------------------------------------------------------------- */
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCMTHg7MQRdKZ5Bvmrn9iP5wj4zeYlP2nI",
  authDomain: "merge-kingdom-fb955.firebaseapp.com",
  databaseURL: "https://merge-kingdom-fb955-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "merge-kingdom-fb955",
  storageBucket: "merge-kingdom-fb955.firebasestorage.app",
  messagingSenderId: "484785738201",
  appId: "1:484785738201:web:a52446b25bbf98210589c8",
  measurementId: "G-1S4H5GQSQQ"
};
/* ------------------------- END CONFIG ---------------------------- */

let firebaseReady = false;

function initFirebase(){
  if(firebaseReady) return true;
  if(typeof firebase === "undefined"){
    console.warn("[firebase.js] Firebase SDK not found. Make sure the Firebase CDN <script> tags in index.html load before js/modules/firebase.js.");
    return false;
  }
  if(firebaseConfig.apiKey === "PASTE_YOUR_API_KEY_HERE"){
    console.warn("[firebase.js] firebaseConfig is still a placeholder. Paste your real Firebase project config into js/modules/firebase.js to enable sign-in.");
    return false;
  }
  try{
    window.firebaseApp = firebase.initializeApp(firebaseConfig);
    window.firebaseAuth = firebase.auth();
    window.firebaseDB = firebase.firestore();
    window.usersCollection = window.firebaseDB.collection("users");

    firebaseReady = true;
    return true;
  }catch(e){
    console.warn("[firebase.js] Firebase initialization failed.", e);
    return false;
  }
}

initFirebase();
