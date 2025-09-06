// app/pacientes/[id]/page.tsx
import cachedPrisma from '../../../lib/prisma';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import PatientDetailClient from '../../../src/components/pacientes/PatientDetailClient';

type PatientDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = params;

  const patient = await cachedPrisma.client.patient.findUnique({
    where: { id },
  });
  
  // Transform Prisma Patient to match types.ts Patient interface
  const patientWithRelations = patient ? {
    id: patient.id,
    name: patient.name,
    cpf: patient.cpf,
    birthDate: patient.birthDate?.toISOString().split('T')[0] || '',
    phone: patient.phone || '',
    email: patient.email || '',
    emergencyContact: {
      name: (patient.emergencyContact as any)?.name || '',
      phone: (patient.emergencyContact as any)?.phone || '',
    },
    address: {
      street: (patient.address as any)?.street || '',
      city: (patient.address as any)?.city || '',
      state: (patient.address as any)?.state || '',
      zip: (patient.address as any)?.zip || '',
    },
    status: patient.status as 'Active' | 'Inactive' | 'Discharged',
    lastVisit: patient.lastVisit?.toISOString().split('T')[0] || '',
    registrationDate: patient.createdAt.toISOString().split('T')[0],
    avatarUrl: '',
    consentGiven: patient.consentGiven,
    whatsappConsent: patient.whatsappConsent === 'opt_in' ? 'opt-in' as const : 'opt-out' as const,
    allergies: patient.allergies || undefined,
     medicalAlerts: patient.medicalAlerts || undefined,
    soapNotes: [],
    treatmentPlan: null,
  } : null;
  
  if (!patientWithRelations) {
    notFound();
  }
  
  // TODO: Buscar outros dados relacionados como agendamentos, prontuários, etc.
  // const appointments = await prisma.appointment.findMany({ where: { patientId: id }});
  
  return (
    <>
      <PageHeader
        title={patientWithRelations.name}
        description={`Prontuário, histórico e agendamentos do paciente.`}
      />
      
      {/* O componente cliente gerencia a interatividade das abas */}
      <PatientDetailClient patient={patientWithRelations} />
    </>
  );
}
