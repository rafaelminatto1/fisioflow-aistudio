// app/pacientes/[id]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader'; // Supondo que o PageHeader foi movido para ui
import PatientDetailClient from '@/components/pacientes/PatientDetailClient';

type PatientDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      conditions: true,
      surgeries: true,
    },
  });
  
  if (!patient) {
    notFound();
  }
  
  // TODO: Buscar outros dados relacionados como agendamentos, prontuários, etc.
  // const appointments = await prisma.appointment.findMany({ where: { patientId: id }});
  
  return (
    <>
      <PageHeader
        title={patient.name}
        subtitle={`Prontuário, histórico e agendamentos do paciente.`}
      />
      
      {/* O componente cliente gerencia a interatividade das abas */}
      <PatientDetailClient patient={patient} />
    </>
  );
}
