'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const SAMPLE_DATA = [
    { date: "2023-10-16", value: 7.3 },
    { date: "2024-02-14", value: 8.8 },
    { date: "2024-02-29", value: 18.1 },
    { date: "2024-04-15", value: 12.1 },
    { date: "2024-07-05", value: 20.5 },
    { date: "2025-03-14", value: 20.3 },
    { date: "2025-09-01", value: 25.8 }
];

export function LandingChart() {
    return (
        <div className="w-full h-[300px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SAMPLE_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    {/* Reference Range Background */}
                    <ReferenceLine y={12.5} stroke="#10b981" strokeDasharray="3 3" />
                    <ReferenceLine y={32.2} stroke="#10b981" strokeDasharray="3 3" />

                    <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('hu-HU', { month: 'short', year: '2-digit' })}
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        domain={[0, 40]}
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        itemStyle={{ color: '#0066cc', fontWeight: 600 }}
                        labelStyle={{ display: 'none' }}
                        formatter={(value: any) => [`${value} umol/L`, 'Vas (Fe)']}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0066cc"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#0066cc', strokeWidth: 0 }}
                        activeDot={{ r: 6, stroke: '#e0f2fe', strokeWidth: 3 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
