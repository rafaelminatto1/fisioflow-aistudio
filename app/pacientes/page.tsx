// app/pacientes/page.tsx
import { cachedPrisma } from '../../lib/prisma';
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

  const findManyOptions: any = {
    take,
    skip: cursor ? 1 : 0,
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
  };
  
  if (cursor) {
    findManyOptions.cursor = { id: cursor };
  }
  
  const initialPatients = await cachedPrisma.patient.findMany(findManyOptions);

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

  let nextCursor = null;
  if (initialPatients.length === take && initialPatients.length > 0) {
    const lastPatient = initialPatients[initialPatients.length - 1];
    if (lastPatient && lastPatient.id) {
      nextCursor = lastPatient.id;
    }
  }

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
