# Kibu Market

Kibu Market is a campus marketplace platform that helps students buy and sell items easily within their university community.

## Features

- User registration and login
- Product listing creation
- Browse available products
- Product details page
- Buyer and seller interaction
- Planned real-time chat
- Scalable backend structure

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB

## Folder Structure
```text
backend/   # server-side code
frontend/  # client-side code
```
##How to Run
1. Clone the repository
git clone https://github.com/Gilbert-Baraza/Kibu-market.git
cd Kibu-market
2. Backend setup
```
cd backend
npm install
```
Create a .env file:
```
 PORT= e.g 5000
 MONGO_URI=your_mongodb_connection_string
 JWT_SECRET=your_jwt_secret
 JWT_EXPIRES_IN=7d
```
Start backend:
```
npm run dev
```
4. Frontend setup
```
cd frontend
npm install
```
Create a .env file:
```
VITE_API_BASE_URL= Backend url
```
Start frontend:
```
npm run dev
```
