# Архитектура

```text
Web / Telegram adapter
        -> controller
        -> MessageService
        -> AgentClient
        -> Agent Runtime
```

## Слои

- `controller` проверяет HTTP-формат и Bearer JWT;
- `service` добавляет список разрешённых коннекторов из конфигурации;
- `client` вызывает закреплённый API Agent Runtime;
- `config` проверяет переменные окружения и OIDC;
- `model` содержит простые внутренние типы и типы, созданные из OpenAPI.

Сервис stateless и не имеет базы. `requestKey` передаётся вниз как заголовок для связи запросов. За
долговременную идемпотентность действия отвечает Action Service, а не входной Gateway.

## Токен

Gateway проверяет подпись, issuer, audience `channel-gateway`, срок действия, `sub` и `tenant_id`. В
первом локальном срезе тот же токен передаётся Agent Runtime, который независимо требует свою audience.
Перед подключением внешнего identity provider нужен отдельный выбор token exchange.
