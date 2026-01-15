import { useState, useEffect } from 'react';
import type { BloodTestResult } from '../types/blood-results';
import { LineChart } from './LineChart';
import { UnifiedHeader } from './UnifiedHeader';
import { storage } from '../lib/storage';
import type { StoredBloodData } from '../lib/storage';

export default function ResultsPage() {
    const [bloodData, setBloodData] = useState<StoredBloodData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'result'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [filterFlag, setFilterFlag] = useState<'all' | 'flagged'>('all');
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await storage.getBloodResults();
                if (data) {
                    setBloodData(data);
                }
            } catch (error) {
                console.error('Error loading data from storage:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleExitClick = () => {
        setIsExitModalOpen(true);
    };

    const confirmExit = async () => {
        await storage.clear();
        setBloodData(null);
        setIsExitModalOpen(false);
        window.location.hash = 'home';
    };

    const cancelExit = () => {
        setIsExitModalOpen(false);
    };


    const handleExportCSV = () => {
        if (!bloodData) return;

        const headers = ['Vizsgálat Neve', 'Eredmény', 'Mértékegység', 'Referencia Tartomány', 'Jelölés'];
        // Use displayResults - ensuring export matches the displayed table (latest values)
        const rows = displayResults.map(result => [
            result.test_name,
            result.result,
            result.unit || '',
            result.ref_range || '',
            result.flag || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `eeszt_vereredmenyek_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (isLoading) {
        return (
            <div className="results-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Adatok betöltése...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!bloodData) {
        return (
            <div className="results-page">
                <div className="container">
                    <div className="no-data">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <h2>Nincs Megjeleníthető Eredmény</h2>
                        <p>Kérlek, először töltsd fel az EESZT fájlokat a feldolgozáshoz.</p>
                        <a href="#upload" className="btn btn-primary">
                            Fájlok Feltöltése
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // 1. Group by test name and find the latest result for each test
    // This ensures we only look at the most recent measurement for status colors
    const latestResultsMap = new Map<string, BloodTestResult>();
    for (const result of bloodData.results) {
        const existing = latestResultsMap.get(result.test_name);
        if (!existing) {
            latestResultsMap.set(result.test_name, result);
        } else {
            // Compare dates to find the latest
            const existingDate = existing.date ? new Date(existing.date).getTime() : 0;
            const newDate = result.date ? new Date(result.date).getTime() : 0;

            if (newDate > existingDate) {
                latestResultsMap.set(result.test_name, result);
            }
        }
    }
    const latestResults = Array.from(latestResultsMap.values());

    // 2. Filter and sort the latest results
    const displayResults = latestResults
        .filter(result => {
            // Only show results with numeric values
            if (!result.result) return false;
            const numericValue = parseFloat(result.result.replace(',', '.'));
            if (isNaN(numericValue)) {
                return false;
            }

            // Search filter
            if (searchTerm && !result.test_name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            // Flag filter
            if (filterFlag === 'flagged' && !result.flag && !checkIfOutOfRange(result)) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            // First, prioritize out-of-range values
            const aOutOfRange = checkIfOutOfRange(a) || a.flag;
            const bOutOfRange = checkIfOutOfRange(b) || b.flag;

            if (aOutOfRange && !bOutOfRange) return -1;
            if (!aOutOfRange && bOutOfRange) return 1;

            // Then apply the selected sorting
            let comparison = 0;
            if (sortBy === 'name') {
                comparison = a.test_name.localeCompare(b.test_name, 'hu');
            } else {
                const aVal = parseFloat(a.result.replace(',', '.'));
                const bVal = parseFloat(b.result.replace(',', '.'));
                if (!isNaN(aVal) && !isNaN(bVal)) {
                    comparison = aVal - bVal;
                } else {
                    comparison = a.result.localeCompare(b.result, 'hu');
                }
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    // Helper to determine if a result is truly out of range
    // Prioritize calculated status for numeric values to fix potential data flag errors (like HDL)
    const isEffectiveOutOfRange = (result: BloodTestResult) => {
        const isNumeric = !isNaN(parseFloat(result.result.replace(',', '.')));
        if (isNumeric) {
            return checkIfOutOfRange(result);
        }
        return !!result.flag || checkIfOutOfRange(result);
    };

    const abnormalResults = displayResults.filter(r => isEffectiveOutOfRange(r));
    const normalResults = displayResults.filter(r => !isEffectiveOutOfRange(r));

    const processedDate = new Date(bloodData.processedAt).toLocaleString('hu-HU');

    return (
        <div className="results-page">
            {/* Unified Header */}
            <UnifiedHeader
                currentView="results"
                onExport={handleExportCSV}
                onDelete={handleExitClick}
            />

            <div className="container">
                {/* Page Meta */}
                <div className="results-meta-section">
                    <h1 className="results-title">Vérvizsgálati Eredmények</h1>
                    <p className="results-meta">
                        {bloodData.results.length} eredmény • {bloodData.fileCount} fájl feldolgozva • {processedDate}
                    </p>
                </div>

                {/* Controls */}
                <div className="results-controls glass">
                    <div className="search-box">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Keresés vizsgálat neve alapján..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm('')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="filter-controls">
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'result')}>
                            <option value="name">Név szerint rendezés</option>
                            <option value="result">Érték szerint rendezés</option>
                        </select>

                        <button
                            className="sort-order-btn"
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            title={sortOrder === 'asc' ? 'Növekvő' : 'Csökkenő'}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                {sortOrder === 'asc' ? (
                                    <path d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                ) : (
                                    <path d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                )}
                            </svg>
                        </button>

                        <select value={filterFlag} onChange={(e) => setFilterFlag(e.target.value as 'all' | 'flagged')}>
                            <option value="all">Összes eredmény</option>
                            <option value="flagged">Csak jelölt értékek</option>
                        </select>
                    </div>
                </div>

                {/* Abnormal Results Section */}
                {abnormalResults.length > 0 && (
                    <div className="abnormal-section">
                        <h2 className="section-title-start">Figyelmet Igénylő Eredmények ({abnormalResults.length})</h2>
                        <div className="abnormal-grid">
                            {abnormalResults.map((result, index) => {
                                const history = getTestHistory(result.test_name, bloodData.results);
                                return (
                                    <div key={index} className="abnormal-card glass">
                                        <div className="abnormal-header">
                                            <div className="abnormal-info">
                                                <h3>{result.test_name}</h3>
                                                <div className="abnormal-value">
                                                    {result.result} <span className="unit">{result.unit}</span>
                                                </div>
                                                <div className="abnormal-ref">
                                                    Referencia: {result.ref_range}
                                                </div>
                                            </div>
                                            <div className="abnormal-action">
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => window.location.hash = `detail/${encodeURIComponent(result.test_name)}`}
                                                >
                                                    Részletek
                                                </button>
                                            </div>
                                        </div>
                                        <div className="abnormal-chart">
                                            <LineChart data={history} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Normal Results Table */}
                {normalResults.length > 0 && (
                    <div className="results-table-container">
                        <h3 className="table-section-title">További Eredmények</h3>
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>Vizsgálat Neve</th>
                                    <th>Legutóbbi Érték</th>
                                    <th>Mértékegység</th>
                                    <th>Referencia Tartomány</th>
                                </tr>
                            </thead>
                            <tbody>
                                {normalResults.map((result, index) => (
                                    <tr
                                        key={index}
                                        className="clickable-row"
                                        onClick={() => {
                                            window.location.hash = `detail/${encodeURIComponent(result.test_name)}`;
                                        }}
                                        title="Kattints a részletekért"
                                    >
                                        <td className="test-name">
                                            {result.test_name}
                                            <svg className="row-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </td>
                                        <td className="result-value">{result.result}</td>
                                        <td className="unit">{result.unit || '—'}</td>
                                        <td className="ref-range">{result.ref_range || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {displayResults.length === 0 && (
                    <div className="no-results">
                        <p>Nincs találat a keresési feltételeknek megfelelően.</p>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {isExitModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass">
                        <h3>Biztosan kilépsz?</h3>
                        <p>
                            Ez a művelet <strong>törli az összes beszélgetést és a feltöltött adatokat</strong> a jelenlegi munkamenetből.
                            <br />Az adatok véglegesen elvesznek.
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={cancelExit}>
                                Mégse
                            </button>
                            <button className="btn btn-danger" onClick={confirmExit}>
                                Kilépés és Törlés
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function checkIfOutOfRange(result: BloodTestResult): boolean {
    if (result.ref_min == null && result.ref_max == null) return false;

    const value = parseFloat(result.result.replace(',', '.'));
    if (isNaN(value)) return false;

    // Check strict inequality with explicit null check to avoid 'null being treated as 0'
    if (result.ref_min != null && value < result.ref_min) return true;
    if (result.ref_max != null && value > result.ref_max) return true;

    return false;
}

function getTestHistory(testName: string, allResults: BloodTestResult[]): BloodTestResult[] {
    return allResults
        .filter(r => r.test_name === testName)
        .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateA - dateB;
        });
}
