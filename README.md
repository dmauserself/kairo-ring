# KAIRO — лендинг умного кольца

Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion + three.js.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Структура

- `app/page.tsx` — главная, собирает секции по порядку
- `app/checkout/page.tsx` — демо-страница оформления заказа (`/checkout?color=gold&size=9`)
- `app/opengraph-image.tsx` — OG-картинка, генерируется при сборке
- `lib/content.ts` — **все тексты, цены и контакты для обоих языков** — правьте здесь.
  Основной язык — русский (`DEFAULT_LANG`), английский — дополнительный; выбор посетителя запоминается в браузере.
  Цена: $349 в английской версии, 29 990 ₽ в русской (`price` в каждом словаре).
- `lib/ring3d.ts` — 3D-модель кольца, слои для разбора, студийный свет (three.js)
- `components/RingCanvas.tsx` — кольцо в hero, в блоке цены и на `/checkout`
- `components/Exploded.tsx` — 3D-разбор на 6 слоёв по скроллу с выносками
- `public/fonts/ruble-*.woff2` — только знак «₽» из шрифтов сайта; без них браузер качал бы ~250 КБ расширенной латиницы ради одного символа
- `lib/defer.ts` — отложенный запуск 3D-сцен, которых нет на первом экране
- `scripts/gen-rocks.mjs` — генератор фактуры скал (`node scripts/gen-rocks.mjs` → `public/img/stone-*.png`)

## Что заменить перед запуском в прод

- Цифры точности, отзывы, счётчик покупателей — это заглушки (`lib/content.ts`)
- Скалы в hero сгенерированы процедурно — их можно заменить на свою ч/б фотографию того же формата (PNG с прозрачностью)
- Контакты и ссылки на соцсети — в `components/Footer.tsx`
- Адрес сайта для OG/canonical — `NEXT_PUBLIC_SITE_URL` (на Netlify берётся автоматически из `URL`)
- Форма в `/checkout` ничего не отправляет — подключите платёжный провайдер

## Деплой

Netlify: «Add new site → Import an existing project → GitHub», выбрать репозиторий.
Настройки подтянутся из `netlify.toml`; каждый пуш в `main` публикуется автоматически.
