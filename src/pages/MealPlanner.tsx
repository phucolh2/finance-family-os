import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Utensils, ShoppingCart, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface Meal {
  id: string;
  day: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  name: string;
}

interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
}

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const TYPES = [
  { id: 'breakfast', label: 'Sáng' },
  { id: 'lunch', label: 'Trưa' },
  { id: 'dinner', label: 'Tối' }
];

export const MealPlanner: React.FC = () => {
  const { state, updateToolConfig } = useAppState();
  
  const config = state.toolConfigs?.mealPlanner || { meals: [], groceries: [] };
  const meals: Meal[] = config.meals || [];
  const groceries: GroceryItem[] = config.groceries || [];

  const [newGrocery, setNewGrocery] = useState('');

  const saveConfig = (newMeals: Meal[], newGroceries: GroceryItem[]) => {
    updateToolConfig('mealPlanner', { meals: newMeals, groceries: newGroceries });
  };

  const handleMealChange = (day: string, type: string, value: string) => {
    const existingIndex = meals.findIndex(m => m.day === day && m.type === type);
    let newMeals = [...meals];
    
    if (value.trim() === '') {
      if (existingIndex >= 0) newMeals.splice(existingIndex, 1);
    } else {
      if (existingIndex >= 0) {
        newMeals[existingIndex].name = value;
      } else {
        newMeals.push({
          id: crypto.randomUUID(),
          day,
          type: type as any,
          name: value
        });
      }
    }
    saveConfig(newMeals, groceries);
  };

  const getMeal = (day: string, type: string) => {
    return meals.find(m => m.day === day && m.type === type)?.name || '';
  };

  const handleAddGrocery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrocery.trim()) return;
    const newItem: GroceryItem = { id: crypto.randomUUID(), name: newGrocery.trim(), checked: false };
    saveConfig(meals, [newItem, ...groceries]);
    setNewGrocery('');
  };

  const toggleGrocery = (id: string) => {
    const newGroceries = groceries.map(g => g.id === id ? { ...g, checked: !g.checked } : g);
    saveConfig(meals, newGroceries);
  };

  const deleteGrocery = (id: string) => {
    saveConfig(meals, groceries.filter(g => g.id !== id));
  };

  const clearCheckedGroceries = () => {
    saveConfig(meals, groceries.filter(g => !g.checked));
  };

  const clearAllMeals = () => {
    if (window.confirm('Xoá toàn bộ thực đơn tuần này để làm lại?')) {
      saveConfig([], groceries);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-family-text font-serif">Cơm Nhà & Đi Chợ</h1>
          <HelpTooltip text="Công cụ giúp gia đình lên thực đơn tuần để chống lãng phí thức ăn (Food waste) và tiết kiệm thời gian đi siêu thị. Danh sách đi chợ được thiết kế để dễ dàng tick chọn ngay trên điện thoại." />
        </div>
        <p className="text-sm text-family-textMuted mt-1">
          Món ngon mỗi ngày và danh sách mua sắm cho bữa cơm gia đình thêm ấm cúng
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bảng Thực đơn */}
        <Card className="lg:col-span-2 border-orange-500/10">
          <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-family-text">
              <Utensils className="w-5 h-5 text-orange-500" />
              Thực đơn trong tuần
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearAllMeals} className="text-xs text-family-textMuted hover:text-red-400">
              Xoá lịch
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap min-w-[600px]">
              <thead className="bg-family-bgDark/50 text-family-textMuted">
                <tr>
                  <th className="px-4 py-3 font-medium border-b border-white/5 w-24">Thứ</th>
                  {TYPES.map(t => (
                    <th key={t.id} className="px-4 py-3 font-medium border-b border-white/5 w-1/3 text-center">{t.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  <tr key={day} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-semibold text-family-text bg-family-bgDark/20">{day}</td>
                    {TYPES.map(t => (
                      <td key={t.id} className="p-2">
                        <textarea
                          rows={2}
                          placeholder="Nhập món..."
                          value={getMeal(day, t.id)}
                          onChange={e => handleMealChange(day, t.id, e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-orange-500/20 focus:border-orange-500/50 rounded-lg p-2 text-sm text-family-text focus:outline-none resize-none transition-colors"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Danh sách đi chợ */}
        <Card className="border-emerald-500/10 flex flex-col max-h-[600px]">
          <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-family-text">
              <ShoppingCart className="w-5 h-5 text-emerald-500" />
              Danh sách đi chợ
            </CardTitle>
            {groceries.some(g => g.checked) && (
              <Button variant="outline" size="sm" onClick={clearCheckedGroceries} className="text-xs text-family-textMuted hover:text-emerald-400">
                Xoá mục đã mua
              </Button>
            )}
          </CardHeader>
          
          <CardContent className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
            <form onSubmit={handleAddGrocery} className="flex gap-2 shrink-0">
              <input 
                type="text"
                value={newGrocery}
                onChange={e => setNewGrocery(e.target.value)}
                placeholder="VD: Thịt bò, Trứng, Sữa..."
                className="flex-1 bg-family-bgDark/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-sm text-family-text focus:outline-none focus:border-emerald-500/50"
              />
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 w-10 h-10 rounded-xl">
                <Plus className="w-5 h-5" />
              </Button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {groceries.length === 0 ? (
                <div className="text-center text-sm text-family-textMuted py-8">
                  Chưa có đồ cần mua.
                </div>
              ) : (
                groceries.map(item => (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer hover:bg-white/5 ${item.checked ? 'bg-emerald-500/5 border-emerald-500/10 opacity-60' : 'bg-family-bgDark/40 border-white/5'}`}
                    onClick={() => toggleGrocery(item.id)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {item.checked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-family-textMuted shrink-0" />
                      )}
                      <span className={`text-sm truncate transition-all ${item.checked ? 'text-family-textMuted line-through' : 'text-family-text'}`}>
                        {item.name}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteGrocery(item.id); }}
                      className="p-1 text-family-textMuted hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
