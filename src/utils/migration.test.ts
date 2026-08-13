import { describe, it, expect } from 'vitest';
import { validateAppState, migrateState } from './migration';
import { 
  DEFAULT_FAMILY_PROFILE, 
  DEFAULT_INCOME_CATEGORIES, 
  DEFAULT_INCOME_SCHEDULE,
  DEFAULT_BUDGET_SCHEDULE,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_LIFE_STAGES,
  DEFAULT_ASSETS,
  DEFAULT_LIFE_EVENTS,
  DEFAULT_INVESTMENT_DEALS,
  DEFAULT_SINKING_FUNDS
} from '../data/defaultInputs';
import { AppState } from '../types/finance';

const mockDefaultState: AppState = {
  profile: DEFAULT_FAMILY_PROFILE,
  incomeCategories: DEFAULT_INCOME_CATEGORIES,
  incomeSchedule: DEFAULT_INCOME_SCHEDULE,
  budgetSchedule: DEFAULT_BUDGET_SCHEDULE,
  assumptions: DEFAULT_ASSUMPTIONS,
  lifeStages: DEFAULT_LIFE_STAGES,
  assets: DEFAULT_ASSETS,
  lifeEvents: DEFAULT_LIFE_EVENTS,
  investmentDeals: DEFAULT_INVESTMENT_DEALS,
  sinkingFunds: DEFAULT_SINKING_FUNDS,
  savingsDeposits: [],
  debts: [],
  fundTransfers: [],
};

describe('migration utilities', () => {
  describe('validateAppState', () => {
    it('should return failure for null or non-object', () => {
      expect(validateAppState(null).success).toBe(false);
      expect(validateAppState(undefined).success).toBe(false);
      expect(validateAppState('not an object').success).toBe(false);
    });

    it('should validate a correct AppState object', () => {
      expect(validateAppState(mockDefaultState).success).toBe(true);
    });

    it('should fail validation if required fields are missing', () => {
      const invalidState = { ...mockDefaultState, profile: undefined as any };
      const res = validateAppState(invalidState);
      expect(res.success).toBe(false);
      expect(res.error).toContain('profile');
    });
  });

  describe('migrateState', () => {
    it('should return defaultState for null, undefined or non-object input', () => {
      expect(migrateState(null, mockDefaultState)).toEqual(mockDefaultState);
      expect(migrateState(undefined, mockDefaultState)).toEqual(mockDefaultState);
      expect(migrateState('string', mockDefaultState)).toEqual(mockDefaultState);
    });

    it('should handle version 1 schema correctly', () => {
      const version1State = {
        schemaVersion: 1,
        data: {
          ...mockDefaultState,
          profile: { ...mockDefaultState.profile, husbandName: 'Version 1 User' }
        }
      };
      
      const migrated = migrateState(version1State, mockDefaultState);
      expect(migrated.profile.husbandName).toBe('Version 1 User');
    });

    it('should fallback to default state if data is invalid/corrupted', () => {
      const corruptedState = {
        schemaVersion: 1,
        data: {
          profile: 'Invalid profile string' // Profile should be an object
        }
      };
      
      const migrated = migrateState(corruptedState, mockDefaultState);
      expect(migrated).toEqual(mockDefaultState);
    });

    it('should merge missing properties from defaultState', () => {
      const partialState = {
        ...mockDefaultState,
        debts: undefined, // Missing optional field
        fundTransfers: undefined
      };
      
      const migrated = migrateState(partialState, mockDefaultState);
      expect(migrated.debts).toEqual([]);
      expect(migrated.fundTransfers).toEqual([]);
    });

    it('should process budgetSchedule and add missing groups/ratios', () => {
      const stateWithOldBudget = {
        ...mockDefaultState,
        budgetSchedule: [
          {
            startMonth: 1,
            startYear: 2026,
            ratios: [
              { group: 'housing_basic', ratioPercent: 40 }
            ]
          }
        ]
      };
      const migrated = migrateState(stateWithOldBudget, mockDefaultState);
      expect(migrated.budgetSchedule[0].rootGroups).toBeDefined();
      expect(migrated.budgetSchedule[0].rootGroups.length).toBeGreaterThan(0);
    });

    it('should migrate legacy asset types', () => {
      const stateWithLegacyAssets = {
        ...mockDefaultState,
        assets: [
          { type: 'usd', targetAllocationPercent: 50 },
          { type: 'Bất động sản', targetAllocationPercent: 50 }
        ]
      };
      
      const migrated = migrateState(stateWithLegacyAssets, mockDefaultState);
      const types = migrated.assets.map(a => a.type);
      expect(types).toContain('fx_reserve_usd');
      expect(types).toContain('real_estate');
    });

    it('should auto-migrate earmarked investmentDeals to sinkingFunds', () => {
      const stateWithEarmarkedDeals = {
        ...mockDefaultState,
        sinkingFunds: [],
        investmentDeals: [
          { id: 'deal1', isEarmarked: true, capital: 500 },
          { id: 'deal2', isEarmarked: false, capital: 1000 }
        ]
      };
      
      const migrated = migrateState(stateWithEarmarkedDeals, mockDefaultState);
      
      // Earmarked deals should be removed from investmentDeals
      expect(migrated.investmentDeals.length).toBe(1);
      expect(migrated.investmentDeals[0].id).toBe('deal2');

      // They should appear in sinkingFunds
      expect(migrated.sinkingFunds.length).toBeGreaterThan(0);
      expect(migrated.sinkingFunds[0].id).toBe('sf_deal1');
      expect(migrated.sinkingFunds[0].targetAmount).toBe(500);
    });

    it('should catch exceptions and return default state safely', () => {
      const errorThrowingState = {
        get schemaVersion() { throw new Error('Simulated exception'); }
      };
      
      const migrated = migrateState(errorThrowingState, mockDefaultState);
      expect(migrated).toEqual(mockDefaultState);
    });
  });
});
