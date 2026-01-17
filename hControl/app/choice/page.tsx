'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

import { ConfirmModal } from '@/components/ui/Modal';
import { Loading } from '@/components/ui/Loading';
import { storage } from '@/lib/storage';
import type { StoredBloodData } from '@/types/blood-results';

export default function ChoicePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<StoredBloodData | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const storedData = await storage.getBloodResults();
            if (!storedData) {
                // No data, redirect to home
                router.push('/');
                return;
            }
            setData(storedData);
            setIsLoading(false);
        };
        loadData();
    }, [router]);

    const handleDelete = async () => {
        await storage.deleteAllData();
        router.push('/');
    };

    if (isLoading) {
        return <Loading fullScreen text="Adatok betöltése..." />;
    }

    if (!data) {
        return null;
    }



    return (
        <div className="min-h-screen w-full bg-gray-50 dark:bg-[#0a0e1a] text-gray-900 dark:text-white flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background Ambience - Dark Mode Specific */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-300">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Background Ambience - Light Mode Specific */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none dark:opacity-0 transition-opacity duration-300">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-200/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-200/40 rounded-full blur-[120px]" />
            </div>

            <div className="z-10 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-indigo-400">
                        Sikeres Feldolgozás!
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Hogyan szeretnéd megtekinteni az eredményeket?
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 px-4 max-w-4xl mx-auto w-full">
                    {/* Chat Card */}
                    <div
                        onClick={() => router.push('/chat')}
                        className="group relative bg-white/60 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-800/60 backdrop-blur-xl border border-gray-200 dark:border-white/5 hover:border-blue-400/50 dark:hover:border-blue-500/30 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:transform hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/10 flex flex-col"
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative flex flex-col items-center text-center flex-1">
                            <div className="w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-500 dark:to-cyan-400 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300">
                                <svg className="w-8 h-8 text-blue-600 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                AI Konzultáció
                            </h3>

                            <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed mb-6 flex-1">
                                Beszélgess a mesterséges intelligenciával az eredményeidről.
                                Kérdezz bátran a határértékekről vagy a tesztek jelentéséről.
                            </p>

                            <div className="w-full mt-auto">
                                <Button
                                    className="w-full h-10 text-sm bg-blue-600 hover:bg-blue-700 text-white border border-transparent dark:bg-blue-600/20 dark:hover:bg-blue-600 dark:text-blue-400 dark:hover:text-white dark:border-blue-500/30 dark:hover:border-transparent transition-all duration-300"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push('/chat');
                                    }}
                                >
                                    Csevegés indítása
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Results Card */}
                    <div
                        onClick={() => router.push('/results')}
                        className="group relative bg-white/60 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-800/60 backdrop-blur-xl border border-gray-200 dark:border-white/5 hover:border-indigo-400/50 dark:hover:border-indigo-500/30 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:transform hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col"
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative flex flex-col items-center text-center flex-1">
                            <div className="w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-50 dark:from-indigo-500 dark:to-purple-500 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-300">
                                <svg className="w-8 h-8 text-indigo-600 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                Eredmények Listája
                            </h3>

                            <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed mb-6 flex-1">
                                Tekintsd meg a strukturált táblázatot és grafikonokat a véreredményekről.
                                A klasszikus nézet.
                            </p>

                            <div className="w-full mt-auto">
                                <Button
                                    className="w-full h-10 text-sm bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent dark:bg-indigo-600/20 dark:hover:bg-indigo-600 dark:text-indigo-400 dark:hover:text-white dark:border-indigo-500/30 dark:hover:border-transparent transition-all duration-300"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push('/results');
                                    }}
                                >
                                    Táblázat megnyitása
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => router.push('/upload')}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
                    >
                        Vissza a feltöltéshez
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Adatok törlése"
                message="Biztosan törölni szeretnéd az összes feldolgozott adatot? Ez a művelet nem vonható vissza."
                confirmText="Törlés"
                cancelText="Mégsem"
                variant="danger"
            />
        </div>
    );
}
