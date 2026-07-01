import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { KNOWLEDGE_ITEMS } from '../data/knowledgeItems';
import { BookOpen, Search, Filter, Info, Award, Lightbulb } from 'lucide-react';

export const KnowledgeCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('all');

  // Filter items based on query and related module
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-family-accent" /> Trung tâm Kiến thức
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Thư viện các lý thuyết tài chính và kinh tế học Nobel ứng dụng vào cuộc sống gia đình bền vững.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-family-bgDark/20 border-family-accent/15">
        <CardContent className="pt-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <Input
              label="Tìm kiếm lý thuyết"
              type="text"
              placeholder="Nhập tên lý thuyết, tác giả hoặc từ khóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              label="Lọc theo Module ứng dụng"
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              options={[
                { value: 'all', label: 'Tất cả module' },
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
  );
};
