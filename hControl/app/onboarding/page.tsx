'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
export default function OnboardingPage() {
    return (
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Hogyan kezdj bele?
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Kövesd ezeket a lépéseket az egészségügyi adataid elemzéséhez
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Step 1 */}
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary-500" />
                        <div className="pl-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">1</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        Telepítsd a böngésző bővítményt
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Telepíts egy Chrome bővítményt, amely segít letölteni az egészségügyi dokumentumaidat az EESZT rendszerből.
                                        A bővítmény automatikusan letölti az összes elérhető dokumentumodat PDF formátumban.
                                    </p>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-400">
                                            <strong>Megjegyzés:</strong> A bővítmény külön projektként érhető el. Ha még nincs meg, kérd el a fejlesztőtől.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Step 2 */}
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-secondary-500" />
                        <div className="pl-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">2</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        Jelentkezz be az EESZT-be
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Látogass el az{' '}
                                        <a
                                            href="https://www.eeszt.gov.hu"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-secondary-600 dark:text-secondary-400 hover:underline font-medium"
                                        >
                                            EESZT weboldalára
                                        </a>{' '}
                                        és jelentkezz be az Ügyfélkapuval vagy más azonosítási móddal.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Step 3 */}
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-purple-500" />
                        <div className="pl-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        Töltsd le a dokumentumokat
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Használd a bővítményt, hogy letöltsd az összes orvosi dokumentumodat.
                                        A bővítmény automatikusan összegyűjti őket és menti PDF fájlokként a számítógépedre.
                                    </p>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 dark:text-blue-400">
                                            <strong>Tipp:</strong> Győződj meg róla, hogy a letöltési mappa üres, így könnyebben kiválaszthatod az új fájlokat.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Step 4 */}
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-green-500" />
                        <div className="pl-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">4</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        Töltsd fel a PDF fájlokat
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Kattints a "Tovább a feltöltéshez" gombra, és töltsd fel az összes letöltött PDF fájlodat.
                                        Az alkalmazás automatikusan egyesíti őket, kinyeri a vérvizsgálati eredményeket, és elmenti a böngésződben.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Privacy Notice */}
                <Card className="mt-12">
                    <div className="flex items-start gap-4">
                        <svg className="flex-shrink-0 w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Adataid biztonságban vannak
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400">
                                Minden feldolgozás kizárólag a böngésződben történik. Semmilyen adat nem kerül feltöltésre külső szerverre.
                                Az adataid csak addig maradnak meg, amíg nem törölöd őket, vagy amíg nem üríted ki a böngésző gyorsítótárát.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Action Buttons */}
                <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/">
                        <Button variant="outline" size="lg">
                            Vissza a főoldalra
                        </Button>
                    </Link>
                    <Link href="/upload">
                        <Button size="lg">
                            Tovább a feltöltéshez
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
                </div>
            </div>
        </main>
    );
}
