'use client';

import React from 'react';
import { User, Phone, Mail, MapPin, Calendar, AlertTriangle, Heart, FileText } from 'lucide-react';
import { Patient } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientInfoCardProps {
  patient: Patient;
}

export default function PatientInfoCard({ patient }: PatientInfoCardProps) {
  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const address = patient.address as any;
  const emergencyContact = patient.emergencyContact as any;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Patient Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
        <p className="text-sm text-gray-600">
          {patient.birthDate && `${getAge(patient.birthDate)} anos`}
        </p>
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
          patient.status === 'Active' 
            ? 'bg-green-100 text-green-800'
            : patient.status === 'Inactive'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {patient.status === 'Active' ? 'Ativo' : patient.status === 'Inactive' ? 'Inativo' : 'Suspenso'}
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Informações Básicas</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <FileText className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">CPF</p>
              <p className="text-sm text-gray-900">{formatCPF(patient.cpf)}</p>
            </div>
          </div>

          {patient.email && (
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{patient.email}</p>
              </div>
            </div>
          )}

          {patient.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Telefone</p>
                <p className="text-sm text-gray-900">{formatPhone(patient.phone)}</p>
              </div>
            </div>
          )}

          {patient.birthDate && (
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Data de Nascimento</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(patient.birthDate), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      {address && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Endereço</h3>
          <div className="flex items-start space-x-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-900">
                {address.street}, {address.number}
                {address.complement && `, ${address.complement}`}
              </p>
              <p className="text-sm text-gray-600">
                {address.neighborhood} - {address.city}/{address.state}
              </p>
              <p className="text-sm text-gray-600">{address.zipCode}</p>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contact */}
      {emergencyContact && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Contato de Emergência</h3>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">{emergencyContact.name}</p>
            <p className="text-xs text-gray-500">{emergencyContact.relationship}</p>
            {emergencyContact.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-3 h-3 text-gray-400" />
                <p className="text-sm text-gray-600">{formatPhone(emergencyContact.phone)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medical Alerts */}
      {(patient.allergies || patient.medicalAlerts) && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>Alertas Médicos</span>
          </h3>
          
          <div className="space-y-3">
            {patient.allergies && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-medium text-red-800 mb-1">Alergias</p>
                <p className="text-sm text-red-700">{patient.allergies}</p>
              </div>
            )}
            
            {patient.medicalAlerts && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs font-medium text-yellow-800 mb-1">Alertas Médicos</p>
                <p className="text-sm text-yellow-700">{patient.medicalAlerts}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last Visit */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Última Visita</h3>
        <div className="flex items-center space-x-3">
          <Heart className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm text-gray-900">
              {patient.lastVisit 
                ? format(new Date(patient.lastVisit), 'dd/MM/yyyy', { locale: ptBR })
                : 'Nunca'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Consent Status */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Consentimentos</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Termo de Consentimento</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              patient.consentGiven 
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {patient.consentGiven ? 'Assinado' : 'Pendente'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">WhatsApp</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              patient.whatsappConsent === 'opt_in'
                ? 'bg-green-100 text-green-800'
                : patient.whatsappConsent === 'opt_out'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {patient.whatsappConsent === 'opt_in' ? 'Autorizado' : 
               patient.whatsappConsent === 'opt_out' ? 'Negado' : 'Pendente'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}