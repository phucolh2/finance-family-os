import { describe, it, expect } from 'vitest';
import { calculateBudget, rebuildTreeFromFlatRatios, collectLeafNodes } from './budgetEngine';
import { DEFAULT_BUDGET_TREE, DEFAULT_BUDGET_RATIOS } from '../data/defaultInputs';
import type { BudgetRatioScheduleItem, BudgetTreeNode } from '../types/budget';
import type { TimelinePeriod } from '../types/finance';

describe('budgetEngine', () => {
  const mockPeriod: TimelinePeriod = {
    index: 0,
    month: 1,
    year: 2026,
    yearOffset: 0,
    isFirstMonthOfYear: true
  };

  describe('rebuildTreeFromFlatRatios', () => {
    it('should scale children proportionally to match parent ratio', () => {
      // Modify flat ratios to change parent ratio
      const customRatios = DEFAULT_BUDGET_RATIOS.map(r => 
        r.group === 'housing_basic' ? { ...r, ratioPercent: 50 } : r
      );
      
      const tree = rebuildTreeFromFlatRatios(customRatios);
      const housingNode = tree.find(n => n.groupId === 'housing_basic');
      
      expect(housingNode?.ratioPercent).toBe(50);
      
      // Children sum should equal 50
      const childrenSum = housingNode?.children?.reduce((sum, c) => sum + c.ratioPercent, 0);
      expect(childrenSum).toBe(50);
    });
  });

  describe('collectLeafNodes', () => {
    it('should return active children for a valid group', () => {
      const activeGroup: BudgetTreeNode = {
        id: 'group1', parentId: null, level: 0, nodeType: 'group', groupId: 'g1',
        name: 'G1', ratioPercent: 100, isActive: true, classification: 'expense',
        children: [
          { id: 'c1', parentId: 'group1', level: 1, nodeType: 'item', groupId: 'g1', name: 'C1', ratioPercent: 60, isActive: true },
          { id: 'c2', parentId: 'group1', level: 1, nodeType: 'item', groupId: 'g1', name: 'C2', ratioPercent: 40, isActive: false }, // inactive
        ]
      };
      
      const leaves = collectLeafNodes(activeGroup);
      expect(leaves).toHaveLength(1);
      expect(leaves[0].id).toBe('c1');
      expect(leaves[0].classification).toBe('expense'); // Inherited
    });

    it('should return the group itself if no active children exist', () => {
      const emptyGroup: BudgetTreeNode = {
        id: 'group2', parentId: null, level: 0, nodeType: 'group', groupId: 'g2',
        name: 'G2', ratioPercent: 100, isActive: true, classification: 'savings'
      };
      
      const leaves = collectLeafNodes(emptyGroup);
      expect(leaves).toHaveLength(1);
      expect(leaves[0].id).toBe('group2');
    });

    it('should return empty array if node is inactive', () => {
      const inactiveGroup: BudgetTreeNode = {
        id: 'group3', parentId: null, level: 0, nodeType: 'group', groupId: 'g3',
        name: 'G3', ratioPercent: 100, isActive: false
      };
      
      const leaves = collectLeafNodes(inactiveGroup);
      expect(leaves).toHaveLength(0);
    });
  });

  describe('calculateBudget', () => {
    it('should calculate budget using default tree if schedule is empty', () => {
      const result = calculateBudget({
        period: mockPeriod,
        incomeMonthly: 100,
        budgetSchedule: []
      });
      
      expect(result.incomeMonthly).toBe(100);
      expect(result.totalAllocatedMonthly).toBe(100); // Because default ratios sum to 100%
      expect(result.categories.length).toBeGreaterThan(0);
    });

    it('should output warning if period is before first schedule', () => {
      const schedule: BudgetRatioScheduleItem[] = [
        {
          id: '1', effectiveMonth: 5, effectiveYear: 2026, rootGroups: DEFAULT_BUDGET_TREE, ratios: []
        }
      ];
      
      const result = calculateBudget({
        period: mockPeriod, // 1/2026
        incomeMonthly: 100,
        budgetSchedule: schedule
      });
      
      expect(result.warnings).toContain('Mốc thời gian hiện tại (2026-01) trước thời điểm hiệu lực của phân bổ đầu tiên. Mặc định chưa phân bổ.');
    });

    it('should pick the latest valid schedule', () => {
      const schedule: BudgetRatioScheduleItem[] = [
        {
          id: '1', effectiveMonth: 1, effectiveYear: 2026, rootGroups: DEFAULT_BUDGET_TREE, ratios: []
        },
        {
          id: '2', effectiveMonth: 6, effectiveYear: 2026, 
          allocationBaseAmount: 200, // Custom base
          rootGroups: DEFAULT_BUDGET_TREE, ratios: []
        }
      ];
      
      const result = calculateBudget({
        period: { ...mockPeriod, month: 7 }, // 7/2026 -> should pick id: 2
        incomeMonthly: 100,
        budgetSchedule: schedule
      });
      
      // Allocation base is 200, default tree sums to 100%, totalAllocated should be 200
      expect(result.totalAllocatedMonthly).toBe(200);
      // Warning for deficit since allocated > income
      expect(result.deficitMonthly).toBe(100);
    });

    it('should rebuild tree from flat ratios if rootGroups is empty', () => {
       const schedule: BudgetRatioScheduleItem[] = [
        {
          id: '1', effectiveMonth: 1, effectiveYear: 2026, rootGroups: [], ratios: DEFAULT_BUDGET_RATIOS
        }
       ];
       const result = calculateBudget({
        period: mockPeriod,
        incomeMonthly: 100,
        budgetSchedule: schedule
       });
       expect(result.categories.length).toBeGreaterThan(0);
    });

    it('should issue warnings if ratios are unbalanced', () => {
       const unbalancedTree = JSON.parse(JSON.stringify(DEFAULT_BUDGET_TREE)) as BudgetTreeNode[];
       unbalancedTree[0].ratioPercent = 90; // Make total main ratio = 160
       unbalancedTree[0].children![0].ratioPercent = 50; // Child sum won't match 90
       
       const schedule: BudgetRatioScheduleItem[] = [
        {
          id: '1', effectiveMonth: 1, effectiveYear: 2026, rootGroups: unbalancedTree, ratios: []
        }
       ];

       const result = calculateBudget({
        period: mockPeriod,
        incomeMonthly: 100,
        budgetSchedule: schedule
       });

       expect(result.warnings.some(w => w.includes('khác biệt so với mức chuẩn 100%'))).toBe(true);
       expect(result.warnings.some(w => w.includes('lệch so với tỷ lệ nhóm cha'))).toBe(true);
    });
  });
});
