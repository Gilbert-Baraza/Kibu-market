# Kibu Market Backend

## Setup

1. Make sure MongoDB is running locally or update `.env` with your hosted connection string.
2. Install dependencies:
   - `npm install`
3. Seed the database from `src/scripts/seedData.js`:
   - `npm run seed`
4. Start the development server:
   - `npm run dev`
5. Run the backend API test suite:
   - `npm test`

## Seeded accounts

- Seller accounts are generated from the product seller names.
- A shared buyer account is also created for seeded conversations.
- All seeded accounts use the password: `campus123`

## Environment variables

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- `TRUST_PROXY`
- `BODY_SIZE_LIMIT`
- `UPLOAD_MAX_BYTES`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`



## Media Storage

- Uploads now use Cloudinary automatically when `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set.
- `CLOUDINARY_FOLDER` is optional and defaults to `kibu-market`.
- If Cloudinary is not configured, the backend keeps using local `uploads/` storage so development still works without external credentials.
## Audit Logging

- The backend now emits structured audit log entries for sensitive actions such as login, profile updates, logout, and listing deletion.
- Audit entries are written to standard output as JSON-prefixed `console.info` lines so they can be picked up by process managers or centralized logging later.
## Tests

- The backend now includes API integration coverage for auth, listings, saved items, profile, and chat in `tests/api.test.js`.
- The suite uses `supertest` plus `mongodb-memory-server` so it runs against the real Express app without touching your development database.
- On the first test run, `mongodb-memory-server` may need to download a MongoDB binary, which can take a little while depending on your network.

## Main API routes

- `POST /api/auth/register`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `PATCH /api/users/me`
- `GET /api/users/me/dashboard`
- `POST /api/listings`
- `GET /api/listings`
- `GET /api/listings/:id`
- `PUT /api/listings/:id`
- `PATCH /api/listings/:id`
- `DELETE /api/listings/:id`
- `PATCH /api/listings/:id/sold`
- `POST /api/saved/:listingId`
- `DELETE /api/saved/:listingId`
- `GET /api/saved`
- `POST /api/chat/start/:listingId`
- `GET /api/chat/conversations`
- `GET /api/chat/conversations/:conversationId`
- `GET /api/chat/conversations/:conversationId/messages`
- `POST /api/chat/conversations/:conversationId/messages`
- `PATCH /api/chat/conversations/:conversationId/read`
- `POST /api/uploads`

## Compatibility aliases

These are also exposed to match the current frontend integration:

- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id`
- `GET /api/threads`
- `POST /api/threads`
- `POST /api/threads/:conversationId/messages`

