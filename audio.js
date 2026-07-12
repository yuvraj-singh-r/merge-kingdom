"use strict";

/* ============================================================
   AUDIO (placeholder synth beeps via WebAudio)
   ============================================================ */
let actx=null;
function ensureAudio(){ if(!actx){ try{ actx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } }
function beep(freq,dur,type,vol){
  if(!state.settings.sound) return;
  ensureAudio(); if(!actx) return;
  try{
    const o=actx.createOscillator(), g=actx.createGain();
    o.type=type||"sine"; o.frequency.value=freq;
    g.gain.value=(vol||0.08);
    o.connect(g); g.connect(actx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime+(dur||0.2));
    o.stop(actx.currentTime+(dur||0.2)+0.02);
  }catch(e){}
}
const sfx={
  merge:()=>{beep(520,.12,"triangle",.09); beep(760,.15,"triangle",.07);},
  coin:()=>beep(880,.09,"square",.05),
  upgrade:()=>{beep(440,.1,"sawtooth",.06); beep(660,.15,"sawtooth",.06);},
  victory:()=>{[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.25,"triangle",.08),i*110));},
  levelup:()=>{[440,554,659,880].forEach((f,i)=>setTimeout(()=>beep(f,.2,"sine",.08),i*90));},
  click:()=>beep(300,.05,"square",.04)
};
let musicOsc=null, musicGain=null, musicTimer=null;
function startMusic(){
  if(!state.settings.music) return;
  ensureAudio(); if(!actx) return;
  if(musicOsc) return;
  try{
    musicGain=actx.createGain(); musicGain.gain.value=0.015; musicGain.connect(actx.destination);
    musicOsc=actx.createOscillator(); musicOsc.type="sine"; musicOsc.frequency.value=220;
    musicOsc.connect(musicGain); musicOsc.start();
    let n=0; const notes=[220,246,262,294,262,246];
    musicTimer=setInterval(()=>{ if(musicOsc){ musicOsc.frequency.setTargetAtTime(notes[n%notes.length],actx.currentTime,0.6); n++; } },1400);
  }catch(e){}
}
function stopMusic(){
  if(musicOsc){ try{musicOsc.stop();}catch(e){} musicOsc=null; }
  if(musicTimer){ clearInterval(musicTimer); musicTimer=null; }
}
