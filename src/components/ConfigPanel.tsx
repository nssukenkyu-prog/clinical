import React from 'react';
import type { SimulationConfig } from '../types';

interface ConfigPanelProps {
    config: SimulationConfig;
    onChange: (newConfig: SimulationConfig) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
    const handleChange = (key: keyof SimulationConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 h-full">
            <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Parameters</h3>

            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">学生数 (Students)</label>
                        <input
                            type="number"
                            value={config.totalStudents}
                            onChange={(e) => handleChange('totalStudents', parseInt(e.target.value))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">必要時間/人 (Hours/Student)</label>
                        <input
                            type="number"
                            value={config.requiredHoursPerStudent}
                            onChange={(e) => handleChange('requiredHoursPerStudent', parseInt(e.target.value))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">同時実習最大人数 (Max Concurrent)</label>
                        <input
                            type="number"
                            value={config.maxConcurrentStudents}
                            onChange={(e) => handleChange('maxConcurrentStudents', parseInt(e.target.value))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">開始日 (Start Date)</label>
                        <input
                            type="date"
                            value={config.startDate}
                            onChange={(e) => handleChange('startDate', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">終了日 (End Date)</label>
                        <input
                            type="date"
                            value={config.endDate}
                            onChange={(e) => handleChange('endDate', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">シミュレーション設定 (Settings)</h4>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={config.attendanceVariance}
                            onChange={(e) => handleChange('attendanceVariance', e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">学生の出頭率にばらつきを持たせる</span>
                            <p className="text-xs text-gray-500">
                                OFF: 全員が毎日最短で予約 / ON: 週1回の人や集中型の人など個人差(確率)を反映
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">開講スケジュール (Operational Schedule)</h4>

                    {/* Open Days of Week */}
                    <div className="mb-4">
                        <label className="text-xs text-gray-500 block mb-2">開講曜日 (Open Days)</label>
                        <div className="flex flex-wrap gap-2">
                            {['日', '月', '火', '水', '木', '金', '土'].map((day, idx) => (
                                <button
                                    key={day}
                                    onClick={() => {
                                        const newOpen = config.openDays.includes(idx)
                                            ? config.openDays.filter(d => d !== idx)
                                            : [...config.openDays, idx].sort();
                                        handleChange('openDays', newOpen);
                                    }}
                                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${config.openDays.includes(idx)
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                                        }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Closed Dates */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 block">休講日 (Holidays / Closed Dates)</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                id="holiday-input"
                                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                            />
                            <button
                                onClick={() => {
                                    const input = document.getElementById('holiday-input') as HTMLInputElement;
                                    if (input.value && !config.closedDays.includes(input.value)) {
                                        handleChange('closedDays', [...config.closedDays, input.value].sort());
                                        input.value = '';
                                    }
                                }}
                                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                            >
                                追加
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                            {config.closedDays.map(date => (
                                <span key={date} className="inline-flex items-center px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs">
                                    {date}
                                    <button
                                        onClick={() => handleChange('closedDays', config.closedDays.filter(d => d !== date))}
                                        className="ml-1 hover:text-red-900"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">実習時間 (Session Duration)</h4>
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs text-gray-500">最小 (Min Hours)</label>
                            <input
                                type="number"
                                value={config.minSessionHours}
                                onChange={(e) => handleChange('minSessionHours', parseFloat(e.target.value))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-xs text-gray-500">最大 (Max Hours)</label>
                            <input
                                type="number"
                                value={config.maxSessionHours}
                                onChange={(e) => handleChange('maxSessionHours', parseFloat(e.target.value))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
