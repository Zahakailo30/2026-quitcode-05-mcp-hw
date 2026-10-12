# Перевірка форми заявки через Playwright MCP

- Дата: 2026-10-12
- Адреса: http://localhost:3000 (`npm run dev`, Next.js 16.3.5, Turbopack). Інших адрес не відкривали.
- Знімок після відправлення: [lead-form-submitted.png](lead-form-submitted.png)
- Сесія: Claude Code (VS Code extension), з MCP-серверів доступний лише `playwright`; Supabase і Vercel
  вимкнено.

## Запит агенту

> Відкрий http://localhost:3000, заповни форму заявки тестовими даними, відправ, перевір консоль і
> мережу. Інших адрес не відкривай.

## Ланцюжок інструментів

Порядок, у якому інструменти викликали насправді, взято з транскрипту сесії. Між кроками 1 і 2 агент
працював не через MCP, а через `Bash`.

1. `browser_navigate` http://localhost:3000 → `net::ERR_CONNECTION_REFUSED`, бо сервер не запущено.
   - `Bash` `npm run dev` → `Cannot find module …\node_modules\next\dist\bin\next`, бо залежностей
     немає. Агент зупинився й спитав дозволу на `npm install`. Після «так» запустив `npm install` і
     `npm run dev`, а потім `curl` перевірив, що сервер відповідає `200`.
2. `browser_navigate` http://localhost:3000 → сторінка «LeadDesk»
3. `browser_snapshot` → форма: Ім'я, Прізвище, Email, Телефон, Компанія, Сайт, Бюджет, опис, чекбокс
   розсилки, кнопка «Надіслати заявку»
4. `browser_fill_form` → 8 полів (дані нижче)
5. `browser_click` → «Надіслати заявку»
6. `browser_snapshot` → «Дякуємо! Заявку отримано.»
7. `browser_console_messages` (`level: debug`, `all: true`) → 2 повідомлення, помилок 0
8. `browser_network_requests` (`static: false`) → `POST http://localhost:3000/ => 200`
9. `browser_network_requests` (`static: true`, фільтр на все, крім `http://localhost:3000`) → порожньо
10. `browser_take_screenshot` (`fullPage: true`) → `lead-form-submitted.png`. Цей і наступний кроки
    зроблено пізніше, на окреме прохання; форму вдруге не відправляли.
11. `browser_close`

`browser_wait_for` не викликали: на кроці 6 сторінка вже показувала результат.
`browser_network_request` (заголовки й тіло) теж не викликали.

## Тестові дані

| Поле | Значення |
| --- | --- |
| Ім'я / Прізвище | Тест Тестовий |
| Email | test@example.com |
| Телефон | +380000000000 |
| Компанія | Test Company |
| Сайт | https://example.com |
| Бюджет | $500–1500 / міс. |
| Що потрібно зробити? | Тестова заявка: перевірка форми. |
| Розсилка | не відмічено |

## Результат

- На сторінці: «Дякуємо! Заявку отримано. Ми зв'яжемося з вами протягом робочого дня.»
- Консоль браузера: 2 повідомлення, помилок і попереджень 0
  - `[INFO]` підказка встановити React DevTools
  - `[LOG] [HMR] connected`
- Мережа: `POST http://localhost:3000/` → `200 OK` (Server Action `submitLead` з `app/actions.ts`).
  Запитів на інші адреси немає.
- Журнал сервера:
  - `db:insertLead: 1`, `db:insertAuditEntry: 1`: заявку й запис аудиту збережено
  - n8n `lead-created` пропущено, бо не задано `N8N_WEBHOOK_BASE_URL` / `N8N_WEBHOOK_TOKEN`
    (очікувано для локального запуску)
  - персональних даних заявки в журналі немає

## Зауваження

- `next dev` слухає також адресу в локальній мережі, тож сервер видно з інших пристроїв у ній.
- `npm install` повідомив про 8 вразливостей (7 high, 1 critical), не розбирали.
