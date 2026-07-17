import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Key, Settings, Loader2, Bot } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { sendChatMessage } from '../../services/aiService';

export const CopilotChat: React.FC = () => {
  const { state } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: 'Chào bạn! Tôi là trợ lý tài chính AI. Tôi đã nắm rõ tình hình ngân sách và các cột mốc tài chính của gia đình bạn. Bạn muốn tôi tư vấn điều gì hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load API key from local storage or environment variables on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (savedKey) {
      setApiKey(savedKey);
    } else if (envKey) {
      setApiKey(envKey);
    } else {
      setIsConfiguring(true);
    }
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setIsConfiguring(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Convert messages to Gemini format
      const chatHistory = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const responseText = await sendChatMessage(apiKey, userMessage, chatHistory, state);
      
      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: `❌ Lỗi: ${error.message || 'Không thể kết nối tới AI. Hãy kiểm tra lại API Key.'}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-family-accent to-blue-500 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform z-50 animate-bounce"
        title="Trợ lý AI Tài chính"
      >
        <Bot className="w-7 h-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-family-accent to-blue-500 p-4 text-white flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          <h3 className="font-bold">Finance Copilot</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setIsConfiguring(!isConfiguring); }} 
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Cài đặt API Key"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => { setIsOpen(false); }} 
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Configuration View */}
      {isConfiguring ? (
        <div className="flex-1 p-6 bg-gray-50 flex flex-col">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-6 border border-blue-100">
            <p className="font-bold mb-1 flex items-center gap-1"><Key className="w-4 h-4" /> Yêu cầu API Key</p>
            <p>Trợ lý AI cần một khóa Google Gemini API để hoạt động. Khóa này hoàn toàn miễn phí tại Google AI Studio.</p>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline mt-2 inline-block">
              Lấy API Key tại đây
            </a>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">Gemini API Key của bạn:</label>
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); }}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-family-accent focus:outline-none font-mono text-sm"
            />
            <button 
              onClick={handleSaveApiKey}
              className="w-full bg-family-accent text-white font-bold py-2.5 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Lưu cấu hình
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-auto text-center">
            Key của bạn được lưu an toàn tại LocalStorage trình duyệt.
          </p>
        </div>
      ) : (
        /* Chat View */
        <>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-family-accent text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl rounded-tl-sm">
                  <Loader2 className="w-5 h-5 text-family-accent animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => { setInput(e.target.value); }}
                placeholder="Hỏi về kế hoạch tài chính của bạn..."
                className="w-full pl-4 pr-12 py-3 bg-gray-100 border-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-family-accent focus:outline-none text-sm"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1 top-1 bottom-1 p-2 bg-family-accent text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4 -ml-0.5" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};
