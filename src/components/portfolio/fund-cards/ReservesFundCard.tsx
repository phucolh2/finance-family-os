import React from 'react';
import { Edit, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { FundCardProps } from './types';
import type { FundingSourceId } from '../../../constants/fundingSources';

export const ReservesFundCard: React.FC<FundCardProps> = ({
  fund, balance, progress, totalDisbursed, isDisbursing,
  currentObservedMonth, currentObservedYear,
  expandedFundId, setExpandedFundId, onEdit, onDelete, onDisburse,
  renderDisburseForm, renderCashflowDetails,
  dynamicSources, FUNDING_SOURCES, formatMoney
}) => {
  return (
    <div className="border border-rose-200/60 rounded-xl p-4 bg-rose-50/30 hover:bg-rose-50/60 transition-colors relative overflow-hidden group flex flex-col justify-between shadow-sm">
      
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-bold text-rose-900 text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              {fund.name}
            </h4>
            {fund.fundGroup && (
              <span className="text-[10px] font-semibold bg-rose-100/50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 mt-1.5 inline-block uppercase tracking-wider">
                {fund.fundGroup}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="text-rose-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="text-rose-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-2 mb-4 flex flex-wrap gap-2">
          <div className="flex flex-col bg-white/60 px-3 py-1.5 rounded-lg border border-rose-100 min-w[80px]">
            <span className="text-[10px] text-rose-800/60 uppercase tracking-wide">Bắt đầu</span>
            <span className="text-xs font-semibold text-rose-900">{fund.startMonth}/{fund.startYear}</span>
          </div>
          <div className="flex flex-col bg-white/60 px-3 py-1.5 rounded-lg border border-rose-100 min-w[80px]">
            <span className="text-[10px] text-rose-800/60 uppercase tracking-wide">Kỳ hạn</span>
            <span className="text-xs font-semibold text-rose-900">{fund.termMonths === 0 ? 'Không kỳ hạn' : `${fund.termMonths} tháng`}</span>
          </div>
          <div className="flex flex-col bg-white/60 px-3 py-1.5 rounded-lg border border-rose-100 min-w[80px]">
            <span className="text-[10px] text-rose-800/60 uppercase tracking-wide">Lãi suất</span>
            <span className="text-xs font-semibold text-rose-900">{fund.interestRateAnnual || 0}%/năm</span>
          </div>
          <div className="flex flex-col bg-white/60 px-3 py-1.5 rounded-lg border border-rose-100 flex-1">
            <span className="text-[10px] text-rose-800/60 uppercase tracking-wide">Nguồn cấp</span>
            <span className="text-xs font-semibold text-rose-900 whitespace-nowrap overflow-hidden text-ellipsis block" title={dynamicSources?.find(d => d.id === fund.sourceOfFund)?.label || FUNDING_SOURCES[fund.sourceOfFund as FundingSourceId]?.shortLabel || fund.sourceOfFund}>
              {dynamicSources?.find(d => d.id === fund.sourceOfFund)?.label || FUNDING_SOURCES[fund.sourceOfFund as FundingSourceId]?.shortLabel || fund.sourceOfFund}
            </span>
          </div>
        </div>

        <div className="mt-auto border-t border-rose-200/50 pt-3">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[11px] text-rose-800/70 mb-1">Quy mô quỹ dự phòng / Mức an toàn</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-rose-700">{formatMoney(balance)}</span>
                <span className="text-sm text-rose-800/60 font-medium">/ {formatMoney(fund.targetAmount)}</span>
              </div>
            </div>
            
            {balance > 0 && (
              <Button size="sm" onClick={onDisburse} className="bg-rose-600 text-white hover:bg-rose-700 shadow-sm border-0 font-semibold px-4">
                Sử dụng Quỹ
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {fund.targetAmount > 0 && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-rose-700 uppercase">
                  Mức độ bao phủ: {progress.toFixed(1)}%
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
                      <span className="text-[10px] text-rose-800/70 font-medium bg-white/50 px-1.5 py-0.5 rounded">
                        Đầy đủ vào: T{estMonth}/{estYear}
                      </span>
                    );
                  }
                  if (remaining <= 0 && fund.targetAmount > 0) {
                    return <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">Bảo vệ tối đa</span>;
                  }
                  return null;
                })()}
              </div>
              <div className="h-2 w-full bg-rose-200/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(100, progress)}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between bg-white/40 p-2 rounded-lg border border-rose-100">
            <div className="text-[11px] text-rose-800/80">
              Vốn ban đầu: <span className="font-bold text-rose-900">{formatMoney(fund.initialDeposit)}</span>
            </div>
            <div className="w-px h-3 bg-rose-200"></div>
            <div className="text-[11px] text-rose-800/80">
              Đóng góp hàng tháng: <span className="font-bold text-rose-900">+{formatMoney(fund.monthlyContribution)}</span>
            </div>
          </div>
        </div>

        <button 
           onClick={() => setExpandedFundId(expandedFundId === fund.id ? null : fund.id)}
           className="mt-3 text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center justify-center w-full py-1.5 bg-rose-100/30 hover:bg-rose-100/50 rounded transition-colors"
         >
           {expandedFundId === fund.id ? 'Đóng chi tiết' : 'Kiểm tra chi tiết & Dòng tiền'}
         </button>

        {expandedFundId === fund.id && (
          <div className="mt-2">
            {renderCashflowDetails(fund)}
          </div>
        )}

        {isDisbursing && <div className="mt-4">{renderDisburseForm(fund)}</div>}
      </div>
    </div>
  );
};
