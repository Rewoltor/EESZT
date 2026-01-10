import { LineChart } from './LineChart';
import type { BloodTestResult } from '../types/blood-results';
import './LandingPage.css';
import './LandingPageExtra.css';

const SAMPLE_DATA: BloodTestResult[] = [
    {
        test_name: "Vas (Fe)",
        result: "7,3",
        unit: "umol/L",
        ref_range: "12.5 - 32.2",
        flag: "",
        ref_min: 12.5,
        ref_max: 32.2,
        date: "2023-10-16"
    },
    {
        test_name: "Vas (Fe)",
        result: "8,8",
        unit: "umol/L",
        ref_range: "12.5 - 32.2",
        flag: "",
        ref_min: 12.5,
        ref_max: 32.2,
        date: "2024-02-14"
    },
    {
        test_name: "Vas (Fe)",
        result: "18,1",
        unit: "umol/L",
        ref_range: "12.5 - 32.2",
        flag: "",
        ref_min: 12.5,
        ref_max: 32.2,
        date: "2024-02-29"
    },
    {
        test_name: "Vas (Fe)",
        result: "12,1",
        unit: "umol/L",
        ref_range: "12.5 - 32.2",
        flag: "LOW",
        ref_min: 12.5,
        ref_max: 32.2,
        date: "2024-04-15"
    },
    {
        test_name: "Vas (Fe)",
        result: "20,5",
        unit: "umol/L",
        ref_range: "12.5 - 32.2",
        flag: "",
        ref_min: 12.5,
        ref_max: 32.2,
        date: "2024-07-05"
    },
    {
        test_name: "Vas (Fe)",
        result: "20,3",
        unit: "umol/L",
        ref_range: "12.5 - 32.2",
        flag: "",
        ref_min: 12.5,
        ref_max: 32.2,
        date: "2025-03-14"
    },
    {
        test_name: "Vas (Fe)",
        result: "25,8",
        unit: "umol/L",
        ref_range: "12.5 - 32.2",
        flag: "",
        ref_min: 12.5,
        ref_max: 32.2,
        date: "2025-09-01"
    }
];

export default function LandingPage() {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content animate-fade-in">
                        <div className="privacy-badge badge">
                            🔒 100% Biztonságos & Privát
                        </div>

                        <h1 className="hero-title">
                            Nézdd meg a vérképed alakulását
                            <span className="gradient-text"> egyszerűen és gyorsan</span>
                        </h1>

                        <p className="hero-description">
                            Az EESZT-ben megtalálható leleteidet látványos grafikonokon mutatjuk meg. Lásdd meg, hogy alakul az egészséged.
                            <strong> Adataid soha nem hagyják el a számítógépedet.</strong>
                        </p>

                        <div className="hero-cta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <a href="#onboarding" className="btn btn-primary btn-lg">
                                Kezdjük El
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M13 10L7 10M13 10L10 7M13 10L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </a>
                            <a href="#upload" className="btn btn-text secondary-cta-link">
                                Már megvannak a fájlok? Ugrás a feltöltéshez
                            </a>
                        </div>

                        <div className="hero-visual animate-fade-in" style={{ animationDelay: '0.8s' }}>
                            <div className="chart-preview-container glass" style={{ padding: '0', background: 'transparent', boxShadow: 'none', border: 'none' }}>
                                <h3 className="chart-preview-title" style={{ marginTop: 0, color: 'var(--color-accent-primary)', textAlign: 'left', paddingLeft: '60px' }}>Vas (Fe)</h3>
                                <div style={{ marginBottom: '5rem', height: '350px', width: '100%' }}>
                                    <LineChart data={SAMPLE_DATA} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Animated background elements */}
                <div className="hero-bg">
                    <div className="blob blob-1"></div>
                    <div className="blob blob-2"></div>
                </div>
            </section>

            {/* Privacy Guarantee Section */}
            <section className="privacy-section">
                <div className="container">
                    <h2 className="section-title text-center">Miért biztonságos?</h2>
                    <div className="privacy-cards">
                        <div className="card privacy-card">
                            <div className="icon">🛡️</div>
                            <h3>Adataid nálad maradnak</h3>
                            <p>Nem töltünk fel semmit a felhőbe. A feldolgozás teljes egészében a saját böngésződben történik, internetkapcsolat nélkül is működik.</p>
                        </div>

                        <div className="card privacy-card">
                            <div className="icon">🔒</div>
                            <h3>Nincs regisztráció</h3>
                            <p>Nem kérünk e-mail címet, jelszót vagy személyes adatokat. Azonnal használhatod az alkalmazást.</p>
                        </div>

                        <div className="card privacy-card">
                            <div className="icon">🗑️</div>
                            <h3>Automatikus törlés</h3>
                            <p>Amint bezárod az ablakot, minden betöltött adat törlődik. Nem tárolunk semmit hosszú távon.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section">
                <div className="container">
                    <h2 className="section-title text-center">Gyakori Kérdések</h2>
                    <div className="faq-grid">
                        <div className="faq-item card glass">
                            <h3>Hogyan működik?</h3>
                            <p>Az alkalmazás beolvassa a PDF formátumú leleteidet, felismeri bennük a vérvizsgálati eredményeket, és időrendi sorrendben, grafikonon ábrázolja őket.</p>
                        </div>
                        <div className="faq-item card glass">
                            <h3>Biztonságos a Chrome bővítmény?</h3>
                            <p>Igen. A bővítmény kizárólag arra szolgál, hogy megkönnyítse a leletek letöltését az EESZT felületről. Nem fér hozzá más adathoz és nem küld adatokat sehova.</p>
                        </div>
                        <div className="faq-item card glass">
                            <h3>Milyen fájlokat kezel?</h3>
                            <p>Jelenleg a szabványos EESZT laborleleteket (PDF) támogatjuk. A rendszer automatikusan felismeri a releváns dokumentumokat.</p>
                        </div>
                        <div className="faq-item card glass">
                            <h3>Mi történik a fájljaimmal?</h3>
                            <p>A fájlok tartalmát a böngésződ olvassa be a memóriába a megjelenítés idejére. Semmi nem kerül elküldésre külső szerverre.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="footer-cta">
                <div className="container text-center">
                    <h2 className="mb-md">Készen állsz az egészségügyi adataid vizualizálására?</h2>
                    <a href="#onboarding" className="btn btn-primary btn-lg">
                        Kezdjük El Most
                    </a>
                </div>
            </section>

        </div>
    );
}
