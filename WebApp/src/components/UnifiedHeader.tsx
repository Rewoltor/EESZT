import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface UnifiedHeaderProps {
    currentView: 'chat' | 'results';
    onExport?: () => void;
    onDelete?: () => void;
}

export function UnifiedHeader({ currentView, onExport, onDelete }: UnifiedHeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleViewSwitch = (view: 'chat' | 'results') => {
        window.location.hash = view;
    };

    return (
        <header className="unified-header">
            <div className="header-left">
                <button
                    className="icon-btn"
                    onClick={() => window.location.hash = 'choice'}
                    title="Vissza"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7 7-7-7 7-7" />
                    </svg>
                </button>
                <h1>Orvosi Asszisztens</h1>
            </div>

            <div className="header-right">
                <div className="view-toggle">
                    <button
                        className={`toggle-option ${currentView === 'chat' ? 'active' : ''}`}
                        onClick={() => handleViewSwitch('chat')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span>AI Csevegés</span>
                    </button>
                    <button
                        className={`toggle-option ${currentView === 'results' ? 'active' : ''}`}
                        onClick={() => handleViewSwitch('results')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Eredmények</span>
                    </button>
                </div>

                <button
                    className="icon-btn menu-toggle"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    title="Menü"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <>
                        <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}></div>
                        <div className="header-dropdown-menu">
                            <button className="dropdown-item" onClick={() => { toggleTheme(); setIsMenuOpen(false); }}>
                                {theme === 'light' ? (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                        <span>Sötét témá</span>
                                    </>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <span>Világos téma</span>
                                    </>
                                )}
                            </button>
                            {onExport && (
                                <button className="dropdown-item" onClick={() => { onExport(); setIsMenuOpen(false); }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15l-3-3m0 0l3-3m-3 3h12M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                                    </svg>
                                    <span>Letöltés CSV</span>
                                </button>
                            )}
                            {onDelete && (
                                <button className="dropdown-item danger" onClick={() => { onDelete(); setIsMenuOpen(false); }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Kilépés</span>
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
