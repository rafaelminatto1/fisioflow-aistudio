// hooks/useAssessmentSpecialties.ts
import { useState, useEffect } from 'react';
import { Specialty } from '../types';
import { mockSpecialties } from '../data/mockSpecialtyAssessments';

const useAssessmentSpecialties = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSpecialties(mockSpecialties);
      setIsLoading(false);
    }, 500); // Simulate network delay

    return () => clearTimeout(timer);
  }, []);

  return { specialties, isLoading };
};

export default useAssessmentSpecialties;
