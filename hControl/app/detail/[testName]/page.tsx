'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { storage } from '@/lib/storage';
import type { BloodTestResult } from '@/types/blood-results';

export default function DetailPage() {
    const router = useRouter();
    const params = useParams();
    const testName = decodeURIComponent(params.testName as string);

    // Find marker description
    const markerInfo = require('../../../data/markerDescription.json').find(
        (m: any) => m.marker_name === testName
    );

    const [isLoading, setIsLoading] = useState(true);
    const [testResults, setTestResults] = useState<BloodTestResult[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const data = await storage.getBloodResults();
            if (!data) {
                router.push('/');
                return;
            }

            const filtered = data.results
                .filter((r) => r.testName === testName)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setTestResults(filtered);
            setIsLoading(false);
        };
        loadData();
    }, [router, testName]);

    const chartData = useMemo(() => {
        return testResults.map((result) => ({
            date: new Date(result.date).toLocaleDateString('hu-HU', {
                year: '2-digit',
                month: 'numeric',
                day: 'numeric',
            }),
            value: result.value,
            refMin: result.ref_min,
            refMax: result.ref_max,
        }));
    }, [testResults]);

    if (isLoading) {
        return <Loading fullScreen text="Adatok betöltése..." />;
    }

    if (testResults.length === 0) {
        return (
            <main className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                        Nem találhatók eredmények
                    </p>
                    <Button onClick={() => router.push('/results')}>
                        Vissza az eredményekhez
                    </Button>
                </div>
            </main>
        );
    }

    const latest = testResults[testResults.length - 1];
    const isAbnormal =
        (latest.ref_min !== undefined && latest.value < latest.ref_min) ||
        (latest.ref_max !== undefined && latest.value > latest.ref_max);

    return (
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {testName}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {testResults.length} mérés • {new Date(testResults[0].date).toLocaleDateString('hu-HU')} - {new Date(latest.date).toLocaleDateString('hu-HU')}
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => router.push('/results')}>
                            Vissza
                        </Button>
                    </div>

                    {/* Latest Value Card */}
                    <Card className={isAbnormal ? 'border-amber-200 dark:border-amber-900/30' : ''}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    Legutóbbi érték
                                </p>
                                <p className={`text-4xl font-bold ${isAbnormal ? 'text-amber-600 dark:text-amber-500' : 'text-gray-900 dark:text-white'
                                    }`}>
                                    {latest.value} {latest.unit}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {new Date(latest.date).toLocaleDateString('hu-HU', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    Referenciatartomány
                                </p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {latest.ref_range || 'N/A'}
                                </p>
                                {latest.ref_min !== undefined && latest.ref_max !== undefined && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Min: {latest.ref_min} • Max: {latest.ref_max}
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    Státusz
                                </p>
                                {isAbnormal ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-lg font-semibold text-amber-600 dark:text-amber-500">
                                            Tartományon kívül
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-500">
                                            Normál
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Description Card */}
                {markerInfo && (
                    <Card className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Tudnivalók
                        </h2>
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {markerInfo.description}
                            </p>
                            {markerInfo.source_link && (
                                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                    Forrás: {' '}
                                    <a
                                        href={markerInfo.source_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                        {markerInfo.source_name || 'Forrás megtekintése'}
                                    </a>
                                </p>
                            )}
                        </div>
                    </Card>
                )}

                {/* Chart */}
                <Card className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Változás az időben
                    </h2>
                    <div className="w-full h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                <XAxis
                                    dataKey="date"
                                    className="text-gray-600 dark:text-gray-400"
                                    tick={{ fill: 'currentColor' }}
                                />
                                <YAxis
                                    className="text-gray-600 dark:text-gray-400"
                                    tick={{ fill: 'currentColor' }}
                                    label={{ value: latest.unit, angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--card-bg)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '0.5rem',
                                    }}
                                    labelStyle={{ color: 'var(--foreground)' }}
                                />
                                <Legend />

                                {/* Reference lines */}
                                {latest.ref_min !== undefined && (
                                    <ReferenceLine
                                        y={latest.ref_min}
                                        stroke="#10b981"
                                        strokeDasharray="5 5"
                                        label={{ value: 'Min', position: 'right' }}
                                    />
                                )}
                                {latest.ref_max !== undefined && (
                                    <ReferenceLine
                                        y={latest.ref_max}
                                        stroke="#10b981"
                                        strokeDasharray="5 5"
                                        label={{ value: 'Max', position: 'right' }}
                                    />
                                )}

                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#0066cc"
                                    strokeWidth={3}
                                    dot={{ fill: '#0066cc', r: 5 }}
                                    activeDot={{ r: 7 }}
                                    name={testName}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Data Table */}
                <Card padding="none">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Összes mérés
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Dátum
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Érték
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Referenciatartomány
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Státusz
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {[...testResults].reverse().map((result, index) => {
                                    const isResultAbnormal =
                                        (result.ref_min !== undefined && result.value < result.ref_min) ||
                                        (result.ref_max !== undefined && result.value > result.ref_max);

                                    return (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {new Date(result.date).toLocaleDateString('hu-HU', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-semibold ${isResultAbnormal ? 'text-amber-600 dark:text-amber-500' : 'text-gray-900 dark:text-white'
                                                    }`}>
                                                    {result.value} {result.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {result.ref_range || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {isResultAbnormal ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                                                        Abnormális
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500">
                                                        Normál
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </main>
    );
}
