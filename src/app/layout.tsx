
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "../../components/auth/AuthProvider";
import "./globals.css";
import ToastContainer from "../../components/ui/Toast";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "FisioFlow",
  description: "Sistema de gestão para sua clínica de fisioterapia.",
   manifest: "/manifest.json",
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable} bg-slate-50 antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <ToastContainer />
      </body>
    </html>
  );
}