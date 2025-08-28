import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className='flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4'>
          <div className='text-center bg-white p-8 rounded-2xl shadow-lg'>
            <AlertTriangle className='mx-auto h-16 w-16 text-red-400' />
            <h1 className='mt-4 text-2xl font-bold text-slate-800'>
              Oops! Algo deu errado.
            </h1>
            <p className='mt-2 text-slate-600'>
              Nossa equipe foi notificada. Por favor, tente recarregar a página.
            </p>
            <details className='mt-4 text-left bg-slate-50 p-3 rounded-lg text-xs text-slate-500'>
              <summary className='cursor-pointer font-medium'>
                Detalhes do Erro
              </summary>
              <pre className='mt-2 whitespace-pre-wrap'>
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className='mt-6 inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-5 py-3 text-base font-medium text-white shadow-sm hover:bg-teal-600'
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    const { children } = this.props;
    return children;
  }
}

export default ErrorBoundary;
