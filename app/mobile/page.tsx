'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play,
  Home,
  Calendar,
  MessageSquare,
  FileText,
  Menu,
  Trophy,
  Star,
  Plus,
  Circle
} from 'lucide-react';

const MobilePatientApp: React.FC = () => {
  const [currentExercise, setCurrentExercise] = useState({
    name: 'Hip Abduction',
    currentRep: 2,
    totalReps: 10,
    points: 50,
    video: '/api/placeholder/400/300'
  });

  const [messages] = useState([
    {
      id: 1,
      sender: 'therapist',
      message: 'Hello! How is it going with the exercises?',
      time: '10:30',
      avatar: '/api/placeholder/40/40'
    }
  ]);

  const [activeTab, setActiveTab] = useState('exercise');

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Mobile Frame */}
      <div className="absolute inset-0 bg-black rounded-[2.5rem] p-2">
        <div className="bg-white rounded-[2rem] h-full overflow-hidden relative">
          
          {/* Status Bar */}
          <div className="flex justify-between items-center px-6 py-2 text-black">
            <span className="text-lg font-semibold">9:41</span>
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-1 h-3 bg-black rounded-full"></div>
                <div className="w-1 h-3 bg-black rounded-full"></div>
                <div className="w-1 h-3 bg-black rounded-full"></div>
                <div className="w-1 h-3 bg-gray-300 rounded-full"></div>
              </div>
              <div className="w-6 h-3 bg-black rounded-sm"></div>
            </div>
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-4 flex items-center justify-between"
          >
            <h1 className="text-2xl font-bold text-gray-900">Physiotherapy</h1>
            <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-700" />
            </div>
          </motion.div>

          {/* Exercise Content */}
          <div className="px-6 flex-1">
            {activeTab === 'exercise' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Exercise Title */}
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {currentExercise.name}
                  </h2>
                </div>

                {/* Video/Exercise Display */}
                <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Play className="w-8 h-8 text-gray-900 ml-1" />
                    </motion.button>
                  </div>
                  
                  {/* Exercise illustration placeholder */}
                  <div className="absolute bottom-4 right-4 bg-white/80 rounded-lg p-2">
                    <span className="text-xs font-medium text-gray-700">0:45</span>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-4">
                  {/* Rep Counter */}
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                      {String(currentExercise.currentRep).padStart(2, '0')} / {currentExercise.totalReps}
                    </div>
                    <p className="text-lg text-gray-600">Repetition</p>
                  </div>

                  {/* Points */}
                  <div className="flex items-center justify-center space-x-2">
                    <div className="relative">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-white fill-current" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-green-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                        +{currentExercise.points}
                      </div>
                    </div>
                  </div>

                  {/* Progress Circles */}
                  <div className="flex justify-center space-x-2">
                    {Array.from({ length: currentExercise.totalReps }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i < currentExercise.currentRep ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-gray-900">Chat</h2>
                
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">T</span>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-2xl rounded-tl-md p-3">
                          <p className="text-gray-900">{message.message}</p>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{message.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-3 mt-6">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-900"
                  />
                  <button className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
            <div className="flex items-center justify-around py-3">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'calendar', icon: Calendar, label: 'Schedule' },
                { id: 'exercise', icon: Play, label: 'Exercise', active: true },
                { id: 'chat', icon: MessageSquare, label: 'Chat' },
                { id: 'reports', icon: FileText, label: 'Reports' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                    tab.id === activeTab
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                >
                  <tab.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* Home Indicator */}
            <div className="flex justify-center pb-2">
              <div className="w-32 h-1 bg-black rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePatientApp;