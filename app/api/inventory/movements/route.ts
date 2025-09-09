import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const itemId = searchParams.get('itemId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (itemId) {
      where.itemId = itemId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [movements, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        include: {
          item: {
            select: { id: true, name: true, unit: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventoryLog.count({ where }),
    ]);

    return NextResponse.json({
      movements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar movimentações do estoque' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, change, reason, userId } = body;

    // Validate required fields
    if (!itemId || change === undefined || !reason || !userId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: itemId, change, reason, userId' },
        { status: 400 }
      );
    }

    // Start transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Get current item
      const item = await prisma.inventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new Error('Item não encontrado');
      }

      const changeAmount = parseInt(change);
      const newQuantity = item.quantity + changeAmount;

      // Validate that we don't go negative
      if (newQuantity < 0) {
        throw new Error('Quantidade insuficiente em estoque');
      }

      // Update item quantity
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity },
      });

      // Create movement log
      const movement = await prisma.inventoryLog.create({
        data: {
          itemId,
          change: changeAmount,
          reason,
          userId,
        },
        include: {
          item: {
            select: { id: true, name: true, unit: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Check for low stock alert
      if (newQuantity <= item.minStockLevel) {
        // Here you could trigger an alert/notification
        console.log(`⚠️ Low stock alert for item: ${item.name} (${newQuantity} ${item.unit} remaining)`);
      }

      return { movement, updatedItem };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory movement:', error);
    
    if (error instanceof Error && error.message === 'Item não encontrado') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error instanceof Error && error.message === 'Quantidade insuficiente em estoque') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Erro ao criar movimentação do estoque' },
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
        { error: 'ID da movimentação é obrigatório' },
        { status: 400 }
      );
    }

    // Note: Deleting movements should be done carefully as it affects inventory history
    // Consider implementing soft deletion or requiring admin privileges
    await prisma.inventoryLog.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Movimentação deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting inventory movement:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar movimentação do estoque' },
      { status: 500 }
    );
  }
}