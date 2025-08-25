// components/whatsapp/WhatsappChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, Bot } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as treatmentService from '../../services/treatmentService';
import * as whatsappService from '../../services/whatsappService';
import { Patient } from '../../types';

interface ChatMessage {
    id: number;
    text: string;
    sender: 'user' | 'bot';
}

const WhatsappChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [conversationState, setConversationState] = useState('initial');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { user } = useAuth(); // We'll use the logged-in user as the "patient"
    const mockPatient: Partial<Patient> = { id: user?.id, name: user?.name, whatsappConsent: 'opt-in' };

    useEffect(() => {
        const initialBotMessage = {
            id: Date.now(),
            text: `Olá, ${mockPatient.name}! 👋 Sou o assistente virtual da FisioFlow. Como posso ajudar?\n\n*1* - Ver meus exercícios de hoje\n*2* - Agendar uma nova consulta\n*3* - Falar com um atendente`,
            sender: 'bot' as const
        };
        setMessages([initialBotMessage]);
    }, [mockPatient.name]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isBotTyping]);

    const addBotResponse = (text: string) => {
        setIsBotTyping(true);
        setTimeout(() => {
            const botMessage: ChatMessage = { id: Date.now(), text, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);
            setIsBotTyping(false);
        }, 1000 + Math.random() * 500);
    };

    const handleUserInput = async (text: string) => {
        const userMessage: ChatMessage = { id: Date.now(), text, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Simulate sending message to the log
        if (mockPatient.id && mockPatient.name && mockPatient.phone) {
            whatsappService.sendMessage(mockPatient as Patient, text, 'chat');
        }

        // --- Simple Bot Logic ---
        if (conversationState === 'initial') {
            if (text.trim() === '1') {
                const plan = await treatmentService.getPlanByPatientId('1'); // Mock patient 1
                if (plan && plan.exercises) {
                    const exerciseList = plan.exercises.map(ex => ` - ${ex.exerciseName} (${ex.sets}x${ex.repetitions})`).join('\n');
                    addBotResponse(`Claro! Seus exercícios para hoje são:\n${exerciseList}\n\nLembre-se de marcar como feito no seu portal! 😉`);
                } else {
                    addBotResponse("Você não tem um plano de exercícios ativo no momento.");
                }
            } else if (text.trim() === '2') {
                addBotResponse("Para agendar, preciso saber o melhor dia e período para você. Por exemplo: 'terça de manhã' ou 'sexta à tarde'.");
                setConversationState('scheduling_day');
            } else if (text.trim() === '3') {
                addBotResponse("Ok! Um de nossos atendentes entrará em contato com você por aqui em breve. Por favor, aguarde.");
                setConversationState('waiting_human');
            } else {
                addBotResponse("Desculpe, não entendi. Por favor, escolha uma das opções (1, 2 ou 3).");
            }
        } else if (conversationState === 'scheduling_day') {
            addBotResponse(`Perfeito! Verificando horários para *${text}*... Encontrei uma vaga às 10:00. Deseja confirmar? (Sim/Não)`);
            setConversationState('scheduling_confirm');
        } else if (conversationState === 'scheduling_confirm') {
            if (text.toLowerCase().includes('sim')) {
                addBotResponse("Ótimo! Sua consulta foi agendada. Você receberá uma confirmação com todos os detalhes. Até breve!");
            } else {
                addBotResponse("Entendido. Se quiser tentar outra data, é só me dizer.");
            }
            setConversationState('initial');
        } else if (conversationState === 'waiting_human') {
            addBotResponse("Nossos atendentes ainda estão ocupados. Assim que um estiver disponível, ele responderá aqui. Obrigado pela paciência!");
        }
    };

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl shadow-lg flex flex-col">
                {/* Header */}
                <div className="p-3 bg-slate-100 rounded-t-2xl flex items-center border-b">
                    <div className="relative">
                        <Image src="https://i.pravatar.cc/150?u=clinic_logo" alt="FisioFlow" width={40} height={40} className="w-10 h-10 rounded-full" />
                         <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
                    </div>
                    <div className="ml-3">
                        <p className="font-semibold text-slate-800">FisioFlow</p>
                        <p className="text-xs text-slate-500">online</p>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-4 h-96 overflow-y-auto bg-slate-50">
                    <div className="space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'bot' && <Bot className="w-6 h-6 text-slate-400 self-start shrink-0" />}
                                <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-teal-500 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none shadow-sm'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isBotTyping && (
                             <div className="flex items-end gap-2 justify-start">
                                 <Bot className="w-6 h-6 text-slate-400 self-start shrink-0" />
                                 <div className="bg-white text-slate-800 rounded-2xl rounded-bl-none shadow-sm px-4 py-3 flex items-center">
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-3 bg-slate-100 rounded-b-2xl border-t">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && input.trim() && handleUserInput(input)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 w-full px-4 py-2 bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                            onClick={() => input.trim() && handleUserInput(input)}
                            disabled={!input.trim()}
                            className="p-3 bg-teal-500 text-white rounded-full hover:bg-teal-600 disabled:bg-teal-300 transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
             <style>{`
                .typing-dot {
                    width: 6px; height: 6px; background-color: #94a3b8; border-radius: 50%; display: inline-block; margin: 0 2px;
                    animation: typing-animation 1.4s infinite ease-in-out both;
                }
                .typing-dot:nth-child(2) { animation-delay: .2s; }
                .typing-dot:nth-child(3) { animation-delay: .4s; }
                @keyframes typing-animation {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1.0); }
                }
            `}</style>
        </div>
    );
};

export default WhatsappChatInterface;
