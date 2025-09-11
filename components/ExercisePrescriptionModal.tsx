'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus, Clock, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { Exercise } from '@/types';
import { searchExercises, getExerciseById } from '@/services/exerciseLibraryService';

interface ExercisePrescription {
  exerciseId: string;
  exercise?: Exercise;
  sets: number;
  reps: number;
  duration?: number; // in seconds
  rest?: number; // in seconds
  notes?: string;
  progression?: 'maintain' | 'increase' | 'decrease';
}

interface ExercisePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prescriptions: ExercisePrescription[]) => void;
  patientId?: string;
  initialPrescriptions?: ExercisePrescription[];
}

export function ExercisePrescriptionModal({
  isOpen,
  onClose,
  onSave,
  patientId,
  initialPrescriptions = []
}: ExercisePrescriptionModalProps) {
  const [prescriptions, setPrescriptions] = useState<ExercisePrescription[]>(initialPrescriptions);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedExercise(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const loadExerciseDetails = async () => {
      const updatedPrescriptions = await Promise.all(
        prescriptions.map(async (prescription) => {
          if (!prescription.exercise) {
            const exercise = await getExerciseById(prescription.exerciseId);
            return { ...prescription, exercise };
          }
          return prescription;
        })
      );
      setPrescriptions(updatedPrescriptions);
    };

    if (prescriptions.length > 0) {
      loadExerciseDetails();
    }
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchExercises(searchTerm);
        setSearchResults(results.slice(0, 10));
      } catch (error) {
        console.error('Error searching exercises:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const addExerciseToPrescription = (exercise: Exercise) => {
    const newPrescription: ExercisePrescription = {
      exerciseId: exercise.id,
      exercise,
      sets: 3,
      reps: 10,
      duration: 30,
      rest: 60,
      progression: 'maintain'
    };

    setPrescriptions([...prescriptions, newPrescription]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const updatePrescription = (index: number, updates: Partial<ExercisePrescription>) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], ...updates };
    setPrescriptions(updated);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(prescriptions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Prescrição de Exercícios
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Exercise Search */}
          <div className="w-1/3 border-r border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Adicionar Exercícios
            </h3>
            
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Buscar exercícios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((exercise) => (
                <div
                  key={exercise.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => addExerciseToPrescription(exercise)}
                >
                  <h4 className="font-medium text-sm text-gray-900 mb-1">
                    {exercise.name}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {exercise.category}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {exercise.bodyParts?.slice(0, 2).map((part, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prescription List */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Exercícios Prescritos ({prescriptions.length})
              </h3>
            </div>

            {prescriptions.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Nenhum exercício adicionado ainda.
                  <br />
                  Use a busca ao lado para adicionar exercícios.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {prescription.exercise?.name || 'Carregando...'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {prescription.exercise?.category}
                        </p>
                      </div>
                      <button
                        onClick={() => removePrescription(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Séries
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updatePrescription(index, { 
                              sets: Math.max(1, prescription.sets - 1) 
                            })}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {prescription.sets}
                          </span>
                          <button
                            onClick={() => updatePrescription(index, { 
                              sets: prescription.sets + 1 
                            })}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Repetições
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updatePrescription(index, { 
                              reps: Math.max(1, prescription.reps - 1) 
                            })}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {prescription.reps}
                          </span>
                          <button
                            onClick={() => updatePrescription(index, { 
                              reps: prescription.reps + 1 
                            })}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Duração (s)
                        </label>
                        <input
                          type="number"
                          value={prescription.duration || 30}
                          onChange={(e) => updatePrescription(index, { 
                            duration: parseInt(e.target.value) || 30 
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Descanso (s)
                        </label>
                        <input
                          type="number"
                          value={prescription.rest || 60}
                          onChange={(e) => updatePrescription(index, { 
                            rest: parseInt(e.target.value) || 60 
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Progressão
                      </label>
                      <select
                        value={prescription.progression}
                        onChange={(e) => updatePrescription(index, { 
                          progression: e.target.value as 'maintain' | 'increase' | 'decrease' 
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="maintain">Manter</option>
                        <option value="increase">Aumentar</option>
                        <option value="decrease">Diminuir</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Observações
                      </label>
                      <textarea
                        value={prescription.notes || ''}
                        onChange={(e) => updatePrescription(index, { notes: e.target.value })}
                        placeholder="Instruções específicas para este exercício..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4" />
            <span>{prescriptions.length} exercícios prescritos</span>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={prescriptions.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Salvar Prescrição
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}