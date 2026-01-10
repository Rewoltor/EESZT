// Background Service Worker

console.log("EESZT Background Worker Loaded");

// 1. Rename downloads to avoid collision
let pendingFilename = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "SET_NEXT_FILENAME") {
        pendingFilename = message.filename;
        console.log("Next download will be named:", pendingFilename);
        sendResponse({ status: "saved" });
    }
    // Handle other messages...
});

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    // Check if it looks like an EESZT file or PDF coming from EESZT domain
    const isEeszt = item.url.includes("eeszt.gov.hu") || item.url.includes("e-kortortenet") || item.referrer?.includes("eeszt.gov.hu");

    if (isEeszt) {
        if (pendingFilename) {
            console.log(`Renaming download [${item.id}] to specific: ${pendingFilename}`);
            suggest({
                filename: "EESZT/" + pendingFilename,
                conflictAction: "uniquify"
            });
            // We consume the pending filename. 
            // If multiple files are downloaded in rapid succession without new names, 
            // they might need to be re-set.
            pendingFilename = null;
        } else {
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            // Create a unique filename: EESZT_2025-01-01_12-30-55_123.pdf
            const newFilename = `EESZT/EESZT_Letoltes_${timestamp}_${Math.floor(Math.random() * 1000)}.pdf`;

            console.log(`Renaming download [${item.id}] from '${item.filename}' to '${newFilename}' (Fallback)`);

            suggest({
                filename: newFilename,
                conflictAction: "uniquify"
            });
        }
    } else {
        // Let other files pass normally
        suggest();
    }
});

// 2. Open Popup/Help on Install (Optional)
chrome.runtime.onInstalled.addListener(() => {
    console.log("EESZT Extension Installed");
});

// 3. Keep Message Channel Open (Legacy Support)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "START_SYNC") {
        console.log("Background received START_SYNC");
    }
    return true;
});
