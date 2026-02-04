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
    blockedTimes: BlockedTime[]
): boolean => {
    const dayBlocks = blockedTimes.filter(b => b.dayOfWeek === dayOfWeekStr);

    for (const block of dayBlocks) {
        const period = CLASS_PERIODS.find(p => p.period === block.period);
        if (!period) continue;

        const blockStart = timeToMinutes(period.startTime);
        const blockEnd = timeToMinutes(period.endTime);

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
        sessions: []
    }));

    // Global availability map: date string -> array of 144 (10-min slots for 24h) representing current student count
    // 08:30 is slot 51 (8*6 + 3 = 51)
    // Actually let's just use minute-arrays or a more sparse structure if needed. 
    // Given 100 students and 1 year, a dense map is fine. 
    // 144 slots * 365 days is small.
    // We only track "clinic open hours" really.
    const dailyCapacity: Record<string, number[]> = {};

    const getDayCapacity = (dateStr: string) => {
        if (!dailyCapacity[dateStr]) {
            dailyCapacity[dateStr] = new Array(1440).fill(0); // minute-by-minute resolution for simplicity or 10-min to save space
            // Let's use 10-minute slots: 24 * 6 = 144 slots total
        }
        return dailyCapacity[dateStr];
    };

    // Simulation Loop
    // Strategy: For each day, try to schedule students who haven't finished.
    // Optimization: Round Robin or First-Come-First-Served?
    // Realistically, students sign up. FCFS per day is reasonable simulation.

    let completedCount = 0;
    let finalDate: string | null = null;
    const messages: string[] = [];

    for (const day of allDays) {
        if (completedCount >= config.totalStudents) {
            finalDate = format(day, 'yyyy-MM-dd');
            break;
        }

        const dayOfWeek = getDay(day); // 0=Sun, 6=Sat
        if (dayOfWeek === 0) continue; // Sunday closed (assumed based on prompt saying "Sat open", implied Sun closed or not mentioned. Prompt says Sat 09:30-16:00, Weekdays 08:30-20:30)

        const dayStr = format(day, 'yyyy-MM-dd');
        const dayOfWeekStr = DAY_MAP[dayOfWeek] as any;

        // Determine clinic hours for today
        const hours = dayOfWeek === 6 ? config.clinicHours.saturday : config.clinicHours.weekdays;
        const openMin = timeToMinutes(hours.start);
        const closeMin = timeToMinutes(hours.end);

        // Shuffle students to simulate random booking order each day
        // Or iterate sequentially to ensure fairness? Let's shuffle.
        const activeStudents = students.filter(s => s.completedHours < config.requiredHoursPerStudent);
        // Simple shuffle
        activeStudents.sort(() => Math.random() - 0.5);

        for (const student of activeStudents) {
            if (student.completedHours >= config.requiredHoursPerStudent) continue;

            // Try to find a slot
            // Valid durations: 2h (120m) to 5h (300m)
            // Check for blocked class times

            // We want to maximize session length? Or just find *any* valid slot?
            // Greedy approach: Find earliest possible start time, then extend as long as possible up to 5h.

            // Iterate through day in 10-min steps
            for (let start = openMin; start <= closeMin - (config.minSessionHours * 60); start += 10) {
                // Potential start found.
                // Check if student has class at this start time (should verify "during session" too)

                // Let's define the max possible duration from this start point
                let maxDuration = 0;

                // Scan ahead minute by minute (or 10m blocks)
                for (let d = 10; d <= config.maxSessionHours * 60; d += 10) {
                    const currentEnd = start + d;

                    // 1. Check clinic closing
                    if (currentEnd > closeMin) break;

                    // 2. Check student class blocks (only for the new 10m chunk added)
                    // We check the interval [currentEnd-10, currentEnd]
                    if (isBlocked(dayOfWeekStr, currentEnd - 10, currentEnd, config.blockedClassTimes)) {
                        break;
                    }

                    // 3. Check Clinic Capacity
                    // We need to check if *adding* this student would exceed capacity in this interval
                    // But we first need to see if we CAN schedule.
                    // Capacity check is tricky because other students are already booked.
                    // We need to check the `dailyCapacity` array.
                    // We'll update capacity AFTER committing. 
                    // So here we temporarily check.
                    let capacityOk = true;
                    // Check specific 10m slot
                    // Assuming 10m resolution for capacity array index:
                    const slotIdx = Math.floor((currentEnd - 10) / 10);
                    // Note: date-fns `getDay` returns 0-6. 
                    // We need to be careful with indexing. 
                    // 144 slots. 00:00 -> idx 0. 00:10 -> idx 1.

                    const currentCapacity = getDayCapacity(dayStr)[slotIdx] || 0;
                    if (currentCapacity >= config.maxConcurrentStudents) {
                        capacityOk = false;
                    }

                    if (!capacityOk) break;

                    // If all good, this duration is valid so far
                    maxDuration = d;
                }

                // If we found a valid duration >= minSessionHours
                if (maxDuration >= config.minSessionHours * 60) {
                    // Book it!
                    const sessionEnd = start + maxDuration;

                    // Record session
                    student.sessions.push({
                        date: dayStr,
                        start: `${Math.floor(start / 60)}:${(start % 60).toString().padStart(2, '0')}`,
                        end: `${Math.floor(sessionEnd / 60)}:${(sessionEnd % 60).toString().padStart(2, '0')}`,
                        duration: maxDuration / 60
                    });
                    student.completedHours += maxDuration / 60;

                    // Update Capacity Map
                    const dayCap = getDayCapacity(dayStr);
                    const startSlot = Math.floor(start / 10);
                    const endSlot = Math.floor(sessionEnd / 10);

                    for (let i = startSlot; i < endSlot; i++) {
                        if (dayCap[i] === undefined) dayCap[i] = 0;
                        dayCap[i]++;
                    }

                    // Student is done for the day (assuming 1 session per day)
                    break;
                }
            }
        }

        // Check completion
        completedCount = students.filter(s => s.completedHours >= config.requiredHoursPerStudent).length;
    }

    // Generate nice daily usage stats
    // ...

    return {
        success: completedCount === config.totalStudents,
        completionDate: finalDate,
        totalDays: allDays.length,
        studentResults: students,
        dailyUsage: dailyCapacity,
        messages
    };
};
