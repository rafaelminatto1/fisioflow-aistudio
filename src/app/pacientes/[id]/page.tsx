// src/app/pacientes/[id]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PatientDetailClient from '@/components/pacientes/PatientDetailClient'; // This will be created next

export const dynamic = 'force-dynamic';

interface PatientDetailPageProps {
  params: {
    id: string;
  };
}

// This is our new server-side data fetching function
async function getPatientDetails(id: string) {
  const patient = await prisma.patient.findUnique({
    where: { id },
    // Eagerly load all related data needed for the detail page.
    // This is far more efficient than multiple client-side requests.
    include: {
      appointments: {
        orderBy: { startTime: 'desc' },
      },
      soapNotes: {
        orderBy: { date: 'desc' },
      },
      treatmentPlan: true,
      medicalReports: {
        orderBy: { generatedAt: 'desc' },
      },
      projects: true,
      painPoints: true,
      attachments: true,
      // We also need to fetch other data that was previously in a global context
      // For simplicity, I'm fetching all therapists here. In a real app, this might be optimized.
    },
  });

  if (!patient) {
    return null;
  }

  // Fetch all therapists, as the appointment modal needs them.
  const therapists = await prisma.therapist.findMany();

  // We need to serialize date objects before passing them to the client component
  const serializeObject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    if (Array.isArray(obj)) {
      return obj.map(serializeObject);
    }
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeObject(value)])
    );
  };

  const serializedPatient = serializeObject(patient);
  const serializedTherapists = serializeObject(therapists);

  return { patient: serializedPatient, therapists: serializedTherapists };
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const data = await getPatientDetails(params.id);

  if (!data) {
    notFound(); // Triggers the 404 page
  }

  return (
    // The Client Component will handle all the state, interactivity, and rendering
    <PatientDetailClient patient={data.patient} therapists={data.therapists} />
  );
}
