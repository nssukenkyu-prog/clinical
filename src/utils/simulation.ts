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
    // If no blocks, return false immediately
    if (!blockedTimes || blockedTimes.length === 0) return false;

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

    // Initialize students from ALL groups
    let globalStudentId = 1;
    const students: StudentProgress[] = [];

    config.groups.forEach(group => {
        for (let i = 0; i < group.count; i++) {
            students.push({
                studentId: globalStudentId++,
                groupId: group.id,
                completedHours: 0,
                bookingProbability: config.attendanceVariance ? 0.3 + (Math.random() * 0.7) : 1.0,
                daysTaken: 0,
                sessions: []
            });
        }
    });

    const totalStudentsCount = students.length;

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

    // Pre-calculate statistics
    let totalMaxCapacityMinutes = 0;
    const requiredTotalMinutes = config.groups.reduce((sum, g) => sum + (g.count * g.requiredHours * 60), 0);

    for (const day of allDays) {
        const dayStr = formatDate(day);
        const dayOfWeek = getDay(day);

        if (!config.openDays.includes(dayOfWeek)) continue;
        if (config.closedDays.includes(dayStr)) continue;

        const hours = dayOfWeek === 6 ? config.clinicHours.saturday : config.clinicHours.weekdays;
        const openMin = timeToMinutes(hours.start);
        const closeMin = timeToMinutes(hours.end);
        const totalOpen = Math.max(0, closeMin - openMin);

        // Optimistic upper bound: Full Clinic Hours * Max Concurrent
        totalMaxCapacityMinutes += (totalOpen * config.maxConcurrentStudents);
    }

    // Completion Rate (Percentage)
    const completionRate = requiredTotalMinutes > 0
        ? Math.round((totalMaxCapacityMinutes / requiredTotalMinutes) * 100)
        : 0;

    // Simulation Loop
    let completedCount = 0;
    let finalDate: string | null = null;
    const messages: string[] = [];

    // Helper: Get Group Config
    const getGroup = (id: string) => config.groups.find(g => g.id === id);

    for (const day of allDays) {
        if (completedCount >= totalStudentsCount) {
            finalDate = format(day, 'yyyy-MM-dd');
            break;
        }

        const dayOfWeek = getDay(day);
        const dayStr = format(day, 'yyyy-MM-dd');

        if (!config.openDays.includes(dayOfWeek)) continue;
        if (config.closedDays.includes(dayStr)) continue;

        const dayOfWeekStr = DAY_MAP[dayOfWeek] as any;

        const hours = dayOfWeek === 6 ? config.clinicHours.saturday : config.clinicHours.weekdays;
        const openMin = timeToMinutes(hours.start);
        const closeMin = timeToMinutes(hours.end);

        // Filter active students
        const activeStudents = students.filter(s => {
            const g = getGroup(s.groupId);
            return g && s.completedHours < g.requiredHours;
        });

        // SORTING STRATEGY (Deterministic vs Random)
        if (config.attendanceVariance) {
            // Random shuffle if variance is ON (User wants variability)
            activeStudents.sort(() => Math.random() - 0.5);
        } else {
            // Deterministic: Prioritize students with LEAST completed hours.
            // This balances the load and ensures fairness without randomness.
            // Secondary sort by ID for stability.
            activeStudents.sort((a, b) => {
                const diff = a.completedHours - b.completedHours;
                if (Math.abs(diff) > 0.1) return diff; // Float safety
                return a.studentId - b.studentId;
            });
        }

        for (const student of activeStudents) {
            const group = getGroup(student.groupId);
            if (!group) continue;

            // VARIANCE CHECK
            if (config.attendanceVariance) {
                if (Math.random() > student.bookingProbability) continue;
            }

            // Calculate remaining minutes needed
            const remainingMinutes = (group.requiredHours * 60) - (student.completedHours * 60);

            if (remainingMinutes < 5) {
                student.completedHours = group.requiredHours;
                break;
            }

            // Try to find a slot
            for (let start = openMin; start <= closeMin - (config.minSessionHours * 60); start += 10) {
                let maxDuration = 0;

                for (let d = 10; d <= config.maxSessionHours * 60; d += 10) {
                    // 1. Cap duration at remaining minutes needed
                    if (d > remainingMinutes) break;

                    const currentEnd = start + d;
                    // 2. Check global end time
                    if (currentEnd > closeMin) break;

                    // 3. Check Group-Specific Blocks
                    if (isBlocked(dayOfWeekStr, currentEnd - 10, currentEnd, group.blockedClassTimes, config.classBufferMinutes)) {
                        break;
                    }

                    // 4. Capacity Check (Global)
                    let capacityOk = true;
                    // Check logic: We strictly enforce maxConcurrent for *every 10m slice* of the potential session.
                    // Ideally we check the whole range, but checking the *newest slice* (currentEnd) is the iterative way here.
                    // Wait, `maxDuration` grows. If `d=10` is valid, we check `d=20`.
                    // We must ensure the NEW slice (start+d-10 to start+d) is valid.
                    const slotIdx = Math.floor((currentEnd - 10) / 10);
                    const currentCapacity = getDayCapacity(dayStr)[slotIdx] || 0;
                    if (currentCapacity >= config.maxConcurrentStudents) {
                        capacityOk = false;
                    }

                    if (!capacityOk) break;

                    maxDuration = d;
                }

                // Check constraints for session validity

                // For the last session, we allow it to be shorter than minSessionHours if strictly needed to finish
                const isFinalSession = maxDuration >= remainingMinutes - 5;
                // Otherwise enforce minSessionHours
                const respectsMinDur = maxDuration >= config.minSessionHours * 60;

                if (maxDuration > 0 && (respectsMinDur || isFinalSession)) {
                    // BOOK IT
                    const sessionEnd = start + maxDuration;

                    student.sessions.push({
                        date: dayStr,
                        start: `${Math.floor(start / 60)}:${(start % 60).toString().padStart(2, '0')}`,
                        end: `${Math.floor(sessionEnd / 60)}:${(sessionEnd % 60).toString().padStart(2, '0')}`,
                        duration: maxDuration / 60
                    });
                    student.completedHours += maxDuration / 60;
                    student.daysTaken++;

                    // Mark capacity
                    const dayCap = getDayCapacity(dayStr);
                    const startSlot = Math.floor(start / 10);
                    const endSlot = Math.floor(sessionEnd / 10);

                    for (let i = startSlot; i < endSlot; i++) {
                        if (dayCap[i] === undefined) dayCap[i] = 0;
                        dayCap[i]++;
                    }

                    // ONE SESSION PER DAY IS ENFORCED BY BREAKING HERE
                    // The student loop moves to the next student immediately.
                    break;
                }
            }
        }

        // Recalculate completion
        completedCount = students.filter(s => {
            const g = getGroup(s.groupId);
            return g && s.completedHours >= g.requiredHours;
        }).length;
    }

    return {
        success: completedCount === totalStudentsCount,
        completionDate: finalDate,
        completionRate: completionRate,
        totalDays: allDays.length,
        studentResults: students,
        dailyUsage: dailyCapacity,
        messages
    };
};
