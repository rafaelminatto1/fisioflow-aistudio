// app/pacientes/page.tsx
import cachedPrisma from '../../lib/prisma';
import PatientList from '../../components/pacientes/PatientList';
import PageHeader from '../../components/ui/PageHeader';

type PacientesPageProps = {
  searchParams: {
    q?: string;
    status?: string;
    cursor?: string;
  };
};

// Esta é uma página Server Component que busca os dados iniciais.
export default async function PacientesPage({
  searchParams,
}: PacientesPageProps) {
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

  const initialPatients = await cachedPrisma.client.patient.findMany({
    take,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where,
    select: {
      id: true,
      name: true,
      cpf: true,
      phone: true,
      email: true,
      status: true,
      lastVisit: true,
      medicalAlerts: true,
      // lastAppointment: true // Adicionar este campo no schema e na query se necessário
    },
    orderBy: { createdAt: 'desc' },
  });

  // Transform to PatientSummary format
  const transformedPatients = initialPatients.map((patient: any) => ({
    id: patient.id,
    name: patient.name,
    email: patient.email || '',
    phone: patient.phone || '',
    status: patient.status as 'Active' | 'Inactive' | 'Discharged',
    lastVisit: patient.lastVisit?.toISOString().split('T')[0] || '',
    avatarUrl: '', // Default empty since not in Prisma model
    medicalAlerts: patient.medicalAlerts || undefined,
    cpf: patient.cpf,
  }));

  const nextCursor =
    initialPatients.length === take
      ? initialPatients[initialPatients.length - 1].id
      : null;

  const initialData = {
    items: transformedPatients,
    nextCursor,
  };

  return (
    <>
      <PageHeader
        title='Gestão de Pacientes'
        description='Adicione, visualize e gerencie as informações dos seus pacientes.'
      />
      {/* O componente cliente gerencia a interatividade */}
      <PatientList initialData={initialData} />
    </>
  );
}
