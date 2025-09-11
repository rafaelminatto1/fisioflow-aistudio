'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Patient, SoapNote, AssessmentResult } from '@/types';

export async function getPatientById(patientId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId: session.user.id
      },
      include: {
        appointments: {
          orderBy: {
            scheduledFor: 'desc'
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
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId: session.user.id
      }
    });

    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    const soapNotes = await prisma.soapNote.findMany({
      where: {
        appointment: {
          patientId: patientId,
          patient: {
            userId: session.user.id
          }
        }
      },
      include: {
        appointment: {
          select: {
            id: true,
            scheduledFor: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

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
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId: session.user.id
      }
    });

    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    const assessments = await prisma.assessmentResult.findMany({
      where: {
        patientId: patientId,
        patient: {
          userId: session.user.id
        }
      },
      include: {
        assessment: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            type: true,
            scoringRules: true
          }
        }
      },
      orderBy: {
        evaluatedAt: 'desc'
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
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId: session.user.id
      }
    });

    if (!existingPatient) {
      throw new Error('Paciente não encontrado');
    }

    const updatedPatient = await prisma.patient.update({
      where: {
        id: patientId
      },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        birthDate: data.birthDate,
        gender: data.gender,
        address: data.address,
        emergencyContact: data.emergencyContact,
        medicalAlerts: data.medicalAlerts,
        consentGiven: data.consentGiven,
        consentDate: data.consentDate,
        updatedAt: new Date()
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
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId: session.user.id
      }
    });

    if (!existingPatient) {
      throw new Error('Paciente não encontrado');
    }

    // Verificar se há consultas agendadas futuras
    const futureAppointments = await prisma.appointment.count({
      where: {
        patientId: patientId,
        scheduledFor: {
          gte: new Date()
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    });

    if (futureAppointments > 0) {
      throw new Error('Não é possível excluir paciente com consultas agendadas futuras');
    }

    await prisma.patient.delete({
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
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId: session.user.id
      }
    });

    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    const [totalAppointments, completedAppointments, soapNotesCount, assessmentsCount] = await Promise.all([
      prisma.appointment.count({
        where: {
          patientId: patientId,
          patient: {
            userId: session.user.id
          }
        }
      }),
      prisma.appointment.count({
        where: {
          patientId: patientId,
          status: 'COMPLETED',
          patient: {
            userId: session.user.id
          }
        }
      }),
      prisma.soapNote.count({
        where: {
          appointment: {
            patientId: patientId,
            patient: {
              userId: session.user.id
            }
          }
        }
      }),
      prisma.assessmentResult.count({
        where: {
          patientId: patientId,
          patient: {
            userId: session.user.id
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