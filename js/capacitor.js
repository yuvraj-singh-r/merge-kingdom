"use strict";

/* ============================================================
   CAPACITOR / ANDROID INTEGRATION
   ------------------------------------------------------------
   This file is the ONLY place that touches the Capacitor bridge.
   Every check is guarded by isNativeApp(), so on a normal desktop
   or mobile browser (where window.Capacitor doesn't exist) this
   file quietly does nothing beyond the parts that are useful
   everywhere anyway (offline banner, back-button-equivalent tab
   handling isn't needed off-Android). Nothing here touches
   gameplay — it's app-shell behavior only.

   Capacitor plugins are referenced via the auto-injected
   window.Capacitor.Plugins bridge rather than ES module imports,
   because this project intentionally has no bundler (see
   PROJECT_RULES.md) — this is Capacitor's supported "no build
   step" integration path for plain multi-file web projects.
   ============================================================ */

function isNativeApp(){
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}
function capPlugin(name){
  return (window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins[name] : null;
}

/* ----------------------------------------------------------------
   Native splash screen hand-off.
   Capacitor shows its own native splash (configured in
   capacitor.config.json) instantly on launch, before the WebView
   has even painted — that's what makes startup feel fast. Once
   OUR web loading screen (js/main.js's finishBoot()) has actually
   finished its real init gating, we hide the native splash so the
   two never show at once. Called from finishBoot(); a no-op in a
   normal browser.
   ---------------------------------------------------------------- */
function hideNativeSplash(){
  if(!isNativeApp()) return;
  const SplashScreen=capPlugin("SplashScreen");
  if(SplashScreen && SplashScreen.hide) SplashScreen.hide().catch(()=>{});
}

/* ----------------------------------------------------------------
   Android hardware back button.
   Priority: close an open overlay/modal > return to the Kingdom
   tab > "press back again to exit" > actually exit.
   ---------------------------------------------------------------- */
let backPressArmed=false, backPressTimer=null;
function handleAndroidBackButton(){
  const openOverlay=document.querySelector(".overlay");
  if(openOverlay){
    // Every overlay in this project already closes itself on a
    // backdrop click (see shop.js/worldmap.js/dailyreward.js/
    // support.js/ui-helpers.js's showModal) — reuse that exact
    // logic rather than duplicating a close path per popup.
    openOverlay.click();
    return;
  }
  const activeTab=document.querySelector(".tabbtn.active");
  if(activeTab && activeTab.dataset.tab!=="kingdom"){
    const kingdomTab=document.querySelector('.tabbtn[data-tab="kingdom"]');
    if(kingdomTab) kingdomTab.click();
    return;
  }
  if(!backPressArmed){
    backPressArmed=true;
    if(typeof toast==="function") toast("Press back again to exit");
    backPressTimer=setTimeout(()=>{ backPressArmed=false; },2000);
    return;
  }
  clearTimeout(backPressTimer);
  if(state) try{ save(); }catch(e){}
  const AppPlugin=capPlugin("App");
  if(AppPlugin && AppPlugin.exitApp) AppPlugin.exitApp();
}

/* ----------------------------------------------------------------
   Offline detection.
   navigator.onLine + the online/offline events are standard Web
   APIs that work identically in a normal browser and inside a
   Capacitor WebView, so this is the baseline everywhere. When
   running natively we also listen to @capacitor/network's
   networkStatusChange event, since it reports the OS-level
   connectivity state directly and can be more reliable than a
   WebView's navigator.onLine on some Android versions. Local play
   (merging, buildings, etc.) keeps working while offline — the
   banner just sets expectations about Cloud Save / Leaderboard /
   Sign-In being unavailable until reconnected.
   ---------------------------------------------------------------- */
function updateOfflineBanner(forceOffline){
  const banner=document.getElementById("offlineBanner");
  if(!banner) return;
  const offline=(forceOffline!==undefined) ? forceOffline : !navigator.onLine;
  banner.classList.toggle("show", offline);
}
window.addEventListener("online", ()=>updateOfflineBanner());
window.addEventListener("offline", ()=>updateOfflineBanner());

/* ----------------------------------------------------------------
   Init — runs immediately; safe on every platform.
   ---------------------------------------------------------------- */
updateOfflineBanner();

if(isNativeApp()){
  const AppPlugin=capPlugin("App");
  if(AppPlugin && AppPlugin.addListener){
    AppPlugin.addListener("backButton", handleAndroidBackButton);
  }
  const StatusBar=capPlugin("StatusBar");
  if(StatusBar && StatusBar.setBackgroundColor){
    StatusBar.setBackgroundColor({ color:"#0d0e1f" }).catch(()=>{});
  }
  const NetworkPlugin=capPlugin("Network");
  if(NetworkPlugin && NetworkPlugin.addListener){
    NetworkPlugin.addListener("networkStatusChange", (status)=>{
      updateOfflineBanner(!status.connected);
    });
    if(NetworkPlugin.getStatus){
      NetworkPlugin.getStatus().then((status)=>updateOfflineBanner(!status.connected)).catch(()=>{});
    }
  }
}
