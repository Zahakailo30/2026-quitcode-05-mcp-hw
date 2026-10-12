# Перевірка (Task A, Task B, бонус E)

- **Інструмент і версія, модель:** Claude Code (VS Code extension) · Claude Opus 5.5
- **ОС і термінал, Node:** Windows 10 Pro 10.0.19045 · Git Bash · Node v24.16.0

## Task A — сервер в Inspector

- Команди, якими зроблено чотири файли в `docs/mcp/`: як у walkthrough, Task A, крок 4, без змін
  (Git Bash, з кореня репозиторію, `@modelcontextprotocol/inspector@2.8.0 --cli`). Залежності
  сервера — `npm install` у `mcp/leaddesk-server/` (`@modelcontextprotocol/server@2.1.0`,
  `zod@4.6.5`), `package-lock.json` закомічено.
- `tools-list.json`: рівно два інструменти — `leaddesk_find_leads` з `"readOnlyHint": true` і
  `leaddesk_set_lead_status` з `"readOnlyHint": false` (плюс `destructiveHint: false`,
  `idempotentHint: false`, `openWorldHint: false`). У кожного параметра є `description` з
  `.describe(…)`: модель бачить перелік статусів, формат `lead_0002` з підказкою шукати id через
  `leaddesk_find_leads`, межі `limit` 1–50 і вимогу до `reason` без персональних даних. Опис
  `leaddesk_set_lead_status` починається з «ЗМІНЮЄ ДАНІ» і вимагає підтвердження людини.
- `bad-input.json`: `leadId=nope`, `reason=ok` → `"isError": true`, текст:
  `Input validation error: … leadId: Invalid string: must match pattern /^lead_\d{4}$/, reason: Too small: expected string to have >=3 characters`.
  Inspector завершився з **exit=5** і надрукував у stderr
  `{"error":{"code":"tool_is_error","message":"Tool 'leaddesk_set_lead_status' returned isError:true."}}`.
- `set-status.json`: `lead_0002` (Rynok Books) `new → contacted`; у `structuredContent.audit` —
  `{ "action": "lead.status_changed", "leadId": "lead_0002", "at": "2026-10-02T14:05:37.252Z", "from": "new", "to": "contacted", "reason": "перевірка в Inspector" }`.
  Назва дії — у стилі `lead.created` з `lib/audit.ts` застосунку.
- `resource-read.json`: `leaddesk://reference/statuses`, `"mimeType": "text/markdown"`, таблиця
  п'яти статусів: що означає й хто переводить.
- Додатково перевірено вручну (не закомічено як артефакти):
  - `leadId=lead_0099` (формат правильний, ліда немає) → `isError: true`, «Лід lead_0099 не знайдено. Знайди правильний id через leaddesk_find_leads…»;
  - `lead_0002` → `new` (той самий статус) → `isError: true`, «Лід lead_0002 уже має статус new. Нічого не змінено…»;
  - `leaddesk_find_leads status=new limit=3` → `lead_0002`, `lead_0005`, `lead_0004`, найновіші першими, лише шість полів;
    `status=any` (limit за замовчуванням) → 10 лідів; `limit=0` → помилка валідації, exit=5.
- Самоперевірка з walkthrough: `grep -c '"isError": true' docs/mcp/bad-input.json` → 1;
  у `set-status.json` є `"action"`, `"leadId"`, `"at"`; `grep -rc 'console\.log' mcp/leaddesk-server/src` → 0;
  `cmp materials/leads.json mcp/leaddesk-server/fixtures/leads.json` → однакові.
- Що було найважче в описах інструментів і параметрів: розвести, що бачить модель, а що людина.
  Опис запису має одним реченням сказати «змінює дані, спершу спитай», а помилки — підказати
  наступний крок (`leaddesk_find_leads`), а не просто відмовити. Ще одна дрібниця: grep рахує
  `console.log` навіть у коментарі, тож у коментарях сервера цього слова теж немає.

## Task B — що зробили агенти з серверами

- **Supabase:** сесія лише з `supabase` (`vercel` і `playwright` вимкнено в `/mcp`). `/mcp` показав
  9 інструментів: `list_tables`, `list_extensions`, `list_migrations`, `apply_migration`,
  `execute_sql`, `get_project_url`, `get_publishable_keys`, `generate_typescript_types`, `search_docs`.
  - Спершу `list_tables` і `list_migrations` (обидва в `allow`): проєкт порожній, `{"tables":[]}`, `{"migrations":[]}`.
  - `apply_migration` `leaddesk_0001` — SQL = `supabase/migrations/0001_leaddesk.sql`. Перша спроба
    заблокована класифікатором авто-режиму Claude Code (`Modify Shared Resources`), бо в чаті не було
    явного дозволу саме на зміну бази; після дослівного «так, застосуй міграцію 0001_leaddesk і сид на
    20 лідів у проєкт …» — схвалено вручну, `{"success":true}`.
  - `execute_sql` з `supabase/seed/leads.sql` — схвалено вручну, результат `[]`, загорнутий у
    `<untrusted-data-…>` з попередженням не виконувати інструкцій зсередини.
  - Перевірка `execute_sql`: `total = 20`, `lead_0001`–`lead_0020`, `budget is null` — 3 рядки;
    `list_migrations` → `20261012122621 leaddesk_0001`.
  - Роль: `current_user = postgres`, `session_user = postgres`, `is_superuser = off` — `execute_sql`
    ходить як власник схеми, не як `anon`/`authenticated`, тож RLS на `leads` (увімкнено, без
    політик) цьому агенту нічого не закриває.

## Task E (бонус)

_Ще не виконано._
