# Channel Gateway

Channel Gateway даёт один текстовый вход для Web, Telegram и будущих каналов. Канальный адаптер
преобразует вход платформы в `text`, `locale`, `timeZone` и `requestKey`. Gateway проверяет JWT,
и вызывает Conversation Service.

`POST /api/v1/conversations/messages` возвращает вопрос для уточнения или готовую карточку подтверждения.
`POST /api/v1/messages` остаётся временным совместимым маршрутом к Agent Runtime.

## Быстрый путь

1. Скопируйте `.env.example` в локальные переменные окружения.
2. Выполните команды проверки из README.
3. Запустите `pnpm dev`.
4. Проверьте `GET /health/live`.
