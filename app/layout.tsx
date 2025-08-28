// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../components/providers/AuthProvider';
import ToastContainer from '../components/ui/Toast';
import { ResourcePreloader } from '../components/preload/ResourcePreloader';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FisioFlow',
  description: 'Sistema de gestão para sua clínica de fisioterapia.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='pt-BR'>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link rel='dns-prefetch' href='//fonts.googleapis.com' />
        <link rel='dns-prefetch' href='//fonts.gstatic.com' />
      </head>
      <body className={inter.className}>
        <ResourcePreloader />
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
