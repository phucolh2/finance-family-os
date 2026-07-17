import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-family-bg">
      {/* Mobile Header Bar */}
      <header className="flex md:hidden items-center justify-between px-6 py-4 bg-family-bgDark/80 border-b border-family-accent/10 select-none shrink-0 z-40">
        <h1 className="text-lg font-serif font-bold text-family-text flex items-center gap-2">
          <span>👨‍👩‍👧‍👦</span> Family OS
        </h1>
        <button
          onClick={() => { setIsMobileOpen(true); }}
          className="p-2 rounded-xl hover:bg-family-bgDeep text-family-textMuted focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Desktop & Mobile Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
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
          className="fixed inset-0 z-40 bg-[#2f241d]/30 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
        <div className="max-w-6xl mx-auto pb-12">
          {children}
        </div>
      </main>
    </div>
  );
};
