import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Bot, Sparkles, Globe, RefreshCw } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { sendChatMessage } from '../../services/aiService';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  isWebSearch?: boolean;
}

const QUICK_PROMPTS = [
  { label: '📊 Tháng qua sài nhiêu tiền?', prompt: 'Tháng qua vợ chồng tôi đã chi tiêu hết bao nhiêu tiền? Khoản nào chiếm nhiều nhất và có vượt ngân sách không?' },
  { label: '👶 Bao lâu gom đủ quỹ sinh con?', prompt: 'Với tốc độ tích lũy hiện tại, dự kiến bao lâu nữa gia đình tôi gom đủ quỹ đón thiên thần nhỏ (mục tiêu ~80 - 100 triệu)?' },
  { label: '🏖️ Bao lâu tự do tài chính (FIRE)?', prompt: 'Dựa trên tài sản ròng và thặng dư tiết kiệm hiện tại, dự kiến bao lâu nữa vợ chồng tôi đạt Tự Do Tài Chính (FIRE)?' },
  { label: '🌐 Chi phí sinh con Vinmec / Từ Dũ?', prompt: 'Tra cứu giúp tôi: Chi phí gói sinh nở trọn gói tại bệnh viện Vinmec hoặc Từ Dũ hiện nay khoảng bao nhiêu và gồm những gì?', forceSearch: true },
  { label: '💡 Tối ưu tiết kiệm ở đâu?', prompt: 'Dựa vào cơ cấu chi tiêu hiện tại của gia đình, tôi có thể cắt giảm hoặc tối ưu khoản nào để tăng tích lũy mà không làm giảm chất lượng cuộc sống?' },
];

export const CopilotChat: React.FC = () => {
  const { state } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem('finance_copilot_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      { 
        role: 'model', 
        content: '👋 Xin chào hai vợ chồng! Tôi là **Finance Copilot** — Cố vấn tài chính gia đình riêng của anh chị.\n\nTôi đã kết nối trực tiếp với toàn bộ dữ liệu thu nhập, chi tiêu thực tế, các quỹ mục tiêu và tài sản ròng của gia đình. Anh chị có thể hỏi tôi bất kỳ điều gì về chi tiêu, dự đoán thời gian đạt mục tiêu tài chính hoặc tra cứu thông tin ngoài Internet!' 
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lưu lịch sử chat vào sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('finance_copilot_history', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Nạp API key tự động với fallback bí mật
  useEffect(() => {
    const fallbackKey = atob('QVEuQWI4Uk42SjRic0hSUDI3ZDg5bHFmMi1sMG9OTEhYTGJtNDA0UnAzNlpuOGhXeXpLd2c=');
    const savedKey = localStorage.getItem('gemini_api_key');
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    const key = savedKey || envKey || fallbackKey;
    
    if (key) {
      setApiKey(key);
      if (!savedKey) {
        localStorage.setItem('gemini_api_key', key);
      }
    }
  }, []);

  // Tự động cuộn xuống cuối tin nhắn
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const executeSendMessage = async (textToSend: string, searchOverride?: boolean) => {
    const promptText = textToSend.trim();
    if (!promptText || !apiKey || isLoading) return;

    const shouldSearch = searchOverride !== undefined ? searchOverride : useWebSearch;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: promptText, isWebSearch: shouldSearch }]);
    setIsLoading(true);

    try {
      // Chuyển đổi lịch sử chat sang định dạng Gemini
      const chatHistory = messages
        .filter(m => m.content)
        .slice(-10) // Lấy tối đa 10 tin gần nhất để giữ context gọn gàng
        .map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

      const responseText = await sendChatMessage(apiKey, promptText, chatHistory, state, shouldSearch);
      
      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (error: any) {
      console.error('Copilot Error:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: `❌ **Không thể kết nối AI**: ${error.message || 'Vui lòng kiểm tra lại kết nối mạng.'}\n\n*Gợi ý:* Hãy thử lại sau giây lát.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSendMessage(input);
  };

  const handleClearChat = () => {
    if (window.confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện này không?')) {
      const initial: ChatMessage[] = [
        { 
          role: 'model', 
          content: 'Đã làm mới cuộc trò chuyện! Tôi sẵn sàng hỗ trợ vợ chồng bạn với dữ liệu tài chính mới nhất.' 
        }
      ];
      setMessages(initial);
      sessionStorage.removeItem('finance_copilot_history');
    }
  };

  // Helper render văn bản markdown cơ bản (in đậm, danh sách, ngắt dòng)
  const renderFormattedMessage = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-[13px] sm:text-sm">
        {lines.map((line, lineIdx) => {
          if (!line.trim()) {
            return <div key={lineIdx} className="h-2" />;
          }

          // Tiêu đề nhỏ (### )
          if (line.startsWith('### ')) {
            return (
              <h4 key={lineIdx} className="font-bold text-slate-900 text-sm mt-2 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }

          // Dòng gạch đầu dòng (- hoặc *)
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const cleanLine = line.trim().replace(/^[-*]\s+/, '');
            return (
              <div key={lineIdx} className="flex items-start gap-1.5 ml-1">
                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleanLine) }} />
              </div>
            );
          }

          // Dòng đánh số (1. 2. 3.)
          const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={lineIdx} className="flex items-start gap-1.5 ml-1">
                <span className="text-indigo-600 font-semibold min-w-4 text-xs mt-0.5">{numMatch[1]}.</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(numMatch[2]) }} />
              </div>
            );
          }

          return (
            <p key={lineIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  // Helper in đậm **text**
  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  };

  // NÚT BẤM NỔI (KHI ĐANG ĐÓNG)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-20 sm:right-24 md:right-28 z-50 print:hidden flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center gap-2 px-3.5 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white shadow-[0_8px_25px_rgba(79,70,229,0.35)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.5)] transition-all duration-300 transform hover:scale-105 active:scale-95"
          title="Trợ lý AI Tài chính Gia đình (Finance Copilot)"
        >
          <div className="relative">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="hidden md:inline font-bold text-xs tracking-wide">AI Copilot</span>
        </button>
      </div>
    );
  }

  // CỬA SỔ CHAT (KHI ĐANG MỞ)
  return (
    <div className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 w-[94vw] sm:w-[440px] md:w-[480px] h-[640px] max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col z-50 border border-slate-200 overflow-hidden print:hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-4 text-white flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner">
            <Bot className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm leading-none">Finance Copilot</h3>
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white rounded-md">
                Live AI
              </span>
            </div>
            <p className="text-[11px] text-indigo-100 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Đã nạp toàn bộ dữ liệu tài chính gia đình
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Nút xóa lịch sử chat */}
          <button 
            onClick={handleClearChat}
            className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-white/80 hover:text-white"
            title="Làm mới cuộc trò chuyện"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {/* Nút đóng */}
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-white/80 hover:text-white ml-1"
            title="Thu nhỏ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3.5">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
          >
            {msg.role === 'model' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mr-2 mt-1">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
            )}
            
            <div 
              className={`max-w-[85%] p-3.5 rounded-2xl shadow-xs ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs' 
                  : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs'
              }`}
            >
              {msg.isWebSearch && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-200 mb-1">
                  <Globe className="w-3 h-3" /> Đã kết hợp tra cứu Internet
                </div>
              )}
              {msg.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              ) : (
                renderFormattedMessage(msg.content)
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-center gap-2 animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-xs shadow-xs text-xs text-slate-500 flex items-center gap-2">
              <span>Finance Copilot đang suy nghĩ và tính toán...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* QUICK PROMPTS CHIPS BAR */}
      <div className="px-3 pt-2.5 pb-1 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {QUICK_PROMPTS.map((qp, qpIdx) => (
          <button
            key={qpIdx}
            type="button"
            onClick={() => executeSendMessage(qp.prompt, qp.forceSearch)}
            disabled={isLoading}
            className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-full text-[11px] font-medium text-slate-600 transition-all shrink-0"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* INPUT CONTROLS & FORM */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2">
        {/* Toggle Tra cứu Internet */}
        <div className="flex items-center justify-between text-xs px-1">
          <button
            type="button"
            onClick={() => setUseWebSearch(!useWebSearch)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium transition-colors ${
              useWebSearch 
                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Bật/Tắt tra cứu kiến thức đời sống & thông tin ngoài internet"
          >
            <Globe className={`w-3.5 h-3.5 ${useWebSearch ? 'text-emerald-600 animate-spin-slow' : 'text-slate-400'}`} />
            <span>{useWebSearch ? '🌐 Tra cứu Internet: ĐANG BẬT' : '🌐 Tra cứu Internet: Tắt'}</span>
          </button>

          <span className="text-[10px] text-slate-400">
            Model: Gemini 3 Flash
          </span>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleFormSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={useWebSearch ? "Hỏi tra cứu chi phí, thị trường trên Internet..." : "Hỏi về chi tiêu, dự đoán mục tiêu tài chính..."}
            className="w-full pl-4 pr-12 py-2.5 bg-slate-100 border border-transparent rounded-full focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-xs sm:text-sm text-slate-800 transition-all"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors flex items-center justify-center shadow-xs"
            title="Gửi câu hỏi"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};
