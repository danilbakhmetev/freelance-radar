# Freelance Radar

Мобильный веб-сервис для поиска вакансий из нескольких публичных источников. Сейчас проект — статический фронтенд на GitHub Pages. Реального backend-сервера и базы данных пока нет.

## Ссылки и запуск

- Сайт: https://danilbakhmetev.github.io/freelance-radar/
- Репозиторий: https://github.com/danilbakhmetev/freelance-radar
- Публикация: GitHub Pages из ветки main, корневая папка.
- Для разработки достаточно редактировать файлы прямо в GitHub с телефона. Изменения в main публикуются автоматически, но иногда требуется подождать обновления Pages.

## Структура

    freelance-radar/
    ├── index.html
    ├── css/
    │   └── app.css
    ├── js/
    │   ├── app.js
    │   └── services/
    │       ├── job-service.js
    │       └── sources/
    │           ├── remotive.js
    │           ├── remoteok.js
    │           ├── arbeitnow.js
│           └── themuse.js
    ├── docs/
    │   └── ARCHITECTURE.md
    └── README.md

### Назначение файлов

- index.html — только семантическая разметка и подключения CSS/JS.
- css/app.css — оформление, карточки, мобильная адаптивность и безопасные отступы iPhone.
- js/app.js — состояние интерфейса, отображение карточек, поиск, фильтры, избранное, настройки и сообщения об ошибках.
- js/services/job-service.js — запускает источники параллельно, нормализует общие поля, удаляет дубликаты, сортирует по дате.
- js/services/sources/remotive.js — загрузчик Remotive.
- js/services/sources/remoteok.js — загрузчик Remote OK.
- js/services/sources/arbeitnow.js — загрузчик Arbeitnow.
- js/services/sources/themuse.js — загрузчик The Muse.
- docs/ARCHITECTURE.md — схема потока данных, ограничения и план backend.

## Как менять проект

- Дизайн и адаптивность: css/app.css.
- Тексты и поведение интерфейса: js/app.js.
- Добавить источник: создать адаптер в js/services/sources/ и зарегистрировать его в SOURCES в js/services/job-service.js.
- Исправить поля конкретного API: файл его адаптера и normalizeJob() в js/services/job-service.js.
- Менять схему backend и контракт API: docs/ARCHITECTURE.md.

## Источники

1. Remotive: https://remotive.com/api/remote-jobs?limit=100
2. Remote OK: https://remoteok.com/api
3. Arbeitnow: https://www.arbeitnow.com/api/job-board-api
4. The Muse: https://www.themuse.com/api/public/jobs?page=0&descending=true

Remotive, Remote OK и Arbeitnow доступны через публичные endpoint без ключа; у The Muse есть публичный endpoint для пробного использования, но для длительного/расширенного доступа может потребоваться регистрация приложения. Это не все вакансии интернета. У других сайтов могут быть закрытые/платные API, ограничения на перепубликацию или отсутствие доступа из браузера. У каждого источника есть отдельный адаптер, а ошибка одного не должна мешать двум другим. Ссылку на оригинальное объявление и название источника нужно сохранять в карточке. Для Remotive данные могут задерживаться примерно на 24 часа; обновлять этот API слишком часто не нужно.

## Модель вакансии

Адаптеры приводят записи к единой форме: id, title, company, pay, desc, tags, remote, url, source, location, published, responses. Время публикации отображается по данным API. Если источник не предоставляет достоверное число откликов, UI показывает «нет данных», а не выдуманное значение.

## Важные ограничения безопасности

- Всё в GitHub Pages публично. Не класть API-ключи, пароли и секреты в js/.
- Для закрытых API, секретов, надёжного кэша, регулярного обновления и пользовательских аккаунтов потребуется backend/serverless API.
- Использовать только HTTPS-ссылки на вакансии.
- После подключения нового источника проверять сайт на опубликованной версии: успешный commit не доказывает, что API доступен из браузера (CORS, лимиты и изменения API могут мешать).
- Не добавлять фиктивные вакансии в реальную ленту.
