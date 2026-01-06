// Background Service Worker

// State
let isSyncing = false;
let processedCount = 0;

chrome.runtime.onInstalled.addListener(() => {
    console.log("EESZT Adatelemző Extension Installed");
});

// Listener for messages from Popup or Content Script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Msg received:", message);

    if (message.action === "START_SYNC") {
        isSyncing = true;
        processedCount = 0;

        // Open EESZT or focus existing
        chrome.tabs.query({ url: "https://www.eeszt.gov.hu/*" }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.update(tabs[0].id, { active: true });
                // Inject start message
                chrome.tabs.sendMessage(tabs[0].id, { action: "INIT_SCRAPE" });
            } else {
                chrome.tabs.create({ url: "https://www.eeszt.gov.hu/hu/e-kortortenet" }, (tab) => {
                    // Wait for load? The content script will auto-run but might need a trigger.
                    // We'll let the content script announce itself.
                });
            }
        });
        sendResponse({ status: "started" });
    }

    if (message.action === "DOWNLOAD_ITEM") {
        // Content script found a file to download
        // We can use chrome.downloads.download if we have the URL, 
        // or if it was a click, we just monitor.
        // If we want to rename:
        // chrome.downloads.download({ url: message.url, filename: message.filename });
    }

    if (message.action === "SYNC_STATUS_UPDATE") {
        // Forward to popup if open
        chrome.runtime.sendMessage(message).catch(() => { });
    }
});

// Rename downloads to keep them organized
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    // Check if this download is from EESZT
    // We might need a flag to know if it's "our" download
    suggest({ filename: `EESZT_Data/${item.filename}`, conflictAction: 'overwrite' });
});
