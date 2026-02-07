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

// Constants
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

const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

// Check if a range overlaps with blocked times
const isBlocked = (
    dayOfWeekStr: string,
    startMin: number,
    endMin: number,
    blockedTimes: BlockedTime[],
    bufferMinutes: number = 0
): boolean => {
    if (!blockedTimes || blockedTimes.length === 0) return false;

    const dayBlocks = blockedTimes.filter(b => b.dayOfWeek === dayOfWeekStr);

    for (const block of dayBlocks) {
        const period = CLASS_PERIODS.find(p => p.period === block.period);
        if (!period) continue;

        const blockStart = timeToMinutes(period.startTime) - bufferMinutes;
        const blockEnd = timeToMinutes(period.endTime) + bufferMinutes;

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

    // Initialize Students
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

    // Global Capacity Map: [DateStr] -> Array of 144 (10-min slots) containing student counts
    // 0 = 00:00, 143 = 23:50
    const dailyCapacity: Record<string, number[]> = {};
    const getDayCapacity = (dateStr: string) => {
        if (!dailyCapacity[dateStr]) dailyCapacity[dateStr] = new Array(144).fill(0);
        return dailyCapacity[dateStr];
    };

    const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
    const getGroup = (id: string) => config.groups.find(g => g.id === id);

    // --- Pre-calculation for "Completion Rate" (Feasibility) ---
    // This is an estimation based on pure open hours vs required hours
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

        // This is a rough upper bound estimate
        totalMaxCapacityMinutes += (Math.max(0, closeMin - openMin) * config.maxConcurrentStudents);
    }
    const completionRate = requiredTotalMinutes > 0
        ? Math.round((totalMaxCapacityMinutes / requiredTotalMinutes) * 100)
        : 0;
    // ------------------------------------------------------------

    // Simulation Loop
    let completedCount = 0;
    let finalDate: string | null = null;
    const messages: string[] = [];

    for (const day of allDays) {
        if (completedCount >= totalStudentsCount) {
            finalDate = formatDate(day);
            break;
        }

        const dayOfWeek = getDay(day);
        const dayStr = formatDate(day);

        // -- Global Day Checks --
        if (!config.openDays.includes(dayOfWeek)) continue;
        if (config.closedDays.includes(dayStr)) continue;

        const dayOfWeekStr = DAY_MAP[dayOfWeek] as any;
        const hours = dayOfWeek === 6 ? config.clinicHours.saturday : config.clinicHours.weekdays;
        const openMin = timeToMinutes(hours.start);
        const closeMin = timeToMinutes(hours.end);

        // -- Identify Active Students --
        const activeStudents = students.filter(s => {
            const g = getGroup(s.groupId);
            return g && s.completedHours < g.requiredHours;
        });

        // -- Sort Students --
        if (config.attendanceVariance) {
            activeStudents.sort(() => Math.random() - 0.5);
        } else {
            // Deterministic: Least completed hours first
            activeStudents.sort((a, b) => {
                const diff = a.completedHours - b.completedHours;
                if (Math.abs(diff) > 0.01) return diff;
                return a.studentId - b.studentId;
            });
        }

        // -- Attempt Scheduling --
        for (const student of activeStudents) {
            const group = getGroup(student.groupId);
            if (!group) continue;

            // Variance: Skip randomly
            if (config.attendanceVariance) {
                if (Math.random() > student.bookingProbability) continue;
            }

            // Determine Target Duration
            const remainingHours = group.requiredHours - student.completedHours;
            // Target is STRICTLY config.dailySessionDuration, UNLESS they need less to finish.
            // We do not allow "shorter but not finishing" sessions unless it replaces the full session (which implies they finish).
            // Actually, if they need 5h but only 3h is allowed per day, they do 3h.
            // If they need 1h and 3h is allowed, they do 1h.
            let targetDurationMinutes = Math.min(remainingHours, config.dailySessionDuration) * 60;

            // Round to nearest 10 for slot alignment
            targetDurationMinutes = Math.ceil(targetDurationMinutes / 10) * 10;

            if (targetDurationMinutes <= 0) continue;

            // Find a slot
            // Step: 10 mins
            for (let start = openMin; start <= closeMin - targetDurationMinutes; start += 10) {
                const end = start + targetDurationMinutes;

                // 1. Check Class Blocks
                if (isBlocked(dayOfWeekStr, start, end, group.blockedClassTimes, config.classBufferMinutes)) {
                    continue;
                }

                // 2. Check Capacity
                // Check every 10-min slot in the range
                let capacityOk = true;
                const startSlotIdx = Math.floor(start / 10);
                const endSlotIdx = Math.floor(end / 10);
                const dayCap = getDayCapacity(dayStr);

                for (let i = startSlotIdx; i < endSlotIdx; i++) {
                    // Note: dayCap is array of 144 slots (0-143). 
                    // start/10 might be > 143 if time > 24h (unlikely given logic, but safe to check)
                    if ((dayCap[i] || 0) >= config.maxConcurrentStudents) {
                        capacityOk = false;
                        break;
                    }
                }

                if (capacityOk) {
                    // BOOK IT

                    // Update Capacity
                    for (let i = startSlotIdx; i < endSlotIdx; i++) {
                        dayCap[i] = (dayCap[i] || 0) + 1;
                    }

                    // Update Student
                    const durationHours = targetDurationMinutes / 60;
                    student.sessions.push({
                        date: dayStr,
                        start: `${Math.floor(start / 60)}:${(start % 60).toString().padStart(2, '0')}`,
                        end: `${Math.floor(end / 60)}:${(end % 60).toString().padStart(2, '0')}`,
                        duration: durationHours
                    });
                    student.completedHours += durationHours;
                    student.daysTaken++;

                    // STRICT 1 SESSION PER DAY
                    break;
                }
            }
        }

        // Update Global Completion Count
        completedCount = students.filter(s => {
            const g = getGroup(s.groupId);
            return g && s.completedHours >= g.requiredHours - 0.01; // tolerance
        }).length;
    }

    return {
        success: completedCount === totalStudentsCount,
        completionDate: finalDate,
        completionRate,
        totalDays: allDays.length,
        studentResults: students,
        dailyUsage: dailyCapacity, // This format might need adjustment for the chart if it expects [start, end] ranges, but the dashboard uses this map primarily for heatmap/utilization
        messages
    };
};
