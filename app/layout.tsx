import type { Metadata, Viewport } from 'next';
import { Inter_Tight, Roboto_Flex } from 'next/font/google';
import { LangProvider } from '@/lib/i18n';
import './globals.css';

const display = Roboto_Flex({
  subsets: ['latin', 'cyrillic'],
  axes: ['wdth', 'opsz', 'XOPQ', 'YOPQ', 'XTRA'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter_Tight({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
  display: 'swap',
});

const title = 'KAIRO — Smart Ring for Sleep, Heart Rate, HRV & Recovery';
const description =
  'KAIRO is a 4-gram titanium smart ring that tracks your sleep, heart rate, HRV, and stress around the clock. Up to 8 days of battery life, no subscription, free shipping, and 30-day returns.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? 'http://localhost:3000'),
  title,
  description,
  keywords: ['smart ring', 'sleep tracker', 'HRV', 'heart rate', 'stress', 'recovery', 'KAIRO'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ru_RU'],
    siteName: 'KAIRO',
    title,
    description,
    url: '/',
  },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport: Viewport = {
  themeColor: '#060606',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
