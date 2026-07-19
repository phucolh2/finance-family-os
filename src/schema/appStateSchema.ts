import { z } from 'zod';

// Core profile
const FamilyProfileSchema = z.object({
  husbandName: z.string().optional().default(''),
  wifeName: z.string().optional().default(''),
  husbandAgeAtStart: z.number().default(30),
  wifeAgeAtStart: z.number().default(30),
  planningStartMonth: z.number().default(1),
  planningStartYear: z.number().default(new Date().getFullYear()),
  planningEndMonth: z.number().default(12),
  planningEndYear: z.number().default(new Date().getFullYear() + 60),
  currency: z.literal('VND_MILLION').default('VND_MILLION'),
}).passthrough();

// Ensure these arrays exist and are arrays
export const AppStateSchema = z.object({
  profile: FamilyProfileSchema,
  incomeCategories: z.array(z.any()).optional().default([]),
  incomeSchedule: z.array(z.any()).default([]),
  budgetSchedule: z.array(z.any()).default([]),
  expenseSchedule: z.array(z.any()).default([]),
  lifeStages: z.array(z.any()).default([]),
  lifeEvents: z.array(z.any()).default([]),
  assets: z.array(z.any()).default([]),
  assumptions: z.object({
    generalInflationRateAnnual: z.number().default(4),
    educationInflationRateAnnual: z.number().default(6),
    medicalInflationRateAnnual: z.number().default(8),
    investmentYieldExpectationAnnual: z.number().default(8),
    savingsInterestRateAnnual: z.number().default(5),
    nonTermInterestRateSchedule: z.array(z.any()).optional(),
  }).passthrough(),
  investmentDeals: z.array(z.any()).optional().default([]),
  savingsDeposits: z.array(z.any()).optional().default([]),
  sinkingFunds: z.array(z.any()).optional().default([]),
  debts: z.array(z.any()).optional().default([]),
  projectionAdjustments: z.array(z.any()).optional(),
  // Derived state shouldn't be required in backup, but can be passed through
  resolvedMonthlyDb: z.array(z.any()).optional(),
  resolvedMonthlyDbMap: z.record(z.string(), z.any()).optional(),
}).passthrough();
