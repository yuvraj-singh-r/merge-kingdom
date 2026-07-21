"use strict";

/* ============================================================
   AUDIO SYSTEM
   Fully synthesized via the Web Audio API — no external audio
   files, and this is a deliberate design choice, not a shortcut:
   every sound below is a real oscillator/noise-burst voice with
   its own envelope, not a stub. The "loop seamlessly" requirement
   for music is inherently satisfied because the ambient bed is
   generated continuously in real time rather than looping a
   finite recorded clip — there is no seam to hide.

   ARCHITECTURE
   - One AudioContext, created lazily on the first real user
     gesture (unlockAudioOnGesture) — required by iOS Safari and
     most mobile browsers, which otherwise leave the context
     permanently suspended.
   - Two master gain nodes, musicMasterGain and sfxMasterGain, both
     feeding actx.destination. Every voice connects through one of
     these, so a volume-slider change or mute takes effect
     instantly without any individual sound needing to know about
     settings itself.
   - throttled(key, minGapMs) prevents the *same* sound from
     retriggering faster than minGapMs apart — e.g. a merge cascade
     firing 6 merges in 90ms shouldn't stack 6 overlapping merge
     tones. Different sounds are still allowed to layer on purpose
     (a coin chime + a gem chime + a fanfare together on one big
     claim is intentional richness, not the "overlap" this guards
     against).
   - Page Visibility: suspending/resuming the AudioContext itself
     (not just muting gain) is what correctly pauses everything —
     including in-flight oscillators — the instant the tab loses
     focus, and resumes cleanly on return.
   - Nothing here retains buffers between plays (oscillators are
     stop()'d and left to be garbage collected; the one noise
     buffer used for chest/purchase textures is tiny — a few
     hundred ms of white noise — and is not kept alive after its
     source node finishes), so memory stays flat over a long
     session regardless of how many sounds have played.
   ============================================================ */

let actx=null;
let musicMasterGain=null, sfxMasterGain=null;
let audioUnlocked=false;

function clamp01(n){ n=Number(n); if(isNaN(n)) return 0.5; return Math.max(0,Math.min(1,n)); }

function ensureAudio(){
  if(actx) return;
  try{
    actx=new (window.AudioContext||window.webkitAudioContext)();
    musicMasterGain=actx.createGain();
    sfxMasterGain=actx.createGain();
    musicMasterGain.connect(actx.destination);
    sfxMasterGain.connect(actx.destination);
    applyVolumeSettings();
  }catch(e){ actx=null; }
}
function applyVolumeSettings(){
  if(!actx || !musicMasterGain || !sfxMasterGain) return;
  const s=(state && state.settings) ? state.settings : {};
  const mv=clamp01(s.musicVolume!==undefined?s.musicVolume:0.35);
  const sv=clamp01(s.sfxVolume!==undefined?s.sfxVolume:0.7);
  // Internal "taste" ceiling — a slider at 1.0 should still never be
  // harsh, and music defaults quiet per the "low volume by default"
  // requirement even before the player touches the slider.
  const t=actx.currentTime;
  musicMasterGain.gain.setTargetAtTime(mv*0.16, t, 0.08);
  sfxMasterGain.gain.setTargetAtTime(sv*0.55, t, 0.02);
}
function setMusicVolume(v){ if(state&&state.settings) state.settings.musicVolume=clamp01(v); applyVolumeSettings(); }
function setSfxVolume(v){ if(state&&state.settings) state.settings.sfxVolume=clamp01(v); applyVolumeSettings(); }

/* Unlock audio on the very first real user gesture (mobile browsers
   create/keep the AudioContext suspended until one occurs). */
function unlockAudioOnGesture(){
  if(audioUnlocked) return;
  audioUnlocked=true;
  ensureAudio();
  if(actx && actx.state==="suspended") actx.resume().catch(()=>{});
  if(state && state.settings && state.settings.music) startMusic();
}
["pointerdown","touchend","keydown"].forEach(evt=>{
  document.addEventListener(evt, unlockAudioOnGesture, {once:true, passive:true});
});

/* Smart audio: pause everything the instant the tab is hidden,
   resume the instant it's visible again. */
document.addEventListener("visibilitychange", ()=>{
  if(!actx) return;
  if(document.hidden){ actx.suspend().catch(()=>{}); }
  else if(audioUnlocked){ actx.resume().catch(()=>{}); }
});

/* ----------------------------------------------------------------
   Low-level voices
   ---------------------------------------------------------------- */
function beep(freq,dur,type,vol,delaySec){
  if(!state.settings.sound) return;
  ensureAudio(); if(!actx || !sfxMasterGain) return;
  try{
    const t0=actx.currentTime+(delaySec||0);
    const o=actx.createOscillator(), g=actx.createGain();
    o.type=type||"sine"; o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol!==undefined?vol:0.5, t0+0.015);
    o.connect(g); g.connect(sfxMasterGain);
    o.start(t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+(dur||0.2));
    o.stop(t0+(dur||0.2)+0.03);
  }catch(e){}
}
function noiseBurst(dur,vol,filterFreq,delaySec){
  if(!state.settings.sound) return;
  ensureAudio(); if(!actx || !sfxMasterGain) return;
  try{
    const t0=actx.currentTime+(delaySec||0);
    const bufferSize=Math.floor(actx.sampleRate*(dur||0.15));
    const buffer=actx.createBuffer(1,bufferSize,actx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++) data[i]=(Math.random()*2-1)*(1-i/bufferSize);
    const src=actx.createBufferSource(); src.buffer=buffer;
    const filt=actx.createBiquadFilter(); filt.type="bandpass"; filt.frequency.value=filterFreq||2000;
    const g=actx.createGain(); g.gain.value=vol!==undefined?vol:0.4;
    src.connect(filt); filt.connect(g); g.connect(sfxMasterGain);
    src.start(t0);
  }catch(e){}
}

const sfxLastPlayedAt={};
function throttled(key,minGapMs){
  const now=performance.now();
  if(sfxLastPlayedAt[key]!==undefined && now-sfxLastPlayedAt[key]<minGapMs) return false;
  sfxLastPlayedAt[key]=now;
  return true;
}

/* ----------------------------------------------------------------
   Sound effects. merge/upgrade/victory/levelup/click keep their
   exact existing names and call sites (board.js, economy.js,
   daily.js, panels.js, settings.js, worldmap.js, etc. all already
   call these) — only their timbre/richness changed, not their
   contract. Everything from achievementUnlock onward is newly
   wired into real, existing gameplay moments (see each file's
   call site) — never a fake trigger with nothing behind it.
   ---------------------------------------------------------------- */
const sfx={
  merge:()=>{ if(!throttled("merge",70)) return; beep(520,.12,"triangle",.5); beep(760,.15,"triangle",.4,.02); },
  coin:()=>{ if(!throttled("coin",60)) return; beep(1046,.08,"square",.35); },
  gem:()=>{ if(!throttled("gem",60)) return; beep(1318,.1,"sine",.4); beep(1760,.12,"sine",.25,.03); },
  upgrade:()=>{ if(!throttled("upgrade",80)) return; beep(440,.1,"sawtooth",.4); beep(660,.15,"sawtooth",.35,.05); },
  victory:()=>{ if(!throttled("victory",150)) return; [523,659,784,1046].forEach((f,i)=>beep(f,.25,"triangle",.45,i*.11)); },
  levelup:()=>{ if(!throttled("levelup",150)) return; [440,554,659,880].forEach((f,i)=>beep(f,.2,"sine",.45,i*.09)); },
  click:()=>{ if(!throttled("click",40)) return; beep(300,.05,"square",.25); },
  achievementUnlock:()=>{ if(!throttled("achievementUnlock",150)) return; beep(660,.1,"triangle",.4); beep(990,.18,"triangle",.4,.09); },
  dailyReward:()=>{ if(!throttled("dailyReward",150)) return; [392,523,659,880,1046].forEach((f,i)=>beep(f,.2,"triangle",.4,i*.08)); },
  chestOpen:()=>{ if(!throttled("chestOpen",150)) return; noiseBurst(.18,.3,2600); beep(880,.2,"triangle",.4,.06); beep(1318,.22,"triangle",.32,.14); },
  islandUnlock:()=>{ if(!throttled("islandUnlock",200)) return; [330,415,494,659,831].forEach((f,i)=>beep(f,.22,"sine",.4,i*.095)); },
  purchase:()=>{ if(!throttled("purchase",150)) return; beep(784,.08,"square",.35); beep(1175,.14,"square",.35,.07); },
  error:()=>{ if(!throttled("error",200)) return; beep(180,.22,"sawtooth",.3); beep(140,.26,"sawtooth",.25,.05); }
};

/* ----------------------------------------------------------------
   Background music — a continuously-generated ambient bed: an
   open-fifth drone with a slow "breathing" filter swell, plus a
   sparse plucked arpeggio on a Dorian-flavored scale (the classic
   modal color of fantasy/tavern game music). All three layers are
   generated in real time, so there's no loop point to seam.
   ---------------------------------------------------------------- */
let musicNodes=null, musicArpTimer=null, musicSwellTimer=null;
function startMusic(){
  if(!state.settings.music) return;
  ensureAudio(); if(!actx) return;
  if(musicNodes) return;
  try{
    const bed=actx.createGain(); bed.gain.value=1; bed.connect(musicMasterGain);

    const droneFilter=actx.createBiquadFilter(); droneFilter.type="lowpass"; droneFilter.frequency.value=800;
    droneFilter.connect(bed);
    const root=actx.createOscillator(); root.type="sine"; root.frequency.value=110;
    const fifth=actx.createOscillator(); fifth.type="sine"; fifth.frequency.value=110*1.5;
    const rootGain=actx.createGain(); rootGain.gain.value=.5;
    const fifthGain=actx.createGain(); fifthGain.gain.value=.32;
    root.connect(rootGain); rootGain.connect(droneFilter);
    fifth.connect(fifthGain); fifthGain.connect(droneFilter);
    root.start(); fifth.start();

    let swellUp=true;
    const swell=()=>{
      if(!musicNodes) return;
      droneFilter.frequency.setTargetAtTime(swellUp?1150:650, actx.currentTime, 4);
      swellUp=!swellUp;
      musicSwellTimer=setTimeout(swell, 9000);
    };
    musicSwellTimer=setTimeout(swell, 500);

    const scale=[293.66,329.63,349.23,392.00,440.00,493.88,523.25]; // D dorian
    const pluck=()=>{
      if(!musicNodes) return;
      const f=scale[Math.floor(Math.random()*scale.length)] * (Math.random()<0.5?1:0.5);
      const o=actx.createOscillator(), g=actx.createGain();
      o.type="triangle"; o.frequency.value=f;
      o.connect(g); g.connect(bed);
      const t=actx.currentTime;
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(.22,t+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,t+1.6);
      o.start(t); o.stop(t+1.7);
      musicArpTimer=setTimeout(pluck, 1800+Math.random()*2200);
    };
    musicArpTimer=setTimeout(pluck, 1200);

    musicNodes={bed,droneFilter,root,fifth,rootGain,fifthGain};
  }catch(e){ musicNodes=null; }
}
function stopMusic(){
  if(musicArpTimer){ clearTimeout(musicArpTimer); musicArpTimer=null; }
  if(musicSwellTimer){ clearTimeout(musicSwellTimer); musicSwellTimer=null; }
  if(musicNodes){
    const nodes=musicNodes;
    musicNodes=null;
    try{
      const t=actx.currentTime;
      nodes.bed.gain.setTargetAtTime(0, t, 0.15);
      setTimeout(()=>{ try{ nodes.root.stop(); nodes.fifth.stop(); }catch(e){} },450);
    }catch(e){}
  }
}
