# Архитектура Freelance Radar

## Текущее состояние

Сейчас это статическое веб-приложение на GitHub Pages. Браузер загружает интерфейс и вызывает три публичных API. Отдельного backend, базы данных, фоновых задач и серверного кэша пока нет. Это дешёвая и простая схема для первой версии, но она не позволяет безопасно хранить секреты и подключать API, требующие ключ.

## Поток данных

1. index.html загружает css/app.css и js/app.js.
2. js/app.js вызывает loadAllJobs().
3. js/services/job-service.js запускает четыре адаптера параллельно через Promise.allSettled.
4. Каждый адаптер получает JSON и преобразует записи в общую модель через normalizeJob().
5. Сервис убирает дубликаты и сортирует вакансии по дате публикации.
6. UI показывает карточки, время публикации, источник и ссылку на оригинал. Отклики показываются только если они доступны из API; сейчас число откликов у источников отсутствует.

## Подключённые источники

- Remotive: https://remotive.com/api/remote-jobs?limit=100
- Remote OK: https://remoteok.com/api
- Arbeitnow: https://www.arbeitnow.com/api/job-board-api
- The Muse: https://www.themuse.com/api/public/jobs?page=0&descending=true

Условия использования, доступность и CORS могут меняться. В карточке обязательно оставлять источник и оригинальную ссылку. Публичные источники не означают полный охват всех сайтов с вакансиями.

## Рекомендуемая будущая архитектура backend

Backend пока не создан. Если появятся API-ключи, необходимость в частом кэше или пользователях, использовать serverless API (например, Cloudflare Workers) с небольшим кэшем и базой только при необходимости.

    backend/
    ├── src/
    │   ├── routes/
    │   │   ├── health.js
    │   │   └── jobs.js
    │   ├── providers/
    │   │   ├── remotive.js
    │   │   ├── remoteok.js
    │   │   └── arbeitnow.js
    │   ├── services/
    │   │   ├── aggregator.js
    │   │   └── cache.js
    │   ├── db/schema.sql
    │   └── index.js
    ├── tests/
    │   ├── providers.test.js
    │   └── aggregator.test.js
    └── wrangler.toml

Это целевая схема, а не уже существующий код. Не создавать пустые файлы backend до реализации и развёртывания.

## Контракт будущего API

GET /api/jobs?q=&source=&remote=&page=&limit= должен возвращать items, sources, page, limit и total. Поля вакансии: id, title, company, location, remote, publishedAt, salary, tags, source, sourceUrl и responsesCount. Если число откликов недоступно, responsesCount должно быть null.

## План работ

1. Проверить реальную загрузку всех трёх API из GitHub Pages на телефоне.
2. Добавить тесты нормализации, дедупликации и ошибок источников.
3. Добавлять источники только после проверки API, CORS и условий использования.
4. При необходимости добавить серверный кэш, мониторинг и пагинацию.
5. Отдельно вернуться к фрилансу после завершения раздела вакансий.
