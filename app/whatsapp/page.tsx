'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare,
  Send,
  Phone,
  Video,
  MoreHorizontal,
  Search,
  Settings,
  Users,
  Clock,
  CheckCheck,
  Plus,
  Archive,
  Star,
  Paperclip
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'online' | 'offline' | 'typing';
  avatar: string;
  isPinned?: boolean;
}

interface WhatsAppMessage {
  id: string;
  senderId: string;
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio';
  status: 'sent' | 'delivered' | 'read';
  isFromMe: boolean;
}

const WhatsAppCommunicationPage: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<string>('1');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const contacts: WhatsAppContact[] = [
    {
      id: '1',
      name: 'Maria Silva',
      phone: '+55 11 99999-1234',
      lastMessage: 'Obrigada pelo atendimento! Quando é minha próxima consulta?',
      lastMessageTime: '14:30',
      unreadCount: 2,
      status: 'online',
      avatar: '/api/placeholder/40/40',
      isPinned: true
    },
    {
      id: '2',
      name: 'João Santos',
      phone: '+55 11 98888-5678',
      lastMessage: 'Posso remarcar minha sessão de quinta?',
      lastMessageTime: '13:45',
      unreadCount: 0,
      status: 'offline',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: '3',
      name: 'Ana Costa',
      phone: '+55 11 97777-9012',
      lastMessage: 'Os exercícios estão ajudando muito!',
      lastMessageTime: '12:20',
      unreadCount: 1,
      status: 'typing',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: '4',
      name: 'Carlos Oliveira',
      phone: '+55 11 96666-3456',
      lastMessage: 'Boa tarde! Posso confirmar minha consulta?',
      lastMessageTime: '11:15',
      unreadCount: 0,
      status: 'online',
      avatar: '/api/placeholder/40/40'
    }
  ];

  const messages: WhatsAppMessage[] = [
    {
      id: '1',
      senderId: '1',
      message: 'Boa tarde! Como posso ajudá-la hoje?',
      timestamp: '14:28',
      type: 'text',
      status: 'read',
      isFromMe: true
    },
    {
      id: '2',
      senderId: '1',
      message: 'Oi! Gostaria de saber sobre minha próxima consulta',
      timestamp: '14:29',
      type: 'text',
      status: 'delivered',
      isFromMe: false
    },
    {
      id: '3',
      senderId: '1',
      message: 'Sua próxima consulta está marcada para quinta-feira às 15:00. Precisa de mais alguma informação?',
      timestamp: '14:29',
      type: 'text',
      status: 'read',
      isFromMe: true
    },
    {
      id: '4',
      senderId: '1',
      message: 'Obrigada pelo atendimento! Quando é minha próxima consulta?',
      timestamp: '14:30',
      type: 'text',
      status: 'delivered',
      isFromMe: false
    }
  ];

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const selectedContactData = contacts.find(c => c.id === selectedContact);
  const contactMessages = messages.filter(m => m.senderId === selectedContact);

  const sendMessage = () => {
    if (messageInput.trim()) {
      // Aqui implementaríamos o envio via WhatsApp Business API
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const getStatusIcon = (status: WhatsAppMessage['status']) => {
    switch (status) {
      case 'sent': return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'delivered': return <CheckCheck className="w-4 h-4 text-gray-500" />;
      case 'read': return <CheckCheck className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <div className="h-screen flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-b border-gray-200 px-6 py-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WhatsApp Business</h1>
                <p className="text-gray-600">Central de comunicação com pacientes</p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Nova Conversa</span>
                </button>
              </div>
            </div>
          </motion.div>

          <div className="flex-1 flex overflow-hidden">
            {/* Contacts Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar contatos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Contact List */}
              <div className="flex-1 overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedContact(contact.id)}
                    className={`flex items-center p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedContact === contact.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-600">
                          {contact.name.charAt(0)}
                        </span>
                      </div>
                      {contact.status === 'online' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {contact.name}
                        </h3>
                        <div className="flex items-center space-x-1">
                          {contact.isPinned && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                          <span className="text-xs text-gray-500">{contact.lastMessageTime}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
                        {contact.unreadCount > 0 && (
                          <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-5 text-center">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                      
                      {contact.status === 'typing' && (
                        <p className="text-xs text-green-600 italic">digitando...</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedContactData ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-gray-600">
                            {selectedContactData.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {selectedContactData.name}
                          </h2>
                          <p className="text-sm text-gray-600">
                            {selectedContactData.status === 'online' ? 'Online' : 
                             selectedContactData.status === 'typing' ? 'Digitando...' : 
                             `Visto por último ${selectedContactData.lastMessageTime}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Phone className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Video className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div className="space-y-4">
                      {contactMessages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.isFromMe 
                              ? 'bg-green-500 text-white' 
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}>
                            <p className="text-sm">{message.message}</p>
                            <div className={`flex items-center justify-end space-x-1 mt-1 ${
                              message.isFromMe ? 'text-green-100' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">{message.timestamp}</span>
                              {message.isFromMe && getStatusIcon(message.status)}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="bg-white border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Digite uma mensagem..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <button
                        onClick={sendMessage}
                        disabled={!messageInput.trim()}
                        className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Selecione uma conversa
                    </h3>
                    <p className="text-gray-600">
                      Escolha um contato para iniciar uma conversa
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WhatsAppCommunicationPage;