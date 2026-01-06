// Vanilla JS Popup Logic

function log(msg) {
    document.getElementById('status').innerText = msg;
}

// 1. Permission Check Button
document.getElementById('btn-perm').addEventListener('click', () => {
    log("Ellenőrzés...");
    // Try to open a window to trigger permission prompt
    try {
        const win = window.open("", "_blank", "width=400,height=200");
        if (win) {
            win.document.write("<html><body style='background:#111;color:#fff;font-family:sans-serif;text-align:center;padding:20px;'><h1>Siker! ✅</h1><p>A felugró ablakok engedélyezve vannak.</p><p>Bezárhatja ezt az ablakot.</p><script>setTimeout(()=>window.close(), 3000);</script></body></html>");
            log("Siker! Jogosultság rendben.");
        } else {
            alert("A BÖNGÉSZŐ BLOKKOLTA AZ ABLAKOT! ❌\n\nKérjük, kattintson a címsorban a 'Pop-up blocked' ikonra (jobb oldalt), és válassza az 'Always allow' opciót!");
            log("Hiba: Pop-up blokkolva.");
        }
    } catch (e) {
        log("Hiba: " + e.message);
    }
});

// 2. Start Sync Button
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
                        return "started";
                    } else {
                        alert("Hiba: A script még nem töltött be. Frissítse az oldalt!");
                        return "missing";
                    }
                }
            });
            log("Parancs elküldve. Ne zárja be a lapot!");
        }
    } catch (e) {
        log("Indítási hiba: " + e.message);
    }
});

// 3. Test Connection Button
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
                document.body.style.border = "5px solid #2563eb";
                document.body.style.transition = "border 0.3s";
                setTimeout(() => document.body.style.border = "none", 2000);
                alert("SIKER! A bővítmény kapcsolódott az oldalhoz.");
            }
        });
        log("Siker! Ellenőrizze a kék keretet.");
    } catch (e) {
        log("Hiba: " + e.message);
    }
});
