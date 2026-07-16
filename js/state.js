"use strict";

/* ============================================================
   STATE
   ============================================================ */
const SAVE_KEY="mergeKingdomSave_v1";
function defaultState(){
  return {
    board:new Array(36).fill(null),
    queue:[],
    coins:100, lifetimeCoins:100, xp:0, level:1, score:0,
    totalMerges:0, maxTier:{}, buildings:{}, upgrades:{},
    questsProgress:{}, questsClaimed:[], achievementsUnlocked:[],
    collection:[], specialsFound:[],
    dailyStreak:0, lastDailyClaim:0,
    settings:{music:true,sound:true,theme:"dark"},
    lastSeen:Date.now(), spawnReady:true, spawnNext:0,
    createdAt:Date.now(), playSeconds:0
  };
}
let state = null;

function fmt(n){
  n=Math.floor(n);
  if(n>=1e9) return (n/1e9).toFixed(2)+"B";
  if(n>=1e6) return (n/1e6).toFixed(2)+"M";
  if(n>=1e4) return (n/1e3).toFixed(1)+"K";
  return n.toLocaleString();
}
function xpNeeded(level){ return Math.floor(50*Math.pow(level,1.4)); }
function buildingIncomeMultiplier(){
  const castleLv=state.upgrades.castle||0, coinLv=state.upgrades.coinprod||0;
  return 1 + castleLv*0.08 + coinLv*0.08;
}
function queueCapacity(){ return 1 + (state.upgrades.storage||0); }
function spawnCooldownMs(){
  const lv=state.upgrades.mergespeed||0;
  return Math.max(1200, 4000*Math.pow(0.92,lv));
}
function rareChance(){ return 0.006 + (state.upgrades.raredrop||0)*0.004; }
function luckChance(){ return (state.upgrades.luck||0)*0.02; }

/* ============================================================
   SAVE / LOAD
   ============================================================ */
function save(){
  try{
    state.lastSeen=Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }catch(e){ /* storage unavailable - ignore */ }
}
function hasSave(){
  try{ return !!localStorage.getItem(SAVE_KEY); }catch(e){ return false; }
}
function load(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw) return null;
    const parsed=JSON.parse(raw);
    const d=defaultState();
    return Object.assign(d,parsed,{
      maxTier:Object.assign({},d.maxTier,parsed.maxTier),
      buildings:Object.assign({},d.buildings,parsed.buildings),
      upgrades:Object.assign({},d.upgrades,parsed.upgrades),
      settings:Object.assign({},d.settings,parsed.settings)
    });
  }catch(e){ return null; }
}
