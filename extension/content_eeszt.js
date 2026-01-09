// EESZT Content Script

let isRunning = false;
const processedRows = new Set(); // Track processed IDs to avoid loops
const MAX_PAGES = 50;
let collectedEventData = []; // Store all scraped event metadata

console.log("EESZT Content Script Loaded");

// Expose global entry point for executeScript
window.EESZT_START_SYNC = function () {
    console.log("Global EESZT_START_SYNC command received");
    if (!isRunning) {
        // Init UI
        createRunningIndicator();
        updateRunningIndicator("AUTOMATIZÁLÁS INDÍTÁSA...");

        isRunning = true;

        // Start immediately
        runAutomationSequence().catch(err => {
            console.error("Automation error:", err);
            updateRunningIndicator("Hiba: " + err.message); // Show error in indicator
            showToast("Hiba: " + err.message); // Backup toast
            chrome.runtime.sendMessage({ action: "SYNC_STATUS_UPDATE", status: "Hiba: " + err.message }).catch(() => { });
            isRunning = false;
            // Optionally leave indicator up or remove it after delay
            setTimeout(removeRunningIndicator, 5000);
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

// --- UI COMPONENTS ---

function createRunningIndicator() {
    if (document.getElementById("eeszt-running-indicator")) return;

    const indicator = document.createElement("div");
    indicator.id = "eeszt-running-indicator";
    indicator.style.position = "fixed";
    indicator.style.top = "20px";
    indicator.style.left = "20px"; // Top left
    indicator.style.padding = "16px 24px";
    indicator.style.background = "#2563eb"; // Blue
    indicator.style.color = "white";
    indicator.style.borderRadius = "12px";
    indicator.style.zIndex = "9999999";
    indicator.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
    indicator.style.fontFamily = "'Inter', -apple-system, sans-serif";
    indicator.style.display = "flex";
    indicator.style.alignItems = "center";
    indicator.style.gap = "12px";
    indicator.style.maxWidth = "400px";
    indicator.style.transition = "all 0.3s ease";

    // Spinner
    const spinner = document.createElement("div");
    spinner.style.width = "20px";
    spinner.style.height = "20px";
    spinner.style.border = "3px solid rgba(255,255,255,0.3)";
    spinner.style.borderTopColor = "#fff";
    spinner.style.borderRadius = "50%";
    spinner.style.animation = "eeszt-spin 1s linear infinite";

    // Add keyframes
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes eeszt-spin { to { transform: rotate(360deg); } }
        @keyframes eeszt-fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        #eeszt-running-indicator { animation: eeszt-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    `;
    document.head.appendChild(styleSheet);

    const textContainer = document.createElement("div");

    const title = document.createElement("div");
    title.innerText = "A program fut...";
    title.style.fontWeight = "700";
    title.style.fontSize = "14px";
    title.style.marginBottom = "4px";

    const statusObj = document.createElement("div");
    statusObj.id = "eeszt-indicator-status";
    statusObj.innerText = "Kérjük, várjon...";
    statusObj.style.fontSize = "12px";
    statusObj.style.opacity = "0.9";
    statusObj.style.lineHeight = "1.4";

    const warning = document.createElement("div");
    warning.innerText = "Nyugodtan végezhet más munkát, de ezt az oldalt NE zárja be!";
    warning.style.fontSize = "11px";
    warning.style.marginTop = "6px";
    warning.style.paddingTop = "6px";
    warning.style.borderTop = "1px solid rgba(255,255,255,0.2)";
    warning.style.opacity = "0.8";

    textContainer.appendChild(title);
    textContainer.appendChild(statusObj);
    textContainer.appendChild(warning);

    indicator.appendChild(spinner);
    indicator.appendChild(textContainer);

    document.body.appendChild(indicator);
}

function updateRunningIndicator(text) {
    const el = document.getElementById("eeszt-indicator-status");
    if (el) el.innerText = text;
}

function removeRunningIndicator() {
    const el = document.getElementById("eeszt-running-indicator");
    if (el) el.remove();
}

function createCompletionModal() {
    // Remove running indicator first
    removeRunningIndicator();

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0, 0, 0, 0.7)";
    overlay.style.zIndex = "10000000";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.backdropFilter = "blur(4px)";
    overlay.style.animation = "eeszt-fade-in 0.3s ease-out";

    const modal = document.createElement("div");
    modal.style.background = "white";
    modal.style.padding = "32px";
    modal.style.borderRadius = "16px";
    modal.style.width = "400px";
    modal.style.textAlign = "center";
    modal.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
    modal.style.fontFamily = "'Inter', -apple-system, sans-serif";

    // Icon
    const icon = document.createElement("div");
    icon.innerHTML = "";
    icon.style.fontSize = "48px";
    icon.style.marginBottom = "16px";

    const title = document.createElement("h2");
    title.innerText = "✅ Siker!";
    title.style.margin = "0 0 12px 0";
    title.style.color = "#111827";
    title.style.fontSize = "24px";

    const desc = document.createElement("p");
    desc.innerText = "Minden fájl letöltése sikeresen befejeződött.";
    desc.style.color = "#6b7280";
    desc.style.margin = "0 0 8px 0";
    desc.style.lineHeight = "1.5";

    const subDesc = document.createElement("p");
    subDesc.innerText = "A következő lépés az eredmények és kiértékelés megtekintése.";
    subDesc.style.color = "#4b5563"; // Darker gray
    subDesc.style.margin = "0 0 24px 0";
    subDesc.style.fontSize = "14px";
    subDesc.style.lineHeight = "1.5";

    const button = document.createElement("button");
    button.innerText = "Eredmények megtekintése →";
    button.style.background = "linear-gradient(135deg, #3b82f6, #2563eb)";
    button.style.color = "white";
    button.style.border = "none";
    button.style.padding = "12px 24px";
    button.style.borderRadius = "8px";
    button.style.fontWeight = "600";
    button.style.fontSize = "14px";
    button.style.cursor = "pointer";
    button.style.width = "100%";
    button.style.transition = "transform 0.1s";

    button.onmouseover = () => button.style.transform = "translateY(-1px)";
    button.onmouseout = () => button.style.transform = "translateY(0)";

    // Button Action
    button.onclick = () => {
        // Redirect to analysis page (Placeholder)
        window.location.href = "https://ANALYSIS_PAGE_URL";
    };

    modal.appendChild(icon);
    modal.appendChild(title);
    modal.appendChild(desc);
    modal.appendChild(subDesc);
    modal.appendChild(button);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);
}

function showToast(text) {
    // Keep legacy toast for quick debug or if needed, but style it smaller if indicator is present?
    // Actually, just let it exist or reuse if you want.
    // For now, I'll leave the original implementation as a fallback but primarily use the indicator.
    let toast = document.getElementById("eeszt-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "eeszt-toast";
        toast.style.position = "fixed";
        toast.style.top = "20px";
        toast.style.right = "20px"; // Same pos as indicator? Might overlap.
        // Let's move toast down if indicator exists
        toast.style.marginTop = "100px";
        toast.style.padding = "15px 25px";
        toast.style.background = "#2563eb";
        toast.style.color = "white";
        toast.style.borderRadius = "8px";
        toast.style.zIndex = "999998"; // Below indicator
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

// Scrape event metadata from modal
function scrapeModalData(modalRoot) {
    try {
        const eventData = {};

        // Strategy 1: Try table-based extraction (look for tr > td pairs)
        const rows = modalRoot.querySelectorAll("tr");
        if (rows.length > 0) {
            console.log(`Found ${rows.length} table rows in modal`);
            rows.forEach(row => {
                const cells = row.querySelectorAll("td");
                if (cells.length >= 2) {
                    const label = cells[0].innerText.trim().replace(/:\s*$/, ''); // Remove trailing colon
                    const value = cells[1].innerText.trim();
                    if (label && value) {
                        eventData[label] = value;
                    }
                }
            });
        }

        // Strategy 2: Text-based fallback (if table approach didn't work)
        if (Object.keys(eventData).length === 0) {
            console.log("Table extraction failed, trying text-based parsing...");
            const modalText = modalRoot.innerText;
            const lines = modalText.split('\n');

            lines.forEach(line => {
                // Look for pattern "Label: Value" or "Label:\tValue"
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0 && colonIndex < line.length - 1) {
                    const label = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim();

                    // Filter out empty values and common UI elements
                    if (label && value &&
                        !label.includes('BEZÁRÁS') &&
                        !label.includes('EHR') &&
                        value.length > 0) {
                        eventData[label] = value;
                    }
                }
            });
        }

        console.log(`Scraped ${Object.keys(eventData).length} fields from modal`);
        return eventData;
    } catch (error) {
        console.error("Error scraping modal data:", error);
        return {};
    }
}

// Download collected metadata as JSON
function downloadMetadataAsJson() {
    if (collectedEventData.length === 0) {
        console.warn("No event data collected, skipping JSON download.");
        return;
    }

    try {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

        const jsonContent = JSON.stringify(collectedEventData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `eeszt_metadata_${timestamp}.json`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        console.log(`Downloaded metadata JSON with ${collectedEventData.length} events`);
    } catch (error) {
        console.error("Error downloading metadata JSON:", error);
    }
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

        // Update UI
        updateRunningIndicator(`Időszak feldolgozása:\n${dateStr}`);
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

            await SLEEP(250);

            // Click Search (Keresés)
            const buttons = Array.from(document.querySelectorAll("button, input[type='submit'], a.btn"));
            const searchBtn = buttons.find(b => b.innerText.toUpperCase().includes("KERESÉS"));

            if (searchBtn) {
                console.log("Clicking Search...");
                searchBtn.click();
                await SLEEP(1500); // 3s for table load

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
        await SLEEP(500);
    }

    // Finished - Download metadata JSON
    console.log("=== AUTOMATION COMPLETE ===");
    downloadMetadataAsJson();
    await SLEEP(250); // Give download time to trigger
    createCompletionModal();
    isRunning = false;
}

async function processResults() {
    // Force reset to Page 1 (User request for reliability)
    const pageOneBtn = document.getElementById("eventsForPatientListPagerNumber1");
    if (pageOneBtn) {
        console.log("Resetting to Page 1...");
        pageOneBtn.click();
        await SLEEP(2000); // Wait for reset
    }

    let pageCount = 0;
    while (pageCount < MAX_PAGES && isRunning) {
        pageCount++;
        console.log("Processing page", pageCount);

        // Minor UX update: show page number if deep in pagination
        if (pageCount > 1) {
            const statusText = document.getElementById("eeszt-indicator-status");
            if (statusText) statusText.innerText += ` (Oldal: ${pageCount})`;
        }

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
                await SLEEP(250);
            } else {
                console.warn(`No Részletek link found in row ${i} even with fallback!`, row.innerHTML.substring(0, 100));
            }
        }

        // Pagination: Specific EESZT Logic (eventsForPatientListPager)
        // User provided ID: eventsForPatientListPager_nextbutton
        // Disabled class: df_pagination_disabled

        const nextBtn = document.getElementById("eventsForPatientListPager_nextbutton");

        if (nextBtn) {
            // Check if disabled
            if (nextBtn.classList.contains("df_pagination_disabled")) {
                console.log("Next button is disabled. End of pagination for this period.");
                break;
            } else {
                console.log("Clicking NEXT page (eventsForPatientListPager_nextbutton)...");
                nextBtn.click();
                await SLEEP(1500); // Allow table refresh (3s)
                continue;
            }
        }

        // Fallback: Check for generic/other paginators if the above ID is missing (just in case)
        const genericNext = document.querySelector(".ui-paginator-next, .pagination-next");
        if (genericNext && !genericNext.classList.contains("ui-state-disabled") && !genericNext.classList.contains("disabled")) {
            console.log("Fallback: Clicking generic next...");
            genericNext.click();
            await SLEEP(1500);
            continue;
        }

        console.log("No next page button found.");
        break;
    }
}

// --- Modal Logic ---
async function waitForModal() {
    console.log("Waiting for modal...");
    // Wait up to 10 seconds for modal
    for (let i = 0; i < 200; i++) {
        // Look for the standard modal container or the backdrop
        const modal = document.querySelector(".modal-content, .ui-dialog, .ui-dialog-content");
        if (modal && modal.offsetParent !== null) return modal;
        await SLEEP(250);
    }
    console.warn("Modal timeout!");
    return null;
}

async function handleModalInteraction(modalRoot) {
    console.log("Modal opened. Looking for EHR button...");
    await SLEEP(500); // Wait for animation

    // SCRAPE METADATA FIRST (before clicking into EHR submenu)
    const eventData = scrapeModalData(modalRoot);
    if (eventData && Object.keys(eventData).length > 0) {
        collectedEventData.push(eventData);
        console.log("✓ Scraped event data:", eventData);
    } else {
        console.warn("⚠ No data scraped from modal");
    }

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
        await SLEEP(1000); // Wait for list to load
    } else {
        console.warn("EHR Button not found. Might be already on list?");
    }

    // 2. Click "EHR dokumentum letöltése" (Download)
    // The user confirmed there might be multiple buttons (e.g. document versions or multiple files)
    // We must find and click ALL of them.
    let downloadBtns = Array.from(modalRoot.querySelectorAll("input[type='button'], button, a")).filter(el => {
        const text = el.value || el.innerText;
        return text && (
            text.toUpperCase().includes("EHR DOKUMENTUM LETÖLTÉSE") ||
            text.toUpperCase().includes("LETÖLTÉS") ||
            text.toUpperCase().includes("DOWNLOAD")
        );
    });

    if (downloadBtns.length > 0) {
        console.log(`Found ${downloadBtns.length} download buttons.`);
        for (const btn of downloadBtns) {
            console.log("Clicking Download button...", btn.value || btn.innerText);
            btn.click();
            // Wait between multiple downloads to avoid browser throttling or race conditions
            await SLEEP(1500);
        }
    } else {
        console.warn("No download button found via value/text search.");
    }

    // 3. Close Modal
    const closeBtn = modalRoot.querySelector(".close, .ui-dialog-titlebar-close, button[data-dismiss='modal']");
    if (closeBtn) {
        console.log("Closing modal...");
        closeBtn.click();
        await SLEEP(250);
    } else {
        // Try Esc key
        document.body.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'Escape', 'bubbles': true }));
    }
}
