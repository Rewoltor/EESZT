// simple_popup.js - New Permission Flow

// === UI Elements ===
const states = {
    tutorial: document.getElementById('state-tutorial'),
    waiting: document.getElementById('state-waiting'),
    running: document.getElementById('state-running')
};

const slides = document.querySelectorAll('.slide');
const dotsContainer = document.getElementById('dots');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

let currentSlide = 0;
const totalSlides = slides.length;
let pollingInterval = null;
let targetTabId = null;

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
    btnNext.addEventListener('click', nextSlide);

    updateSlide();
}

// === State Management ===
function showState(stateName) {
    Object.keys(states).forEach(key => {
        states[key].classList.toggle('active', key === stateName);
    });
}

// === Carousel ===
function updateSlide() {
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentSlide);
    });

    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });

    btnPrev.disabled = currentSlide === 0;

    // Last slide: Change button to "Kezdés"
    if (currentSlide === totalSlides - 1) {
        btnNext.textContent = '🚀 Kezdés';
        btnNext.onclick = startPermissionFlow;
    } else {
        btnNext.textContent = 'Tovább →';
        btnNext.onclick = nextSlide;
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

// === Permission Flow ===
async function startPermissionFlow() {
    console.log("Starting permission flow...");

    try {
        // Find EESZT tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tabs.length === 0) {
            alert("Nincs aktív fül! Kérjük, nyissa meg az EESZT oldalt.");
            return;
        }

        targetTabId = tabs[0].id;

        // Check if on EESZT
        if (!tabs[0].url.includes("eeszt.gov.hu")) {
            alert("Ez nem az EESZT oldala!\nKérjük, lépjen be az eeszt.gov.hu oldalra, majd próbálja újra.");
            return;
        }

        // Switch to waiting state
        showState('waiting');

        // Trigger popup via setTimeout (FORCES BLOCK if not whitelisted)
        await chrome.scripting.executeScript({
            target: { tabId: targetTabId },
            func: () => {
                // setTimeout disconnects from user gesture -> Chrome applies popup rules
                setTimeout(() => {
                    window.open("about:blank", "_blank", "width=100,height=100,top=0,left=0");
                }, 50);
            }
        });

        console.log("Popup trigger sent. Starting polling...");

        // Start polling for permission
        startPolling();

    } catch (e) {
        console.error("Error starting flow:", e);
        alert("Hiba történt: " + e.message);
        showState('tutorial');
    }
}

// === Polling for Permission ===
function startPolling() {
    // Clear any existing interval
    if (pollingInterval) clearInterval(pollingInterval);

    // Check every 2 seconds
    pollingInterval = setInterval(async () => {
        console.log("Polling for permission...");

        try {
            const result = await chrome.scripting.executeScript({
                target: { tabId: targetTabId },
                func: () => {
                    return new Promise((resolve) => {
                        // Use setTimeout to simulate async (triggers block if not allowed)
                        setTimeout(() => {
                            try {
                                const testWin = window.open("", "permission_test", "width=1,height=1,top=9999,left=9999");
                                if (testWin && !testWin.closed) {
                                    testWin.close();
                                    resolve("allowed");
                                } else {
                                    resolve("blocked");
                                }
                            } catch (e) {
                                resolve("blocked");
                            }
                        }, 50);
                    });
                }
            });

            const status = result[0]?.result;
            console.log("Poll result:", status);

            if (status === "allowed") {
                // Permission granted! Start sync.
                clearInterval(pollingInterval);
                pollingInterval = null;
                startSync();
            }

        } catch (e) {
            console.error("Polling error:", e);
            // Continue polling despite errors
        }

    }, 2000);
}

// === Start Sync ===
async function startSync() {
    console.log("Permission granted! Starting sync...");

    showState('running');

    try {
        await chrome.scripting.executeScript({
            target: { tabId: targetTabId },
            func: () => {
                if (window.EESZT_START_SYNC) {
                    window.EESZT_START_SYNC();
                } else {
                    alert("A script még nem töltött be. Frissítse az EESZT oldalt (F5), majd próbálja újra.");
                }
            }
        });
    } catch (e) {
        console.error("Sync start error:", e);
        alert("Hiba a szinkronizálás indításakor: " + e.message);
    }
}

// === Cleanup on Popup Close ===
window.addEventListener('unload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});

// === Start ===
init();
