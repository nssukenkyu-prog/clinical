import {
    eachDayOfInterval,
    format,
    getDay
} from 'date-fns';
import type {
    SimulationConfig,
    SimulationResult,
    StudentProgress,
    BlockedTime,
    ClassPeriod
} from '../types';

// Constants from the prompt
const CLASS_PERIODS: ClassPeriod[] = [
    { period: 1, startTime: '09:20', endTime: '10:50' },
    { period: 2, startTime: '11:00', endTime: '12:30' },
    { period: 3, startTime: '13:20', endTime: '14:50' },
    { period: 4, startTime: '15:00', endTime: '16:30' },
    { period: 5, startTime: '16:40', endTime: '18:10' },
];

const DAY_MAP: Record<number, string> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
};

// Helper: Parse HH:mm to minutes from midnight
const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

// Helper: Check if a time range overlaps with any blocked periods for a specific day
const isBlocked = (
    dayOfWeekStr: string,
    startMin: number,
    endMin: number,
    blockedTimes: BlockedTime[],
    bufferMinutes: number = 0
): boolean => {
    const dayBlocks = blockedTimes.filter(b => b.dayOfWeek === dayOfWeekStr);

    for (const block of dayBlocks) {
        const period = CLASS_PERIODS.find(p => p.period === block.period);
        if (!period) continue;

        const blockStart = timeToMinutes(period.startTime) - bufferMinutes;
        const blockEnd = timeToMinutes(period.endTime) + bufferMinutes;

        // Check overlap
        if (startMin < blockEnd && endMin > blockStart) {
            return true;
        }
    }
    return false;
};

export const runSimulation = (config: SimulationConfig): SimulationResult => {
    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Initialize students
    const students: StudentProgress[] = Array.from({ length: config.totalStudents }, (_, i) => ({
        studentId: i + 1,
        completedHours: 0,
        bookingProbability: config.attendanceVariance ? 0.3 + (Math.random() * 0.7) : 1.0, // 30% - 100% chance
        daysTaken: 0,
        sessions: []
    }));

    // Global availability map
    const dailyCapacity: Record<string, number[]> = {};

    const getDayCapacity = (dateStr: string) => {
        if (!dailyCapacity[dateStr]) {
            dailyCapacity[dateStr] = new Array(1440).fill(0);
        }
        return dailyCapacity[dateStr];
    };

    // Helper: format YYYY-MM-DD
    const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

    // Pre-calculate theoretical maximum capacity hours
    let totalMaxCapacityMinutes = 0;
    const requiredTotalMinutes = config.totalStudents * config.requiredHoursPerStudent * 60;

    for (const day of allDays) {
        const dayStr = formatDate(day);
        const dayOfWeek = getDay(day);

        // Check Open Days
        if (!config.openDays.includes(dayOfWeek)) continue;

        // Check Closed Dates (Holidays)
        if (config.closedDays.includes(dayStr)) continue;

        const hours = dayOfWeek === 6 ? config.clinicHours.saturday : config.clinicHours.weekdays;
        const openMin = timeToMinutes(hours.start);
        const closeMin = timeToMinutes(hours.end);

        const totalOpen = closeMin - openMin;

        // Subtract blocked class times (Estimated)
        let dailyBlockedMinutes = 0;
        config.blockedClassTimes
            .filter(b => b.dayOfWeek === DAY_MAP[dayOfWeek])
            .forEach(b => {
                const p = CLASS_PERIODS.find(cp => cp.period === b.period);
                if (p) {
                    const start = timeToMinutes(p.startTime) - config.classBufferMinutes;
                    const end = timeToMinutes(p.endTime) + config.classBufferMinutes;
                    // Clip to clinic hours
                    const effectiveStart = Math.max(openMin, start);
                    const effectiveEnd = Math.min(closeMin, end);
                    if (effectiveEnd > effectiveStart) {
                        dailyBlockedMinutes += (effectiveEnd - effectiveStart);
                    }
                }
            });

        const availableMinutes = Math.max(0, totalOpen - dailyBlockedMinutes);
        totalMaxCapacityMinutes += (availableMinutes * config.maxConcurrentStudents);
    }

    // Completion Rate (Percentage)
    const completionRate = Math.round((totalMaxCapacityMinutes / requiredTotalMinutes) * 100);

    // Simulation Loop
    let completedCount = 0;
    let finalDate: string | null = null;
    const messages: string[] = [];

    for (const day of allDays) {
        if (completedCount >= config.totalStudents) {
            finalDate = format(day, 'yyyy-MM-dd');
            break;
        }

        const dayOfWeek = getDay(day); // 0=Sun, 6=Sat
        const dayStr = format(day, 'yyyy-MM-dd');

        // VALIDATION: Open Days
        if (!config.openDays.includes(dayOfWeek)) continue;

        // VALIDATION: Closed Dates
        if (config.closedDays.includes(dayStr)) continue;

        const dayOfWeekStr = DAY_MAP[dayOfWeek] as any;

        // Determine clinic hours for today
        const hours = dayOfWeek === 6 ? config.clinicHours.saturday : config.clinicHours.weekdays;
        const openMin = timeToMinutes(hours.start);
        const closeMin = timeToMinutes(hours.end);

        // Shuffle students
        const activeStudents = students.filter(s => s.completedHours < config.requiredHoursPerStudent);
        activeStudents.sort(() => Math.random() - 0.5);

        for (const student of activeStudents) {
            if (student.completedHours >= config.requiredHoursPerStudent) continue;

            // VARIANCE CHECK: Skip based on probability if variance is enabled
            if (Math.random() > student.bookingProbability) continue;

            // Calculate remaining minutes needed
            const remainingMinutes = (config.requiredHoursPerStudent * 60) - (student.completedHours * 60);

            // If remaining time is very small (e.g. < 5 mins due to float precision), just finish.
            if (remainingMinutes < 5) {
                student.completedHours = config.requiredHoursPerStudent;
                break;
            }

            for (let start = openMin; start <= closeMin - (config.minSessionHours * 60); start += 10) {
                let maxDuration = 0;

                for (let d = 10; d <= config.maxSessionHours * 60; d += 10) {
                    // Cap duration at remaining minutes needed
                    if (d > remainingMinutes) break;

                    const currentEnd = start + d;

                    if (currentEnd > closeMin) break;

                    if (isBlocked(dayOfWeekStr, currentEnd - 10, currentEnd, config.blockedClassTimes, config.classBufferMinutes)) {
                        break;
                    }

                    // Capacity Check
                    let capacityOk = true;
                    // Check specific 10m slot
                    const slotIdx = Math.floor((currentEnd - 10) / 10);
                    const currentCapacity = getDayCapacity(dayStr)[slotIdx] || 0;
                    if (currentCapacity >= config.maxConcurrentStudents) {
                        capacityOk = false;
                    }

                    if (!capacityOk) break;

                    maxDuration = d;
                }

                // For the last session, we allow it to be shorter than minSessionHours if strictly needed to finish
                // Otherwise enforce minSessionHours
                const isLastSession = maxDuration >= remainingMinutes - 5; // tolerance
                const respectsMinDur = maxDuration >= config.minSessionHours * 60;

                if (maxDuration > 0 && (respectsMinDur || isLastSession)) {
                    const sessionEnd = start + maxDuration;

                    student.sessions.push({
                        date: dayStr,
                        start: `${Math.floor(start / 60)}:${(start % 60).toString().padStart(2, '0')}`,
                        end: `${Math.floor(sessionEnd / 60)}:${(sessionEnd % 60).toString().padStart(2, '0')}`,
                        duration: maxDuration / 60
                    });
                    student.completedHours += maxDuration / 60;
                    student.daysTaken++;

                    const dayCap = getDayCapacity(dayStr);
                    const startSlot = Math.floor(start / 10);
                    const endSlot = Math.floor(sessionEnd / 10);

                    for (let i = startSlot; i < endSlot; i++) {
                        if (dayCap[i] === undefined) dayCap[i] = 0;
                        dayCap[i]++;
                    }
                    break;
                }
            }
        }
        completedCount = students.filter(s => s.completedHours >= config.requiredHoursPerStudent).length;
    }

    return {
        success: completedCount === config.totalStudents,
        completionDate: finalDate,
        completionRate: completionRate,
        totalDays: allDays.length,
        studentResults: students,
        dailyUsage: dailyCapacity,
        messages
    };
};
