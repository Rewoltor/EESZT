import { useState, useEffect } from 'react';
import type { BloodTestResult } from '../types/blood-results';
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

function LineChart({ data }: { data: BloodTestResult[] }) {
    if (data.length === 0) return null;

    const values = data.map(d => parseFloat(d.result.replace(',', '.')));
    let validValues = values.filter(v => !isNaN(v));
    if (validValues.length === 0) return null;

    // ROBUST OUTLIER FILTERING: Remove extreme outliers that would destroy chart scale
    // This handles cases where different test types were incorrectly merged
    if (validValues.length >= 3) {
        const sorted = [...validValues].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 3 * iqr; // 3x IQR for outliers
        const upperBound = q3 + 3 * iqr;

        const filteredValues = validValues.filter(v => v >= lowerBound && v <= upperBound);
        // Only filter if we have enough remaining data points
        if (filteredValues.length >= 2) {
            validValues = filteredValues;
        }
    }

    const hasValidDates = data.some(d => d.date);
    const minValue = Math.min(...validValues);
    const maxValue = Math.max(...validValues);
    const range = maxValue - minValue || 1;

    // Get reference ranges EARLY to include them in chart scaling
    let refRangeMin: number | null = null;
    let refRangeMax: number | null = null;
    if (data[0].ref_min !== undefined) refRangeMin = data[0].ref_min;
    if (data[0].ref_max !== undefined) refRangeMax = data[0].ref_max;

    // Smart padding: ensure minimum padding for narrow ranges
    // Use 20% of range, but at least 5% of the mean value to prevent clipping
    const meanValue = (minValue + maxValue) / 2;
    const proportionalPadding = range * 0.2;
    const minimumPadding = Math.max(meanValue * 0.05, range * 0.1);
    const padding = Math.max(proportionalPadding, minimumPadding);

    // Calculate initial bounds
    let chartMin = Math.max(0, minValue - padding);
    let chartMax = maxValue + padding;

    // IMPORTANT: Expand chart to include reference ranges for visual context
    // This ensures users can always see where the danger zones are
    if (refRangeMin !== null || refRangeMax !== null) {
        // Add extra padding beyond reference ranges so they're clearly visible
        const refPadding = padding * 0.3; // 30% of the data padding

        if (refRangeMin !== null) {
            // Extend chart to show below the minimum reference value
            chartMin = Math.min(chartMin, Math.max(0, refRangeMin - refPadding));
        }

        if (refRangeMax !== null) {
            // Extend chart to show above the maximum reference value
            chartMax = Math.max(chartMax, refRangeMax + refPadding);
        }
    }

    const chartRange = chartMax - chartMin;

    const width = 800;
    const height = 400;
    const marginLeft = 60;
    const marginRight = 40;
    const marginTop = 40;
    const marginBottom = 100;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;

    const scaleX = (index: number) => marginLeft + (index / (data.length - 1 || 1)) * plotWidth;
    const scaleY = (value: number) => marginTop + plotHeight - ((value - chartMin) / chartRange) * plotHeight;

    const yTicks = 5;
    const yStep = chartRange / yTicks;

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return '';
        }
    };

    return (
        <div className="line-chart">
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                {/* VISIBLE BACKGROUND ZONES - Red and Green */}
                {(() => {
                    // Clamp reference range Y coordinates to visible plot area
                    const plotTop = marginTop;
                    const plotBottom = height - marginBottom;

                    // Calculate Y positions, clamped to plot boundaries
                    const refMaxY = refRangeMax !== null ? Math.max(plotTop, Math.min(plotBottom, scaleY(refRangeMax))) : null;
                    const refMinY = refRangeMin !== null ? Math.max(plotTop, Math.min(plotBottom, scaleY(refRangeMin))) : null;

                    if (refMaxY !== null && refMinY !== null) {
                        // Both min and max defined
                        return (
                            <>
                                {/* Red zone ABOVE max */}
                                {refMaxY > plotTop && (
                                    <rect x={marginLeft} y={plotTop} width={plotWidth} height={refMaxY - plotTop} fill="rgba(239, 68, 68, 0.3)" />
                                )}
                                {/* Green zone (safe range) */}
                                {refMinY > refMaxY && (
                                    <rect x={marginLeft} y={refMaxY} width={plotWidth} height={refMinY - refMaxY} fill="rgba(34, 197, 94, 0.25)" />
                                )}
                                {/* Red zone BELOW min */}
                                {refMinY < plotBottom && (
                                    <rect x={marginLeft} y={refMinY} width={plotWidth} height={plotBottom - refMinY} fill="rgba(239, 68, 68, 0.3)" />
                                )}
                                {/* Border lines */}
                                {refRangeMax !== null && refRangeMax >= chartMin && refRangeMax <= chartMax && (
                                    <line x1={marginLeft} y1={refMaxY} x2={width - marginRight} y2={refMaxY} stroke="rgba(34, 197, 94, 0.7)" strokeWidth="2" strokeDasharray="6 4" />
                                )}
                                {refRangeMin !== null && refRangeMin >= chartMin && refRangeMin <= chartMax && (
                                    <line x1={marginLeft} y1={refMinY} x2={width - marginRight} y2={refMinY} stroke="rgba(34, 197, 94, 0.7)" strokeWidth="2" strokeDasharray="6 4" />
                                )}
                            </>
                        );
                    } else if (refMaxY !== null) {
                        // Only max defined (values below max are safe)
                        return (
                            <>
                                {/* Green zone BELOW max */}
                                {refMaxY < plotBottom && (
                                    <rect x={marginLeft} y={refMaxY} width={plotWidth} height={plotBottom - refMaxY} fill="rgba(34, 197, 94, 0.25)" />
                                )}
                                {/* Red zone ABOVE max */}
                                {refMaxY > plotTop && (
                                    <rect x={marginLeft} y={plotTop} width={plotWidth} height={refMaxY - plotTop} fill="rgba(239, 68, 68, 0.3)" />
                                )}
                                {/* Border line */}
                                {refRangeMax !== null && refRangeMax >= chartMin && refRangeMax <= chartMax && (
                                    <line x1={marginLeft} y1={refMaxY} x2={width - marginRight} y2={refMaxY} stroke="rgba(34, 197, 94, 0.7)" strokeWidth="2" strokeDasharray="6 4" />
                                )}
                            </>
                        );
                    } else if (refMinY !== null) {
                        // Only min defined (values above min are safe)
                        return (
                            <>
                                {/* Green zone ABOVE min */}
                                {refMinY > plotTop && (
                                    <rect x={marginLeft} y={plotTop} width={plotWidth} height={refMinY - plotTop} fill="rgba(34, 197, 94, 0.25)" />
                                )}
                                {/* Red zone BELOW min */}
                                {refMinY < plotBottom && (
                                    <rect x={marginLeft} y={refMinY} width={plotWidth} height={plotBottom - refMinY} fill="rgba(239, 68, 68, 0.3)" />
                                )}
                                {/* Border line */}
                                {refRangeMin !== null && refRangeMin >= chartMin && refRangeMin <= chartMax && (
                                    <line x1={marginLeft} y1={refMinY} x2={width - marginRight} y2={refMinY} stroke="rgba(34, 197, 94, 0.7)" strokeWidth="2" strokeDasharray="6 4" />
                                )}
                            </>
                        );
                    }
                    return null;
                })()}

                {/* Grid */}
                {Array.from({ length: yTicks + 1 }).map((_, i) => {
                    const y = scaleY(chartMin + i * yStep);
                    return <line key={i} x1={marginLeft} y1={y} x2={width - marginRight} y2={y} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />;
                })}

                {/* Axes */}
                <line x1={marginLeft} y1={marginTop} x2={marginLeft} y2={height - marginBottom} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />
                <line x1={marginLeft} y1={height - marginBottom} x2={width - marginRight} y2={height - marginBottom} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />

                {/* Y labels */}
                {Array.from({ length: yTicks + 1 }).map((_, i) => {
                    const value = chartMin + i * yStep;
                    const y = scaleY(value);
                    // Use Hungarian decimal format (comma) for display
                    const displayValue = value.toFixed(1).replace('.', ',');
                    return <text key={i} x={marginLeft - 10} y={y + 4} textAnchor="end" fill="rgba(255, 255, 255, 0.7)" fontSize="12">{displayValue}</text>;
                })}

                {/* X-axis tick marks */}
                {data.map((_, i) => {
                    const x = scaleX(i);
                    return <line key={`tick-${i}`} x1={x} y1={height - marginBottom} x2={x} y2={height - marginBottom + 6} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />;
                })}

                {/* X labels */}
                {data.map((d, i) => {
                    const x = scaleX(i);
                    const label = hasValidDates && d.date ? formatDate(d.date) : `#${i + 1}`;
                    // Position label at tick, rotate around point slightly below and to the left
                    return <text key={i} x={x - 2} y={height - marginBottom + 12} textAnchor="end" fill="rgba(255, 255, 255, 0.7)" fontSize="11" transform={`rotate(-45, ${x - 2}, ${height - marginBottom + 12})`}>{label}</text>;
                })}

                {/* LINE SEGMENTS - Single cyan color */}
                {data.map((d, i) => {
                    if (i === 0) return null;
                    const prevValue = parseFloat(data[i - 1].result.replace(',', '.'));
                    const currValue = parseFloat(d.result.replace(',', '.'));
                    if (isNaN(prevValue) || isNaN(currValue)) return null;

                    return <line key={`line-${i}`} x1={scaleX(i - 1)} y1={scaleY(prevValue)} x2={scaleX(i)} y2={scaleY(currValue)} stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />;
                })}

                {/* DATA POINTS - Single cyan color with enhanced hover */}
                {data.map((d, i) => {
                    const value = parseFloat(d.result.replace(',', '.'));
                    if (isNaN(value)) return null;
                    const cx = scaleX(i);
                    const cy = scaleY(value);

                    return (
                        <g key={i} className="data-point-group">
                            {/* Larger invisible hover area */}
                            <circle
                                cx={cx}
                                cy={cy}
                                r="15"
                                fill="transparent"
                                stroke="transparent"
                                style={{ cursor: 'pointer' }}
                            />
                            {/* Visible point */}
                            <circle
                                cx={cx}
                                cy={cy}
                                r="6"
                                fill="#06b6d4"
                                stroke="var(--color-bg-primary)"
                                strokeWidth="2"
                                className="data-point"
                                style={{ cursor: 'pointer' }}
                            />
                            {/* Tooltip text - appears on hover */}
                            <text
                                x={cx}
                                y={cy - 20}
                                textAnchor="middle"
                                fill="white"
                                fontSize="12"
                                fontWeight="600"
                                className="tooltip-text"
                                style={{
                                    opacity: 0,
                                    pointerEvents: 'none',
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                {d.result} {d.unit}
                            </text>
                            {/* Tooltip background */}
                            <rect
                                x={cx - 35}
                                y={cy - 35}
                                width="70"
                                height="22"
                                rx="4"
                                fill="rgba(0, 0, 0, 0.8)"
                                className="tooltip-bg"
                                style={{
                                    opacity: 0,
                                    pointerEvents: 'none',
                                    transition: 'opacity 0.2s'
                                }}
                            />
                        </g>
                    );
                })}

                {/* Axis titles */}
                <text x={width / 2} y={height - 5} textAnchor="middle" fill="rgba(255, 255, 255, 0.7)" fontSize="14" fontWeight="600">{hasValidDates ? 'Dátum' : 'Mérés sorszáma'}</text>
                <text x={15} y={height / 2} textAnchor="middle" fill="rgba(255, 255, 255, 0.7)" fontSize="14" fontWeight="600" transform={`rotate(-90, 15, ${height / 2})`}>{data[0]?.unit || 'Érték'}</text>
            </svg>
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
