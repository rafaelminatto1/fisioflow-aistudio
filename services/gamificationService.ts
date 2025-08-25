// services/gamificationService.ts
import { Achievement, AppointmentStatus, GamificationProgress } from '../types';
import { mockAchievements, mockGamificationProgress } from '../data/mockData';
import * as appointmentService from './appointmentService';
import * as patientService from './patientService';

const POINTS_CONFIG = {
    SESSION_COMPLETED: 50,
    PAIN_LOG_ENTRY: 10,
    EXERCISE_EVALUATION: 20, // Assuming this data would be available
};

// Leveling is based on total points
const getLevelFromPoints = (points: number): { level: number; xpForNextLevel: number } => {
    let level = 1;
    let xpForNextLevel = 100;
    let requiredPoints = 100;

    while (points >= requiredPoints) {
        level++;
        points -= requiredPoints;
        requiredPoints = Math.floor(requiredPoints * 1.5); // Increase requirement for next level
        xpForNextLevel = requiredPoints;
    }
    return { level, xpForNextLevel };
};

const calculateStreak = (dates: Date[]): number => {
    if (dates.length === 0) return 0;

    const sortedDates = dates
        .map(d => new Date(d.toDateString())) // Normalize to midnight
        .sort((a, b) => b.getTime() - a.getTime());

    const uniqueDates = Array.from(new Set(sortedDates.map(d => d.getTime()))).map(t => new Date(t));

    const today = new Date(new Date().toDateString());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Check if there is an activity today or yesterday to start the streak from
    let currentStreak = 0;
    let lastDate: Date | null = null;
    
    const firstDate = uniqueDates[0];
    if (firstDate.getTime() === today.getTime() || firstDate.getTime() === yesterday.getTime()) {
        currentStreak = 1;
        lastDate = firstDate;
    } else {
        return 0; // No activity today or yesterday, so streak is broken
    }
    
    for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = uniqueDates[i];
        const expectedPreviousDate = new Date(lastDate);
        expectedPreviousDate.setDate(lastDate.getDate() - 1);
        
        if (currentDate.getTime() === expectedPreviousDate.getTime()) {
            currentStreak++;
            lastDate = currentDate;
        } else {
            break; // Streak is broken
        }
    }

    return currentStreak;
};


export const getGamificationProgress = async (patientId: string): Promise<GamificationProgress> => {
    // Fetch all necessary data
    const [appointments, patient] = await Promise.all([
        appointmentService.getAppointmentsByPatientId(patientId),
        patientService.getPatientById(patientId),
        // evaluationService.getEvaluationsByPatientId(patientId) // would be added here
    ]);

    const painPoints = patient?.painPoints || [];

    // Calculate Points
    const completedSessions = appointments.filter(a => a.status === AppointmentStatus.Completed).length;
    let totalPoints = 0;
    totalPoints += completedSessions * POINTS_CONFIG.SESSION_COMPLETED;
    totalPoints += painPoints.length * POINTS_CONFIG.PAIN_LOG_ENTRY;
    // totalPoints += evaluations.length * POINTS_CONFIG.EXERCISE_EVALUATION;
    
    // Calculate Level
    const { level, xpForNextLevel } = getLevelFromPoints(totalPoints);
    
    // Calculate Streak
    const activityDates = [
        ...painPoints.map(log => new Date(log.date)),
        ...appointments.filter(a => a.status === AppointmentStatus.Completed).map(a => a.startTime),
    ];
    const streak = calculateStreak(activityDates);

    // Check Achievements
    const unlockedAchievements: Achievement[] = mockAchievements.map(ach => {
        let unlocked = false;
        switch (ach.id) {
            case 'streak_7':
                unlocked = streak >= 7;
                break;
            case 'sessions_10':
                unlocked = completedSessions >= 10;
                break;
            case 'pain_log_1':
                unlocked = painPoints.length > 0;
                break;
            case 'first_week':
                 unlocked = mockGamificationProgress.treatmentProgress > 0.25; // Mocking this logic
                 break;
            case 'level_5':
                 unlocked = level >= 5;
                 break;
            case 'perfect_month':
                 unlocked = streak >= 30;
                 break;
        }
        return { ...ach, unlocked };
    });

    return {
        points: totalPoints,
        level,
        xpForNextLevel,
        streak,
        achievements: unlockedAchievements,
    };
};