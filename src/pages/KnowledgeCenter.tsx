import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { KNOWLEDGE_ITEMS } from '../data/knowledgeItems';
import { 
  BookOpen, 
  Info, 
  Award, 
  Lightbulb, 
  HeartHandshake
} from 'lucide-react';
import { SimpleMarkdown } from '../components/ui/SimpleMarkdown';
import { RELATIONSHIP_GUIDE_MD } from '../data/relationshipGuide';

export const KnowledgeCenter: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'economics' | 'relationship'>('economics');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('all');

  // Filter items based on query and related module (for economics tab)
  const filteredItems = KNOWLEDGE_ITEMS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.simpleMeaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesModule = filterModule === 'all' || item.relatedModule === filterModule;
    return matchesSearch && matchesModule;
  });

  const uniqueModules = Array.from(new Set(KNOWLEDGE_ITEMS.map((item) => item.relatedModule)));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-family-accent" /> Trung tâm Kiến thức
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Hệ sinh thái tri thức gia đình gồm kinh tế học Nobel và cẩm nang xây dựng tổ ấm hạnh phúc.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-family-accent/15 pb-2">
        <button
          onClick={() => { setActiveSubTab('economics'); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'economics'
              ? 'bg-family-accent text-white shadow-sm'
              : 'text-family-textMuted hover:bg-family-bgDark/30'
          }`}
        >
          🔬 Lý thuyết Tài chính & Kinh tế
        </button>
        <button
          onClick={() => { setActiveSubTab('relationship'); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'relationship'
              ? 'bg-family-accent text-white shadow-sm'
              : 'text-family-textMuted hover:bg-family-bgDark/30'
          }`}
        >
          ❤️ Cẩm nang Hạnh phúc Vợ chồng
        </button>
      </div>

      {/* Tab 1: Economics Theories */}
      {activeSubTab === 'economics' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <Card className="bg-family-bgDark/20 border-family-accent/15">
            <CardContent className="pt-4 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:flex-1">
                <Input
                  label="Tìm kiếm lý thuyết"
                  type="text"
                  placeholder="Nhập tên lý thuyết, tác giả hoặc từ khóa..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); }}
                />
              </div>
              <div className="w-full md:w-64">
                <Select
                  label="Lọc theo Tính năng ứng dụng"
                  value={filterModule}
                  onChange={(e) => { setFilterModule(e.target.value); }}
                  options={[
                    { value: 'all', label: 'Tất cả tính năng' },
                    ...uniqueModules.map((m) => ({ value: m, label: m })),
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Concept Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <Card key={item.id} className="hover:border-family-accent/30 transition-all flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-2 border-b border-family-accent/5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-family-bgDark/60 text-family-textLight">
                          {item.relatedModule}
                        </span>
                        {item.author.includes('Nobel') && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-0.5">
                            <Award className="w-3 h-3" /> Nobel
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-base font-serif font-bold text-family-text mt-1.5">
                        {item.name}
                      </CardTitle>
                      <CardDescription className="italic text-[11px] text-family-textLight">
                        Tác giả: {item.author}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-3 text-xs leading-relaxed text-family-textMuted">
                      <div>
                        <strong className="text-family-text block font-semibold mb-0.5 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-family-accent shrink-0" /> Nghĩa cốt lõi dễ hiểu:
                        </strong>
                        <p>{item.simpleMeaning}</p>
                      </div>
                      <div>
                        <strong className="text-family-text block font-semibold mb-0.5 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-green-700 shrink-0" /> Ứng dụng gia đình:
                        </strong>
                        <p>{item.familyApplication}</p>
                      </div>
                    </CardContent>
                  </div>
                  <CardContent className="pt-0">
                    <div className="p-3 bg-family-bgDark/20 rounded-xl border border-family-accent/5 text-[11px]">
                      <strong className="text-family-text block font-bold mb-0.5">Ví dụ số học minh họa:</strong>
                      <p className="text-family-textLight italic">{item.numericExample}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2">
                <Card className="border-dashed border-family-accent/20 py-12 text-center">
                  <CardContent>
                    <p className="text-sm text-family-textMuted">Không tìm thấy khái niệm kiến thức nào khớp với bộ lọc.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Relationship Guide (Cẩm nang Hạnh phúc Vợ chồng) */}
      {activeSubTab === 'relationship' && (
        <div className="space-y-8">
          
          {/* Header introduction */}
          <Card className="bg-gradient-to-r from-family-accent/10 to-family-bgDark/20 border-family-accent/15">
            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="p-4 bg-white/80 rounded-2xl shadow-sm text-family-accent">
                <HeartHandshake className="w-12 h-12" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-bold text-family-text">Cẩm Nang Sống Tỉnh Thức Cho Vợ Chồng</h3>
                <p className="text-xs text-family-textMuted leading-relaxed">
                  Tập hợp các nguyên tắc cốt lõi giúp nuôi dưỡng tình yêu thấu hiểu, đối diện sự thật trách nhiệm và phòng ngừa các thói quen tiêu cực phá hủy tổ ấm.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-family-accent/15">
            <CardContent className="p-6 md:p-10">
              <SimpleMarkdown content={RELATIONSHIP_GUIDE_MD} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
