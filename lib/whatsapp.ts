// lib/whatsapp.ts
import whatsappBusinessService from '@/services/whatsappBusinessService'

// Re-export the WhatsApp business service for easier imports
export { whatsappBusinessService as whatsapp }
export { whatsappBusinessService as whatsappService }
export default whatsappBusinessService

// Additional utility functions for WhatsApp integration
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Add country code if not present (assuming Brazil +55)
  if (cleaned.length === 11 && cleaned.startsWith('11')) {
    return `55${cleaned}`
  } else if (cleaned.length === 10) {
    return `5511${cleaned}`
  } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return cleaned
  }
  
  return cleaned
}

export const validateWhatsAppNumber = (phone: string): boolean => {
  const formatted = formatPhoneNumber(phone)
  return formatted.length >= 12 && formatted.length <= 15
}

// Quick access functions
export const sendAppointmentConfirmation = whatsappBusinessService.sendAppointmentConfirmation.bind(whatsappBusinessService)
export const sendAppointmentReminder = whatsappBusinessService.sendAppointmentReminder.bind(whatsappBusinessService)
export const sendCustomMessage = whatsappBusinessService.sendCustomMessage.bind(whatsappBusinessService)
export const sendHEP = whatsappBusinessService.sendHEP.bind(whatsappBusinessService)

// Legacy export for compatibility
export const sendWhatsAppMessage = (data: any) => {
  return whatsappBusinessService.sendCustomMessage(data.to, data.message);
};