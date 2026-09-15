import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { analyzeExpense } from '../engines/expenseEngine';
import { runProjection } from '../engines/projectionEngine';

export const useSinkingFundAutoBalancer = (setBlinkingField: (val: string | null) => void) => {
  const { state, updateSinkingFund } = useAppContext();

  useEffect(() => {
     if (!state.sinkingFunds || !state.resolvedMonthlyDb) return;
     
     // Build a lazy projection in case we need it for global pools
     // We only build it if we have at least one non-expense fund
     let lazyProjection: ReturnType<typeof runProjection> | null = null;
     const getProjection = () => {
         if (!lazyProjection) {
             lazyProjection = runProjection({
                profile: state.profile,
                incomeSchedule: state.incomeSchedule,
                budgetSchedule: state.budgetSchedule,
                expenseSchedule: state.expenseSchedule,
                lifeEvents: state.lifeEvents,
                assets: state.assets,
                assumptions: state.assumptions,
                investmentDeals: state.investmentDeals,
                savingsDeposits: state.savingsDeposits,
                sinkingFunds: state.sinkingFunds,
                debts: state.debts,
                projectionAdjustments: state.projectionAdjustments,
                lifeStages: state.lifeStages,
                fundTransfers: state.fundTransfers,
             });
         }
         return lazyProjection;
     };

     for (const fund of state.sinkingFunds) {
        if (fund.status !== 'active') continue;
        
        const startMonthVal = fund.startYear * 12 + fund.startMonth;
        for (let i = 0; i < state.resolvedMonthlyDb.length; i++) {
           const iterPKey = state.resolvedMonthlyDb[i].periodKey;
           const [yStr, mStr] = iterPKey.split('-');
           const val = parseInt(yStr) * 12 + parseInt(mStr);
           if (val < startMonthVal) continue;
           
           const currentContrib = fund.periodConfigs?.[iterPKey]?.contribution !== undefined ? fund.periodConfigs[iterPKey].contribution : fund.monthlyContribution;
           if (currentContrib <= 0) continue;
           
           let deficit = 0;
           
           if (fund.sourceOfFund?.startsWith('expense_surplus_')) {
               const groupId = fund.sourceOfFund.replace('expense_surplus_', '');
               const windowDb = state.resolvedMonthlyDb.slice(0, i + 1);
               const analysis = analyzeExpense(windowDb, state.lifeEvents);
               const groupSummary = analysis.summaryByGroup[groupId];
               if (groupSummary) {
                   const availableFromBudget = groupSummary.totalBudget - groupSummary.totalActual;
                   
                   let otherSinkingTotal = 0;
                   state.sinkingFunds.forEach(f => {
                      if (f.status !== 'active') return;
                      if (f.sourceOfFund !== fund.sourceOfFund) return;
                      for (let j = 0; j <= i; j++) {
                         const jPKey = state.resolvedMonthlyDb![j].periodKey;
                         const [jyStr, jmStr] = jPKey.split('-');
                         const jVal = parseInt(jyStr) * 12 + parseInt(jmStr);
                         const fStartVal = f.startYear * 12 + f.startMonth;
                         if (jVal >= fStartVal) {
                            if (jVal === fStartVal) otherSinkingTotal += (f.initialDeposit || 0);
                            if (f.id === fund.id && jPKey === iterPKey) continue;
                            const c = f.periodConfigs?.[jPKey]?.contribution !== undefined ? f.periodConfigs[jPKey].contribution : f.monthlyContribution;
                            otherSinkingTotal += c || 0;
                         }
                      }
                   });
                   const room = availableFromBudget - otherSinkingTotal;
                   if (currentContrib > room + 0.01) {
                       deficit = currentContrib - Math.max(0, room);
                   }
               }
           } else {
               const proj = getProjection();
               const row = proj.monthlyRows[i];
               if (row) {
                   const source = fund.sourceOfFund;
                   if (source === 'saving' && row._rawSavingBalance! < -0.01) deficit = Math.abs(row._rawSavingBalance!);
                   else if (source === 'debt_reserve' && row._rawDebtReserveBalance! < -0.01) deficit = Math.abs(row._rawDebtReserveBalance!);
                   else if (source === 'unallocated' && row._rawUnallocatedBalance! < -0.01) deficit = Math.abs(row._rawUnallocatedBalance!);
                   else if (source === 'investment' && row._rawInvestmentBalance! < -0.01) deficit = Math.abs(row._rawInvestmentBalance!);
               }
           }
           
           if (deficit > 0) {
              const newContrib = Math.max(0, currentContrib - deficit);
              const updatedConfigs = {
                 ...(fund.periodConfigs || {}),
                 [iterPKey]: {
                    ...(fund.periodConfigs?.[iterPKey] || {}),
                    contribution: newContrib,
                 }
              };
              setBlinkingField(`${fund.id}-${iterPKey}`);
              setTimeout(() => setBlinkingField(null), 4000);
              updateSinkingFund({
                 ...fund,
                 periodConfigs: updatedConfigs,
              });
              return; // Trigger re-render to check next one
           }
        }
     }
  }, [state.sinkingFunds, state.resolvedMonthlyDb, state.lifeEvents, updateSinkingFund, setBlinkingField, state]);
};
