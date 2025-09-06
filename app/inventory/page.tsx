'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';
import { inventoryService } from '@/services/inventoryService';
import { InventoryItem, Supplier, InventoryCategory } from '@/types';
import ItemFormModal from '@/components/inventory/ItemFormModal';
import ItemCard from '@/components/inventory/ItemCard';
import { useToast } from '@/hooks/use-toast';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const [itemsData, suppliersData, categoriesData] = await Promise.all([
        inventoryService.getItems(),
        inventoryService.getSuppliers(),
        inventoryService.getCategories()
      ]);
      setItems(itemsData);
      setSuppliers(suppliersData);
      setCategories(categoriesData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do estoque',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (itemData: Partial<InventoryItem>) => {
    try {
      if (editingItem) {
        await inventoryService.updateItem(editingItem.id, itemData);
        toast({
          title: 'Sucesso',
          description: 'Item atualizado com sucesso',
        });
      } else {
        await inventoryService.createItem(itemData as Omit<InventoryItem, 'id'>);
        toast({
          title: 'Sucesso',
          description: 'Item adicionado com sucesso',
        });
      }
      loadItems();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar item',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await inventoryService.deleteItem(id);
      toast({
        title: 'Sucesso',
        description: 'Item removido com sucesso',
      });
      loadItems();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao remover item',
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = items.filter(item => item.quantity <= item.minQuantity);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Estoque</h1>
          <p className="text-muted-foreground">Gerencie o inventário da clínica</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      {/* Alertas de estoque baixo */}
      {lowStockItems.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alertas de Estoque
            </CardTitle>
            <CardDescription className="text-orange-700">
              {lowStockItems.length} item(ns) com estoque baixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <Badge key={item.id} variant="outline" className="text-orange-800 border-orange-300">
                  {item.name} ({item.quantity} restante(s))
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(items.map(item => item.category)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por nome ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de itens */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando itens...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              suppliers={suppliers}
              categories={categories}
              onEdit={() => {
                setEditingItem(item);
                setIsModalOpen(true);
              }}
              onAddStock={() => {
                // TODO: Implementar modal de entrada de estoque
                console.log('Add stock for', item.name);
              }}
              onRemoveStock={() => {
                // TODO: Implementar modal de saída de estoque
                console.log('Remove stock for', item.name);
              }}
            />
          ))}
        </div>
      )}

      {/* Modal de formulário */}
      <ItemFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        itemToEdit={editingItem || undefined}
        suppliers={suppliers}
        categories={categories}
      />
    </div>
  );
}