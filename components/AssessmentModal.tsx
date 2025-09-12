"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AssessmentData {
  [key: string]: string | number | boolean
}

interface AssessmentModalProps {
  isOpen: boolean
  onClose: () => void
  patientId?: string
  onSave?: (data: AssessmentData) => void
}

export default function AssessmentModal({ 
  isOpen, 
  onClose, 
  patientId,
  onSave 
}: AssessmentModalProps) {
  const handleSave = () => {
    // Implementar lógica de salvamento
    if (onSave) {
      onSave({})
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Avaliação do Paciente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Componente de avaliação em desenvolvimento.
          </p>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}