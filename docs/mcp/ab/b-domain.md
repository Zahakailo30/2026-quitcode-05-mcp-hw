# Прогін B — доменний сервер (LeadDesk із Task A)

- Тека: `D:\ws5-ab-b`, у ній лише `.mcp.json` з одним сервером `leaddesk`:
  `node D:/2026-quitcode-05-mcp-hw/mcp/leaddesk-server/src/server.mjs` (режим фікстури, свіжий процес)
- Клієнт: Claude Code, розширення VS Code; модель Opus 5.5
- Транскрипт скопійовано з панелі розширення без змін.

---

**1. Скільки лідів зараз у статусі qualified? Назви їхні ідентифікатори й компанії.**

Leaddesk [leaddesk_find_leads]

```
OUT
{"status":"qualified","count":3,"leads":[{"id":"lead_0001","company":"North Wind Yachts","status":"qualified","source":"facebook-ads","budget":2500,"createdAt":"2026-09-20T06:32:40.447Z"},{"id":"lead_0013","company":"Bloom Florists","status":"qualified","source":"facebook-ads","budget":1500,"createdAt":"2026-09-07T13:54:42.854Z"},{"id":"lead_0015","company":"Bloom Florists","status":"qualified","source":"website","budget":2500,"createdAt":"2026-08-18T15:29:38.903Z"}]}
```

> Зараз у статусі qualified є 3 ліди:
>
> | ID | Компанія |
> |---|---|
> | lead_0001 | North Wind Yachts |
> | lead_0013 | Bloom Florists |
> | lead_0015 | Bloom Florists |
>
> Bloom Florists має два окремі ліди. Вони прийшли з різних джерел (facebook-ads і website) і мають
> різні бюджети (1500 і 2500), тож це, ймовірно, не просто дубль.

---

**2. Покажи п'ять найновіших лідів зі статусом new: ідентифікатор, компанія, дата заявки.**

Leaddesk [leaddesk_find_leads]

```
OUT
{"status":"new","count":5,"leads":[{"id":"lead_0002","company":"Rynok Books","status":"new","source":"webinar","budget":500,"createdAt":"2026-09-13T00:52:02.043Z"},{"id":"lead_0005","company":"Brick & Beam","status":"new","source":"linkedin","budget":500,"createdAt":"2026-09-12T02:42:39.732Z"},{"id":"lead_0004","company":"Green Leaf Market","status":"new","source":"facebook-ads","budget":1500,"createdAt":"2026-08-30T17:46:42.505Z"},{"id":"lead_0018","company":"Green Leaf Market","status":"new","source":"google-ads","budget":null,"createdAt":"2026-07-18T05:08:24.837Z"},{"id":"lead_0012","company":"Lviv Coffee Lab","status":"new","source":"website","budget":null,"createdAt":"2026-07-07T20:23:53.712Z"}]}
```

> П'ять найновіших лідів зі статусом new:
>
> | ID | Компанія | Дата заявки |
> |---|---|---|
> | lead_0002 | Rynok Books | 2026-09-13 |
> | lead_0005 | Brick & Beam | 2026-09-12 |
> | lead_0004 | Green Leaf Market | 2026-08-30 |
> | lead_0018 | Green Leaf Market | 2026-07-18 |
> | lead_0012 | Lviv Coffee Lab | 2026-07-07 |
>
> Найсвіжішій заявці в цьому статусі вже місяць. Дві найстаріші висять з липня, тобто 3 місяці без
> контакту.

---

**3. Який сумарний бюджет лідів у статусі won? Ліди без бюджету в суму не додавай, але скажи, скільки їх.**

Leaddesk [leaddesk_find_leads]

```
OUT
{"status":"won","count":5,"leads":[{"id":"lead_0011","company":"Lviv Coffee Lab","status":"won","source":"facebook-ads","budget":5000,"createdAt":"2026-09-11T12:34:50.420Z"},{"id":"lead_0006","company":"Nova Dental","status":"won","source":"linkedin","budget":null,"createdAt":"2026-08-31T21:08:50.351Z"},{"id":"lead_0016","company":"Karpaty Tours","status":"won","source":"google-ads","budget":1000,"createdAt":"2026-07-30T05:49:44.585Z"},{"id":"lead_0010","company":"Artisan Bakery","status":"won","source":"linkedin","budget":2500,"createdAt":"2026-07-20T15:04:37.639Z"},{"id":"lead_0017","company":"Hutsul Crafts","status":"won","source":"webinar","budget":500,"createdAt":"2026-06-27T08:23:09.596Z"}]}
```

> Сумарний бюджет лідів у статусі won становить 9 000. Валюту LeadDesk не повертає.
>
> Усього в цьому статусі 5 лідів, бюджет вказано в чотирьох:
>
> | ID | Компанія | Бюджет |
> |---|---|---|
> | lead_0011 | Lviv Coffee Lab | 5 000 |
> | lead_0010 | Artisan Bakery | 2 500 |
> | lead_0016 | Karpaty Tours | 1 000 |
> | lead_0017 | Hutsul Crafts | 500 |
>
> Без бюджету 1 лід: lead_0006 (Nova Dental). Його в суму не додано.

---

**4. Які статуси лідів є в LeadDesk і що кожен із них означає для команди?**

ReadMcpResourceTool

```
IN
{
  "server": "leaddesk",
  "uri": "leaddesk://reference/statuses"
}

OUT
{"contents":[{"uri":"leaddesk://reference/statuses","mimeType":"text/markdown","text":"# Статуси лідів LeadDesk\n\nСтатуси — рівно ці п'ять (`LEAD_STATUSES` застосунку). Інших немає.\n\n| Статус | Що означає для команди Studio Nova | Хто й коли переводить |\n|---|---|---|\n| `new` | Заявка прийшла з форми чи кампанії, з клієнтом ще ніхто не говорив. | Ставиться автоматично під час створення ліда. Назад у `new` не повертаємо. |\n| `contacted` | Менеджер вийшов на зв'язок: дзвінок, лист чи повідомлення, і клієнт відповів або отримав відповідь. | Менеджер — одразу після першого контакту. |\n| `qualified` | Є підтверджена потреба, орієнтовний бюджет і людина, яка ухвалює рішення; можна готувати кошторис. | Менеджер після дзвінка-кваліфікації. |\n| `won` | Клієнт погодив кошторис або підписав договір / оплатив передоплату. | Лише акаунт-менеджер або керівник, коли є письмове підтвердження. |\n| `lost` | Клієнт відмовився, не відповідає після трьох спроб або запит нам не підходить. | Менеджер, із причиною в полі `reason`. |\n\nЗвичайний шлях: `new` → `contacted` → `qualified` → `won` або `lost`. `lost` можна поставити з будь-якого статусу.\nКожна зміна статусу — лише через `leaddesk_set_lead_status`, після підтвердження людини, і лишає запис в аудиті.\n"}]}
```

> У LeadDesk рівно п'ять статусів, інших немає. Ось що кожен означає для команди Studio Nova:
>
> | Статус | Що означає | Хто й коли переводить |
> |---|---|---|
> | new | Заявка прийшла з форми чи кампанії, з клієнтом ще ніхто не говорив. | Ставиться автоматично, коли лід створюється. Назад у new лід не повертають. |
> | contacted | Менеджер вийшов на зв'язок дзвінком, листом чи повідомленням, і клієнт відповів або отримав відповідь. | Менеджер, одразу після першого контакту. |
> | qualified | Підтверджено потребу, орієнтовний бюджет і людину, яка ухвалює рішення. Можна готувати кошторис. | Менеджер, після дзвінка-кваліфікації. |
> | won | Клієнт погодив кошторис, підписав договір або вніс передоплату. | Лише акаунт-менеджер або керівник, коли є письмове підтвердження. |
> | lost | Клієнт відмовився, не відповідає після трьох спроб, або запит нам не підходить. | Менеджер, із причиною в полі reason. |
>
> Звичайний шлях ліда: new → contacted → qualified → won або lost. У lost лід можна перевести з
> будь-якого статусу.
>
> Кожну зміну статусу роблять лише через leaddesk_set_lead_status і тільки після підтвердження людини.
> Кожна зміна лишає запис в аудиті.

---

**5. Ми вже зателефонували в Rynok Books щодо заявки lead_0002. Переведи цей лід у статус contacted.**

Leaddesk [leaddesk_set_lead_status]

```
OUT
{"lead":{"id":"lead_0002","company":"Rynok Books","status":"contacted","source":"webinar","budget":500,"createdAt":"2026-09-13T00:52:02.043Z"},"audit":{"action":"lead.status_changed","leadId":"lead_0002","at":"2026-10-12T14:32:09.013Z","from":"new","to":"contacted","reason":"Команда зателефонувала клієнту щодо заявки — перший контакт відбувся"}}
```

> Лід lead_0002 (Rynok Books) тепер у статусі contacted, раніше був у new.
>
> Зміну записано в аудит 2026-10-12 о 14:32 UTC з причиною: «Команда зателефонувала клієнту щодо
> заявки — перший контакт відбувся».
>
> У статусі new тепер четверо: lead_0005 (Brick & Beam), lead_0004 і lead_0018 (обидва Green Leaf
> Market) та lead_0012 (Lviv Coffee Lab).

---

**6. Лід lead_0003 (Metro Logistics) відмовився: обрали іншу агенцію. Познач його як lost і вкажи причину.**

Leaddesk [leaddesk_set_lead_status]

```
OUT
{"lead":{"id":"lead_0003","company":"Metro Logistics","status":"lost","source":"facebook-ads","budget":10000,"createdAt":"2026-07-18T00:14:44.381Z"},"audit":{"action":"lead.status_changed","leadId":"lead_0003","at":"2026-10-12T14:32:17.155Z","from":"contacted","to":"lost","reason":"Клієнт відмовився: обрав іншу агенцію"}}
```

> lead_0003 (Metro Logistics) тепер у статусі lost, раніше був у contacted. Компанія збігається з тією,
> яку ви назвали.
>
> Зміну записано в аудит 2026-10-12 о 14:32 UTC з причиною: «Клієнт відмовився: обрав іншу агенцію».
>
> Бюджет цього ліда був 10 000. Це більше, ніж усі won-ліди разом (9 000), тож його, можливо, варто
> розібрати на ретро.
