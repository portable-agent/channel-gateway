# Архитектура

```text
Web / Telegram adapter
        -> controller
        -> MessageService
        -> ConversationService
        -> ConversationClient
        -> Conversation Service
```

## Слои

- `controller` проверяет HTTP-формат и Bearer JWT;
- `service` передаёт нормализованное сообщение без правил канала;
- `client` вызывает закреплённый API Conversation Service;
- `config` проверяет переменные окружения и OIDC;
- `model` содержит простые внутренние типы и типы, созданные из OpenAPI.

Сервис stateless и не имеет базы. `requestKey` передаётся в Conversation Service внутри сообщения.
Conversation Service хранит состояние диалога, а Action Service отвечает за долговременную
идемпотентность действия. Старый `/api/v1/messages` пока вызывает Agent Runtime напрямую и будет удалён
только в следующей major-версии.

## Токен

Gateway проверяет подпись, issuer, audience `channel-gateway`, срок действия, `sub` и `tenant_id`. В
локальном срезе тот же токен передаётся Conversation Service, который независимо требует свою audience.
Перед подключением внешнего identity provider нужен отдельный выбор token exchange.
