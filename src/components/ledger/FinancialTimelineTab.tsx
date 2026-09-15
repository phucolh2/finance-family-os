import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { buildEventLedger } from '../../engines/ledgerEngine';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { DollarSign, Briefcase, PieChart, Activity, CalendarDays, AlertCircle, PiggyBank } from 'lucide-react';
import type { LedgerEvent } from '../../types/ledger';

export const FinancialTimelineTab: React.FC = () => {
  const { state } = useAppContext();
  const [filter, setFilter] = useState<'all' | 'income' | 'budget_allocation' | 'investment' | 'savings' | 'life_event'>('all');

  const rawEvents = useMemo(() => buildEventLedger(state), [state]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return rawEvents;
    return rawEvents.filter(e => e.category === filter);
  }, [rawEvents, filter]);

  const groupedEvents = useMemo(() => {
    const map = new Map<number, LedgerEvent[]>();
    filteredEvents.forEach(evt => {
      const year = evt.startYear;
      if (!map.has(year)) {
        map.set(year, []);
      }
      map.get(year)!.push(evt);
    });
    const sortedYears = Array.from(map.keys()).sort((a, b) => b - a);
    return sortedYears.map(year => ({
      year,
      events: map.get(year)!.sort((a, b) => b.startMonth - a.startMonth),
    }));
  }, [filteredEvents]);

  const getEventIcon = (category: string) => {
    switch (category) {
      case 'income': return <DollarSign className="w-5 h-5 text-emerald-500" />;
      case 'investment': return <Briefcase className="w-5 h-5 text-indigo-500" />;
      case 'savings': return <PiggyBank className="w-5 h-5 text-teal-500" />;
      case 'budget_allocation': return <PieChart className="w-5 h-5 text-orange-500" />;
      case 'life_event': return <Activity className="w-5 h-5 text-sky-500" />;
      default: return <CalendarDays className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {(['all', 'income', 'budget_allocation', 'investment', 'savings', 'life_event'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              filter === f 
                ? 'bg-family-accent text-white border-family-accent shadow-sm' 
                : 'bg-white/80 backdrop-blur-md text-family-textMuted border-family-accent/20 hover:border-family-accent/40 hover:bg-white'
            }`}
          >
            {f === 'all' ? 'Tất cả' :
             f === 'income' ? 'Thu nhập' :
             f === 'budget_allocation' ? 'Ngân sách' :
             f === 'investment' ? 'Đầu tư' :
             f === 'savings' ? 'Tiết kiệm & Quỹ' : 'Sự kiện'}
          </button>
        ))}
      </div>

      {groupedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 backdrop-blur-sm rounded-3xl border border-family-accent/10">
          <AlertCircle className="w-12 h-12 text-family-textMuted/40 mb-4" />
          <h3 className="text-xl font-bold text-family-textMuted">Chưa có sự kiện nào</h3>
          <p className="text-sm text-family-textMuted/70 mt-2">Dòng thời gian sẽ xuất hiện khi bạn thêm các mốc sự kiện.</p>
        </div>
      ) : (
        <div className="relative pb-10">
          {groupedEvents.map((group, idx) => (
            <div key={group.year} className="relative flex gap-4 sm:gap-8 mb-8 group/year">
              {/* Vertical line connecting years */}
              {idx !== groupedEvents.length - 1 && (
                <div className="absolute top-10 bottom-[-2rem] left-[4.25rem] sm:left-[5rem] w-px border-l-2 border-dashed border-family-accent/20 z-0"></div>
              )}
              
              <div className="w-14 sm:w-16 shrink-0 flex justify-end pt-2 relative z-10">
                <span className="text-2xl font-black tracking-tighter text-family-text">
                  {group.year}
                </span>
              </div>
              
              <div className="flex-1 space-y-6">
                {group.events.map((evt, eIdx) => (
                  <div key={evt.id} className="relative group/event flex gap-3 sm:gap-4 items-start">
                    {/* Vertical line connecting events within a year */}
                    {eIdx !== group.events.length - 1 && (
                      <div className="absolute top-10 bottom-[-1.5rem] left-[1.125rem] w-px border-l-2 border-dashed border-family-accent/10 z-0"></div>
                    )}
                    
                    {/* Icon container */}
                    <div className="w-9 h-9 shrink-0 rounded-full bg-white border-2 border-family-accent/20 shadow-sm flex items-center justify-center relative z-10 group-hover/event:border-family-accent/40 transition-colors">
                      {getEventIcon(evt.category)}
                    </div>
                    
                    {/* Content Card */}
                    <div className="flex-1 bg-white/70 backdrop-blur-md rounded-2xl border border-family-accent/10 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow group-hover/event:border-family-accent/30">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-family-textMuted/70">
                              Tháng {evt.startMonth}
                              {evt.endMonth && evt.endYear && ` - ${evt.endMonth}/${evt.endYear}`}
                            </span>
                            {evt.status === 'cancelled' && (
                              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">Hủy</span>
                            )}
                            {evt.status === 'planned' && (
                              <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Dự kiến</span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-family-text mb-1">{evt.name}</h4>
                          {evt.note && <p className="text-sm text-family-textMuted leading-relaxed">{evt.note}</p>}
                        </div>
                        
                        {evt.amountVnd !== undefined && evt.amountVnd > 0 && (
                          <div className="text-left sm:text-right shrink-0">
                            <span className={`text-lg font-black ${evt.category === 'income' ? 'text-emerald-600' : 'text-family-text'}`}>
                              {evt.category === 'income' ? '+' : ''}{formatTableMoneyVNDMillion(evt.amountVnd)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
