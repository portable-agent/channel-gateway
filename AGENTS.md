# Памятка по Channel Gateway

Сначала прочитай `SERVICE.md`, README и ADR. Не меняй границу сервиса без нового ADR.

## Слои

- `controller` знает HTTP и вызывает один service;
- `service` готовит запрос для Agent Runtime;
- `client` содержит только HTTP-вызов Agent Runtime;
- `config` читает окружение и проверяет OIDC;
- `model` не зависит от Fastify.

Сервис stateless. Не добавляй repository без отдельного решения. Не переноси сюда правила Telegram,
календаря, approval или workflow.

## Стиль и TDD

- используй короткие английские имена: `message`, `text`, `context`, `result`;
- отступ — 4 пробела, Tab запрещён;
- сначала падающий тест, затем минимальный код и упрощение;
- не ослабляй coverage gate;
- перед PR запусти все команды из README.

Не добавляй секреты, настоящие токены и персональные данные. При изменении API сначала обнови
версионный контракт в `portable-agent/contracts`.
