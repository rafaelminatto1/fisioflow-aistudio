'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus,
  Search,
  User,
  Clock,
  RotateCcw,
  TrendingUp,
  Play,
  ChevronRight,
  Star,
  Dumbbell
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Sidebar from '../../components/layout/Sidebar';

interface Exercise {
  id: string;
  title: string;
  sets: string;
  reps: string;
  image: string;
  category: string;
}

interface Protocol {
  id: string;
  name: string;
  exercises: Exercise[];
  patient?: string;
  duration?: string;
}

const ExercisePrescriptionPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'build' | 'online' | 'templates'>('build');
  const [selectedPatient, setSelectedPatient] = useState('John Smith');
  
  // Exercícios disponíveis para arrastar
  const availableExercises: Exercise[] = [
    {
      id: 'ex1',
      title: 'Knee Extension',
      sets: '3 sets',
      reps: '15 reps',
      image: '/api/placeholder/100/80',
      category: 'knee'
    },
    {
      id: 'ex2',
      title: 'Clamshells',
      sets: '3 sets',
      reps: '10 reps',
      image: '/api/placeholder/100/80',
      category: 'hip'
    },
    {
      id: 'ex3',
      title: 'Straight Leg Raise',
      sets: '3 sets',
      reps: '8 reps',
      image: '/api/placeholder/100/80',
      category: 'knee'
    },
    {
      id: 'ex4',
      title: 'Shoulder Flexion',
      sets: '2 sets',
      reps: '15 reps',
      image: '/api/placeholder/100/80',
      category: 'shoulder'
    }
  ];

  // Protocolo sendo construído
  const [currentProtocol, setCurrentProtocol] = useState<Exercise[]>([]);

  // Templates de protocolo
  const protocolTemplates = [
    {
      id: 'template1',
      name: 'Low Back Pain',
      description: 'Comprehensive program for lower back rehabilitation',
      exercises: 8,
      duration: '6 weeks'
    },
    {
      id: 'template2', 
      name: 'Knee Osteoarthritis',
      description: 'Evidence-based protocol for knee joint health',
      exercises: 6,
      duration: '8 weeks'
    },
    {
      id: 'template3',
      name: 'Shoulder Impingement', 
      description: 'Targeted exercises for shoulder mobility and strength',
      exercises: 7,
      duration: '4 weeks'
    }
  ];

  // Progress tracking data
  const progressData = [
    { week: 'Week 1', week2: 'Week 2', week3: 'Week 3' }
  ];

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === 'available' && destination.droppableId === 'protocol') {
      const exercise = availableExercises.find(ex => ex.id === result.draggableId);
      if (exercise) {
        setCurrentProtocol(prev => [...prev, exercise]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <div className="p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exercise prescription</h1>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { id: 'build', label: 'Build Exercise' },
              { id: 'online', label: 'Online Exercise' },
              { id: 'templates', label: 'Protocol Templates' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {selectedTab === 'build' && (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Available Exercises */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Exercises</h3>
                    
                    <Droppable droppableId="available">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-3"
                        >
                          {availableExercises.map((exercise, index) => (
                            <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-move transition-transform ${
                                    snapshot.isDragging ? 'scale-105 shadow-lg' : ''
                                  }`}
                                >
                                  <div className="w-16 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md flex items-center justify-center">
                                    <Play className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{exercise.title}</h4>
                                    <p className="text-sm text-gray-600">{exercise.sets} • {exercise.reps}</p>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>

                {/* Protocol Builder */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Protocol Builder</h3>
                      <div className="flex items-center space-x-3">
                        <select 
                          value={selectedPatient}
                          onChange={(e) => setSelectedPatient(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="John Smith">John Smith</option>
                          <option value="Emma Johnson">Emma Johnson</option>
                          <option value="Michael Brown">Michael Brown</option>
                        </select>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Save Protocol
                        </button>
                      </div>
                    </div>

                    <Droppable droppableId="protocol">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="min-h-40 border-2 border-dashed border-gray-200 rounded-lg p-4"
                        >
                          {currentProtocol.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Dumbbell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                              <p>Drag exercises here to build your protocol</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {currentProtocol.map((exercise, index) => (
                                <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                                  <div className="w-16 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md flex items-center justify-center">
                                    <Play className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{exercise.title}</h4>
                                    <p className="text-sm text-gray-600">{exercise.sets} • {exercise.reps}</p>
                                  </div>
                                  <button className="text-red-500 hover:text-red-700">×</button>
                                </div>
                              ))}
                            </div>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              </div>
            </DragDropContext>
          )}

          {selectedTab === 'online' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Online Exercise Viewer */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Online Exercise</h3>
                  <select 
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="John Smith">John Smith</option>
                  </select>
                </div>

                <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-blue-600 mx-auto mb-2" />
                    <p className="text-blue-700 font-medium">Clamshells</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Sets</span>
                    <span className="font-medium">3 sets 10 reps</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">15 minutes</span>
                  </div>
                </div>
              </div>

              {/* Progress Tracking */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Tracking</h3>
                
                <div className="space-y-4">
                  {['Week 1', 'Week 2', 'Week 3'].map((week, index) => (
                    <div key={week} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{week}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${(index + 1) * 30}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{(index + 1) * 30}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {protocolTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <p className="text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{template.exercises} exercises</span>
                    <span className="text-gray-500">{template.duration}</span>
                  </div>
                  
                  <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Use Template
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExercisePrescriptionPage;