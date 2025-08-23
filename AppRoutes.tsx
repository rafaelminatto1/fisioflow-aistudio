
import React, { lazy, Suspense } from 'react';
import * as ReactRouterDOM from 'react-router-dom';

// Layouts and Guards should be loaded statically
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PatientPortalLayout from './layouts/PatientPortalLayout';
import PartnerLayout from './layouts/PartnerLayout';
import PageLoader from './components/ui/PageLoader'; // Loading fallback

import { Role } from './types';

// Lazy-load all page components
const LoginPage = lazy(() => import('/pages/LoginPage.tsx'));
const DashboardPage = lazy(() => import('/pages/DashboardPage.tsx'));
const PatientListPage = lazy(() => import('/pages/PatientListPage.tsx'));
const PatientDetailPage = lazy(() => import('/pages/PatientDetailPage.tsx'));
const AgendaPage = lazy(() => import('/pages/AgendaPage.tsx'));
const ReportsPage = lazy(() => import('/pages/ReportsPage.tsx'));
const AuditLogPage = lazy(() => import('/pages/AuditLogPage.tsx'));
const SettingsPage = lazy(() => import('/pages/SettingsPage.tsx'));
const KnowledgeBasePage = lazy(() => import('/pages/KnowledgeBasePage.tsx'));
const EvaluationReportPage = lazy(() => import('/pages/EvaluationReportPage.tsx'));
const SessionEvolutionPage = lazy(() => import('/pages/SessionEvolutionPage.tsx'));
const HepGeneratorPage = lazy(() => import('/pages/HepGeneratorPage.tsx'));
const RiskAnalysisPage = lazy(() => import('/pages/RiskAnalysisPage.tsx'));
const ExerciseLibraryPage = lazy(() => import('/pages/ExerciseLibraryPage.tsx'));
const GroupsPage = lazy(() => import('/pages/GroupsPage.tsx'));
const InactivePatientEmailPage = lazy(() => import('/pages/InactivePatientEmailPage.tsx'));
const ClinicalLibraryPage = lazy(() => import('/pages/ClinicalLibraryPage.tsx'));
const MaterialDetailPage = lazy(() => import('/pages/MaterialDetailPage.tsx'));
const SpecialtyAssessmentsPage = lazy(() => import('/pages/SpecialtyAssessmentsPage.tsx'));
const EconomicPage = lazy(() => import('/pages/EconomicPage.tsx'));
const ClinicalAnalyticsPage = lazy(() => import('/pages/ClinicalAnalyticsPage.tsx'));
const FinancialDashboardPage = lazy(() => import('/pages/FinancialDashboardPage.tsx'));
const SubscriptionPage = lazy(() => import('/pages/SubscriptionPage.tsx'));
const LegalPage = lazy(() => import('/pages/LegalPage.tsx'));
const AiSettingsPage = lazy(() => import('/pages/AiSettingsPage.tsx'));
const KanbanPage = lazy(() => import('/pages/KanbanPage.tsx'));
const NotificationCenterPage = lazy(() => import('/pages/NotificationCenterPage.tsx'));
const AtendimentoPage = lazy(() => import('/pages/AtendimentoPage.tsx'));
const AgendaSettingsPage = lazy(() => import('/pages/AgendaSettingsPage.tsx'));
const MedicalReportPage = lazy(() => import('/pages/MedicalReportPage.tsx'));
const MentoriaPage = lazy(() => import('/pages/MentoriaPage.tsx'));
const WhatsAppPage = lazy(() => import('/pages/WhatsAppPage.tsx'));
const PartnershipPage = lazy(() => import('/pages/PartnershipPage.tsx'));
const AcompanhamentoPage = lazy(() => import('/pages/AcompanhamentoPage.tsx'));
const InventoryDashboardPage = lazy(() => import('/pages/InventoryDashboardPage.tsx'));
const EventsListPage = lazy(() => import('/pages/EventsListPage.tsx'));
const EventDetailPage = lazy(() => import('/pages/EventDetailPage.tsx'));

// Patient Portal Imports
const PatientDashboardPage = lazy(() => import('/pages/patient-portal/PatientDashboardPage.tsx'));
const PatientPainDiaryPage = lazy(() => import('/pages/patient-portal/PatientPainDiaryPage.tsx'));
const PatientProgressPage = lazy(() => import('/pages/patient-portal/PatientProgressPage.tsx'));
const VoucherStorePage = lazy(() => import('/pages/patient-portal/VoucherStorePage.tsx'));
const MyVouchersPage = lazy(() => import('/pages/patient-portal/MyVouchersPage.tsx'));
const GamificationPage = lazy(() => import('/pages/patient-portal/GamificationPage.tsx'));
const MyAppointmentsPage = lazy(() => import('/pages/patient-portal/MyAppointmentsPage.tsx'));
const DocumentsPage = lazy(() => import('/pages/patient-portal/DocumentsPage.tsx'));
const MyExercisesPage = lazy(() => import('/pages/patient-portal/MyExercisesPage.tsx'));


// Partner Portal Imports
const EducatorDashboardPage = lazy(() => import('/pages/partner-portal/EducatorDashboardPage.tsx'));
const ClientListPage = lazy(() => import('/pages/partner-portal/ClientListPage.tsx'));
const ClientDetailPage = lazy(() => import('/pages/partner-portal/ClientDetailPage.tsx'));
const PartnerExerciseLibraryPage = lazy(() => import('/pages/partner-portal/PartnerExerciseLibraryPage.tsx'));
const FinancialsPage = lazy(() => import('/pages/partner-portal/FinancialsPage.tsx'));

export const AppRoutes: React.FC = () => {
    return (
        <Suspense fallback={<PageLoader />}>
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
                      </ReactRouterDOM.Routes>
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
            </ReactRouterDOM.Routes>
        </Suspense>
    );
};
