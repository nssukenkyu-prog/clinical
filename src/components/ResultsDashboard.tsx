import React, { useMemo } from 'react';
import type { SimulationResult } from '../types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine
} from 'recharts';

interface ResultsDashboardProps {
    result: SimulationResult;
    isSimulating: boolean;
    limit: number;
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

    // --- Chart Data Preparation (Existing) ---
    const activeDays = Object.keys(result.dailyUsage).sort();

    const utilizationData = useMemo(() => {
        return activeDays.map(date => {
            const slots = result.dailyUsage[date];
            // Average utilization across open hours (assuming 8:30-20:30 roughly for visualization scale)
            // or just take the MAX concurrent usage of the day? MAX is better for bottleneck detection.
            const maxConcurrent = Math.max(...slots);
            // Also calculate "Seat Hours" used?
            // Sum of all slots / 12 (since slots are 5min) = Total Student-Hours that day
            const totalStudentHours = slots.reduce((a, b) => a + b, 0) / 12;

            return {
                date: date.slice(5), // MM-DD
                maxConcurrent,
                totalStudentHours,
                isFull: maxConcurrent >= limit
            };
        });
    }, [result.dailyUsage, limit, activeDays]);

    const completionHistogram = useMemo(() => {
        const counts: Record<number, number> = {};
        result.studentResults.forEach(s => {
            const days = s.daysTaken;
            counts[days] = (counts[days] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([days, count]) => ({ days: Number(days), count }))
            .sort((a, b) => a.days - b.days);
    }, [result.studentResults]);

    // --- CSV Export Logic ---
    const handleDownloadCSV = () => {
        // 1. Session Log
        const headers = ['Student ID', 'Group ID', 'Date', 'Start Time', 'End Time', 'Duration (Hrs)', 'Cumulative Hours'];
        const rows: string[] = [];

        result.studentResults.forEach(student => {
            let cumulative = 0;
            student.sessions.forEach(session => {
                cumulative += session.duration;
                rows.push([
                    student.studentId,
                    student.groupId,
                    session.date,
                    session.start,
                    session.end,
                    session.duration.toFixed(2),
                    cumulative.toFixed(2)
                ].join(','));
            });
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        // Add BOM for Excel UTF-8 compatibility
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `simulation_sessions_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Render ---
    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl text-white shadow-lg ${result.success ? 'bg-green-600' : 'bg-red-500'}`}>
                    <div className="text-xs font-bold uppercase opacity-80 mb-1">Status</div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                        {result.success ? (
                            <>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Success
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                Failed
                            </>
                        )}
                    </div>
                    <div className="text-sm mt-2 opacity-90">
                        {result.success ? "All students completed." : "Time ran out."}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Completion Date</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                        {result.completionDate || "N/A"}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                        Limit: {result.totalDays} days avail
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Feasibility Rate (Est.)</div>
                    <div className={`text-2xl font-bold ${result.completionRate >= 100 ? 'text-green-500' : 'text-orange-500'}`}>
                        {result.completionRate}%
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                        Effective Cap / Required
                    </div>
                </div>

                {/* Download CSV Button */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center">
                    <button
                        onClick={handleDownloadCSV}
                        className="w-full h-full flex flex-col items-center justify-center p-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-400 transition-colors group"
                    >
                        <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        <span className="text-sm font-bold text-gray-500 group-hover:text-blue-600">Download Excel (CSV)</span>
                    </button>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Daily Utilization (Max Concurrent) */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Daily Peak Utilization</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={utilizationData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="date" fontSize={10} />
                                <YAxis domain={[0, limit + 2]} allowDecimals={false} fontSize={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                />
                                <Bar dataKey="maxConcurrent" name="Peak Students">
                                    {utilizationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.isFull ? '#ef4444' : '#3b82f6'} />
                                    ))}
                                </Bar>
                                <ReferenceLine y={limit} label="Max" stroke="red" strokeDasharray="3 3" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Completion Distribution */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Frequency of Days Taken</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={completionHistogram}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="days" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} fontSize={10} />
                                <YAxis allowDecimals={false} fontSize={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#10b981" name="Student Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* All Students List (Expandable) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <details className="group">
                    <summary className="p-4 cursor-pointer font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between items-center transition-colors">
                        <span>All Students Schedule ({result.studentResults.length})</span>
                        <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="p-0 overflow-x-auto max-h-96 overflow-y-auto border-t border-gray-100 dark:border-gray-700">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 uppercase font-bold text-xs sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Group</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Total Hrs</th>
                                    <th className="px-4 py-3">Days</th>
                                    <th className="px-4 py-3">Last Session</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {result.studentResults.map(s => {
                                    return (
                                        <tr key={s.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-4 py-2 font-mono text-gray-500">#{s.studentId}</td>
                                            <td className="px-4 py-2"><span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs">{s.groupId}</span></td>
                                            <td className="px-4 py-2">
                                                <span className="text-green-600 font-bold">Done</span>
                                            </td>
                                            <td className="px-4 py-2">{s.completedHours.toFixed(1)}</td>
                                            <td className="px-4 py-2">{s.daysTaken}</td>
                                            <td className="px-4 py-2 text-xs text-gray-400">
                                                {s.sessions.length > 0 ? s.sessions[s.sessions.length - 1].date : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </details>
            </div>
        </div>
    );
};
