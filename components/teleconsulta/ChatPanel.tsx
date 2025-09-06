'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Download,
  Copy,
  Trash2,
  X,
  FileText,
  Image as ImageIcon,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'doctor' | 'patient';
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  timestamp: Date;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead?: boolean;
  isDelivered?: boolean;
}

interface ChatPanelProps {
  consultationId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'doctor' | 'patient';
  onSendMessage?: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead' | 'isDelivered'>) => void;
  onFileUpload?: (file: File) => Promise<string>;
  isVisible: boolean;
  onClose?: () => void;
  className?: string;
}

interface TypingIndicator {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export function ChatPanel({
  consultationId,
  currentUserId,
  currentUserName,
  currentUserRole,
  onSendMessage,
  onFileUpload,
  isVisible,
  onClose,
  className
}: ChatPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll para a última mensagem
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Simular mensagens iniciais (em produção, viria da API)
  useEffect(() => {
    const initialMessages: ChatMessage[] = [
      {
        id: '1',
        senderId: 'system',
        senderName: 'Sistema',
        senderRole: 'doctor',
        content: 'Teleconsulta iniciada. Bem-vindos!',
        type: 'system',
        timestamp: new Date(Date.now() - 300000),
        isRead: true,
        isDelivered: true
      }
    ];
    setMessages(initialMessages);
  }, [consultationId]);

  // Indicador de digitação
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // Aqui você enviaria via WebSocket que o usuário está digitando
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Aqui você enviaria via WebSocket que o usuário parou de digitar
    }, 1000);
  }, [isTyping]);

  // Enviar mensagem
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    const messageData: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead' | 'isDelivered'> = {
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      content: newMessage.trim(),
      type: 'text'
    };

    const message: ChatMessage = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
      isDelivered: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setIsTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    onSendMessage?.(messageData);
  }, [newMessage, currentUserId, currentUserName, currentUserRole, onSendMessage]);

  // Upload de arquivo
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho do arquivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileUrl = onFileUpload ? await onFileUpload(file) : URL.createObjectURL(file);
      
      const messageData: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead' | 'isDelivered'> = {
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        content: `Arquivo enviado: ${file.name}`,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl,
        fileName: file.name,
        fileSize: file.size
      };

      const message: ChatMessage = {
        ...messageData,
        id: Date.now().toString(),
        timestamp: new Date(),
        isRead: false,
        isDelivered: true
      };

      setMessages(prev => [...prev, message]);
      onSendMessage?.(messageData);

      toast({
        title: "Arquivo enviado",
        description: `${file.name} foi enviado com sucesso`
      });

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [currentUserId, currentUserName, currentUserRole, onFileUpload, onSendMessage, toast]);

  // Copiar mensagem
  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Mensagem copiada",
      description: "Texto copiado para a área de transferência"
    });
  }, [toast]);

  // Baixar arquivo
  const downloadFile = useCallback((fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Formatar tamanho do arquivo
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Renderizar mensagem
  const renderMessage = useCallback((message: ChatMessage) => {
    const isOwnMessage = message.senderId === currentUserId;
    const isSystemMessage = message.type === 'system';

    if (isSystemMessage) {
      return (
        <div key={message.id} className="flex justify-center my-4">
          <Badge variant="secondary" className="text-xs">
            {message.content}
          </Badge>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={cn(
          "flex mb-4",
          isOwnMessage ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "max-w-[70%] rounded-lg p-3 shadow-sm",
            isOwnMessage
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-900"
          )}
        >
          {!isOwnMessage && (
            <div className="text-xs font-medium mb-1 text-gray-600">
              {message.senderName} ({message.senderRole === 'doctor' ? 'Médico' : 'Paciente'})
            </div>
          )}
          
          {message.type === 'text' && (
            <div className="text-sm">{message.content}</div>
          )}
          
          {message.type === 'image' && (
            <div className="space-y-2">
              <img
                src={message.fileUrl}
                alt={message.fileName}
                className="max-w-full h-auto rounded"
              />
              <div className="text-xs opacity-75">{message.fileName}</div>
            </div>
          )}
          
          {message.type === 'file' && (
            <div className="flex items-center space-x-2 p-2 bg-white/10 rounded">
              <FileText className="w-4 h-4" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{message.fileName}</div>
                <div className="text-xs opacity-75">
                  {message.fileSize && formatFileSize(message.fileSize)}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => message.fileUrl && message.fileName && downloadFile(message.fileUrl, message.fileName)}
                className="h-6 w-6 p-0"
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs opacity-75">
              {format(message.timestamp, 'HH:mm', { locale: ptBR })}
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyMessage(message.content)}
                className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
              >
                <Copy className="w-3 h-3" />
              </Button>
              
              {isOwnMessage && (
                <div className="text-xs opacity-75">
                  {message.isDelivered ? '✓' : '⏳'}
                  {message.isRead ? '✓' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [currentUserId, copyMessage, downloadFile, formatFileSize]);

  if (!isVisible) return null;

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Chat da Consulta</CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Separator />
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Área de mensagens */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1">
            {messages.map(renderMessage)}
            
            {/* Indicador de digitação */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[70%]">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {typingUsers[0].userName} está digitando...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
        
        {/* Área de input */}
        <div className="p-4 border-t">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="resize-none"
                disabled={isUploading}
              />
            </div>
            
            <div className="flex space-x-1">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-10 w-10 p-0"
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isUploading}
                className="h-10 w-10 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}