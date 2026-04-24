import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Noto_Sans_Thai } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const notoSansThai = Noto_Sans_Thai({
  variable: '--font-sans',
  subsets: ['thai', 'latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'IQOS CRM',
    template: '%s · IQOS CRM',
  },
  description: 'ระบบจัดการลูกค้าและออเดอร์ IQOS',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${notoSansThai.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
