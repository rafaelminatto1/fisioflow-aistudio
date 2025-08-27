// app/pacientes/[id]/page.tsx
import prisma from '../../../../lib/prisma';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import PatientDetailClient from '../../../../components/pacientes/PatientDetailClient';

type PatientDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = params;

  // Fetch the patient and all related data in a single query
  const patient = await prisma.client.patient.findUnique({
    where: { id },
    include: {
      painPoints: true,
      appointments: {
        orderBy: { startTime: 'desc' },
        include: {
          soapNotes: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      metricResults: {
        orderBy: { measuredAt: 'desc' },
      },
      communicationLogs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  
  if (!patient) {
    notFound();
  }
  
  return (
    <>
      <PageHeader
        title={patient.name}
        description={`Prontuário, histórico e agendamentos do paciente.`}
      />
      
      {/* Client component handles interactivity. Data is passed after serialization. */}
      <PatientDetailClient patient={JSON.parse(JSON.stringify(patient))} />
    </>
  );
}
