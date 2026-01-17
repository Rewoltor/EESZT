'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LandingChart } from '@/components/LandingChart';

export default function HomePage() {
    return (
        <main className="flex-1">
            {/* Hero Section */}
            <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Text Content */}
                        <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                100% Biztonságos & Privát
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
                                A laborleletek
                                <span className="text-primary-600 block">érthetően.</span>
                            </h1>

                            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                                Az EESZT-ben megtalálható leleteidet látványos grafikonokon mutatjuk meg.
                                Adataid soha nem hagyják el a számítógépedet.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link href="/onboarding">
                                    <Button size="lg" className="min-w-[180px]">
                                        Kezdjük el
                                        <svg
                                            className="ml-2 w-5 h-5"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Button>
                                </Link>
                                <Link href="/upload">
                                    <Button size="lg" variant="ghost" className="min-w-[180px]">
                                        Már megvannak a fájlok?
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Chart Visual */}
                        <div className="relative">
                            {/* Simple blurred effect behind */}
                            <div className="absolute -inset-4 bg-primary-50 dark:bg-primary-900/10 rounded-[2rem] -z-10 transform rotate-2"></div>
                            <Card className="relative shadow-xl border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Vas (Fe)</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Utolsó 2 év eredményei</p>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                                        Normál tartomány
                                    </div>
                                </div>
                                <LandingChart />
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Privacy Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Miért biztonságos?
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                            <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-3xl">
                                🛡️
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                Adataid nálad maradnak
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Nem töltünk fel semmit a felhőbe. A feldolgozás teljes egészében a saját böngésződben történik.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                            <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-3xl">
                                🔒
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                Nincs regisztráció
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Nem kérünk e-mail címet sem jelszót. Azonnal használhatod az alkalmazást.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                            <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-3xl">
                                🗑️
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                Automatikus törlés
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Amint bezárod az ablakot vagy törlöd az adatokat, minden eltűnik. Nem tárolunk semmit.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-16">
                        Gyakori Kérdések
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Hogyan működik?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Az alkalmazás beolvassa a PDF formátumú leleteidet, felismeri bennük a vérvizsgálati eredményeket és időrendi sorrendben ábrázolja őket.
                            </p>
                        </div>

                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Biztonságos a Chrome bővítmény?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Igen. A bővítmény kizárólag a leletek letöltését könnyíti meg az EESZT felületről. Nem fér hozzá más adathoz.
                            </p>
                        </div>

                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Milyen fájlokat kezel?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Jelenleg a szabványos EESZT laborleleteket (PDF) támogatjuk. A rendszer automatikusan felismeri a releváns dokumentumokat.
                            </p>
                        </div>

                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Mi történik a fájljaimmal?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                A tartalmukat a böngésződ olvassa be a memóriába a megjelenítés idejére. Semmi nem kerül elküldésre külső szerverre.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-gray-50 dark:bg-gray-800 text-center border-t border-gray-100 dark:border-gray-800">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                        Készen állsz az egészségügyi adataid vizualizálására?
                    </h2>
                    <Link href="/onboarding">
                        <Button size="lg" className="min-w-[200px]">
                            Kezdjük El Most
                        </Button>
                    </Link>
                </div>
            </section>
        </main>
    );
}
