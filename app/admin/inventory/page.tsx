'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PackageIcon,
  AlertTriangleIcon,
  TrendingDownIcon,
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FilterIcon
} from 'lucide-react';
import { InventoryItem, InventoryLog } from '@/types';

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  expiringSoon: number;
  totalValue: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryLog[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    lowStockItems: 0,
    expiringSoon: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadInventoryData();
  }, [activeFilter]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        limit: '20',
        ...(activeFilter === 'lowStock' && { lowStockOnly: 'true' }),
        ...(activeFilter === 'expiring' && { expiringSoon: 'true' }),
        ...(searchQuery && { search: searchQuery }),
      });

      const [itemsResponse, movementsResponse] = await Promise.all([
        fetch(`/api/inventory/items?${params}`),
        fetch('/api/inventory/movements?limit=10'),
      ]);

      const itemsData = await itemsResponse.json();
      const movementsData = await movementsResponse.json();

      if (itemsData.items) {
        setItems(itemsData.items);
      }

      if (movementsData.movements) {
        setMovements(movementsData.movements);
      }

      // Calculate stats (in a real app, this could be a separate API endpoint)
      calculateStats(itemsData.items || []);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (items: InventoryItem[]) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.quantity <= item.minStockLevel).length;
    const expiringSoon = items.filter(item => 
      item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow
    ).length;
    const totalValue = items.reduce((sum, item) => 
      sum + (item.unitCost ? item.quantity * item.unitCost : 0), 0
    );

    setStats({
      totalItems,
      lowStockItems,
      expiringSoon,
      totalValue,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStockLevelColor = (item: InventoryItem) => {
    if (item.quantity <= item.minStockLevel) return 'text-red-600';
    if (item.quantity <= item.minStockLevel * 1.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockLevelBadge = (item: InventoryItem) => {
    if (item.quantity <= item.minStockLevel) {
      return <Badge variant="destructive">Baixo</Badge>;
    }
    if (item.quantity <= item.minStockLevel * 1.5) {
      return <Badge variant="secondary">Atenção</Badge>;
    }
    return <Badge variant="default">Normal</Badge>;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestão de Estoque"
        description="Controle de inventário, movimentações e alertas de estoque"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Itens cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencimento Próximo</CardTitle>
            <CalendarIcon className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">
              Próximos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingDownIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor do inventário
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList>
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar itens do estoque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadInventoryData()}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={activeFilter === 'lowStock' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('lowStock')}
              >
                <AlertTriangleIcon className="h-4 w-4 mr-1" />
                Baixo
              </Button>
              <Button
                variant={activeFilter === 'expiring' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('expiring')}
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                Vencimento
              </Button>
            </div>

            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </div>

          {/* Items Grid */}
          <div className="grid gap-6">
            {loading ? (
              <div className="text-center py-12">Carregando itens...</div>
            ) : items.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <PackageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum item encontrado</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery 
                      ? `Não encontramos itens que correspondam a "${searchQuery}"`
                      : "Comece adicionando itens ao seu inventário"
                    }
                  </p>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              items.map((item) => (
                <InventoryItemCard key={item.id} item={item} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Movimentações Recentes</h3>
            <Button variant="outline" size="sm">
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">Carregando movimentações...</div>
              ) : movements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <PackageIcon className="h-8 w-8 mx-auto mb-4" />
                  <p>Nenhuma movimentação registrada</p>
                </div>
              ) : (
                <div className="divide-y">
                  {movements.map((movement) => (
                    <MovementRow key={movement.id} movement={movement} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            <AlertsSection title="Estoque Baixo" items={items.filter(item => item.quantity <= item.minStockLevel)} type="low-stock" />
            <AlertsSection 
              title="Vencimento Próximo" 
              items={items.filter(item => {
                if (!item.expiryDate) return false;
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                return new Date(item.expiryDate) <= thirtyDaysFromNow;
              })} 
              type="expiring" 
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InventoryItemCard({ item }: { item: InventoryItem }) {
  const isExpiringSoon = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              {item.getStockLevelBadge && item.getStockLevelBadge(item)}
              {isExpiringSoon && <Badge variant="destructive">Vencendo</Badge>}
            </div>
            {item.description && (
              <CardDescription>{item.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Quantidade:</span>
            <div className={`font-bold ${item.getStockLevelColor && item.getStockLevelColor(item)}`}>
              {item.quantity} {item.unit}
            </div>
          </div>
          
          <div>
            <span className="text-muted-foreground">Mín/Máx:</span>
            <div className="font-medium">
              {item.minStockLevel}/{item.maxStockLevel || '∞'} {item.unit}
            </div>
          </div>
          
          {item.unitCost && (
            <div>
              <span className="text-muted-foreground">Custo Unit.:</span>
              <div className="font-medium">R$ {item.unitCost.toFixed(2)}</div>
            </div>
          )}
          
          {item.location && (
            <div>
              <span className="text-muted-foreground">Local:</span>
              <div className="font-medium">{item.location}</div>
            </div>
          )}
        </div>

        {item.expiryDate && (
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-amber-600" />
              <span className="text-sm">Vencimento: {new Date(item.expiryDate).toLocaleDateString('pt-BR')}</span>
            </div>
            {isExpiringSoon && (
              <Badge variant="destructive">Atenção</Badge>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" size="sm">
            <ArrowDownIcon className="h-4 w-4 mr-1" />
            Saída
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpIcon className="h-4 w-4 mr-1" />
            Entrada
          </Button>
          <Button variant="outline" size="sm">
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MovementRow({ movement }: { movement: InventoryLog }) {
  const isPositive = movement.change > 0;
  
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
          {isPositive ? 
            <ArrowUpIcon className="h-4 w-4 text-green-600" /> :
            <ArrowDownIcon className="h-4 w-4 text-red-600" />
          }
        </div>
        
        <div>
          <div className="font-medium">{movement.item?.name}</div>
          <div className="text-sm text-muted-foreground">{movement.reason}</div>
        </div>
      </div>
      
      <div className="text-right">
        <div className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{movement.change} {movement.item?.unit}
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
        </div>
        <div className="text-xs text-muted-foreground">
          por {movement.user?.name}
        </div>
      </div>
    </div>
  );
}

function AlertsSection({ 
  title, 
  items, 
  type 
}: { 
  title: string; 
  items: InventoryItem[]; 
  type: 'low-stock' | 'expiring';
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === 'low-stock' ? 
            <AlertTriangleIcon className="h-5 w-5 text-red-600" /> :
            <CalendarIcon className="h-5 w-5 text-amber-600" />
          }
          {title} ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground">Nenhum alerta no momento</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {type === 'low-stock' ? 
                      `Quantidade: ${item.quantity}/${item.minStockLevel} ${item.unit}` :
                      `Vencimento: ${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('pt-BR') : 'N/A'}`
                    }
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Resolver
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}