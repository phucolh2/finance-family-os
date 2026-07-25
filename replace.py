import re

with open('src/components/portfolio/SinkingFundModule.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

imports = """import { LifestyleFundCard } from './fund-cards/LifestyleFundCard';
import { PortfolioFundCard } from './fund-cards/PortfolioFundCard';
import { SavingsFundCard } from './fund-cards/SavingsFundCard';
import { ReservesFundCard } from './fund-cards/ReservesFundCard';
"""

content = content.replace("import { Target, Plus, Trash2, ArrowRightCircle, Edit, CheckCircle } from 'lucide-react';", imports + "import { Target, Plus, Trash2, ArrowRightCircle, Edit, CheckCircle } from 'lucide-react';")

content = content.replace("export const SinkingFundModule: React.FC<SinkingFundModuleProps> = ({", "export const SinkingFundModule: React.FC<SinkingFundModuleProps & { variant?: 'portfolio' | 'lifestyle' | 'savings' | 'reserves' }> = ({\n  variant = 'portfolio',")

# Rename the label
content = content.replace('label="Nhóm (Hashtag)"', 'label="Nhóm"')

# Replace the map block
pattern = re.compile(r'<div key=\{fund\.id\} className="border border-family-accent/20 rounded-xl p-4 bg-white/50 relative overflow-hidden group flex flex-col justify-between">[\s\S]*?</div>\s*</div>\s*\);\s*}\)}\s*</div>')

replacement = r"""const renderCashflowDetails = (fund: any) => (
                    <div className="bg-white/60 p-3 rounded-lg border border-family-accent/10 text-xs space-y-2 mt-1">
                         <div className="flex justify-between border-b border-gray-100 pb-1">
                            <span className="text-family-textMuted">Tổng vốn đã nộp:</span>
                            <span className="font-semibold">{formatTableMoneyVNDMillion(getFundBalance(fund.id).buckets.reduce((sum: number, b: any) => sum + b.principal, 0))} Tr</span>
                         </div>
                         <div className="flex justify-between border-b border-gray-100 pb-1">
                            <span className="text-family-textMuted">Lãi cộng dồn:</span>
                            <span className="font-semibold text-emerald-600">+{formatTableMoneyVNDMillion(balance - getFundBalance(fund.id).buckets.reduce((sum: number, b: any) => sum + b.principal, 0))} Tr</span>
                         </div>
                         <div className="pt-1">
                            <span className="text-family-textMuted text-[10px] uppercase mb-1 block">Các khoản đang gửi tích lũy:</span>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                               {getFundBalance(fund.id).buckets.map((b: any, i: number) => {
                                  const bMo = ((b.termStart - 1) % 12) + 1;
                                  const bYr = Math.floor((b.termStart - 1) / 12);
                                  const pKey = b.periodKey || `${bYr}-${String(bMo).padStart(2, '0')}`;

                                  return (
                                     <div key={i} className="flex flex-col bg-white p-2 rounded shadow-sm border border-gray-100 gap-2 mb-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-2">
                                          <div className="flex items-center gap-1.5">
                                             <div className="flex flex-col">
                                               <span className="font-semibold text-family-text">Kỳ T{bMo}/{bYr}:</span>
                                               {b.parentId && <span className="text-[9px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded-sm mt-0.5">{b.parentId}</span>}
                                             </div>
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
                                              <span className="text-[9px] text-family-textMuted ml-0.5 whitespace-nowrap" title={`Gồm cả vốn ban đầu hoặc gốc đáo hạn`}>
                                                 (Tổng {formatTableMoneyVNDMillion(b.principal)})
                                              </span>
                                           )}
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-xs">
                                           <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-family-textMuted">Kỳ hạn:</span>
                                              <select
                                                 value={b.termMonths}
                                                 onChange={(e) => {
                                                    const newTerm = Number(e.target.value);
                                                    const updatedConfigs = {
                                                       ...(fund.periodConfigs || {}),
                                                       [pKey]: {
                                                          ...(fund.periodConfigs?.[pKey] || {}),
                                                          termMonths: newTerm,
                                                          interestRateAnnual: b.interestRateAnnual,
                                                       }
                                                    };
                                                    updateSinkingFund({
                                                       ...fund,
                                                       periodConfigs: updatedConfigs,
                                                    });
                                                 }}
                                                 className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent"
                                              >
                                                 <option value={0}>Không kỳ hạn</option>
                                                 <option value={1}>1 tháng</option>
                                                 <option value={3}>3 tháng</option>
                                                 <option value={6}>6 tháng</option>
                                                 <option value={12}>12 tháng</option>
                                                 <option value={24}>24 tháng</option>
                                                 <option value={36}>36 tháng</option>
                                              </select>
                                           </div>

                                           <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-family-textMuted">Lãi suất:</span>
                                              <input
                                                 type="number"
                                                 step="0.1"
                                                 min="0"
                                                 value={b.interestRateAnnual}
                                                 onChange={(e) => {
                                                    const newRate = safeNumber(Number(e.target.value), 0);
                                                    const updatedConfigs = {
                                                       ...(fund.periodConfigs || {}),
                                                       [pKey]: {
                                                          ...(fund.periodConfigs?.[pKey] || {}),
                                                          termMonths: b.termMonths,
                                                          interestRateAnnual: newRate,
                                                       }
                                                    };
                                                    updateSinkingFund({
                                                       ...fund,
                                                       periodConfigs: updatedConfigs,
                                                    });
                                                 }}
                                                 className="w-12 text-center text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 font-medium text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent"
                                              />
                                              <span className="text-[10px] text-family-textMuted">%/năm</span>
                                           </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                               })}
                            </div>
                         </div>
                      </div>
            );

            const renderDisburseForm = (fund: any) => (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-bold text-green-800">
                        {filterFundType === 'debt_prep' ? 'Quản lý Tất toán & Rút gốc' : 'Giải ngân thành Thương vụ mới'}
                      </h5>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`mode_${fund.id}`} checked={settleMode === 'full'} onChange={() => {
                            setSettleMode('full');
                          }} />
                          <span className="font-semibold text-family-text text-xs">Tất toán toàn bộ (Đóng quỹ)</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`mode_${fund.id}`} checked={settleMode === 'partial'} onChange={() => {
                            setSettleMode('partial');
                          }} />
                          <span className="font-semibold text-family-text text-xs">Giải ngân/Rút từng phần</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-2 border-t border-green-200 pt-2">
                      {filterFundType !== 'debt_prep' && (
                        <Input
                          label="Tên thương vụ đầu tư"
                          value={disburseForm.dealName}
                          onChange={(e) => { setDisburseForm({ ...disburseForm, dealName: e.target.value }); }}
                          placeholder={`VD: Mua ${fund.name}`}
                        />
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-family-text">Tháng chốt:</label>
                          <input
                            type="number" min={1} max={12}
                            value={disburseForm.disbursedMonth}
                            onChange={(e) => { setDisburseForm({ ...disburseForm, disbursedMonth: safeNumber(Number(e.target.value), 12) }); }}
                            className="w-14 text-center text-xs bg-white rounded-md border border-green-200 p-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-family-text">Năm chốt:</label>
                          <input
                            type="number" min={2020} max={2060}
                            value={disburseForm.disbursedYear}
                            onChange={(e) => { setDisburseForm({ ...disburseForm, disbursedYear: safeNumber(Number(e.target.value), 2026) }); }}
                            className="w-16 text-center text-xs bg-white rounded-md border border-green-200 p-1"
                          />
                        </div>

                        {settleMode === 'partial' && (
                          <div className="flex items-center gap-2 border-l pl-4 border-green-200">
                            <label className="text-xs font-semibold text-family-text">Mức rút:</label>
                            <select
                              value={partialWithdrawType}
                              onChange={(e) => { setPartialWithdrawType(e.target.value as 'amount'|'percentage'); }}
                              className="bg-white rounded-md text-xs border border-green-200 p-1"
                            >
                              <option value="amount">Số tiền (Tr)</option>
                              <option value="percentage">% quỹ</option>
                            </select>
                            <input
                              type="number" step="0.1" min="0" max={partialWithdrawType === 'percentage' ? 100 : balance}
                              value={partialWithdrawValue}
                              onChange={(e) => { setPartialWithdrawValue(safeNumber(Number(e.target.value), 0)); }}
                              className="w-16 text-center text-xs bg-white rounded-md border border-green-200 p-1 font-bold text-green-700"
                            />
                          </div>
                        )}
                      </div>
                      
                      {(() => {
                        if (settleMode === 'partial') {
                          const wAmt = partialWithdrawType === 'amount' ? partialWithdrawValue : (balance * partialWithdrawValue / 100);
                          if (wAmt > 0 && wAmt <= balance) {
                            let breakdownNonTerm = 0;
                            const breakdownBuckets: any[] = [];
                            let rem = wAmt;
                            
                            const sim = getFundBalance(fund.id);
                            let simNonTerm = sim.nonTermCash || 0;
                            if (simNonTerm >= rem) {
                               breakdownNonTerm = rem;
                               rem = 0;
                            } else {
                               breakdownNonTerm = simNonTerm;
                               rem -= simNonTerm;
                            }
                            
                            if (rem > 0) {
                               const sorted = [...sim.buckets].sort((a: any, b: any) => (a.termStart + a.termMonths) - (b.termStart + b.termMonths));
                               for (const b of sorted) {
                                  if (rem <= 0) break;
                                  const deduct = Math.min(b.principal, rem);
                                  breakdownBuckets.push({
                                     periodKey: b.periodKey || `${Math.floor((b.termStart-1)/12)}-${String(((b.termStart-1)%12)+1).padStart(2,'0')}`,
                                     deduct
                                  });
                                  rem -= deduct;
                               }
                            }
                            
                            return (
                               <div className="w-full mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                  <p className="text-[11px] font-bold text-yellow-800 mb-1">Cơ chế tất toán thông minh sẽ tự động ưu tiên rút:</p>
                                  <ul className="list-disc pl-4 text-[10px] text-yellow-800 space-y-0.5">
                                     {breakdownNonTerm > 0 && <li>Từ phần không kỳ hạn: <strong>{formatTableMoneyVNDMillion(breakdownNonTerm)} Tr</strong></li>}
                                     {breakdownBuckets.map((b: any, i: number) => (
                                        <li key={i}>Tất toán từ kỳ hạn T{b.periodKey.split('-')[1]}/{b.periodKey.split('-')[0]}: <strong>{formatTableMoneyVNDMillion(b.deduct)} Tr</strong></li>
                                     ))}
                                     {breakdownBuckets.length > 0 && <li>Phần dôi ra của các kỳ hạn trên (nếu có) vẫn tiếp tục duy trì kỳ hạn cũ.</li>}
                                  </ul>
                               </div>
                            );
                          }
                        }
                        return null;
                      })()}


                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => { setDisbursingId(null); }}>Hủy</Button>
                        <Button 
                          size="sm" 
                          disabled={filterFundType !== 'debt_prep' && !disburseForm.dealName}
                          onClick={() => {
                            if (settleMode === 'full') {
                              if (filterFundType !== 'debt_prep') {
                                // 1. Create investment deal
                                addInvestmentDeal({
                                   name: disburseForm.dealName,
                                   assetType: fund.targetAssetType,
                                   capital: balance,
                                   startMonth: disburseForm.disbursedMonth,
                                   startYear: disburseForm.disbursedYear,
                                   status: 'active',
                                   notes: `Giải ngân toàn bộ từ quỹ: ${fund.name}`
                                });
                              }
                              // 2. Mark fund as disbursed
                              disburseSinkingFund(fund.id, disburseForm.disbursedMonth, disburseForm.disbursedYear);
                            } else {
                              const wAmt = partialWithdrawType === 'amount' ? partialWithdrawValue : (balance * partialWithdrawValue / 100);
                              if (wAmt <= 0 || wAmt > balance) {
                                alert('Số tiền rút không hợp lệ (Phải lớn hơn 0 và nhỏ hơn số dư quỹ hiện tại).');
                                return;
                              }
                              
                              if (filterFundType !== 'debt_prep') {
                                addInvestmentDeal({
                                   name: disburseForm.dealName,
                                   assetType: fund.targetAssetType,
                                   capital: wAmt,
                                   startMonth: disburseForm.disbursedMonth,
                                   startYear: disburseForm.disbursedYear,
                                   status: 'active',
                                   notes: `Giải ngân từng phần từ quỹ: ${fund.name}`
                                });
                              }
                              
                              const updatedFund = JSON.parse(JSON.stringify(fund));
                              if (!updatedFund.withdrawals) updatedFund.withdrawals = [];
                              updatedFund.withdrawals.push({
                                 amount: wAmt,
                                 month: disburseForm.disbursedMonth,
                                 year: disburseForm.disbursedYear,
                              });
                              updateSinkingFund(updatedFund);
                            }
                            setDisbursingId(null);
                          }}
                        >
                          Xác nhận
                        </Button>
                      </div>
                    </div>
                  </div>
            );

            const cardProps = {
               fund: fund as any,
               balance, progress, totalDisbursed, isDisbursing,
               expandedFundId, setExpandedFundId, 
               onEdit: () => {
                   setEditingFundId(fund.id);
                   setForm({
                     name: fund.name,
                     fundGroup: fund.fundGroup || '',
                     targetAssetType: fund.targetAssetType,
                     targetAmount: fund.targetAmount,
                     initialDeposit: fund.initialDeposit,
                     monthlyContribution: fund.monthlyContribution,
                     interestRateAnnual: fund.interestRateAnnual || 5.5,
                     termMonths: fund.termMonths || 1,
                     sourceOfFund: (fund.sourceOfFund || activeSources[0]) as string,
                     startMonth: fund.startMonth,
                     startYear: fund.startYear,
                     rolloverStrategy: fund.rolloverStrategy || 'principal_and_interest',
                   });
                   setShowAddForm(true);
                   window.scrollTo({ top: 0, behavior: 'smooth' });
               },
               onDelete: () => { if(confirm('Bạn có chắc muốn xoá quỹ này không?')) deleteSinkingFund(fund.id); },
               onDisburse: () => setDisbursingId(fund.id),
               renderDisburseForm, renderCashflowDetails,
               dynamicSources, FUNDING_SOURCES, formatMoney: formatTableMoneyVNDMillion, filterFundType
            };

            if (variant === 'lifestyle') return <LifestyleFundCard key={fund.id} {...cardProps} />;
            if (variant === 'savings') return <SavingsFundCard key={fund.id} {...cardProps} />;
            if (variant === 'reserves') return <ReservesFundCard key={fund.id} {...cardProps} />;
            return <PortfolioFundCard key={fund.id} {...cardProps} />;
          })}
        </div>"""

content = pattern.sub(replacement, content)

with open('src/components/portfolio/SinkingFundModule.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced with Python")
