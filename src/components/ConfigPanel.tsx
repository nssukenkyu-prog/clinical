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
