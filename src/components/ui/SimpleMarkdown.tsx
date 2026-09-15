import React from 'react';

interface SimpleMarkdownProps {
  content: string;
}

export const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' = 'ul';
  
  let inTable = false;
  let tableRows: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        listType === 'ul' ? (
          <ul key={`ul-${elements.length}`} className="list-disc pl-6 my-3 space-y-1 text-family-textMuted text-sm leading-relaxed">
            {listItems}
          </ul>
        ) : (
          <ol key={`ol-${elements.length}`} className="list-decimal pl-6 my-3 space-y-1 text-family-textMuted text-sm leading-relaxed">
            {listItems}
          </ol>
        )
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      elements.push(
        <div key={`table-wrapper-${elements.length}`} className="overflow-x-auto my-4">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            <tbody className="divide-y divide-gray-200 bg-white">
              {tableRows}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  const processInline = (text: string) => {
    // Bold: **text**
    let processed = text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-family-text">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return processed;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Table handling
    if (trimmedLine.startsWith('|')) {
      flushList();
      inTable = true;
      if (trimmedLine.includes('---')) continue; // Skip separator
      
      const cells = trimmedLine.split('|').filter(c => c.trim() !== '');
      const isHeader = tableRows.length === 0;
      
      tableRows.push(
        <tr key={`tr-${i}`} className={isHeader ? 'bg-gray-50' : 'bg-white'}>
          {cells.map((cell, idx) => (
            <td key={idx} className={`px-4 py-2 text-sm ${isHeader ? 'font-bold text-family-text border-b border-gray-200' : 'text-family-textMuted'}`}>
              {processInline(cell.trim())}
            </td>
          ))}
        </tr>
      );
      continue;
    } else {
      flushTable();
    }

    if (trimmedLine.startsWith('* ')) {
      if (!inList || listType === 'ol') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listItems.push(<li key={`li-${i}`}>{processInline(trimmedLine.slice(2))}</li>);
      continue;
    } else if (/^\d+\.\s/.test(trimmedLine)) {
      if (!inList || listType === 'ul') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      const text = trimmedLine.replace(/^\d+\.\s/, '');
      listItems.push(<li key={`li-${i}`}>{processInline(text)}</li>);
      continue;
    } else {
      flushList();
    }

    if (trimmedLine === '') {
      continue; // Skip empty lines after flushing
    }

    if (trimmedLine.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`} className="text-2xl font-serif font-bold text-family-text mt-8 mb-4 pb-2 border-b border-family-accent/20">{processInline(trimmedLine.slice(2))}</h1>);
    } else if (trimmedLine.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`} className="text-xl font-bold text-family-text mt-6 mb-3">{processInline(trimmedLine.slice(3))}</h2>);
    } else if (trimmedLine.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`} className="text-lg font-semibold text-family-text mt-4 mb-2">{processInline(trimmedLine.slice(4))}</h3>);
    } else if (trimmedLine.startsWith('> ')) {
      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-4 border-pink-500 bg-pink-50/50 p-4 my-4 italic text-family-textMuted rounded-r-lg">
          {processInline(trimmedLine.slice(2))}
        </blockquote>
      );
    } else if (trimmedLine === '---') {
      elements.push(<hr key={`hr-${i}`} className="my-8 border-t border-gray-200" />);
    } else {
      elements.push(<p key={`p-${i}`} className="text-sm text-family-textMuted my-3 leading-relaxed">{processInline(trimmedLine)}</p>);
    }
  }

  flushList();
  flushTable();

  return <div className="markdown-content">{elements}</div>;
};
