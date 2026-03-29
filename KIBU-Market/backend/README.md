# Kibu Market Backend

## Setup

1. Make sure MongoDB is running locally or update `.env` with your hosted connection string.
2. Install dependencies:
   - `npm install`
3. Seed the database from `frontend/src/data/products.js`:
   - `npm run seed`
4. Start the development server:
   - `npm run dev`

## Seeded accounts

- Seller accounts are generated from the product seller names.
- A shared buyer account is also created for seeded conversations.
- All seeded accounts use the password: `campus123`

## Environment variables

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`

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