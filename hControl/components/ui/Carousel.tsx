'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Button } from './Button';

interface CarouselProps {
    children: ReactNode[];
    autoPlay?: boolean;
    interval?: number;
    className?: string;
    onSlideChange?: (index: number) => void;
}

export function Carousel({ children, autoPlay = false, interval = 5000, className = '', onSlideChange }: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (onSlideChange) {
            onSlideChange(currentIndex);
        }
    }, [currentIndex, onSlideChange]);

    useEffect(() => {
        if (!autoPlay) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % children.length);
        }, interval);

        return () => clearInterval(timer);
    }, [autoPlay, interval, children.length]);

    const nextTrip = () => {
        setCurrentIndex((prev) => (prev + 1) % children.length);
    };

    const prevTrip = () => {
        setCurrentIndex((prev) => (prev - 1 + children.length) % children.length);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <div className={`relative flex flex-col group ${className}`}>
            {/* Main Content Area */}
            <div className="relative overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 min-h-[250px]">
                <div
                    className="flex transition-transform duration-500 ease-out h-full"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {children.map((child, index) => (
                        <div key={index} className="w-full flex-shrink-0 flex items-center justify-center p-6 h-full">
                            {child}
                        </div>
                    ))}
                </div>

                {/* Navigation Controls (Bottom Right) */}
                <div className="absolute bottom-6 right-6 flex flex-col items-center gap-3 z-10">
                    <div className="flex gap-2">
                        <button
                            onClick={prevTrip}
                            disabled={currentIndex === 0}
                            className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            aria-label="Previous slide"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </button>
                        <button
                            onClick={nextTrip}
                            disabled={currentIndex === children.length - 1}
                            className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            aria-label="Next slide"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </button>
                    </div>

                    {/* Dots */}
                    <div className="flex justify-center gap-1.5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-2 py-1 rounded-full">
                        {children.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? 'bg-blue-600 w-4'
                                    : 'bg-gray-400 dark:bg-gray-500 hover:bg-gray-600'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
