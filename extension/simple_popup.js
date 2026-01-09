// simple_popup.js - Auto-Allow Downloads Flow

// === UI Elements ===
const states = {
    tutorial: document.getElementById('state-tutorial'),
    running: document.getElementById('state-running')
};

const slides = document.querySelectorAll('.slide');
const dotsContainer = document.getElementById('dots');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

let currentSlide = 0;
const totalSlides = slides.length;

// === Initialize ===
function init() {
    // Create dots
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        dotsContainer.appendChild(dot);
    }

    // Button listeners
    btnPrev.addEventListener('click', prevSlide);
    btnNext.addEventListener('click', handleNextClick);

    // Check for redirect warning flag
    chrome.storage.local.get(['redirectWarning'], (result) => {
        if (result.redirectWarning) {
            const warningEl = document.getElementById('redirect-warning');
            if (warningEl) {
                warningEl.style.display = 'block';
                // Clear the flag
                chrome.storage.local.remove('redirectWarning');
            }
        }
    });

    updateSlide();
}

// === Carousel ===
function updateSlide() {
    // Hide all first
    slides.forEach(s => s.classList.remove('active'));

    // Show current
    if (slides[currentSlide]) {
        slides[currentSlide].classList.add('active');
    }

    // Update dots
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });

    btnPrev.disabled = currentSlide === 0;

    // Last slide handling
    if (currentSlide === totalSlides - 1) {
        btnNext.textContent = '🚀 Kezdés';
        btnNext.classList.remove('btn-secondary');
        btnNext.classList.add('btn-primary');
    } else {
        btnNext.textContent = 'Tovább →';
        // Ensure styling is consistent if we went back
        btnNext.classList.add('btn-primary');
    }
}

function handleNextClick() {
    if (currentSlide === totalSlides - 1) {
        // Last slide -> Start Flow
        startAutoConfigAndSync();
    } else {
        nextSlide();
    }
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlide();
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateSlide();
    }
}

// === Auto-Config & Sync ===
async function startAutoConfigAndSync() {
    console.log("Starting Auto-Config...");

    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) return;
        const targetTabId = tabs[0].id; // Assign to const now

        // Check if on the correct page (Eseménykatalógus)
        const currentUrl = tabs[0].url;
        if (!currentUrl.includes("esemenykatalogus")) {
            console.log("Incorrect URL. Redirecting to Eseménykatalógus...");

            // 1. Set flag for next popup open
            await chrome.storage.local.set({ 'redirectWarning': true });

            // 2. Redirect
            // User provided link: https://www.eeszt.gov.hu/hu/esemenykatalogus
            await chrome.tabs.update(targetTabId, { url: "https://www.eeszt.gov.hu/hu/esemenykatalogus" });

            // 3. Show warning immediately (if popup persists)
            const warningEl = document.getElementById('redirect-warning');
            if (warningEl) {
                warningEl.style.display = 'block';
                warningEl.innerHTML = `⚠️ <b>Átirányítás...</b><br>Nem a megfelelő oldalon állt.<br>Átirányítottuk az Eseménykatalógusra.`;
            }
            return;
        }

        // 1. AUTO-GRANT PERMISSIONS (Pop-ups + Downloads)
        // CRITICAL: We need BOTH popups (for window.open) AND automaticDownloads
        const origins = [
            'https://eeszt.gov.hu/*',
            'https://*.eeszt.gov.hu/*',
            'https://www.eeszt.gov.hu/*',
            'https://portal.eeszt.gov.hu/*',
            'https://e-kortortenet.eeszt.gov.hu/*',
            'https://*.e-kortortenet.eeszt.gov.hu/*',
            // Catch-all for subdomains
            '*://*.eeszt.gov.hu/*'
        ];

        console.log("Setting permissions for EESZT domains...");
        console.log("🔧 Configuring: Pop-ups + Automatic Downloads");

        let popupSuccessCount = 0;
        let downloadSuccessCount = 0;
        let totalErrors = 0;

        // Set POPUPS permission (THIS IS THE KEY FIX)
        console.log("\n📋 Setting POP-UP permissions...");
        for (const pattern of origins) {
            await new Promise((resolve) => {
                chrome.contentSettings.popups.set({
                    primaryPattern: pattern,
                    setting: 'allow'
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error(`❌ Pop-up ERROR for ${pattern}:`, chrome.runtime.lastError.message);
                        totalErrors++;
                    } else {
                        console.log(`✓ Pop-ups allowed for: ${pattern}`);
                        popupSuccessCount++;
                    }
                    resolve();
                });
            });
        }

        // Set AUTOMATIC DOWNLOADS permission (backup/additional)
        console.log("\n📥 Setting AUTOMATIC DOWNLOAD permissions...");
        for (const pattern of origins) {
            await new Promise((resolve) => {
                chrome.contentSettings.automaticDownloads.set({
                    primaryPattern: pattern,
                    setting: 'allow'
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error(`❌ Download ERROR for ${pattern}:`, chrome.runtime.lastError.message);
                        totalErrors++;
                    } else {
                        console.log(`✓ Downloads allowed for: ${pattern}`);
                        downloadSuccessCount++;
                    }
                    resolve();
                });
            });
        }

        // Verify at least popups were set (most critical)
        if (popupSuccessCount === 0) {
            throw new Error("Nem sikerült beállítani a pop-up jogosultságokat. Próbálja újra vagy engedélyezze manuálisan!");
        }

        console.log(`\n✅ Permissions configured successfully!`);
        console.log(`   Pop-ups: ${popupSuccessCount}/${origins.length}`);
        console.log(`   Downloads: ${downloadSuccessCount}/${origins.length}`);
        if (totalErrors > 0) {
            console.warn(`   Warnings: ${totalErrors} errors (may be safe to ignore)`);
        }

        // Verify popup permission for main domain
        await new Promise((resolve) => {
            chrome.contentSettings.popups.get({
                primaryUrl: 'https://www.eeszt.gov.hu/'
            }, (details) => {
                if (details.setting === 'allow') {
                    console.log('✅ Pop-up permission VERIFIED for eeszt.gov.hu');
                } else {
                    console.warn('⚠️ Pop-up permission verification failed:', details.setting);
                }
                resolve();
            });
        });

        // Give Chrome extra time to process the permission changes
        console.log("⏱️  Waiting for Chrome to process permissions...");
        await new Promise(resolve => setTimeout(resolve, 100));

        // 2. Start Sync Immediately
        startSync(targetTabId);

    } catch (e) {
        console.error("Error:", e);
        alert("Hiba: " + e.message);
    }
}

async function startSync(tabId) {
    // Switch UI
    states.tutorial.classList.remove('active');
    states.running.classList.add('active');

    console.log("Sending start command...");
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                if (window.EESZT_START_SYNC) {
                    window.EESZT_START_SYNC();
                } else {
                    alert("A script még nem töltött be. Frissítse az oldalt!");
                }
            }
        });
    } catch (e) {
        console.error("Script injection failed:", e);
        alert("Script injection error: " + e.message);
    }
}

// === Start ===
init();
