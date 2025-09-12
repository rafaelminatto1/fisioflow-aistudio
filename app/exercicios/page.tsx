'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { Search, Filter, Grid, List, Star, Play, Clock, User, BarChart3, TrendingUp, Heart } from 'lucide-react';
import { 
  getExerciseLibraryData, 
  searchExercises, 
  getExerciseStats,
  getRandomExercises 
} from '@/services/exerciseLibraryService';
import { ExerciseCategory, Protocol, Exercise } from '@/types';

interface ExerciseStats {
  totalExercises: number;
  categoriesCount: number;
  protocolsCount: number;
  byCategory: { category: string; count: number }[];
  byDifficulty: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

const ExerciseLibraryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Mock data baseado na imagem de referência
  const exercises: Exercise[] = [
    {
      id: '1',
      title: 'Clamshell',
      difficulty: 3,
      category: 'Strengthening',
      bodyPart: 'HIPS',
      thumbnail: '/api/placeholder/300/200',
      isFavorite: false
    },
    {
      id: '2',
      title: 'Knee Extension',
      difficulty: 2,
      category: 'Strengthening',
      bodyPart: 'KNEE',
      thumbnail: '/api/placeholder/300/200',
      isFavorite: true
    },
    {
      id: '3',
      title: 'Straight Leg Raise',
      difficulty: 2,
      category: 'Strengthening',
      bodyPart: 'KNEE',
      thumbnail: '/api/placeholder/300/200',
      isFavorite: false
    },
    {
      id: '4',
      title: 'Trunk Rotation',
      difficulty: 2,
      category: 'Mobility',
      bodyPart: 'BACK',
      thumbnail: '/api/placeholder/300/200',
      isFavorite: false
    },
    {
      id: '5',
      title: 'Shoulder Flexion',
      difficulty: 1,
      category: 'Mobility',
      bodyPart: 'SHOULDER',
      thumbnail: '/api/placeholder/300/200',
      isFavorite: false
    },
    {
      id: '6',
      title: 'Hamstring Stretch',
      difficulty: 3,
      category: 'Stretching',
      bodyPart: 'LEG',
      thumbnail: '/api/placeholder/300/200',
      isFavorite: true
    },
    {
      id: '7',
      title: 'Wrist Curl',
      difficulty: 3,
      category: 'Strengthening',
      bodyPart: 'WRIST',
      thumbnail: '/api/placeholder/300/200',
      isFavorite: false
    },
    {
      id: '8',
      title: 'Bridge',
      difficulty: 3,
      category: 'Strengthening',
      bodyPart: 'BACK',
      thumbnail: '/api/placeholder/300/200',
      isFavorite: false
    }
  ];

  const categories = ['All', 'Strengthening', 'Stretching', 'Mobility', 'Balance'];
  const bodyParts = ['All', 'HIPS', 'KNEE', 'BACK', 'SHOULDER', 'LEG', 'WRIST'];

  const getBodyPartColor = (bodyPart: string) => {
    const colors = {
      'HIPS': 'bg-pink-100 text-pink-800',
      'KNEE': 'bg-blue-100 text-blue-800',
      'BACK': 'bg-green-100 text-green-800',
      'SHOULDER': 'bg-purple-100 text-purple-800',
      'LEG': 'bg-yellow-100 text-yellow-800',
      'WRIST': 'bg-indigo-100 text-indigo-800'
    };
    return colors[bodyPart] || 'bg-gray-100 text-gray-800';
  };

  const renderStars = (difficulty: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= difficulty 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || 
      (selectedDifficulty === 'Easy' && exercise.difficulty === 1) ||
      (selectedDifficulty === 'Medium' && exercise.difficulty === 2) ||
      (selectedDifficulty === 'Hard' && exercise.difficulty === 3);
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

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
            <h1 className="text-3xl font-bold text-gray-900">Exercise Library</h1>
            <p className="text-gray-600 mt-1">25,000+ exercícios para fisioterapia</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={`p-2 transition-colors ${
                  view === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 transition-colors ${
                  view === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">Difficulty</option>
                <option value="Easy">Easy (⭐)</option>
                <option value="Medium">Medium (⭐⭐)</option>
                <option value="Hard">Hard (⭐⭐⭐)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Categories</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Exercise Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`grid gap-6 ${
            view === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
              : 'grid-cols-1'
          }`}
        >
          {filteredExercises.map((exercise, index) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-blue-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Play className="w-6 h-6 ml-1" />
                  </div>
                </div>
                <button
                  className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle favorite logic here
                  }}
                >
                  <Heart className={`w-4 h-4 ${exercise.isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {exercise.title}
                  </h3>
                  {renderStars(exercise.difficulty)}
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBodyPartColor(exercise.bodyPart)}`}>
                    {exercise.bodyPart}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center text-gray-600"
        >
          Mostrando {filteredExercises.length} de {exercises.length} exercícios
        </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ExerciseLibraryPage;