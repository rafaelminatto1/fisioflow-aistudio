// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Stethoscope, Loader2 } from 'lucide-react';
import { useToast } from "../../../components/ui/use-toast";

// Esquema de validação com Zod
const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
        email: 'admin@fisioflow.com',
        password: 'password123',
    }
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        toast({
            title: "Erro de Login",
            description: result.error,
            variant: "destructive",
        });
      } else if (result?.ok) {
        toast({
            title: "Login bem-sucedido!",
            description: "Redirecionando para o painel...",
        });
        router.push(callbackUrl);
      }
    } catch (e) {
      const errorMessage = 'Ocorreu um erro inesperado. Tente novamente.';
      toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
            <Stethoscope className="w-12 h-12 text-sky-500 mx-auto" />
            <h1 className="mt-4 text-3xl font-bold text-slate-800">Fisio<span className="text-sky-500">Flow</span></h1>
            <p className="mt-2 text-sm text-slate-500">Acesse sua conta para continuar.</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Senha</label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"
              />
               {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
         <div className="text-center text-xs text-slate-500 mt-4 space-y-1">
            <p>Use <code className="bg-slate-200 p-1 rounded-sm">admin@fisioflow.com</code> / <code className="bg-slate-200 p-1 rounded-sm">password123</code></p>
         </div>
      </div>
    </div>
  );
}
