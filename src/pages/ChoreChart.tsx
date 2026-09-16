import React, { useState, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { CheckSquare, Plus, Trash2, Trophy, Star, X, Check } from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

interface Chore {
  id: string;
  title: string;
  assignee: string;
  points: number;
  isDone: boolean;
}

export const ChoreChart: React.FC = () => {
  const { state, updateToolConfig } = useAppState();
  
  const config = state.toolConfigs?.choreChart || { chores: [], members: [] };
  const chores: Chore[] = config.chores || [];
  const members: string[] = config.members || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const saveConfig = (newChores: Chore[], newMembers: string[]) => {
    updateToolConfig('choreChart', { chores: newChores, members: newMembers });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || members.includes(newMemberName.trim())) return;
    saveConfig(chores, [...members, newMemberName.trim()]);
    setNewMemberName('');
  };

  const handleRemoveMember = (name: string) => {
    if (window.confirm(`Xoá thành viên ${name} và toàn bộ việc nhà của họ?`)) {
      saveConfig(
        chores.filter(c => c.assignee !== name),
        members.filter(m => m !== name)
      );
    }
  };

  const handleAddChore = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newChore: Chore = {
      id: crypto.randomUUID(),
      title: formData.get('title') as string,
      assignee: formData.get('assignee') as string,
      points: Number(formData.get('points')) || 1,
      isDone: false
    };
    saveConfig([...chores, newChore], members);
    setIsModalOpen(false);
  };

  const toggleChore = (id: string) => {
    saveConfig(
      chores.map(c => c.id === id ? { ...c, isDone: !c.isDone } : c),
      members
    );
  };

  const deleteChore = (id: string) => {
    saveConfig(chores.filter(c => c.id !== id), members);
  };

  const resetAllChores = () => {
    if (window.confirm('Khởi tạo lại tuần mới? Tất cả các việc nhà sẽ được chuyển về trạng thái Chưa hoàn thành.')) {
      saveConfig(chores.map(c => ({ ...c, isDone: false })), members);
    }
  };

  const memberScores = useMemo(() => {
    const scores: Record<string, number> = {};
    members.forEach(m => scores[m] = 0);
    chores.forEach(c => {
      if (c.isDone && scores[c.assignee] !== undefined) {
        scores[c.assignee] += c.points;
      }
    });
    return scores;
  }, [chores, members]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-family-text font-serif">Cùng Làm Việc Nhà</h1>
            <HelpTooltip text="Công cụ giúp gia đình phân công việc nhà cho các thành viên (đặc biệt là trẻ em). Khi hoàn thành việc nhà sẽ nhận được 'Điểm thưởng' (Stars), có thể dùng để đổi lấy quyền lợi hoặc tiền tiêu vặt." />
          </div>
          <p className="text-sm text-family-textMuted mt-1">
            Khuyến khích các thiên thần nhỏ san sẻ việc nhà và nhận sao khen thưởng
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={resetAllChores}
            variant="outline"
          >
            Bắt đầu Tuần Mới
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={members.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Giao Việc
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Cột Danh sách Thành viên & Bảng Xếp hạng */}
        <Card className="md:col-span-1 border-indigo-500/10 h-fit">
          <CardContent className="p-4 flex flex-col gap-4">
            <h3 className="font-semibold text-family-text flex items-center gap-2">
              <Trophy className="w-4 h-4 text-indigo-500" />
              Thành viên & Điểm
            </h3>
            
            <form onSubmit={handleAddMember} className="flex gap-2">
              <input 
                type="text"
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                placeholder="Tên (VD: Bún, Gạo...)"
                className="flex-1 min-w-0 bg-family-bgDark/50 border border-indigo-500/20 rounded-lg px-3 py-1.5 text-sm text-family-text focus:outline-none focus:border-indigo-500/50"
              />
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 w-8 h-8 rounded-lg shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </form>

            <div className="flex flex-col gap-2 mt-2">
              {members.length === 0 ? (
                <div className="text-xs text-family-textMuted text-center py-4">Chưa có thành viên nào. Thêm tên để bắt đầu giao việc.</div>
              ) : (
                members.map(member => (
                  <div key={member} className="flex items-center justify-between bg-family-bgDark/40 p-2.5 rounded-lg border border-white/5 group">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {member.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-family-text truncate">{member}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
                        {memberScores[member]} <Star className="w-3 h-3 fill-amber-400" />
                      </span>
                      <button onClick={() => handleRemoveMember(member)} className="opacity-0 group-hover:opacity-100 text-family-textMuted hover:text-red-400 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cột Danh sách Việc nhà */}
        <div className="md:col-span-3">
          {chores.length === 0 ? (
            <EmptyState 
              icon={<CheckSquare className="w-8 h-8 text-indigo-500/50" />}
              title="Chưa có công việc nào"
              description="Hãy thêm thành viên và bắt đầu giao các việc nhà cơ bản như Gấp chăn màn, Đổ rác, Rửa bát."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {chores.map(chore => (
                <Card 
                  key={chore.id} 
                  className={`cursor-pointer transition-all ${chore.isDone ? 'bg-indigo-500/5 border-indigo-500/20 opacity-70' : 'bg-family-bg hover:border-indigo-500/40 border-white/5'}`}
                  onClick={() => toggleChore(chore.id)}
                >
                  <CardContent className="p-4 flex flex-col h-full gap-3 relative">
                    <div className="flex justify-between items-start gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border transition-colors ${chore.isDone ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-family-textMuted/40 text-transparent'}`}>
                        <Check className="w-4 h-4" />
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteChore(chore.id); }}
                        className="text-family-textMuted hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex-1 mt-1">
                      <h4 className={`font-semibold ${chore.isDone ? 'line-through text-family-textMuted' : 'text-family-text'}`}>
                        {chore.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                      <span className="text-xs font-medium text-family-textMuted bg-family-bgDark/50 px-2 py-1 rounded">
                        {chore.assignee}
                      </span>
                      <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
                        +{chore.points} <Star className="w-3 h-3 fill-amber-400" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-family-bg border border-indigo-500/20 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-indigo-500/10 border-indigo-500/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-family-text">Giao Việc Mới</h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-family-textMuted hover:text-family-text hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddChore} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Tên công việc *</label>
                <input 
                  required
                  name="title"
                  placeholder="VD: Quét nhà, Rửa bát, Gấp chăn màn..."
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Giao cho *</label>
                <select 
                  required
                  name="assignee"
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-indigo-500/50"
                >
                  {members.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Điểm thưởng (Stars) *</label>
                <input 
                  required
                  type="number"
                  name="points"
                  min="1"
                  defaultValue="1"
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-family-accent/10">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Thêm Việc
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
