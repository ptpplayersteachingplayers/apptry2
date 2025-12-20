/**
 * Onboarding Context and Hook
 *
 * Manages onboarding data persistence across all onboarding screens.
 * Collects location, age, skill level, and interests before final submission.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { USState, AgeBand, SkillLevel, MainInterest, OnboardingData } from '../types';

interface OnboardingState {
  state: USState | null;
  city: string | null;
  ageBand: AgeBand | null;
  skillLevel: SkillLevel | null;
  mainInterest: MainInterest | null;
}

interface OnboardingContextType {
  data: OnboardingState;
  setLocation: (state: USState, city: string) => void;
  setAgeBand: (ageBand: AgeBand) => void;
  setSkillLevel: (skillLevel: SkillLevel) => void;
  setMainInterest: (interest: MainInterest) => void;
  getOnboardingData: () => OnboardingData | null;
  resetOnboarding: () => void;
  isComplete: boolean;
}

const initialState: OnboardingState = {
  state: null,
  city: null,
  ageBand: null,
  skillLevel: null,
  mainInterest: null,
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

interface OnboardingProviderProps {
  children: ReactNode;
}

/**
 * OnboardingProvider - Wraps onboarding screens and provides data persistence
 */
export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [data, setData] = useState<OnboardingState>(initialState);

  const setLocation = useCallback((state: USState, city: string) => {
    setData((prev) => ({ ...prev, state, city }));
  }, []);

  const setAgeBand = useCallback((ageBand: AgeBand) => {
    setData((prev) => ({ ...prev, ageBand }));
  }, []);

  const setSkillLevel = useCallback((skillLevel: SkillLevel) => {
    setData((prev) => ({ ...prev, skillLevel }));
  }, []);

  const setMainInterest = useCallback((mainInterest: MainInterest) => {
    setData((prev) => ({ ...prev, mainInterest }));
  }, []);

  const getOnboardingData = useCallback((): OnboardingData | null => {
    if (!data.state || !data.city || !data.ageBand || !data.skillLevel || !data.mainInterest) {
      return null;
    }
    return {
      state: data.state,
      city: data.city,
      ageBand: data.ageBand,
      skillLevel: data.skillLevel,
      mainInterest: data.mainInterest,
    };
  }, [data]);

  const resetOnboarding = useCallback(() => {
    setData(initialState);
  }, []);

  const isComplete = !!(
    data.state &&
    data.city &&
    data.ageBand &&
    data.skillLevel &&
    data.mainInterest
  );

  return (
    <OnboardingContext.Provider
      value={{
        data,
        setLocation,
        setAgeBand,
        setSkillLevel,
        setMainInterest,
        getOnboardingData,
        resetOnboarding,
        isComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

/**
 * useOnboarding - Hook to access onboarding context
 */
export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default useOnboarding;
