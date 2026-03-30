import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GoalType = "cut" | "maintain" | "bulk";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Gender = "male" | "female";

export interface WorkoutMetrics {
  height: number;
  weight: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  unit: "metric" | "imperial";
}

interface WorkoutContextType {
  metrics: WorkoutMetrics;
  updateMetrics: (data: Partial<WorkoutMetrics>) => void;
  isLoaded: boolean;
}

const defaultMetrics: WorkoutMetrics = {
  height: 170,
  weight: 70,
  age: 25,
  gender: "male",
  activityLevel: "moderate",
  unit: "metric"
};

const STORAGE_KEY = "@freshmind:workout_metrics_v2";

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [metrics, setMetrics] = useState<WorkoutMetrics>(defaultMetrics);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setMetrics({ ...defaultMetrics, ...JSON.parse(stored) });
        }
      } catch {
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const updateMetrics = useCallback(
    (data: Partial<WorkoutMetrics>) => {
      setMetrics((prev) => {
        const next = { ...prev, ...data };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  return (
    <WorkoutContext.Provider value={{ metrics, updateMetrics, isLoaded }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}
