# Runbook

## Сервис не запускается

1. Проверьте обязательные переменные из `.env.example`.
2. Проверьте доступность OIDC JWKS URL из контейнера.
3. Проверьте, что `AGENT_URL` является внутренним адресом Agent Runtime.
4. Выполните `GET /health/live`.

## Клиент получает 401

Проверьте подпись, issuer, срок действия и audience `channel-gateway`. Не печатайте токен в лог.

## Клиент получает 502

Проверьте health Agent Runtime, сетевой маршрут и timeout. Тело внутренней ошибки Agent Runtime намеренно
не возвращается клиенту.

## Контракт изменился

Сначала выпустите совместимую версию в `portable-agent/contracts`. Затем выполните
`pwsh ./scripts/update-contracts.ps1 -Version X.Y.Z`, проверьте diff и запустите все тесты.
