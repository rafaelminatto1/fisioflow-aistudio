// src/app/patients/page.tsx
import PageHeader from '@/components/PageHeader';
import PatientListClient from '@/components/pacientes/PatientListClient'; // This component doesn't exist yet
import prisma from '@/lib/prisma';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // Ensures the page is always dynamically rendered

interface PatientsPageProps {
  searchParams: {
    q?: string;
    status?: string;
  };
}

// This function will fetch the initial data on the server
async function getPatients(searchTerm?: string, status?: string) {
  const take = 20;

  const where: any = {
    OR: searchTerm ? [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { cpf: { contains: searchTerm, mode: 'insensitive' } },
    ] : undefined,
  };

  if (status && status !== 'All') {
    where.status = status;
  }

  const patients = await prisma.patient.findMany({
    take: take + 1, // Fetch one more to check if there are more pages
    where: where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      lastVisit: true,
      avatarUrl: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const hasMore = patients.length > take;
  if (hasMore) {
    patients.pop(); // Remove the extra item
  }

  // We need to serialize the date objects
  return {
    initialPatients: patients.map(p => ({ ...p, lastVisit: p.lastVisit?.toISOString() || null })),
    hasMore,
  };
}

export default async function PatientListPage({ searchParams }: PatientsPageProps) {
  const { q, status } = searchParams;
  const { initialPatients, hasMore } = await getPatients(q, status);

  return (
    <>
      <PageHeader
        title="Gestão de Pacientes"
        subtitle="Adicione, visualize e gerencie as informações dos seus pacientes."
      >
        {/* The button will now likely open a modal managed by the client component, or navigate to a new page */}
         <Link href="/patients/new" className="inline-flex items-center justify-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Novo Paciente
        </Link>
      </PageHeader>

      {/* The client component will handle the rendering of the list, filtering, and loading more */}
      <PatientListClient
        initialPatients={initialPatients}
        initialHasMore={hasMore}
        initialSearch={q}
        initialStatus={status}
      />
    </>
  );
}
