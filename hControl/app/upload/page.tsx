'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { mergePDFs } from '@/lib/pdfMerger';
import { extractBloodResultsSimple, extractFullText } from '@/lib/bloodExtractor';
import { storage } from '@/lib/storage';

export default function UploadPage() {
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ step: '', percent: 0 });
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper to traverse directories recursively
    const traverseFileTree = async (item: any): Promise<File[]> => {
        return new Promise((resolve) => {
            if (item.isFile) {
                item.file((file: File) => resolve([file]));
            } else if (item.isDirectory) {
                const dirReader = item.createReader();
                const entries: any[] = [];

                const readEntries = () => {
                    dirReader.readEntries(async (result: any[]) => {
                        if (result.length === 0) {
                            const nestedPromises = entries.map(entry => traverseFileTree(entry));
                            const nestedFiles = await Promise.all(nestedPromises);
                            resolve(nestedFiles.flat());
                        } else {
                            entries.push(...result);
                            readEntries();
                        }
                    });
                };
                readEntries();
            } else {
                resolve([]);
            }
        });
    };

    // Check if user already has data and redirect
    useEffect(() => {
        const checkData = async () => {
            const hasData = await storage.hasData();
            if (hasData) {
                router.push('/choice');
            }
        };
        checkData();
    }, [router]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const items = Array.from(e.dataTransfer.items);
        const promises = items.map(item => {
            // @ts-ignore - webkitGetAsEntry is not in standard types
            const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
            if (entry) {
                return traverseFileTree(entry);
            }
            const file = item.getAsFile();
            return file ? Promise.resolve([file]) : Promise.resolve([]);
        });

        const fileArrays = await Promise.all(promises);
        const allFiles = fileArrays.flat();

        const validFiles = allFiles.filter(
            (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        );

        if (validFiles.length > 0) {
            setFiles((prev) => [...prev, ...validFiles]);
            setError(null);
        } else {
            setError('Csak PDF fájlokat tölthetsz fel!');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files).filter(
                (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            );

            if (selectedFiles.length > 0) {
                setFiles((prev) => [...prev, ...selectedFiles]);
                setError(null);
            } else {
                setError('Csak PDF fájlokat tölthetsz fel!');
            }
        }
        // Reset input value to allow selecting same folder/files again if needed
        e.target.value = '';
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleProcess = async () => {
        if (files.length === 0) {
            setError('Kérlek, tölts fel legalább egy PDF fájlt!');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Step 1: Merge PDFs
            setProgress({ step: 'PDF fájlok egyesítése...', percent: 10 });
            const mergedPdf = await mergePDFs(files);

            // Step 2: Extract blood results
            setProgress({ step: 'Vérvizsgálati eredmények kinyerése...', percent: 40 });
            // Clone the buffer because PDF.js worker transfers it, making the original detached
            const results = await extractBloodResultsSimple(new Uint8Array(mergedPdf));

            // Step 3: Extract full text for LLM
            setProgress({ step: 'Teljes szöveg kinyerése AI-hoz...', percent: 70 });
            // We can use the original mergedPdf here as it wasn't transferred in step 2 (we sent a clone)
            // But to be safe and consistent, we can also clone here if we needed it later. 
            // Since this is the last usage, passing the original is fine, but let's be safe.
            const fullText = await extractFullText(mergedPdf);

            // Step 4: Save to IndexedDB
            setProgress({ step: 'Adatok mentése...', percent: 90 });
            await storage.saveBloodResults({
                results,
                processedAt: new Date().toISOString(),
                fileCount: files.length,
            });

            await storage.saveFullText(fullText);

            setProgress({ step: 'Kész!', percent: 100 });

            // Navigate to choice page
            setTimeout(() => {
                router.push('/choice');
            }, 500);

        } catch (err) {
            console.error('Processing error:', err);
            setError(`Hiba történt a feldolgozás során: ${err instanceof Error ? err.message : 'Ismeretlen hiba'}`);
            setIsProcessing(false);
        }
    };

    const [isFileListExpanded, setIsFileListExpanded] = useState(true);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background text-gray-900 dark:text-foreground font-sans transition-colors duration-300">
            <main className="flex-1 flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8 relative">
                <div className={`container mx-auto transition-all duration-500 flex flex-col min-h-[calc(100vh-3rem)] ${files.length > 0 ? 'max-w-7xl' : 'max-w-2xl'}`}>

                    {/* Back Link */}
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-sm text-gray-500 dark:text-text-muted hover:text-gray-900 dark:hover:text-text-primary transition-colors mb-6 group w-fit"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        Vissza a főoldalra
                    </button>

                    <div className="flex-1">
                        {/* Centered Intro (only when no files or stack on mobile) */}
                        <div className={`text-center mb-8 transition-all duration-500 ${files.length > 0 ? 'lg:text-left lg:mb-6' : ''}`}>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-text-primary mb-3 tracking-tight">
                                Fájlok Feltöltése
                            </h1>
                            <p className="text-base text-gray-600 dark:text-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0">
                                Válaszd ki a letöltött EESZT PDF fájlokat vagy a mentett JSON adatfájlt.
                            </p>
                        </div>

                        <div className={`grid grid-cols-1 gap-6 pb-32 transition-all duration-500 ${files.length > 0 ? 'lg:grid-cols-2 lg:gap-12 items-start' : ''}`}>

                            {/* Left Column: Upload & Reminder */}
                            <div className={`flex flex-col gap-6 transition-all duration-500 w-full`}>

                                {/* Reminder Alert */}
                                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-accent-primary/5 border border-blue-100 dark:border-accent-primary/20 flex items-center gap-4 shadow-sm dark:shadow-glow-sm relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 dark:bg-accent-primary/50" />
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-accent-primary/10 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-blue-600 dark:text-accent-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="16" x2="12" y2="12" />
                                            <line x1="12" y1="8" x2="12.01" y2="8" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-blue-900 dark:text-accent-primary/90 font-medium tracking-wide">
                                        Emlékeztető: Minden a böngészőben marad.
                                    </p>
                                </div>

                                {/* Upload Area */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative group border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all duration-300 overflow-hidden ${isDragging
                                        ? 'border-blue-500 dark:border-accent-primary bg-blue-50 dark:bg-accent-primary/10 scale-[0.99] shadow-inner'
                                        : 'border-gray-300 dark:border-white/10 hover:border-blue-400 dark:hover:border-accent-primary/50 hover:bg-white dark:hover:bg-white/5'
                                        } ${files.length > 0 ? 'p-10 lg:p-14' : 'p-10 lg:p-16'}`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-blue-50 dark:from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative z-10">
                                        <div className={`mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-accent-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-accent-primary/20 transition-all duration-300 shadow-sm dark:shadow-glow ${files.length > 0 ? 'w-16 h-16' : 'w-20 h-20'}`}>
                                            <svg
                                                className={`text-blue-600 dark:text-accent-primary ${files.length > 0 ? 'w-8 h-8' : 'w-10 h-10'}`}
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M12 3v18" />
                                                <path d="M12 3l7 7" />
                                                <path d="M12 3L5 10" />
                                                <path d="M19 19h2" />
                                                <path d="M3 19h2" />
                                            </svg>
                                        </div>

                                        <h3 className={`font-semibold text-gray-900 dark:text-text-primary mb-2 ${files.length > 0 ? 'text-xl' : 'text-xl'}`}>
                                            Húzd ide a fájlokat
                                        </h3>
                                        <p className="text-gray-500 dark:text-text-muted text-sm">
                                            vagy kattints
                                        </p>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.json"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Right Column: File List (Only shows when files > 0) */}
                            {files.length > 0 && (
                                <div className="animate-slide-up-fade flex flex-col gap-4">
                                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex-1 flex flex-col shadow-sm dark:shadow-none">
                                        <div
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-500">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-text-primary">
                                                        Kiválasztott dokumentumok
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-text-muted">
                                                        {files.length} fájl feltöltve
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-3 grid gap-2">
                                            {files.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group animate-fade-in"
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <svg className="w-8 h-8 text-gray-400 dark:text-text-muted group-hover:text-gray-600 dark:group-hover:text-text-primary transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-text-primary truncate" title={file.name}>
                                                                {file.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-text-muted">
                                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile(index);
                                                        }}
                                                        className="p-1.5 text-gray-400 dark:text-text-muted hover:text-red-500 dark:hover:text-danger hover:bg-red-50 dark:hover:bg-danger/10 rounded-lg transition-all flex-shrink-0"
                                                        disabled={isProcessing}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Message (Positioned below upload area on mobile, or in left col on desktop) */}
                            {error && (
                                <div className={`p-4 rounded-2xl bg-red-50 dark:bg-danger/10 border border-red-100 dark:border-danger/20 flex items-start gap-3 animate-slide-up ${files.length > 0 ? 'w-full' : ''}`}>
                                    <svg className="flex-shrink-0 w-5 h-5 text-red-500 dark:text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm font-medium text-red-600 dark:text-danger">
                                        {error}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sticky Bottom Action Button */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-background/95 backdrop-blur-md border-t border-gray-200 dark:border-white/5 z-50 flex justify-center">
                        <div className="w-full max-w-7xl mx-auto flex justify-center">
                            <button
                                onClick={handleProcess}
                                disabled={files.length === 0 || isProcessing}
                                className={`group relative flex items-center justify-center gap-3 px-10 py-4 w-full sm:w-auto min-w-[280px] rounded-2xl text-lg font-semibold transition-all duration-300 shadow-lg ${files.length === 0
                                    ? 'bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-text-muted cursor-not-allowed border border-gray-200 dark:border-white/5 opacity-75'
                                    : isProcessing
                                        ? 'bg-gray-800 dark:bg-gray-900 text-white dark:text-accent-primary border border-gray-800 dark:border-accent-primary/20 cursor-wait'
                                        : 'text-white btn-gradient hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {isProcessing && (
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    {isProcessing ? progress.step : 'Feldolgozás Indítása'}
                                    {!isProcessing && <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
                                </span>
                                {/* Animated reflection effect */}
                                {!isProcessing && files.length > 0 && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:animate-shine" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
