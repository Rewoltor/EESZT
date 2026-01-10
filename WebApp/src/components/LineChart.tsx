import type { BloodTestResult } from '../types/blood-results';

export function LineChart({ data }: { data: BloodTestResult[] }) {
    if (data.length === 0) return null;

    const values = data.map(d => parseFloat(d.result.replace(',', '.')));
    let validValues = values.filter(v => !isNaN(v));
    if (validValues.length === 0) return null;

    // ROBUST OUTLIER FILTERING
    if (validValues.length >= 3) {
        const sorted = [...validValues].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 3 * iqr;
        const upperBound = q3 + 3 * iqr;

        const filteredValues = validValues.filter(v => v >= lowerBound && v <= upperBound);
        if (filteredValues.length >= 2) {
            validValues = filteredValues;
        }
    }

    const hasValidDates = data.some(d => d.date);
    const minValue = Math.min(...validValues);
    const maxValue = Math.max(...validValues);
    const range = maxValue - minValue || 1;

    let refRangeMin: number | null = null;
    let refRangeMax: number | null = null;
    if (data[0].ref_min !== undefined) refRangeMin = data[0].ref_min;
    if (data[0].ref_max !== undefined) refRangeMax = data[0].ref_max;

    const meanValue = (minValue + maxValue) / 2;
    const proportionalPadding = range * 0.2;
    const minimumPadding = Math.max(meanValue * 0.05, range * 0.1);
    const padding = Math.max(proportionalPadding, minimumPadding);

    let chartMin = Math.max(0, minValue - padding);
    let chartMax = maxValue + padding;

    const width = 800;
    const height = 400;
    const marginLeft = 75; // Increased to prevent Y-axis label overlap
    const marginRight = 30;
    const marginTop = 30;
    const marginBottom = 90;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;

    // Ensure chart range encompasses reference limits so "safe zones" are visible
    if (refRangeMin !== null || refRangeMax !== null) {
        // Use a minimum padding to ensure the green zone isn't just a thin line at the edge
        const expansionPadding = Math.max(padding, (maxValue - minValue) * 0.15);

        if (refRangeMin !== null) {
            chartMin = Math.min(chartMin, Math.max(0, refRangeMin - expansionPadding));
            chartMax = Math.max(chartMax, refRangeMin + expansionPadding);
        }
        if (refRangeMax !== null) {
            chartMin = Math.min(chartMin, Math.max(0, refRangeMax - expansionPadding));
            chartMax = Math.max(chartMax, refRangeMax + expansionPadding);
        }
    }

    const chartRange = chartMax - chartMin;

    // If there's only one point, place it at 1/3 of the width instead of on the Y-axis
    const scaleX = (index: number) => {
        if (data.length === 1) return marginLeft + plotWidth / 3;
        return marginLeft + (index / (data.length - 1)) * plotWidth;
    };

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
                {(() => {
                    const plotTop = marginTop;
                    const plotBottom = height - marginBottom;
                    const refMaxY = refRangeMax !== null ? Math.max(plotTop, Math.min(plotBottom, scaleY(refRangeMax))) : null;
                    const refMinY = refRangeMin !== null ? Math.max(plotTop, Math.min(plotBottom, scaleY(refRangeMin))) : null;

                    // More subtle muted colors for zones to blend with dark theme
                    const successColor = "rgba(34, 197, 94, 0.1)"; // Very transparent green
                    const failureColor = "rgba(239, 68, 68, 0.15)"; // Very transparent red
                    const borderStroke = "rgba(148, 163, 184, 0.2)"; // Muted border

                    if (refMaxY !== null && refMinY !== null) {
                        return (
                            <>
                                {refMaxY > plotTop && <rect x={marginLeft} y={plotTop} width={plotWidth} height={refMaxY - plotTop} fill={failureColor} />}
                                {refMinY > refMaxY && <rect x={marginLeft} y={refMaxY} width={plotWidth} height={refMinY - refMaxY} fill={successColor} />}
                                {refMinY < plotBottom && <rect x={marginLeft} y={refMinY} width={plotWidth} height={plotBottom - refMinY} fill={failureColor} />}
                                {refRangeMax !== null && refRangeMax >= chartMin && refRangeMax <= chartMax && <line x1={marginLeft} y1={refMaxY} x2={width - marginRight} y2={refMaxY} stroke={borderStroke} strokeWidth="1" strokeDasharray="4 4" />}
                                {refRangeMin !== null && refRangeMin >= chartMin && refRangeMin <= chartMax && <line x1={marginLeft} y1={refMinY} x2={width - marginRight} y2={refMinY} stroke={borderStroke} strokeWidth="1" strokeDasharray="4 4" />}
                            </>
                        );
                    } else if (refMaxY !== null) {
                        return (
                            <>
                                {refMaxY < plotBottom && <rect x={marginLeft} y={refMaxY} width={plotWidth} height={plotBottom - refMaxY} fill={successColor} />}
                                {refMaxY > plotTop && <rect x={marginLeft} y={plotTop} width={plotWidth} height={refMaxY - plotTop} fill={failureColor} />}
                                {refRangeMax !== null && refRangeMax >= chartMin && refRangeMax <= chartMax && <line x1={marginLeft} y1={refMaxY} x2={width - marginRight} y2={refMaxY} stroke={borderStroke} strokeWidth="1" strokeDasharray="4 4" />}
                            </>
                        );
                    } else if (refMinY !== null) {
                        return (
                            <>
                                {refMinY > plotTop && <rect x={marginLeft} y={plotTop} width={plotWidth} height={refMinY - plotTop} fill={successColor} />}
                                {refMinY < plotBottom && <rect x={marginLeft} y={refMinY} width={plotWidth} height={plotBottom - refMinY} fill={failureColor} />}
                                {refRangeMin !== null && refRangeMin >= chartMin && refRangeMin <= chartMax && <line x1={marginLeft} y1={refMinY} x2={width - marginRight} y2={refMinY} stroke={borderStroke} strokeWidth="1" strokeDasharray="4 4" />}
                            </>
                        );
                    }
                    return null;
                })()}

                {Array.from({ length: yTicks + 1 }).map((_, i) => {
                    const y = scaleY(chartMin + i * yStep);
                    return <line key={i} x1={marginLeft} y1={y} x2={width - marginRight} y2={y} stroke="var(--color-border)" strokeWidth="1" opacity="0.3" />;
                })}

                <line x1={marginLeft} y1={marginTop} x2={marginLeft} y2={height - marginBottom} stroke="var(--color-text-muted)" strokeWidth="1" opacity="0.5" />
                <line x1={marginLeft} y1={height - marginBottom} x2={width - marginRight} y2={height - marginBottom} stroke="var(--color-text-muted)" strokeWidth="1" opacity="0.5" />

                {Array.from({ length: yTicks + 1 }).map((_, i) => {
                    const value = chartMin + i * yStep;
                    const y = scaleY(value);
                    const displayValue = value.toFixed(1).replace('.', ',');
                    return <text key={i} x={marginLeft - 10} y={y + 4} textAnchor="end" fill="var(--color-text-secondary)" fontSize="12" style={{ opacity: 0.7 }}>{displayValue}</text>;
                })}

                {data.map((_, i) => {
                    const x = scaleX(i);
                    return <line key={`tick-${i}`} x1={x} y1={height - marginBottom} x2={x} y2={height - marginBottom + 6} stroke="var(--color-text-muted)" strokeWidth="1" />;
                })}

                {data.map((d, i) => {
                    const x = scaleX(i);
                    const label = hasValidDates && d.date ? formatDate(d.date) : `#${i + 1}`;
                    return <text key={i} x={x} y={height - marginBottom + 15} textAnchor="end" fill="var(--color-text-secondary)" fontSize="11" transform={`rotate(-45, ${x}, ${height - marginBottom + 8})`} style={{ opacity: 0.7 }}>{label}</text>;
                })}

                {data.map((d, i) => {
                    if (i === 0) return null;
                    const prevValue = parseFloat(data[i - 1].result.replace(',', '.'));
                    const currValue = parseFloat(d.result.replace(',', '.'));
                    if (isNaN(prevValue) || isNaN(currValue)) return null;
                    return <line key={`line-${i}`} x1={scaleX(i - 1)} y1={scaleY(prevValue)} x2={scaleX(i)} y2={scaleY(currValue)} stroke="var(--color-accent-primary)" strokeWidth="2.5" strokeLinecap="round" />;
                })}

                {data.map((d, i) => {
                    const value = parseFloat(d.result.replace(',', '.'));
                    if (isNaN(value)) return null;
                    const cx = scaleX(i);
                    const cy = scaleY(value);
                    return (
                        <g key={i} className="data-point-group">
                            <circle cx={cx} cy={cy} r="15" fill="transparent" stroke="transparent" style={{ cursor: 'pointer' }} />
                            <circle cx={cx} cy={cy} r="5" fill="var(--color-accent-primary)" stroke="var(--color-bg-primary)" strokeWidth="2" className="data-point" style={{ cursor: 'pointer' }} />
                            <text x={cx} y={cy - 20} textAnchor="middle" fill="var(--color-text-primary)" fontSize="12" fontWeight="600" className="tooltip-text" style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s' }}>{d.result} {d.unit}</text>
                            <rect x={cx - 35} y={cy - 35} width="70" height="22" rx="4" fill="var(--color-bg-card)" stroke="var(--color-border)" className="tooltip-bg" style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s' }} />
                        </g>
                    );
                })}

                <text x={width / 2} y={height - 2} textAnchor="middle" fill="var(--color-text-secondary)" fontSize="13" fontWeight="500">{hasValidDates ? 'Dátum' : 'Mérés sorszáma'}</text>
                <text x={15} y={height / 2} textAnchor="middle" fill="var(--color-text-secondary)" fontSize="13" fontWeight="500" transform={`rotate(-90, 15, ${height / 2})`}>{data[0]?.unit || 'Érték'}</text>
            </svg>
        </div>
    );
}
