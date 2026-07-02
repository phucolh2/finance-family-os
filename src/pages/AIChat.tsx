import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MessageSquare, Send, Sparkles, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_INSTRUCTION = `
Bạn là chuyên gia tư vấn tài chính và hôn nhân gia đình AI Twin Advisor (Tài Sản Song Sinh) tích hợp trong hệ thống quản lý gia đình Family OS. Nhiệm vụ của bạn là giải đáp tất cả thắc mắc của hai vợ chồng về các chỉ số tài chính, kịch bản, thuật ngữ và cẩm nang sống tỉnh thức trong hệ thống.

Dưới đây là cẩm nang kiến thức bạn có thể dùng để đối chiếu giải thích:
1. Thuyết Thu Nhập Thường Xuyên (Permanent Income Hypothesis - Milton Friedman): Chi tiêu dựa trên thu nhập trọn đời kỳ vọng chứ không phải thu nhập tạm thời.
2. Thuyết Vòng Đời (Life-Cycle Hypothesis - Franco Modigliani): Tích lũy tài sản khi trẻ, tiêu dùng tài sản khi về già để giữ tiêu chuẩn sống ổn định trọn đời.
3. Thuyết Danh Mục Hiện Đại (Modern Portfolio Theory - Harry Markowitz): Đa dạng hóa danh mục (USD, Vàng, BĐS, Chứng khoán, Crypto) để giảm thiểu rủi ro ứng với cùng một lợi suất kỳ vọng.
4. Trinity Study (FIRE, 4% Rule): Tự do tài chính khi tài sản tích lũy gấp 25 lần chi tiêu năm. Rút tối đa 4% năm để tài sản không bao giờ cạn kiệt.
5. Harvard Study (Nguyên tắc ngân sách 50/30/20): Chia thu nhập sau thuế thành 50% Thiết yếu (Need), 30% Linh hoạt (Want) và 20% Tích lũy (Savings/Investment).
6. Quy tắc thương vụ (Deals tracking): Vốn đầu tư thương vụ chưa tất toán sẽ khóa từ số dư Tiền chờ phân bổ. Khi tất toán chốt lời/lỗ, phần chênh lệch (profit) sẽ tái nhập lại vào số dư tài sản tương ứng của lớp tài sản đó ở tương lai.
7. Cẩm nang hạnh phúc vợ chồng:
   - 20 Điều Nên Làm (Lắng nghe thấu cảm, Khen ngợi năng lượng đặc trưng, Chấp nhận khác biệt, Tôn trọng khoảng riêng, Date Night, Bảo vệ bạn đời trước áp lực, Minh bạch tài chính, Thống nhất dạy con, Sửa mình trước...).
   - 10 Điều Cần Tránh (Cằn nhằn chỉ trích, Chiến tranh im lặng, Kiểm soát độc hại, So sánh bạn đời, Nhai lại chuyện cũ, Vô tâm lạnh nhạt...).
   - 10 Nguyên tắc cốt lõi (Trách nhiệm 100%, Tôn trọng thế giới quan, Luật 3 Không, Luật xin dừng Time-out, Đàn ông cần Tôn trọng - Phụ nữ cần Yêu thương...).

Hãy trả lời bằng tiếng Việt một cách kiên nhẫn, khoa học, thực tế và chân thành.
`;

const SUGGESTED_QUESTIONS = [
  'Trinity Study và quy tắc 4% hoạt động thế nào trong dự phóng FIRE?',
  'Cơ chế tất toán thương vụ ảnh hưởng tài sản ròng thế nào?',
  'Nguyên tắc ngân sách 50/30/20 của Harvard ứng dụng thế nào?',
  'Nguyên tắc "Time-out" và "Luật 3 Không" trong hôn nhân là gì?',
  'Permanent Income Hypothesis giải thích hành vi chi tiêu thế nào?'
];

export const AIChat: React.FC = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || 'AIzaSyAS1AcPoqzpqemcgo0IXZkAchMrwRyVHQU');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Xin chào hai vợ chồng! Tôi là Trợ lý tài chính và hôn nhân gia đình AI Twin. Tôi ở đây để giải đáp tất cả thắc mắc của bạn về các chỉ số dự phóng tài sản, thuật ngữ kinh tế học Nobel ứng dụng, cẩm nang xây dựng tổ ấm hay cơ chế tất toán thương vụ trong dự án này. Bạn muốn tìm hiểu gì hôm nay?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const userText = textToSend || input;
    if (!userText.trim()) return;

    if (!textToSend) setInput('');
    setError(null);

    // Add user message to state
    const updatedMessages = [...messages, { role: 'user' as const, text: userText }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Map message history to Gemini API format, skipping the initial greeting (index 0) if it is from the model
      const apiContents = updatedMessages
        .slice(1)
        .map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }));

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: apiContents,
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const detailedMsg = errorBody?.error?.message || 'Yêu cầu API thất bại.';
        throw new Error(`Gemini API Error: ${detailedMsg}`);
      }

      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tôi không thể giải quyết yêu cầu này lúc này.';

      setMessages([...updatedMessages, { role: 'model', text: answer }]);
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định khi kết nối với Gemini. Vui lòng kiểm tra lại API Key hoặc mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-auto lg:h-[calc(100vh-140px)] min-h-[calc(100vh-140px)]">
      {/* Page Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-family-accent" /> Hỏi đáp AI Twin
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Giải đáp thắc mắc về thuật ngữ tài chính, cách vận hành thương vụ và cẩm nang sống tỉnh thức cùng AI.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-[400px] lg:min-h-0 bg-white/70 backdrop-blur-md border-family-accent/15">
          {/* Scrollable messages container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
              const isAI = msg.role === 'model';
              return (
                <div key={index} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm transition-all ${
                      isAI
                        ? 'bg-family-bgDark/35 border border-family-accent/10 text-family-text'
                        : 'bg-family-accent text-white'
                    }`}
                  >
                    {isAI && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-family-accent">
                        <Sparkles className="w-3.5 h-3.5" /> AI Twin Advisor
                      </div>
                    )}
                    <div className="whitespace-pre-line font-medium">{msg.text}</div>
                  </div>
                </div>
              );
            })}
            
            {/* Loading placeholder */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl p-3.5 bg-family-bgDark/35 border border-family-accent/10 text-family-text shadow-sm flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-family-accent animate-spin" />
                  <span className="text-xs font-semibold text-family-textMuted">AI đang trả lời...</span>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Fixed Input Form */}
          <CardContent className="border-t border-family-accent/10 pt-3 pb-3 bg-family-bgDark/15">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn về thuật ngữ, chỉ số tài chính, kịch bản..."
                disabled={isLoading}
                className="flex-1 text-xs bg-white rounded-xl border border-family-accent/15 px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-family-accent shadow-inner disabled:bg-slate-50"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="sm" className="gap-1 px-4">
                <Send className="w-3.5 h-3.5" /> Gửi
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Suggested Questions Side panel */}
        <Card className="w-full lg:w-80 shrink-0 bg-family-bgDark/25 border-family-accent/15 flex flex-col p-4 space-y-4 lg:overflow-y-auto">
          <div className="space-y-4">
            {/* API Key configuration */}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2 text-[11px] leading-relaxed">
              <span className="font-bold text-amber-800 flex items-center gap-1">🔑 Cấu hình Gemini API Key</span>
              <p className="text-amber-700">
                API Key mặc định đã bị Google khóa bảo mật. Hãy dán API Key cá nhân của bạn vào đây để chạy chat:
              </p>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    setApiKey(val);
                    localStorage.setItem('gemini_api_key', val);
                  }}
                  placeholder="Dán API Key..."
                  className="flex-1 bg-white border border-amber-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-[10px]"
                />
                {apiKey !== 'AIzaSyAS1AcPoqzpqemcgo0IXZkAchMrwRyVHQU' && (
                  <button
                    onClick={() => {
                      setApiKey('AIzaSyAS1AcPoqzpqemcgo0IXZkAchMrwRyVHQU');
                      localStorage.removeItem('gemini_api_key');
                    }}
                    className="text-[9px] font-bold text-amber-800 hover:underline"
                  >
                    Xóa
                  </button>
                )}
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-amber-800 hover:underline font-bold block"
              >
                ➔ Lấy API Key miễn phí tại Google AI Studio
              </a>
            </div>

            <h4 className="text-xs font-bold text-family-text uppercase tracking-wider flex items-center gap-1.5 pt-2 border-t border-family-accent/5">
              <HelpCircle className="w-4 h-4 text-family-accent" /> Câu hỏi gợi ý nhanh
            </h4>
            <div className="space-y-2.5">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  disabled={isLoading}
                  className="w-full text-left text-xs font-semibold text-family-textMuted bg-white/70 hover:bg-white p-3 rounded-xl border border-family-accent/10 shadow-sm transition-all hover:border-family-accent/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-family-accent/5 rounded-2xl border border-family-accent/10 text-[10px] text-family-textMuted leading-relaxed">
            💡 <strong>Mẹo:</strong> Bạn có thể hỏi sâu về các chủ đề chi tiết như 20 điều nên làm, nguyên tắc tài chính của gia đình để nhận được lời khuyên thiết thực nhất!
          </div>
        </Card>
      </div>
    </div>
  );
};
