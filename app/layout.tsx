// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../components/providers/AuthProvider';
import { ThemeProvider } from '../contexts/ThemeContext';
import ToastContainer from '../components/ui/Toast';
import { ResourcePreloader } from '../components/preload/ResourcePreloader';
import { AuthProvider as CustomAuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import './globals.css';
import './responsive.css';

const inter = Inter({ subsets: ['latin'] });

/**
 * @constant metadata
 * @description Metadados da aplicação para SEO e configuração da viewport.
 */
export const metadata: Metadata = {
  title: 'FisioFlow',
  description: 'Sistema de gestão para sua clínica de fisioterapia.',
  keywords: 'fisioterapia, gestão, clínica, pacientes, agenda, prontuário',
  authors: [{ name: 'FisioFlow Team' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

/**
 * Layout raiz da aplicação.
 * Envolve todas as páginas com os provedores de contexto necessários, como
 * autenticação e tema, além de configurar o corpo do HTML e a fonte principal.
 *
 * @param {Readonly<{children: React.ReactNode}>} props - Propriedades do componente.
 * @param {React.ReactNode} props.children - Os componentes filhos que serão renderizados dentro do layout.
 * @returns {React.ReactElement} O componente de layout raiz.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='pt-BR' className='scroll-smooth'>
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=5' />
        <meta name='color-scheme' content='light dark' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
        <link rel='dns-prefetch' href='//fonts.googleapis.com' />
        <link rel='dns-prefetch' href='//fonts.gstatic.com' />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-sky-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          Pular para o conteúdo principal
        </a>
        
        <ResourcePreloader />
        <ThemeProvider>
          <AuthProvider>
            <CustomAuthProvider>
              <ToastProvider>
                <div id="main-content" className="min-h-screen">
                  {children}
                </div>
                <ToastContainer />
              </ToastProvider>
            </CustomAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
