// LeadDesk as a domain MCP server — QuitCode Workshop 5, Task A.
// Two business verbs instead of SQL over the whole database:
//   leaddesk_find_leads       — reads: leads by status, newest first, only the fields the agent needs
//   leaddesk_set_lead_status  — writes: changes one lead's status and appends an audit entry
// plus the resource leaddesk://reference/statuses — what each status means for the team.
//
// This module only builds the server (`factory`); transports live next to it:
//   src/server.mjs — stdio (Claude Code, Inspector), src/http.mjs — Streamable HTTP on 127.0.0.1 (Task E1).
//
// The fixture is read once; changes live only in process memory. The file is never written.
// stdout is the protocol channel: nothing is printed to it; logs go to stderr (console.error) without personal data.
import { McpServer } from "@modelcontextprotocol/server";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// Resolved from this module, not from the cwd: Claude Code does not start the server from your terminal.
const FIXTURE = process.env.LEADDESK_FIXTURE ?? fileURLToPath(new URL("../fixtures/leads.json", import.meta.url));

// The same vocabulary as the app: LEAD_STATUSES in lib/types.ts, leadId() in lib/db.ts.
const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"];
const LEAD_ID = /^lead_\d{4}$/;

// The only fields leaddesk_find_leads returns. No name, email or message text: neither verb needs them.
const PUBLIC_FIELDS = ["id", "company", "status", "source", "budget", "createdAt"];
const pick = (lead) => Object.fromEntries(PUBLIC_FIELDS.map((k) => [k, lead[k]]));

// Loaded once per process; every Inspector call starts a new process, so state is fresh each time.
const leads = JSON.parse(await readFile(FIXTURE, "utf8"));
const audit = [];

const STATUSES_MD = `# Статуси лідів LeadDesk

Статуси — рівно ці п'ять (\`LEAD_STATUSES\` застосунку). Інших немає.

| Статус | Що означає для команди Studio Nova | Хто й коли переводить |
|---|---|---|
| \`new\` | Заявка прийшла з форми чи кампанії, з клієнтом ще ніхто не говорив. | Ставиться автоматично під час створення ліда. Назад у \`new\` не повертаємо. |
| \`contacted\` | Менеджер вийшов на зв'язок: дзвінок, лист чи повідомлення, і клієнт відповів або отримав відповідь. | Менеджер — одразу після першого контакту. |
| \`qualified\` | Є підтверджена потреба, орієнтовний бюджет і людина, яка ухвалює рішення; можна готувати кошторис. | Менеджер після дзвінка-кваліфікації. |
| \`won\` | Клієнт погодив кошторис або підписав договір / оплатив передоплату. | Лише акаунт-менеджер або керівник, коли є письмове підтвердження. |
| \`lost\` | Клієнт відмовився, не відповідає після трьох спроб або запит нам не підходить. | Менеджер, із причиною в полі \`reason\`. |

Звичайний шлях: \`new\` → \`contacted\` → \`qualified\` → \`won\` або \`lost\`. \`lost\` можна поставити з будь-якого статусу.
Кожна зміна статусу — лише через \`leaddesk_set_lead_status\`, після підтвердження людини, і лишає запис в аудиті.
`;

const fail = (text) => ({ isError: true, content: [{ type: "text", text }] });

export const factory = () => {
  const server = new McpServer({ name: "leaddesk", version: "0.1.0" });

  server.registerTool(
    "leaddesk_find_leads",
    {
      title: "Знайти ліди LeadDesk",
      description:
        "Повертає ліди LeadDesk за статусом, найновіші першими: id, компанія, статус, джерело, бюджет і дата створення. Імені, email і тексту заявки не повертає. Застосовуй, щоб побачити, хто в роботі, або знайти id ліда перед зміною статусу. Тільки читає, нічого не змінює. Що означає кожен статус — у ресурсі leaddesk://reference/statuses.",
      inputSchema: {
        status: z
          .enum([...LEAD_STATUSES, "any"])
          .describe("Який статус шукати: new, contacted, qualified, won або lost; any — ліди з усіма статусами"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(10)
          .describe("Скільки лідів повернути, від 1 до 50; за замовчуванням 10"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ status, limit = 10 }) => {
      const found = leads
        .filter((l) => status === "any" || l.status === status)
        .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit)
        .map(pick);
      const lines = found.map((l) => `- ${l.id} · ${l.company} · ${l.status} · ${l.source} · бюджет ${l.budget ?? "—"} · ${l.createdAt.slice(0, 10)}`);
      const head = `Знайдено ${found.length} лід(ів) зі статусом ${status}, найновіші першими.`;
      return {
        content: [{ type: "text", text: found.length ? `${head}\n${lines.join("\n")}` : `Лідів зі статусом ${status} немає.` }],
        structuredContent: { status, count: found.length, leads: found },
      };
    },
  );

  server.registerTool(
    "leaddesk_set_lead_status",
    {
      title: "Змінити статус ліда LeadDesk",
      description:
        "ЗМІНЮЄ ДАНІ: переводить один лід LeadDesk у новий статус і додає запис в аудит { action, leadId, at }. Перед викликом покажи людині, який лід, з якого статусу на який і чому, та отримай її підтвердження. Статус — лише один із п'яти; їхнє значення — у ресурсі leaddesk://reference/statuses. Невідомий лід або той самий статус, що вже стоїть, повертає помилку й нічого не змінює.",
      inputSchema: {
        leadId: z
          .string()
          .regex(LEAD_ID)
          .describe("Ідентифікатор ліда у форматі lead_ і чотири цифри, напр. lead_0002. Не знаєш id — знайди його через leaddesk_find_leads"),
        status: z.enum(LEAD_STATUSES).describe("Новий статус: new, contacted, qualified, won або lost"),
        reason: z
          .string()
          .min(3)
          .max(500)
          .describe("Чому змінюємо статус, 3–500 символів, напр. «клієнт відповів на дзвінок, просить кошторис». Без персональних даних"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ leadId, status, reason }) => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) {
        return fail(`Лід ${leadId} не знайдено. Знайди правильний id через leaddesk_find_leads (status: "any") і повтори. Нічого не змінено.`);
      }
      if (lead.status === status) {
        return fail(`Лід ${leadId} уже має статус ${status}. Нічого не змінено; якщо потрібен інший статус — уточни в людини.`);
      }
      const from = lead.status;
      lead.status = status;
      // AuditEntry { action, leadId, at } as in lib/types.ts, named like the app's "lead.created".
      const entry = { action: "lead.status_changed", leadId, at: new Date().toISOString(), from, to: status, reason };
      audit.push(entry);
      console.error(`[leaddesk] ${entry.action} ${leadId} ${from}->${status}`);
      return {
        content: [{ type: "text", text: `Статус ${leadId} (${lead.company}) змінено: ${from} → ${status}. Запис аудиту: ${entry.action}, ${entry.at}.` }],
        structuredContent: { lead: pick(lead), audit: entry },
      };
    },
  );

  server.registerResource(
    "leaddesk-statuses",
    "leaddesk://reference/statuses",
    {
      title: "Статуси лідів LeadDesk",
      description: "П'ять статусів ліда і що кожен означає для команди: коли лід стає contacted, qualified, won чи lost і хто його переводить",
      mimeType: "text/markdown",
    },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: STATUSES_MD }] }),
  );

  return server;
};
