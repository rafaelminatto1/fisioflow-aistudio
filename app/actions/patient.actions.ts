'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Patient, SoapNote } from '@/types';

export async function getPatientById(patientId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const patient = await prisma.patients.findFirst({
      where: {
        id: patientId,
        // userId: session.user.id  // Field doesn't exist in schema
      },
      include: {
        appointments: {
          orderBy: {
            start_time: 'desc'
          },
          take: 1
        }
      }
    });

    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    return {
      success: true,
      data: patient
    };
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    };
  }
}

export async function getPatientSoapNotes(patientId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o paciente pertence ao usuário
    const patient = await prisma.patients.findFirst({
      where: {
        id: patientId,
        // userId: session.user.id
      }
    });

    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    // Mock soap notes for now
    const soapNotes: any[] = [];

    return {
      success: true,
      data: soapNotes
    };
  } catch (error) {
    console.error('Erro ao buscar notas SOAP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    };
  }
}

export async function getPatientAssessments(patientId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o paciente pertence ao usuário
    const patient = await prisma.patients.findFirst({
      where: {
        id: patientId,
        // userId: session.user.id
      }
    });

    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    const assessments = await prisma.assessment_results.findMany({
      where: {
        patient_id: patientId,
        patients: {
          // userId: session.user.id
        }
      },
      include: {
        standardized_assessments: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            type: true,
            scoring_rules: true
          }
        }
      },
      orderBy: {
        evaluated_at: 'desc'
      }
    });

    return {
      success: true,
      data: assessments
    };
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    };
  }
}

export async function updatePatient(patientId: string, data: Partial<Patient>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o paciente pertence ao usuário
    const existingPatient = await prisma.patients.findFirst({
      where: {
        id: patientId,
        // userId: session.user.id
      }
    });

    if (!existingPatient) {
      throw new Error('Paciente não encontrado');
    }

    const updatedPatient = await prisma.patients.update({
      where: {
        id: patientId
      },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        birth_date: data.birthDate,
        address: data.address,
        emergency_contact: data.emergencyContact,
        medical_alerts: data.medicalAlerts,
        consent_given: data.consentGiven,
        updated_at: new Date()
      }
    });

    revalidatePath(`/pacientes/${patientId}`);
    revalidatePath('/pacientes');

    return {
      success: true,
      data: updatedPatient
    };
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    };
  }
}

export async function deletePatient(patientId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o paciente pertence ao usuário
    const existingPatient = await prisma.patients.findFirst({
      where: {
        id: patientId,
        // userId: session.user.id
      }
    });

    if (!existingPatient) {
      throw new Error('Paciente não encontrado');
    }

    // Verificar se há consultas agendadas futuras
    const futureAppointments = await prisma.appointments.count({
      where: {
        patient_id: patientId,
        start_time: {
          gte: new Date()
        },
        status: {
          in: ['Agendado', 'Realizado']
        }
      }
    });

    if (futureAppointments > 0) {
      throw new Error('Não é possível excluir paciente com consultas agendadas futuras');
    }

    await prisma.patients.delete({
      where: {
        id: patientId
      }
    });

    revalidatePath('/pacientes');

    return {
      success: true,
      message: 'Paciente excluído com sucesso'
    };
  } catch (error) {
    console.error('Erro ao excluir paciente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    };
  }
}

export async function getPatientStats(patientId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o paciente pertence ao usuário
    const patient = await prisma.patients.findFirst({
      where: {
        id: patientId,
        // userId: session.user.id
      }
    });

    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    const [totalAppointments, completedAppointments, soapNotesCount, assessmentsCount] = await Promise.all([
      prisma.appointments.count({
        where: {
          patient_id: patientId,
          patients: {
            // userId: session.user.id
          }
        }
      }),
      prisma.appointments.count({
        where: {
          patient_id: patientId,
          status: 'Concluido',
          patients: {
            // userId: session.user.id
          }
        }
      }),
      prisma.soap_notes.count({
        where: {
          appointments: {
            patient_id: patientId,
            patients: {
              // userId: session.user.id
            }
          }
        }
      }),
      prisma.assessment_results.count({
        where: {
          patient_id: patientId,
          patients: {
            // userId: session.user.id
          }
        }
      })
    ]);

    return {
      success: true,
      data: {
        totalAppointments,
        completedAppointments,
        soapNotesCount,
        assessmentsCount
      }
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do paciente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    };
  }
}