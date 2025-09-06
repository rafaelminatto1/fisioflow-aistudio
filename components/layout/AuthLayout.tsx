'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showLogo?: boolean;
  className?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  description,
  showLogo = true,
  className
}) => {
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4',
      className
    )}>
      <div className="w-full max-w-md space-y-6">
        {/* Logo Section */}
        {showLogo && (
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-2xl">F</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">FisioFlow</h1>
              <p className="text-sm text-muted-foreground">
                Sistema de gestão para fisioterapeutas
              </p>
            </div>
          </div>
        )}

        {/* Auth Card */}
        <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-xl font-semibold text-foreground">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </CardHeader>
          
          <Separator className="mx-6" />
          
          <CardContent className="pt-6">
            {children}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            © 2024 FisioFlow. Todos os direitos reservados.
          </p>
          <div className="flex justify-center space-x-4 text-xs">
            <a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Termos de Uso
            </a>
            <Separator orientation="vertical" className="h-3" />
            <a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Política de Privacidade
            </a>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default AuthLayout;