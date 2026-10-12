# leaddesk-mcp-server

Доменний MCP-сервер LeadDesk (stdio) для Task A WS5. Агент отримує два бізнес-дієслова замість SQL на
всю базу:

| Ім'я | Що робить | Анотації |
|---|---|---|
| `leaddesk_find_leads` | ліди за статусом (`new`…`lost` або `any`), найновіші першими; лише `id`, `company`, `status`, `source`, `budget`, `createdAt` | `readOnlyHint: true` |
| `leaddesk_set_lead_status` | змінює статус одного ліда й пише запис аудиту `{ action, leadId, at }` | `readOnlyHint: false` |
| `leaddesk://reference/statuses` | ресурс `text/markdown`: що кожен статус означає для команди | — |

Дані — `fixtures/leads.json` (незмінна копія `materials/leads.json`, 20 лідів). Сервер читає файл
один раз, зміни тримає лише в пам'яті процесу й файл ніколи не переписує. Інший файл можна підставити
змінною `LEADDESK_FIXTURE` (шлях до JSON). Інших змінних оточення й секретів немає.

## Запуск

```bash
cd mcp/leaddesk-server
npm ci
node src/server.mjs          # stdio: чекає на JSON-RPC, журнал лише в stderr
node src/http.mjs            # Streamable HTTP на http://127.0.0.1:3333/mcp, з перевіркою Host/Origin (Task E1)
```

Інструменти й ресурс — у `src/leaddesk.mjs` (`factory`); `server.mjs` і `http.mjs` — лише транспорти.

## Перевірка Inspector'ом (Git Bash, з кореня репозиторію)

```bash
npx -y @modelcontextprotocol/inspector@2.8.0 --cli node mcp/leaddesk-server/src/server.mjs --method tools/list
npx -y @modelcontextprotocol/inspector@2.8.0 --cli node mcp/leaddesk-server/src/server.mjs \
  --method tools/call --tool-name leaddesk_find_leads --tool-arg status=new --tool-arg limit=3
npx -y @modelcontextprotocol/inspector@2.8.0 --cli node mcp/leaddesk-server/src/server.mjs \
  --method resources/read --uri leaddesk://reference/statuses
```

Збережені результати — у `docs/mcp/*.json`, команди для них — у `docs/walkthrough.md`, Task A, крок 4.

## Підключення до Claude Code

Скоуп `local` (запис у `~/.claude.json`, у git нічого не потрапляє). Для A/B у Task C — з порожньої
теки поза репозиторієм:

```bash
REPO="$(pwd -W)"   # з кореня репозиторію; у macOS/Linux — REPO="$(pwd)"
(cd ../leaddesk-ab-b && claude mcp add leaddesk -- node "$REPO/mcp/leaddesk-server/src/server.mjs")
```

Кожен виклик `leaddesk_set_lead_status` схвалюйте вручну: запит на схвалення показує лід, новий
статус і причину.
