import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GoalType = "cut" | "maintain" | "bulk";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type Gender = "male" | "female";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface ExerciseSet {
  reps: number;
  weight: number; // kg
  rpe?: number; // Rate of Perceived Exertion 1-10
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  programName: string;
  exercises: WorkoutExercise[];
  durationMin: number;
  notes?: string;
}

export interface BodyMetric {
  date: string;
  weight: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
}

export interface WorkoutSettings {
  height: number; // cm
  weight: number; // kg
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: GoalType;
}

export interface CustomProgram {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  targetDays: string[];
}

export interface WorkoutState {
  settings: WorkoutSettings;
  sessions: WorkoutSession[];
  bodyMetrics: BodyMetric[];
  customPrograms: CustomProgram[];
  streakDays: number;
  totalSessionsCompleted: number;
}

interface WorkoutContextType {
  workout: WorkoutState;
  updateSettings: (data: Partial<WorkoutSettings>) => void;
  logSession: (session: WorkoutSession) => void;
  addBodyMetric: (metric: BodyMetric) => void;
  saveCustomProgram: (program: CustomProgram) => void;
  deleteCustomProgram: (id: string) => void;
  deleteSession: (id: string) => void;
  isLoaded: boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultSettings: WorkoutSettings = {
  height: 170,
  weight: 70,
  age: 25,
  gender: "male",
  activityLevel: "moderate",
  goal: "maintain",
};

const defaultState: WorkoutState = {
  settings: defaultSettings,
  sessions: [],
  bodyMetrics: [],
  customPrograms: [],
  streakDays: 0,
  totalSessionsCompleted: 0,
};

const STORAGE_KEY = "@freshmind:workout_v1";

// ─── Context ──────────────────────────────────────────────────────────────────

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workout, setWorkout] = useState<WorkoutState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as WorkoutState;
          setWorkout({
            ...defaultState,
            ...parsed,
            settings: { ...defaultSettings, ...parsed.settings },
          });
        }
      } catch {
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const save = useCallback(async (state: WorkoutState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, []);

  const update = useCallback(
    (updater: (prev: WorkoutState) => WorkoutState) => {
      setWorkout((prev) => {
        const next = updater(prev);
        save(next);
        return next;
      });
    },
    [save]
  );

  const updateSettings = useCallback(
    (data: Partial<WorkoutSettings>) =>
      update((p) => ({ ...p, settings: { ...p.settings, ...data } })),
    [update]
  );

  const logSession = useCallback(
    (session: WorkoutSession) =>
      update((p) => {
        const sessions = [session, ...p.sessions].slice(0, 500); // keep max 500
        return {
          ...p,
          sessions,
          totalSessionsCompleted: p.totalSessionsCompleted + 1,
        };
      }),
    [update]
  );

  const addBodyMetric = useCallback(
    (metric: BodyMetric) =>
      update((p) => ({
        ...p,
        bodyMetrics: [metric, ...p.bodyMetrics].slice(0, 365),
      })),
    [update]
  );

  const saveCustomProgram = useCallback(
    (program: CustomProgram) =>
      update((p) => {
        const existing = p.customPrograms.findIndex((cp) => cp.id === program.id);
        const programs =
          existing >= 0
            ? p.customPrograms.map((cp) => (cp.id === program.id ? program : cp))
            : [...p.customPrograms, program];
        return { ...p, customPrograms: programs };
      }),
    [update]
  );

  const deleteCustomProgram = useCallback(
    (id: string) =>
      update((p) => ({
        ...p,
        customPrograms: p.customPrograms.filter((cp) => cp.id !== id),
      })),
    [update]
  );

  const deleteSession = useCallback(
    (id: string) =>
      update((p) => ({
        ...p,
        sessions: p.sessions.filter((s) => s.id !== id),
      })),
    [update]
  );

  return (
    <WorkoutContext.Provider
      value={{
        workout,
        updateSettings,
        logSession,
        addBodyMetric,
        saveCustomProgram,
        deleteCustomProgram,
        deleteSession,
        isLoaded,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error("useWorkout must be inside WorkoutProvider");
  return ctx;
}
