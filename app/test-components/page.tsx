import React from 'react';
import ThemeShowcase from '@/components/design-system/ThemeShowcase';
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import EmptyState from '@/components/layout/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Layout, 
  Shield, 
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

/**
 * Página de teste para todos os componentes implementados
 * Permite verificar funcionalidade e responsividade
 */
export default function TestComponentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Teste de Componentes FisioFlow
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Página de teste para verificar todos os componentes implementados, 
            responsividade e funcionalidade do design system.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-therapy-green/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-therapy-green">
                <CheckCircle2 className="w-5 h-5" />
                Componentes Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Button, Input, Card, Badge, Avatar, Separator - Todos implementados
              </p>
            </CardContent>
          </Card>

          <Card className="border-therapy-blue/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-therapy-blue">
                <CheckCircle2 className="w-5 h-5" />
                Layouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                MainLayout, AuthLayout, EmptyState - Todos criados
              </p>
            </CardContent>
          </Card>

          <Card className="border-wellness-purple/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-wellness-purple">
                <CheckCircle2 className="w-5 h-5" />
                Tema Personalizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Paleta de cores da fisioterapia configurada
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Teste */}
        <Tabs defaultValue="showcase" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="showcase" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Design System</span>
            </TabsTrigger>
            <TabsTrigger value="main-layout" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              <span className="hidden sm:inline">Layout Principal</span>
            </TabsTrigger>
            <TabsTrigger value="auth-layout" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Layout Auth</span>
            </TabsTrigger>
            <TabsTrigger value="empty-state" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Estado Vazio</span>
            </TabsTrigger>
          </TabsList>

          {/* Design System Showcase */}
          <TabsContent value="showcase" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Design System Completo</CardTitle>
                <CardDescription>
                  Visualização de todos os componentes, cores e estilos implementados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeShowcase />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Main Layout Test */}
          <TabsContent value="main-layout" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Layout Principal</CardTitle>
                <CardDescription>
                  Layout responsivo com sidebar, header e área de conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <MainLayout>
                    <div className="p-6 space-y-4">
                      <h2 className="text-2xl font-bold">Conteúdo Principal</h2>
                      <p className="text-muted-foreground">
                        Este é o conteúdo que seria exibido dentro do layout principal.
                        O layout inclui sidebar responsiva, header com navegação e área de conteúdo.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Exemplo de Card</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              Conteúdo de exemplo dentro do layout principal.
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Outro Card</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              Mais conteúdo de exemplo para testar o layout.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </MainLayout>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auth Layout Test */}
          <TabsContent value="auth-layout" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Layout de Autenticação</CardTitle>
                <CardDescription>
                  Layout centrado para páginas de login, registro e recuperação de senha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                  <AuthLayout>
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-center">Login</h2>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Email</label>
                          <input 
                            type="email" 
                            className="w-full mt-1 px-3 py-2 border rounded-md" 
                            placeholder="seu@email.com"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Senha</label>
                          <input 
                            type="password" 
                            className="w-full mt-1 px-3 py-2 border rounded-md" 
                            placeholder="••••••••"
                          />
                        </div>
                        <Button className="w-full">Entrar</Button>
                      </div>
                    </div>
                  </AuthLayout>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Empty State Test */}
          <TabsContent value="empty-state" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estados Vazios</CardTitle>
                <CardDescription>
                  Componente para exibir estados vazios, erros e páginas não encontradas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Estado Vazio Padrão */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Estado Vazio - Sem Pacientes</h3>
                  <EmptyState
                    title="Nenhum paciente encontrado"
                    description="Você ainda não cadastrou nenhum paciente. Comece adicionando seu primeiro paciente."
                    primaryAction={{
                      label: "Adicionar Paciente",
                      onClick: () => alert("Redirecionando para cadastro...")
                    }}
                    secondaryAction={{
                      label: "Importar Dados",
                      onClick: () => alert("Abrindo importação...")
                    }}
                  />
                </div>

                {/* Estado de Erro */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Estado de Erro</h3>
                  <EmptyState
                    title="Erro ao carregar dados"
                    description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
                    primaryAction={{
                      label: "Tentar Novamente",
                      onClick: () => alert("Recarregando...")
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Teste de Responsividade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Teste de Responsividade
            </CardTitle>
            <CardDescription>
              Verifique como os componentes se comportam em diferentes tamanhos de tela
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Smartphone className="w-5 h-5 text-therapy-green" />
                <div>
                  <p className="font-medium">Mobile</p>
                  <p className="text-xs text-muted-foreground">< 768px</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Tablet className="w-5 h-5 text-therapy-blue" />
                <div>
                  <p className="font-medium">Tablet</p>
                  <p className="text-xs text-muted-foreground">768px - 1024px</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Monitor className="w-5 h-5 text-wellness-purple" />
                <div>
                  <p className="font-medium">Desktop</p>
                  <p className="text-xs text-muted-foreground">> 1024px</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Instruções:</strong> Redimensione a janela do navegador ou use as ferramentas 
                de desenvolvedor para testar a responsividade dos componentes em diferentes tamanhos de tela.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-muted-foreground">
            Todos os componentes da Fase 1 foram implementados com sucesso! ✅
          </p>
        </div>
      </div>
    </div>
  );
}