import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'GO AÇAÍ - Delivery de Açaí e Sorvetes',
  description: 'Sistema completo de delivery para açaí, sorveterias e gelaterias',
  keywords: ['açaí', 'delivery', 'sorveteria', 'gelateria', 'pedido online'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d946ef" />
      </head>
      <body className="min-h-screen bg-white dark:bg-dark-950 text-dark-900 dark:text-dark-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}