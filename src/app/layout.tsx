import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ForceLight } from '@/components/ForceLight';

export const metadata: Metadata = {
  title: 'Rubstec • Configurador',
  description: 'Configure identificadores de fios, cabos e bornes',
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </head>
      <body className="bg-white text-slate-900 antialiased">
        <ForceLight />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
