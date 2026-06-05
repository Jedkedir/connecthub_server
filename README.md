# ConnectHub Backend

ConnectHub is a production-ready REST API backend for a social media platform built with Node.js, Express, MongoDB, Mongoose, JWT authentication, and a clean MVC plus service layer architecture.

## Features

- JWT access and refresh token authentication
- Register, login, refresh token, and change password
- User profiles, profile updates, and public user lookup
- Posts with media URLs, counters, and indexed author queries
- Likes, comments, and bookmarks with duplicate prevention
- Follow requests, accept/reject flow, and unfollow
- Event-driven notifications for likes, comments, follow requests, and accepted follows
- Optional Socket.IO real-time notification delivery
- Personalized, global trending, and explore feeds
- Cursor-based pagination
- Joi request validation
- Centralized JSON logging
- Security middleware, rate limiting, NoSQL injection sanitization, and global error handling
- Docker support included

## Setup

```bash
npm install
copy .env.example .env
npm start
```

Update `.env` with strong JWT secrets before running in production.

## Development

```bash
npm run dev
```

## Docker

```bash
copy .env.example .env
docker compose up --build
```

For Docker, set `MONGODB_URI=mongodb://mongo:27017/connecthub` in `.env`.

## API Prefix

All routes are mounted under:

```text
/api/v1
```

Health check:

```text
GET /health
```

## Main Endpoints

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/change-password`

Users:

- `GET /api/v1/users/me`
- `GET /api/v1/users/:id`
- `PUT /api/v1/users/update`
- `GET /api/v1/users/search` (query)
- `GET /api/v1/users/search/username/:username`

Posts:

- `POST /api/v1/posts`
- `GET /api/v1/posts/:id`
- `DELETE /api/v1/posts/:id`
- `GET /api/v1/posts/user/:userId`
- `GET /api/v1/posts/liked/me`

Interactions:

- `POST /api/v1/posts/:id/like`
- `POST /api/v1/posts/:id/unlike`
- `POST /api/v1/posts/:id/comment`
- `GET /api/v1/posts/:id/comments`
- `POST /api/v1/posts/:id/bookmark`
- `DELETE /api/v1/posts/:id/bookmark`
- `GET /api/v1/posts/bookmarks/me`
- `GET /api/v1/posts/:id/comments` (paginated)
- `GET /api/v1/posts/comments/:commentId/replies`
- `POST /api/v1/posts/comments/:commentId/like`
- `POST /api/v1/posts/comments/:commentId/unlike`
- `PUT /api/v1/posts/comments/:commentId` (update comment)
- `DELETE /api/v1/posts/comments/:commentId` (delete comment)

Follow:

- `POST /api/v1/follow/request`
- `POST /api/v1/follow/accept`
- `POST /api/v1/follow/reject`
- `POST /api/v1/follow/unfollow`
- `GET /api/v1/follow/:id/followers`
- `GET /api/v1/follow/:id/following`

Notifications:

- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/read-all`
- `DELETE /api/v1/notifications/:id`

Feed:

- `GET /api/v1/feed/personalized`
- `GET /api/v1/feed/global`
- `GET /api/v1/feed/explore`

## Error Format

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message"
  }
}
```

## Real-Time Notifications

Socket.IO is attached to the HTTP server. Clients can join their user room with:

```js
const socket = io("http://localhost:5000", {
  query: { userId: "<authenticated-user-id>" },
});

socket.on("notification", (notification) => {
  console.log(notification);
});
```

## Code Structure

The backend source lives under `src/`. Key folders and responsibilities:

- `config/` — environment and database configuration (e.g. `env.js`, `database.js`).
- `controllers/` — Express route handlers that orchestrate requests and responses.
- `routes/` — route definitions and API wiring (mounted under `/api/v1`).
- `services/` — business logic and transactional workflows.
- `repositories/` — data access layer (Mongoose queries and helpers).
- `models/` — Mongoose schema and model definitions.
- `validators/` — Joi request validation schemas used by the `validate` middleware.
- `middleware/` — authentication, error handling, security, and validation middleware.
- `loaders/` — application and Socket.IO bootstrap helpers.
- `events/` — simple event bus for decoupled notification publishing.
- `utils/` — shared helpers (errors, pagination, tokens, logging, etc.).

## Validators

Request validation schemas are implemented with Joi and can be found in `src/validators/`.
Notable files include:

- `authValidators.js`
- `userValidators.js`
- `postValidators.js`
- `feedValidators.js`
- `followValidators.js`
- `commonValidators.js`

These schemas are applied via the `validate` middleware to ensure consistent request shape before controller logic runs.
