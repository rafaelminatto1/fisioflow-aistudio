// services/activityService.ts
import { RecentActivity } from '../types';
import { mockPatients } from '../data/mockData';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getRecentActivities = async (): Promise<RecentActivity[]> => {
  await delay(400);

  // Create activities from patient pain points
  const allPainPoints = mockPatients
    .flatMap(p => (p.pain_points || []).map(pp => ({ ...pp, patient: p })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activities: RecentActivity[] = allPainPoints.slice(0, 5).map(point => ({
    id: `act_pp_${point.id}`,
    type: 'pain_point',
    patientId: point.patient.id,
    patientName: point.patient.name,
    patientAvatarUrl: point.patient.avatarUrl,
    summary: `Registrou dor em uma área (nível ${point.intensity})`,
    timestamp: new Date(point.date),
  }));

  // Sort by most recent
  return activities.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
};
