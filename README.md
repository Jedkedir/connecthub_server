# ConnectHub Backend

ConnectHub is a production-ready REST API backend for a social media platform built with Node.js, Express, MongoDB, Mongoose, JWT authentication, and a clean MVC plus service layer architecture.

## Features

- JWT access and refresh token authentication
- Register, login, refresh token, and change password
- User profiles, profile updates, and public user lookup
- Posts with media URLs, counters, and indexed author queries
- Likes, comments, and bookmarks with duplicate prevention
- Follow requests, accept/reject flow, and unfollow
- Personalized, global trending, and explore feeds
- Cursor-based pagination
- Joi request validation
- Centralized JSON logging
- Security middleware, rate limiting, NoSQL injection sanitization, and global error handling
- Docker and seed script included

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

## Seed Data

Start MongoDB, then run:

```bash
npm run seed
```

Seeded users use password `Password123!`.

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

Posts:

- `POST /api/v1/posts`
- `GET /api/v1/posts/:id`
- `DELETE /api/v1/posts/:id`
- `GET /api/v1/posts/user/:userId`

Interactions:

- `POST /api/v1/posts/:id/like`
- `POST /api/v1/posts/:id/unlike`
- `POST /api/v1/posts/:id/comment`
- `GET /api/v1/posts/:id/comments`
- `POST /api/v1/posts/:id/bookmark`
- `DELETE /api/v1/posts/:id/bookmark`
- `GET /api/v1/posts/bookmarks/me`

Follow:

- `POST /api/v1/follow/request`
- `POST /api/v1/follow/accept`
- `POST /api/v1/follow/reject`
- `POST /api/v1/follow/unfollow`

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
