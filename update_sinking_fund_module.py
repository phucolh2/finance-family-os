import os

file_path = 'src/components/portfolio/SinkingFundModule.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_jsx = """                                             {b.parentId ? (
                                                <div className="flex items-center">
                                                   <span className="font-bold text-family-accent text-[12px]">{formatTableMoneyVNDMillion(b.principal)}</span>
                                                   <span className="font-bold text-family-accent text-[11px] ml-1">Tr</span>
                                                </div>
                                             ) : (
                                                <>
                                                   <input
                                                      type="number"
                                                      step="0.1"
                                                      min="0"
                                                    value={fund.periodConfigs?.[pKey]?.contribution !== undefined ? fund.periodConfigs[pKey].contribution : fund.monthlyContribution}
                                                    onChange={(e) => {
                                                       const newContrib = safeNumber(Number(e.target.value), 0);
                                                       const updatedConfigs = {
                                                          ...(fund.periodConfigs || {}),
                                                          [pKey]: {
                                                             ...(fund.periodConfigs?.[pKey] || {}),
                                                             contribution: newContrib,
                                                          }
                                                       };
                                                       updateSinkingFund({
                                                          ...fund,
                                                          periodConfigs: updatedConfigs,
                                                       });
                                                    }}
                                                    className="w-14 text-right text-[11px] bg-white border border-family-accent/30 rounded px-1 py-0.5 font-bold text-family-accent focus:outline-none focus:ring-1 focus:ring-family-accent"
                                                 />
                                                 <span className="font-bold text-family-accent text-[11px]">Tr</span>
                                                 {b.principal > (fund.periodConfigs?.[pKey]?.contribution ?? fund.monthlyContribution) + 0.01 && (
                                                    <span className="text-[9px] text-family-textMuted ml-0.5 whitespace-nowrap">
                                                       (Gồm {formatTableMoneyVNDMillion(fund.initialDeposit)} gốc ban đầu + {formatTableMoneyVNDMillion(fund.periodConfigs?.[pKey]?.contribution ?? fund.monthlyContribution)} định kỳ)
                                                    </span>
                                                 )}
                                                </>
                                             )}"""

new_jsx = """                                             {b.parentId && !b.breakdown ? (
                                                <div className="flex items-center">
                                                   <span className="font-bold text-family-accent text-[12px]">{formatTableMoneyVNDMillion(b.principal)}</span>
                                                   <span className="font-bold text-family-accent text-[11px] ml-1">Tr</span>
                                                </div>
                                             ) : (
                                                <div className="flex items-center flex-wrap gap-1">
                                                   {b.breakdown && (
                                                      <div className="flex items-center">
                                                         <span className="font-bold text-family-accent text-[12px]">{formatTableMoneyVNDMillion(b.principal)}</span>
                                                         <span className="font-bold text-family-accent text-[11px] ml-1">Tr</span>
                                                      </div>
                                                   )}
                                                   <div className="flex items-center">
                                                      {b.breakdown && (
                                                         <span className="text-[10px] text-family-textMuted mr-1 ml-1 whitespace-nowrap">
                                                            (Gồm {formatTableMoneyVNDMillion(b.breakdown.rolledOverPrincipal)} gốc cũ + {formatTableMoneyVNDMillion(b.breakdown.rolledOverInterest)} lãi +
                                                         </span>
                                                      )}
                                                      <input
                                                         type="number"
                                                         step="0.1"
                                                         min="0"
                                                       value={fund.periodConfigs?.[pKey]?.contribution !== undefined ? fund.periodConfigs[pKey].contribution : fund.monthlyContribution}
                                                       onChange={(e) => {
                                                          const newContrib = safeNumber(Number(e.target.value), 0);
                                                          const updatedConfigs = {
                                                             ...(fund.periodConfigs || {}),
                                                             [pKey]: {
                                                                ...(fund.periodConfigs?.[pKey] || {}),
                                                                contribution: newContrib,
                                                             }
                                                          };
                                                          updateSinkingFund({
                                                             ...fund,
                                                             periodConfigs: updatedConfigs,
                                                          });
                                                       }}
                                                       className="w-14 text-right text-[11px] bg-white border border-family-accent/30 rounded px-1 py-0.5 font-bold text-family-accent focus:outline-none focus:ring-1 focus:ring-family-accent"
                                                    />
                                                    <span className="font-bold text-family-accent text-[11px] ml-1">Tr</span>
                                                    {b.breakdown ? (
                                                       <span className="text-[10px] text-family-textMuted ml-1 whitespace-nowrap">định kỳ)</span>
                                                    ) : (
                                                       b.principal > (fund.periodConfigs?.[pKey]?.contribution ?? fund.monthlyContribution) + 0.01 && (
                                                          <span className="text-[9px] text-family-textMuted ml-0.5 whitespace-nowrap">
                                                             (Gồm {formatTableMoneyVNDMillion(fund.initialDeposit)} gốc ban đầu + {formatTableMoneyVNDMillion(fund.periodConfigs?.[pKey]?.contribution ?? fund.monthlyContribution)} định kỳ)
                                                          </span>
                                                       )
                                                    )}
                                                   </div>
                                                </div>
                                             )}"""

content = content.replace(old_jsx, new_jsx)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
