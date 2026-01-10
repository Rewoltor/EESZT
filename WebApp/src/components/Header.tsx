import './Header.css';

export default function Header() {
    return (
        <header className="site-header glass">
            <div className="container header-inner">
                <div className="logo-container" onClick={() => window.location.hash = ''} style={{ cursor: 'pointer' }}>
                    <div className="logo-icon">🩺</div>
                    <span className="logo-text">EESZT Visualizer</span>
                </div>

                <div className="header-actions">
                    <nav className="header-nav">
                        <a href="#upload" className="btn btn-sm btn-ghost">Feltöltés</a>
                        <a href="#onboarding" className="btn btn-sm btn-primary">Kezdés</a>
                    </nav>
                </div>
            </div>
        </header>
    );
}
