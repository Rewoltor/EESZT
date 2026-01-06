// EESZT Automation Content Script

console.log("EESZT Adatelemző Scripts Injected - v2");
showToast("EESZT Elemző Aktív");

let isRunning = false;
let processedRows = new Set();

// Expose global entry point for executeScript
window.EESZT_START_SYNC = function () {
    console.log("Global EESZT_START_SYNC command received");
    if (!isRunning) {
        showToast("AUTOMATIZÁLÁS INDÍTÁSA...");
        isRunning = true;

        // Start immediately
        runAutomationSequence().catch(err => {
            console.error("Automation error:", err);
            showToast("Hiba: " + err.message);
            chrome.runtime.sendMessage({ action: "SYNC_STATUS_UPDATE", status: "Hiba: " + err.message }).catch(() => { });
            isRunning = false;
        });
    }
    return "started";
};

// Expose global entry point for executeScript
window.EESZT_START_SYNC = function () {
    console.log("Global EESZT_START_SYNC command received");
    if (!isRunning) {
        showToast("AUTOMATIZÁLÁS INDÍTÁSA...");
        isRunning = true;

        // Start immediately
        runAutomationSequence().catch(err => {
            console.error("Automation error:", err);
            showToast("Hiba: " + err.message);
            chrome.runtime.sendMessage({ action: "SYNC_STATUS_UPDATE", status: "Hiba: " + err.message }).catch(() => { });
            isRunning = false;
        });
    }
    return "started";
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Msg received in content:", message);
    if (message.action === "INIT_SCRAPE") {
        // Legacy support / fallback
        window.EESZT_START_SYNC();
        sendResponse({ status: "ack" });
    }
    return false;
});

function showToast(text) {
    let toast = document.getElementById("eeszt-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "eeszt-toast";
        toast.style.position = "fixed";
        toast.style.top = "80px"; // Lower it so it doesn't overlap header
        toast.style.right = "20px";
        toast.style.padding = "15px 25px";
        toast.style.background = "#2563eb";
        toast.style.color = "white";
        toast.style.borderRadius = "8px";
        toast.style.zIndex = "9999999";
        toast.style.fontFamily = "sans-serif";
        toast.style.fontWeight = "bold";
        toast.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
        document.body.appendChild(toast);
    }
    toast.innerText = text;
    toast.style.display = "block";

    // Auto hide after 5s
    if (toast.hideTimeout) clearTimeout(toast.hideTimeout);
    toast.hideTimeout = setTimeout(() => { toast.style.display = "none"; }, 5000);
}

const SLEEP = (ms) => new Promise(r => setTimeout(r, ms));

async function runAutomationSequence() {
    console.log("Running automation...");

    // 1. Check if we are on the right page
    // Based on screens, user is at "Eseménykatalógus"

    // 2. Loop through time windows (2017 -> Now)
    const startDate = new Date(2017, 0, 1);
    const now = new Date();

    let currentStart = startDate;

    while (currentStart < now) {
        if (!isRunning) { console.log("Stopped."); break; }

        let currentEnd = new Date(currentStart);
        // Add 175 days (approx 6 months) to be safe within 180 day limit
        currentEnd.setDate(currentEnd.getDate() + 175);
        if (currentEnd > now) currentEnd = now;

        const dateStr = `${formatDate(currentStart)} - ${formatDate(currentEnd)}`;
        console.log(`Processing window: ${dateStr}`);
        showToast(`Keresés: ${dateStr}`);

        try {
            await performSearch(currentStart, currentEnd);
            await processResults();
        } catch (e) {
            console.error("Error in window:", e);
            // Continue to next window?
        }

        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1);
        await SLEEP(1000);
    }

    showToast("Kész! Minden adat feldolgozva.");
    isRunning = false;
    processedRows.clear();
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}.`;
}

async function performSearch(start, end) {
    // Locate inputs - Aggressive Strategy
    const inputs = Array.from(document.querySelectorAll("input[type='text']"));
    console.log(`Found ${inputs.length} text inputs`);

    // Strategy: Look for the specific values currently in them (from screenshot "2025.07.10.") to identify them?
    // Or just identifying by structure.
    // In PrimeFaces/JSF, calendars usually have `input` inside a span.

    // Filter for date-like inputs (width, placeholder, class)
    // Heuristic: The first two visible inputs in the main content area are consistently Start/End date.

    // Filter out hidden inputs
    const visibleInputs = inputs.filter(i => i.offsetParent !== null && i.style.display !== 'none');

    // Use the first two visible inputs
    if (visibleInputs.length >= 2) {
        console.log("Using inputs:", visibleInputs[0], visibleInputs[1]);
        setNativeValue(visibleInputs[0], formatDate(start));
        setNativeValue(visibleInputs[1], formatDate(end));
    } else {
        console.warn("Could not find 2 visible date inputs!");
        showToast("Hiba: Nem találom a dátum mezőket");
        return;
    }

    // Click Search
    // Button usually "KERESÉS" (blue button)
    const buttons = Array.from(document.querySelectorAll("button, a.ui-button")); // PrimeFaces often uses anchors as buttons
    const searchBtn = buttons.find(b => b.innerText && b.innerText.trim().toUpperCase() === "KERESÉS");

    if (searchBtn) {
        console.log("Clicking Search...");
        searchBtn.click();
        await waitForResults();
    } else {
        console.warn("Search button not found! Trying generic submit...");
        // Fallback
        const submit = document.querySelector("button[type='submit']");
        if (submit) submit.click();
    }
}

function setNativeValue(element, value) {
    const lastValue = element.value;
    element.value = value;
    const event = new Event('input', { bubbles: true });
    // React hack
    const tracker = element._valueTracker;
    if (tracker) {
        tracker.setValue(lastValue);
    }
    element.dispatchEvent(event);
    element.dispatchEvent(new Event('change', { bubbles: true }));

    // PrimeFaces specifics: sometimes need 'blur' or 'keydown'
    element.dispatchEvent(new Event('blur', { bubbles: true }));
}

async function waitForResults() {
    await SLEEP(1000); // Wait for click to register

    // Wait for any loader
    let attempts = 0;
    while (document.querySelector(".ui-blockui") || document.querySelector(".loading-indicator")) {
        console.log("Waiting for loading...");
        await SLEEP(500);
        attempts++;
        if (attempts > 20) break;
    }
    await SLEEP(1000); // Rendering buffer
}

async function processResults() {
    // Logic: Pagination loop
    let pageCount = 0;
    while (true) {
        if (!isRunning) return;
        pageCount++;
        console.log("Processing page", pageCount);

        // Find the correct results table
        const tables = Array.from(document.querySelectorAll("table"));
        const dataTable = tables.find(t => {
            const text = t.innerText;
            return text.includes("Eseménytípus") && text.includes("Intézmény");
        });

        if (!dataTable) {
            console.log("No data table found on page.");
            return;
        }

        const rows = Array.from(dataTable.querySelectorAll("tbody tr"));
        if (rows.length === 0 || rows[0].innerText.includes("Nincs találat") || rows[0].innerText.includes("No records")) {
            console.log("No results on this page.");
            return;
        }

        console.log(`Found ${rows.length} rows.`);

        // Iterate Rows
        for (let i = 0; i < rows.length; i++) {
            if (!isRunning) return;
            const row = rows[i];

            // Unique ID
            const rowId = row.innerText.substring(0, 50).replace(/\s/g, '');
            if (processedRows.has(rowId)) {
                continue;
            }

            // Look for "Részletek"
            // The HTML shows it is inside: td > span > a > span.taglib-text
            let detailsText = Array.from(row.querySelectorAll("*")).find(el =>
                el.innerText && el.innerText.trim().toUpperCase() === "RÉSZLETEK"
            );

            let detailsLink = null;
            if (detailsText) {
                // Traverse up to find the closest A or Button
                detailsLink = detailsText.closest("a, button");
            }

            // Fallback: Last link in row
            if (!detailsLink) {
                const links = row.querySelectorAll("a"); // Strictly A tags
                // Filter out empty links or hidden ones if possible
                const validLinks = Array.from(links).filter(l => l.offsetParent !== null && l.innerText.trim().length > 0);
                if (validLinks.length > 0) detailsLink = validLinks[validLinks.length - 1];
            }

            if (detailsLink) {
                console.log(`Opening details for row ${i}...`, detailsLink);
                detailsLink.click();
                // Also Try standard event dispatch if .click() is blocked
                detailsLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

                const modal = await waitForModal();
                if (modal) {
                    await handleModalInteraction(modal);
                    processedRows.add(rowId);
                }
                await SLEEP(500);
            } else {
                console.warn(`No Részletek link found in row ${i} even with fallback!`, row.innerHTML.substring(0, 100));
            }
        }

        // Pagination
        const nextBtn = document.querySelector(".ui-paginator-next");
        // Check if disabled - PrimeFaces usually adds ui-state-disabled
        if (nextBtn && !nextBtn.classList.contains("ui-state-disabled") && !nextBtn.getAttribute("disabled")) {
            console.log("Clicking Next Page...");
            nextBtn.click();
            await waitForResults();
        } else {
            console.log("No next page.");
            break;
        }
    }
}

async function waitForModal() {
    console.log("Waiting for modal...");
    // Wait up to 10 seconds for modal
    for (let i = 0; i < 20; i++) {
        // Look for the standard modal container or the backdrop
        const modal = document.querySelector(".modal-content, .ui-dialog, .ui-dialog-content");
        if (modal && modal.offsetParent !== null) return modal;
        await SLEEP(500);
    }
    console.warn("Modal timeout!");
    return null;
}

async function handleModalInteraction(modalRoot) {
    console.log("Modal opened. Looking for EHR button...");
    await SLEEP(1000); // Wait for animation

    // 1. Click "EHR dokumentumok"
    // Try ID first as per HTML
    let ehrBtn = modalRoot.querySelector("#getEhrDocuments");

    // Fallback to searching by text
    if (!ehrBtn) {
        ehrBtn = Array.from(modalRoot.querySelectorAll("button, a")).find(el =>
            el.innerText && el.innerText.trim().toUpperCase().includes("EHR DOKUMENTUMOK")
        );
    }

    if (ehrBtn) {
        console.log("Clicking EHR Dokumentumok button...");
        ehrBtn.click();
        await SLEEP(2000); // Wait for list to load
    } else {
        console.warn("EHR Button not found. Might be already on list?");
    }

    // 2. Click "EHR dokumentum letöltése" (Download)
    // The user confirmed it is an <input type="button" value="EHR dokumentum letöltése">
    let downloadBtn = Array.from(modalRoot.querySelectorAll("input[type='button'], button, a")).find(el => {
        const text = el.value || el.innerText;
        return text && (
            text.toUpperCase().includes("EHR DOKUMENTUM LETÖLTÉSE") ||
            text.toUpperCase().includes("LETÖLTÉS") ||
            text.toUpperCase().includes("DOWNLOAD")
        );
    });

    if (downloadBtn) {
        console.log("Clicking Download...", downloadBtn);
        // Sometimes input[type=button] needs a direct click
        downloadBtn.click();
        await SLEEP(1500);
    } else {
        console.warn("No download button found via value/text search.");
    }

    // 3. Close Modal
    const closeBtn = modalRoot.querySelector(".close, .ui-dialog-titlebar-close, button[data-dismiss='modal']");
    if (closeBtn) {
        console.log("Closing modal...");
        closeBtn.click();
        await SLEEP(500);
    } else {
        // Try Esc key
        document.body.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'Escape', 'bubbles': true }));
    }
}
