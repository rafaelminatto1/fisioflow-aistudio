// services/evaluationService.ts
import { ExerciseEvaluation } from '../types';

const EVALUATIONS_KEY = 'fisioflow_evaluations';

const getEvaluationsFromStorage = (): ExerciseEvaluation[] => {
  const data = sessionStorage.getItem(EVALUATIONS_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    // Dates are stored as strings, so we need to convert them back
    return parsed.map((e: any) => ({ ...e, date: new Date(e.date) }));
  }
  return [];
};

const saveEvaluationsToStorage = (evaluations: ExerciseEvaluation[]) => {
  sessionStorage.setItem(EVALUATIONS_KEY, JSON.stringify(evaluations));
};

export const getEvaluationsByPatientId = async (
  patientId: string
): Promise<ExerciseEvaluation[]> => {
  await new Promise(res => setTimeout(res, 200));
  const allEvals = getEvaluationsFromStorage();
  return allEvals.filter(e => e.patientId === patientId);
};

export const addEvaluation = async (
  data: Omit<ExerciseEvaluation, 'id' | 'date'>
): Promise<ExerciseEvaluation> => {
  await new Promise(res => setTimeout(res, 300));
  const allEvals = getEvaluationsFromStorage();
  const newEval: ExerciseEvaluation = {
    id: `eval_${Date.now()}`,
    date: new Date(),
    ...data,
  };

  // Replace existing evaluation for the same exercise on the same day, if any
  const todayStr = new Date().toDateString();
  const filteredEvals = allEvals.filter(
    e =>
      !(
        e.patientId === newEval.patientId &&
        e.exerciseId === newEval.exerciseId &&
        e.date.toDateString() === todayStr
      )
  );

  saveEvaluationsToStorage([...filteredEvals, newEval]);
  return newEval;
};
