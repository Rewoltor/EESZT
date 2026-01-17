'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { storage } from '@/lib/storage';
import { ConfirmModal } from './ui/Modal';

export function Header() {
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Determine if we are in the "app" flow (choice, results, chat, detail)
    const isAppFlow = ['/choice', '/results', '/chat'].includes(pathname) || pathname.startsWith('/detail/');

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = async () => {
        await storage.deleteAllData();
        router.push('/');
        setShowDeleteConfirm(false);
        setIsMenuOpen(false);
    };

    // Hide header on upload and choice pages
    if (pathname === '/upload' || pathname === '/choice') return null;

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-lg transition-all duration-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Left Section: Back Button (App Flow) or Logo */}
                        <div className="flex items-center gap-3">
                            {isAppFlow ? (
                                <>
                                    {pathname !== '/results' && (
                                        <button
                                            onClick={() => router.push('/choice')}
                                            className="p-2 -ml-2 rounded-lg text-text-secondary hover:bg-white/5 transition-colors"
                                            title="Vissza a választóhoz"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7-7-7 7-7" />
                                            </svg>
                                        </button>
                                    )}
                                    <h1 className="text-lg font-bold text-text-primary hidden sm:block">
                                        EESZT Elemző
                                    </h1>
                                </>
                            ) : (
                                <Link href="/" className="flex items-center gap-2 group">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-primary text-white shadow-sm transition-colors group-hover:bg-accent-secondary">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <span className="text-lg font-bold text-text-primary">
                                        EESZT Elemző
                                    </span>
                                </Link>
                            )}
                        </div>

                        {/* Right Section: Toggle & Menu */}
                        <div className="flex items-center gap-4">
                            {/* View Toggle (App Flow only) */}
                            {isAppFlow && (
                                <div className="relative flex items-center bg-white/5 p-1 rounded-full border border-border">
                                    {/* Animated Background Pill */}
                                    <div
                                        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-gray-700 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] ${pathname === '/results' || pathname.startsWith('/detail/')
                                            ? 'translate-x-[100%]'
                                            : 'translate-x-0'
                                            }`}
                                    />

                                    <Link
                                        href="/chat"
                                        className={`relative z-10 flex items-center justify-center gap-2 w-32 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${pathname === '/chat'
                                            ? 'text-accent-primary'
                                            : 'text-text-secondary hover:text-text-primary'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                        <span>AI Chat</span>
                                    </Link>

                                    <Link
                                        href="/results"
                                        className={`relative z-10 flex items-center justify-center gap-2 w-32 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${pathname === '/results' || pathname.startsWith('/detail/')
                                            ? 'text-accent-secondary'
                                            : 'text-text-secondary hover:text-text-primary'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <span>Eredmények</span>
                                    </Link>
                                </div>
                            )}

                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="p-2 rounded-lg text-text-secondary hover:bg-white/5 transition-colors relative"
                                    title="Menü"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>

                                {/* Dropdown - Moved OUTSIDE button */}
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl shadow-xl py-1 animate-scale-in origin-top-right z-50">
                                        <button
                                            onClick={() => {
                                                toggleTheme();
                                                setIsMenuOpen(false);
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-text-primary hover:bg-white/5"
                                        >
                                            {theme === 'light' ? (
                                                <>
                                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                    </svg>
                                                    Sötét téma
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                    Világos téma
                                                </>
                                            )}
                                        </button>

                                        {isAppFlow && (
                                            <button
                                                onClick={() => {
                                                    setShowDeleteConfirm(true);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-danger hover:bg-danger/10"
                                            >
                                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Kilépés és Törlés
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header >

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Kilépés és adatok törlése"
                message="Biztosan ki szeretnél lépni? Ez törli a böngészőből az összes feltöltött dokumentumot és eredményt a biztonság érdekében."
                confirmText="Kilépés"
                cancelText="Mégsem"
                variant="danger"
            />
        </>
    );
}
