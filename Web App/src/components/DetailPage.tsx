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
                            <div className="value-reference">Referencia: {latestResult.ref_range} {latestResult.unit}</div>
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
    const validValues = values.filter(v => !isNaN(v));
    if (validValues.length === 0) return null;

    const hasValidDates = data.some(d => d.date);
    const minValue = Math.min(...validValues);
    const maxValue = Math.max(...validValues);
    const range = maxValue - minValue || 1;
    const padding = range * 0.1;
    const chartMin = minValue - padding;
    const chartMax = maxValue + padding;
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

    let refRangeMin: number | null = null;
    let refRangeMax: number | null = null;
    if (data[0].ref_min !== undefined) refRangeMin = data[0].ref_min;
    if (data[0].ref_max !== undefined) refRangeMax = data[0].ref_max;

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
                {refRangeMin !== null && refRangeMax !== null ? (
                    <>
                        {/* Red zone ABOVE max - More visible */}
                        <rect x={marginLeft} y={marginTop} width={plotWidth} height={scaleY(refRangeMax) - marginTop} fill="rgba(239, 68, 68, 0.3)" />
                        {/* Green zone (safe range) - More visible */}
                        <rect x={marginLeft} y={scaleY(refRangeMax)} width={plotWidth} height={scaleY(refRangeMin) - scaleY(refRangeMax)} fill="rgba(34, 197, 94, 0.25)" />
                        {/* Red zone BELOW min - More visible */}
                        <rect x={marginLeft} y={scaleY(refRangeMin)} width={plotWidth} height={height - marginBottom - scaleY(refRangeMin)} fill="rgba(239, 68, 68, 0.3)" />
                        {/* Border lines */}
                        <line x1={marginLeft} y1={scaleY(refRangeMax)} x2={width - marginRight} y2={scaleY(refRangeMax)} stroke="rgba(34, 197, 94, 0.7)" strokeWidth="2" strokeDasharray="6 4" />
                        <line x1={marginLeft} y1={scaleY(refRangeMin)} x2={width - marginRight} y2={scaleY(refRangeMin)} stroke="rgba(34, 197, 94, 0.7)" strokeWidth="2" strokeDasharray="6 4" />
                    </>
                ) : refRangeMax !== null ? (
                    <>
                        <rect x={marginLeft} y={scaleY(refRangeMax)} width={plotWidth} height={height - marginBottom - scaleY(refRangeMax)} fill="rgba(34, 197, 94, 0.25)" />
                        <rect x={marginLeft} y={marginTop} width={plotWidth} height={scaleY(refRangeMax) - marginTop} fill="rgba(239, 68, 68, 0.3)" />
                        <line x1={marginLeft} y1={scaleY(refRangeMax)} x2={width - marginRight} y2={scaleY(refRangeMax)} stroke="rgba(34, 197, 94, 0.7)" strokeWidth="2" strokeDasharray="6 4" />
                    </>
                ) : refRangeMin !== null ? (
                    <>
                        <rect x={marginLeft} y={marginTop} width={plotWidth} height={scaleY(refRangeMin) - marginTop} fill="rgba(34, 197, 94, 0.25)" />
                        <rect x={marginLeft} y={scaleY(refRangeMin)} width={plotWidth} height={height - marginBottom - scaleY(refRangeMin)} fill="rgba(239, 68, 68, 0.3)" />
                        <line x1={marginLeft} y1={scaleY(refRangeMin)} x2={width - marginRight} y2={scaleY(refRangeMin)} stroke="rgba(34, 197, 94, 0.7)" strokeWidth="2" strokeDasharray="6 4" />
                    </>
                ) : null}

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
                    return <text key={i} x={marginLeft - 10} y={y + 4} textAnchor="end" fill="rgba(255, 255, 255, 0.7)" fontSize="12">{value.toFixed(1)}</text>;
                })}

                {/* X labels */}
                {data.map((d, i) => {
                    const x = scaleX(i);
                    const label = hasValidDates && d.date ? formatDate(d.date) : `#${i + 1}`;
                    return <text key={i} x={x} y={height - marginBottom + 20} textAnchor="end" fill="rgba(255, 255, 255, 0.7)" fontSize="11" transform={`rotate(-45, ${x}, ${height - marginBottom + 20})`}>{label}</text>;
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

function checkIfOutOfRange(result: BloodTestResult): boolean {
    if (!result.ref_min && !result.ref_max) return false;
    const value = parseFloat(result.result.replace(',', '.'));
    if (isNaN(value)) return false;
    if (result.ref_min !== undefined && value < result.ref_min) return true;
    if (result.ref_max !== undefined && value > result.ref_max) return true;
    return false;
}
