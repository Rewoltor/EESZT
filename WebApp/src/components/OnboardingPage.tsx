import { useState } from 'react';
import './OnboardingPage.css';

interface Step {
    title: string;
    description: string;
    icon: string;
}

const steps: Step[] = [
    {
        title: "Készítsd elő a belépést",
        description: "Az adatok közvetlenül az EESZT fiókodból kerülnek letöltésre a saját számítógépedre. Ehhez szükséged lesz az ügyfélkapus belépési adataidra.",
        icon: "🔐",
    },
    {
        title: "Bővítmény Szükséges",
        description: "A folyamat automatizálásához le kell töltened egy biztonságos Chrome bővítményt. Ez segít összegyűjteni a leleteidet egyetlen gombnyomással.",
        icon: "🧩"
    },
    {
        title: "Indulhat a Letöltés",
        description: "Készen állunk! Kattints a gombra, töltsd le a bővítményt a Chrome Webáruházból, és kövesd az ott leírt utasításokat.",
        icon: "🚀"
    }
];

const CHROME_EXTENSION_URL = "https://chrome.google.com/webstore/detail/placeholder";

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0);

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            window.open(CHROME_EXTENSION_URL, '_blank');
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(c => c - 1);
        }
    };

    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="onboarding-page">
            <div className="container center-content">
                <div className="carousel-card card glass">
                    <div className="carousel-content">
                        <div className="step-content animate-fade-in" key={currentStep}>
                            <div className="step-icon">{steps[currentStep].icon}</div>
                            <h2 className="step-title">{steps[currentStep].title}</h2>
                            <p className="step-description">{steps[currentStep].description}</p>
                        </div>
                    </div>

                    <div className="carousel-footer">
                        {/* Dots Indicator */}
                        <div className="dots-container">
                            {steps.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`dot ${idx === currentStep ? 'active' : ''}`}
                                    onClick={() => setCurrentStep(idx)}
                                    aria-label={`${idx + 1}. lépés`}
                                />
                            ))}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="nav-actions">
                            <button
                                className={`nav-btn prev ${currentStep === 0 ? 'hidden' : ''}`}
                                onClick={prevStep}
                                aria-label="Vissza"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            <button
                                className={`nav-btn next ${isLastStep ? 'extension-btn' : ''}`}
                                onClick={nextStep}
                                aria-label={isLastStep ? "Bővítmény Letöltése" : "Következő"}
                            >
                                {isLastStep ? (
                                    <>
                                        Bővítmény Letöltése
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
                                            <polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round" />
                                            <line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </>
                                ) : (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Persistent Skip Link */}
                <div className="skip-container">
                    <a href="#upload" className="secondary-link">
                        Már megvannak a fájlok? Ugrás a feltöltéshez
                    </a>
                </div>
            </div>
        </div>
    );
}
