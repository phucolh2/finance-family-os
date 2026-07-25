import React from 'react';
import { Edit, Trash2, ShieldCheck } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { FundCardProps } from './types';
import type { FundingSourceId } from '../../../constants/fundingSources';

export const SavingsFundCard: React.FC<FundCardProps> = ({
  fund, balance, progress, totalDisbursed, isDisbursing,
  currentObservedMonth, currentObservedYear,
  expandedFundId, setExpandedFundId, onEdit, onDelete, onDisburse,
  renderDisburseForm, renderCashflowDetails,
  dynamicSources, FUNDING_SOURCES, formatMoney
}) => {
  return (
    <div className="border-2 border-emerald-100 rounded-2xl p-5 bg-gradient-to-b from-emerald-50/50 to-white hover:border-emerald-300/50 transition-colors relative overflow-hidden group flex flex-col justify-between shadow-sm">
      
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-bold text-emerald-950 text-xl flex items-center gap-2">
              {fund.name}
              {fund.fundGroup && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {fund.fundGroup}
                </span>
              )}
            </h4>
            <div className="flex items-center gap-1.5 mt-1.5 opacity-80">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Tích luỹ an toàn</p>
            </div>
          </div>
          <div className="flex gap-2 bg-white/50 p-1 rounded-lg">
            <button onClick={onEdit} className="text-emerald-400 hover:text-emerald-600 p-1 transition-colors opacity-0 group-hover:opacity-100 bg-white rounded shadow-sm">
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="text-red-300 hover:text-red-500 p-1 transition-colors opacity-0 group-hover:opacity-100 bg-white rounded shadow-sm">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-emerald-50/80 rounded-xl p-3 grid grid-cols-2 gap-y-3 gap-x-2 border border-emerald-100/50 mb-5">
          <div className="flex flex-col px-2 border-l-2 border-emerald-200">
            <span className="text-[10px] text-emerald-700/70 font-medium uppercase tracking-wide">Mở sổ</span>
            <span className="text-xs font-bold text-emerald-900 mt-0.5">{fund.startMonth}/{fund.startYear}</span>
          </div>
          <div className="flex flex-col px-2 border-l-2 border-emerald-200">
            <span className="text-[10px] text-emerald-700/70 font-medium uppercase tracking-wide">Kỳ hạn</span>
            <span className="text-xs font-bold text-emerald-900 mt-0.5">{fund.termMonths === 0 ? 'Linh hoạt' : `${fund.termMonths} tháng`}</span>
          </div>
          <div className="flex flex-col px-2 border-l-2 border-emerald-200">
            <span className="text-[10px] text-emerald-700/70 font-medium uppercase tracking-wide">Lãi suất</span>
            <span className="text-xs font-bold text-emerald-900 mt-0.5">{fund.interestRateAnnual || 0}%/năm</span>
          </div>
          <div className="flex flex-col px-2 border-l-2 border-emerald-200">
            <span className="text-[10px] text-emerald-700/70 font-medium uppercase tracking-wide">Từ nguồn</span>
            <span className="text-xs font-bold text-emerald-900 whitespace-nowrap overflow-hidden text-ellipsis w-full block mt-0.5" title={dynamicSources?.find(d => d.id === fund.sourceOfFund)?.label || FUNDING_SOURCES[fund.sourceOfFund as FundingSourceId]?.shortLabel || fund.sourceOfFund}>
              {dynamicSources?.find(d => d.id === fund.sourceOfFund)?.label || FUNDING_SOURCES[fund.sourceOfFund as FundingSourceId]?.shortLabel || fund.sourceOfFund}
            </span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[11px] font-medium text-emerald-800/60 mb-1">Tổng tiền tích lũy / Mục tiêu</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700">{formatMoney(balance)}</span>
                <span className="text-sm text-emerald-800/50 font-bold">/ {formatMoney(fund.targetAmount)}</span>
              </div>
              <p className="text-[11px] text-emerald-800/70 mt-1.5 flex items-center gap-1">
                Gốc nộp vào: <span className="font-bold text-emerald-900">{formatMoney(totalDisbursed)}</span>
                <span className="text-emerald-400">|</span>
                Lãi sinh ra: <span className="font-bold text-emerald-500">+{formatMoney(Math.max(0, balance - totalDisbursed))}</span>
              </p>
            </div>
            
            {balance > 0 && (
              <Button size="sm" onClick={onDisburse} className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 rounded-xl px-4 py-2 font-semibold">
                Rút tiền
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {fund.targetAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-emerald-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-black text-emerald-700 uppercase">
                  {progress.toFixed(1)}% Hoàn thành
                </span>
                {(() => {
                  const remaining = fund.targetAmount - balance;
                  if (remaining > 0 && fund.monthlyContribution > 0) {
                    const monthsRemaining = Math.ceil(remaining / fund.monthlyContribution);
                    const currentM = currentObservedMonth;
                    const currentY = currentObservedYear;
                    const estMonth = ((currentM - 1 + monthsRemaining) % 12) + 1;
                    const estYear = currentY + Math.floor((currentM - 1 + monthsRemaining) / 12);
                    return (
                      <span className="text-[11px] text-emerald-600/80 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        Đích: {estMonth}/{estYear}
                      </span>
                    );
                  }
                  if (remaining <= 0 && fund.targetAmount > 0) {
                    return <span className="text-[11px] text-emerald-600 font-bold">🎉 Hoàn tất</span>;
                  }
                  return null;
                })()}
              </div>
              <div className="h-3 w-full bg-emerald-100/50 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden" 
                  style={{ width: `${Math.min(100, progress)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
          
        <div className="mt-5 flex justify-between items-center bg-white rounded-xl p-3 border border-emerald-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] font-semibold text-emerald-800/50 uppercase">Gốc ban đầu</p>
              <p className="text-sm font-bold text-emerald-900">{formatMoney(fund.initialDeposit)}</p>
            </div>
            <div className="h-6 w-px bg-emerald-100"></div>
            <div>
              <p className="text-[10px] font-semibold text-emerald-800/50 uppercase">Gửi thêm hằng tháng</p>
              <p className="text-sm font-black text-emerald-600">+{formatMoney(fund.monthlyContribution)}</p>
            </div>
          </div>
        </div>

        <button 
           onClick={() => setExpandedFundId(expandedFundId === fund.id ? null : fund.id)}
           className="mt-3 text-[11px] text-emerald-600 hover:text-emerald-800 font-bold flex justify-center w-full py-2 bg-emerald-50/50 rounded-lg hover:bg-emerald-50 transition-colors"
         >
           {expandedFundId === fund.id ? 'Đóng sổ phụ' : 'Mở sổ phụ (Lịch sử & Cashflow)'}
         </button>

        {expandedFundId === fund.id && (
          <div className="mt-3">
            {renderCashflowDetails(fund)}
          </div>
        )}

        {isDisbursing && <div className="mt-4">{renderDisburseForm(fund)}</div>}
      </div>
    </div>
  );
};
