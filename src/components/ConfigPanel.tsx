import React from 'react';
import type { SimulationConfig, StudentGroup } from '../types';
import { ScheduleEditor } from './ScheduleEditor';

interface ConfigPanelProps {
    config: SimulationConfig;
    onChange: (newConfig: SimulationConfig) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
    const handleChange = (key: keyof SimulationConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const handleGroupChange = (groupId: string, field: keyof StudentGroup, value: any) => {
        const newGroups = config.groups.map(g =>
            g.id === groupId ? { ...g, [field]: value } : g
        );
        handleChange('groups', newGroups);
    };

    const addGroup = () => {
        const newId = `g${Date.now()}`;
        const newGroup: StudentGroup = {
            id: newId,
            name: `Group ${config.groups.length + 1}`,
            count: 20,
            requiredHours: 21,
            blockedClassTimes: [],
            color: '#3b82f6'
        };
        handleChange('groups', [...config.groups, newGroup]);
    };

    const removeGroup = (groupId: string) => {
        if (config.groups.length <= 1) return; // Prevent removing last group
        handleChange('groups', config.groups.filter(g => g.id !== groupId));
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Configuration</h3>

            <div className="space-y-8">
                {/* Global Settings */}
                <section>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">基本設定 (Global Settings)</h4>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">開始日 (Start Date)</label>
                            <input
                                type="date"
                                value={config.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">終了日 (End Date)</label>
                            <input
                                type="date"
                                value={config.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">同時実習最大人数 (Max Concurrent)</label>
                            <input
                                type="number"
                                value={config.maxConcurrentStudents}
                                onChange={(e) => handleChange('maxConcurrentStudents', parseInt(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                            />
                        </div>
                        {/* CHANGED: Single Input for Daily Session Duration */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">1日の実習時間/人 (Hours/Day/Person)</label>
                            <input
                                type="number"
                                value={config.dailySessionDuration}
                                onChange={(e) => handleChange('dailySessionDuration', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                                step="0.5"
                            />
                        </div>
                    </div>
                </section>

                {/* Groups Management */}
                <section>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">学生グループ設定 (Student Groups)</h4>
                        <button
                            onClick={addGroup}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-bold"
                        >
                            + Add Group
                        </button>
                    </div>

                    <div className="space-y-6">
                        {config.groups.map((group) => (
                            <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500">グループ名 (Name)</label>
                                            <input
                                                type="text"
                                                value={group.name}
                                                onChange={(e) => handleGroupChange(group.id, 'name', e.target.value)}
                                                className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500">学生数 (Count)</label>
                                            <input
                                                type="number"
                                                value={group.count}
                                                onChange={(e) => handleGroupChange(group.id, 'count', parseInt(e.target.value))}
                                                className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500">必要時間 (Req. Hours)</label>
                                            <input
                                                type="number"
                                                value={group.requiredHours}
                                                onChange={(e) => handleGroupChange(group.id, 'requiredHours', parseInt(e.target.value))}
                                                className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm"
                                            />
                                        </div>
                                    </div>
                                    {config.groups.length > 1 && (
                                        <button
                                            onClick={() => removeGroup(group.id)}
                                            className="ml-4 text-red-500 hover:text-red-700 text-xs font-bold"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                {/* Schedule Editor for this group */}
                                <div className="mt-2">
                                    <label className="text-xs text-gray-500 font-bold mb-1 block">このグループの授業日程 (Blocked Schedule)</label>
                                    <ScheduleEditor
                                        blockedTimes={group.blockedClassTimes}
                                        onChange={(newTimes) => handleGroupChange(group.id, 'blockedClassTimes', newTimes)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Calendar & Variance */}
                <section>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">詳細設定 (Advanced)</h4>

                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                checked={config.attendanceVariance}
                                onChange={(e) => handleChange('attendanceVariance', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">行動ばらつき (Variance)</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            ON: ランダムな出頭 (日付が変動します) <br />
                            OFF: 均等に配分 (実習時間が少ない学生を優先) - [Deterministic]
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs text-gray-500 block font-bold">開講曜日 (Open Days)</label>
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

                    <div className="mt-4">
                        <label className="text-xs text-gray-500 block font-bold mb-2">個別休講日設定 (Specific Closed Dates)</label>
                        {/* Interactive Calendar - Simplified for space */}
                        <div className="max-h-64 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded p-2">
                            {/* Render simplified calendar grids */}
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
                                    const firstDayDayOfWeek = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1).getDay();

                                    const days = [];
                                    for (let i = 0; i < firstDayDayOfWeek; i++) days.push(null);
                                    for (let i = 1; i <= daysInMonth; i++) days.push(i);

                                    return (
                                        <div key={monthName} className="mb-4">
                                            <h5 className="text-xs font-bold text-gray-500 mb-1">{monthName}</h5>
                                            <div className="grid grid-cols-7 gap-1 text-center">
                                                {days.map((d, idx) => {
                                                    if (!d) return <div key={idx}></div>;
                                                    const dateStr = `${monthStart.getFullYear()}-${(monthStart.getMonth() + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                                                    if (dateStr < config.startDate || dateStr > config.endDate) return <div key={idx}></div>;

                                                    const dayOfWeek = new Date(dateStr).getDay();
                                                    const isBaseOpen = config.openDays.includes(dayOfWeek);
                                                    const isExplicitlyClosed = config.closedDays.includes(dateStr);
                                                    const isOpen = isBaseOpen && !isExplicitlyClosed;

                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                if (!isBaseOpen) return;
                                                                const newClosed = isExplicitlyClosed
                                                                    ? config.closedDays.filter(cd => cd !== dateStr)
                                                                    : [...config.closedDays, dateStr].sort();
                                                                handleChange('closedDays', newClosed);
                                                            }}
                                                            disabled={!isBaseOpen}
                                                            className={`text-[10px] w-full py-1 rounded ${isOpen
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'bg-gray-100 text-gray-300'
                                                                }`}
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
                </section>
            </div>
        </div>
    );
};
