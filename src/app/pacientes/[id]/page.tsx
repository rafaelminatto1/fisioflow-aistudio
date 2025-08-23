// app/pacientes/[id]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import PatientDetailClient from '@/components/pacientes/PatientDetailClient';

type PatientDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = params;

  // Fetch the patient and all related data in a single query
  const patient = await prisma.patient.findUnique({
    where: { id, deletedAt: null },
    include: {
      conditions: true,
      surgeries: true,
      attachments: true,
      trackedMetrics: true,
      painPoints: true,
      appointments: {
        orderBy: { startTime: 'desc' },
      },
      soapNotes: {
        orderBy: { createdAt: 'desc' }, // Assumes createdAt exists for sorting
      },
      treatmentPlan: {
        include: {
          exercises: true,
        },
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
        subtitle={`Prontuário, histórico e agendamentos do paciente.`}
      />
      
      {/* Client component handles interactivity. Data is passed after serialization. */}
      <PatientDetailClient patient={JSON.parse(JSON.stringify(patient))} />
    </>
  );
}
