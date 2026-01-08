// simple_popup.js

const ui = {
    startBtn: document.getElementById('btn-start'),
    retryBtn: document.getElementById('btn-retry'),
    tutorial: document.getElementById('tutorial'),
    status: document.getElementById('status'),
    prevBtn: document.getElementById('btn-prev'),
    nextBtn: document.getElementById('btn-next'),
    slides: [document.getElementById('slide-1'), document.getElementById('slide-2'), document.getElementById('slide-3')],
    dotsContainer: document.getElementById('dots-container')
};

let currentSlide = 0;

// Setup Dots
if (ui.dotsContainer) {
    ui.slides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        ui.dotsContainer.appendChild(dot);
    });
}

function updateDots() {
    if (!ui.dotsContainer) return;
    Array.from(ui.dotsContainer.children).forEach((dot, i) => {
        dot.className = `dot ${i === currentSlide ? 'active' : ''}`;
    });
}

function log(msg, color = '#9ca3af') {
    ui.status.innerText = msg;
    ui.status.style.color = color;
}

function showTutorial() {
    ui.startBtn.style.display = 'none';
    ui.tutorial.style.display = 'block';
    ui.retryBtn.style.display = 'flex';
    log("⚠️ Pop-up blokkolva! Kövesse az útmutatót.", "#fbbf24");
}

function hideTutorial() {
    ui.startBtn.style.display = 'flex';
    ui.tutorial.style.display = 'none';
    ui.retryBtn.style.display = 'none';
    log("Készen áll.", "#9ca3af");
}

// Carousel Navigation
ui.nextBtn.addEventListener('click', () => {
    if (currentSlide < ui.slides.length - 1) {
        ui.slides[currentSlide].classList.remove('active');
        currentSlide++;
        ui.slides[currentSlide].classList.add('active');
    }
    updateNavButtons();
    updateDots();
});

ui.prevBtn.addEventListener('click', () => {
    if (currentSlide > 0) {
        ui.slides[currentSlide].classList.remove('active');
        currentSlide--;
        ui.slides[currentSlide].classList.add('active');
    }
    updateNavButtons();
    updateDots();
});

function updateNavButtons() {
    ui.prevBtn.disabled = currentSlide === 0;
    ui.nextBtn.disabled = currentSlide === ui.slides.length - 1;
    ui.prevBtn.style.opacity = ui.prevBtn.disabled ? 0.3 : 1;
    ui.nextBtn.style.opacity = ui.nextBtn.disabled ? 0.3 : 1;
}

// --- CORE LOGIC ---

async function attemptStart() {
    log("Jogosultság ellenőrzése...", "#f59e0b");

    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tabs.length === 0) {
            log("Hiba: Nincs aktív fül.");
            return;
        }

        const tabId = tabs[0].id;

        // 1. Check if we are on EESZT
        if (!tabs[0].url.includes("eeszt.gov.hu")) {
            alert("Ez nem az EESZT oldala!\nKérjük, lépjen be az eeszt.gov.hu oldalra.");
            log("Hiba: Nem EESZT oldal.", "#ef4444");
            return;
        }

        // 2. Proactive Block Check (INJECTED)
        const result = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                return new Promise((resolve) => {
                    try {
                        // Open window
                        const testWin = window.open("", "eeszt_test_popup", "width=100,height=100,top=0,left=0");

                        // If null immediately, it's blocked
                        if (!testWin || testWin.closed || typeof testWin.closed === 'undefined') {
                            resolve("blocked");
                            return;
                        }

                        // Wait 500ms to see if browser auto-closes it (common in blockers)
                        // Also prevents "instant flash" confusion
                        setTimeout(() => {
                            if (testWin.closed) {
                                resolve("blocked");
                            } else {
                                testWin.close();
                                resolve("allowed");
                            }
                        }, 500);

                    } catch (e) {
                        resolve("blocked");
                    }
                });
            }
        });

        // result[0].result contains the return value
        const status = result[0]?.result || "blocked";
        console.log("Popup check result:", status);

        // ALWAYS show tutorial if not explicitly allowed
        if (status !== "allowed") {
            console.warn("Popup blocked on page!");
            showTutorial();
            return;
        }

        // 3. If Allowed, Proceed
        console.log("Popup permission OK");
        hideTutorial();
        log("Szinkronizálás indítása...", "#3b82f6");

        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                if (window.EESZT_START_SYNC) {
                    window.EESZT_START_SYNC();
                } else {
                    alert("A script betöltés alatt... Próbálja újra 1-2 másodperc múlva.");
                }
            }
        });

        log("✅ Folyamat fut...", "#10b981");

    } catch (e) {
        console.error("Error during start:", e);
        // Fallback: If anything fails (e.g. injection blocked), show tutorial
        showTutorial();
    }
}

// Add Listeners
ui.startBtn.addEventListener('click', attemptStart);
ui.retryBtn.addEventListener('click', attemptStart);
