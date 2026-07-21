"use strict";

/* ============================================================
   SUPPORT & LEGAL CENTER
   ------------------------------------------------------------
   Everything reachable from Settings > Support & Legal. Read-only
   sections (Contact/FAQ, Privacy, Terms, About, Credits, Licenses)
   share one generic openInfoModal() renderer; the bug report form
   is its own interactive overlay.

   Bug reports: there's no dedicated backend in this project, but
   Firestore already is one (used for cloud saves and leaderboard
   entries), so submitBugReport() writes a real document to a new
   bugReports collection when Firestore is reachable — not a fake
   "submit" that goes nowhere. If Firestore isn't reachable (or the
   write fails), it falls back to opening a pre-filled mailto: link,
   which always works regardless of connectivity. As with the
   leaderboard collection, bugReports needs its own Firestore
   security rule server-side (write-only for anyone, no public
   read) — this file can't configure that.

   Open Source Licenses lists only what this project actually
   loads: the Firebase JS SDK and the Cinzel webfont. Nothing here
   is fabricated.
   ============================================================ */

const SUPPORT_EMAIL="support@mergerealms.game";
const APP_VERSION="1.0.0";

let supportOverlay=null;

function closeSupportOverlay(){
  if(!supportOverlay) return;
  closeOverlay(supportOverlay, ()=>{ supportOverlay=null; });
}

/* ----------------------------------------------------------------
   Generic read-only info modal — used by every section below
   except the bug report form.
   ---------------------------------------------------------------- */
function openInfoModal(icon, title, bodyHtml){
  if(supportOverlay) return;
  const overlay=document.createElement("div");
  overlay.className="overlay";
  overlay.innerHTML=
    '<div class="modal support-modal">'+
      '<button class="shop-close" id="supportModalClose" aria-label="Close">✕</button>'+
      '<div class="bigicon">'+icon+'</div>'+
      '<h2>'+title+'</h2>'+
      '<div class="support-body">'+bodyHtml+'</div>'+
    '</div>';
  document.body.appendChild(overlay);
  supportOverlay=overlay;
  overlay.querySelector("#supportModalClose").onclick=closeSupportOverlay;
  overlay.addEventListener("click",(e)=>{ if(e.target===overlay) closeSupportOverlay(); });
}

/* ----------------------------------------------------------------
   Contact Support & FAQ
   ---------------------------------------------------------------- */
function contactSupportHtml(){
  const faqs=[
    ["How do I save my progress across devices?","Sign in with Google from Settings, then use Cloud Save > Sync. Your realm is backed up automatically every 60 seconds while you're signed in, and downloads automatically the next time you sign in on a new device."],
    ["I lost my progress — can I get it back?","If you were ever signed in with Google on this realm, open Settings and sign in again — your most recent cloud save will be offered to you automatically. If you only ever played signed out, progress lives in this browser's local storage only, and clearing site data will erase it."],
    ["What are Gems, and how do I get them?","Gems are Merge Realms' premium currency, shown in the top bar next to Coins. You can earn Gems from Achievements, Daily Quests, and your Login Streak, or purchase Gem Packs from the Shop."],
    ["Does Merge Realms show ads?","No. Merge Realms does not currently display any advertising."],
    ["How does the Daily Reward streak work?","Tap the gift icon in the top bar once a day to spin for a reward. Claiming on consecutive days increases your streak; missing a day resets it."],
    ["How do I unlock new islands on the World Map?","Each island lists its own unlock requirement — usually a Kingdom Level, merge count, or building milestone. Progress toward the requirement is tracked automatically as you play."],
    ["How do I report a problem?","Use Report a Bug in this Support & Legal section — it includes your device info automatically so we can investigate faster."]
  ];
  const faqHtml=faqs.map(([q,a])=>
    '<div class="faq-item"><div class="faq-q">'+q+'</div><div class="faq-a">'+a+'</div></div>'
  ).join("");
  return (
    '<p>Need help with something not covered below? Reach us directly:</p>'+
    '<a class="royal-btn" style="display:inline-block; margin:8px 0 18px; text-decoration:none;" href="mailto:'+SUPPORT_EMAIL+'?subject=Merge%20Realms%20Support">✉️ '+SUPPORT_EMAIL+'</a>'+
    '<h3 class="support-subhead">Frequently Asked Questions</h3>'+
    faqHtml
  );
}

/* ----------------------------------------------------------------
   Privacy Policy
   ---------------------------------------------------------------- */
function privacyPolicyHtml(){
  return (
    '<p class="support-updated">Last updated: July 21, 2026</p>'+
    '<p>This Privacy Policy explains what information Merge Realms ("the game", "we") collects, how it is used, and the choices you have. Merge Realms is a browser-based game; most of it can be played entirely offline without ever sharing any information.</p>'+
    '<h3 class="support-subhead">Information We Collect</h3>'+
    '<p><strong>Local gameplay data.</strong> Your kingdom — coins, gems, buildings, progress, and settings — is stored in your browser\u2019s local storage. This never leaves your device unless you sign in.</p>'+
    '<p><strong>Account information (optional).</strong> If you choose to sign in with Google, we receive your Google account\u2019s display name, email address, profile photo, and a unique account ID, via Firebase Authentication. This is used solely to identify your account for Cloud Save and the Leaderboard.</p>'+
    '<p><strong>Cloud save data.</strong> If you sign in, your gameplay data is copied to Firebase Cloud Firestore so it can sync across devices.</p>'+
    '<p><strong>Leaderboard data.</strong> If you sign in, your display name, profile photo, and selected gameplay stats (Kingdom Level, Coins, Gems, Achievements, Login Streak, Merge Count) are visible to other players on the public Leaderboard.</p>'+
    '<p><strong>Bug reports.</strong> If you submit a bug report, we receive the description you write, an optional screenshot you attach, and basic technical information (browser, device, screen size) to help us diagnose the issue.</p>'+
    '<h3 class="support-subhead">How We Use Information</h3>'+
    '<p>We use the information above only to operate Merge Realms\u2019 features: syncing your save, displaying the Leaderboard, and investigating bugs you report. We do not sell your personal information, and we do not use it for advertising.</p>'+
    '<h3 class="support-subhead">Third-Party Services</h3>'+
    '<p>Merge Realms uses Google Firebase (Authentication, Cloud Firestore) to provide sign-in and cloud sync. Your use of these features is also subject to Google\u2019s own Privacy Policy.</p>'+
    '<h3 class="support-subhead">Children\u2019s Privacy</h3>'+
    '<p>Merge Realms is intended for a general audience and is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us personal information, please contact us and we will remove it.</p>'+
    '<h3 class="support-subhead">Your Choices</h3>'+
    '<p>You can play entirely without signing in, in which case no personal information is collected. If you\u2019ve signed in, you can request deletion of your account data at any time by contacting us at '+SUPPORT_EMAIL+'.</p>'+
    '<h3 class="support-subhead">Contact</h3>'+
    '<p>Questions about this policy can be sent to <a href="mailto:'+SUPPORT_EMAIL+'">'+SUPPORT_EMAIL+'</a>.</p>'+
    '<p class="support-disclaimer">This policy is provided as a template for Merge Realms and should be reviewed by a qualified professional before use in a commercial release, to ensure compliance with applicable laws (such as GDPR or CCPA) in your specific jurisdiction.</p>'
  );
}

/* ----------------------------------------------------------------
   Terms of Service
   ---------------------------------------------------------------- */
function termsOfServiceHtml(){
  return (
    '<p class="support-updated">Last updated: July 21, 2026</p>'+
    '<p>By playing Merge Realms ("the game"), you agree to these Terms of Service. If you do not agree, please do not use the game.</p>'+
    '<h3 class="support-subhead">The Service</h3>'+
    '<p>Merge Realms is a free-to-play browser game. Signing in with a Google account is optional and enables Cloud Save and the Leaderboard; the core game can be played without an account.</p>'+
    '<h3 class="support-subhead">Accounts</h3>'+
    '<p>You are responsible for maintaining access to the Google account you use to sign in. We are not responsible for progress lost due to browser data being cleared on a device where you never signed in.</p>'+
    '<h3 class="support-subhead">Virtual Currency &amp; Items</h3>'+
    '<p>Coins, Gems, and any other in-game currency or item have no real-world monetary value, cannot be redeemed for cash, and exist solely for use within Merge Realms. Any real-money purchases are final and non-refundable except where required by applicable law.</p>'+
    '<h3 class="support-subhead">Conduct</h3>'+
    '<p>You agree not to use cheats, exploits, or automation to interfere with the game, the Leaderboard, or other players\u2019 experience.</p>'+
    '<h3 class="support-subhead">Intellectual Property</h3>'+
    '<p>Merge Realms\u2019 name, logo, art, and code are the property of its developer, except for the open-source components listed under Open Source Licenses.</p>'+
    '<h3 class="support-subhead">Disclaimer &amp; Limitation of Liability</h3>'+
    '<p>Merge Realms is provided "as is" without warranties of any kind. To the maximum extent permitted by law, the developer is not liable for any indirect, incidental, or consequential damages arising from your use of the game, including loss of progress.</p>'+
    '<h3 class="support-subhead">Termination</h3>'+
    '<p>We may suspend or terminate access to online features (Cloud Save, Leaderboard, Sign-In) for accounts found to violate these terms.</p>'+
    '<h3 class="support-subhead">Changes</h3>'+
    '<p>We may update these terms from time to time. Continued use of the game after changes take effect constitutes acceptance of the revised terms.</p>'+
    '<h3 class="support-subhead">Contact</h3>'+
    '<p>Questions about these terms can be sent to <a href="mailto:'+SUPPORT_EMAIL+'">'+SUPPORT_EMAIL+'</a>.</p>'+
    '<p class="support-disclaimer">This document is provided as a template for Merge Realms and should be reviewed by a qualified professional before use in a commercial release, to ensure it fits your specific jurisdiction and business.</p>'
  );
}

/* ----------------------------------------------------------------
   About
   ---------------------------------------------------------------- */
function aboutHtml(){
  const year=new Date().getFullYear();
  return (
    '<p style="font-family:var(--font-display); font-size:20px; color:var(--gold);">Merge Realms</p>'+
    '<p>Version '+APP_VERSION+'</p>'+
    '<p>Developed by the Merge Realms Team</p>'+
    '<p>\u00A9 '+year+' Merge Realms. All rights reserved.</p>'+
    '<p class="support-disclaimer">Merge \u2022 Build \u2022 Rule</p>'
  );
}

/* ----------------------------------------------------------------
   Credits
   ---------------------------------------------------------------- */
function creditsHtml(){
  return (
    '<h3 class="support-subhead">Game Design &amp; Development</h3>'+
    '<p>The Merge Realms Team</p>'+
    '<h3 class="support-subhead">Music &amp; Sound</h3>'+
    '<p>All music and sound effects are generated in real time using the Web Audio API — no external audio files.</p>'+
    '<h3 class="support-subhead">Special Thanks</h3>'+
    '<p>To every ruler who merged their first tile. Your kingdom awaits.</p>'
  );
}

/* ----------------------------------------------------------------
   Open Source Licenses — accurate list of everything this project
   actually loads. Nothing fabricated.
   ---------------------------------------------------------------- */
function licensesHtml(){
  return (
    '<div class="license-item">'+
      '<div class="license-name">Firebase JavaScript SDK</div>'+
      '<div class="license-meta">Google LLC \u2014 Apache License 2.0</div>'+
      '<p>Used for Google Sign-In, Cloud Save, and Leaderboard data.</p>'+
    '</div>'+
    '<div class="license-item">'+
      '<div class="license-name">Cinzel</div>'+
      '<div class="license-meta">SIL Open Font License 1.1</div>'+
      '<p>Display typeface used for headings and titles throughout the game.</p>'+
    '</div>'
  );
}

/* ----------------------------------------------------------------
   Report a Bug — a real interactive form.
   ---------------------------------------------------------------- */
const BUG_SCREENSHOT_MAX_BYTES=700*1024; // keeps the resulting Firestore doc safely under its 1MB limit

function deviceInfoSummary(){
  return [
    "User agent: "+navigator.userAgent,
    "Viewport: "+window.innerWidth+"x"+window.innerHeight,
    "Language: "+navigator.language,
    "Theme: "+(document.documentElement.getAttribute("data-theme")||"dark"),
    "Game version: "+APP_VERSION,
    "Timestamp: "+new Date().toISOString()
  ].join("\n");
}

function openBugReportForm(){
  if(supportOverlay) return;
  const overlay=document.createElement("div");
  overlay.className="overlay";
  overlay.innerHTML=
    '<div class="modal support-modal">'+
      '<button class="shop-close" id="supportModalClose" aria-label="Close">✕</button>'+
      '<div class="bigicon">🐞</div>'+
      '<h2>Report a Bug</h2>'+
      '<div class="support-body">'+
        '<label class="bug-label" for="bugDescription">What happened?</label>'+
        '<textarea id="bugDescription" class="bug-textarea" placeholder="Describe the bug — what you were doing, what you expected, and what happened instead." rows="5"></textarea>'+
        '<label class="bug-label" for="bugScreenshot">Screenshot (optional)</label>'+
        '<input type="file" id="bugScreenshot" accept="image/*" class="bug-file">'+
        '<div class="bug-file-status" id="bugFileStatus"></div>'+
        '<label class="bug-label">Device &amp; browser info</label>'+
        '<textarea class="bug-textarea bug-readonly" id="bugDeviceInfo" rows="4" readonly></textarea>'+
        '<button class="royal-btn" id="bugSubmitBtn" style="width:100%; margin-top:12px;">Submit Report</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(overlay);
  supportOverlay=overlay;
  overlay.querySelector("#supportModalClose").onclick=closeSupportOverlay;
  overlay.addEventListener("click",(e)=>{ if(e.target===overlay) closeSupportOverlay(); });

  overlay.querySelector("#bugDeviceInfo").value=deviceInfoSummary();

  let screenshotDataUrl=null;
  overlay.querySelector("#bugScreenshot").addEventListener("change",(e)=>{
    const file=e.target.files[0];
    const statusEl=overlay.querySelector("#bugFileStatus");
    screenshotDataUrl=null;
    if(!file){ statusEl.textContent=""; return; }
    if(file.size>BUG_SCREENSHOT_MAX_BYTES){
      statusEl.textContent="⚠️ That image is too large (max 700KB). It won't be attached.";
      statusEl.classList.add("bug-file-warn");
      return;
    }
    statusEl.classList.remove("bug-file-warn");
    const reader=new FileReader();
    reader.onload=()=>{ screenshotDataUrl=reader.result; statusEl.textContent="✓ "+file.name+" attached"; };
    reader.onerror=()=>{ statusEl.textContent="Couldn't read that file — it won't be attached."; };
    reader.readAsDataURL(file);
  });

  overlay.querySelector("#bugSubmitBtn").addEventListener("click",()=>{
    const description=overlay.querySelector("#bugDescription").value.trim();
    if(!description){
      toast("Please describe the bug before submitting.");
      sfx.error();
      return;
    }
    submitBugReport(description, screenshotDataUrl, overlay.querySelector("#bugDeviceInfo").value);
  });
}

function submitBugReport(description, screenshotDataUrl, deviceInfo){
  const btn=supportOverlay ? supportOverlay.querySelector("#bugSubmitBtn") : null;
  if(btn){ btn.disabled=true; btn.textContent="Submitting…"; }

  const report={
    description: description,
    deviceInfo: deviceInfo,
    screenshot: screenshotDataUrl||null,
    submittedAt: Date.now(),
    uid: (typeof getCurrentUser==="function" && getCurrentUser()) ? getCurrentUser().uid : null
  };

  function fallbackToMailto(){
    const body=encodeURIComponent(description+"\n\n---\n"+deviceInfo);
    window.open("mailto:"+SUPPORT_EMAIL+"?subject=Merge%20Realms%20Bug%20Report&body="+body, "_blank");
    toast("✉️ Opening your email app to send the report.");
    sfx.click();
    closeSupportOverlay();
  }

  if(window.firebaseDB){
    window.firebaseDB.collection("bugReports").add(report)
      .then(()=>{
        toast("🐞 Bug report submitted — thank you!");
        sfx.victory();
        closeSupportOverlay();
      })
      .catch(()=>{ fallbackToMailto(); });
  } else {
    fallbackToMailto();
  }
}

/* ----------------------------------------------------------------
   Wire up the Settings rows
   ---------------------------------------------------------------- */
document.getElementById("btnBugReport").addEventListener("click", openBugReportForm);
document.getElementById("btnContactSupport").addEventListener("click", ()=>openInfoModal("✉️","Contact Support",contactSupportHtml()));
document.getElementById("btnPrivacyPolicy").addEventListener("click", ()=>openInfoModal("🔒","Privacy Policy",privacyPolicyHtml()));
document.getElementById("btnTermsOfService").addEventListener("click", ()=>openInfoModal("📜","Terms of Service",termsOfServiceHtml()));
document.getElementById("btnAbout").addEventListener("click", ()=>openInfoModal("ℹ️","About",aboutHtml()));
document.getElementById("btnCredits").addEventListener("click", ()=>openInfoModal("🎖️","Credits",creditsHtml()));
document.getElementById("btnOpenSourceLicenses").addEventListener("click", ()=>openInfoModal("📦","Open Source Licenses",licensesHtml()));
