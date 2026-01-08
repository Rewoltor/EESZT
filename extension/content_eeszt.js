// EESZT Content Script

let isRunning = false;
const processedRows = new Set(); // Track processed IDs to avoid loops
const MAX_PAGES = 50;

console.log("EESZT Content Script Loaded");

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

// Listen for messages from popup (Legacy)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "INIT_SCRAPE") {
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
        toast.style.top = "20px";
        toast.style.right = "20px";
        toast.style.padding = "15px 25px";
        toast.style.background = "#2563eb";
        toast.style.color = "white";
        toast.style.borderRadius = "8px";
        toast.style.zIndex = "999999";
        toast.style.fontWeight = "bold";
        toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
        toast.style.fontFamily = "sans-serif";
        document.body.appendChild(toast);
    }
    toast.innerText = text;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 5000);
}

function SLEEP(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Format date as YYYY.MM.DD.
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}.`;
}

// --- CORE AUTOMATION ---

async function runAutomationSequence() {
    console.log("Running automation...");

    // 1. Cycle through dates from 2017 to NOW
    const startYear = 2017; // EESZT start
    const now = new Date();

    let currentStart = new Date(startYear, 0, 1);

    while (currentStart < now && isRunning) {
        if (!isRunning) { console.log("Stopped."); break; }

        let currentEnd = new Date(currentStart);
        // Add 175 days (approx 6 months) to be safe within 180 day limit
        currentEnd.setDate(currentEnd.getDate() + 175);
        if (currentEnd > now) currentEnd = now;

        const dateStr = `${formatDate(currentStart)} - ${formatDate(currentEnd)}`;
        showToast(`Időszak feldolgozása: ${dateStr}`);
        console.log(`Processing window: ${dateStr}`);

        // Set inputs
        // Try multiple selectors for start/end date inputs
        const inputs = Array.from(document.querySelectorAll("input[type='text']"));
        // Filter by common date format placeholder or ID logic if possible
        const dateInputs = inputs.filter(i =>
            (i.placeholder && i.placeholder.includes("éééé")) ||
            (i.id && (i.id.includes("date") || i.id.includes("Date")))
        );

        if (dateInputs.length >= 2) {
            console.log("Found 2 text inputs");
            const startInput = dateInputs[0];
            const endInput = dateInputs[1];

            startInput.value = formatDate(currentStart);
            endInput.value = formatDate(currentEnd);

            // Trigger change events
            startInput.dispatchEvent(new Event('change', { bubbles: true }));
            endInput.dispatchEvent(new Event('change', { bubbles: true }));

            console.log("Using inputs:", startInput, endInput);

            await SLEEP(500);

            // Click Search (Keresés)
            const buttons = Array.from(document.querySelectorAll("button, input[type='submit'], a.btn"));
            const searchBtn = buttons.find(b => b.innerText.toUpperCase().includes("KERESÉS"));

            if (searchBtn) {
                console.log("Clicking Search...");
                searchBtn.click();
                await SLEEP(3000); // 3s for table load

                // Process Results
                await processResults();

            } else {
                console.warn("Search button not found!");
            }

        } else {
            console.warn("Could not find Date inputs!");
        }

        // Advance to next window
        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1); // Next day
        await SLEEP(1000);
    }

    showToast("TELJES SZINKRONIZÁLÁS KÉSZ!");
    isRunning = false;
}

async function processResults() {
    let pageCount = 0;
    while (pageCount < MAX_PAGES && isRunning) {
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

        for (let i = 0; i < rows.length; i++) {
            if (!isRunning) break;
            const row = rows[i];

            // Generate simple ID
            const rowId = row.innerText.substring(0, 30);
            // if (processedRows.has(rowId)) continue; // Optional: skip duplicates

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

        // Pagination: Next Page
        // Look for typical "next" arrow or button
        const nextBtn = document.querySelector(".ui-paginator-next, .pagination-next, .ui-icon-seek-next");
        if (nextBtn && !nextBtn.classList.contains("ui-state-disabled") && !nextBtn.disabled) {
            console.log("Clicking next page...");
            nextBtn.click();
            await SLEEP(3000);
        } else {
            console.log("No next page.");
            break;
        }
    }
}

// --- Modal Logic ---
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
