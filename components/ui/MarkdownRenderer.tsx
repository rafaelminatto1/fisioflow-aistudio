import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null;

  const parseLine = (line: string): React.ReactNode => {
    // Handle bold, italic, and bold-italic
    const parts = line
      .split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|`.*?`|✅|📉|💪|🏆|⚠️)/g)
      .filter(Boolean);
    return parts.map((part, index) => {
      if (
        part === '✅' ||
        part === '📉' ||
        part === '💪' ||
        part === '🏆' ||
        part === '⚠️'
      ) {
        return (
          <span key={index} className='mr-2'>
            {part}
          </span>
        );
      }
      if (part.startsWith('***') && part.endsWith('***')) {
        return (
          <strong key={index}>
            <em>{part.slice(3, -3)}</em>
          </strong>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className='bg-slate-200 text-slate-800 px-1 py-0.5 rounded-sm font-mono text-xs'
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(
        <ListTag
          key={elements.length}
          className={`pl-5 space-y-1 my-3 ${listType === 'ol' ? 'list-decimal' : 'list-disc'}`}
        >
          {listItems.map((item, i) => (
            <li key={i}>{parseLine(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('## ')) {
      flushList();
      elements.push(
        <h2
          key={index}
          className='text-xl font-bold text-slate-800 mt-4 mb-2 pb-2 border-b border-slate-200'
        >
          {parseLine(trimmedLine.substring(3))}
        </h2>
      );
    } else if (trimmedLine.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className='text-lg font-semibold text-teal-600 my-3'>
          {parseLine(trimmedLine.substring(4))}
        </h3>
      );
    } else if (trimmedLine.startsWith('>')) {
      flushList();
      elements.push(
        <blockquote
          key={index}
          className='pl-4 italic border-l-4 border-slate-300 text-slate-600 my-2'
        >
          {parseLine(trimmedLine.substring(1))}
        </blockquote>
      );
    } else if (trimmedLine.startsWith('---')) {
      flushList();
      elements.push(<hr key={index} className='my-6 border-slate-200' />);
    } else if (trimmedLine.startsWith('- ')) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(trimmedLine.substring(2).trim());
    } else if (trimmedLine.match(/^\d+\. /)) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(trimmedLine.replace(/^\d+\. /, '').trim());
    } else if (trimmedLine) {
      flushList();
      elements.push(
        <p key={index} className='my-1 leading-relaxed'>
          {parseLine(trimmedLine)}
        </p>
      );
    }
  });

  flushList();

  return (
    <div
      className={`text-sm text-slate-800 font-sans max-w-none prose prose-sm prose-slate ${className}`}
    >
      {elements}
    </div>
  );
};

export default MarkdownRenderer;
