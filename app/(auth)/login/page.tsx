'use client';

import { useState, Suspense, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Stethoscope, Loader2, Eye, EyeOff, Shield, Heart, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@fisioflow.com',
      password: 'admin123',
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async data => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError('Credenciais inválidas. Verifique seu email e senha.');
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (e) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Floating shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>
      
      {/* Medical icons floating */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Heart className="absolute top-1/4 left-1/4 w-6 h-6 text-sky-400/20 animate-float" />
        <Activity className="absolute top-3/4 right-1/4 w-8 h-8 text-blue-400/20 animate-float delay-1000" />
        <Shield className="absolute bottom-1/4 left-1/3 w-5 h-5 text-cyan-400/20 animate-float delay-500" />
      </div>
      
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className={cn(
          "w-full max-w-md mx-auto transition-all duration-1000 ease-out",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-sky-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-sky-400 to-sky-600 p-4 rounded-2xl shadow-2xl">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="mt-6 text-4xl font-bold text-white">
              Fisio<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">Flow</span>
            </h1>
            <p className="mt-3 text-slate-300">Sistema de Gestão em Fisioterapia</p>
            <Badge variant="glass" className="mt-2">
              Acesse sua conta para continuar
            </Badge>
          </div>
          
          {/* Login Card */}
          <Card variant="glass" className={cn(
            "backdrop-blur-xl border-slate-700/50 shadow-2xl transition-all duration-700 delay-300",
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}>
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-slate-300">Sistema Online</span>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {error && (
                <div className={cn(
                  "mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm",
                  "animate-shake"
                )}>
                  <p className="text-sm text-red-400 text-center">{error}</p>
                </div>
              )}
          
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      className={cn(
                        "w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl",
                        "text-white placeholder-slate-400 backdrop-blur-sm",
                        "focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50",
                        "transition-all duration-300 hover:border-slate-500/70",
                        errors.email && "border-red-500/50 focus:ring-red-500/50"
                      )}
                      placeholder="seu@email.com"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent rounded-xl pointer-events-none" />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-400 animate-fade-in">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className={cn(
                        "w-full px-4 py-3 pr-12 bg-slate-800/50 border border-slate-600/50 rounded-xl",
                        "text-white placeholder-slate-400 backdrop-blur-sm",
                        "focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50",
                        "transition-all duration-300 hover:border-slate-500/70",
                        errors.password && "border-red-500/50 focus:ring-red-500/50"
                      )}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent rounded-xl pointer-events-none" />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400 animate-fade-in">{errors.password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    variant="gradient"
                    size="lg"
                    className="w-full group"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                        Entrar no Sistema
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Test Credentials */}
          <div className={cn(
            "text-center mt-6 transition-all duration-1000 delay-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Badge variant="outline" className="mb-2 border-slate-600/50 text-slate-300">
              Credenciais de Teste
            </Badge>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-center space-x-2">
                <code className="bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 text-sky-400">
                  admin@fisioflow.com
                </code>
                <span>/</span>
                <code className="bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 text-sky-400">
                  admin123
                </code>
              </div>
=======
    <div className='flex items-center justify-center min-h-screen bg-slate-100 p-4'>
      <div className='w-full max-w-sm mx-auto'>
        <div className='text-center mb-8'>
          <Stethoscope className='w-12 h-12 text-sky-500 mx-auto' />
          <h1 className='mt-4 text-3xl font-bold text-slate-800'>
            Fisio<span className='text-sky-500'>Flow</span>
          </h1>
          <p className='mt-2 text-sm text-slate-500'>
            Acesse sua conta para continuar.
          </p>
        </div>

        <div className='bg-white rounded-2xl shadow-lg p-8'>
          {error && (
            <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-slate-700'
              >
                Email
              </label>
              <input
                id='email'
                type='email'
                {...register('email')}
                className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500'
              />
              {errors.email && (
                <p className='mt-1 text-xs text-red-600'>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-slate-700'
              >
                Senha
              </label>
              <input
                id='password'
                type='password'
                {...register('password')}
                className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500'
              />
              {errors.password && (
                <p className='mt-1 text-xs text-red-600'>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <button
                type='submit'
                disabled={isLoading}
                className='w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500'
              >
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
>>>>>>> 0a044a4fefabf8a04dc73a6184972379c66221b3
            </div>
          </div>
        </div>
<<<<<<< HEAD
=======
        <div className='text-center text-xs text-slate-500 mt-4 space-y-1'>
          <p>Credenciais de teste:</p>
          <p>
            <code className='bg-slate-200 p-1 rounded-sm'>
              admin@fisioflow.com
            </code>{' '}
            / <code className='bg-slate-200 p-1 rounded-sm'>admin123</code>
          </p>
        </div>
>>>>>>> 0a044a4fefabf8a04dc73a6184972379c66221b3
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center min-h-screen'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500'></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
