import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { FundCardProps } from './types';
import type { FundingSourceId } from '../../../constants/fundingSources';

export const LifestyleFundCard: React.FC<FundCardProps> = ({
  fund, balance, progress, totalDisbursed, isDisbursing,
  expandedFundId, setExpandedFundId, onEdit, onDelete, onDisburse,
  renderDisburseForm, renderCashflowDetails,
  dynamicSources, FUNDING_SOURCES, formatMoney, filterFundType
}) => {
  return (
    <div className="border border-orange-200/60 rounded-2xl p-4 bg-orange-50/40 hover:bg-orange-50/70 transition-colors relative overflow-hidden group flex flex-col justify-between shadow-sm">
      
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-bold text-orange-900 text-lg flex items-center gap-2">
              {fund.name}
              {fund.fundGroup && (
                <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200 uppercase">
                  #{fund.fundGroup}
                </span>
              )}
            </h4>
            {filterFundType !== 'debt_prep' && (
              <p className="text-[11px] font-medium text-orange-600/80 uppercase tracking-wider mt-1">Mục tiêu: {fund.targetAssetType}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="text-orange-400 hover:text-orange-600 transition-colors opacity-0 group-hover:opacity-100">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 mb-4 grid grid-cols-2 gap-y-2 gap-x-4 bg-white/60 p-3 rounded-xl border border-orange-100/50">
          <div className="flex flex-col">
            <span className="text-[10px] text-orange-800/60 uppercase tracking-wide">Bắt đầu</span>
            <span className="text-xs font-semibold text-orange-900">{fund.startMonth}/{fund.startYear}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-orange-800/60 uppercase tracking-wide">Kỳ hạn gửi</span>
            <span className="text-xs font-semibold text-orange-900">{fund.termMonths === 0 ? 'Không kỳ hạn' : `${fund.termMonths} tháng`}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-orange-800/60 uppercase tracking-wide">Lãi suất</span>
            <span className="text-xs font-semibold text-orange-900">{fund.interestRateAnnual || 0}%/năm</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-orange-800/60 uppercase tracking-wide">Nguồn tiền</span>
            <span className="text-xs font-semibold text-orange-900 whitespace-nowrap overflow-hidden text-ellipsis w-[100px] block" title={dynamicSources?.find(d => d.id === fund.sourceOfFund)?.label || FUNDING_SOURCES[fund.sourceOfFund as FundingSourceId]?.shortLabel || fund.sourceOfFund}>
              {dynamicSources?.find(d => d.id === fund.sourceOfFund)?.label || FUNDING_SOURCES[fund.sourceOfFund as FundingSourceId]?.shortLabel || fund.sourceOfFund}
            </span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between items-end mt-2 mb-2">
            <div>
              <p className="text-[11px] text-orange-800/70 mb-1">Số dư hiện tại / Mục tiêu</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-orange-600">{formatMoney(balance)}</span>
                <span className="text-sm text-orange-800/60 font-medium">/ {formatMoney(fund.targetAmount)}</span>
              </div>
              <p className="text-[11px] text-orange-800/70 mt-1">
                Tổng vốn đã góp: <span className="font-semibold text-orange-900">{formatMoney(totalDisbursed)}</span>
              </p>
            </div>
            
            {balance > 0 && filterFundType !== 'debt_prep' && (
              <Button size="sm" onClick={onDisburse} className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 shadow-none font-semibold rounded-lg px-4">
                Giải ngân
              </Button>
            )}
          </div>

          {/* Mini Chart / Progress Bar */}
          {fund.targetAmount > 0 && (
            <div className="mt-4 pt-3 border-t border-orange-200/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-orange-700 bg-orange-100/80 px-2.5 py-0.5 rounded-md inline-flex items-center">
                  {progress.toFixed(1)}% Hoàn thành
                </span>
                {(() => {
                  const remaining = fund.targetAmount - balance;
                  if (remaining > 0 && fund.monthlyContribution > 0) {
                    const monthsRemaining = Math.ceil(remaining / fund.monthlyContribution);
                    const currentM = new Date().getMonth() + 1; // Simplify for now
                    const currentY = new Date().getFullYear();
                    const estMonth = ((currentM - 1 + monthsRemaining) % 12) + 1;
                    const estYear = currentY + Math.floor((currentM - 1 + monthsRemaining) / 12);
                    return (
                      <span className="text-[10px] text-orange-800/70 font-medium">
                        Dự kiến: T{estMonth}/{estYear}
                      </span>
                    );
                  }
                  if (remaining <= 0 && fund.targetAmount > 0) {
                    return <span className="text-[10px] text-green-600 font-medium">✨ Đã đạt mục tiêu</span>;
                  }
                  return null;
                })()}
              </div>
              <div className="h-2 w-full bg-orange-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(100, progress)}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="mt-3">
            {fund.withdrawals && fund.withdrawals.length > 0 && (
              <p className="text-[10px] text-orange-800/70 mt-0.5">
                Đã giải ngân: <span className="font-semibold text-red-500">{formatMoney(fund.withdrawals.reduce((sum, w) => sum + w.amount, 0))} Tr</span>
              </p>
            )}
          </div>
        </div>
          <div>
            <p className="text-[11px] text-orange-800/70 mb-1 text-right mt-3">Vốn ban đầu / Định kỳ</p>
            <p className="text-sm font-bold text-orange-900 text-right">
              {formatMoney(fund.initialDeposit)} / +{formatMoney(fund.monthlyContribution)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-orange-200/50">
           <button 
             onClick={() => setExpandedFundId(expandedFundId === fund.id ? null : fund.id)}
             className="text-[11px] text-green-600 hover:text-green-700 font-semibold flex items-center justify-center gap-1 w-full bg-white/60 border border-green-200/50 py-1.5 rounded-lg transition-colors"
           >
             {expandedFundId === fund.id ? 'Thu gọn chi tiết' : '⊕ Giải ngân đầu tư / Chi tiết dòng tiền'}
           </button>
           
           {expandedFundId === fund.id && renderCashflowDetails(fund)}
        </div>

        {isDisbursing && renderDisburseForm(fund)}
    </div>
  );
};
