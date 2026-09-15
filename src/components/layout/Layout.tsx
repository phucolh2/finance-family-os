import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { AuthStatusBar } from '../auth/AuthStatusBar';
import { LoveCorner } from '../modules/LoveCorner';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen overflow-hidden bg-family-bg print:h-auto print:w-auto print:overflow-visible print:bg-white">
      {/* Mobile Header Bar */}
      <header className="flex md:hidden items-center justify-between px-6 py-4 bg-family-bgDark/80 border-b border-family-accent/10 select-none shrink-0 z-40 print:hidden">
        <h1 className="text-lg font-serif font-bold text-family-text flex items-center gap-2">
          <span>👨‍👩‍👧‍👦</span> Family OS
        </h1>
        <div className="flex items-center gap-2">
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
      <main className="flex-1 overflow-y-auto p-6 md:p-8 relative print:overflow-visible print:p-0 print:m-0">
        {/* Cloud Sync Status Bar */}
        <div className="hidden md:flex justify-end mb-4 max-w-6xl mx-auto print:hidden">
          <AuthStatusBar />
        </div>
        <div className="max-w-6xl mx-auto pb-12 print:pb-0 print:max-w-none">
          {children}
        </div>
      </main>
      <LoveCorner />
    </div>
  );
};
