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

/* Achievements — generated to reach 50 */
function achievementDefs(){
  const list = [];
  list.push({id:"a_first_merge",name:"First Merge",desc:"Complete your first merge.",icon:"🔀",cond:s=>s.totalMerges>=1});
  const mergeMilestones=[10,25,50,100,250,500,1000,2500];
  mergeMilestones.forEach(n=>list.push({id:"a_merges_"+n,name:n+" Merges",desc:"Perform "+n+" merges.",icon:"⚙️",cond:s=>s.totalMerges>=n}));
  const coinMilestones=[100,500,1000,5000,10000,50000,100000,500000,1000000];
  coinMilestones.forEach(n=>list.push({id:"a_coins_"+n,name:fmt(n)+" Coins",desc:"Earn "+fmt(n)+" lifetime coins.",icon:"🪙",cond:s=>s.lifetimeCoins>=n}));
  const levelMilestones=[2,5,10,15,20,25,30,40,50];
  levelMilestones.forEach(n=>list.push({id:"a_level_"+n,name:"Level "+n,desc:"Reach kingdom level "+n+".",icon:"⭐",cond:s=>s.level>=n}));
  Object.keys(CHAINS).forEach(ck=>{
    const chain=CHAINS[ck];
    const topTier=chain.tiers.length-1;
    const midTier=Math.floor(topTier/2);
    list.push({id:"a_chain_"+ck+"_mid",name:"Rising "+chain.label,desc:"Reach "+chain.tiers[midTier].name+" in the "+chain.label+" chain.",icon:chain.tiers[midTier].icon,cond:s=>(s.maxTier[ck]||0)>=midTier});
    list.push({id:"a_chain_"+ck+"_top",name:chain.tiers[topTier].name+"!",desc:"Reach the final tier of the "+chain.label+" chain.",icon:chain.tiers[topTier].icon,cond:s=>(s.maxTier[ck]||0)>=topTier});
  });
  BUILDINGS.forEach(b=>list.push({id:"a_build_"+b.id,name:"First "+b.name,desc:"Construct a "+b.name+".",icon:b.icon,cond:s=>(s.buildings[b.id]||0)>=1}));
  list.push({id:"a_master_builder",name:"Master Builder",desc:"Own 10 total buildings.",icon:"🏗️",cond:s=>Object.values(s.buildings).reduce((a,b)=>a+b,0)>=10});
  SPECIALS.forEach(sp=>list.push({id:"a_special_"+sp.id,name:"Found: "+sp.name,desc:"Discover the "+sp.name+".",icon:sp.icon,cond:s=>s.specialsFound.includes(sp.id)}));
  list.push({id:"a_merge_king",name:"Merge King",desc:"Perform 1000 total merges.",icon:"👑",cond:s=>s.totalMerges>=1000});
  list.push({id:"a_legend",name:"Legend",desc:"Reach Level 25 and own 10 buildings.",icon:"🐉",cond:s=>s.level>=25 && Object.values(s.buildings).reduce((a,b)=>a+b,0)>=10});
  list.push({id:"a_collector",name:"Collector",desc:"Discover 15 different items.",icon:"📖",cond:s=>s.collection.length>=15});
  list.push({id:"a_full_collection",name:"Complete Collection",desc:"Discover every item in the realm.",icon:"📚",cond:s=>s.collection.length>=totalCollectibles()});
  list.push({id:"a_quest_master",name:"Quest Master",desc:"Complete every quest.",icon:"📜",cond:s=>questDefs().every(q=>s.questsClaimed.includes(q.id))});
  list.push({id:"a_daily_streak",name:"Loyal Ruler",desc:"Claim 3 daily rewards.",icon:"🎁",cond:s=>s.dailyStreak>=3});
  list.push({id:"a_daily_streak7",name:"Devoted Monarch",desc:"Claim 7 daily rewards.",icon:"🗓️",cond:s=>s.dailyStreak>=7});
  list.push({id:"a_rich",name:"Wealthy Ruler",desc:"Hold 5,000 coins at once.",icon:"💎",cond:s=>s.coins>=5000});
  return list.slice(0,50);
}
function totalCollectibles(){
  let n=0; Object.keys(CHAINS).forEach(k=>n+=CHAINS[k].tiers.length); n+=SPECIALS.length; return n;
}
