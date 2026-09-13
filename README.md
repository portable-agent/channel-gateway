# Channel Gateway

Единый HTTP-вход для Web, Telegram и будущих каналов Portable Agent. Сервис принимает уже
нормализованный текст, проверяет JWT и передаёт запрос в Agent Runtime. Он не содержит правил Telegram,
календаря или подтверждения действий.

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
