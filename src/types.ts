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

export interface ClinicHours {
    weekdays: TimeSlot;
    saturday: TimeSlot;
}

export interface SimulationConfig {
    year: number;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    totalStudents: number;
    requiredHoursPerStudent: number;
    maxConcurrentStudents: number;
    minSessionHours: number;
    maxSessionHours: number;
    classBufferMinutes: number; // Buffer before/after class in minutes
    clinicHours: ClinicHours;
    blockedClassTimes: BlockedTime[];
    openDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    closedDays: string[]; // YYYY-MM-DD
    attendanceVariance: boolean; // Simulates random student behavior
}

export interface StudentProgress {
    studentId: number;
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
