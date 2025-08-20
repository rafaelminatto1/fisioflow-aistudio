// app/pacientes/page.tsx
import prisma from '@/lib/prisma';
import PatientList from '@/components/pacientes/PatientList';
import PageHeader from '@/components/ui/PageHeader'; // Supondo que o PageHeader foi movido para ui

type PacientesPageProps = {
  searchParams: {
    q?: string;
    status?: string;
    cursor?: string;
  };
};

// Esta é uma página Server Component que busca os dados iniciais.
export default async function PacientesPage({ searchParams }: PacientesPageProps) {
  const take = 20;
  const { q: searchTerm = '', status = 'All', cursor } = searchParams;
  
  const where: any = {
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { cpf: { contains: searchTerm, mode: 'insensitive' } },
    ],
  };

  if (status && status !== 'All') {
    where.status = status;
  }
  
  const initialPatients = await prisma.patient.findMany({
    take,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where,
    select: {
      id: true,
      name: true,
      cpf: true,
      phone: true,
      status: true,
      avatarUrl: true,
      // lastAppointment: true // Adicionar este campo no schema e na query se necessário
    },
    orderBy: { createdAt: 'desc' },
  });
  
  const nextCursor = initialPatients.length === take ? initialPatients[initialPatients.length - 1].id : null;
  
  const initialData = {
      items: initialPatients,
      nextCursor,
  }

  return (
    <>
      <PageHeader
        title="Gestão de Pacientes"
        subtitle="Adicione, visualize e gerencie as informações dos seus pacientes."
      />
      {/* O componente cliente gerencia a interatividade */}
      <PatientList initialData={initialData} />
    </>
  );
}
