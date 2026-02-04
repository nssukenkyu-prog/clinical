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
    clinicHours: ClinicHours;
    blockedClassTimes: BlockedTime[];
}

export interface StudentProgress {
    studentId: number;
    completedHours: number;
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
    totalDays: number;
    studentResults: StudentProgress[];
    dailyUsage: Record<string, number[]>; // map of date string to array of student counts per 10min slot
    messages: string[];
}
