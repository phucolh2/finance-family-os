import type { AppState } from '../types/finance';
import type { AssetConfig } from '../types/portfolio';
import type { BudgetRatioScheduleItem, BudgetTreeNode } from '../types/budget';

/**
 * Validates whether an object matches the AppState schema.
 */
export function validateAppState(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const d = data as Record<string, unknown>;

  // Check critical fields
  if (!d.profile || typeof d.profile !== 'object') return false;
  if (!d.assumptions || typeof d.assumptions !== 'object') return false;
  
  if (!Array.isArray(d.incomeSchedule)) return false;
  if (!Array.isArray(d.budgetSchedule)) return false;
  if (!Array.isArray(d.assets)) return false;
  if (!Array.isArray(d.lifeEvents)) return false;

  return true;
}

/**
 * Migrates old persisted states to the current version.
 * If migration fails or state is corrupted, returns defaultState safely.
 */
export function migrateState(stored: unknown, defaultState: AppState): AppState {
  try {
    if (!stored || typeof stored !== 'object') {
      return defaultState;
    }

    const s = stored as Record<string, unknown>;

    // 1. If stored state has schema version structure
    let data: Record<string, unknown> | null = null;
    const version = Number(s.schemaVersion);

    if (version === 1) {
      data = s.data as Record<string, unknown>;
    } else if (validateAppState(stored)) {
      // Direct raw AppState imported without version wrapper
      data = s;
    }

    if (!data || !validateAppState(data)) {
      console.warn('Migration: Invalid or corrupted state layout. Resetting to default.');
      return defaultState;
    }

    // 2. Map fields defensively
    return {
      profile: {
        ...defaultState.profile,
        ...(data.profile as Record<string, unknown>),
      },
      incomeCategories: Array.isArray(data.incomeCategories) ? data.incomeCategories : defaultState.incomeCategories,
      incomeSchedule: Array.isArray(data.incomeSchedule) ? data.incomeSchedule : defaultState.incomeSchedule,
      budgetSchedule: (() => {
        const rawSchedule = Array.isArray(data.budgetSchedule) ? data.budgetSchedule : defaultState.budgetSchedule;
        return rawSchedule.map((item: unknown) => {
          if (!item || typeof item !== 'object') return item as BudgetRatioScheduleItem;
          const objItem = item as Record<string, unknown>;
          let rootGroups = objItem.rootGroups as BudgetTreeNode[];
          if (!Array.isArray(rootGroups) || rootGroups.length === 0) {
            const flatRatios = Array.isArray(objItem.ratios) ? objItem.ratios : [];
            const newTree = JSON.parse(JSON.stringify(defaultState.budgetSchedule[0].rootGroups)) as BudgetTreeNode[];
            newTree.forEach((group: BudgetTreeNode) => {
              const matchedFlat = flatRatios.find(
                (r: Record<string, unknown>) => 
                  r.group === group.groupId || 
                  (group.groupId === 'housing_basic' && r.categoryId === 'housing-basic') ||
                  (group.groupId === 'future_investing' && r.categoryId === 'future-investing') ||
                  (group.groupId === 'safety_reserve' && r.categoryId === 'safety-reserve') ||
                  (group.groupId === 'family_experience' && r.categoryId === 'family-experience') ||
                  (group.groupId === 'health_growth' && r.categoryId === 'health-growth')
              );
              if (matchedFlat) {
                group.ratioPercent = Number(matchedFlat.ratioPercent);
                if (group.children && group.children.length > 0) {
                  const defaultChildrenSum = group.children.reduce((sum: number, c: BudgetTreeNode) => sum + c.ratioPercent, 0);
                  if (defaultChildrenSum > 0) {
                    let remaining = group.ratioPercent;
                    group.children.forEach((child: BudgetTreeNode, idx: number) => {
                      if (group.children && idx === group.children.length - 1) {
                        child.ratioPercent = remaining;
                      } else {
                        const share = Math.round((child.ratioPercent / defaultChildrenSum) * group.ratioPercent * 10) / 10;
                        child.ratioPercent = share;
                        remaining = Math.round((remaining - share) * 10) / 10;
                      }
                    });
                  }
                }
              }
            });
            rootGroups = newTree;
          }
          return {
            ...objItem,
            rootGroups,
          } as unknown as BudgetRatioScheduleItem;
        });
      })(),
      lifeStages: Array.isArray(data.lifeStages) ? data.lifeStages : defaultState.lifeStages,
      lifeEvents: Array.isArray(data.lifeEvents) ? data.lifeEvents : defaultState.lifeEvents,
      assets: (() => {
        const rawAssets = Array.isArray(data.assets) ? data.assets : defaultState.assets;
        const safeNum = (v: unknown) => {
          const n = Number(v);
          return isNaN(n) || !isFinite(n) ? 0 : n;
        };
        
        const oldAssetIdToNewAssetId: Record<string, string> = {
          'usd': 'fx_reserve_usd',
          'USD': 'fx_reserve_usd',
          'crypto': 'crypto',
          'Crypto': 'crypto',
          'property': 'real_estate',
          'real_estate': 'real_estate',
          'Bất động sản': 'real_estate',
          'stocks': 'stocks',
          'Chứng khoán': 'stocks',
        };

        const migratedList: AssetConfig[] = [];
        
        rawAssets.forEach((asset: unknown) => {
          if (!asset || typeof asset !== 'object') return;
          const a = asset as Record<string, unknown>;
          const assetType = String(a.type);
          const newType = oldAssetIdToNewAssetId[assetType] || assetType;
          
          if (migratedList.some(migrated => migrated.type === newType)) return;
          
          migratedList.push({
            ...(a as unknown as AssetConfig),
            type: newType as AssetConfig['type'],
            name: newType === 'fx_reserve_usd' ? 'Dự trữ ngoại hối (USD)' :
                  newType === 'real_estate' ? 'Bất Động Sản' :
                  newType === 'stocks' ? 'Chứng Khoán' :
                  newType === 'gold' ? 'Vàng' :
                  (typeof a.name === 'string' ? a.name : ''),
          });
        });

        if (!migratedList.some(a => a.type === 'gold')) {
          migratedList.push({
            id: 'asset_gold',
            type: 'gold',
            name: 'Vàng',
            beginningBalance: 0,
            targetAllocationPercent: 10,
            expectedReturnRateAnnual: 6,
            notes: 'Tài sản phòng thủ chống lạm phát',
          });
        }

        const standardTypes: AssetConfig['type'][] = ['fx_reserve_usd', 'gold', 'real_estate', 'stocks', 'crypto'];
        const finalAssets: AssetConfig[] = [];

        standardTypes.forEach((type) => {
          const existing = migratedList.find(a => a.type === type);
          if (existing) {
            finalAssets.push(existing);
          } else {
            const defAsset = defaultState.assets.find(a => a.type === type);
            if (defAsset) {
              finalAssets.push({ ...defAsset });
            }
          }
        });

        const totalAllocation = finalAssets.reduce((sum, a) => sum + safeNum(a.targetAllocationPercent), 0);
        if (Math.abs(totalAllocation - 100) > 0.01) {
          finalAssets.forEach((a) => {
            const defAsset = defaultState.assets.find(da => da.type === a.type);
            if (defAsset) {
              a.targetAllocationPercent = defAsset.targetAllocationPercent;
            }
          });
        }

        return finalAssets;
      })(),
      assumptions: {
        ...defaultState.assumptions,
        ...(data.assumptions as Record<string, unknown>),
      },
      expenseSchedule: Array.isArray(data.expenseSchedule) ? data.expenseSchedule : defaultState.expenseSchedule,
      investmentDeals: (() => {
        const rawDeals = Array.isArray(data.investmentDeals) ? data.investmentDeals : defaultState.investmentDeals;
        return rawDeals?.filter((d: any) => !d.isEarmarked) || [];
      })(),
      sinkingFunds: (() => {
        const funds: import('../types/finance').SinkingFund[] = [];
        // 1. Keep existing sinking funds if they already exist in schema
        if (Array.isArray(data.sinkingFunds)) {
          funds.push(...data.sinkingFunds);
        }
        // 2. Automigrate earmarked deals from old format
        const rawDeals = Array.isArray(data.investmentDeals) ? data.investmentDeals : defaultState.investmentDeals;
        const earmarkedDeals = rawDeals?.filter((d: any) => d.isEarmarked) || [];
        earmarkedDeals.forEach((d: any) => {
          funds.push({
            id: `sf_${d.id}`,
            name: d.name || 'Quỹ tích lũy',
            targetAssetType: d.assetType || 'real_estate',
            targetAmount: d.capital || 0,
            initialDeposit: d.capital || 0, // Legacy behavior: put all capital initially
            monthlyContribution: 0, 
            interestRateAnnual: d.expectedSavingRate || 0,
            startMonth: d.startMonth || 1,
            startYear: d.startYear || 2024,
            status: d.isConverted || d.status === 'settled' ? 'disbursed' : 'active',
            disbursedMonth: d.conversionMonth || d.endMonth,
            disbursedYear: d.conversionYear || d.endYear,
            notes: d.notes,
          });
        });
        return funds;
      })(),
      savingsDeposits: Array.isArray(data.savingsDeposits) ? data.savingsDeposits : [],
      resolvedMonthlyDb: Array.isArray(data.resolvedMonthlyDb) ? data.resolvedMonthlyDb : undefined,
      resolvedMonthlyDbMap: data.resolvedMonthlyDbMap && typeof data.resolvedMonthlyDbMap === 'object' ? data.resolvedMonthlyDbMap as AppState['resolvedMonthlyDbMap'] : undefined,
    };
  } catch (err) {
    console.error('Migration failed. Resetting to defaultState to prevent crash.', err);
    return defaultState;
  }
}
