'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Activity, 
  Users, 
  Calendar, 
  TrendingUp, 
  Award,
  Stethoscope,
  Brain
} from 'lucide-react';

/**
 * Componente de demonstração do Design System FisioFlow
 * Mostra todos os componentes e cores disponíveis
 */
const ThemeShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          FisioFlow Design System
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Sistema de design customizado para aplicações de fisioterapia, 
          baseado em Shadcn/UI com cores e componentes otimizados.
        </p>
      </div>

      {/* Paleta de Cores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-therapy-green" />
            Paleta de Cores da Fisioterapia
          </CardTitle>
          <CardDescription>
            Cores cuidadosamente selecionadas para transmitir confiança, saúde e bem-estar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Verde Fisioterapia */}
            <div className="space-y-2">
              <div className="w-full h-20 bg-therapy-green rounded-lg shadow-md"></div>
              <div className="text-center">
                <p className="font-semibold text-sm">Verde Fisioterapia</p>
                <p className="text-xs text-muted-foreground">therapy-green</p>
              </div>
            </div>

            {/* Azul Profissional */}
            <div className="space-y-2">
              <div className="w-full h-20 bg-therapy-blue rounded-lg shadow-md"></div>
              <div className="text-center">
                <p className="font-semibold text-sm">Azul Profissional</p>
                <p className="text-xs text-muted-foreground">therapy-blue</p>
              </div>
            </div>

            {/* Verde Menta */}
            <div className="space-y-2">
              <div className="w-full h-20 bg-therapy-mint rounded-lg shadow-md"></div>
              <div className="text-center">
                <p className="font-semibold text-sm">Verde Menta</p>
                <p className="text-xs text-muted-foreground">therapy-mint</p>
              </div>
            </div>

            {/* Roxo Bem-estar */}
            <div className="space-y-2">
              <div className="w-full h-20 bg-wellness-purple rounded-lg shadow-md"></div>
              <div className="text-center">
                <p className="font-semibold text-sm">Roxo Bem-estar</p>
                <p className="text-xs text-muted-foreground">wellness-purple</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componentes Base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-therapy-blue" />
            Componentes Base
          </CardTitle>
          <CardDescription>
            Componentes fundamentais do sistema baseados em Shadcn/UI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Botões</h3>
            <div className="flex flex-wrap gap-3">
              <Button>Primário</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="outline">Contorno</Button>
              <Button variant="ghost">Fantasma</Button>
              <Button variant="destructive">Destrutivo</Button>
            </div>
          </div>

          <Separator />

          {/* Badges */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Badges</h3>
            <div className="flex flex-wrap gap-3">
              <Badge>Padrão</Badge>
              <Badge variant="secondary">Secundário</Badge>
              <Badge variant="outline">Contorno</Badge>
              <Badge variant="destructive">Destrutivo</Badge>
            </div>
          </div>

          <Separator />

          {/* Inputs */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Campos de Entrada</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <Input placeholder="Nome do paciente" />
              <Input placeholder="Email" type="email" />
              <Input placeholder="Telefone" type="tel" />
              <Input placeholder="Data de nascimento" type="date" />
            </div>
          </div>

          <Separator />

          {/* Avatars */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Avatars</h3>
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src="/placeholder-avatar.jpg" alt="Paciente" />
                <AvatarFallback className="bg-therapy-green text-white">PA</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback className="bg-therapy-blue text-white">FT</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback className="bg-wellness-purple text-white">DR</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Exemplo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Pacientes */}
        <Card className="border-therapy-green/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-therapy-green">
              <Users className="w-5 h-5" />
              Pacientes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-therapy-green mb-2">127</div>
            <p className="text-sm text-muted-foreground">
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        {/* Card Consultas */}
        <Card className="border-therapy-blue/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-therapy-blue">
              <Calendar className="w-5 h-5" />
              Consultas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-therapy-blue mb-2">8</div>
            <p className="text-sm text-muted-foreground">
              3 consultas restantes
            </p>
          </CardContent>
        </Card>

        {/* Card Progresso */}
        <Card className="border-recovery-orange/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-recovery-orange">
              <TrendingUp className="w-5 h-5" />
              Taxa de Recuperação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-recovery-orange mb-2">94%</div>
            <p className="text-sm text-muted-foreground">
              Média dos últimos 6 meses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gradientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-therapy-green" />
            Gradientes Temáticos
          </CardTitle>
          <CardDescription>
            Gradientes personalizados para elementos especiais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-24 bg-gradient-to-r from-therapy-green to-therapy-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold">Gradiente Principal</span>
            </div>
            <div className="h-24 bg-gradient-to-r from-therapy-mint to-wellness-purple rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold">Gradiente Bem-estar</span>
            </div>
            <div className="h-24 bg-gradient-to-r from-recovery-orange to-therapy-green rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold">Gradiente Recuperação</span>
            </div>
            <div className="h-24 bg-gradient-to-r from-therapy-blue to-foreground rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold">Gradiente Profissional</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-therapy-green" />
          <span className="text-xl font-bold text-foreground">FisioFlow</span>
        </div>
        <p className="text-muted-foreground">
          Design System v1.0.0 - Criado para profissionais de fisioterapia
        </p>
      </div>
    </div>
  );
};

export default ThemeShowcase;