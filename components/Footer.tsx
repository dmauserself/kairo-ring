'use client';

import { ArrowRight } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Reveal } from './Reveal';

export function Footer() {
  const { t } = useLang();
  const nav = [
    { href: '#product', label: t.nav.product },
    { href: '#tech', label: t.nav.tech },
    { href: '#app', label: t.nav.app },
    { href: '#about', label: t.nav.about },
    { href: '#faq', label: t.faq.title },
  ];
  const social = ['Telegram', 'VK', 'YouTube'];

  return (
    <footer data-theme="dark" className="overflow-hidden bg-night">
      <div className="shell border-t border-white/[0.14] pt-16">
        <Reveal className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <p className="display max-w-[10em] text-[clamp(2.1rem,3.8vw,3.6rem)] leading-[1.05]">{t.footer.ctaTitle}</p>
          <a href="#buy" className="btn-line group w-full max-w-[330px] hover:bg-paper hover:text-night">
            {t.footer.cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </a>
        </Reveal>

        <div className="mt-20 grid gap-10 text-[14px] sm:grid-cols-2 lg:grid-cols-4">
          <p className="max-w-[18rem] leading-relaxed text-ash">{t.footer.disclaimer}</p>
          <ul className="space-y-0 md:space-y-2">
            {nav.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-block py-2.5 opacity-80 transition-opacity hover:opacity-100 md:py-0">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div>
            <p className="text-ash">{t.footer.contacts}</p>
            <a href="mailto:hello@kairo.example" className="mt-1 block py-2.5 hover:opacity-70 md:mt-2 md:py-0">
              hello@kairo.example
            </a>
            <a href={t.phone.href} className="block py-2.5 hover:opacity-70 md:mt-1 md:py-0">
              {t.phone.label}
            </a>
          </div>
          <div>
            <p className="text-ash">{t.footer.social}</p>
            <ul className="mt-1 flex gap-6 md:mt-2 md:block md:space-y-1">
              {social.map((s) => (
                <li key={s}>
                  <a href="#" className="inline-block min-w-[44px] py-2.5 hover:opacity-70 md:min-w-0 md:py-0">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* the wordmark, cropped by the bottom of the page */}
      <p aria-hidden className="wordmark mt-20 select-none whitespace-nowrap text-center text-[calc((100vw-1rem)/4.9)] leading-[0.74] text-paper min-[1536px]:text-[20rem]">
        KAIRO
      </p>

      <div className="shell flex flex-col gap-2 border-t border-white/[0.14] py-6 text-[12px] text-ash sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} KAIRO. {t.footer.rights}
        </p>
        <div className="flex gap-6">
          <a href="#" className="py-2.5 hover:text-paper sm:py-0">
            {t.footer.links.privacy}
          </a>
          <a href="#" className="py-2.5 hover:text-paper sm:py-0">
            {t.footer.links.offer}
          </a>
        </div>
      </div>
    </footer>
  );
}
