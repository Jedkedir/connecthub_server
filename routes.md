# ConnectHub API Routes Reference

Base URL: `/api/v1`

## Common Notes

- Auth-required routes need header: `Authorization: Bearer <accessToken>`.
- Validation errors return `400` with:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "..."
  }
}
```

- General error format:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message"
  }
}
```

- Paginated endpoints usually return:

```json
{
  "data": [ ... ],
  "pageInfo": {
    "hasMore": true,
    "nextCursor": "..."
  }
}
```

## Health

### GET /health

- Description: Basic service health check.
- Expects: No body.
- Returns: `{ "status": "ok", "timestamp": "ISO date" }`.

## Auth

### POST /api/v1/auth/register

- Description: Creates a user account and returns auth tokens.
- Auth: Not required.
- Expects body:
  - `fullname` (string, alphanumeric, 3-30, required)
  - `email` (valid email, required)
  - `password` (string, 8-128, required)
  - `bio` (string, max 280, optional)
  - `profilePic` (valid URL, optional)
- Returns `201`:

```json
{
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### POST /api/v1/auth/login

- Description: Authenticates a user by email/password.
- Auth: Not required.
- Expects body:
  - `email` (valid email, required)
  - `password` (string, required)
- Returns `200`:

```json
{
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### POST /api/v1/auth/refresh

- Description: Issues new access/refresh tokens.
- Auth: Not required.
- Expects body:
  - `refreshToken` (string, required)
- Returns `200`:

```json
{
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### POST /api/v1/auth/change-password

- Description: Changes current user password and rotates tokens.
- Auth: Required.
- Expects body:
  - `currentPassword` (string, required)
  - `newPassword` (string, 8-128, required, must differ from currentPassword)
- Returns `200`:

```json
{
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

## Users

### GET /api/v1/users/me

- Description: Fetches currently authenticated user profile.
- Auth: Required.
- Expects: No body.
- Returns `200`: `{ "data": { "user": { ... } } }`.

### GET /api/v1/users/:id

- Description: Fetches a user profile by user id.
- Auth: Required.
- Expects path param:
  - `id` (Mongo ObjectId)
- Returns `200`: `{ "data": { "user": { ... } } }`.

### PUT /api/v1/users/update

- Description: Updates current user profile fields.
- Auth: Required.
- Expects body (at least one required):
  - `bio` (string, max 280, optional)
  - `profilePic` (valid URL, optional)
- Returns `200`: `{ "data": { "user": { ... } } }`.

## Posts and Interactions

### GET /api/v1/posts/bookmarks/me

- Description: Lists posts bookmarked by current user.
- Auth: Required.
- Expects query (optional):
  - `cursor` (string)
  - `limit` (integer 1-50)
- Returns `200`: paginated list of bookmarked posts.

### GET /api/v1/posts/liked/me

- Descripion: Lists posts liked by current user.
- Auth: Required.
- Expects query(optional):
  - `cursor` (string)
  - `limit` (integer 1-50)
- Returns `200`: paginated list of liked posts

### GET /api/v1/posts/user/:userId

- Description: Lists posts authored by a specific user.
- Auth: Required.
- Expects path param:
  - `userId` (user id)
- Expects query (optional):
  - `cursor` (string)
  - `limit` (integer 1-50)
- Returns `200`: paginated list of posts.

### POST /api/v1/posts

- Description: Creates a new post.
- Auth: Required.
- Expects body:
  - `content` (string, 1-2000, required)
  - `mediaUrls` (array of valid URLs, max 10, optional)
- Returns `201`: `{ "data": { "post": { ... } } }`.

### GET /api/v1/posts/:id

- Description: Gets a post by id (also increments view count).
- Auth: Required.
- Expects path param:
  - `id` (post id)
- Returns `200`: `{ "data": { "post": { ... } } }`.

### DELETE /api/v1/posts/:id

- Description: Deletes a post (owner only).
- Auth: Required.
- Expects path param:
  - `id` (post id)
- Returns `204` with no body.

### POST /api/v1/posts/:id/like

- Description: Likes a post.
- Auth: Required.
- Expects path param:
  - `id` (post id)
- Returns `200`: `{ "data": { "post": { ... } } }`.

### POST /api/v1/posts/:id/unlike

- Description: Removes current user like from a post.
- Auth: Required.
- Expects path param:
  - `id` (post id)
- Returns `200`: `{ "data": { "post": { ... } } }`.

### POST /api/v1/posts/:id/comments

- Description: Adds a comment to a post.
- Auth: Required.
- Expects path param:
  - `id` (post id)
- Expects body:
  - `content` (string, 1-1000, required)
- Returns `201`: `{ "data": { "comment": { ... } } }`.

### GET /api/v1/posts/:id/comments

- Description: Lists comments for a post.
- Auth: Required.
- Expects path param:
  - `id` (post id)
- Expects query (optional):
  - `cursor` (string)
  - `limit` (integer 1-50)
- Returns `200`: paginated list of comments.

### POST /api/v1/posts/:id/bookmark

- Description: Bookmarks a post.
- Auth: Required.
- Expects path param:
  - `id` (post id)
- Returns `200`: `{ "data": { "post": { ... } } }`.

### DELETE /api/v1/posts/:id/bookmark

- Description: Removes bookmark from a post.
- Auth: Required.
- Expects path param:
  - `id` (post id)
- Returns `200`: `{ "data": { "post": { ... } } }`.

## Feed

### GET /api/v1/feed/personalized

- Description: Feed from accounts the user follows.
- Auth: Required.
- Expects query (optional):
  - `cursor` (string)
  - `limit` (integer 1-50)
  - `q` (string, max 100)
- Returns `200`: paginated list of posts.

### GET /api/v1/feed/global

- Description: Global trending/recent feed.
- Auth: Required.
- Expects query (optional):
  - `cursor` (string)
  - `limit` (integer 1-50)
  - `q` (string, max 100)
- Returns `200`: paginated list of posts.

### GET /api/v1/feed/explore

- Description: Explore/search feed.
- Auth: Required.
- Expects query (optional):
  - `cursor` (string)
  - `limit` (integer 1-50)
  - `q` (string, max 100)
- Returns `200`: paginated list of posts.

## Follow

### POST /api/v1/follow/request

- Description: Sends a follow request to another user.
- Auth: Required.
- Expects body:
  - `targetUserId` (24-char hex ObjectId, required)
- Returns `201`: `{ "data": { "followRequest": { ... } } }`.

### POST /api/v1/follow/accept

- Description: Accepts a pending follow request.
- Auth: Required.
- Expects body:
  - `requesterId` (24-char hex ObjectId, required)
- Returns `200`: `{ "data": { "followRequest": { ... } } }`.

### POST /api/v1/follow/reject

- Description: Rejects a pending follow request.
- Auth: Required.
- Expects body:
  - `requesterId` (24-char hex ObjectId, required)
- Returns `200`: `{ "data": { "followRequest": { ... } } }`.

### POST /api/v1/follow/unfollow

- Description: Unfollows a user.
- Auth: Required.
- Expects body:
  - `targetUserId` (24-char hex ObjectId, required)
- Returns `200`: `{ "data": { ... } }`.

### GET /api/v1/follow/:id/followers

- Description: List of the followers of the user specified.
- Auth: Required.
- Expects params:
  - `id` (24-char hex ObjectId, required)
- Returns `200`: `{"data": { ... }}`

### GET /api/v1/follow/:id/following

- Description: List of user followed by the user specified.
- Auth: Required.
- Expects params:
  - `id` (24-char hex ObjectId, required)
- Returns `200`: `{"data": { ... }}`

## Notifications(Uses Socket.IO)

### GET /api/v1/notifications

- Description: Lists notifications for current user.
- Auth: Required.
- Expects query (optional):
  - `cursor` (string)
  - `limit` (integer 1-50)
- Returns `200`: paginated list of notifications.

### PATCH /api/v1/notifications/read-all

- Description: Marks all current user notifications as read.
- Auth: Required.
- Expects: No body.
- Returns `200`:

```json
{
  "data": {
    "modifiedCount": 0
  }
}
```

### PATCH /api/v1/notifications/:id/read

- Description: Marks one notification as read.
- Auth: Required.
- Expects path param:
  - `id` (notification id)
- Returns `200`: `{ "data": { "notification": { ... } } }`.
