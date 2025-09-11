import React from 'react';
import { notFound } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import PatientInfoCard from '@/components/PatientInfoCard';
import MedicalRecordTabs from '@/components/MedicalRecordTabs';
import WhatsAppMessageButton from '@/components/WhatsAppMessageButton';
import { getPatientById, getPatientSoapNotes, getPatientAssessments } from '@/app/actions/patient.actions';

interface PatientDetailPageProps {
  params: {
    id: string;
  };
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const patientId = params.id;
  
  // Carregar dados do paciente
  const [patientResult, soapNotesResult, assessmentsResult] = await Promise.all([
    getPatientById(patientId),
    getPatientSoapNotes(patientId),
    getPatientAssessments(patientId)
  ]);

  if (!patientResult.success || !patientResult.data) {
    notFound();
  }

  const patient = patientResult.data;
  const soapNotes = soapNotesResult.success ? soapNotesResult.data : [];
  const assessments = assessmentsResult.success ? assessmentsResult.data : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/pacientes"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                <p className="text-sm text-gray-600">Prontuário Eletrônico</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <WhatsAppMessageButton patient={patient} />
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Info Sidebar */}
          <div className="lg:col-span-1">
            <PatientInfoCard patient={patient} />
          </div>
          
          {/* Medical Records */}
          <div className="lg:col-span-2">
            <MedicalRecordTabs
              patientId={patientId}
              soapNotes={soapNotes || []}
              assessments={assessments || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}