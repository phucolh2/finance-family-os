import type { TimelinePeriod } from '../types/finance';
import type {
  BudgetRatio,
  BudgetMainGroupId,
  BudgetGroup,
  BudgetCategoryOutput,
  BudgetTreeNode,
  MonthlyBudgetOutput,
  BudgetRatioScheduleItem
} from '../types/budget';
import type { ChildCostOutput } from '../types/child';
import { isBeforeOrEqual } from '../utils/date';
import { safeNumber, safeArray } from '../utils/math';
import { DEFAULT_BUDGET_RATIOS, DEFAULT_BUDGET_TREE } from '../data/defaultInputs';

export interface BudgetEngineInput {
  period: TimelinePeriod;
  incomeMonthly: number;
  budgetSchedule?: BudgetRatioScheduleItem[];
  childCost?: ChildCostOutput;
}

/**
 * Reconstructs a tree from flat ratios for backward compatibility.
 * Scales child ratios proportionally to match parent group ratio.
 */
export function rebuildTreeFromFlatRatios(flatRatios: BudgetRatio[]): BudgetTreeNode[] {
  const newTree = JSON.parse(JSON.stringify(DEFAULT_BUDGET_TREE)) as BudgetTreeNode[];
  
  newTree.forEach((group) => {
    const matchedFlat = flatRatios.find(
      (r) => 
        r.group === group.groupId || 
        (group.groupId === 'housing_basic' && r.categoryId === 'housing-basic') ||
        (group.groupId === 'future_investing' && r.categoryId === 'future-investing') ||
        (group.groupId === 'safety_reserve' && r.categoryId === 'safety-reserve') ||
        (group.groupId === 'family_experience' && r.categoryId === 'family-experience') ||
        (group.groupId === 'health_growth' && r.categoryId === 'health-growth')
    );
    
    if (matchedFlat) {
      group.ratioPercent = matchedFlat.ratioPercent;
      
      // Scale children proportionally
      if (group.children && group.children.length > 0) {
        const defaultChildrenSum = group.children.reduce((sum, c) => sum + c.ratioPercent, 0);
        if (defaultChildrenSum > 0) {
          let remaining = group.ratioPercent;
          group.children.forEach((child, idx) => {
            if (idx === group.children!.length - 1) {
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
  
  return newTree;
}

/**
 * Recursively collects leaf nodes of the budget tree.
 */
export function collectLeafNodes(node: BudgetTreeNode): BudgetTreeNode[] {
  const isActive = node.isActive !== false;
  if (!isActive) return [];

  if (!node.children || node.children.length === 0) {
    return [node];
  }
  
  // If parent is active, process active children
  const activeChildren = node.children.filter(c => c.isActive !== false);
  if (activeChildren.length === 0) {
    // If no active children, parent acts as leaf
    return [node];
  }
  
  return activeChildren.flatMap(collectLeafNodes);
}

/**
 * Pure, deterministic hierarchical budget allocator engine.
 * Computes monthly allocations, validates parent-child ratios, and outputs flat categories for backward compatibility.
 */
export function calculateBudget(input: BudgetEngineInput): MonthlyBudgetOutput {
  const warnings: string[] = [];
  const period = input.period;
  const income = safeNumber(input.incomeMonthly, 0);
  const schedule = safeArray(input.budgetSchedule);
  const childCost = input.childCost;

  let activeTree: BudgetTreeNode[] = DEFAULT_BUDGET_TREE;

  if (schedule.length > 0) {
    // 1. Filter schedule items whose effective date is <= current period
    const pastOrActiveItems = schedule.filter((item) => {
      return isBeforeOrEqual(
        { year: item.effectiveYear, month: item.effectiveMonth },
        { year: period.year, month: period.month }
      );
    });

    let activeItem: BudgetRatioScheduleItem | null = null;

    if (pastOrActiveItems.length > 0) {
      pastOrActiveItems.sort((a, b) => {
        if (a.effectiveYear !== b.effectiveYear) {
          return a.effectiveYear - b.effectiveYear;
        }
        return a.effectiveMonth - b.effectiveMonth;
      });
      activeItem = pastOrActiveItems[pastOrActiveItems.length - 1];
    } else {
      warnings.push(`Mốc thời gian hiện tại (${period.year}-${String(period.month).padStart(2, '0')}) trước thời điểm hiệu lực của phân bổ đầu tiên. Mặc định chưa phân bổ.`);
    }

    if (activeItem) {
      if (activeItem.rootGroups && activeItem.rootGroups.length > 0) {
        activeTree = activeItem.rootGroups;
      } else if (activeItem.ratios && activeItem.ratios.length > 0) {
        // Migrate flat ratios to tree on the fly
        activeTree = rebuildTreeFromFlatRatios(activeItem.ratios);
      }
    }
  }

  // 2. Validate tree structure and ratios
  let totalMainRatio = 0;
  
  activeTree.forEach((group) => {
    const isGroupActive = group.isActive !== false;
    if (isGroupActive) {
      totalMainRatio += group.ratioPercent;
      
      // Check children ratios match parent
      if (group.children && group.children.length > 0) {
        const activeChildren = group.children.filter(c => c.isActive !== false);
        if (activeChildren.length > 0) {
          const childrenSum = activeChildren.reduce((sum, c) => sum + c.ratioPercent, 0);
          if (Math.abs(childrenSum - group.ratioPercent) > 0.05) {
            warnings.push(
              `Tổng tỷ lệ danh mục con của nhóm "${group.name}" là ${childrenSum}%, lệch so với tỷ lệ nhóm cha ${group.ratioPercent}%.`
            );
          }
        }
      }
    }
  });

  if (Math.abs(totalMainRatio - 100) > 0.05) {
    warnings.push(`Tổng tỷ lệ phân bổ của các nhóm chính là ${totalMainRatio}%, khác biệt so với mức chuẩn 100%.`);
  }

  // 3. Extract leaf nodes as flat categories output
  const leafNodes = activeTree.flatMap(collectLeafNodes);

  const categories: BudgetCategoryOutput[] = leafNodes.map((node) => {
    const amount = (income * node.ratioPercent) / 100;
    return {
      categoryId: node.id,
      categoryName: node.name,
      group: node.groupId,
      ratioPercent: node.ratioPercent,
      amountMonthly: amount,
      amountYearly: amount * 12,
      ruleType: 'percent',
      isActive: node.isActive,
    };
  });

  // 4. Inject Child Cost Category if active (fixed cost)
  if (childCost && childCost.isActive) {
    const childCostAmount = safeNumber(childCost.totalMonthly, 0);
    const childRatioPercent = income > 0 ? (childCostAmount / income) * 100 : 0;

    categories.push({
      categoryId: 'child-cost-category',
      categoryName: 'Chi phí nuôi con',
      group: 'children',
      ratioPercent: Math.round(childRatioPercent * 10) / 10,
      amountMonthly: childCostAmount,
      amountYearly: childCostAmount * 12,
      ruleType: 'fixed',
      isActive: true,
    });
  }

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.amountMonthly, 0);

  // 5. Compute investment, saving and spending categories
  const investmentMonthly = categories
    .filter((c) => c.group === 'future_investing')
    .reduce((sum, c) => sum + c.amountMonthly, 0);

  const savingMonthly = categories
    .filter((c) => c.group === 'safety_reserve')
    .reduce((sum, c) => sum + c.amountMonthly, 0);

  const totalExpenseMonthly = categories
    .filter((c) => c.group !== 'future_investing' && c.group !== 'safety_reserve')
    .reduce((sum, c) => sum + c.amountMonthly, 0);

  const freeCashflowMonthly = income - totalAllocated;
  const deficitMonthly = totalAllocated > income ? totalAllocated - income : 0;

  if (totalAllocated > income) {
    warnings.push(
      `Tổng chi phí phân bổ (${totalAllocated.toFixed(1)} tr) vượt quá thu nhập khả dụng (${income.toFixed(1)} tr).`
    );
  }

  return {
    month: period.month,
    year: period.year,
    incomeMonthly: income,
    categories,
    totalAllocatedMonthly: totalAllocated,
    totalExpenseMonthly,
    investmentMonthly,
    savingMonthly,
    freeCashflowMonthly,
    deficitMonthly,
    warnings,
  };
}
