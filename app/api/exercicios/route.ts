// app/api/exercicios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET - List exercises with search and filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const bodyPart = searchParams.get('bodyPart') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const equipment = searchParams.get('equipment') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {
      status: 'approved' // Only show approved exercises
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { subcategory: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (bodyPart && bodyPart !== 'all') {
      where.bodyParts = {
        has: bodyPart
      };
    }

    if (difficulty && difficulty !== 'all') {
      where.difficulty = parseInt(difficulty);
    }

    if (equipment && equipment !== 'all') {
      where.equipment = {
        has: equipment
      };
    }

    // Count total exercises for pagination
    const totalExercises = await prisma.exercise.count({ where });

    // Fetch exercises
    const exercises = await prisma.exercise.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        subcategory: true,
        bodyParts: true,
        difficulty: true,
        equipment: true,
        instructions: true,
        videoUrl: true,
        thumbnailUrl: true,
        duration: true,
        indications: true,
        contraindications: true,
        modifications: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    // Get categories and equipment for filters
    const categories = await prisma.exercise.groupBy({
      by: ['category'],
      where: { status: 'approved' },
      _count: {
        category: true
      }
    });

    const allEquipment = await prisma.exercise.findMany({
      where: { status: 'approved' },
      select: { equipment: true }
    });

    // Flatten equipment arrays and count occurrences
    const equipmentCount = allEquipment
      .flatMap(ex => ex.equipment)
      .reduce((acc, eq) => {
        acc[eq] = (acc[eq] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const equipmentList = Object.entries(equipmentCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Get body parts
    const allBodyParts = await prisma.exercise.findMany({
      where: { status: 'approved' },
      select: { bodyParts: true }
    });

    const bodyPartsCount = allBodyParts
      .flatMap(ex => ex.bodyParts)
      .reduce((acc, bp) => {
        acc[bp] = (acc[bp] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const bodyPartsList = Object.entries(bodyPartsCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      exercises,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalExercises / limit),
        totalExercises,
        hasNext: page < Math.ceil(totalExercises / limit),
        hasPrev: page > 1
      },
      filters: {
        categories: categories.map(c => ({
          name: c.category,
          count: c._count.category
        })),
        equipment: equipmentList,
        bodyParts: bodyPartsList,
        difficulties: [
          { level: 1, name: 'Iniciante', count: 0 },
          { level: 2, name: 'Intermediário', count: 0 },
          { level: 3, name: 'Avançado', count: 0 },
          { level: 4, name: 'Expert', count: 0 },
          { level: 5, name: 'Profissional', count: 0 }
        ]
      },
      summary: {
        total: totalExercises,
        byDifficulty: {
          1: exercises.filter(e => e.difficulty === 1).length,
          2: exercises.filter(e => e.difficulty === 2).length,
          3: exercises.filter(e => e.difficulty === 3).length,
          4: exercises.filter(e => e.difficulty === 4).length,
          5: exercises.filter(e => e.difficulty === 5).length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

// POST - Create new exercise
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      description,
      category,
      subcategory,
      bodyParts,
      difficulty,
      equipment,
      instructions,
      videoUrl,
      thumbnailUrl,
      duration,
      indications,
      contraindications,
      modifications,
      authorId
    } = body;

    // Validate required fields
    if (!name || !category || !bodyParts || difficulty === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, category, bodyParts, difficulty' },
        { status: 400 }
      );
    }

    // Validate difficulty range
    if (difficulty < 1 || difficulty > 5) {
      return NextResponse.json(
        { error: 'Dificuldade deve ser entre 1 e 5' },
        { status: 400 }
      );
    }

    // Create new exercise
    const newExercise = await prisma.exercise.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category.trim(),
        subcategory: subcategory?.trim() || null,
        bodyParts: Array.isArray(bodyParts) ? bodyParts : [bodyParts],
        difficulty: parseInt(difficulty),
        equipment: Array.isArray(equipment) ? equipment : (equipment ? [equipment] : []),
        instructions: Array.isArray(instructions) ? instructions : (instructions ? [instructions] : []),
        videoUrl: videoUrl?.trim() || null,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        duration: duration ? parseInt(duration) : null,
        indications: Array.isArray(indications) ? indications : (indications ? [indications] : []),
        contraindications: Array.isArray(contraindications) ? contraindications : (contraindications ? [contraindications] : []),
        modifications: modifications || null,
        authorId: authorId || null,
        status: 'pending_approval' // New exercises need approval
      }
    });

    return NextResponse.json({
      message: 'Exercício criado com sucesso',
      exercise: newExercise
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json(
      { error: 'Erro ao criar exercício' },
      { status: 500 }
    );
  }
}