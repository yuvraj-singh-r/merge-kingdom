"use strict";

/* ============================================================
   DATA TABLES
   ============================================================ */
const CHAINS = {
  grass:{label:"Grass", tiers:[
    {name:"Grass",icon:"🌱"},{name:"Bush",icon:"🌿"},{name:"Tree",icon:"🌳"},
    {name:"Big Tree",icon:"🌲"},{name:"Forest",icon:"🏞️"},{name:"Magic Forest",icon:"✨"}
  ]},
  stone:{label:"Stone", tiers:[
    {name:"Stone",icon:"🪨"},{name:"Rock",icon:"🗿"},{name:"Iron Ore",icon:"⛏️"},
    {name:"Forge",icon:"🔥"},{name:"Castle Wall",icon:"🧱"}
  ]},
  wood:{label:"Wood", tiers:[
    {name:"Wood",icon:"🪵"},{name:"Lumber",icon:"🪚"},{name:"House",icon:"🏠"},
    {name:"Village",icon:"🏘️"},{name:"Town",icon:"🏙️"},{name:"Kingdom",icon:"🏰"}
  ]},
  flower:{label:"Flower", tiers:[
    {name:"Flower",icon:"🌸"},{name:"Garden",icon:"💐"},{name:"Farm",icon:"🌻"},{name:"Windmill",icon:"🎡"}
  ]},
  coins:{label:"Coins", tiers:[
    {name:"Coins",icon:"🪙"},{name:"Treasure Chest",icon:"🧰"},{name:"Gold Vault",icon:"🏦"}
  ]},
  berry:{label:"Berry", tiers:[
    {name:"Berry",icon:"🍓"},{name:"Berry Bush",icon:"🫐"},{name:"Orchard",icon:"🍎"}
  ]}
};
const BASE_CHAINS = ["grass","stone","wood","flower","coins","berry"];

const SPECIALS = [
  {id:"goldenTree",name:"Golden Tree",icon:"🌟",coins:250,xp:80},
  {id:"magicCrystal",name:"Magic Crystal",icon:"💎",coins:300,xp:100},
  {id:"dragonEgg",name:"Dragon Egg",icon:"🥚",coins:500,xp:150},
  {id:"ancientChest",name:"Ancient Chest",icon:"🗝️",coins:220,xp:70},
  {id:"mysteryBox",name:"Mystery Box",icon:"🎁",coins:180,xp:60},
  {id:"rainbowFlower",name:"Rainbow Flower",icon:"🌈",coins:200,xp:90}
];

const BUILDINGS = [
  {id:"house",name:"Small House",icon:"🏠",unlock:1,cost:50,income:0.5,desc:"A cozy first home for your subjects."},
  {id:"farm",name:"Farm",icon:"🌾",unlock:2,cost:150,income:1,desc:"Grows food to feed the growing town."},
  {id:"village",name:"Village",icon:"🏘️",unlock:3,cost:320,income:2,desc:"Clusters of homes and market stalls."},
  {id:"blacksmith",name:"Blacksmith",icon:"⚒️",unlock:4,cost:520,income:3,desc:"Forges tools, weapons, and horseshoes."},
  {id:"castle",name:"Castle",icon:"🏰",unlock:5,cost:1000,income:5,desc:"The seat of your growing power."},
  {id:"market",name:"Market",icon:"🏪",unlock:6,cost:1500,income:6,desc:"Merchants trade goods from afar."},
  {id:"tower",name:"Watch Tower",icon:"🗼",unlock:7,cost:2200,income:8,desc:"Guards the realm's borders."},
  {id:"magictower",name:"Magic Tower",icon:"🔮",unlock:9,cost:4000,income:14,desc:"Home to the kingdom's mystic scholars."},
  {id:"harbor",name:"Harbor",icon:"⚓",unlock:10,cost:6000,income:20,desc:"Ships bring riches from distant shores."},
  {id:"palace",name:"Royal Palace",icon:"👑",unlock:12,cost:8000,income:25,desc:"A grand seat worthy of royalty."},
  {id:"university",name:"University",icon:"📚",unlock:14,cost:12000,income:35,desc:"Scholars advance the realm's knowledge."},
  {id:"dragon",name:"Dragon Sanctuary",icon:"🐉",unlock:18,cost:25000,income:60,desc:"A sanctuary for the kingdom's dragons."}
];

const UPGRADES = [
  {id:"castle",name:"Castle Power",icon:"🏰",desc:"+8% income from all buildings per level.",baseCost:200,growth:1.55,max:15},
  {id:"village",name:"Village Craft",icon:"🏘️",desc:"+10% rewards from the Wood chain per level.",baseCost:180,growth:1.5,max:15},
  {id:"economy",name:"Economy",icon:"💹",desc:"+10% rewards from the Coin chain per level.",baseCost:180,growth:1.5,max:15},
  {id:"storage",name:"Storage", icon:"📦",desc:"+1 holding queue slot per level.",baseCost:400,growth:2.1,max:3},
  {id:"coinprod",name:"Coin Production",icon:"🪙",desc:"+8% income from all buildings per level.",baseCost:220,growth:1.55,max:15},
  {id:"xp",name:"Scholarly Wisdom",icon:"📘",desc:"+10% XP gained from merges per level.",baseCost:150,growth:1.5,max:15},
  {id:"mergespeed",name:"Merge Speed",icon:"⚡",desc:"-8% spawner cooldown per level.",baseCost:180,growth:1.6,max:8},
  {id:"luck",name:"Luck",icon:"🍀",desc:"+2% chance of bonus double reward per level.",baseCost:160,growth:1.5,max:15},
  {id:"raredrop",name:"Rare Drop Chance",icon:"✨",desc:"+0.4% chance to spawn a special item per level.",baseCost:500,growth:1.8,max:10}
];

function questDefs(){
  return [
    {id:"q1",name:"First Steps",desc:"Perform your first merge.",icon:"🌱",target:1,type:"totalMerges",reward:{coins:30,xp:10}},
    {id:"q2",name:"Grass Grower",desc:"Reach the Tree tier.",icon:"🌳",target:2,type:"maxTierChain",chain:"grass",reward:{coins:60,xp:20}},
    {id:"q3",name:"Coin Collector",desc:"Earn 100 lifetime coins.",icon:"🪙",target:100,type:"coinsEarned",reward:{coins:50,xp:15}},
    {id:"q4",name:"Stone Mason",desc:"Reach the Rock tier.",icon:"🗿",target:1,type:"maxTierChain",chain:"stone",reward:{coins:70,xp:25}},
    {id:"q5",name:"Builder's Start",desc:"Build a Small House.",icon:"🏠",target:1,type:"buildingOwned",building:"house",reward:{coins:80,xp:25}},
    {id:"q6",name:"Rising Ruler",desc:"Reach Level 5.",icon:"⭐",target:5,type:"levelReached",reward:{coins:150,xp:0}},
    {id:"q7",name:"Fortify the Realm",desc:"Build a Castle.",icon:"🏰",target:1,type:"buildingOwned",building:"castle",reward:{coins:300,xp:60}},
    {id:"q8",name:"Merge Apprentice",desc:"Perform 50 total merges.",icon:"🔀",target:50,type:"totalMerges",reward:{coins:200,xp:60}},
    {id:"q9",name:"Blossoming Kingdom",desc:"Reach the Farm tier.",icon:"🌻",target:2,type:"maxTierChain",chain:"flower",reward:{coins:180,xp:50}},
    {id:"q10",name:"Golden Age",desc:"Earn 1,000 lifetime coins.",icon:"💰",target:1000,type:"coinsEarned",reward:{coins:250,xp:70}},
    {id:"q11",name:"Master of the Realm",desc:"Reach Level 10.",icon:"👑",target:10,type:"levelReached",reward:{coins:500,xp:0}},
    {id:"q12",name:"Grand Merger",desc:"Perform 200 total merges.",icon:"🎯",target:200,type:"totalMerges",reward:{coins:600,xp:150}}
  ];
}

/* Daily Quests — a pool of templates; 3 are chosen at random each
   day by js/dailyquests.js. This is a separate pool from
   questDefs() above (those are permanent, one-time quests; these
   reset every 24 hours) — kept distinct rather than overloading
   the existing quest table. */
function dailyQuestDefs(){
  return [
    {id:"dq_merge10",   name:"Busy Merger",     desc:"Merge 10 items today.",         icon:"🔀", target:10,   type:"merges",        reward:{coins:100, xp:20}},
    {id:"dq_earn500",   name:"Coin Hustle",     desc:"Earn 500 Coins today.",         icon:"🪙", target:500,  type:"coinsEarned",   reward:{gems:5, xp:20}},
    {id:"dq_upgrade2",  name:"Kingdom Growth",  desc:"Build 2 buildings today.",      icon:"🏗️", target:2,    type:"buildingsBuilt", reward:{coins:150, xp:30}},
    {id:"dq_merge25",   name:"Merge Marathon",  desc:"Merge 25 items today.",         icon:"⚙️", target:25,   type:"merges",        reward:{gems:10, xp:40}},
    {id:"dq_earn1000",  name:"Treasury Push",   desc:"Earn 1,000 Coins today.",       icon:"💰", target:1000, type:"coinsEarned",   reward:{coins:200, xp:50}},
    {id:"dq_upgrade1",  name:"New Construction",desc:"Build 1 building today.",       icon:"🏠", target:1,    type:"buildingsBuilt", reward:{gems:5, xp:15}}
  ];
}

/* ============================================================
   ACHIEVEMENTS 2.0
   ------------------------------------------------------------
   Each entry has a numeric target and a valueFn(state)->number
   used to compute progress (mirrors questStateValue()'s pattern
   of reading straight off state) plus a coins/gems/xp reward.
   This replaces the old boolean cond:s=>bool list — see
   panels.js's checkAchievements()/renderAchievements() for the
   claim flow this shape enables. Grouped into the 8 required
   categories: Merging, Coins, Gems, Buildings, Login Streak,
   Daily Quests, Collection, Progression.
   ============================================================ */
function achievementDefs(){
  return [
    /* --- Merging --- */
    {id:"a2_merge_1",    category:"Merging", name:"First Merge",     desc:"Merge your first item.",           icon:"🔀", target:1,    valueFn:s=>s.totalMerges, reward:{coins:20,   xp:5}},
    {id:"a2_merge_50",   category:"Merging", name:"Merge Apprentice",desc:"Perform 50 total merges.",         icon:"⚙️", target:50,   valueFn:s=>s.totalMerges, reward:{coins:150,  xp:40}},
    {id:"a2_merge_250",  category:"Merging", name:"Merge Master",    desc:"Perform 250 total merges.",        icon:"🎯", target:250,  valueFn:s=>s.totalMerges, reward:{coins:500,  gems:10, xp:100}},
    {id:"a2_merge_1000", category:"Merging", name:"Merge Legend",    desc:"Perform 1,000 total merges.",      icon:"👑", target:1000, valueFn:s=>s.totalMerges, reward:{coins:1500, gems:30, xp:300}},

    /* --- Coins --- */
    {id:"a2_coins_500",    category:"Coins", name:"Coin Collector", desc:"Earn 500 lifetime coins.",         icon:"🪙", target:500,    valueFn:s=>s.lifetimeCoins, reward:{gems:5,   xp:20}},
    {id:"a2_coins_5000",   category:"Coins", name:"Coin Hoarder",   desc:"Earn 5,000 lifetime coins.",       icon:"💰", target:5000,   valueFn:s=>s.lifetimeCoins, reward:{gems:15,  xp:60}},
    {id:"a2_coins_50000",  category:"Coins", name:"Wealthy Ruler",  desc:"Earn 50,000 lifetime coins.",      icon:"🏦", target:50000,  valueFn:s=>s.lifetimeCoins, reward:{gems:40,  xp:150}},
    {id:"a2_coins_250000", category:"Coins", name:"Coin Tycoon",    desc:"Earn 250,000 lifetime coins.",     icon:"🏛️", target:250000, valueFn:s=>s.lifetimeCoins, reward:{gems:100, xp:400}},

    /* --- Gems --- */
    {id:"a2_gems_10",   category:"Gems", name:"Gem Finder",   desc:"Earn 10 lifetime gems.",       icon:"💎", target:10,   valueFn:s=>s.lifetimeGems||0, reward:{coins:100,  xp:20}},
    {id:"a2_gems_100",  category:"Gems", name:"Gem Collector",desc:"Earn 100 lifetime gems.",      icon:"💎", target:100,  valueFn:s=>s.lifetimeGems||0, reward:{coins:500,  xp:80}},
    {id:"a2_gems_500",  category:"Gems", name:"Gem Hoarder",  desc:"Earn 500 lifetime gems.",      icon:"💎", target:500,  valueFn:s=>s.lifetimeGems||0, reward:{coins:1500, xp:200}},
    {id:"a2_gems_1000", category:"Gems", name:"Gem Baron",    desc:"Earn 1,000 lifetime gems.",    icon:"💎", target:1000, valueFn:s=>s.lifetimeGems||0, reward:{coins:3000, xp:400}},

    /* --- Buildings --- */
    {id:"a2_build_1",  category:"Buildings", name:"First Builder",        desc:"Construct your first building.", icon:"🏠", target:1,  valueFn:s=>Object.values(s.buildings).reduce((a,b)=>a+b,0), reward:{coins:80,   xp:20}},
    {id:"a2_build_10", category:"Buildings", name:"Growing Kingdom",      desc:"Own 10 total buildings.",         icon:"🏘️", target:10, valueFn:s=>Object.values(s.buildings).reduce((a,b)=>a+b,0), reward:{coins:300,  gems:10, xp:80}},
    {id:"a2_build_25", category:"Buildings", name:"Master Builder",       desc:"Own 25 total buildings.",         icon:"🏗️", target:25, valueFn:s=>Object.values(s.buildings).reduce((a,b)=>a+b,0), reward:{coins:800,  gems:25, xp:180}},
    {id:"a2_build_50", category:"Buildings", name:"Architect of the Realm",desc:"Own 50 total buildings.",        icon:"🏰", target:50, valueFn:s=>Object.values(s.buildings).reduce((a,b)=>a+b,0), reward:{coins:2000, gems:60, xp:350}},

    /* --- Login Streak --- */
    {id:"a2_streak_3",  category:"Login Streak", name:"Returning Ruler", desc:"Reach a 3-day login streak.",  icon:"🎁", target:3,  valueFn:s=>s.dailyStreak, reward:{coins:100,  xp:20}},
    {id:"a2_streak_7",  category:"Login Streak", name:"Loyal Ruler",     desc:"Reach a 7-day login streak.",  icon:"🗓️", target:7,  valueFn:s=>s.dailyStreak, reward:{coins:300,  gems:10, xp:60}},
    {id:"a2_streak_14", category:"Login Streak", name:"Devoted Monarch", desc:"Reach a 14-day login streak.", icon:"📅", target:14, valueFn:s=>s.dailyStreak, reward:{coins:700,  gems:25, xp:120}},
    {id:"a2_streak_30", category:"Login Streak", name:"Eternal Sovereign",desc:"Reach a 30-day login streak.",icon:"👑", target:30, valueFn:s=>s.dailyStreak, reward:{coins:1500, gems:60, xp:300}},

    /* --- Daily Quests --- */
    {id:"a2_dq_5",   category:"Daily Quests", name:"Quest Novice",    desc:"Claim 5 daily quests.",   icon:"📜", target:5,   valueFn:s=>s.totalDailyQuestsClaimed||0, reward:{coins:150,  xp:30}},
    {id:"a2_dq_25",  category:"Daily Quests", name:"Quest Regular",   desc:"Claim 25 daily quests.",  icon:"🗓️", target:25,  valueFn:s=>s.totalDailyQuestsClaimed||0, reward:{coins:500,  gems:15, xp:100}},
    {id:"a2_dq_75",  category:"Daily Quests", name:"Quest Veteran",   desc:"Claim 75 daily quests.",  icon:"🏅", target:75,  valueFn:s=>s.totalDailyQuestsClaimed||0, reward:{coins:1200, gems:35, xp:220}},
    {id:"a2_dq_150", category:"Daily Quests", name:"Quest Grandmaster",desc:"Claim 150 daily quests.",icon:"🏆", target:150, valueFn:s=>s.totalDailyQuestsClaimed||0, reward:{coins:2500, gems:75, xp:400}},

    /* --- Collection --- */
    {id:"a2_coll_5",   category:"Collection", name:"Curious Collector", desc:"Discover 5 different items.",  icon:"📖", target:5,  valueFn:s=>s.collection.length, reward:{coins:100,  xp:20}},
    {id:"a2_coll_15",  category:"Collection", name:"Avid Collector",    desc:"Discover 15 different items.", icon:"📗", target:15, valueFn:s=>s.collection.length, reward:{coins:400,  gems:15, xp:80}},
    {id:"a2_coll_30",  category:"Collection", name:"Master Collector",  desc:"Discover 30 different items.", icon:"📘", target:30, valueFn:s=>s.collection.length, reward:{coins:900,  gems:35, xp:180}},
    {id:"a2_coll_full",category:"Collection", name:"Complete Collection",desc:"Discover every item in the realm.", icon:"📚", target:totalCollectibles(), valueFn:s=>s.collection.length, reward:{coins:2000, gems:100, xp:400}},

    /* --- Progression --- */
    {id:"a2_level_5",  category:"Progression", name:"Rising Ruler",   desc:"Reach kingdom level 5.",  icon:"⭐", target:5,  valueFn:s=>s.level, reward:{coins:150,  gems:5}},
    {id:"a2_level_15", category:"Progression", name:"Established Kingdom",desc:"Reach kingdom level 15.",icon:"🌟", target:15, valueFn:s=>s.level, reward:{coins:600,  gems:20}},
    {id:"a2_level_30", category:"Progression", name:"Grand Monarch",  desc:"Reach kingdom level 30.", icon:"🐉", target:30, valueFn:s=>s.level, reward:{coins:1500, gems:50}},
    {id:"a2_level_50", category:"Progression", name:"Legendary Ruler",desc:"Reach kingdom level 50.", icon:"🏆", target:50, valueFn:s=>s.level, reward:{coins:4000, gems:120}}
  ];
}
function totalCollectibles(){
  let n=0; Object.keys(CHAINS).forEach(k=>n+=CHAINS[k].tiers.length); n+=SPECIALS.length; return n;
}
