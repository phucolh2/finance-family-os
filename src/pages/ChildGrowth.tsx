import React, { useState, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Baby, Plus, Calendar, Trophy, Trash2, X, Ruler } from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface GrowthRecord {
  id: string;
  childName: string;
  date: string;
  height: number; // cm
  weight: number; // kg
}

interface Milestone {
  id: string;
  childName: string;
  date: string;
  title: string;
  notes: string;
}

export const ChildGrowth: React.FC = () => {
  const { state, updateToolConfig } = useAppState();
  
  const config = state.toolConfigs?.childGrowth || { children: [], records: [], milestones: [] };
  const childrenNames: string[] = config.children || [];
  const records: GrowthRecord[] = config.records || [];
  const milestones: Milestone[] = config.milestones || [];

  const [activeChild, setActiveChild] = useState<string>(childrenNames[0] || '');
  const [newChildName, setNewChildName] = useState('');
  
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  const saveConfig = (newChildren: string[], newRecords: GrowthRecord[], newMilestones: Milestone[]) => {
    updateToolConfig('childGrowth', { children: newChildren, records: newRecords, milestones: newMilestones });
  };

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newChildName.trim();
    if (!name || childrenNames.includes(name)) return;
    const newChildren = [...childrenNames, name];
    saveConfig(newChildren, records, milestones);
    setActiveChild(name);
    setNewChildName('');
  };

  const activeRecords = useMemo(() => {
    return records.filter(r => r.childName === activeChild).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, activeChild]);

  const activeMilestones = useMemo(() => {
    return milestones.filter(m => m.childName === activeChild).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [milestones, activeChild]);

  const handleAddRecord = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRecord: GrowthRecord = {
      id: crypto.randomUUID(),
      childName: activeChild,
      date: formData.get('date') as string,
      height: Number(formData.get('height')),
      weight: Number(formData.get('weight'))
    };
    saveConfig(childrenNames, [...records, newRecord], milestones);
    setIsRecordModalOpen(false);
  };

  const handleAddMilestone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      childName: activeChild,
      date: formData.get('date') as string,
      title: formData.get('title') as string,
      notes: formData.get('notes') as string,
    };
    saveConfig(childrenNames, records, [...milestones, newMilestone]);
    setIsMilestoneModalOpen(false);
  };

  const deleteRecord = (id: string) => {
    saveConfig(childrenNames, records.filter(r => r.id !== id), milestones);
  };

  const deleteMilestone = (id: string) => {
    saveConfig(childrenNames, records, milestones.filter(m => m.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-family-text font-serif">Sổ tay Tăng trưởng</h1>
            <HelpTooltip text="Lưu giữ các chỉ số chiều cao, cân nặng và các cột mốc đáng nhớ trong hành trình khôn lớn của con (Chiếc răng đầu tiên, ngày biết đi, ngày đầu tới trường...)." />
          </div>
          <p className="text-sm text-family-textMuted mt-1">
            Ghi chép hành trình phát triển thể chất và tinh thần của các bé
          </p>
        </div>
      </div>

      <Card className="border-pink-500/20 bg-pink-500/5">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <form onSubmit={handleAddChild} className="flex gap-2 w-full md:w-auto">
            <input 
              type="text"
              value={newChildName}
              onChange={e => setNewChildName(e.target.value)}
              placeholder="Thêm bé (VD: Bún, Gạo)"
              className="bg-family-bgDark/50 border border-pink-500/20 rounded-xl px-4 py-2 text-sm text-family-text focus:outline-none focus:border-pink-500/50"
            />
            <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          <div className="flex gap-2 overflow-x-auto w-full hide-scrollbar">
            {childrenNames.map(child => (
              <button
                key={child}
                onClick={() => setActiveChild(child)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${activeChild === child ? 'bg-pink-500 text-white' : 'bg-family-bgDark/50 text-family-textMuted hover:bg-pink-500/20 hover:text-pink-400'}`}
              >
                {child}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {!activeChild ? (
        <div className="text-center py-12 text-family-textMuted">
          <Baby className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Vui lòng thêm tên bé để bắt đầu theo dõi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Cột Chỉ số Thể chất */}
          <Card className="border-sky-500/20">
            <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg text-family-text">
                <Ruler className="w-5 h-5 text-sky-500" />
                Chỉ số Thể chất
              </CardTitle>
              <Button size="sm" onClick={() => setIsRecordModalOpen(true)} className="bg-sky-600 hover:bg-sky-700 text-white">
                <Plus className="w-4 h-4 mr-1" /> Đo mới
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {activeRecords.length === 0 ? (
                <div className="text-center text-sm text-family-textMuted py-8">Chưa có bản ghi nào.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-family-bgDark/50 text-family-textMuted border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 font-medium">Ngày đo</th>
                      <th className="px-4 py-3 font-medium">Chiều cao</th>
                      <th className="px-4 py-3 font-medium">Cân nặng</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecords.map(record => (
                      <tr key={record.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-family-text">{new Date(record.date).toLocaleDateString('vi-VN')}</td>
                        <td className="px-4 py-3 font-medium text-sky-400">{record.height} cm</td>
                        <td className="px-4 py-3 font-medium text-emerald-400">{record.weight} kg</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => deleteRecord(record.id)} className="text-family-textMuted hover:text-red-400 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Cột Cột mốc đáng nhớ */}
          <Card className="border-amber-500/20">
            <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg text-family-text">
                <Trophy className="w-5 h-5 text-amber-500" />
                Cột mốc đáng nhớ
              </CardTitle>
              <Button size="sm" onClick={() => setIsMilestoneModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="w-4 h-4 mr-1" /> Thêm mốc
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {activeMilestones.length === 0 ? (
                <div className="text-center text-sm text-family-textMuted py-4">Chưa có cột mốc nào.</div>
              ) : (
                <div className="relative border-l-2 border-amber-500/20 ml-3 pl-4 space-y-6">
                  {activeMilestones.map(m => (
                    <div key={m.id} className="relative group">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      <div className="bg-family-bgDark/40 border border-white/5 rounded-xl p-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-family-text text-base">{m.title}</h4>
                          <button onClick={() => deleteMilestone(m.id)} className="opacity-0 group-hover:opacity-100 text-family-textMuted hover:text-red-400 transition-opacity p-1">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-family-textMuted mt-1 mb-2">
                          <Calendar className="w-3 h-3" /> {new Date(m.date).toLocaleDateString('vi-VN')}
                        </div>
                        {m.notes && <p className="text-sm text-family-textLight italic leading-relaxed">{m.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      )}

      {/* Modal Kỷ lục Thể chất */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-family-bg border border-sky-500/20 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-4 border-b bg-sky-500/10 flex justify-between items-center">
              <h2 className="font-bold text-family-text">Nhập Đo lường mới</h2>
              <button onClick={() => setIsRecordModalOpen(false)}><X className="w-5 h-5 text-family-textMuted" /></button>
            </div>
            <form onSubmit={handleAddRecord} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-family-textLight mb-1">Ngày đo</label>
                <input required type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2 text-sm text-family-text" style={{colorScheme:'dark'}}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-family-textLight mb-1">Chiều cao (cm)</label>
                  <input required type="number" step="0.1" name="height" className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2 text-sm text-family-text"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-textLight mb-1">Cân nặng (kg)</label>
                  <input required type="number" step="0.1" name="weight" className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2 text-sm text-family-text"/>
                </div>
              </div>
              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white mt-2">Lưu Chỉ số</Button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cột mốc */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-family-bg border border-amber-500/20 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-4 border-b bg-amber-500/10 flex justify-between items-center">
              <h2 className="font-bold text-family-text">Thêm Kỷ niệm / Cột mốc</h2>
              <button onClick={() => setIsMilestoneModalOpen(false)}><X className="w-5 h-5 text-family-textMuted" /></button>
            </div>
            <form onSubmit={handleAddMilestone} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-family-textLight mb-1">Tên sự kiện *</label>
                <input required name="title" placeholder="VD: Chiếc răng đầu tiên..." className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2 text-sm text-family-text"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-family-textLight mb-1">Ngày xảy ra</label>
                <input required type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2 text-sm text-family-text" style={{colorScheme:'dark'}}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-family-textLight mb-1">Kể lại chi tiết (Tuỳ chọn)</label>
                <textarea name="notes" rows={3} placeholder="Ghi lại cảm xúc, hoàn cảnh..." className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2 text-sm text-family-text resize-none"/>
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-2">Lưu Kỷ niệm</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
