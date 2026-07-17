import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { buildEventLedger } from '../engines/ledgerEngine';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { formatTableMoneyVNDMillion } from '../utils/format';
import { DollarSign, Briefcase, PieChart, Activity, CalendarDays, History, AlertCircle } from 'lucide-react';
import type { LedgerEvent } from '../types/ledger';

export const EventLedger: React.FC = () => {
  const { state } = useAppContext();
  const [filter, setFilter] = useState<'all' | 'income' | 'budget_allocation' | 'investment' | 'life_event'>('all');

  // Build the chronological event ledger
  const rawEvents = useMemo(() => buildEventLedger(state), [state]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return rawEvents;
    return rawEvents.filter(e => e.category === filter);
  }, [rawEvents, filter]);

  // Group events by Year for cleaner UI
  const groupedEvents = useMemo(() => {
    const map = new Map<number, LedgerEvent[]>();
    filteredEvents.forEach(evt => {
      const year = evt.startYear;
      if (!map.has(year)) {
        map.set(year, []);
      }
      map.get(year)!.push(evt);
    });
    // Sort years descending
    const sortedYears = Array.from(map.keys()).sort((a, b) => b - a);
    return sortedYears.map(year => ({
      year,
      events: map.get(year)!.sort((a, b) => b.startMonth - a.startMonth), // descending month
    }));
  }, [filteredEvents]);

  const getEventIcon = (category: string) => {
    switch (category) {
      case 'income': return <DollarSign className="w-5 h-5 text-green-400" />;
      case 'investment': return <Briefcase className="w-5 h-5 text-purple-400" />;
      case 'budget_allocation': return <PieChart className="w-5 h-5 text-orange-400" />;
      case 'life_event': return <Activity className="w-5 h-5 text-blue-400" />;
      default: return <CalendarDays className="w-5 h-5 text-family-text" />;
    }
  };

  const getEventColorClass = (category: string) => {
    switch (category) {
      case 'income': return 'border-green-400/30 bg-green-400/5';
      case 'investment': return 'border-purple-400/30 bg-purple-400/5';
      case 'budget_allocation': return 'border-orange-400/30 bg-orange-400/5';
      case 'life_event': return 'border-blue-400/30 bg-blue-400/5';
      default: return 'border-family-accent/20 bg-family-bgDark/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-family-text flex items-center gap-2">
            <History className="w-8 h-8 text-family-accent" />
            Nhật ký Sự kiện
          </h1>
          <p className="text-family-textMuted mt-1">
            Dòng chảy thời gian của toàn bộ các sự kiện tài chính.
          </p>
        </div>
      </div>

      <Card className="border border-family-accent/10 bg-family-bgDark/20">
        <CardHeader className="border-b border-family-accent/5 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Timeline Lịch sử</CardTitle>
              <CardDescription>Các quyết định tài chính được ghi nhận theo trật tự thời gian.</CardDescription>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2 bg-family-bgDeep p-1 rounded-xl border border-family-accent/10">
              {(['all', 'income', 'budget_allocation', 'investment', 'life_event'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === f 
                      ? 'bg-family-accent text-family-bgDeep shadow-sm' 
                      : 'text-family-textMuted hover:text-family-text hover:bg-family-accent/10'
                  }`}
                >
                  {f === 'all' ? 'Tất cả' :
                   f === 'income' ? 'Thu nhập' :
                   f === 'budget_allocation' ? 'Ngân sách' :
                   f === 'investment' ? 'Đầu tư' : 'Sự kiện'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-8">
          {groupedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-12 h-12 text-family-textMuted/30 mb-4" />
              <h3 className="text-xl font-bold text-family-textMuted">Không có sự kiện nào</h3>
              <p className="text-sm text-family-textMuted mt-2">Hãy thiết lập thu nhập hoặc khoản đầu tư để bắt đầu.</p>
            </div>
          ) : (
            <div className="space-y-12 py-4">
              {groupedEvents.map((group) => (
                <div key={group.year} className="flex flex-col md:flex-row gap-2 md:gap-6">
                  {/* Year Marker Column */}
                  <div className="md:w-20 shrink-0 flex md:justify-end">
                    <span className="text-2xl font-bold text-family-text sticky top-6 self-start pl-6 md:pl-0">
                      {group.year}
                    </span>
                  </div>
                  
                  {/* Events Column with vertical line */}
                  <div className="flex-1 relative border-l border-family-accent/20 ml-8 md:ml-0 pl-6 md:pl-8 space-y-6 pb-4">
                    {group.events.map((evt) => (
                      <div key={evt.id} className="relative group">
                        {/* Event Dot (w-3 = 12px, so left-[-6.5px] to center on 1px border) */}
                        <div className="absolute -left-[6.5px] top-8 w-3 h-3 rounded-full bg-family-bgDeep border-2 border-family-accent shadow-sm z-10 transition-transform group-hover:scale-125" />
                        
                        {/* Event Card */}
                        <div className={`p-5 md:p-6 rounded-2xl border transition-all hover:shadow-lg ${getEventColorClass(evt.category)}`}>
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex gap-4 md:gap-5">
                              <div className="mt-1 bg-family-bgDeep p-2.5 rounded-xl border border-family-accent/10 shadow-sm">
                                {getEventIcon(evt.category)}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold text-family-textMuted bg-family-bgDeep px-2.5 py-1 rounded-md border border-family-accent/5 shadow-sm">
                                    Tháng {evt.startMonth}
                                  </span>
                                  {evt.endYear && (
                                    <>
                                      <span className="text-xs font-medium text-family-textMuted/60">đến</span>
                                      <span className="text-xs font-semibold text-family-textMuted bg-family-bgDeep px-2.5 py-1 rounded-md border border-family-accent/5 shadow-sm">
                                        Tháng {evt.endMonth}/{evt.endYear}
                                      </span>
                                    </>
                                  )}
                                  {evt.status === 'cancelled' && (
                                    <span className="text-xs font-semibold text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-1 rounded-md">Đã hủy</span>
                                  )}
                                  {evt.status === 'planned' && (
                                    <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-md">Dự kiến</span>
                                  )}
                                  {evt.status === 'settled' && evt.category === 'income' && (
                                    <span className="text-xs font-semibold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2.5 py-1 rounded-md">Đã kết thúc</span>
                                  )}
                                  {evt.status === 'settled' && evt.category === 'investment' && (
                                    <span className="text-xs font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2.5 py-1 rounded-md">Đã tất toán</span>
                                  )}
                                </div>
                                <h4 className="text-lg font-semibold text-family-text mb-1 tracking-tight">{evt.name}</h4>
                                {evt.note && <p className="text-sm text-family-textMuted/80 leading-relaxed">{evt.note}</p>}
                              </div>
                            </div>
                            
                            {evt.amountVnd !== undefined && evt.amountVnd > 0 && (
                              <div className="text-right">
                                <span className={`text-lg font-black ${evt.category === 'income' ? 'text-green-400' : 'text-family-text'}`}>
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
        </CardContent>
      </Card>
    </div>
  );
};
