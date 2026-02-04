import React, { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SimulationResult } from '../types';

interface ResultsDashboardProps {
    result: SimulationResult | null;
    isSimulating: boolean;
    limit: number; // Max concurrent students limit
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result, isSimulating, limit }) => {
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
        const data = [];
        const dates = Object.keys(result.dailyUsage).sort();

        for (const date of dates) {
            const slots = result.dailyUsage[date];
            const maxConcurrent = Math.max(...slots);
            data.push({
                date: date.slice(5), // MM-DD
                maxConcurrent,
                limit,
                usagePercent: Math.round((maxConcurrent / limit) * 100)
            });
        }
        return data;
    }, [result, limit]);

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

                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border-l-4 border-yellow-500 shadow-lg md:col-span-3 lg:col-span-1">
                    <h4 className="text-sm uppercase text-gray-500 font-bold mb-1">達成可能率 (Feasibility Rate)</h4>
                    <div className="flex items-end gap-2">
                        <p className={`text-3xl font-bold ${result.completionRate >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.completionRate}%
                        </p>
                        <span className="text-xs text-gray-500 mb-1">
                            (理論上の最大収容可能人数 / 必要人数)
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
                        <div
                            className={`h-2.5 rounded-full ${result.completionRate >= 100 ? 'bg-green-600' : 'bg-red-600'}`}
                            style={{ width: `${Math.min(result.completionRate, 100)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        100%未満は物理的に不可能です。120%以上を推奨します。
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
                            <YAxis
                                stroke="#9ca3af"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, limit + 1]} // Dynamic domain based on limit
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                            />
                            {/* Capacity Limit Line */}
                            <Area
                                type="monotone"
                                dataKey="limit"
                                stroke="transparent"
                                fill="#ef4444"
                                fillOpacity={0.05} // Subtle red background for capacity
                                isAnimationActive={false}
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

            {/* Histogram & Sample Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Completion Days Histogram */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">完了までの日数分布 (Days to Complete)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={(() => {
                                    const counts: Record<number, number> = {};
                                    result.studentResults.forEach(s => {
                                        const days = s.daysTaken || 0; // Fallback 0
                                        if (days > 0) counts[days] = (counts[days] || 0) + 1;
                                    });
                                    return Object.entries(counts)
                                        .map(([days, count]) => ({ days: Number(days), count }))
                                        .sort((a, b) => a.days - b.days);
                                })()}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="days" stroke="#9ca3af" fontSize={12} tickLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff' }} />
                                <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily Utilization Rate Chart (Detailed Feasibility) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">日別稼働率 (Daily Utilization Rate)</h3>
                    <p className="text-xs text-gray-500 mb-2">定員に対する予約の埋まり具合 (100% = 満員)</p>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} minTickGap={20} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} domain={[0, 100]} unit="%" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff' }} />
                                <Area
                                    type="monotone"
                                    dataKey="usagePercent"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.2}
                                    name="Utilization %"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* All 100 Students Schedule View */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">全学生スケジュール一覧 (All Students)</h3>
                    <div className="max-h-96 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 font-medium text-gray-500">ID</th>
                                    <th className="p-3 font-medium text-gray-500">Hours</th>
                                    <th className="p-3 font-medium text-gray-500">Days</th>
                                    <th className="p-3 font-medium text-gray-500">Schedule</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {result.studentResults.map(student => (
                                    <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="p-3 font-mono text-gray-400">#{student.studentId}</td>
                                        <td className="p-3 font-bold">{student.completedHours.toFixed(1)}h</td>
                                        <td className="p-3">{student.daysTaken} days</td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1">
                                                {student.sessions.map((session, idx) => (
                                                    <span key={idx} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] rounded border border-blue-100 dark:border-blue-800/50">
                                                        {session.date.slice(5)} ({session.start}-{session.end})
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
