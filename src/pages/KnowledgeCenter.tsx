import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { KNOWLEDGE_ITEMS } from '../data/knowledgeItems';
import { Button } from '../components/ui/Button';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Info, 
  Award, 
  Lightbulb, 
  Heart, 
  Flame, 
  HeartHandshake, 
  AlertTriangle, 
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  FlameKindling
} from 'lucide-react';

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
          onClick={() => setActiveSubTab('economics')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'economics'
              ? 'bg-family-accent text-white shadow-sm'
              : 'text-family-textMuted hover:bg-family-bgDark/30'
          }`}
        >
          🔬 Lý thuyết Tài chính & Kinh tế
        </button>
        <button
          onClick={() => setActiveSubTab('relationship')}
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

          {/* Dos Card Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Nuôi dưỡng Tình yêu */}
            <Card className="border-l-4 border-l-pink-600 bg-white/70 shadow-sm">
              <CardHeader className="pb-3 border-b border-family-accent/5">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-pink-600 flex items-center gap-2">
                  <span>💗</span> Nuôi dưỡng Tình yêu (Love) & Sự thấu hiểu
                </CardTitle>
                <CardDescription className="text-xs">10 điều vàng vun đắp sự gắn kết hàng ngày</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <ul className="space-y-3.5 text-xs text-family-textMuted">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">1. Lắng nghe để thấu cảm, không phải để phản biện:</strong>
                      Khi đối phương lên tiếng, hãy đặt cái tôi xuống, lắng nghe trọn vẹn cảm xúc của họ thay vì vừa nghe vừa chuẩn bị lý lẽ để cãi lại.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">2. Công nhận và khen ngợi năng lượng đặc trưng:</strong>
                      Vợ chủ động công nhận sự nỗ lực, gánh vác của chồng (năng lượng nam tính); Chồng chủ động khen ngợi sự dịu dàng, vun vén và nhan sắc của vợ (năng lượng nữ tính).
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">3. Chấp nhận sự khác biệt cốt lõi:</strong>
                      Luôn tự nhắc nhở bản thân rằng đàn ông và phụ nữ có hai hệ điều hành tâm lý hoàn toàn khác nhau để ngừng kỳ vọng đối phương phải suy nghĩ giống mình.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">4. Học cách nói rõ ràng nhu cầu cá nhân:</strong>
                      Hãy dùng thể câu "Em/Anh cần..." hoặc "Em/Anh cảm thấy..." một cách trực diện và nhẹ nhàng, thay vì bắt đối phương phải tự đoán qua thái độ.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">5. Duy trì nghi thức kết nối hàng ngày:</strong>
                      Dành ít nhất 15–30 phút mỗi ngày để thực sự hiện diện bên nhau (không điện thoại), hỏi han về cảm xúc và một ngày của nhau.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">6. Ôm và tiếp xúc vật lý thường xuyên:</strong>
                      Cái ôm chào buổi sáng, nụ hôn trước khi đi làm hay cái nắm tay khi đi dạo giúp kích hoạt hormone gắn kết (Oxytocin).
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">7. Thiết lập "Date Night" định kỳ:</strong>
                      Mỗi tuần hoặc hai tuần một lần, hãy đi hẹn hò riêng chỉ có hai người. Quy tắc: Không bàn về tiền bạc, áp lực công việc hay chuyện nuôi dạy con.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">8. Đồng hành trong việc phát triển bản thân:</strong>
                      Cùng nhau đọc sách, học tập hoặc chia sẻ các kiến thức về tâm lý, hôn nhân để có chung một hệ ngôn ngữ tư duy.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">9. Tôn trọng khoảng không gian riêng (Me-time):</strong>
                      Cho phép đối phương có thời gian riêng bên bạn bè, sở thích cá nhân hoặc đơn giản là ở một mình để tái tạo năng lượng.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">10. Bảo vệ bạn đời trước áp lực bên ngoài:</strong>
                      Người chồng làm lá chắn cho vợ trước mối quan hệ mẹ chồng - nàng dâu; người vợ làm hậu phương bảo vệ uy tín cho chồng trước thiên hạ.
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Đối diện với Sự thật & Trách nhiệm */}
            <Card className="border-l-4 border-l-teal bg-white/70 shadow-sm">
              <CardHeader className="pb-3 border-b border-family-accent/5">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-teal-800 flex items-center gap-2">
                  <span>⚓</span> Đối diện với Sự thật (Truth) & Trách nhiệm
                </CardTitle>
                <CardDescription className="text-xs">10 nền tảng kỷ luật đảm bảo sự ổn định của tổ ấm</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <ul className="space-y-3.5 text-xs text-family-textMuted">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">1. Chịu trách nhiệm 100% về hạnh phúc cá nhân:</strong>
                      Nhìn nhận sự thật rằng không ai có nghĩa vụ phải làm cho bạn hạnh phúc. Hạnh phúc tự thân của bạn vững vàng thì tổ ấm mới kiên cố.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">2. Gặp nhau ở vùng sự thật khi có biến cố:</strong>
                      Khi có mâu thuẫn, thay vì dùng lớp vỏ bọc tức giận hay tự ái, hãy dũng cảm nói ra sự thật về nỗi sợ hoặc sự tổn thương bên trong của mình.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">3. Minh bạch hoàn toàn về tài chính:</strong>
                      Ngồi lại thiết lập một bài toán tài chính rõ ràng: thu nhập, quỹ chung, quỹ phòng ngừa rủi ro và mục tiêu đầu tư dài hạn.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">4. Thống nhất tư duy nuôi dạy con:</strong>
                      Chia sẻ thẳng thắn về quan điểm giáo dục, phân vai trong việc dạy con để tránh tình trạng "trống đánh xuôi, kèn thổi ngược" trước mặt con cái.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">5. Sửa mình trước khi sửa người:</strong>
                      Khi mối quan hệ có trục trặc, câu hỏi đầu tiên luôn là: "Tôi đã vô tình hay cố ý góp phần tạo nên kết quả này như thế nào?".
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">6. Học cách bao dung cho những khuyết điểm không bản chất:</strong>
                      Nhìn thẳng vào sự thật rằng bạn đời là một con người không hoàn hảo, học cách sống chung với những thói quen nhỏ chưa tốt của họ.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">7. Lên kế hoạch bảo trì hôn nhân:</strong>
                      Định kỳ 3 hoặc 6 tháng, hai vợ chồng cùng ngồi lại đánh giá "sức khỏe" của mối quan hệ, thẳng thắn nhìn nhận những điều chưa ổn để điều chỉnh.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">8. Chủ động xin lỗi khi nhận ra mình sai:</strong>
                      Đặt sự sống còn của hôn nhân lên trên sĩ diện của cái tôi cá nhân. Một lời xin lỗi chân thành là liều thuốc chữa lành nhanh nhất.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">9. Tạo giá trị cho nhau mỗi ngày:</strong>
                      Luôn tự hỏi: "Hôm nay mình có thể làm điều gì để cuộc sống của bạn đời nhẹ nhàng hoặc vui vẻ hơn?".
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">10. Biết ơn sự hiện diện của nhau:</strong>
                      Trân trọng những điều nhỏ bé đối phương làm cho gia đình và nói lời "cảm ơn" một cách tự nhiên, thường xuyên.
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Don'ts Section */}
          <Card className="border-l-4 border-l-red-600 bg-white/70 shadow-sm">
            <CardHeader className="pb-3 border-b border-family-accent/5">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-red-600 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> 10 Điều Cần Tránh (Hủy hoại Tổ ấm)
              </CardTitle>
              <CardDescription className="text-xs">Nhận diện các độc tố hành vi cần triệt tiêu lập tức</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <ul className="space-y-3.5 text-xs text-family-textMuted">
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">1. Cằn nhằn và chỉ trích dai dẳng:</strong>
                      Đây là vũ khí triệt tiêu năng lượng nam tính của người chồng và đẩy họ ra xa ngôi nhà nhanh nhất.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">2. Chiến tranh lạnh và im lặng trừng phạt:</strong>
                      Việc từ chối giao tiếp không giải quyết được vấn đề mà chỉ làm tích tụ độc tố cảm xúc, đẩy khoảng cách hai người ra xa vô tận.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">3. Kiểm soát độc hại:</strong>
                      Quản lý từng tin nhắn, cuộc gọi, giờ giấc hay soi xét các mối quan hệ xã hội của đối phương dưới sự định kiến và thiếu tin tưởng.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">4. Hạ thấp thể diện của bạn đời nơi đông người:</strong>
                      Chê bai, nói xấu hoặc lôi khuyết điểm của vợ/chồng ra làm trò đùa trước mặt con cái, gia đình hay bạn bè.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">5. Đóng vai nạn nhân:</strong>
                      Luôn đổ lỗi cho đối phương là nguyên nhân của mọi đau khổ, rắc rối trong đời mình và từ chối nhìn nhận trách nhiệm của bản thân.
                    </div>
                  </li>
                </ul>
                <ul className="space-y-3.5 text-xs text-family-textMuted">
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">6. Nhai lại chuyện cũ khi tranh luận:</strong>
                      Lôi những lỗi lầm từ nhiều năm trước đã qua ra để tấn công đối phương trong một cuộc tranh cãi hiện tại.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">7. Đem hôn nhân ra đe dọa:</strong>
                      Hở một chút là nói lời "ly hôn", "ly thân" hoặc bỏ về nhà đẻ. Việc này làm bào mòn nghiêm trọng cảm giác an toàn trong hôn nhân.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">8. So sánh bạn đời với người khác:</strong>
                      "Nhìn chồng/vợ nhà người ta kìa..." là câu nói sát thương cực lớn, tạo ra tâm lý tự ái, oán hận và bất mãn ngầm.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">9. Vô tâm, bỏ mặc cảm xúc của đối phương:</strong>
                      Thấy vợ khóc hoặc thấy chồng áp lực nhưng thờ ơ, xem nhẹ hoặc bỏ đi nhậu nhẹt, xem điện thoại.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-family-text block font-bold">10. Bạo lực ngôn từ và hành vi:</strong>
                      Dùng những từ ngữ xúc phạm nhân phẩm, xưng hô mày-tao khi tức giận, hoặc sử dụng sức mạnh thể xác để áp chế.
                    </div>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 10 Core Principles Section */}
          <Card className="border border-family-accent/20 bg-family-accent/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full filter blur-2xl" />
            <CardHeader className="pb-3 border-b border-family-accent/5">
              <CardTitle className="text-base font-serif font-bold text-family-text flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-600" /> 10 Nguyên Tắc Cốt Lõi Để Xây Dựng Tổ Ấm
              </CardTitle>
              <CardDescription className="text-xs">
                Hôn nhân thành công không phải là tìm được một người hoàn hảo, mà là cách hai con người không hoàn hảo học cách vận hành một dự án cuộc đời bằng sự tỉnh thức.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-family-textMuted">
                <div className="space-y-4">
                  <div className="p-3.5 bg-white/60 rounded-2xl border border-family-accent/5 space-y-1">
                    <h6 className="font-bold text-family-text flex items-center gap-2">
                      <FlameKindling className="w-4 h-4 text-yellow-600" /> Nguyên tắc 1: Trách nhiệm 100%
                    </h6>
                    <p className="pl-6">Khi có vấn đề xảy ra, không đổ lỗi. Hãy quay về vòng tròn ảnh hưởng của chính mình: Tôi có thể thay đổi điều gì ở bản thân để chuyển hóa cục diện này?</p>
                  </div>
                  <div className="p-3.5 bg-white/60 rounded-2xl border border-family-accent/5 space-y-1">
                    <h6 className="font-bold text-family-text flex items-center gap-2">
                      <FlameKindling className="w-4 h-4 text-yellow-600" /> Nguyên tắc 2: Tôn trọng thế giới quan của nhau
                    </h6>
                    <p className="pl-6">Bạn đời có quyền có suy nghĩ, cảm xúc và góc nhìn khác bạn dựa trên nền tảng gia đình và trải nghiệm quá khứ của họ. Đừng ép họ phải giống mình.</p>
                  </div>
                  <div className="p-3.5 bg-white/60 rounded-2xl border border-family-accent/5 space-y-1">
                    <h6 className="font-bold text-family-text flex items-center gap-2">
                      <FlameKindling className="w-4 h-4 text-yellow-600" /> Nguyên tắc 3: Luật 3 Không khi tranh luận
                    </h6>
                    <p className="pl-6">Không xúc phạm nhân phẩm – Không lôi gia đình hai bên vào cuộc – Không xưng hô vô văn hóa.</p>
                  </div>
                  <div className="p-3.5 bg-white/60 rounded-2xl border border-family-accent/5 space-y-1">
                    <h6 className="font-bold text-family-text flex items-center gap-2">
                      <FlameKindling className="w-4 h-4 text-yellow-600" /> Nguyên tắc 4: Xin dừng (Time-out) khi cảm xúc quá tải
                    </h6>
                    <p className="pl-6">Khi cơn giận lên đỉnh điểm, một trong hai có quyền xin dừng cuộc nói chuyện từ 15–30 phút để hạ hỏa. Khi bình tĩnh lại, bắt buộc phải ngồi lại giải quyết dựa trên sự thật (Truth).</p>
                  </div>
                  <div className="p-3.5 bg-white/60 rounded-2xl border border-family-accent/5 space-y-1">
                    <h6 className="font-bold text-family-text flex items-center gap-2">
                      <FlameKindling className="w-4 h-4 text-yellow-600" /> Nguyên tắc 5: Đàn ông cần Tôn trọng - Phụ nữ cần Yêu thương
                    </h6>
                    <p className="pl-6">Bản chất cốt lõi của đàn ông là cần sự nể trọng, công nhận năng lực. Bản chất của phụ nữ là cần sự lắng nghe, thấu hiểu và cảm giác an toàn. Cho đi đúng thứ đối phương cần.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-3.5 bg-white/60 rounded-2xl border border-family-accent/5 space-y-1">
                    <h6 className="font-bold text-family-text flex items-center gap-2">
                      <FlameKindling className="w-4 h-4 text-yellow-600" /> Nguyên tắc 6: Hôn nhân là một dự án cần bảo trì
                    </h6>
                    <p className="pl-6">Tình yêu không tự nhiên vững bền theo thời gian. Nó giống như một cái cây, nếu không tưới nước (kiến thức, kỹ năng, sự lãng mạn) hàng ngày, cây sẽ héo úa.</p>
                  </div>
                  <div className="p-3.5 bg-white/60 rounded-2xl border border-family-accent/5 space-y-1">
                    <h6 className="font-bold text-family-text flex items-center gap-2">
                      <FlameKindling className="w-4 h-4 text-yellow-600" /> Nguyên tắc 7: Hạnh phúc tự thân làm nền tảng
                    </h6>
                    <p className="pl-6">Một ly nước trống rỗng không thể rót nước cho ly khác. Bạn phải tự làm đầy năng lượng sống, sự bình an của mình trước thì mới có thể bao dung và yêu thương bạn đời một cách lành mạnh.</p>
                  </div>
                  <div className="p-3.5 bg-white/60 rounded-2xl border border-family-accent/5 space-y-1">
                    <h6 className="font-bold text-family-text flex items-center gap-2">
                      <FlameKindling className="w-4 h-4 text-yellow-600" /> Nguyên tắc 8: Giải quyết mâu thuẫn trong ngày
                    </h6>
                    <p className="pl-6">Tránh việc mang cục tức giận đi ngủ. Nếu chưa thể giải quyết triệt để, ít nhất hãy đồng ý một thỏa thuận tạm thời để không khí phòng ngủ không bị đóng băng.</p>
                  </div>
                  <div className="p-3.5 bg-white/60 rounded-2xl border border-family-accent/5 space-y-1">
                    <h6 className="font-bold text-family-text flex items-center gap-2">
                      <FlameKindling className="w-4 h-4 text-yellow-600" /> Nguyên tắc 9: Ưu tiên số 1 là Bạn Đời
                    </h6>
                    <p className="pl-6">Sau khi kết hôn, mối quan hệ vợ chồng phải được đặt lên trên mối quan hệ với cha mẹ ruột, con cái hay bạn bè, sự nghiệp trong việc định đoạt hạnh phúc gia đình nhỏ.</p>
                  </div>
                  <div className="p-3.5 bg-white/60 rounded-2xl border border-family-accent/5 space-y-1">
                    <h6 className="font-bold text-family-text flex items-center gap-2">
                      <FlameKindling className="w-4 h-4 text-yellow-600" /> Nguyên tắc 10: Hành xử dựa trên Tình yêu (Love), không dựa trên Nỗi sợ (Fear)
                    </h6>
                    <p className="pl-6">Trước mỗi quyết định hay lời nói lúc căng thẳng, hãy tự hỏi: "Mình làm điều này vì thực sự yêu thương và muốn xây dựng, hay vì nỗi sợ bị bỏ rơi, sợ mất mặt, sợ thua kém".</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
