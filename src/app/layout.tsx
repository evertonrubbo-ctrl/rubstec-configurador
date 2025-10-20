import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Rubstec • Configurador',
  description: 'Configure identificadores de fios, cabos e bornes',
  themeColor: '#ffffff',
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1 },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        {/* força esquema claro para componentes nativos/browsers */}
        <meta name="color-scheme" content="light" />
      </head>
      {/* fundo e texto claros sempre */}
      <body className="bg-white text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
