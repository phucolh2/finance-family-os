import re

with open('src/components/expense/LiquidityBreakdownTable.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. trackA (Linh hoạt định kỳ)
rgx_A = re.compile(r'onClick=\{\(e\) => \{\s*if \(group\.flexibleEvents\.some\(\(evt: any\) => evt\.type === \'trackA\'\)\) \{\s*e\.stopPropagation\(\);\s*setActiveDetailId\(activeDetailId === group\.id \+ \'-A\' \? null : group\.id \+ \'-A\'\);\s*\}\s*\}\}')
c = rgx_A.sub('', c)

rgx_A_icon = re.compile(r'\{group\.flexibleEvents\.some\(\(evt: any\) => evt\.type === \'trackA\'\) && <Info className=\"w-3\.5 h-3\.5 opacity-80\" />\}')
c = rgx_A_icon.sub('''{group.flexibleEvents.some((evt: any) => evt.type === 'trackA') && (
                              <HelpTooltip position="bottom-right" text={
                                 <div className="space-y-2.5 w-60">
                                    <div className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-2 border-b border-gray-100/20 pb-1.5 flex items-center gap-1.5">
                                      <Info className="w-3 h-3" /> Chi tiết Linh hoạt
                                    </div>
                                    {group.flexibleEvents.filter((evt: any) => evt.type === 'trackA').map((evt: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-start text-xs gap-3">
                                        <span className="text-gray-200 font-medium leading-tight">
                                          {evt.name} <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1 py-0.5 rounded ml-1 border border-orange-500/30">Định kỳ</span>
                                        </span>
                                        <span className="text-orange-400 font-bold shrink-0">{formatTableMoneyVNDMillion(Math.abs(evt.impact))}</span>
                                      </div>
                                    ))}
                                 </div>
                              } />
                            )}''', c)

rgx_A_pop = re.compile(r'\{activeDetailId === group\.id \+ \'-A\' && group\.flexibleEvents\.some\(\(evt: any\) => evt\.type === \'trackA\'\) && \([\s\S]*?</div>\s*</div>\s*\)\}')
c = rgx_A_pop.sub('', c)


# 2. oneTime impact < 0 (Linh hoạt tức thì)
rgx_1 = re.compile(r'onClick=\{\(e\) => \{\s*if \(group\.flexibleEvents\.some\(\(evt: any\) => evt\.type === \'oneTime\' && evt\.impact < 0\)\) \{\s*e\.stopPropagation\(\);\s*setActiveDetailId\(activeDetailId === group\.id \+ \'-1\' \? null : group\.id \+ \'-1\'\);\s*\}\s*\}\}')
c = rgx_1.sub('', c)

rgx_1_icon = re.compile(r'\{group\.flexibleEvents\.some\(\(evt: any\) => evt\.type === \'oneTime\' && evt\.impact < 0\) && <Info className=\"w-3\.5 h-3\.5 opacity-80\" />\}')
c = rgx_1_icon.sub('''{group.flexibleEvents.some((evt: any) => evt.type === 'oneTime' && evt.impact < 0) && (
                              <HelpTooltip position="bottom-right" text={
                                 <div className="space-y-2.5 w-60">
                                    <div className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-2 border-b border-gray-100/20 pb-1.5 flex items-center gap-1.5">
                                      <Info className="w-3 h-3" /> Chi tiết Linh hoạt
                                    </div>
                                    {group.flexibleEvents.filter((evt: any) => evt.type === 'oneTime' && evt.impact < 0).map((evt: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-start text-xs gap-3">
                                        <span className="text-gray-200 font-medium leading-tight">
                                          {evt.name} <span className="text-[9px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded ml-1 border border-red-500/30">Tức thì</span>
                                        </span>
                                        <span className="text-red-400 font-bold shrink-0">{formatTableMoneyVNDMillion(Math.abs(evt.impact))}</span>
                                      </div>
                                    ))}
                                 </div>
                              } />
                            )}''', c)

rgx_1_pop = re.compile(r'\{activeDetailId === group\.id \+ \'-1\' && group\.flexibleEvents\.some\(\(evt: any\) => evt\.type === \'oneTime\' && evt\.impact < 0\) && \([\s\S]*?</div>\s*</div>\s*\)\}')
c = rgx_1_pop.sub('', c)


# 3. trackB (Linh hoạt định kỳ ra)
rgx_B = re.compile(r'onClick=\{\(e\) => \{\s*if \(group\.flexibleEvents\.some\(\(evt: any\) => evt\.type === \'trackB\'\)\) \{\s*e\.stopPropagation\(\);\s*setActiveDetailId\(activeDetailId === group\.id \+ \'-B\' \? null : group\.id \+ \'-B\'\);\s*\}\s*\}\}')
c = rgx_B.sub('', c)

rgx_B_icon = re.compile(r'\{group\.flexibleEvents\.some\(\(evt: any\) => evt\.type === \'trackB\'\) && <Info className=\"w-3\.5 h-3\.5 opacity-80\" />\}')
c = rgx_B_icon.sub('''{group.flexibleEvents.some((evt: any) => evt.type === 'trackB') && (
                              <HelpTooltip position="bottom-right" text={
                                 <div className="space-y-2.5 w-60">
                                    <div className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-2 border-b border-gray-100/20 pb-1.5 flex items-center gap-1.5">
                                      <Info className="w-3 h-3" /> Chi tiết Linh hoạt
                                    </div>
                                    {group.flexibleEvents.filter((evt: any) => evt.type === 'trackB').map((evt: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-start text-xs gap-3">
                                        <span className="text-gray-200 font-medium leading-tight">
                                          {evt.name} <span className="text-[9px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded ml-1 border border-red-500/30">Định kỳ</span>
                                        </span>
                                        <span className="text-red-400 font-bold shrink-0">{formatTableMoneyVNDMillion(Math.abs(evt.impact))}</span>
                                      </div>
                                    ))}
                                 </div>
                              } />
                            )}''', c)

rgx_B_pop = re.compile(r'\{activeDetailId === group\.id \+ \'-B\' && group\.flexibleEvents\.some\(\(evt: any\) => evt\.type === \'trackB\'\) && \([\s\S]*?</div>\s*</div>\s*\)\}')
c = rgx_B_pop.sub('', c)


# 4. oneTime impact > 0 (Tiền vào)
rgx_inc = re.compile(r'onClick=\{\(e\) => \{\s*if \(group\.flexibleEvents\.some\(\(evt: any\) => evt\.type === \'oneTime\' && evt\.impact > 0\)\) \{\s*e\.stopPropagation\(\);\s*setActiveDetailId\(activeDetailId === group\.id \+ \'-income\' \? null : group\.id \+ \'-income\'\);\s*\}\s*\}\}')
c = rgx_inc.sub('', c)

rgx_inc_icon = re.compile(r'\{group\.flexibleEvents\.some\(\(evt: any\) => evt\.type === \'oneTime\' && evt\.impact > 0\) && <Info className=\"w-3\.5 h-3\.5 opacity-80\" />\}')
c = rgx_inc_icon.sub('''{group.flexibleEvents.some((evt: any) => evt.type === 'oneTime' && evt.impact > 0) && (
                              <HelpTooltip position="bottom-right" text={
                                 <div className="space-y-2.5 w-60">
                                    <div className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-2 border-b border-gray-100/20 pb-1.5 flex items-center gap-1.5">
                                      <Info className="w-3 h-3" /> Chi tiết Linh hoạt
                                    </div>
                                    {group.flexibleEvents.filter((evt: any) => evt.type === 'oneTime' && evt.impact > 0).map((evt: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-start text-xs gap-3">
                                        <span className="text-gray-200 font-medium leading-tight">
                                          {evt.name} <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded ml-1 border border-emerald-500/30">Tiền vào</span>
                                        </span>
                                        <span className="text-emerald-400 font-bold shrink-0">+{formatTableMoneyVNDMillion(evt.impact)}</span>
                                      </div>
                                    ))}
                                 </div>
                              } />
                            )}''', c)

rgx_inc_pop = re.compile(r'\{activeDetailId === group\.id \+ \'-income\' && group\.flexibleEvents\.some\(\(evt: any\) => evt\.type === \'oneTime\' && evt\.impact > 0\) && \([\s\S]*?</div>\s*</div>\s*\)\}')
c = rgx_inc_pop.sub('', c)


with open('src/components/expense/LiquidityBreakdownTable.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
