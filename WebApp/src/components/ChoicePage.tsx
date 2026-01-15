import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import './ChoicePage.css';

export default function ChoicePage() {
    const [hasResults, setHasResults] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkData = async () => {
            try {
                console.log("Checking storage for existing data...");
                // Check if we actually have data to work with
                const results = await storage.getBloodResults();
                const text = await storage.getFullText(); // Load this just to log it

                console.log("Storage check:", {
                    hasResults: !!results,
                    resultCount: results?.results?.length,
                    hasText: !!text
                });

                // If we have results, that's enough to proceed.
                if (results) {
                    setHasResults(true);
                } else {
                    console.log("No results found in storage.");
                }
            } catch (error) {
                console.error("Error checking storage:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkData();
    }, []);

    if (isLoading) {
        return (
            <div className="choice-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!hasResults) {
        return (
            <div className="choice-container">
                <h1>Nincsenek elérhető adatok.</h1>
                <p>Kérlek, tölts fel egy dokumentumot először.</p>
                <button className="btn btn-primary" onClick={() => window.location.hash = 'upload'}>
                    Vissza a feltöltéshez
                </button>
            </div>
        )
    }

    return (
        <div className="choice-page">
            <div className="container">
                <h1 className="choice-title">Sikeres Feldolgozás!</h1>
                <p className="choice-subtitle">Hogyan szeretnéd megtekinteni az eredményeket?</p>

                <div className="choice-cards">
                    {/* AI Chat Logic */}
                    <div className="choice-card ai-card" onClick={() => window.location.hash = 'chat'}>
                        <div className="card-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <h2>AI Konzultáció</h2>
                        <p>Beszélgess a mesterséges intelligenciával az eredményeidről. Kérdezz bátran a határértékekről vagy a tesztek jelentéséről.</p>
                        <button className="btn btn-primary">Csevegés indítása</button>
                    </div>

                    {/* Traditional Results */}
                    <div className="choice-card results-card" onClick={() => window.location.hash = 'results'}>
                        <div className="card-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h2>Eredmények Listája</h2>
                        <p>Tekintsd meg a strukturált táblázatot és grafikonokat a véreredményekről. A klasszikus nézet.</p>
                        <button className="btn btn-secondary">Táblázat megnyitása</button>
                    </div>
                </div>

                <div className="back-upload">
                    <a href="#upload" className="link-muted">Vissza a feltöltéshez</a>
                </div>
            </div>
        </div>
    );
}
