'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Patient } from '../types';

interface WhatsAppMessageButtonProps {
  patient: Patient;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const WhatsAppMessageButton: React.FC<WhatsAppMessageButtonProps> = ({
  patient,
  variant = 'outline',
  size = 'sm',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    if (patient.whatsappConsent !== 'opt_in') {
      toast.error('Paciente não autorizou receber mensagens WhatsApp');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patient.id,
          type: 'custom',
          message: message.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Mensagem enviada com sucesso!');
        setMessage('');
        setIsOpen(false);
      } else {
        toast.error(result.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const canSendWhatsApp = patient.whatsappConsent === 'opt_in' && patient.phone;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={!canSendWhatsApp}
          title={!canSendWhatsApp ? 'Paciente não autorizou WhatsApp ou não tem telefone' : 'Enviar mensagem WhatsApp'}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Enviar Mensagem WhatsApp
          </DialogTitle>
          <DialogDescription>
            Enviar mensagem para {patient.name} ({patient.phone})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-message">Mensagem</Label>
            <Textarea
              id="whatsapp-message"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sending || !message.trim()}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppMessageButton;