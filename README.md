# Channel Gateway

Единый HTTP-вход для Web, Telegram и будущих каналов Portable Agent. Сервис принимает уже
нормализованный текст, проверяет JWT и передаёт новый диалоговый запрос в Conversation Service. Команду
из Widget SDK он передаёт в Action Service без изменения `actionId` и `payloadHash`. Gateway не
содержит правил Telegram, календаря или подтверждения действий. Старый прямой маршрут в Agent Runtime
временно сохранён для совместимости.

## Стек

TypeScript, Node.js 24, Fastify, JOSE, Zod, Vitest, ESLint и Prettier.

## Проверка

```bash
corepack enable
pnpm install
pnpm lint
pnpm test
pnpm build
```

Переменные запуска описаны в `.env.example`. Краткая ответственность сервиса хранится в
[`SERVICE.md`](SERVICE.md), устройство — в [`docs/architecture.md`](docs/architecture.md).

Обычные timeout остаются короткими. Верхний предел `AGENT_TIMEOUT_MS` и
`CONVERSATION_TIMEOUT_MS` допускает до 180 секунд только для ручного локального профиля с CPU-моделью;
production-значения должны определяться отдельным SLO.
