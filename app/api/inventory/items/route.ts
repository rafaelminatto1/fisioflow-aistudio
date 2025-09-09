import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
    const expiringSoon = searchParams.get('expiringSoon') === 'true';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (lowStockOnly) {
      where.quantity = { lte: prisma.inventoryItem.fields.minStockLevel };
    }

    if (expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      where.expiryDate = {
        not: null,
        lte: thirtyDaysFromNow,
      };
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          movements: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              user: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar itens do estoque' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      quantity,
      minStockLevel,
      maxStockLevel,
      unit,
      unitCost,
      location,
      expiryDate,
    } = body;

    // Validate required fields
    if (!name || quantity === undefined || minStockLevel === undefined || !unit) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, quantity, minStockLevel, unit' },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        description: description || null,
        quantity: parseInt(quantity),
        minStockLevel: parseInt(minStockLevel),
        maxStockLevel: maxStockLevel ? parseInt(maxStockLevel) : null,
        unit,
        unitCost: unitCost ? parseFloat(unitCost) : null,
        location: location || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      { error: 'Erro ao criar item do estoque' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      quantity,
      minStockLevel,
      maxStockLevel,
      unit,
      unitCost,
      location,
      expiryDate,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do item é obrigatório' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (minStockLevel !== undefined) updateData.minStockLevel = parseInt(minStockLevel);
    if (maxStockLevel !== undefined) updateData.maxStockLevel = maxStockLevel ? parseInt(maxStockLevel) : null;
    if (unit) updateData.unit = unit;
    if (unitCost !== undefined) updateData.unitCost = unitCost ? parseFloat(unitCost) : null;
    if (location !== undefined) updateData.location = location || null;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar item do estoque' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do item é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.inventoryItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Item deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar item do estoque' },
      { status: 500 }
    );
  }
}