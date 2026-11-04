import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveCloudSnapshot, listCloudSnapshots, deleteCloudSnapshot } from './cloudBackup';
import type { AppState, PersistedAppState } from '../types/finance';

// Mock firebase/firestore
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    doc: vi.fn((_db, _col, _docId, _subCol, id) => ({ id, path: `${_col}/${_docId}/${_subCol}/${id}` })),
    setDoc: vi.fn().mockResolvedValue(undefined),
    getDoc: vi.fn(),
    getDocs: vi.fn().mockResolvedValue({
      size: 0,
      docs: [],
      forEach: vi.fn(),
    }),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };
});

// Mock firebaseConfig
vi.mock('./firebaseConfig', () => ({
  db: { app: {} },
}));

describe('cloudBackup service', () => {
  const dummyState: AppState = {
    profile: {
      husbandName: 'Phước',
      wifeName: 'Hồng',
      husbandAgeAtStart: 30,
      wifeAgeAtStart: 30,
      planningStartMonth: 1,
      planningStartYear: 2026,
      planningEndMonth: 12,
      planningEndYear: 2056,
      currency: 'VND_MILLION',
    },
    incomeSchedule: [],
    budgetSchedule: [],
    expenseSchedule: [],
    lifeStages: [],
    lifeEvents: [],
    assets: [],
    assumptions: {
      generalInflationRateAnnual: 4,
      educationInflationRateAnnual: 6,
      medicalInflationRateAnnual: 7,
      investmentYieldExpectationAnnual: 10,
      savingsInterestRateAnnual: 6,
    },
    investmentDeals: [],
    savingsDeposits: [],
    sinkingFunds: [],
    debts: [],
    fundTransfers: [],
    incomeCategories: [],
    projectionAdjustments: [],
  };

  const dummyPersisted: PersistedAppState = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: 'Chồng (Hoài Phước)',
    data: dummyState,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves cloud snapshot with correct metadata and strips heavy computed caches', async () => {
    const stateWithCache = {
      ...dummyState,
      resolvedMonthlyDb: [{ periodKey: '2026-11' } as any],
      resolvedMonthlyDbMap: { '2026-11': {} as any },
    };

    const snapshot = await saveCloudSnapshot(
      { ...dummyPersisted, data: stateWithCache },
      'Chồng (Hoài Phước)',
      'Bản test sao lưu',
      'manual'
    );

    expect(snapshot).not.toBeNull();
    expect(snapshot?.label).toBe('Bản test sao lưu');
    expect(snapshot?.createdBy).toBe('Chồng (Hoài Phước)');
    expect(snapshot?.reason).toBe('manual');
    expect(snapshot?.summary).toBeDefined();
    // Verify caches are stripped to protect Firestore index limits
    expect(snapshot?.data.data.resolvedMonthlyDb).toBeUndefined();
    expect(snapshot?.data.data.resolvedMonthlyDbMap).toBeUndefined();
  });

  it('handles empty listing gracefully', async () => {
    const list = await listCloudSnapshots();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });

  it('deletes cloud snapshot by id', async () => {
    const res = await deleteCloudSnapshot('snap_123');
    expect(res).toBe(true);
  });
});
