import React, { useState, useEffect } from 'react';
import { Quote, Sparkles } from 'lucide-react';
import { RELATIONSHIP_QUOTES } from '../../data/relationshipQuotes';
import { KNOWLEDGE_ITEMS } from '../../data/knowledgeItems';

export const DailyQuote: React.FC = () => {
  const [quote, setQuote] = useState<{text: string, source: string, type: 'relationship' | 'economics'}>({
    text: '',
    source: '',
    type: 'relationship'
  });

  useEffect(() => {
    // Combine relationship quotes and some economics knowledge
    const allQuotes = [
      ...RELATIONSHIP_QUOTES.map(q => ({ ...q, type: q.type as 'relationship' | 'economics' })),
      ...KNOWLEDGE_ITEMS.map(item => ({
        text: item.familyApplication,
        source: item.name,
        type: 'economics' as const
      }))
    ];

    // Pick a random quote deterministically based on today's date (so it doesn't flicker on re-renders, but changes daily)
    // Or just pick a random one if the user wants it every time they open the app
    // Let's just use random for now, but save to session storage to keep it stable during a session
    const storedQuoteIndex = sessionStorage.getItem('dailyQuoteIndex');
    let index = 0;
    
    if (storedQuoteIndex !== null && parseInt(storedQuoteIndex) < allQuotes.length) {
      index = parseInt(storedQuoteIndex);
    } else {
      index = Math.floor(Math.random() * allQuotes.length);
      sessionStorage.setItem('dailyQuoteIndex', index.toString());
    }

    setQuote(allQuotes[index]);
  }, []);

  if (!quote.text) return null;

  return (
    <div className="bg-gradient-to-r from-pink-50/50 to-indigo-50/50 border border-pink-100/50 rounded-2xl p-4 flex items-start gap-4 mb-6 shadow-sm">
      <div className="bg-white p-2 rounded-full shadow-sm text-pink-500 shrink-0">
        {quote.type === 'relationship' ? (
          <Quote className="w-5 h-5" />
        ) : (
          <Sparkles className="w-5 h-5 text-indigo-500" />
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-family-text italic">
          "{quote.text}"
        </p>
        <p className="text-xs text-family-textMuted font-medium">
          — {quote.source}
        </p>
      </div>
    </div>
  );
};
