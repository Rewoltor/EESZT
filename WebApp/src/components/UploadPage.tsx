import { useState, useRef } from 'react';
import { mergePDFs } from '../lib/pdfMerger';
import { extractBloodResultsSimple, extractFullText } from '../lib/bloodExtractor'; // NEW SIMPLE EXTRACTOR
import { storage } from '../lib/storage';

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            // Filter for PDF and JSON files
            const validFiles = Array.from(selectedFiles).filter(file => {
                const name = file.name.toLowerCase();
                return file.type === 'application/pdf' || name.endsWith('.pdf') ||
                    file.type === 'application/json' || name.endsWith('.json');
            });

            if (validFiles.length === 0) {
                setError('Nem találtunk támogatott fájlokat (PDF vagy JSON).');
                return;
            }

            setFiles(validFiles);
            setError('');
        }
    };

    const handleProcess = async () => {
        if (files.length === 0) {
            setError('Kérlek, válassz ki fájlokat először.');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
            const jsonFiles = files.filter(f => f.name.toLowerCase().endsWith('.json'));

            let allResults: any[] = []; // Using any[] temporarily to allow merging
            let fullDocumentText = '';

            // 1. Process JSON files
            if (jsonFiles.length > 0) {
                setProgress(`${jsonFiles.length} JSON fájl feldolgozása...`);
                for (const file of jsonFiles) {
                    try {
                        const text = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsText(file);
                        });

                        const data = JSON.parse(text);
                        // Support both direct array and wrapped { results: [] } format
                        let rawData: any[] = [];
                        if (data.results && Array.isArray(data.results)) {
                            rawData = data.results;
                        } else if (Array.isArray(data)) {
                            rawData = data;
                        }

                        // Sanitize and map to BloodTestResult
                        const cleanData = rawData.map(item => ({
                            test_name: item.test_name || 'Ismeretlen vizsgálat',
                            result: item.result != null ? String(item.result) : '',
                            unit: item.unit || '',
                            ref_range: item.ref_range || '',
                            flag: item.flag || '',
                            ref_min: item.ref_min,
                            ref_max: item.ref_max,
                            date: item.date
                        })).filter(item => item.result !== ''); // Filter out items with no result

                        allResults = [...allResults, ...cleanData];
                    } catch (e) {
                        console.error(`Error parsing JSON file ${file.name}:`, e);
                    }
                }

                // For JSON files, we might not have the original text context easily unless it was saved.
                // We'll append a note about this.
                fullDocumentText += `--- JSON Import ---\nJSON files processed: ${jsonFiles.map(f => f.name).join(', ')}\n(Original detailed text content not available from JSON import)\n\n`;
            }

            if (pdfFiles.length > 0) {
                setProgress(`${pdfFiles.length} PDF fájl egyesítése...`);
                const mergedPdfBytes = await mergePDFs(pdfFiles);

                // Create two independent copies immediately to avoid buffer detachment issues
                // (pdf.js transfers buffers to workers, which detaches them)
                const pdfBytesForExtraction = new Uint8Array(mergedPdfBytes);
                const pdfBytesForText = new Uint8Array(mergedPdfBytes);

                setProgress(`PDF feldolgozása (Adatok)...`);
                const pdfResults = await extractBloodResultsSimple(pdfBytesForExtraction);
                allResults = [...allResults, ...pdfResults];

                setProgress(`PDF feldolgozása (Teljes szöveg)...`);
                const pdfText = await extractFullText(pdfBytesForText);
                fullDocumentText += pdfText;
            }

            // DEBUG output & Auto-download
            if (allResults.length > 0) {
                console.log('=== DEBUG: Processed Results ===');
                console.log(`Total results: ${allResults.length}`);

                // Create downloadable debug JSON
                // This allows saving the extracted data (especially from PDFs) for easier reloading
                const debugData = {
                    extractedAt: new Date().toISOString(),
                    fileCount: files.length,
                    totalResults: allResults.length,
                    results: allResults
                };

                const debugBlob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
                const debugLink = document.createElement('a');
                debugLink.href = URL.createObjectURL(debugBlob);
                debugLink.download = `debug_blood_results_${new Date().toISOString().split('T')[0]}.json`;
                debugLink.click();
                console.log('✅ Debug file downloaded');
            }

            if (allResults.length === 0) {
                setError('Nem találtunk vérvizsgálati eredményeket a feltöltött fájlokban.');
                setIsProcessing(false);
                return;
            }

            setProgress(`${allResults.length} eredmény sikeresen feldolgozva!`);

            // Step 3: Store in IndexedDB
            const bloodData = {
                results: allResults,
                processedAt: new Date().toISOString(),
                fileCount: files.length
            };

            // Clear legacy session storage to avoid confusion
            sessionStorage.removeItem('bloodResults');
            sessionStorage.removeItem('bloodFullText');

            await storage.saveBloodResults(bloodData);
            await storage.saveFullText(fullDocumentText);

            // Step 4: Navigate to choice page
            setTimeout(() => {
                window.location.hash = 'choice';
            }, 1000);

        } catch (err) {
            console.error('Processing error:', err);
            setError(`Hiba történt a feldolgozás során: ${err instanceof Error ? err.message : 'Ismeretlen hiba'}`);
            setIsProcessing(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const items = Array.from(e.dataTransfer.items);
        const promises = items.map(item => {
            const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
            if (entry) {
                return traverseFileTree(entry);
            }
            // Fallback for non-entry supporting browsers
            const file = item.getAsFile();
            return file ? Promise.resolve([file]) : Promise.resolve([]);
        });

        const fileArrays = await Promise.all(promises);
        const allFiles = fileArrays.flat();

        const validFiles = allFiles.filter(file => {
            const name = file.name.toLowerCase();
            return file.type === 'application/pdf' || name.endsWith('.pdf') ||
                file.type === 'application/json' || name.endsWith('.json');
        });

        if (validFiles.length > 0) {
            setFiles(validFiles);
            setError('');
        } else {
            setError('Kérlek, csak PDF vagy JSON fájlokat húzz ide.');
        }
    };

    return (
        <div className="upload-page">
            <div className="container">
                <div className="upload-content">
                    <a href="#home" className="back-link">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 13L7 10M7 10L10 7M7 10L13 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Vissza a főoldalra
                    </a>

                    <h1 className="upload-title">Fájlok Feltöltése</h1>
                    <p className="upload-description">
                        Válaszd ki a letöltött EESZT PDF fájlokat vagy a mentett JSON adatfájlt.
                        A rendszer automatikusan feldolgozza őket.
                    </p>

                    {/* Privacy reminder */}
                    <div className="privacy-reminder glass">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 15v2m0-10v4m0 8a9 9 0 110-18 9 9 0 010 18z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Emlékeztető: Minden a böngésződben marad, semmilyen adat nem kerül feltöltésre szerverre.</span>
                    </div>

                    {/* File dropzone */}
                    <div
                        className={`dropzone ${files.length > 0 ? 'has-files' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="application/pdf,.pdf,application/json,.json"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <input
                            ref={folderInputRef}
                            type="file"
                            multiple
                            // @ts-ignore - webkitdirectory is not in the TS types
                            webkitdirectory=""
                            directory=""
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {files.length === 0 ? (
                            <>
                                <svg className="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none">
                                    <path d="M7 18v-1a5 5 0 015-5v0a5 5 0 015 5v1M16 7l-4-4m0 0L8 7m4-4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <h3>Húzd ide a fájlokat</h3>
                                <div className="flex flex-wrap justify-center gap-3 mt-4">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Fájlok kiválasztása
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => folderInputRef.current?.click()}
                                    >
                                        Mappa kiválasztása
                                    </button>
                                </div>
                                <p className="mt-2 text-sm text-gray-400">PDF vagy JSON fájlok</p>
                            </>
                        ) : (
                            <>
                                <svg className="check-icon" width="64" height="64" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <h3>{files.length} fájl kiválasztva</h3>
                                <button className="btn btn-secondary mt-sm" onClick={(e) => {
                                    e.stopPropagation();
                                    setFiles([]);
                                }}>
                                    Törlés és újraválasztás
                                </button>
                            </>
                        )}
                    </div>

                    {/* File list */}
                    {files.length > 0 && (
                        <div className="file-list glass">
                            <h4>Kiválasztott fájlok:</h4>
                            <div className="files-scroll">
                                {files.slice(0, 10).map((file, index) => (
                                    <div key={index} className="file-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>{file.name}</span>
                                        <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                ))}
                                {files.length > 10 && (
                                    <div className="file-item-more">
                                        ...és még {files.length - 10} fájl
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="error-message">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Progress message */}
                    {progress && (
                        <div className="progress-message">
                            <div className="spinner"></div>
                            {progress}
                        </div>
                    )}

                    {/* Process button */}
                    <button
                        className="btn btn-primary btn-lg process-btn"
                        disabled={files.length === 0 || isProcessing}
                        onClick={handleProcess}
                    >
                        {isProcessing ? (
                            <>
                                <div className="spinner-small"></div>
                                Feldolgozás...
                            </>
                        ) : (
                            <>
                                Feldolgozás Indítása
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M13 10L7 10M13 10L10 7M13 10L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
