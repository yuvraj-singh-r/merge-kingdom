"use strict";

/* ============================================================
   CLOUD SAVE MODULE - STEP 1
   ============================================================ */

function getCloudDoc() {
    const user = getCurrentUser();

    if (!user) {
        throw new Error("User is not signed in.");
    }

    return window.usersCollection.doc(user.uid);
}

async function saveToCloud() {

    const docRef = getCloudDoc();

    await docRef.set({
        updatedAt: Date.now(),
        version: 1,
        state: state
    });

    if (typeof toast === "function") {
        toast("☁️ Saved to Cloud");
    }

}

"use strict";

/* ============================================================
   CLOUD SAVE MODULE - STEP 1
   ============================================================ */

function getCloudDoc() {
    ...
}

async function saveToCloud() {

    ...

}

// 👇 IS LINE KE NICHE PASTE KARNA HAI

async function loadFromCloud() {

    const docRef = getCloudDoc();

    const snap = await docRef.get();

    if (!snap.exists) {
        if (typeof toast === "function") {
            toast("No cloud save found.");
        }
        return;
    }

    const data = snap.data();

    if (!data.state) {
        return;
    }

    state = data.state;

    save();

    if (typeof toast === "function") {
        toast("☁️ Cloud Save Loaded");
    }

    location.reload();

}