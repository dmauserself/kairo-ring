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

const title = 'KAIRO — умное кольцо для сна, пульса, HRV и восстановления';
const description =
  'KAIRO — титановое умное кольцо весом 4 грамма. Следит за сном, пульсом, HRV и стрессом круглосуточно, до 8 дней без подзарядки, без подписки. Бесплатная доставка и 30 дней на возврат.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? 'http://localhost:3000'),
  title,
  description,
  keywords: ['умное кольцо', 'трекер сна', 'HRV', 'пульс', 'стресс', 'восстановление', 'KAIRO', 'smart ring'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    alternateLocale: ['en_US'],
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
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <head>
        {/* tiny ruble-sign fonts (prices are above the fold) */}
        <link rel="preload" href="/fonts/ruble-text.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/ruble-display.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="font-sans">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
