'use client';

import { Carousel } from './ui/Carousel';
import Image from 'next/image';

/* 
 * Note: Actual images should be placed in public/images/api-guide/
 * For now we use placeholders or text descriptions if images fail to load
 */

interface ApiKeyInstructionsProps {
    onSlideChange?: (index: number) => void;
    onLinkClick?: () => void;
}

export function ApiKeyInstructions({ onSlideChange, onLinkClick }: ApiKeyInstructionsProps) {
    const slides = [
        {
            title: "Miért kell API kulcs?",
            description: "Az EESZT Elemző teljes privát szférát biztosít. A kulcsot kizárólag a te böngésződ tárolja, mi sosem látjuk. Ez garantálja, hogy az adataid és a beszélgetéseid csak közted és az OpenAI között zajlanak.",
            icon: "🔒",
            image: null
        },
        {
            title: "1. Lépés: Regisztráció / Belépés",
            description: "Látogass el az OpenAI Platform oldalára és jelentkezz be a fiókodba, vagy regisztrálj ha még nincs.",
            image: "/images/api-guide/auth.png",
            alt: "OpenAI Login Screen"
        },
        {
            title: "2. Lépés: Kulcs Generálás",
            description: "A Dashboard-on válaszd a 'Dashboard' majd bal oldalt az 'API Keys' menüpontot.",
            image: "/images/api-guide/generate.png",
            alt: "OpenAI Dashboard API keys menu"
        },
        {
            title: "3. Lépés: Új Kulcs Létrehozása",
            description: "Kattints a '+ Create new secret key' gombra. Adj neki egy nevet (pl. 'EESZT Elemző'), hogy később tudd mihez tartozik.",
            image: "/images/api-guide/create.png",
            alt: "Create new secret key modal"
        },
        {
            title: "4. Lépés: Másolás és Beillesztés",
            description: "Másold ki a kapott kulcsot (sk-...) és illeszd be ide a lenti mezőbe. Fontos: a kulcsot később nem tudod újra megnézni!",
            image: "/images/api-guide/copy.png",
            alt: "Copying the API key",
            isLast: true
        }
    ];

    return (
        <div className="w-full max-w-2xl mx-auto">
            <Carousel autoPlay={false} className="w-full" onSlideChange={onSlideChange}>
                {slides.map((slide, index) => (
                    <div key={index} className="flex flex-col items-center text-center h-full max-w-lg mx-auto pt-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {slide.title}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                            {slide.description}
                        </p>

                        <div className="mb-4 w-full flex-1 flex items-center justify-center">
                            {slide.image ? (
                                <div className="relative w-full h-64 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-900">
                                    <img
                                        src={slide.image}
                                        alt={slide.alt}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center text-5xl">
                                    {slide.icon}
                                </div>
                            )}
                        </div>

                        {slide.isLast && (
                            <div className="mt-2">
                                <a
                                    href="https://platform.openai.com/api-keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        if (onLinkClick) onLinkClick();
                                    }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg cursor-pointer no-underline"
                                >
                                    API Kulcs Létrehozása
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        )}
                    </div>
                ))}
            </Carousel>
        </div>
    );
}
