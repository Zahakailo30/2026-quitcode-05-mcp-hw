# Підключення MCP-серверів LeadDesk (Task B)

- **Акаунти:** Supabase — особистий акаунт, одноразовий проєкт лише для WS5 · Vercel — особистий
  акаунт, план Hobby, команда за замовчуванням з одним учасником · Figma — не використовували
- **Третій сервер:** Playwright — не потребує акаунта й не має ліміту викликів, а перевірка форми
  заявки на `localhost` прямо стосується LeadDesk; у Figma на Starter лише 20 викликів на місяць.
- **Vercel CLI на цій машині:** не встановлено (`vercel: command not found`), тож обходу `deny` через
  `Bash` і CLI-токен немає.

## Сервери

| Сервер | Який доступ | Навіщо нам | Що станеться при компрометації | Чим саме звужено |
|---|---|---|---|---|
| `supabase` | Лише один проєкт: читання схеми й міграцій, `apply_migration` і `execute_sql` під роллю `postgres` (власник схеми, RLS не діє), URL і publishable-ключі проєкту, генерація типів, пошук у документації | Міграція таблиці `leads` і сид на 20 лідів для A/B у Task C | Довільний SQL у цьому проєкті: прочитати, змінити чи видалити всі 20 синтетичних лідів, змінити схему. Інших проєктів і організацій акаунта не дістати | `project_ref=` прив'язує до одного проєкту; `features=database,development,docs` — без `account` (немає `list_projects`, `create_project` тощо), без `functions` (канал назовні), без `branching` (платне). `read_only` не ставили, бо потрібен `apply_migration`. В `allow` лише `search_docs`, `list_tables`, `list_migrations`; `apply_migration` і `execute_sql` — щоразу вручну |
| `vercel` | Токен OAuth = весь користувач Vercel: читання проєктів, деплоїв і логів; без deny — ще й деплой, домени, покупки, env, firewall | Знайти останній деплой і прочитати лог білду | Без deny: деплой у production, покупки з картки, читання env-змінних, посилання в обхід Deployment Protection. З deny — читання деплоїв і логів особистого акаунта | Звузити в URL нічим (скоуп один). У `deny` — 11 обов'язкових інструментів, що змінюють стан, і ще ~90: решта записуючих, ті, що читають секрети (`get_project_env`, `get_shared_env_var`, токени Edge Config), і `web_fetch_vercel_url`. В `allow` лише `list_deployments`, `get_deployment`, `get_deployment_build_logs`. CLI не встановлено |
| `playwright` | Локальний браузер Chrome: відкривати сторінки, клікати, вводити, читати DOM, консоль і мережу; без deny — ще й довільний JS у процесі сервера та читання файлів проєкту | Перевірити форму заявки на `http://localhost:3000` | Без deny: `browser_run_code_unsafe` — виконання коду на машині повз правила `Bash`; `browser_file_upload`/`browser_drop` — винос `.env.local` на будь-яку сторінку; інструкції зі сторінки (prompt injection) керують агентом. З deny — навігація й введення в профілі браузера без логінів | `@playwright/mcp@0.0.82` (точна версія), `--isolated` (профіль лише в пам'яті), `--no-webmcp` (сторінка не додає інструментів), `--allowed-origins http://localhost:3000` (зручність, не межа безпеки). `deny`: `browser_run_code_unsafe`, `webmcp_*`, `browser_file_upload`, `browser_drop`, `browser_evaluate`. `allow` — 10 точних імен, без `*`; `browser_network_request` щоразу питає |

## Supabase: схема й сид

- Міграція `supabase/migrations/0001_leaddesk.sql` створює таблицю `leads` (статус обмежено `new`,
  `contacted`, `qualified`, `won`, `lost`; RLS увімкнено без політик)
- Сид `supabase/seed/leads.sql`: 20 рядків, `lead_0001`–`lead_0020`, ті самі, що в `materials/leads.json`
- Скільки інструментів Supabase видно в `/mcp` із вашим URL: 9
- Якими викликами створено схему й дані і що ви схвалювали вручну: `apply_migration` (`leaddesk_0001`)
  і `execute_sql` (сид) — обидва схвалено вручну; перевірка `execute_sql` дала `total = 20`.
  Подробиці — `docs/mcp/verification.md`

## Сесії: що вмикаємо разом

У кожній сесії — щонайбільше один сервер із правом запису; браузерний сервер — ніколи разом із Supabase.

| Крок | Увімкнено в `/mcp` | Сервер із правом запису в цій сесії |
|---|---|---|
| Міграція й сид | `supabase` | `supabase` |
| Лог білду | `vercel` | —, записуючі інструменти під deny |
| Знімок «до», перевірка форми в браузері, знімок «після» | `playwright` (connectors claude.ai, зокрема Supabase, вимкнено) | `playwright` |

## До і після звуження: третій сервер

- Як отримали перелік: нова сесія, у `/mcp` лише `playwright`, запит «Перелічи всі інструменти сервера
  playwright, які тобі зараз доступні. Нічого не викликай.»
- `docs/mcp/evidence/mcp-before.txt`: 25 інструментів
- `docs/mcp/evidence/mcp-after.txt`: 21 інструмент; зникли: `browser_run_code_unsafe`,
  `browser_file_upload`, `browser_drop`, `browser_evaluate`, тобто рівно ті, що в `deny` (`webmcp_*`
  не було й у «до», бо `--no-webmcp`). Нових інструментів не з'явилося. Агент написав «Їх 22», але
  перелічив 21; у файл записано сам перелік. Його здогадки про відсутні (`browser_run_code`,
  `browser_install`) — це не імена з «до», тож у файл вони не потрапили.
