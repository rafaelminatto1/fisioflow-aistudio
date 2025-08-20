import React, { useRef } from 'react';
import { Bold, Italic, List } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, rows = 3, placeholder, disabled = false }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (format: 'bold' | 'italic' | 'list') => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    let markdown = '';
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    let newValue = '';
    
    // For list, we need to handle multi-line selection
    if (format === 'list') {
        // Find the start of the line(s) containing the selection
        let lineStart = value.lastIndexOf('\n', start - 1) + 1;
        
        const textBefore = value.substring(0, lineStart);
        const selectedLines = value.substring(lineStart, end);
        const textAfter = value.substring(end);
        
        const lines = selectedLines.split('\n');
        const areAllLinesBulleted = lines.every(line => line.trim().startsWith('* '));

        const newSelectedLines = lines.map(line => {
            if (areAllLinesBulleted) {
                // If all are bulleted, remove the bullets
                return line.replace(/^\s*\*\s?/, '');
            } else {
                 // If any are not bulleted, add bullets to all non-empty lines
                return line.trim() ? `* ${line}` : line;
            }
        }).join('\n');
        
        newValue = `${textBefore}${newSelectedLines}${textAfter}`;

    } else {
        markdown = format === 'bold' ? '**' : '*';
        const formattedText = `${markdown}${selectedText}${markdown}`;
        newValue = `${value.substring(0, start)}${formattedText}${value.substring(end)}`;
    }
    
    onChange(newValue);

     // Refocus and select the modified text for better UX
    setTimeout(() => {
        textarea.focus();
        if (format !== 'list') {
            textarea.selectionStart = start + markdown.length;
            textarea.selectionEnd = end + markdown.length;
        }
    }, 0);
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center gap-2 border border-b-0 border-slate-300 p-2 rounded-t-lg ${disabled ? 'bg-slate-200' : 'bg-slate-50'}`}>
        <button type="button" onClick={() => applyFormatting('bold')} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50" title="Negrito (Ctrl+B)" disabled={disabled}><Bold className="w-4 h-4" /></button>
        <button type="button" onClick={() => applyFormatting('italic')} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50" title="Itálico (Ctrl+I)" disabled={disabled}><Italic className="w-4 h-4" /></button>
        <button type="button" onClick={() => applyFormatting('list')} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50" title="Lista" disabled={disabled}><List className="w-4 h-4" /></button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`w-full p-2 border border-slate-300 rounded-b-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm flex-1 ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
        aria-label="Editor de Texto do Relatório"
        disabled={disabled}
      />
    </div>
  );
};

export default RichTextEditor;