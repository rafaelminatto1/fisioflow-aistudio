

import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientListPage from './pages/PatientListPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AgendaPage from './pages/AgendaPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogPage from './pages/AuditLogPage';
import SettingsPage from './pages/SettingsPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import EvaluationReportPage from './pages/EvaluationReportPage';
import SessionEvolutionPage from './pages/SessionEvolutionPage';
import HepGeneratorPage from './pages/HepGeneratorPage';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import { Role } from './types';
import ExerciseLibraryPage from './pages/ExerciseLibraryPage';
import GroupsPage from './pages/GroupsPage';
import InactivePatientEmailPage from './pages/InactivePatientEmailPage';
import ClinicalLibraryPage from './pages/ClinicalLibraryPage';
import MaterialDetailPage from './pages/MaterialDetailPage';
import SpecialtyAssessmentsPage from './pages/SpecialtyAssessmentsPage';
import EconomicPage from './pages/EconomicPage';
import ClinicalAnalyticsPage from './pages/ClinicalAnalyticsPage';
import FinancialDashboardPage from './pages/FinancialDashboardPage';
import SubscriptionPage from './pages/SubscriptionPage';
import LegalPage from './pages/LegalPage';
import AiSettingsPage from './pages/AiSettingsPage';
import KanbanPage from './pages/KanbanPage';
import NotificationCenterPage from './pages/NotificationCenterPage';
import AtendimentoPage from './pages/AtendimentoPage';
import AgendaSettingsPage from './pages/AgendaSettingsPage';
import MedicalReportPage from './pages/MedicalReportPage';
import MentoriaPage from './pages/MentoriaPage';
import WhatsAppPage from './pages/WhatsAppPage';
import PartnershipPage from './pages/PartnershipPage';
import AcompanhamentoPage from './pages/AcompanhamentoPage';
import InventoryDashboardPage from './pages/InventoryDashboardPage';
import EventsListPage from './pages/EventsListPage';
import EventDetailPage from './pages/EventDetailPage';
import TeleconsultaPage from './pages/TeleconsultaPage';

// Patient Portal Imports
import PatientPortalLayout from './layouts/PatientPortalLayout';
import PatientDashboardPage from './pages/patient-portal/PatientDashboardPage';
import PatientPainDiaryPage from './pages/patient-portal/PatientPainDiaryPage';
import PatientProgressPage from './pages/patient-portal/PatientProgressPage';
import VoucherStorePage from './pages/patient-portal/VoucherStorePage';
import MyVouchersPage from './pages/patient-portal/MyVouchersPage';
import GamificationPage from './pages/patient-portal/GamificationPage';
import MyAppointmentsPage from './pages/patient-portal/MyAppointmentsPage';
import DocumentsPage from './pages/patient-portal/DocumentsPage';
import MyExercisesPage from './pages/patient-portal/MyExercisesPage';


// Partner Portal Imports
import PartnerLayout from './layouts/PartnerLayout';
import EducatorDashboardPage from './pages/partner-portal/EducatorDashboardPage';
import ClientListPage from './pages/partner-portal/ClientListPage';
import ClientDetailPage from './pages/partner-portal/ClientDetailPage';
import PartnerExerciseLibraryPage from './pages/partner-portal/PartnerExerciseLibraryPage';
import FinancialsPage from './pages/partner-portal/FinancialsPage';

const AppRoutes: React.FC = () => {
    return (
        <ReactRouterDOM.Routes>
          <ReactRouterDOM.Route path="/login" element={<LoginPage />} />
          
           {/* Patient Portal Routes */}
           <ReactRouterDOM.Route 
            path="/portal/*"
            element={
              <ProtectedRoute allowedRoles={[Role.Patient]}>
                <PatientPortalLayout>
                   <ReactRouterDOM.Routes>
                      <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="/portal/dashboard" replace />} />
                      <ReactRouterDOM.Route path="/dashboard" element={<PatientDashboardPage />} />
                      <ReactRouterDOM.Route path="/meu-progresso" element={<PatientProgressPage />} />
                      <ReactRouterDOM.Route path="/my-exercises" element={<MyExercisesPage />} />
                      <ReactRouterDOM.Route path="/pain-diary" element={<PatientPainDiaryPage />} />
                      <ReactRouterDOM.Route path="/partner-services" element={<VoucherStorePage />} />
                      <ReactRouterDOM.Route path="/my-vouchers" element={<MyVouchersPage />} />
                      <ReactRouterDOM.Route path="/notifications" element={<NotificationCenterPage />} />
                      <ReactRouterDOM.Route path="/gamification" element={<GamificationPage />} />
                      <ReactRouterDOM.Route path="/appointments" element={<MyAppointmentsPage />} />
                      <ReactRouterDOM.Route path="/documents" element={<DocumentsPage />} />
                   </ReactRouterDOM.Routes>
                </PatientPortalLayout>
              </ProtectedRoute>
            } 
          />

          {/* Partner Portal Routes */}
           <ReactRouterDOM.Route 
            path="/partner/*"
            element={
              <ProtectedRoute allowedRoles={[Role.EducadorFisico]}>
                <PartnerLayout>
                   <ReactRouterDOM.Routes>
                      <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="/partner/dashboard" replace />} />
                      <ReactRouterDOM.Route path="/dashboard" element={<EducatorDashboardPage />} />
                      <ReactRouterDOM.Route path="/clients" element={<ClientListPage />} />
                      <ReactRouterDOM.Route path="/clients/:id" element={<ClientDetailPage />} />
                      <ReactRouterDOM.Route path="/exercises" element={<PartnerExerciseLibraryPage />} />
                      <ReactRouterDOM.Route path="/financials" element={<FinancialsPage />} />
                   </ReactRouterDOM.Routes>
                </PartnerLayout>
              </ProtectedRoute>
            }
          />

          {/* Therapist Portal Routes (Catch-all) */}
          <ReactRouterDOM.Route 
            path="/*"
            element={
              <ProtectedRoute allowedRoles={[Role.Therapist, Role.Admin]}>
                <MainLayout>
                  <ReactRouterDOM.Routes>
                    <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="/dashboard" replace />} />
                    <ReactRouterDOM.Route path="/dashboard" element={<DashboardPage />} />
                    <ReactRouterDOM.Route path="/clinical-analytics" element={<ClinicalAnalyticsPage />} />
                    <ReactRouterDOM.Route path="/financials" element={<FinancialDashboardPage />} />
                    <ReactRouterDOM.Route path="/patients" element={<PatientListPage />} />
                    <ReactRouterDOM.Route path="/patients/:id" element={<PatientDetailPage />} />
                    <ReactRouterDOM.Route path="/agenda" element={<AgendaPage />} />
                    <ReactRouterDOM.Route path="/events" element={<EventsListPage />} />
                    <ReactRouterDOM.Route path="/events/:id" element={<EventDetailPage />} />
                    <ReactRouterDOM.Route path="/acompanhamento" element={<AcompanhamentoPage />} />
                    <ReactRouterDOM.Route path="/notifications" element={<NotificationCenterPage />} />
                    <ReactRouterDOM.Route path="/whatsapp" element={<WhatsAppPage />} />
                    <ReactRouterDOM.Route path="/groups" element={<GroupsPage />} />
                    <ReactRouterDOM.Route path="/tasks" element={<KanbanPage />} />
                    <ReactRouterDOM.Route path="/avaliacoes" element={<SpecialtyAssessmentsPage />} />
                    <ReactRouterDOM.Route path="/exercises" element={<ExerciseLibraryPage />} />
                    <ReactRouterDOM.Route path="/materials" element={<ClinicalLibraryPage />} />
                    <ReactRouterDOM.Route path="/materials/:id" element={<MaterialDetailPage />} />
                    <ReactRouterDOM.Route path="/gerar-laudo" element={<EvaluationReportPage />} />
                    <ReactRouterDOM.Route path="/gerar-evolucao" element={<SessionEvolutionPage />} />
                    <ReactRouterDOM.Route path="/gerar-hep" element={<HepGeneratorPage />} />
                    <ReactRouterDOM.Route path="/analise-risco" element={<RiskAnalysisPage />} />
                    <ReactRouterDOM.Route path="/email-inativos" element={<InactivePatientEmailPage />} />
                    <ReactRouterDOM.Route path="/mentoria" element={<MentoriaPage />} />
                    <ReactRouterDOM.Route path="/partnerships" element={<PartnershipPage />} />
                    <ReactRouterDOM.Route path="/inventory" element={<InventoryDashboardPage />} />
                    <ReactRouterDOM.Route path="/medical-report/new/:patientId" element={<MedicalReportPage />} />
                    <ReactRouterDOM.Route path="/medical-report/edit/:reportId" element={<MedicalReportPage />} />
                    <ReactRouterDOM.Route path="/reports" element={<ReportsPage />} />
                    <ReactRouterDOM.Route path="/audit-log" element={<AuditLogPage />} />
                    <ReactRouterDOM.Route path="/settings" element={<SettingsPage />} />
                    <ReactRouterDOM.Route path="/subscription" element={<SubscriptionPage />} />
                    <ReactRouterDOM.Route path="/legal" element={<LegalPage />} />
                    <ReactRouterDOM.Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                    <ReactRouterDOM.Route path="/ia-economica" element={<EconomicPage />} />
                    <ReactRouterDOM.Route path="/ai-settings" element={<AiSettingsPage />} />
                    <ReactRouterDOM.Route path="/agenda-settings" element={<AgendaSettingsPage />} />
                    <ReactRouterDOM.Route path="/atendimento/:appointmentId" element={<AtendimentoPage />} />
                    <ReactRouterDOM.Route path="/teleconsulta/:appointmentId" element={<TeleconsultaPage />} />
                    <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/dashboard" replace />} />
                  </ReactRouterDOM.Routes>
                </MainLayout>
              </ProtectedRoute>
            } 
          />

        </ReactRouterDOM.Routes>
    );
};

export default AppRoutes;