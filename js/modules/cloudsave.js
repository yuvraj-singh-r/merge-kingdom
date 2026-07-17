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