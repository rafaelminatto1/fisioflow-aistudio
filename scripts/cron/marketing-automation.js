const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Email transporter configuration (use environment variables in production)
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

class MarketingAutomationService {
  constructor() {
    this.isRunning = false;
    this.jobs = new Map();
  }

  // Start the automation service
  start() {
    if (this.isRunning) {
      console.log('Marketing automation service is already running');
      return;
    }

    console.log('Starting marketing automation service...');
    this.isRunning = true;

    // Schedule daily automation check at 9 AM
    this.jobs.set('daily-check', cron.schedule('0 9 * * *', async () => {
      await this.runDailyAutomations();
    }, {
      scheduled: false
    }));

    // Schedule birthday check at 8 AM
    this.jobs.set('birthday-check', cron.schedule('0 8 * * *', async () => {
      await this.processBirthdayReminders();
    }, {
      scheduled: false
    }));

    // Schedule inactivity check weekly on Mondays at 10 AM
    this.jobs.set('inactivity-check', cron.schedule('0 10 * * 1', async () => {
      await this.processInactivityReminders();
    }, {
      scheduled: false
    }));

    // Schedule NPS check after appointments (runs hourly)
    this.jobs.set('nps-check', cron.schedule('0 * * * *', async () => {
      await this.processNPSAutomation();
    }, {
      scheduled: false
    }));

    // Start all scheduled jobs
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`✓ Scheduled job: ${name}`);
    });

    console.log('✅ Marketing automation service started successfully');
  }

  // Stop the automation service
  stop() {
    if (!this.isRunning) {
      console.log('Marketing automation service is not running');
      return;
    }

    console.log('Stopping marketing automation service...');
    
    // Destroy all scheduled jobs
    this.jobs.forEach((job, name) => {
      job.destroy();
      console.log(`✗ Stopped job: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;
    
    console.log('✅ Marketing automation service stopped');
  }

  // Get service status
  getStatus() {
    return {
      running: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      totalJobs: this.jobs.size
    };
  }

  // Run all daily automations
  async runDailyAutomations() {
    console.log('🚀 Running daily marketing automations...');
    
    try {
      // Get all enabled automations
      const automations = await prisma.marketingAutomation.findMany({
        where: { enabled: true }
      });

      for (const automation of automations) {
        await this.processAutomation(automation);
      }

      console.log('✅ Daily marketing automations completed');
    } catch (error) {
      console.error('❌ Error running daily automations:', error);
    }
  }

  // Process a specific automation
  async processAutomation(automation) {
    console.log(`📧 Processing ${automation.type} automation: ${automation.name}`);

    try {
      switch (automation.type) {
        case 'BIRTHDAY':
          await this.processBirthdayReminders();
          break;
        case 'INACTIVITY_REMINDER':
          await this.processInactivityReminders();
          break;
        case 'NPS':
          await this.processNPSAutomation();
          break;
        case 'APPOINTMENT_REMINDER':
          await this.processAppointmentReminders();
          break;
        case 'FOLLOW_UP':
          await this.processFollowUpReminders();
          break;
        default:
          console.log(`⚠️ Unknown automation type: ${automation.type}`);
      }

      // Update last run timestamp
      await prisma.marketingAutomation.update({
        where: { id: automation.id },
        data: { lastRun: new Date() }
      });

    } catch (error) {
      console.error(`❌ Error processing automation ${automation.name}:`, error);
    }
  }

  // Process birthday reminders
  async processBirthdayReminders() {
    console.log('🎂 Processing birthday reminders...');

    try {
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDate = today.getDate();

      // Find patients with birthdays today
      const birthdayPatients = await prisma.patient.findMany({
        where: {
          birthDate: {
            not: null
          },
          status: 'Active',
          whatsappConsent: 'opt_in',
        }
      });

      const todayBirthdays = birthdayPatients.filter(patient => {
        if (!patient.birthDate) return false;
        const birthDate = new Date(patient.birthDate);
        return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDate;
      });

      console.log(`🎉 Found ${todayBirthdays.length} birthday(s) today`);

      // Get birthday automation template
      const birthdayAutomation = await prisma.marketingAutomation.findFirst({
        where: { type: 'BIRTHDAY', enabled: true }
      });

      if (!birthdayAutomation) {
        console.log('⚠️ No birthday automation template found');
        return;
      }

      // Send birthday messages
      for (const patient of todayBirthdays) {
        await this.sendBirthdayMessage(patient, birthdayAutomation.templateMessage);
      }

    } catch (error) {
      console.error('❌ Error processing birthday reminders:', error);
    }
  }

  // Process inactivity reminders
  async processInactivityReminders() {
    console.log('😴 Processing inactivity reminders...');

    try {
      // Get inactivity automation settings
      const inactivityAutomation = await prisma.marketingAutomation.findFirst({
        where: { type: 'INACTIVITY_REMINDER', enabled: true }
      });

      if (!inactivityAutomation) {
        console.log('⚠️ No inactivity automation found');
        return;
      }

      const trigger = inactivityAutomation.trigger || { days_inactive: 90 };
      const daysInactive = trigger.days_inactive || 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      // Find inactive patients
      const inactivePatients = await prisma.patient.findMany({
        where: {
          status: 'Active',
          whatsappConsent: 'opt_in',
          OR: [
            { lastVisit: { lt: cutoffDate } },
            { lastVisit: null, createdAt: { lt: cutoffDate } }
          ]
        },
        include: {
          appointments: {
            where: { status: 'Realizado' },
            orderBy: { startTime: 'desc' },
            take: 1
          }
        }
      });

      console.log(`😪 Found ${inactivePatients.length} inactive patient(s)`);

      // Send inactivity reminders
      for (const patient of inactivePatients) {
        await this.sendInactivityReminder(patient, inactivityAutomation.templateMessage);
      }

    } catch (error) {
      console.error('❌ Error processing inactivity reminders:', error);
    }
  }

  // Process NPS automation
  async processNPSAutomation() {
    console.log('⭐ Processing NPS automation...');

    try {
      // Get NPS automation settings
      const npsAutomation = await prisma.marketingAutomation.findFirst({
        where: { type: 'NPS', enabled: true }
      });

      if (!npsAutomation) {
        console.log('⚠️ No NPS automation found');
        return;
      }

      const trigger = npsAutomation.trigger || { session_count: 5 };
      const targetSessionCount = trigger.session_count || 5;

      // Find patients who have completed the target number of sessions
      const eligiblePatients = await prisma.patient.findMany({
        where: {
          status: 'Active',
          whatsappConsent: 'opt_in',
          appointments: {
            some: {
              status: 'Realizado'
            }
          }
        },
        include: {
          appointments: {
            where: { status: 'Realizado' },
            orderBy: { startTime: 'desc' }
          }
        }
      });

      const npsEligible = eligiblePatients.filter(patient => {
        const completedSessions = patient.appointments.length;
        return completedSessions === targetSessionCount;
      });

      console.log(`📊 Found ${npsEligible.length} patient(s) eligible for NPS`);

      // Send NPS surveys
      for (const patient of npsEligible) {
        await this.sendNPSSurvey(patient, npsAutomation.templateMessage);
      }

    } catch (error) {
      console.error('❌ Error processing NPS automation:', error);
    }
  }

  // Process appointment reminders
  async processAppointmentReminders() {
    console.log('📅 Processing appointment reminders...');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Find appointments for tomorrow
      const tomorrowAppointments = await prisma.appointment.findMany({
        where: {
          startTime: {
            gte: tomorrow,
            lt: dayAfterTomorrow
          },
          status: 'Agendado'
        },
        include: {
          patient: true
        }
      });

      console.log(`📋 Found ${tomorrowAppointments.length} appointment(s) for tomorrow`);

      // Get reminder template
      const reminderAutomation = await prisma.marketingAutomation.findFirst({
        where: { type: 'APPOINTMENT_REMINDER', enabled: true }
      });

      if (!reminderAutomation) {
        console.log('⚠️ No appointment reminder automation found');
        return;
      }

      // Send reminders
      for (const appointment of tomorrowAppointments) {
        if (appointment.patient.whatsappConsent === 'opt_in') {
          await this.sendAppointmentReminder(appointment, reminderAutomation.templateMessage);
        }
      }

    } catch (error) {
      console.error('❌ Error processing appointment reminders:', error);
    }
  }

  // Process follow-up reminders
  async processFollowUpReminders() {
    console.log('🔄 Processing follow-up reminders...');
    
    // Implementation for follow-up reminders
    // This would check for patients who need follow-up care
    console.log('✅ Follow-up reminders processed');
  }

  // Send birthday message
  async sendBirthdayMessage(patient, template) {
    console.log(`🎂 Sending birthday message to ${patient.name}`);

    const message = template
      .replace('{patient_name}', patient.name)
      .replace('{clinic_name}', 'FisioFlow');

    // Here you would integrate with your messaging service (WhatsApp, SMS, email)
    // For now, we'll just log the message
    console.log(`📧 Birthday message: ${message}`);
  }

  // Send inactivity reminder
  async sendInactivityReminder(patient, template) {
    console.log(`😴 Sending inactivity reminder to ${patient.name}`);

    const message = template
      .replace('{patient_name}', patient.name)
      .replace('{clinic_name}', 'FisioFlow');

    console.log(`📧 Inactivity reminder: ${message}`);
  }

  // Send NPS survey
  async sendNPSSurvey(patient, template) {
    console.log(`⭐ Sending NPS survey to ${patient.name}`);

    const message = template
      .replace('{patient_name}', patient.name)
      .replace('{clinic_name}', 'FisioFlow');

    console.log(`📊 NPS survey: ${message}`);
  }

  // Send appointment reminder
  async sendAppointmentReminder(appointment, template) {
    console.log(`📅 Sending appointment reminder to ${appointment.patient.name}`);

    const appointmentDate = new Date(appointment.startTime).toLocaleDateString('pt-BR');
    const appointmentTime = new Date(appointment.startTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = template
      .replace('{patient_name}', appointment.patient.name)
      .replace('{appointment_date}', appointmentDate)
      .replace('{appointment_time}', appointmentTime)
      .replace('{clinic_name}', 'FisioFlow');

    console.log(`📅 Appointment reminder: ${message}`);
  }
}

// Create and export the service instance
const marketingAutomationService = new MarketingAutomationService();

// Handle process signals for graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  marketingAutomationService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  marketingAutomationService.stop();
  process.exit(0);
});

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'start':
      marketingAutomationService.start();
      // Keep the process running
      process.stdin.resume();
      break;
      
    case 'stop':
      marketingAutomationService.stop();
      break;
      
    case 'status':
      const status = marketingAutomationService.getStatus();
      console.log('📊 Marketing Automation Status:');
      console.log(`   Running: ${status.running ? '✅ Yes' : '❌ No'}`);
      console.log(`   Active Jobs: ${status.totalJobs}`);
      if (status.activeJobs.length > 0) {
        console.log(`   Jobs: ${status.activeJobs.join(', ')}`);
      }
      break;
      
    case 'test':
      console.log('🧪 Running test automation...');
      marketingAutomationService.runDailyAutomations().then(() => {
        console.log('✅ Test completed');
        process.exit(0);
      }).catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
      });
      break;
      
    default:
      console.log('Usage: node marketing-automation.js [start|stop|status|test]');
      process.exit(1);
  }
}

module.exports = marketingAutomationService;