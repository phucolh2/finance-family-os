import type { AppState, PersistedAppState } from '../types/finance';

/**
 * Validates whether an object matches the AppState schema.
 */
export function validateAppState(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  // Check critical fields
  if (!data.profile || typeof data.profile !== 'object') return false;
  if (!data.assumptions || typeof data.assumptions !== 'object') return false;
  
  if (!Array.isArray(data.incomeSchedule)) return false;
  if (!Array.isArray(data.budgetSchedule)) return false;
  if (!Array.isArray(data.assets)) return false;
  if (!Array.isArray(data.lifeEvents)) return false;

  return true;
}

/**
 * Migrates old persisted states to the current version.
 * If migration fails or state is corrupted, returns defaultState safely.
 */
export function migrateState(stored: any, defaultState: AppState): AppState {
  try {
    if (!stored || typeof stored !== 'object') {
      return defaultState;
    }

    // 1. If stored state has schema version structure
    let data: any = null;
    const version = Number(stored.schemaVersion);

    if (version === 1) {
      data = stored.data;
    } else if (validateAppState(stored)) {
      // Direct raw AppState imported without version wrapper
      data = stored;
    }

    if (!data || !validateAppState(data)) {
      console.warn('Migration: Invalid or corrupted state layout. Resetting to default.');
      return defaultState;
    }

    // 2. Map fields defensively
    return {
      profile: {
        ...defaultState.profile,
        ...data.profile,
      },
      incomeSchedule: Array.isArray(data.incomeSchedule) ? data.incomeSchedule : defaultState.incomeSchedule,
      budgetSchedule: (() => {
        const rawSchedule = Array.isArray(data.budgetSchedule) ? data.budgetSchedule : defaultState.budgetSchedule;
        return rawSchedule.map((item: any) => {
          if (!item || typeof item !== 'object') return item;
          let rootGroups = item.rootGroups;
          if (!rootGroups || rootGroups.length === 0) {
            const flatRatios = Array.isArray(item.ratios) ? item.ratios : [];
            const newTree = JSON.parse(JSON.stringify(defaultState.budgetSchedule[0].rootGroups));
            newTree.forEach((group: any) => {
              const matchedFlat = flatRatios.find(
                (r: any) => 
                  r.group === group.groupId || 
                  (group.groupId === 'housing_basic' && r.categoryId === 'housing-basic') ||
                  (group.groupId === 'future_investing' && r.categoryId === 'future-investing') ||
                  (group.groupId === 'safety_reserve' && r.categoryId === 'safety-reserve') ||
                  (group.groupId === 'family_experience' && r.categoryId === 'family-experience') ||
                  (group.groupId === 'health_growth' && r.categoryId === 'health-growth')
              );
              if (matchedFlat) {
                group.ratioPercent = matchedFlat.ratioPercent;
                if (group.children && group.children.length > 0) {
                  const defaultChildrenSum = group.children.reduce((sum: number, c: any) => sum + c.ratioPercent, 0);
                  if (defaultChildrenSum > 0) {
                    let remaining = group.ratioPercent;
                    group.children.forEach((child: any, idx: number) => {
                      if (idx === group.children.length - 1) {
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
            ...item,
            rootGroups,
          };
        });
      })(),
      lifeStages: Array.isArray(data.lifeStages) ? data.lifeStages : defaultState.lifeStages,
      lifeEvents: Array.isArray(data.lifeEvents) ? data.lifeEvents : defaultState.lifeEvents,
      assets: (() => {
        const rawAssets = Array.isArray(data.assets) ? data.assets : defaultState.assets;
        const safeNum = (v: any) => {
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

        const migratedList: any[] = [];
        
        rawAssets.forEach((asset: any) => {
          if (!asset || typeof asset !== 'object') return;
          const newType = oldAssetIdToNewAssetId[asset.type] || asset.type;
          
          if (migratedList.some(a => a.type === newType)) return;
          
          migratedList.push({
            ...asset,
            type: newType,
            name: newType === 'fx_reserve_usd' ? 'Dự trữ ngoại hối (USD)' :
                  newType === 'real_estate' ? 'Bất Động Sản' :
                  newType === 'stocks' ? 'Chứng Khoán' :
                  newType === 'gold' ? 'Vàng' :
                  asset.name,
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

        const standardTypes = ['fx_reserve_usd', 'gold', 'real_estate', 'stocks', 'crypto'];
        const finalAssets: any[] = [];

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
        ...data.assumptions,
      },
      investmentDeals: Array.isArray(data.investmentDeals) ? data.investmentDeals : defaultState.investmentDeals,
      resolvedMonthlyDb: Array.isArray(data.resolvedMonthlyDb) ? data.resolvedMonthlyDb : undefined,
      resolvedMonthlyDbMap: data.resolvedMonthlyDbMap && typeof data.resolvedMonthlyDbMap === 'object' ? data.resolvedMonthlyDbMap : undefined,
    };
  } catch (err) {
    console.error('Migration failed. Resetting to defaultState to prevent crash.', err);
    return defaultState;
  }
}
