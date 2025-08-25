# FisioFlow API Documentation

## Overview

FisioFlow is a comprehensive physiotherapy management system built with Next.js 14, featuring advanced analytics, AI-powered insights, and integrated communication systems. This API documentation provides detailed information about all available endpoints, authentication, and usage examples.

## Base URL

- **Production**: `https://fisioflow.vercel.app/api`
- **Development**: `http://localhost:3000/api`

## Authentication

FisioFlow uses NextAuth.js for authentication with session-based security. All protected routes require a valid session.

### Session Structure
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "Admin" | "Fisioterapeuta" | "EducadorFisico" | "Paciente"
  }
}
```

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes per IP
- **Login endpoints**: 5 attempts per 15 minutes per IP
- **Analytics endpoints**: 50 requests per hour per user

## Security Features

- Advanced input sanitization
- SQL injection detection
- XSS protection
- CSRF tokens
- Request monitoring and logging
- IP-based threat detection

---

## Endpoints

### Health Check

#### GET /api/health
Check system health and service availability.

**Response**:
```json
{
  "status": "healthy" | "unhealthy" | "degraded",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 45
    },
    "redis": {
      "status": "healthy",
      "responseTime": 12
    },
    "ai": {
      "status": "healthy",
      "responseTime": 230
    },
    "email": {
      "status": "healthy",
      "responseTime": 156
    },
    "whatsapp": {
      "status": "healthy",
      "responseTime": 89
    }
  }
}
```

---

## Patient Management

### GET /api/pacientes
Retrieve list of patients.

**Query Parameters**:
- `limit` (number): Maximum number of results (default: 50, max: 100)
- `offset` (number): Number of results to skip (default: 0)
- `search` (string): Search by name, email, or phone
- `status` (string): Filter by status (`Active`, `Inactive`, `Completed`)
- `sortBy` (string): Sort field (`name`, `createdAt`, `lastVisit`)
- `sortOrder` (string): Sort direction (`asc`, `desc`)

**Response**:
```json
{
  "patients": [
    {
      "id": "patient_123",
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": "11999999999",
      "dateOfBirth": "1985-06-15",
      "cpf": "123.456.789-01",
      "address": "Rua das Flores, 123",
      "medicalHistory": "Lesão no joelho direito",
      "status": "Active",
      "createdAt": "2024-01-01T10:00:00Z",
      "lastVisit": "2024-01-10T14:30:00Z",
      "appointmentCount": 12,
      "completedSessions": 10
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

### POST /api/pacientes
Create a new patient.

**Request Body**:
```json
{
  "name": "Maria Santos",
  "email": "maria@email.com",
  "phone": "11888888888",
  "dateOfBirth": "1990-03-20",
  "cpf": "987.654.321-00",
  "address": "Av. Principal, 456",
  "medicalHistory": "Dor nas costas crônica",
  "emergencyContact": {
    "name": "Pedro Santos",
    "phone": "11777777777",
    "relationship": "Cônjuge"
  },
  "healthInsurance": {
    "provider": "Unimed",
    "cardNumber": "123456789",
    "validUntil": "2024-12-31"
  }
}
```

**Response**:
```json
{
  "id": "patient_456",
  "name": "Maria Santos",
  "email": "maria@email.com",
  "status": "Active",
  "createdAt": "2024-01-15T10:30:00Z",
  "message": "Patient created successfully"
}
```

### GET /api/pacientes/[id]
Retrieve specific patient details.

**Response**:
```json
{
  "id": "patient_123",
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "dateOfBirth": "1985-06-15",
  "address": "Rua das Flores, 123",
  "medicalHistory": "Lesão no joelho direito",
  "status": "Active",
  "appointments": [
    {
      "id": "apt_789",
      "date": "2024-01-20T14:00:00Z",
      "type": "Fisioterapia",
      "status": "Agendado",
      "therapist": {
        "id": "therapist_001",
        "name": "Dr. Ana Costa"
      }
    }
  ],
  "painPoints": [
    {
      "id": "pain_001",
      "bodyPart": "Joelho Direito",
      "intensity": 7,
      "type": "Aguda",
      "description": "Dor ao caminhar",
      "date": "2024-01-15T09:00:00Z"
    }
  ],
  "metrics": [
    {
      "id": "metric_001",
      "name": "Flexão do Joelho",
      "value": 90,
      "unit": "graus",
      "targetValue": 120,
      "measuredAt": "2024-01-15T14:30:00Z"
    }
  ]
}
```

### PUT /api/pacientes/[id]
Update patient information.

**Request Body**: Same as POST but with partial updates allowed.

### DELETE /api/pacientes/[id]
Soft delete a patient (sets status to Inactive).

---

## Appointment Management

### GET /api/appointments
Retrieve appointments list.

**Query Parameters**:
- `therapistId` (string): Filter by therapist
- `patientId` (string): Filter by patient
- `status` (string): Filter by status
- `date` (string): Filter by date (YYYY-MM-DD)
- `dateRange` (string): Date range filter (`today`, `week`, `month`)

**Response**:
```json
{
  "appointments": [
    {
      "id": "apt_123",
      "patientId": "patient_456",
      "therapistId": "therapist_001",
      "startTime": "2024-01-20T14:00:00Z",
      "endTime": "2024-01-20T15:00:00Z",
      "type": "Fisioterapia",
      "status": "Agendado",
      "notes": "Primeira consulta",
      "patient": {
        "name": "João Silva",
        "phone": "11999999999"
      },
      "therapist": {
        "name": "Dr. Ana Costa"
      }
    }
  ]
}
```

### POST /api/appointments
Create new appointment.

**Request Body**:
```json
{
  "patientId": "patient_456",
  "therapistId": "therapist_001",
  "startTime": "2024-01-25T10:00:00Z",
  "endTime": "2024-01-25T11:00:00Z",
  "type": "Fisioterapia",
  "notes": "Avaliação inicial",
  "sendReminder": true,
  "reminderMethods": ["email", "whatsapp"]
}
```

### PUT /api/appointments/[id]
Update appointment details.

### DELETE /api/appointments/[id]
Cancel appointment.

---

## Analytics & Insights

### GET /api/analytics/advanced
Get comprehensive dashboard analytics.

**Query Parameters**:
- `range` (string): Time range (`7d`, `30d`, `90d`, `1y`)
- `userId` (string): Therapist ID for filtered data

**Response**:
```json
{
  "overview": {
    "totalPatients": 150,
    "activePatients": 120,
    "completionRate": 85,
    "avgSessionsPerPatient": 8.5,
    "monthlyGrowth": 12
  },
  "patientInsights": [
    {
      "patientId": "patient_123",
      "patientName": "João Silva",
      "riskLevel": "medium",
      "recoveryProgress": 75,
      "attendanceRate": 90,
      "painTrend": "improving"
    }
  ],
  "performance": {
    "weeklyAppointments": [
      {
        "week": "2024-01-15",
        "appointments": 45,
        "completed": 40,
        "noShow": 5
      }
    ],
    "treatmentSuccess": [
      {
        "treatmentType": "Fisioterapia",
        "successRate": 92,
        "avgDuration": 12,
        "patientCount": 50
      }
    ]
  },
  "alerts": [
    {
      "type": "patient_risk",
      "severity": "high",
      "message": "Paciente com alto índice de faltas",
      "patientName": "Pedro Santos",
      "actionRequired": "Entrar em contato",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "predictions": {
    "dischargeCandidates": [
      {
        "patientName": "Maria Silva",
        "probability": 92,
        "expectedDate": "2024-02-15"
      }
    ]
  }
}
```

### GET /api/analytics/patient-insights/[patientId]
Get AI-powered insights for specific patient.

**Response**:
```json
{
  "patientId": "patient_123",
  "riskLevel": "medium",
  "insights": {
    "recovery": {
      "progress": 75,
      "trend": "improving",
      "analysis": "Patient showing consistent improvement in mobility metrics"
    },
    "attendance": {
      "rate": 90,
      "pattern": "consistent",
      "analysis": "Regular attendance pattern with minor variations"
    },
    "pain": {
      "trend": "improving",
      "avgIntensity": 4.2,
      "analysis": "Pain levels decreasing steadily over treatment period"
    }
  },
  "predictions": {
    "dischargeProbability": 85,
    "recommendedActions": [
      "Continue current treatment protocol",
      "Schedule follow-up in 2 weeks"
    ]
  }
}
```

---

## Communication

### POST /api/communication/email/send
Send email to patient.

**Request Body**:
```json
{
  "patientId": "patient_123",
  "type": "appointment_reminder" | "treatment_report" | "welcome" | "custom",
  "customSubject": "Custom email subject",
  "customMessage": "Custom email content",
  "appointmentId": "apt_456" // Required for appointment_reminder
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "email_789",
  "sentAt": "2024-01-15T10:30:00Z"
}
```

### POST /api/communication/whatsapp/send
Send WhatsApp message to patient.

**Request Body**:
```json
{
  "patientId": "patient_123",
  "type": "appointment_reminder" | "treatment_update" | "custom",
  "customMessage": "Custom WhatsApp message",
  "appointmentId": "apt_456"
}
```

---

## Pain Tracking

### GET /api/pain-points
Get pain points for a patient.

**Query Parameters**:
- `patientId` (string): Required patient ID
- `limit` (number): Maximum results
- `startDate` (string): Filter from date
- `endDate` (string): Filter to date

### POST /api/pain-points
Record new pain point.

**Request Body**:
```json
{
  "patientId": "patient_123",
  "bodyPart": "Joelho Direito",
  "intensity": 7,
  "type": "Aguda",
  "description": "Dor ao caminhar, especialmente pela manhã",
  "triggers": ["movimento", "frio"],
  "reliefMethods": ["descanso", "calor"]
}
```

---

## Metrics Tracking

### GET /api/metrics
Get patient metrics.

**Query Parameters**:
- `patientId` (string): Required patient ID
- `metricType` (string): Filter by metric type

### POST /api/metrics
Record new metric measurement.

**Request Body**:
```json
{
  "patientId": "patient_123",
  "metricName": "Flexão do Joelho",
  "value": 95,
  "unit": "graus",
  "targetValue": 120,
  "notes": "Pequena melhora em relação à semana passada"
}
```

---

## SOAP Notes

### GET /api/soap-notes
Get SOAP notes for a patient.

**Query Parameters**:
- `patientId` (string): Required patient ID
- `limit` (number): Maximum results

### POST /api/soap-notes
Create new SOAP note.

**Request Body**:
```json
{
  "patientId": "patient_123",
  "appointmentId": "apt_456",
  "subjective": "Paciente relata melhora na dor, conseguindo caminhar distâncias maiores",
  "objective": "Flexão do joelho: 95°, Extensão: completa, Sem edema visível",
  "assessment": "Evolução positiva do quadro, redução significativa da dor",
  "plan": "Continuar exercícios atuais, aumentar carga gradativamente"
}
```

---

## Error Handling

All endpoints return consistent error responses:

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error description",
  "details": {
    "field": "Specific field errors if applicable"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (business logic errors)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Security Headers

All API responses include security headers:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Referrer-Policy: strict-origin-when-cross-origin
X-Response-Time: {processing_time}ms
X-Request-ID: {unique_request_id}
```

---

## SDKs and Libraries

### JavaScript/TypeScript
```javascript
// Using fetch API
const response = await fetch('/api/pacientes', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include' // Important for session cookies
});

const patients = await response.json();
```

### React Hook Example
```javascript
import { useState, useEffect } from 'react';

function usePatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const response = await fetch('/api/pacientes');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setPatients(data.patients);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, []);

  return { patients, loading, error };
}
```

---

## Webhooks

### WhatsApp Webhooks
FisioFlow can receive WhatsApp webhook events:

**Endpoint**: `/api/webhooks/whatsapp`
**Method**: `POST`

**Webhook Payload**:
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "PHONE_NUMBER",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "messages": [
              {
                "from": "CUSTOMER_PHONE_NUMBER",
                "id": "MESSAGE_ID",
                "timestamp": "TIMESTAMP",
                "text": {
                  "body": "MESSAGE_BODY"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

---

## Monitoring and Logging

### Request Logging
All API requests are logged with:
- Request ID
- User ID (if authenticated)
- IP address
- User agent
- Response time
- Status code
- Error details (if any)

### Metrics Collection
The system automatically tracks:
- API response times
- Error rates
- User activity patterns
- Security events
- Business metrics (appointments, patients, etc.)

---

## Version History

### v1.0.0 (Current)
- Initial API release
- Patient management
- Appointment scheduling
- Basic analytics
- Email notifications

### v1.1.0
- Advanced analytics
- AI-powered insights
- WhatsApp integration
- Enhanced security features

### v1.2.0 (Planned)
- Mobile app API
- Advanced reporting
- Integration webhooks
- Real-time notifications

---

## Support

For API support and questions:
- **Documentation**: https://docs.fisioflow.com.br
- **Email**: api-support@fisioflow.com.br
- **GitHub Issues**: https://github.com/fisioflow/api/issues

---

## Rate Limiting Details

### Default Limits
- **Public endpoints**: 1000 requests/hour
- **Authenticated endpoints**: 5000 requests/hour
- **Premium accounts**: 10000 requests/hour

### Headers
Rate limit information is included in response headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

This documentation is automatically updated with each API release. For the most current information, always refer to the online documentation at https://docs.fisioflow.com.br.