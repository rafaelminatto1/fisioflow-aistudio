import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createSessionSchema = z.object({
  patient_id: z.string(),
  therapist_id: z.string(),
  session_type: z.enum(['consultation', 'follow_up', 'exercise_guidance', 'assessment']),
  scheduled_start: z.string().datetime(),
  duration_minutes: z.number().min(15).max(120).default(45),
  notes: z.string().optional(),
  requires_recording: z.boolean().default(false),
  emergency_session: z.boolean().default(false)
});

const updateSessionSchema = z.object({
  session_id: z.string(),
  status: z.enum(['scheduled', 'starting', 'active', 'paused', 'completed', 'cancelled', 'no_show']).optional(),
  actual_start: z.string().datetime().optional(),
  actual_end: z.string().datetime().optional(),
  session_notes: z.string().optional(),
  patient_feedback: z.string().optional(),
  technical_issues: z.array(z.string()).optional(),
  recording_url: z.string().optional(),
  connection_quality: z.enum(['excellent', 'good', 'fair', 'poor']).optional()
});

const joinSessionSchema = z.object({
  session_id: z.string(),
  user_id: z.string(),
  user_type: z.enum(['patient', 'therapist']),
  device_info: z.object({
    browser: z.string(),
    os: z.string(),
    camera_available: z.boolean(),
    microphone_available: z.boolean(),
    screen_resolution: z.string().optional()
  }).optional()
});

// WebRTC signaling data schema
const signalingSchema = z.object({
  session_id: z.string(),
  from_user: z.string(),
  to_user: z.string(),
  signal_type: z.enum(['offer', 'answer', 'ice-candidate', 'hangup']),
  signal_data: z.any(),
  timestamp: z.string().datetime().optional()
});

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const data = await request.json();
    
    switch (action) {
      case 'create':
        return await createTelemedicineSession(data);
      case 'join':
        return await joinTelemedicineSession(data);
      case 'signal':
        return await handleWebRTCSignaling(data);
      case 'update':
        return await updateTelemedicineSession(data);
      default:
        return NextResponse.json({
          success: false,
          error: 'Ação não reconhecida'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error in telemedicine session API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno no sistema de telemedicina'
    }, { status: 500 });
  }
}

async function createTelemedicineSession(data: any) {
  const validatedData = createSessionSchema.parse(data);
  
  // Generate session ID and room
  const sessionId = `tele_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const roomId = `room_${sessionId}`;
  
  // Create session in database
  const session = await prisma.telemedicine_sessions.create({
    data: {
      id: sessionId,
      patient_id: validatedData.patient_id,
      therapist_id: validatedData.therapist_id,
      session_type: validatedData.session_type,
      status: 'scheduled',
      scheduled_start: new Date(validatedData.scheduled_start),
      duration_minutes: validatedData.duration_minutes,
      room_id: roomId,
      notes: validatedData.notes,
      requires_recording: validatedData.requires_recording,
      emergency_session: validatedData.emergency_session,
      created_at: new Date(),
      updated_at: new Date()
    },
    include: {
      patient: {
        select: {
          name: true,
          email: true
        }
      },
      therapist: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
  
  // Send notifications
  await sendSessionNotifications(session);
  
  // Initialize WebRTC room
  const roomConfig = await initializeWebRTCRoom(roomId, {
    maxParticipants: 2,
    recording: validatedData.requires_recording,
    sessionType: validatedData.session_type
  });
  
  return NextResponse.json({
    success: true,
    session: {
      ...session,
      room_config: roomConfig,
      join_urls: {
        patient: `${process.env.NEXTAUTH_URL}/telemedicine/join/${sessionId}?role=patient`,
        therapist: `${process.env.NEXTAUTH_URL}/telemedicine/join/${sessionId}?role=therapist`
      }
    }
  });
}

async function joinTelemedicineSession(data: any) {
  const validatedData = joinSessionSchema.parse(data);
  
  // Verify session exists and user has permission
  const session = await prisma.telemedicine_sessions.findUnique({
    where: { id: validatedData.session_id },
    include: {
      patient: true,
      therapist: true
    }
  });
  
  if (!session) {
    return NextResponse.json({
      success: false,
      error: 'Sessão não encontrada'
    }, { status: 404 });
  }
  
  // Verify user permission
  const hasPermission = (
    (validatedData.user_type === 'patient' && session.patient_id === validatedData.user_id) ||
    (validatedData.user_type === 'therapist' && session.therapist_id === validatedData.user_id)
  );
  
  if (!hasPermission) {
    return NextResponse.json({
      success: false,
      error: 'Sem permissão para acessar esta sessão'
    }, { status: 403 });
  }
  
  // Check session timing (allow joining 15 minutes early)
  const now = new Date();
  const scheduledStart = new Date(session.scheduled_start);
  const earlyJoinTime = new Date(scheduledStart.getTime() - 15 * 60 * 1000);
  
  if (now < earlyJoinTime) {
    return NextResponse.json({
      success: false,
      error: 'Muito cedo para entrar na sessão',
      available_at: earlyJoinTime.toISOString()
    }, { status: 425 });
  }
  
  // Log participant join
  await prisma.telemedicine_participants.create({
    data: {
      id: `participant_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      session_id: validatedData.session_id,
      user_id: validatedData.user_id,
      user_type: validatedData.user_type,
      joined_at: new Date(),
      device_info: validatedData.device_info
    }
  });
  
  // Update session status if first participant
  if (session.status === 'scheduled') {
    await prisma.telemedicine_sessions.update({
      where: { id: validatedData.session_id },
      data: { 
        status: 'starting',
        actual_start: new Date(),
        updated_at: new Date()
      }
    });
  }
  
  // Generate WebRTC access token
  const accessToken = await generateWebRTCToken(session.room_id, validatedData.user_id, validatedData.user_type);
  
  return NextResponse.json({
    success: true,
    session: session,
    access_token: accessToken,
    room_config: {
      room_id: session.room_id,
      ice_servers: await getICEServers(),
      constraints: {
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: { echoCancellation: true, noiseSuppression: true }
      }
    }
  });
}

async function handleWebRTCSignaling(data: any) {
  const validatedData = signalingSchema.parse(data);
  
  // Store signaling data for real-time delivery
  const signalingMessage = {
    ...validatedData,
    id: `signal_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date()
  };
  
  // In production, this would use WebSocket or Server-Sent Events
  // For now, we'll store in a temporary cache
  await storeSignalingMessage(signalingMessage);
  
  // Broadcast to other participants in the session
  await broadcastSignalingMessage(validatedData.session_id, signalingMessage);
  
  return NextResponse.json({
    success: true,
    message_id: signalingMessage.id
  });
}

async function updateTelemedicineSession(data: any) {
  const validatedData = updateSessionSchema.parse(data);
  
  const updatedSession = await prisma.telemedicine_sessions.update({
    where: { id: validatedData.session_id },
    data: {
      ...validatedData,
      updated_at: new Date()
    },
    include: {
      patient: {
        select: { name: true, email: true }
      },
      therapist: {
        select: { name: true, email: true }
      }
    }
  });
  
  // Handle session completion
  if (validatedData.status === 'completed') {
    await handleSessionCompletion(updatedSession);
  }
  
  return NextResponse.json({
    success: true,
    session: updatedSession
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sessionId = searchParams.get('session_id');
    const userId = searchParams.get('user_id');
    
    switch (action) {
      case 'get':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'ID da sessão é obrigatório'
          }, { status: 400 });
        }
        
        return await getTelemedicineSession(sessionId);
        
      case 'list':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'ID do usuário é obrigatório'
          }, { status: 400 });
        }
        
        return await getUserTelemedicineSessions(userId);
        
      case 'signals':
        if (!sessionId || !userId) {
          return NextResponse.json({
            success: false,
            error: 'ID da sessão e do usuário são obrigatórios'
          }, { status: 400 });
        }
        
        return await getSignalingMessages(sessionId, userId);
        
      case 'stats':
        return await getTelemedicineStats();
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Ação não reconhecida'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error in GET telemedicine sessions:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

async function getTelemedicineSession(sessionId: string) {
  const session = await prisma.telemedicine_sessions.findUnique({
    where: { id: sessionId },
    include: {
      patient: {
        select: { name: true, email: true, phone: true }
      },
      therapist: {
        select: { name: true, email: true }
      },
      participants: {
        select: {
          user_id: true,
          user_type: true,
          joined_at: true,
          left_at: true,
          device_info: true
        }
      }
    }
  });
  
  if (!session) {
    return NextResponse.json({
      success: false,
      error: 'Sessão não encontrada'
    }, { status: 404 });
  }
  
  return NextResponse.json({
    success: true,
    session
  });
}

async function getUserTelemedicineSessions(userId: string) {
  const sessions = await prisma.telemedicine_sessions.findMany({
    where: {
      OR: [
        { patient_id: userId },
        { therapist_id: userId }
      ]
    },
    include: {
      patient: {
        select: { name: true }
      },
      therapist: {
        select: { name: true }
      }
    },
    orderBy: { scheduled_start: 'desc' },
    take: 50
  });
  
  return NextResponse.json({
    success: true,
    sessions
  });
}

// Helper functions

async function sendSessionNotifications(session: any) {
  // Implementation would send email/SMS/push notifications
  console.log(`Sending notifications for session ${session.id}`);
}

async function initializeWebRTCRoom(roomId: string, config: any) {
  // Initialize WebRTC room configuration
  return {
    room_id: roomId,
    max_participants: config.maxParticipants,
    recording_enabled: config.recording,
    created_at: new Date().toISOString()
  };
}

async function generateWebRTCToken(roomId: string, userId: string, userType: string) {
  // Generate JWT token for WebRTC access
  return `token_${roomId}_${userId}_${userType}_${Date.now()}`;
}

async function getICEServers() {
  // Return STUN/TURN server configuration
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TURN servers would be configured here for production
  ];
}

async function storeSignalingMessage(message: any) {
  // Store signaling message in temporary cache/Redis
  console.log(`Storing signaling message: ${message.id}`);
}

async function broadcastSignalingMessage(sessionId: string, message: any) {
  // Broadcast to other participants via WebSocket/SSE
  console.log(`Broadcasting signaling message for session: ${sessionId}`);
}

async function handleSessionCompletion(session: any) {
  // Handle post-session tasks
  console.log(`Session ${session.id} completed`);
  
  // Create appointment record if needed
  // Generate session summary
  // Update patient records
  // Send follow-up notifications
}

async function getSignalingMessages(sessionId: string, userId: string) {
  // Return pending signaling messages for user
  return NextResponse.json({
    success: true,
    messages: []
  });
}

async function getTelemedicineStats() {
  const stats = await prisma.telemedicine_sessions.aggregate({
    _count: { id: true },
    where: {
      created_at: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  });
  
  const statusCounts = await prisma.telemedicine_sessions.groupBy({
    by: ['status'],
    _count: { status: true },
    where: {
      created_at: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  });
  
  return NextResponse.json({
    success: true,
    stats: {
      total_sessions: stats._count.id,
      by_status: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>)
    }
  });
}