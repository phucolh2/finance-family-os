import { runProjection } from './projectionEngine';
import type { ProjectionOutput } from '../types/projection';
import type { AppState } from '../types/finance';

export interface ScenarioOverrides {
  childBirthMonth?: number;
  childBirthYear?: number;
}

/**
 * Pure scenario run engine.
 * Merges overrides onto base AppState config and executes the exact same runProjection engine.
 * Ensures zero custom formulas are created specifically for scenarios.
 */
export function runScenario(baseState: AppState, overrides: ScenarioOverrides): ProjectionOutput {
  // Clone to avoid mutations
  const resolvedState = {
    profile: {
      ...baseState.profile,
      childBirthMonth: overrides.childBirthMonth !== undefined ? overrides.childBirthMonth : baseState.profile.childBirthMonth,
      childBirthYear: overrides.childBirthYear !== undefined ? overrides.childBirthYear : baseState.profile.childBirthYear,
    },
    incomeSchedule: baseState.incomeSchedule,
    budgetSchedule: baseState.budgetSchedule,
    lifeEvents: baseState.lifeEvents,
    assets: baseState.assets,
    assumptions: baseState.assumptions,
  };

  return runProjection(resolvedState);
}
export type ScenarioOverridesInput = ScenarioOverrides;
