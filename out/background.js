// Background Service Worker

console.log("EESZT Background Worker Loaded");

// 1. Rename downloads to avoid collision
// This listens for ANY download started by the browser (including those triggered by invalid links/clicks)
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    // Check if it looks like an EESZT file or PDF coming from EESZT domain
    // We check URL pattern and MIME type
    const isEeszt = item.url.includes("eeszt.gov.hu") || item.url.includes("e-kortortenet") || item.referrer?.includes("eeszt.gov.hu");

    if (isEeszt) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        // Create a unique filename: EESZT_2025-01-01_12-30-55_123.pdf
        // We put it in an "EESZT" subfolder for cleanliness
        const newFilename = `EESZT/EESZT_Letoltes_${timestamp}_${Math.floor(Math.random() * 1000)}.pdf`;

        console.log(`Renaming download [${item.id}] from '${item.filename}' to '${newFilename}'`);

        suggest({
            filename: newFilename,
            conflictAction: "uniquify"
        });
    } else {
        // Let other files pass normally
        suggest();
    }
});

// 2. Open Popup/Help on Install (Optional helpful feature)
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
