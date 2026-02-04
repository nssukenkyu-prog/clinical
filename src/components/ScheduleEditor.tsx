import React from 'react';
import { clsx } from 'clsx';
import type { BlockedTime, DayOfWeek } from '../types';

interface ScheduleEditorProps {
    blockedTimes: BlockedTime[];
    onChange: (newBlockedTimes: BlockedTime[]) => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5];
const PERIOD_LABELS: Record<number, string> = {
    1: '1st (09:20-10:50)',
    2: '2nd (11:00-12:30)',
    3: '3rd (13:20-14:50)',
    4: '4th (15:00-16:30)',
    5: '5th (16:40-18:10)',
};

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ blockedTimes, onChange }) => {
    const toggleBlock = (day: DayOfWeek, period: number) => {
        const exists = blockedTimes.some(b => b.dayOfWeek === day && b.period === period);
        if (exists) {
            onChange(blockedTimes.filter(b => !(b.dayOfWeek === day && b.period === period)));
        } else {
            onChange([...blockedTimes, { dayOfWeek: day, period }]);
        }
    };

    const isBlocked = (day: DayOfWeek, period: number) => {
        return blockedTimes.some(b => b.dayOfWeek === day && b.period === period);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <span className="p-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                    Class Schedule
                </span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    (Click cells to mark class times where students CANNOT train)
                </span>
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="p-2 text-left text-gray-500 dark:text-gray-400 font-medium">Period</th>
                            {DAYS.map(day => (
                                <th key={day} className="p-2 text-center text-gray-700 dark:text-gray-300 font-semibold">
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {PERIODS.map(period => (
                            <tr key={period} className="border-t border-gray-100 dark:border-gray-700">
                                <td className="p-3 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                                    {PERIOD_LABELS[period]}
                                </td>
                                {DAYS.map(day => {
                                    const blocked = isBlocked(day, period);
                                    return (
                                        <td key={`${day}-${period}`} className="p-1">
                                            <button
                                                onClick={() => toggleBlock(day, period)}
                                                className={clsx(
                                                    "w-full h-12 rounded-lg transition-all duration-200 text-xs font-medium",
                                                    blocked
                                                        ? "bg-red-500 dark:bg-red-600 text-white shadow-md transform scale-95"
                                                        : "bg-gray-50 dark:bg-gray-700/50 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                )}
                                            >
                                                {blocked ? "CLASS" : "Available"}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
