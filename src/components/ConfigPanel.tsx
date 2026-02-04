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
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">開講カレンダー (Calendar Schedule)</h4>
                    <p className="text-xs text-gray-400 mb-2">
                        日付をクリックして 開講/休講 を切り替えてください。<br />
                        (青色 = 開講, グレー = 休講/祝日設定)
                    </p>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {/* Render simple calendar grids for Apr, May, Jun, Jul (based on config) */}
                        {(() => {
                            const start = new Date(config.startDate);
                            const end = new Date(config.endDate);
                            const months = [];
                            let current = new Date(start.getFullYear(), start.getMonth(), 1);

                            while (current <= end) {
                                months.push(new Date(current));
                                current.setMonth(current.getMonth() + 1);
                            }

                            return months.map(monthStart => {
                                const monthName = monthStart.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
                                const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
                                const firstDayDayOfWeek = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1).getDay(); // 0=Sun

                                const days = [];
                                for (let i = 0; i < firstDayDayOfWeek; i++) days.push(null); // padding
                                for (let i = 1; i <= daysInMonth; i++) days.push(i);

                                return (
                                    <div key={monthName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                        <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 text-center">{monthName}</h5>
                                        <div className="grid grid-cols-7 gap-1 text-center">
                                            {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                                                <div key={d} className="text-[10px] text-gray-400 font-bold">{d}</div>
                                            ))}
                                            {days.map((d, idx) => {
                                                if (!d) return <div key={idx}></div>;

                                                const dateStr = `${monthStart.getFullYear()}-${(monthStart.getMonth() + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

                                                // Create a stable key
                                                const key = `day-${monthName}-${d}`;

                                                // Check bounds
                                                if (dateStr < config.startDate || dateStr > config.endDate) {
                                                    return <div key={key} className="text-gray-300 text-xs py-1"></div>;
                                                }

                                                // Determine Status
                                                const dayOfWeek = new Date(dateStr).getDay();
                                                const isBaseOpen = config.openDays.includes(dayOfWeek);
                                                const isExplicitlyClosed = config.closedDays.includes(dateStr);

                                                const isOpen = isBaseOpen && !isExplicitlyClosed;

                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => {
                                                            if (!isBaseOpen) return;

                                                            const newClosed = isExplicitlyClosed
                                                                ? config.closedDays.filter(cd => cd !== dateStr)
                                                                : [...config.closedDays, dateStr].sort();
                                                            handleChange('closedDays', newClosed);
                                                        }}
                                                        disabled={!isBaseOpen}
                                                        className={`text-xs py-1 rounded transition-colors ${isOpen
                                                                ? 'bg-blue-100 text-blue-700 hover:bg-red-100 hover:text-red-700'
                                                                : 'bg-gray-100 text-gray-400'
                                                            } ${!isBaseOpen ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                    >
                                                        {d}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <label className="text-xs text-gray-400 block mb-2">曜日ごとの基本設定 (Weekly Base Pattern)</label>
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
                                        : 'bg-gray-200 text-gray-400 dark:bg-gray-800'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
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
