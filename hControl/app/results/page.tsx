'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid, ReferenceArea, ReferenceLine } from 'recharts';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { storage } from '@/lib/storage';
import type { BloodTestResult, GroupedBloodResults } from '@/types/blood-results';

export default function ResultsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [results, setResults] = useState<BloodTestResult[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAbnormal, setFilterAbnormal] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const data = await storage.getBloodResults();
            if (!data) {
                router.push('/');
                return;
            }
            setResults(data.results);
            setIsLoading(false);
        };
        loadData();
    }, [router]);

    // Group results by test name, get latest value
    const groupedResults = useMemo(() => {
        const grouped: GroupedBloodResults = {};

        results.forEach((result) => {
            if (!grouped[result.testName]) {
                grouped[result.testName] = [];
            }
            grouped[result.testName].push(result);
        });

        // Sort each group by date (newest first)
        Object.keys(grouped).forEach((testName) => {
            grouped[testName].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        });

        return grouped;
    }, [results]);

    // Get summary for each test (latest value, abnormal status)
    const testSummaries = useMemo(() => {
        return Object.entries(groupedResults).map(([testName, testResults]) => {
            const latest = testResults[0];
            const isAbnormal =
                (latest.ref_min !== undefined && latest.value < latest.ref_min) ||
                (latest.ref_max !== undefined && latest.value > latest.ref_max);

            return {
                testName,
                latestValue: latest.value,
                unit: latest.unit,
                date: latest.date,
                ref_range: latest.ref_range,
                ref_min: latest.ref_min,
                ref_max: latest.ref_max,
                isAbnormal,
                count: testResults.length,
            };
        });
    }, [groupedResults]);

    // Filter and search
    const filteredSummaries = useMemo(() => {
        return testSummaries.filter((summary) => {
            const matchesSearch = summary.testName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = !filterAbnormal || summary.isAbnormal;
            return matchesSearch && matchesFilter;
        });
    }, [testSummaries, searchTerm, filterAbnormal]);

    if (isLoading) {
        return <Loading fullScreen text="Eredmények betöltése..." />;
    }

    // Get last test date
    const lastTestDate = results.length > 0
        ? new Date(Math.max(...results.map((r) => new Date(r.date).getTime())))
        : null;

    const abnormalCount = testSummaries.filter((s) => s.isAbnormal).length;

    return (
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Vérvizsgálati Eredmények
                            </h1>
                            {lastTestDate && (
                                <p className="text-gray-600 dark:text-gray-400">
                                    Legutóbbi vizsgálat: {lastTestDate.toLocaleDateString('hu-HU', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            )}
                        </div>

                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card padding="sm">
                            <div className="text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    Összes teszt
                                </p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {testSummaries.length}
                                </p>
                            </div>
                        </Card>
                        <Card padding="sm">
                            <div className="text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    Mérések összesen
                                </p>
                                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                                    {results.length}
                                </p>
                            </div>
                        </Card>
                        <Card padding="sm">
                            <div className="text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    Referencia tartományon kívül
                                </p>
                                <p className={`text-3xl font-bold ${abnormalCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {abnormalCount}
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>


                {/* Abnormal Results Charts */}
                {abnormalCount > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Figyelmet igénylő eredmények
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {testSummaries
                                .filter(s => s.isAbnormal)
                                .map(summary => {
                                    const history = [...groupedResults[summary.testName]]
                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                        .map(r => ({
                                            value: r.value,
                                            date: new Date(r.date).toLocaleDateString('hu-HU')
                                        }));

                                    const sanitizedId = summary.testName.replace(/[^a-zA-Z0-9]/g, '');
                                    const hasRefRange = summary.ref_min !== undefined && summary.ref_max !== undefined;

                                    // Calculate domain to include reference values
                                    const allValues = history.map(h => h.value);
                                    if (summary.ref_min !== undefined) allValues.push(summary.ref_min);
                                    if (summary.ref_max !== undefined) allValues.push(summary.ref_max);

                                    const minVal = Math.min(...allValues);
                                    const maxVal = Math.max(...allValues);
                                    const padding = (maxVal - minVal) * 0.1;

                                    // Handle single value case or zero range
                                    const minDomain = minVal === maxVal ? minVal * 0.9 : minVal - padding;
                                    const maxDomain = minVal === maxVal ? maxVal * 1.1 : maxVal + padding;

                                    return (
                                        <Card
                                            key={summary.testName}
                                            className="cursor-pointer group hover:ring-2 hover:ring-rose-100 dark:hover:ring-rose-900/30 transition-all duration-300"
                                            onClick={() => router.push(`/detail/${encodeURIComponent(summary.testName)}`)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-medium text-gray-900 dark:text-white truncate" title={summary.testName}>
                                                            {summary.testName}
                                                        </h3>
                                                        <span className="flex h-2 w-2 rounded-full bg-rose-500"></span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {summary.count} mérés
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-rose-600 dark:text-rose-500">
                                                        {summary.latestValue} {summary.unit}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Ref: {summary.ref_range || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Sparkline */}
                                            <div className="h-40 w-full mt-4">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id={`gradient-${sanitizedId}`} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                                                        <XAxis
                                                            dataKey="date"
                                                            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            minTickGap={30}
                                                        />
                                                        <YAxis
                                                            hide={true}
                                                            domain={[minDomain, maxDomain]}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: 'var(--card-bg)',
                                                                borderColor: 'var(--border)',
                                                                borderRadius: '0.5rem',
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                                fontSize: '12px'
                                                            }}
                                                            labelStyle={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}
                                                            itemStyle={{ color: '#ef4444' }}
                                                            formatter={(value: any) => [`${value} ${summary.unit}`, 'Érték']}
                                                        />

                                                        {/* Reference Range */}
                                                        {hasRefRange && (
                                                            <ReferenceArea
                                                                y1={summary.ref_min}
                                                                y2={summary.ref_max}
                                                                fill="var(--success)"
                                                                fillOpacity={0.1}
                                                            />
                                                        )}
                                                        {!hasRefRange && summary.ref_min !== undefined && (
                                                            <ReferenceLine y={summary.ref_min} stroke="var(--success)" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Min', position: 'insideBottomRight', fontSize: 10, fill: 'var(--success)' }} />
                                                        )}
                                                        {!hasRefRange && summary.ref_max !== undefined && (
                                                            <ReferenceLine y={summary.ref_max} stroke="var(--success)" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Max', position: 'insideTopRight', fontSize: 10, fill: 'var(--success)' }} />
                                                        )}

                                                        <Area
                                                            type="monotone"
                                                            dataKey="value"
                                                            stroke="#ef4444"
                                                            strokeWidth={2}
                                                            fill={`url(#gradient-${sanitizedId})`}
                                                            dot={{ r: 4, fill: 'var(--card-bg)', stroke: '#ef4444', strokeWidth: 2 }}
                                                            activeDot={{ r: 6, fill: '#ef4444', stroke: 'var(--card-bg)', strokeWidth: 2 }}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <Card className="mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Keresés teszt neve alapján..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={() => setFilterAbnormal(!filterAbnormal)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterAbnormal
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {filterAbnormal ? 'Összes megjelenítése' : 'Csak abnormális'}
                        </button>
                    </div>
                </Card>

                {/* Results Table */}
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Teszt neve
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Legutóbbi érték
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Referenciatartomány
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Dátum
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Mérések
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Művelet
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {filteredSummaries.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            Nincs találat
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSummaries.map((summary) => (
                                        <tr
                                            key={summary.testName}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/detail/${encodeURIComponent(summary.testName)}`)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {summary.testName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-semibold ${summary.isAbnormal
                                                        ? 'text-amber-600 dark:text-amber-400'
                                                        : 'text-gray-900 dark:text-white'
                                                        }`}>
                                                        {summary.latestValue} {summary.unit}
                                                    </span>
                                                    {summary.isAbnormal && (
                                                        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {summary.ref_range || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(summary.date).toLocaleDateString('hu-HU')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {summary.count}x
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/detail/${encodeURIComponent(summary.testName)}`);
                                                    }}
                                                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
                                                >
                                                    Részletek →
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </main>
    );
}
