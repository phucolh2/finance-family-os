import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Save, X, ChevronRight, ChevronDown, Check, AlertCircle, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BudgetTreeNode } from '../../types/budget';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface BudgetTreeNodeRowProps {
  node: BudgetTreeNode;
  onUpdate: (id: string, updatedFields: Partial<BudgetTreeNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const BudgetTreeNodeRow: React.FC<BudgetTreeNodeRowProps> = ({
  node,
  onUpdate,
  onDelete,
  onAddChild,
  isExpanded,
  onToggleExpand,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [editNote, setEditNote] = useState(node.note || '');
  const [editClassification, setEditClassification] = useState<BudgetTreeNode['classification']>(node.classification);

  const hasChildren = node.children && node.children.length > 0;
  const isGroup = node.nodeType === 'group';

  const handleSave = () => {
    if (!editName.trim()) return;
    onUpdate(node.id, { name: editName, note: editNote, classification: editClassification });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(node.name);
    setEditNote(node.note || '');
    setEditClassification(node.classification);
    setIsEditing(false);
  };

  // Indentation style based on level
  const indentClass = node.level === 1 ? 'ml-6 border-l border-family-accent/15 pl-4' : node.level === 2 ? 'ml-12 border-l border-family-accent/15 pl-4' : '';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} className={`space-y-2 ${indentClass}`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
        isGroup 
          ? 'bg-family-bgDark/40 border-family-accent/15 shadow-md' 
          : 'bg-family-bgDark/20 border-family-accent/5 hover:border-family-accent/10'
      } ${!node.isActive ? 'opacity-50' : ''}`}>
        
        {/* Left Side: Expand toggle, Name, Notes, Type info */}
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <div {...attributes} {...listeners} className="cursor-grab hover:bg-family-bgDeep p-1 rounded">
            <GripVertical className="w-4 h-4 text-family-textMuted" />
          </div>

          {isGroup && (
            <button 
              type="button"
              onClick={onToggleExpand}
              className="p-1 hover:bg-family-bgDeep rounded-lg text-family-textMuted"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}

           {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full items-center">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-base md:text-xs font-bold bg-family-bgDeep border border-family-accent/20 rounded-xl px-2.5 py-1 text-family-text focus:ring-1 focus:ring-family-accent/40 w-full sm:w-48"
                placeholder="Tên hạng mục..."
              />
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="text-base md:text-xs bg-family-bgDeep border border-family-accent/10 rounded-xl px-2.5 py-1 text-family-textMuted focus:ring-1 focus:ring-family-accent/20 w-full sm:flex-grow"
                placeholder="Ghi chú..."
              />
              {isGroup && (
                <select
                  value={editClassification || ''}
                  onChange={(e) => setEditClassification(e.target.value ? e.target.value as any : undefined)}
                  className="text-xs bg-family-bgDeep border border-family-accent/20 rounded-xl px-2 py-1 text-family-text focus:ring-1 focus:ring-family-accent/40"
                >
                  <option value="">Không phân loại</option>
                  <option value="expense">Chi phí</option>
                  <option value="investment">Đầu tư</option>
                  <option value="savings">Tiết kiệm</option>
                </select>
              )}
            </div>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold text-sm text-family-text truncate ${isGroup ? 'text-base font-serif' : ''}`}>
                  {node.name}
                </span>
                {isGroup ? (
                  <select
                    value={node.classification || ''}
                    onChange={(e) => onUpdate(node.id, { classification: e.target.value ? e.target.value as any : undefined })}
                    className="text-[10px] uppercase font-bold bg-family-bgDeep border border-family-accent/20 rounded-xl px-2.5 py-1 text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent transition-all cursor-pointer"
                  >
                    <option value="">Không phân loại</option>
                    <option value="expense">Chi phí</option>
                    <option value="investment">Đầu tư</option>
                    <option value="savings">Tiết kiệm</option>
                  </select>
                ) : node.classification && (
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${
                    node.classification === 'expense' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                    node.classification === 'investment' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                    'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                  }`}>
                    {node.classification === 'expense' ? 'Chi phí' :
                     node.classification === 'investment' ? 'Đầu tư' : 'Tiết kiệm'}
                  </span>
                )}
                {!node.isActive && (
                  <span className="text-[9px] bg-family-bgDeep px-2 py-0.5 rounded-full text-family-textMuted font-bold border border-family-accent/5">
                    Tắt
                  </span>
                )}
              </div>
              {node.note && (
                <span className="block text-xs text-family-textMuted truncate mt-0.5">
                  {node.note}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Ratio input, Active toggle, and Modification buttons */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          {/* Ratio input */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-family-textMuted">Tỷ lệ:</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={node.ratioPercent}
              onChange={(e) => {
                const val = Number(e.target.value);
                const clamped = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
                onUpdate(node.id, { ratioPercent: clamped });
              }}
              className="w-16 text-right font-bold text-base md:text-sm bg-family-bgDeep border border-family-accent/20 rounded-xl px-2 py-1 text-family-accent focus:ring-1 focus:ring-family-accent"
            />
            <span className="text-xs font-bold text-family-accent">%</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 border-l border-family-accent/15 pl-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  title="Lưu thay đổi"
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  title="Hủy"
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  title="Sửa tên hạng mục"
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-family-bgDeep border border-family-accent/10 text-family-textMuted hover:text-family-accent hover:border-family-accent/30 transition-all shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {isGroup && (
                  <button
                    type="button"
                    onClick={() => onAddChild(node.id)}
                    title="Thêm hạng mục con"
                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-family-accent/10 border border-family-accent/20 text-family-accent hover:bg-family-accent hover:text-white transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Active switch */}
                <button
                  type="button"
                  onClick={() => onUpdate(node.id, { isActive: !node.isActive })}
                  title={node.isActive ? 'Tạm tắt hạng mục' : 'Bật kích hoạt hạng mục'}
                  className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                    node.isActive ? 'bg-family-accent' : 'bg-gray-400'
                  }`}
                >
                  <div className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-200 ${
                    node.isActive ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>

                {/* Root groups and level 1 & 2 items can be deleted */}
                <button
                  type="button"
                  onClick={() => onDelete(node.id)}
                  title="Xóa hạng mục"
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
