"use strict";

/* ============================================================
   MODULE — shop.js
   STATUS: Implemented — Shop UI (browsing only, no purchasing yet).

   RESPONSIBILITY
   Storefront popup listing Coin Packs, Gem Packs, and Special
   Items. Opens from a new #btnShop icon button in the top nav,
   the same way the existing Daily Reward icon opens its own popup
   — this project already uses hand-rolled overlays launched from a
   topbar icon button (see js/daily.js's openDailyWheel() and
   js/dailyreward.js's openDailyRewardPopup()), so the Shop follows
   that same established pattern rather than a tab.

   - Owns state.shop (added additively in state.js's defaultState()
     as { purchaseHistory: [] }) — a namespaced ledger reserved for
     future billing.js to record verified purchases into. Nothing
     writes to it yet.
   - SHOP_CATALOG below is static display data (icon/title/desc/
     price) with a `sku` field already present on every real-money
     item — the exact product id future Google Play Billing / web
     payment integrations will key off of, so wiring billing.js
     later doesn't require redesigning the catalog shape.
   - purchaseItem() is the single integration point a future
     billing.js should call into. Today it only shows a toast; it
     intentionally does NOT grant coins/gems yet, and does not
     write to state.shop.purchaseHistory. Per Section 10, any
     balance a future billing flow grants must be server-verified
     before being treated as authoritative — this file must never
     be the thing that decides a purchase succeeded.
   - Coin Packs / Gem Packs are real-money (priceType:"real"),
     matching how app-store currency packs normally work. Special
     Items are priced in Gems (priceType:"gems") and would spend
     through diamonds.js's existing spendGems() once purchasing is
     implemented — not reinvented here.
   - Markup reuses the existing .card / .card-grid components
     (Section 8) rather than inventing new item-card structure.

   EXPOSES (globally)
       openShop()
       closeShop()
   ============================================================ */

const SHOP_CATALOG = {
  coins: [
    { id:"coins_small",  icon:"🪙", title:"Pouch of Coins",  desc:"A handful of coins for your treasury.",        priceType:"real", price:"$0.99", sku:"com.mergerealms.coins_small"  },
    { id:"coins_medium", icon:"💰", title:"Chest of Coins",  desc:"A solid boost to your kingdom's coffers.",      priceType:"real", price:"$4.99", sku:"com.mergerealms.coins_medium" },
    { id:"coins_large",  icon:"🏦", title:"Vault of Coins",  desc:"Enough coins to fast-track your next building.", priceType:"real", price:"$9.99", sku:"com.mergerealms.coins_large"  }
  ],
  gems: [
    { id:"gems_small",  icon:"💎", title:"Pouch of Gems", desc:"A small handful of premium gems.", priceType:"real", price:"$0.99", sku:"com.mergerealms.gems_small"  },
    { id:"gems_medium", icon:"💎", title:"Bag of Gems",   desc:"A generous bag of premium gems.",   priceType:"real", price:"$4.99", sku:"com.mergerealms.gems_medium" },
    { id:"gems_large",  icon:"💎", title:"Chest of Gems", desc:"A hefty chest of premium gems.",    priceType:"real", price:"$9.99", sku:"com.mergerealms.gems_large"  }
  ],
  special: [
    { id:"special_coins2x_24h",   icon:"⚡", title:"2× Coins (24h)",         desc:"Double coin production from your buildings for a full day.", priceType:"gems", price:150, sku:null },
    { id:"special_mergespeed_1h", icon:"🚀", title:"Merge Speed Boost (1h)", desc:"Spawns arrive faster for one hour.",                          priceType:"gems", price:80,  sku:null },
    { id:"special_golden_skin",   icon:"✨", title:"Golden Spawner Skin",    desc:"A cosmetic golden finish for your spawner.",                  priceType:"gems", price:300, sku:null }
  ]
};

let shopOverlay = null;

/* ----------------------------------------------------------------
   purchaseItem(item)
   The single hook a future billing.js / Play Billing / web payment
   integration should call through. Deliberately inert today — see
   the file header. Buying is not required for this step.
   ---------------------------------------------------------------- */
function purchaseItem(item){
  if(typeof toast==="function") toast("🛍️ Purchases are coming soon!");
}

function shopCardHtml(item){
  const priceLabel = item.priceType==="gems" ? ("💎 "+item.price) : item.price;
  return (
    '<div class="card">'+
      '<div class="top"><span class="icon">'+item.icon+'</span><span class="name">'+item.title+'</span></div>'+
      '<div class="desc">'+item.desc+'</div>'+
      '<div class="price">'+priceLabel+'</div>'+
      '<button class="buy" data-item-id="'+item.id+'">Buy</button>'+
    '</div>'
  );
}

function shopSectionHtml(title, items){
  return (
    '<div class="shop-section">'+
      '<h3>'+title+'</h3>'+
      '<div class="card-grid">'+items.map(shopCardHtml).join("")+'</div>'+
    '</div>'
  );
}

function openShop(){
  if(shopOverlay) return; // already open

  const overlay=document.createElement("div");
  overlay.className="overlay";
  overlay.innerHTML=
    '<div class="modal shop-modal">'+
      '<button class="shop-close" id="shopClose" aria-label="Close">✕</button>'+
      '<div class="bigicon">🛍️</div>'+
      '<h2>Shop</h2>'+
      '<p>Support your kingdom with coin packs, gem packs, and special items.</p>'+
      shopSectionHtml("Coin Packs", SHOP_CATALOG.coins)+
      shopSectionHtml("Gem Packs", SHOP_CATALOG.gems)+
      shopSectionHtml("Special Items", SHOP_CATALOG.special)+
    '</div>';

  document.body.appendChild(overlay);
  shopOverlay = overlay;

  overlay.querySelector("#shopClose").onclick = closeShop;
  overlay.addEventListener("click",(e)=>{ if(e.target===overlay) closeShop(); });

  overlay.querySelectorAll(".buy").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const item = SHOP_CATALOG.coins.find(i=>i.id===btn.dataset.itemId)
                || SHOP_CATALOG.gems.find(i=>i.id===btn.dataset.itemId)
                || SHOP_CATALOG.special.find(i=>i.id===btn.dataset.itemId);
      if(item) purchaseItem(item);
    });
  });
}

function closeShop(){
  if(!shopOverlay) return;
  shopOverlay.remove();
  shopOverlay = null;
}

document.getElementById("btnShop").addEventListener("click", openShop);
