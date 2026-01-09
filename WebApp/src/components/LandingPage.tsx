import './LandingPage.css';

export default function LandingPage() {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content animate-fade-in">
                        <div className="privacy-badge badge">
                            🔒 100% Privát & Helyi Feldolgozás
                        </div>

                        <h1 className="hero-title">
                            Alakítsd át az EESZT fájljaidat
                            <span className="gradient-text"> Vizuális Egészségügyi Betekintéssé</span>
                        </h1>

                        <p className="hero-description">
                            Töltsd fel az orvosi archívumodat, és mi kibontjuk és vizualizáljuk a vérvizsgálati eredményeidet.
                            <strong> Minden a készülékedén történik</strong> — nincs szerver, nincs adatbázis, nincs követés.
                        </p>

                        <div className="hero-cta">
                            <a href="#upload" className="btn btn-primary btn-lg">
                                Fájlok Feltöltése
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M13 10L7 10M13 10L10 7M13 10L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </a>
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
                    <div className="privacy-cards">
                        <div className="card privacy-card">
                            <div className="icon">🚫</div>
                            <h3>Nincs Adatbázis</h3>
                            <p>Az adataid sosem hagyják el a böngésződet. Semmit sem tárolunk.</p>
                        </div>

                        <div className="card privacy-card">
                            <div className="icon">💻</div>
                            <h3>100% Kliens Oldali</h3>
                            <p>Minden feldolgozás lokálisan történik a böngésződben JavaScript-tel.</p>
                        </div>

                        <div className="card privacy-card">
                            <div className="icon">🔄</div>
                            <h3>Csak Munkamenet Tárolás</h3>
                            <p>Az adatok megmaradnak frissítéskor, de törlődnek a böngésző bezárásakor.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <div className="container">
                    <h2 className="section-title text-center">Hogyan Működik</h2>

                    <div className="steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <h3>Töltsd le az EESZT Archívumodat</h3>
                                <p>Jelentkezz be az EESZT portálra és töltsd le az orvosi dokumentumaidat PDF fájlokként.</p>
                            </div>
                        </div>

                        <div className="step-divider">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5v14m0 0l7-7m-7 7l-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        <div className="step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <h3>Töltsd fel a Mappát</h3>
                                <p>Válaszd ki a PDF fájlokat tartalmazó mappát. Mi helyben összevonjuk és feldolgozzuk őket.</p>
                            </div>
                        </div>

                        <div className="step-divider">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5v14m0 0l7-7m-7 7l-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        <div className="step">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <h3>Nézd meg az Eredményeket</h3>
                                <p>Lásd a vérvizsgálati eredményeidet vizualizálva trendekkel, referencia tartományokkal és jelölésekkel.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="footer-cta">
                <div className="container text-center">
                    <h2 className="mb-md">Készen állsz az egészségügyi adataid vizualizálására?</h2>
                    <a href="#upload" className="btn btn-primary btn-lg">
                        Kezdjük El Most
                    </a>
                </div>
            </section>
        </div>
    );
}
