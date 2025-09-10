import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Loader,
  HardDrive,
  Library,
} from 'lucide-react';
import { aiService } from '../services/ai-economica/aiService';
import {
  AIResponse,
  PremiumProvider,
  QueryType,
  ResponseSource,
} from '../services/ai-economica/types/ai-economica.types';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  source?: ResponseSource | PremiumProvider;
}

const SourceIcon: React.FC<{ source: Message['source'] }> = ({ source }) => {
  const iconConfig: Record<
    string,
    { icon: React.ElementType; title: string; color: string }
  > = {
    [ResponseSource.CACHE]: {
      icon: HardDrive,
      title: 'Fonte: Cache (Resposta Rápida)',
      color: 'text-sky-600',
    },
    [ResponseSource.INTERNAL]: {
      icon: Library,
      title: 'Fonte: Base de Conhecimento Interna',
      color: 'text-purple-600',
    },
    [PremiumProvider.GEMINI_PRO]: {
      icon: Sparkles,
      title: 'Fonte: Google Gemini Pro',
      color: 'text-green-600',
    },
    [PremiumProvider.CHATGPT_PLUS]: {
      icon: Sparkles,
      title: 'Fonte: ChatGPT Plus',
      color: 'text-blue-600',
    },
    [PremiumProvider.CLAUDE_PRO]: {
      icon: Sparkles,
      title: 'Fonte: Claude Pro',
      color: 'text-orange-600',
    },
    [PremiumProvider.PERPLEXITY_PRO]: {
      icon: Sparkles,
      title: 'Fonte: Perplexity Pro',
      color: 'text-indigo-600',
    },
    [PremiumProvider.MARS_AI_PRO]: {
      icon: Sparkles,
      title: 'Fonte: Mars AI Pro',
      color: 'text-pink-600',
    },
    default: {
      icon: Bot,
      title: 'Assistente Virtual',
      color: 'text-slate-600',
    },
  };

  const config = iconConfig[source as string] || iconConfig['default'];
  if (!config) return null;
  const IconComponent = config.icon;

  return (
    <span title={config.title} className={config.color}>
      <IconComponent className='w-4 h-4' />
    </span>
  );
};

const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Olá! Sou o Rafa, seu assistente virtual. Posso ajudar com dúvidas clínicas ou agendar sua próxima consulta. O que você gostaria de fazer hoje?',
      sender: 'bot',
      source: PremiumProvider.GEMINI_PRO,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const query = {
        id: `query_${Date.now()}`,
        text: input,
        type: QueryType.GENERAL_QUESTION, // Default type
        context: { userRole: 'Fisioterapeuta' },
        priority: 'normal' as const,
        maxResponseTime: 5000,
        createdAt: new Date().toISOString(),
      };

      const response: AIResponse = await aiService.processQuery(query);

      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.content,
        sender: 'bot',
        source: response.provider || response.source,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting response from AIService:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'Desculpe, ocorreu um erro ao processar sua solicitação.',
        sender: 'bot',
        source: 'Erro' as any,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='fixed bottom-6 right-6 bg-teal-500 text-white p-4 rounded-full shadow-lg hover:bg-teal-600 transition-transform transform hover:scale-110 focus:outline-none z-50'
        aria-label='Open AI Assistant'
      >
        <Sparkles className='w-6 h-6' />
      </button>

      {isOpen && (
        <div className='fixed bottom-24 right-6 w-full max-w-md h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col z-40 animate-fade-in-up'>
          <header className='flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-teal-100 rounded-full'>
                <Bot className='w-6 h-6 text-teal-600' />
              </div>
              <h3 className='font-bold text-lg text-slate-800'>
                Assistente Clínico
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className='p-2 rounded-full hover:bg-slate-200'
            >
              <X className='w-5 h-5 text-slate-600' />
            </button>
          </header>

          <div className='flex-1 p-4 overflow-y-auto bg-slate-100/50'>
            <div className='space-y-4'>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-teal-500 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}
                  >
                    <p className='text-sm whitespace-pre-wrap'>{msg.text}</p>
                  </div>
                  {msg.sender === 'bot' && msg.source && (
                    <div className='flex items-center space-x-1.5 mt-1.5 px-2 py-1 bg-white/60 rounded-full text-xs text-slate-600 border border-slate-200'>
                      <SourceIcon source={msg.source} />
                      <span className='font-medium'>{msg.source}</span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className='flex justify-start'>
                  <div className='bg-slate-200 text-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center'>
                    <Loader className='w-4 h-4 animate-spin mr-2' />
                    <span className='text-sm'>Pensando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <footer className='p-4 border-t border-slate-200'>
            <div className='flex items-center space-x-2'>
              <input
                type='text'
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                placeholder='Pergunte algo ou agende uma consulta...'
                className='flex-1 w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500'
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || input.trim() === ''}
                className='p-3 bg-teal-500 text-white rounded-full hover:bg-teal-600 disabled:bg-teal-300 disabled:cursor-not-allowed transition-colors'
              >
                <Send className='w-5 h-5' />
              </button>
            </div>
          </footer>
        </div>
      )}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default AiAssistant;
