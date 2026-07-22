#!/usr/bin/env node
"use strict";

/* ============================================================
   prepare-www.js
   ------------------------------------------------------------
   Capacitor requires webDir to be a real subdirectory that
   contains ONLY the deployable web app — it explicitly rejects
   webDir:"." because `cap sync` copies webDir's contents into
   app/src/main/assets/public verbatim, and copying the project
   root would pull in node_modules/, android/, .git/,
   capacitor.config.json, package.json, and this scripts/ folder
   itself into the Android app bundle.

   This project's source of truth stays at the repo root (so
   `npm run serve` / GitHub Pages / any plain static host keeps
   working exactly as before — see ANDROID_DEPLOYMENT.md for the
   full reasoning). This script copies just the deployable files
   — index.html, css/, js/, assets/ — into www/, which is what
   capacitor.config.json's webDir now points to. It is run
   automatically before every `cap add android` / `cap sync`
   (see package.json) so www/ can never go stale.

   No dependencies — plain Node fs/path, since this is a
   plain-HTML/CSS/JS project with no bundler.
   ============================================================ */

const fs=require("fs");
const path=require("path");

const ROOT=path.resolve(__dirname, "..");
const WWW=path.join(ROOT, "www");

// Everything the Android app actually needs to load and run.
const ENTRIES=["index.html", "css", "js", "assets"];

function rimraf(dir){
  if(fs.existsSync(dir)) fs.rmSync(dir, { recursive:true, force:true });
}
function copyRecursive(src, dest, excludeDirs){
  const stat=fs.statSync(src);
  if(stat.isDirectory()){
    if(excludeDirs && excludeDirs.includes(path.basename(src))) return;
    fs.mkdirSync(dest, { recursive:true });
    for(const entry of fs.readdirSync(src)){
      copyRecursive(path.join(src, entry), path.join(dest, entry), excludeDirs);
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive:true });
    fs.copyFileSync(src, dest);
  }
}

console.log("[prepare-www] Clearing "+WWW+" ...");
rimraf(WWW);
fs.mkdirSync(WWW, { recursive:true });

let missing=[];
ENTRIES.forEach(entry=>{
  const src=path.join(ROOT, entry);
  if(!fs.existsSync(src)){ missing.push(entry); return; }
  const dest=path.join(WWW, entry);
  copyRecursive(src, dest, ["android"]);
  console.log("[prepare-www] Copied "+entry);
});

if(missing.length){
  console.error("[prepare-www] ERROR: missing expected source path(s): "+missing.join(", "));
  process.exit(1);
}

if(!fs.existsSync(path.join(WWW, "index.html"))){
  console.error("[prepare-www] ERROR: www/index.html was not created — aborting so `cap sync` doesn't run against an empty webDir.");
  process.exit(1);
}

console.log("[prepare-www] Done. www/ is ready for `cap add android` / `cap sync android`.");
