export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface TimeSlot {
    start: string; // HH:mm
    end: string;   // HH:mm
}

export interface ClassPeriod {
    period: number; // 1-5
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
}

export interface BlockedTime {
    dayOfWeek: DayOfWeek;
    period: number; // 1-5
}

// Map: 0(Sun) -> 6(Sat) to { start, end } or null (closed)
export type WeeklySchedule = Record<number, TimeSlot | null>;


export interface StudentGroup {
    id: string;
    name: string;
    description?: string; // e.g. "3rd Grade"
    count: number;
    requiredHours: number;
    blockedClassTimes: BlockedTime[];
    color: string; // Hex code for graphs
}

export interface SimulationConfig {
    year: number;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD

    // Global Constraints
    maxConcurrentStudents: number;
    dailySessionDuration: number; // Training time/day/person (Strict)
    classBufferMinutes: number;

    // Schedule
    weeklySchedule: WeeklySchedule; // Replaces clinicHours + openDays
    closedDays: string[]; // YYYY-MM-DD

    // Options
    enableClassSchedule: boolean; // If false, blockedClassTimes are ignored
    attendanceVariance: boolean;

    // Groups
    groups: StudentGroup[];
}

export interface StudentProgress {
    studentId: number;
    groupId: string; // New
    completedHours: number;
    bookingProbability: number; // 0.0 - 1.0 (New)
    daysTaken: number; // Count of unique days attended (New)
    sessions: {
        date: string;
        start: string;
        end: string;
        duration: number;
    }[];
}

export interface SimulationResult {
    success: boolean;
    completionDate: string | null;
    completionRate: number; // Percentage (Available Capacity / Required)
    totalDays: number;
    studentResults: StudentProgress[];
    dailyUsage: Record<string, number[]>; // map of date string to array of student counts per 10min slot
    messages: string[];
}
