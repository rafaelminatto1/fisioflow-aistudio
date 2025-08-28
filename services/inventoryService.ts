// services/inventoryService.ts
import {
  InventoryItem,
  Supplier,
  InventoryCategory,
  StockMovement,
  MovementType,
  ItemStatus,
  InventoryMetrics,
  InventoryAlertType,
  InventoryAlert,
} from '../types';
import {
  mockInventoryItems,
  mockSuppliers,
  mockInventoryCategories,
  mockStockMovements,
  mockUsers,
} from '../data/mockData';

let items: InventoryItem[] = [...mockInventoryItems];
let suppliers: Supplier[] = [...mockSuppliers];
let categories: InventoryCategory[] = [...mockInventoryCategories];
let movements: StockMovement[] = [...mockStockMovements];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getItems = async (): Promise<InventoryItem[]> => {
  await delay(300);
  return [...items];
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  await delay(100);
  return [...suppliers];
};

export const getCategories = async (): Promise<InventoryCategory[]> => {
  await delay(100);
  return [...categories];
};

export const saveItem = async (
  itemData: Omit<InventoryItem, 'id'> & { id?: string }
): Promise<InventoryItem> => {
  await delay(400);
  if (itemData.id) {
    // Update
    const index = items.findIndex(i => i.id === itemData.id);
    if (index > -1) {
      items[index] = { ...items[index], ...itemData };
      return items[index];
    }
    throw new Error('Item not found');
  } else {
    // Create
    const newItem: InventoryItem = {
      ...itemData,
      id: `item-${Date.now()}`,
    };
    items.unshift(newItem);
    return newItem;
  }
};

export const addStockMovement = async (
  itemId: string,
  movementType: MovementType,
  quantity: number,
  reason: string
): Promise<InventoryItem> => {
  await delay(500);
  const itemIndex = items.findIndex(i => i.id === itemId);
  if (itemIndex === -1) throw new Error('Item not found');

  const item = items[itemIndex];
  const previousStock = item.currentStock;
  let newStock = previousStock;

  if (movementType === MovementType.In) {
    newStock += quantity;
  } else if (movementType === MovementType.Out) {
    newStock -= quantity;
    if (newStock < 0) throw new Error('Stock cannot be negative.');
  }

  item.currentStock = newStock;
  if (newStock === 0) {
    item.status = ItemStatus.OutOfStock;
  } else {
    item.status = ItemStatus.Active;
  }

  const newMovement: StockMovement = {
    id: `mov-${Date.now()}`,
    itemId,
    movementType,
    quantity,
    reason,
    userId: mockUsers[0].id, // Mock user
    createdAt: new Date().toISOString(),
  };
  movements.unshift(newMovement);

  return item;
};

const getDaysUntil = (dateString: string): number => {
  const expiryDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getDashboardMetrics = async (): Promise<InventoryMetrics> => {
  await delay(500);

  let totalValue = 0;
  let lowStockCount = 0;
  let expiringSoonCount = 0;
  const criticalAlerts: InventoryAlert[] = [];

  for (const item of items) {
    if (item.unitCost) {
      totalValue += item.currentStock * item.unitCost;
    }

    if (
      item.currentStock <= item.minStock &&
      item.status !== ItemStatus.Discontinued
    ) {
      lowStockCount++;
      criticalAlerts.push({
        id: `alert-low-${item.id}`,
        type:
          item.currentStock === 0
            ? InventoryAlertType.OutOfStock
            : InventoryAlertType.LowStock,
        itemId: item.id,
        itemName: item.name,
        message:
          item.currentStock === 0
            ? 'Item sem estoque!'
            : `Estoque baixo: ${item.currentStock}/${item.minStock}`,
        severity: item.currentStock === 0 ? 'critical' : 'high',
        createdAt: new Date().toISOString(),
      });
    }

    if (item.expiryDate) {
      const daysUntilExpiry = getDaysUntil(item.expiryDate);
      if (daysUntilExpiry <= 30) {
        expiringSoonCount++;
        if (daysUntilExpiry <= 7) {
          criticalAlerts.push({
            id: `alert-exp-${item.id}`,
            type:
              daysUntilExpiry < 0
                ? InventoryAlertType.Expired
                : InventoryAlertType.Expiring,
            itemId: item.id,
            itemName: item.name,
            message:
              daysUntilExpiry < 0
                ? 'Vencido!'
                : `Vence em ${daysUntilExpiry} dias.`,
            severity: daysUntilExpiry < 0 ? 'critical' : 'high',
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return {
    totalItems: items.length,
    lowStockItems: lowStockCount,
    expiringSoon: expiringSoonCount,
    totalValue,
    criticalAlerts: criticalAlerts.sort((a, b) =>
      b.severity === 'critical' ? 1 : -1
    ), // Prioritize critical
  };
};
