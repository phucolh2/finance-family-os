import React from 'react';
import { Edit, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { FundCardProps } from './types';
import type { FundingSourceId } from '../../../constants/fundingSources';

export const PortfolioFundCard: React.FC<FundCardProps> = ({
  fund, balance, progress, totalDisbursed, totalDeposited, isDisbursing,
  currentObservedMonth, currentObservedYear,
  expandedFundId, setExpandedFundId, onEdit, onDelete, onDisburse,
  renderDisburseForm, renderCashflowDetails,
  dynamicSources, FUNDING_SOURCES, formatMoney
}) => {
  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
      
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              {fund.name}
              {fund.fundGroup && (
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">
                  {fund.fundGroup}
                </span>
              )}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Tài sản mục tiêu: {fund.targetAssetType}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="text-slate-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 mb-5 grid grid-cols-2 gap-y-3 gap-x-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Thời điểm</span>
            <span className="text-xs font-medium text-slate-700">{fund.startMonth}/{fund.startYear}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Kỳ hạn</span>
            <span className="text-xs font-medium text-slate-700">{fund.termMonths === 0 ? 'Không kỳ hạn' : `${fund.termMonths} tháng`}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Lãi suất mục tiêu</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-1.5 py-0.5 rounded">{fund.interestRateAnnual || 0}%/năm</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Nguồn vốn</span>
            <span className="text-xs font-medium text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis w-[100px] block" title={dynamicSources?.find(d => d.id === fund.sourceOfFund)?.label || FUNDING_SOURCES[fund.sourceOfFund as FundingSourceId]?.shortLabel || fund.sourceOfFund}>
              {dynamicSources?.find(d => d.id === fund.sourceOfFund)?.label || FUNDING_SOURCES[fund.sourceOfFund as FundingSourceId]?.shortLabel || fund.sourceOfFund}
            </span>
          </div>
        </div>

        <div className="mt-auto bg-slate-50/50 rounded-lg p-3 border border-slate-100">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Vốn hóa hiện tại / Mục tiêu</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-slate-800">{formatMoney(balance)}</span>
                <span className="text-sm text-slate-500 font-medium">/ {formatMoney(fund.targetAmount)}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Vốn thực góp: <span className="font-medium text-slate-700">{formatMoney(totalDeposited)}</span>
              </p>
            </div>
            
            {balance > 0 && (
              <Button size="sm" onClick={onDisburse} className="bg-blue-600 text-white hover:bg-blue-700 rounded shadow-sm px-4">
                Đầu tư ngay
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {fund.targetAmount > 0 && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-bold text-blue-700">
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
                      <span className="text-[10px] text-slate-500 font-medium">
                        Dự kiến: {estMonth}/{estYear}
                      </span>
                    );
                  }
                  if (remaining <= 0 && fund.targetAmount > 0) {
                    return <span className="text-[10px] text-emerald-600 font-medium">Đạt mục tiêu</span>;
                  }
                  return null;
                })()}
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(100, progress)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
          
        <div className="mt-4 flex justify-between items-center border-t border-slate-100 pt-3">
          <div>
            <p className="text-[10px] text-slate-500 mb-0.5">Vốn ban đầu / Phân bổ định kỳ</p>
            <p className="text-xs font-bold text-slate-700">
              {formatMoney(fund.initialDeposit)} / <span className="text-blue-600">+{formatMoney(fund.monthlyContribution)}</span>
            </p>
          </div>
          <button 
             onClick={() => { setExpandedFundId(expandedFundId === fund.id ? null : fund.id); }}
             className="text-[11px] text-slate-600 hover:text-blue-600 font-medium transition-colors"
           >
             {expandedFundId === fund.id ? 'Đóng chi tiết' : 'Xem Cashflow'}
           </button>
        </div>

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
