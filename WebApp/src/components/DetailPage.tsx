import { useState, useEffect } from 'react';
import type { BloodTestResult } from '../types/blood-results';
import { LineChart } from './LineChart';
import './DetailPage.css';

interface BloodData {
    results: BloodTestResult[];
    processedAt: string;
    fileCount: number;
}

export default function DetailPage({ testName }: { testName: string }) {
    const [bloodData, setBloodData] = useState<BloodData | null>(null);
    const [historicalData, setHistoricalData] = useState<BloodTestResult[]>([]);

    useEffect(() => {
        const storedData = sessionStorage.getItem('bloodResults');
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                setBloodData(parsed);

                const decodedName = decodeURIComponent(testName);
                let testResults = parsed.results.filter(
                    (r: BloodTestResult) => r.test_name === decodedName
                );

                // Deduplicate by date
                const seenDates = new Map<string, BloodTestResult>();
                for (const result of testResults) {
                    const dateKey = result.date || `unknown-${Math.random()}`;
                    if (!seenDates.has(dateKey)) {
                        seenDates.set(dateKey, result);
                    }
                }
                testResults = Array.from(seenDates.values());

                // Sort chronologically
                const sortedResults = testResults.sort((a: BloodTestResult, b: BloodTestResult) => {
                    if (!a.date || !b.date) return 0;
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                });

                setHistoricalData(sortedResults);
            } catch (error) {
                console.error('Error parsing stored data:', error);
            }
        }
    }, [testName]);

    if (!bloodData || historicalData.length === 0) {
        return (
            <div className="detail-page">
                <div className="container">
                    <div className="no-data">
                        <h2>Nincs Adat</h2>
                        <p>Nem található longitudinális adat ehhez a vizsgálathoz.</p>
                        <a href="#results" className="btn btn-primary">Vissza az Eredményekhez</a>
                    </div>
                </div>
            </div>
        );
    }

    const decodedTestName = decodeURIComponent(testName);
    const latestResult = historicalData[historicalData.length - 1];
    const isOutOfRange = checkIfOutOfRange(latestResult);

    return (
        <div className="detail-page">
            <div className="container">
                <div className="detail-header">
                    <a href="#results" className="back-link">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 13L7 10M7 10L10 7M7 10L13 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Vissza az Eredményekhez
                    </a>

                    <h1 className="detail-title">{decodedTestName}</h1>

                    <div className={`value-card glass ${isOutOfRange || latestResult.flag ? 'out-of-range' : ''}`}>
                        <div className="value-label">Legutóbbi Érték</div>
                        <div className="value-number">{latestResult.result} {latestResult.unit}</div>
                        {latestResult.ref_range && (
                            <div className="value-reference">Referencia: {formatRefRange(latestResult.ref_range, latestResult.unit)}</div>
                        )}
                        {(isOutOfRange || latestResult.flag) && (
                            <div className="value-warning">
                                {latestResult.flag ? (
                                    <span className="flag-badge">{latestResult.flag}</span>
                                ) : (
                                    <span className="flag-badge warning">⚠ Tartományon kívül</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="timeline-section">
                    <h2 className="section-title">
                        Longitudinális Adatok
                        <span className="data-count">({historicalData.length} mérés)</span>
                    </h2>

                    {historicalData.length === 1 ? (
                        <div className="single-entry-message glass">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p>Csak egy mérés áll rendelkezésre ehhez a vizsgálathoz. A trend megjelenítéséhez több mérésre van szükség.</p>
                        </div>
                    ) : (
                        <>
                            <div className="chart-container glass">
                                <LineChart data={historicalData} />
                            </div>

                            <div className="data-points-table glass">
                                <h3>Mérési Pontok</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Dátum</th>
                                            <th>Érték</th>
                                            <th>Mértékegység</th>
                                            <th>Referencia</th>
                                            <th>Jelölés</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historicalData.map((entry, index) => {
                                            const entryOutOfRange = checkIfOutOfRange(entry);
                                            return (
                                                <tr key={index} className={entryOutOfRange || entry.flag ? 'flagged' : ''}>
                                                    <td>{index + 1}</td>
                                                    <td>{entry.date || '—'}</td>
                                                    <td className="value">{entry.result}</td>
                                                    <td>{entry.unit}</td>
                                                    <td>{entry.ref_range || '—'}</td>
                                                    <td>
                                                        {entry.flag && <span className="flag-badge">{entry.flag}</span>}
                                                        {entryOutOfRange && !entry.flag && <span className="flag-badge warning">⚠</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="statistics">
                                <div className="stat-card glass">
                                    <div className="stat-label">Legalacsonyabb</div>
                                    <div className="stat-value">
                                        {Math.min(...historicalData.map(e => parseFloat(e.result.replace(',', '.')))).toFixed(2)} {latestResult.unit}
                                    </div>
                                </div>
                                <div className="stat-card glass">
                                    <div className="stat-label">Legmagasabb</div>
                                    <div className="stat-value">
                                        {Math.max(...historicalData.map(e => parseFloat(e.result.replace(',', '.')))).toFixed(2)} {latestResult.unit}
                                    </div>
                                </div>
                                <div className="stat-card glass">
                                    <div className="stat-label">Átlag</div>
                                    <div className="stat-value">
                                        {(historicalData.reduce((sum, e) => sum + parseFloat(e.result.replace(',', '.')), 0) / historicalData.length).toFixed(2)} {latestResult.unit}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}



/**
 * Format reference range for display without duplicate units
 * Ensures Hungarian decimal format (commas)
 */
function formatRefRange(refRange: string, unit: string): string {
    if (!refRange) return '';

    // Convert dots to commas for Hungarian format
    let formatted = refRange.replace(/\./g, ',');

    // If ref_range already contains the unit, don't append it again
    if (formatted.includes(unit)) {
        return formatted;
    }

    // Otherwise append unit
    return `${formatted} ${unit}`;
}

function checkIfOutOfRange(result: BloodTestResult): boolean {
    if (!result.ref_min && !result.ref_max) return false;
    const value = parseFloat(result.result.replace(',', '.'));
    if (isNaN(value)) return false;
    if (result.ref_min !== undefined && value < result.ref_min) return true;
    if (result.ref_max !== undefined && value > result.ref_max) return true;
    return false;
}
