import { useTheme } from '../context/ThemeContext';
import './Footer.css';

export default function Footer() {
    const { theme, toggleTheme } = useTheme();

    return (
        <footer className="site-footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-logo" onClick={() => window.location.hash = ''} style={{ cursor: 'pointer' }}>
                        <div className="logo-icon">🩺</div>
                        <span className="logo-text">EESZT Visualizer</span>
                    </div>
                    <p className="footer-disclaimer">
                        Ez az alkalmazás nem helyettesíti az orvosi diagnózist. Az eredmények tájékoztató jellegűek. Egészségügyi kérdésekkel mindig fordulj szakorvoshoz.
                    </p>

                    <button
                        onClick={toggleTheme}
                        className="theme-toggle footer-theme-toggle"
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                                <span>Sötét mód</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <span>Világos mód</span>
                            </div>
                        )}
                    </button>

                    <div className="footer-copyright">
                        &copy; {new Date().getFullYear()} EESZT Visualizer. Minden jog fenntartva.
                    </div>
                </div>
            </div>
        </footer>
    );
}
