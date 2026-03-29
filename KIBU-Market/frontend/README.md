# Kibu Market Frontend

This frontend now expects a real backend API for products, authentication, messages, and uploads.

## Environment

Create a `.env` file from `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:4000/api
```

## Expected API surface

- `POST /auth/login`
- `POST /auth/signup`
- `GET /auth/me`
- `PATCH /users/me`
- `GET /products`
- `POST /products`
- `PATCH /products/:id`
- `DELETE /products/:id`
- `GET /threads`
- `POST /threads`
- `POST /threads/:id/messages`
- `POST /uploads`

The client accepts either top-level JSON entities or `{ data: ... }` wrappers, and it normalizes common field aliases such as `imageUrl`, `owner`, `body`, and `createdAt`.

## Upload contract

`POST /uploads` should accept multipart form data with a `file` field and return a URL in one of these shapes:

```json
{ "url": "https://cdn.example.com/file.jpg" }
```

```json
{ "data": { "url": "https://cdn.example.com/file.jpg" } }
```
