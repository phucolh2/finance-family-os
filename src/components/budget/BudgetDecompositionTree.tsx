import React from 'react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import type { BudgetTreeNode, BudgetMainGroupId } from '../../types/budget';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface BudgetDecompositionTreeProps {
  rootGroups: BudgetTreeNode[];
  income: number;
}

const getFallbackColorStyles = (index: number) => {
  const fallbacks = [
    { border: 'border-rose-500/35', text: 'text-rose-500', bg: 'bg-rose-500/5', bullet: 'bg-rose-500' },
    { border: 'border-pink-500/35', text: 'text-pink-500', bg: 'bg-pink-500/5', bullet: 'bg-pink-500' },
    { border: 'border-fuchsia-500/35', text: 'text-fuchsia-500', bg: 'bg-fuchsia-500/5', bullet: 'bg-fuchsia-500' },
    { border: 'border-indigo-500/35', text: 'text-indigo-500', bg: 'bg-indigo-500/5', bullet: 'bg-indigo-500' },
    { border: 'border-sky-500/35', text: 'text-sky-500', bg: 'bg-sky-500/5', bullet: 'bg-sky-500' }
  ];
  return fallbacks[index % fallbacks.length];
};

const getGroupColorStyles = (groupId: string, index: number) => {
  switch (groupId) {
    case 'housing_basic': 
      return { border: 'border-amber-500/35', text: 'text-amber-500', bg: 'bg-amber-500/5', bullet: 'bg-amber-500' };
    case 'future_investing': 
      return { border: 'border-lime-500/35', text: 'text-lime-500', bg: 'bg-lime-500/5', bullet: 'bg-lime-500' };
    case 'safety_reserve': 
      return { border: 'border-teal-500/35', text: 'text-teal-500', bg: 'bg-teal-500/5', bullet: 'bg-teal-500' };
    case 'family_experience': 
      return { border: 'border-purple-500/35', text: 'text-purple-500', bg: 'bg-purple-500/5', bullet: 'bg-purple-500' };
    case 'health_growth': 
      return { border: 'border-blue-500/35', text: 'text-blue-500', bg: 'bg-blue-500/5', bullet: 'bg-blue-500' };
    default: 
      return getFallbackColorStyles(index);
  }
};

export const BudgetDecompositionTree: React.FC<BudgetDecompositionTreeProps> = ({ rootGroups, income }) => {
  return (
    <div className="w-full h-full min-h-[300px] overflow-hidden relative rounded-xl group bg-family-bgDeep/30">
      <TransformWrapper
        initialScale={0.9}
        minScale={0.4}
        maxScale={2}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-family-bgDark/90 p-1.5 rounded-xl border border-family-accent/20 shadow-lg backdrop-blur-sm">
              <button type="button" onClick={() => zoomIn()} className="p-1.5 hover:bg-family-accent/20 rounded-lg text-family-text transition-colors" title="Phóng to">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => zoomOut()} className="p-1.5 hover:bg-family-accent/20 rounded-lg text-family-text transition-colors" title="Thu nhỏ">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => resetTransform()} className="p-1.5 hover:bg-family-accent/20 rounded-lg text-family-text transition-colors" title="Vừa màn hình">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
            
            <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full flex flex-col justify-start space-y-4 pt-4 pb-8 px-4 cursor-grab active:cursor-grabbing">
              {/* Root Node: Total Income */}
              <div className="flex justify-center mb-2">
                <div className="bg-family-bgDeep border border-family-accent/30 rounded-xl px-4 py-2 text-center shadow-md min-w-[200px]">
                  <span className="text-[10px] text-family-textMuted uppercase font-bold tracking-wider">Tổng thu nhập</span>
                  <div className="text-sm font-extrabold text-family-text mt-0.5">
                    {formatTableMoneyVNDMillion(income)} / tháng
                  </div>
                  <span className="inline-block text-[10px] font-bold bg-family-accent/10 text-family-accent px-2 py-0.5 rounded-full mt-1">
                    100% phân bổ
                  </span>
                </div>
              </div>

              {/* Main Groups & Children Decomposition Tree */}
              <div className="space-y-4 max-w-2xl mx-auto w-full">
                {rootGroups.map((group, index) => {
                  if (group.isActive === false) return null;
                  
                  const styles = getGroupColorStyles(group.groupId, index);
                  const activeChildren = group.children 
                    ? group.children.filter((c) => c.isActive !== false) 
                    : [];
                  
                  const groupAmount = (income * group.ratioPercent) / 100;

                  return (
                    <div key={group.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center border-l-2 border-family-accent/15 pl-3 py-1 ml-4">
                      
                      {/* Group Card (2/5 columns on large screens) */}
                      <div className="md:col-span-2">
                        <div className={`p-3 rounded-xl border ${styles.border} ${styles.bg} shadow-sm`}>
                          <div className="flex justify-between items-start">
                            <span className={`text-xs font-bold ${styles.text} truncate`}>
                              {group.name}
                            </span>
                            <span className={`text-xs font-extrabold ${styles.text} shrink-0 ml-2`}>
                              {group.ratioPercent}%
                            </span>
                          </div>
                          <div className="text-xs font-bold text-family-text mt-1.5">
                            {formatTableMoneyVNDMillion(groupAmount)} <span className="text-[10px] text-family-textMuted">/ tháng</span>
                          </div>
                        </div>
                      </div>

                      {/* Children Nodes Column (3/5 columns on large screens) */}
                      <div className="md:col-span-3 space-y-1.5 pl-2 md:border-l border-family-accent/10">
                        {activeChildren.length > 0 ? (
                          activeChildren.map((child) => {
                            const childAmount = (income * child.ratioPercent) / 100;
                            return (
                              <div 
                                key={child.id} 
                                className="flex items-center justify-between p-2 rounded-lg bg-family-bgDeep border border-family-accent/5 hover:border-family-accent/10 transition-all text-left"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  {/* Small indentation bullet */}
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.bullet}`} />
                                  <span className="text-[11px] text-family-text font-medium truncate">
                                    {child.name}
                                  </span>
                                </div>
                                
                                <div className="text-right shrink-0 ml-2">
                                  <span className="text-[10px] font-bold text-family-textMuted mr-1.5">
                                    {child.ratioPercent}%
                                  </span>
                                  <span className="text-[10px] font-bold text-family-text">
                                    {formatTableMoneyVNDMillion(childAmount)}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-[10px] text-family-textMuted italic pl-2">
                            Không có hạng mục con nào hoạt động
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};
export default BudgetDecompositionTree;
