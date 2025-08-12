# Typing Texts System

The typing texts system has been refactored from static utility files to MongoDB storage for better management and scalability.

## Overview

- **Model**: `TypingText` - MongoDB model for storing typing texts
- **Controller**: `TypingTextController` - Handles CRUD operations and seeding
- **Routes**: `/api/typing-texts/*` - RESTful API endpoints
- **Utility**: `getRandomTypingText()` - Now fetches from MongoDB with fallback

## Database Schema

```javascript
{
  text: String,           // The typing text content
  difficulty: String,     // "easy", "medium", "hard"
  category: String,       // Category like "programming", "literature", etc.
  words: [String],        // Array of words (auto-generated)
  totalWords: Number,     // Total word count (auto-generated)
  avgWordLength: Number,  // Average word length (auto-generated)
  isActive: Boolean,      // Whether text is active for use
  usageCount: Number,     // How many times this text has been used
  createdBy: ObjectId,    // User who created this text (optional)
  createdAt: Date,        // Creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

## API Endpoints

### Public Endpoints
- `GET /api/typing-texts/random` - Get random typing text
  - Query params: `difficulty`, `category`
- `GET /api/typing-texts/stats` - Get usage statistics
- `GET /api/typing-texts/` - Get all typing texts
  - Query params: `difficulty`, `category`, `isActive`
- `GET /api/typing-texts/:id` - Get specific typing text

### Admin Endpoints (require authentication)
- `POST /api/typing-texts/seed` - Seed database with initial texts
- `POST /api/typing-texts/` - Create new typing text
- `PUT /api/typing-texts/:id` - Update typing text
- `DELETE /api/typing-texts/:id` - Delete typing text

## Setup Instructions

1. **Seed the database** (run once):
   ```bash
   curl -X POST http://localhost:3000/api/typing-texts/seed \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Verify seeding**:
   ```bash
   curl http://localhost:3000/api/typing-texts/stats
   ```

## Usage in Code

### Socket Manager (Typing Duels)
```javascript
// Automatically uses MongoDB with fallback
const typingContent = await getRandomTypingText(difficulty);
```

### Frontend API Calls
```javascript
// Get random text for practice
const response = await fetch('/api/typing-texts/random?difficulty=medium');
const { typingText } = await response.json();
```

## Features

### Automatic Metadata Generation
- Words array is automatically generated from text
- Total word count calculated
- Average word length computed

### Usage Tracking
- Each text tracks how many times it's been used
- Helps identify popular content

### Fallback System
- If MongoDB is unavailable, falls back to static data
- Ensures system reliability

### Flexible Filtering
- Filter by difficulty: easy, medium, hard
- Filter by category: programming, literature, science, etc.
- Active/inactive status management

## Migration Notes

- Static `typingTexts` array is now private (not exported)
- `getRandomTypingText()` is now async
- Maintains backward compatibility with fallback system
- All existing functionality preserved

## Admin Management

Admins can:
- Add new typing texts via API
- Update existing texts
- Deactivate inappropriate content
- View usage statistics
- Manage categories and difficulties

## Performance Considerations

- MongoDB queries are indexed on difficulty and category
- Random selection uses efficient skip() method
- Usage counts updated asynchronously
- Fallback system prevents blocking on database issues
