import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#17324D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'AlugaFácil Pro — Portal de Imóveis para Aluguel em Presidente Dutra e Maranhão',
  description: 'Encontre casas, apartamentos, kitnets e pontos comerciais para alugar em Presidente Dutra e cidades vizinhas do Maranhão. Fale direto com o proprietário pelo WhatsApp sem burocracia.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AlugaFácil',
  },
  openGraph: {
    title: 'AlugaFácil Pro — Aluguel de Imóveis no Maranhão',
    description: 'Encontre imóveis residenciais e comerciais para alugar em Presidente Dutra - MA e região. Contato direto no WhatsApp.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AlugaFácil Pro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlugaFácil Pro — Aluguel de Imóveis no Maranhão',
    description: 'Portal de anúncios imobiliários para Presidente Dutra e Maranhão. Contato direto pelo WhatsApp.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full scroll-smooth">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AlugaFácil" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F3F5F7] text-[#252B33] antialiased selection:bg-blue-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
