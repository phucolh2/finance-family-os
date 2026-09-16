import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ffos_frequent_tabs';

// We ignore dashboard because it's the home screen anyway
// We ignore settings because it's usually at the bottom and rarely a primary workspace
const IGNORED_TABS = ['dashboard', 'settings'];

export function useFrequentTabs(activeTab: string) {
  const [frequencies, setFrequencies] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!activeTab || IGNORED_TABS.includes(activeTab)) return;
    
    setFrequencies(prev => {
      const next = { ...prev };
      next[activeTab] = (next[activeTab] || 0) + 1;
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, [activeTab]);

  return frequencies;
}
