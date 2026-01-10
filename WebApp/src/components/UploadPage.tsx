import { useState, useRef } from 'react';
import { mergePDFs } from '../lib/pdfMerger';
import { extractBloodResultsSimple } from '../lib/bloodResultExtractor'; // NEW SIMPLE EXTRACTOR
import './UploadPage.css';

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            // Filter for PDF files only
            const pdfFiles = Array.from(selectedFiles).filter(file =>
                file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            );

            if (pdfFiles.length === 0) {
                setError('Nem találtunk PDF fájlokat. Kérlek, válassz egy PDF fájlokat tartalmazó mappát.');
                return;
            }

            setFiles(pdfFiles);
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
        setProgress('PDF fájlok egyesítése...');

        try {
            // Step 1: Merge PDFs
            const mergedPdfBytes = await mergePDFs(files);
            setProgress(`${files.length} PDF fájl sikeresen egyesítve. Vérvizsgálati eredmények kibontása...`);

            // Step 2: Extract blood results with NEW SIMPLE EXTRACTOR
            const results = await extractBloodResultsSimple(mergedPdfBytes);

            // DEBUG: Save results for troubleshooting
            console.log('=== DEBUG: Extracted Results ===');
            console.log(`Total results: ${results.length}`);

            // Create downloadable debug JSON
            const debugData = {
                extractedAt: new Date().toISOString(),
                fileCount: files.length,
                totalResults: results.length,
                results: results.map(r => ({
                    test_name: r.test_name,
                    result: r.result,
                    unit: r.unit,
                    ref_range: r.ref_range,
                    flag: r.flag,
                    ref_min: r.ref_min,
                    ref_max: r.ref_max
                }))
            };

            // Auto-download debug file
            const debugBlob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
            const debugLink = document.createElement('a');
            debugLink.href = URL.createObjectURL(debugBlob);
            debugLink.download = `debug_blood_results_${new Date().toISOString().split('T')[0]}.json`;
            debugLink.click();
            console.log('✅ Debug file downloaded');

            if (results.length === 0) {
                setError('Nem találtunk vérvizsgálati eredményeket a feltöltött fájlokban.');
                setIsProcessing(false);
                return;
            }

            setProgress(`${results.length} vérvizsgálati eredmény sikeresen kibontva!`);

            // Step 3: Store in SessionStorage
            const bloodData = {
                results,
                processedAt: new Date().toISOString(),
                fileCount: files.length
            };
            sessionStorage.setItem('bloodResults', JSON.stringify(bloodData));

            // Step 4: Navigate to results page
            setTimeout(() => {
                window.location.hash = 'results';
            }, 1500);

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

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        );

        if (droppedFiles.length > 0) {
            setFiles(droppedFiles);
            setError('');
        } else {
            setError('Kérlek, csak PDF fájlokat húzz ide.');
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

                    <h1 className="upload-title">EESZT Fájlok Feltöltése</h1>
                    <p className="upload-description">
                        Válaszd ki a letöltött EESZT PDF fájlokat tartalmazó mappát.
                        A rendszer automatikusan egyesíti és feldolgozza őket.
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
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="application/pdf,.pdf"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            // @ts-ignore - webkitdirectory is not in the TS types
                            webkitdirectory=""
                            directory=""
                        />

                        {files.length === 0 ? (
                            <>
                                <svg className="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none">
                                    <path d="M7 18v-1a5 5 0 015-5v0a5 5 0 015 5v1M16 7l-4-4m0 0L8 7m4-4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <h3>Húzd ide a mappát vagy kattints a kiválasztáshoz</h3>
                                <p>PDF fájlok (akár egyszerre több is)</p>
                            </>
                        ) : (
                            <>
                                <svg className="check-icon" width="64" height="64" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <h3>{files.length} PDF fájl kiválasztva</h3>
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
