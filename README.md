# Book Review API

A RESTful API for managing books and reviews with JWT authentication.

## Features

- User authentication (signup/login)
- CRUD operations for books and reviews
- Pagination and filtering
- Search functionality
- One review per user per book restriction

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd book-review-api
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env
```

4. Update `.env` with your values:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/book-review-api
JWT_SECRET=your-super-secret-jwt-key-here
```

5. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

## Database Schema

### User
- `username` (String, unique, required)
- `email` (String, unique, required)
- `password` (String, hashed, required)

### Book
- `title` (String, required)
- `author` (String, required)
- `genre` (String, required)
- `description` (String, required)
- `createdBy` (ObjectId, ref: User)

### Review
- `book` (ObjectId, ref: Book)
- `user` (ObjectId, ref: User)
- `rating` (Number, 1-5, required)
- `comment` (String, required)
- Unique constraint: one review per user per book

## API Endpoints

### Authentication

#### Signup
```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Books

#### Add Book (Authenticated)
```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "genre": "Fiction",
    "description": "A classic American novel"
  }'
```

#### Get All Books (with pagination and filters)
```bash
# Basic
curl http://localhost:3000/books

# With pagination
curl "http://localhost:3000/books?page=1&limit=5"

# With filters
curl "http://localhost:3000/books?author=Fitzgerald&genre=Fiction"
```

#### Get Book Details
```bash
# With reviews pagination
curl "http://localhost:3000/books/BOOK_ID?page=1&limit=5"
```

#### Submit Review (Authenticated)
```bash
curl -X POST http://localhost:3000/books/BOOK_ID/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rating": 5,
    "comment": "Excellent book!"
  }'
```

### Reviews

#### Update Review (Authenticated)
```bash
curl -X PUT http://localhost:3000/reviews/REVIEW_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rating": 4,
    "comment": "Updated review"
  }'
```

#### Delete Review (Authenticated)
```bash
curl -X DELETE http://localhost:3000/reviews/REVIEW_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Search

#### Search Books
```bash
curl "http://localhost:3000/search?q=gatsby"
```

## Design Decisions

1. **MongoDB with Mongoose**: Chosen for flexibility and ease of use with Node.js
2. **JWT Authentication**: Stateless authentication suitable for REST APIs
3. **One Review Per User Per Book**: Enforced using compound unique index
4. **Pagination**: Implemented for better performance with large datasets
5. **Case-insensitive Search**: Used regex with 'i' flag for better user experience
6. **Password Hashing**: Using bcryptjs for secure password storage

## Error Handling

The API returns consistent error responses:
```json
{
  "error": "Error message",
  "errors": ["Validation error array"] // for validation errors
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error
