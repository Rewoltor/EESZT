"use client";

import { useState, useEffect } from "react";
import { Download, Activity, ShieldCheck, PlayCircle } from "lucide-react";
import { clsx } from "clsx";

export default function Home() {
  const [view, setView] = useState<"landing" | "sync" | "dashboard">("landing");
  const [status, setStatus] = useState("Várakozás...");

  // Listen for background messages
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      const listener = (message: any) => {
        if (message.action === "SYNC_STATUS_UPDATE") {
          setStatus(message.status);
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, []);

  const startSync = async () => {
    setView("sync");
    setStatus("Kapcsolódás...");

    if (typeof chrome !== "undefined" && chrome.tabs && chrome.scripting) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
          const tabId = tabs[0].id;
          // Direct injection of the start command
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
              // This runs in the page context
              const win = window as any;
              if (typeof win.EESZT_START_SYNC === 'function') {
                win.EESZT_START_SYNC();
                return "called";
              } else {
                console.error("EESZT_START_SYNC function not found! Content script might not be loaded.");
                alert("Kérjük frissítse az oldalt és próbálja újra!");
                return "missing";
              }
            }
          }, (results) => {
            if (chrome.runtime.lastError) {
              console.error("Script injection failed:", chrome.runtime.lastError);
              setStatus("Hiba: " + chrome.runtime.lastError.message);
            } else {
              console.log("Script executed:", results);
              setStatus("Kapcsolódva. Folyamat indul...");
            }
          });
        } else {
          setStatus("Hiba: Nem található aktív fül.");
        }
      });
    } else {
      setStatus("DEV MODE: Sync szimulálva...");
      setTimeout(() => setStatus("EESZT megnyitva..."), 1000);
    }
  };

  return (
    <main className="flex flex-col h-screen w-full p-6 bg-neutral-950 text-white relative overflow-hidden">

      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[200px] h-[200px] bg-purple-600/20 rounded-full blur-[60px] pointer-events-none" />

      {/* HEADER */}
      <header className="flex items-center gap-3 mb-8 z-10">
        <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
          <Activity className="text-blue-400 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
            EESZT Elemző
          </h1>
          <p className="text-xs text-neutral-500 font-medium">Privát Adatelemzés</p>
        </div>
      </header>

      {/* VIEW: LANDING */}
      {view === "landing" && (
        <div className="flex-1 flex flex-col justify-between z-10 animate-in fade-in zoom-in duration-300">
          <div className="space-y-6">
            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Teljes Biztonság</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed mt-1">
                    Az adatai <strong>soha</strong> nem hagyják el a számítógépét. Minden elemzés helyben, a böngészőben történik.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Hogyan működik?</h2>
              <ol className="text-sm text-neutral-400 list-decimal list-inside space-y-2 marker:text-blue-500">
                <li>Jelentkezzen be az EESZT fiókjába.</li>
                <li>Navigáljon a dokumentumokhoz.</li>
                <li>Az elemző automatikusan letölti a leleteket.</li>
              </ol>
            </div>
          </div>

          <button
            onClick={startSync}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 group"
          >
            <span>Szinkronizálás Indítása</span>
            <PlayCircle className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={async () => {
              const win = window as any;
              try {
                if (typeof chrome === "undefined" || !chrome.tabs || !chrome.scripting) {
                  alert("HIBA: Chrome API nem elérhető! (Localhost?)");
                  return;
                }

                // 1. Try to find EESZT tab specifically
                const tabs = await chrome.tabs.query({ url: "*://*.eeszt.gov.hu/*" });

                let targetTabId = null;
                if (tabs.length > 0) {
                  targetTabId = tabs[0].id;
                  console.log("Found EESZT tab:", targetTabId);
                } else {
                  // Fallback: Active tab
                  const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
                  if (activeTabs.length > 0) {
                    targetTabId = activeTabs[0].id;
                    console.log("Using active tab:", targetTabId);
                  }
                }

                if (!targetTabId) {
                  alert("HIBA: Nem található EESZT vagy aktív fül!");
                  return;
                }

                // 2. Execute Script
                await chrome.scripting.executeScript({
                  target: { tabId: targetTabId, allFrames: true },
                  func: () => {
                    // Run in page
                    console.log("Connection Test Injected!");
                    document.body.style.border = "10px solid red";
                    document.body.style.transform = "scale(0.95)"; // Visual shrink
                    alert("SIKER! A bővítmény kapcsolódott az oldalhoz.");
                  }
                });

              } catch (err: any) {
                console.error("Connection Test Failed:", err);
                alert("HIBA: " + err.message);
              }
            }}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 transition-all rounded-xl text-sm font-medium text-neutral-400 flex items-center justify-center gap-2 mt-4"
          >
            🚧 Kapcsolat Tesztelése (MINDEN KEZDŐLAPON)
          </button>
        </div>
      )
      }

      {/* VIEW: SYNC */}
      {
        view === "sync" && (
          <div className="flex-1 flex flex-col justify-center items-center z-10 animate-in slide-in-from-right duration-300">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <Download className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <h2 className="text-lg font-semibold mb-2">Adatok Letöltése...</h2>
            <p className="text-sm text-neutral-400 text-center max-w-[250px]">
              Kérjük, ne zárja be a megnyíló EESZT ablakot a folyamat végéig.
            </p>

            <div className="mt-8 p-3 bg-neutral-900/80 rounded-lg border border-neutral-800 w-full max-w-[300px]">
              <p className="text-xs text-neutral-500 font-mono text-center">{status}</p>
            </div>
          </div>
        )
      }

    </main >
  );
}
