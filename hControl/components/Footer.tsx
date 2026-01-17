'use client';

import { usePathname } from 'next/navigation';

export function Footer() {
    const pathname = usePathname();

    // Hide footer on chat, upload, and choice pages
    if (pathname === '/chat' || pathname === '/upload' || pathname === '/choice') return null;

    return (
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Copyright */}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        © {new Date().getFullYear()} EESZT Elemző. Minden jog fenntartva.
                    </div>

                    {/* Privacy Notice */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-right">
                        Az összes adat csak a böngésződben tárolódik.
                        <br className="hidden sm:block" />
                        <span className="text-primary-600 dark:text-primary-400 font-medium">
                            Semmilyen adat nem kerül feltöltésre szerverre.
                        </span>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-center text-gray-500 dark:text-gray-500">
                        Ez az alkalmazás segít elemezni az EESZT rendszerből letöltött egészségügyi dokumentumokat.
                        A feldolgozás teljes mértékben a böngésződben történik, adataid biztonságban vannak.
                    </p>
                </div>
            </div>
        </footer>
    );
}
