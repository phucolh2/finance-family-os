import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Target, Heart, CheckCircle2, Plus, Trash2, Map, Star, Gift, BookHeart, ShieldCheck } from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface BucketItem {
  id: string;
  title: string;
  category: 'travel' | 'experience' | 'purchase' | 'other';
  isCompleted: boolean;
}

interface FamilyRule {
  id: string;
  rule: string;
}

const CATEGORIES = {
  travel: { label: 'Du lịch', icon: Map, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  experience: { label: 'Trải nghiệm', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  purchase: { label: 'Mua sắm lớn', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  other: { label: 'Khác', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
};

export const VisionBoard: React.FC = () => {
  const { state, updateToolConfig } = useAppState();
  
  const config = state.toolConfigs?.visionBoard || { bucketList: [], rules: [] };
  const bucketList: BucketItem[] = config.bucketList || [];
  const rules: FamilyRule[] = config.rules || [];

  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [newBucketCategory, setNewBucketCategory] = useState<keyof typeof CATEGORIES>('experience');
  const [newRule, setNewRule] = useState('');

  const saveConfig = (newBucketList: BucketItem[], newRules: FamilyRule[]) => {
    updateToolConfig('visionBoard', { bucketList: newBucketList, rules: newRules });
  };

  const handleAddBucketItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketTitle.trim()) return;
    const newItem: BucketItem = {
      id: crypto.randomUUID(),
      title: newBucketTitle.trim(),
      category: newBucketCategory,
      isCompleted: false
    };
    saveConfig([...bucketList, newItem], rules);
    setNewBucketTitle('');
  };

  const toggleBucketItem = (id: string) => {
    saveConfig(
      bucketList.map(b => b.id === id ? { ...b, isCompleted: !b.isCompleted } : b),
      rules
    );
  };

  const deleteBucketItem = (id: string) => {
    saveConfig(bucketList.filter(b => b.id !== id), rules);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    saveConfig(bucketList, [...rules, { id: crypto.randomUUID(), rule: newRule.trim() }]);
    setNewRule('');
  };

  const deleteRule = (id: string) => {
    saveConfig(bucketList, rules.filter(r => r.id !== id));
  };

  // Sort bucket items: incomplete first
  const sortedBucketList = [...bucketList].sort((a, b) => {
    if (a.isCompleted && !b.isCompleted) return 1;
    if (!a.isCompleted && b.isCompleted) return -1;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-family-text font-serif">Ước Mơ & Văn Hóa</h1>
          <HelpTooltip text="Bảng Tầm nhìn (Vision Board) giúp gia đình ghi lại những ước mơ, mục tiêu chung (Family Bucket List) và những nguyên tắc ứng xử để giữ gìn hạnh phúc gia đình." />
        </div>
        <p className="text-sm text-family-textMuted mt-1">
          Những mong muốn cả nhà sẽ cùng làm và những nguyên tắc yêu thương
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bucket List */}
        <Card className="border-amber-500/20 bg-gradient-to-b from-family-bg to-amber-500/5">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-family-text">
              <Target className="w-5 h-5 text-amber-500" />
              Family Bucket List
            </CardTitle>
            <p className="text-sm text-family-textMuted font-normal mt-1">
              Những trải nghiệm gia đình muốn làm cùng nhau
            </p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <form onSubmit={handleAddBucketItem} className="flex gap-2">
              <select 
                value={newBucketCategory}
                onChange={e => setNewBucketCategory(e.target.value as keyof typeof CATEGORIES)}
                className="bg-family-bgDark/50 border border-amber-500/20 rounded-xl px-3 py-2 text-sm text-family-text focus:outline-none shrink-0"
              >
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.label}</option>
                ))}
              </select>
              <input 
                type="text"
                value={newBucketTitle}
                onChange={e => setNewBucketTitle(e.target.value)}
                placeholder="VD: Cắm trại Đà Lạt, Du lịch Nhật..."
                className="flex-1 min-w-0 bg-family-bgDark/50 border border-amber-500/20 rounded-xl px-4 py-2 text-sm text-family-text focus:outline-none focus:border-amber-500/50"
              />
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 p-2 w-10 h-10 rounded-xl">
                <Plus className="w-5 h-5" />
              </Button>
            </form>

            <div className="space-y-2 mt-4">
              {sortedBucketList.length === 0 ? (
                <div className="text-center py-8 text-family-textMuted text-sm">Hãy thêm một mục tiêu để cả nhà cùng phấn đấu nhé!</div>
              ) : (
                sortedBucketList.map(item => {
                  const catDef = CATEGORIES[item.category];
                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${item.isCompleted ? 'bg-amber-500/5 border-amber-500/20 opacity-60' : 'bg-family-bgDark/60 border-white/5 hover:border-amber-500/30'}`}
                      onClick={() => toggleBucketItem(item.id)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {item.isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-amber-500 shrink-0" />
                        ) : (
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${catDef.bg} ${catDef.color}`}>
                            {React.createElement(catDef.icon, { className: "w-5 h-5" })}
                          </div>
                        )}
                        <span className={`text-base font-medium truncate transition-all ${item.isCompleted ? 'text-family-textMuted line-through' : 'text-family-text'}`}>
                          {item.title}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteBucketItem(item.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-family-textMuted hover:text-red-400 transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Family Rules / Core Values */}
        <Card className="border-sky-500/20 bg-gradient-to-b from-family-bg to-sky-500/5">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-family-text">
              <BookHeart className="w-5 h-5 text-sky-500" />
              Nguyên tắc & Văn hoá
            </CardTitle>
            <p className="text-sm text-family-textMuted font-normal mt-1">
              Những quy ước chung để gia đình luôn hạnh phúc
            </p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <form onSubmit={handleAddRule} className="flex gap-2">
              <input 
                type="text"
                value={newRule}
                onChange={e => setNewRule(e.target.value)}
                placeholder="VD: Không cãi nhau trước mặt con..."
                className="flex-1 bg-family-bgDark/50 border border-sky-500/20 rounded-xl px-4 py-2 text-sm text-family-text focus:outline-none focus:border-sky-500/50"
              />
              <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white shrink-0 p-2 w-10 h-10 rounded-xl">
                <Plus className="w-5 h-5" />
              </Button>
            </form>

            <div className="space-y-3 mt-4">
              {rules.length === 0 ? (
                <div className="text-center py-8 text-family-textMuted text-sm">Chưa có nguyên tắc nào.</div>
              ) : (
                rules.map((rule, idx) => (
                  <div key={rule.id} className="flex items-start gap-3 bg-family-bgDark/40 p-3 rounded-xl border border-white/5 group relative">
                    <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    <p className="text-family-text text-sm leading-relaxed pr-6">
                      <span className="font-semibold text-sky-500/50 mr-2">#{idx + 1}</span>
                      {rule.rule}
                    </p>
                    <button 
                      onClick={() => deleteRule(rule.id)}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-family-textMuted hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
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
