import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, Bot } from 'lucide-react';
import { AuthStatusBar } from '../auth/AuthStatusBar';
import { LoveCorner } from '../modules/LoveCorner';
import { CopilotChat } from '../copilot/CopilotChat';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full max-w-full overflow-hidden bg-family-bg print:h-auto print:w-auto print:overflow-visible print:bg-white">
      {/* Mobile Header Bar */}
      <header className="flex md:hidden items-center justify-between px-4 sm:px-6 py-3.5 bg-family-bgDark/80 border-b border-family-accent/10 select-none shrink-0 z-40 print:hidden">
        <h1 className="text-lg font-serif font-bold text-family-text flex items-center gap-2">
          <span>👨‍👩‍👧‍👦</span> Family OS
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/80 border border-indigo-200/60 text-indigo-900 hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
            title="Mở Trợ lý Gia đình"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-bold">Trợ lý</span>
          </button>
          <AuthStatusBar />
          <button
            onClick={() => { setIsMobileOpen(true); }}
            className="p-2 rounded-xl hover:bg-family-bgDeep text-family-textMuted focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Desktop & Mobile Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } print:hidden`}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onCloseMobile={() => { setIsMobileOpen(false); }}
        />
      </div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => { setIsMobileOpen(false); }}
          className="fixed inset-0 z-40 bg-[#2f241d]/30 backdrop-blur-sm md:hidden transition-opacity print:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative print:overflow-visible print:p-0 print:m-0">
        {/* Cloud Sync Status Bar & Desktop Copilot Access */}
        <div className="hidden md:flex items-center justify-end gap-3 mb-4 max-w-6xl mx-auto print:hidden">
          <button
            onClick={() => setIsCopilotOpen(prev => !prev)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-indigo-50/70 border border-indigo-100 shadow-2xs hover:shadow-xs transition-all duration-200 group cursor-pointer text-indigo-950"
            title="Hỏi Trợ lý Gia đình về tài chính và cuộc sống"
          >
            <div className="relative">
              <Bot className="w-4 h-4 text-indigo-600 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <span className="font-bold text-xs bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
              Trợ lý Gia đình
            </span>
          </button>
          <AuthStatusBar />
        </div>
        <div className="max-w-6xl mx-auto pb-20 md:pb-12 print:pb-0 print:max-w-none">
          {children}
        </div>
      </main>
      <LoveCorner isHidden={isCopilotOpen} />
      <CopilotChat 
        activeTab={activeTab} 
        isOpen={isCopilotOpen} 
        onToggleOpen={setIsCopilotOpen} 
      />
    </div>
  );
};
