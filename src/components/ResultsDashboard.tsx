import React, { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SimulationResult } from '../types';

interface ResultsDashboardProps {
    result: SimulationResult | null;
    isSimulating: boolean;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result, isSimulating }) => {
    if (isSimulating) {
        return (
            <div className="h-96 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-center animate-pulse">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Running Simulation...</p>
                </div>
            </div>
        );
    }

    if (!result) return null;

    const chartData = useMemo(() => {
        // Transform dailyUsage to chart format
        // Aggregation: Max concurrent students per day
        const data = [];
        const dates = Object.keys(result.dailyUsage).sort();

        for (const date of dates) {
            const slots = result.dailyUsage[date];
            const maxConcurrent = Math.max(...slots);
            data.push({
                date: date.slice(5), // MM-DD
                maxConcurrent,
                slots: slots.reduce((a, b) => a + b, 0) // total slot-minutes (proxy for load)
            });
        }
        return data;
    }, [result]);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-6 rounded-xl border-l-4 shadow-lg ${result.success ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-red-50 dark:bg-red-900/20 border-red-500'}`}>
                    <h4 className="text-sm uppercase text-gray-500 font-bold mb-1">実習完了可否 (Status)</h4>
                    <p className={`text-2xl font-bold ${result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                        {result.success ? "達成可能" : "達成不可"}
                    </p>
                </div>

                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border-l-4 border-blue-500 shadow-lg">
                    <h4 className="text-sm uppercase text-gray-500 font-bold mb-1">全学生完了日 (Completion Date)</h4>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                        {result.completionDate || "未完了"}
                    </p>
                </div>

                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border-l-4 border-purple-500 shadow-lg">
                    <h4 className="text-sm uppercase text-gray-500 font-bold mb-1">実習日数 (Days)</h4>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                        {result.totalDays} <span className="text-sm font-normal text-gray-400">日間</span>
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">日別利用者数推移 (Daily Clinic Usage)</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="maxConcurrent"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorMax)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
