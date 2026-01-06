// Vanilla JS Popup Logic
document.getElementById('btn-test').addEventListener('click', async () => {
    log("Tesztelés...");

    try {
        const tabs = await chrome.tabs.query({ url: "*://*.eeszt.gov.hu/*" });
        let targetId = null;

        if (tabs.length > 0) {
            targetId = tabs[0].id;
        } else {
            // Fallback active
            const active = await chrome.tabs.query({ active: true, currentWindow: true });
            if (active.length > 0) targetId = active[0].id;
        }

        if (!targetId) {
            log("HIBA: Nincs EESZT fül!");
            return;
        }

        await chrome.scripting.executeScript({
            target: { tabId: targetId, allFrames: true },
            func: () => {
                console.log("TEST INJECTED");
                document.body.style.border = "10px solid red";
                alert("SIKER! A bővítmény működik.");
            }
        });
        log("Siker! Ellenőrizze a piros keretet.");
    } catch (e) {
        log("Hiba: " + e.message);
    }
});

document.getElementById('btn-start').addEventListener('click', async () => {
    log("Indítás...");
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0) {
            // Inject starter
            await chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    if (window.EESZT_START_SYNC) {
                        window.EESZT_START_SYNC();
                    } else {
                        alert("Hiba: A script még nem töltött be. Frissítse az oldalt!");
                    }
                }
            });
            log("Parancs elküldve.");
        }
    } catch (e) {
        log("Indítási hiba: " + e.message);
    }
});

function log(msg) {
    document.getElementById('status').innerText = msg;
}
