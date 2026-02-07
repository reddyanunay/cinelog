# 🎬 CineLog - Social Movie Logging Platform

A modern, full-stack social movie logging application inspired by Letterboxd, built with Angular 18, Node.js, Express, MongoDB, and powered by The Movie Database (TMDB) API.

**Live Features**: Movie discovery, Instagram Reels-style feed, custom lists, watchlist management, reviews & ratings, and social profiles.

## ✨ Key Features

### 🎥 Movie Discovery & Browsing
- **Instagram Reels-Style Feed**: Vertical scrolling split-screen layout with movie trailers and details
- **Advanced Filters**: Search by genre, year, rating with real-time updates
- **Infinite Scroll**: Seamless movie browsing experience
- **Rich Movie Details**: Cast, crew, trailers, ratings, and comprehensive information

### 📚 Personal Collections
- **Custom Lists**: Create and organize movies into themed collections (public/private)
- **Watchlist System**: Default list for movies to watch later
- **Visual Feedback**: Instant UI updates when adding to lists
- **List Management**: Edit, delete, and share your collections

### ⭐ Reviews & Ratings
- **5-Star Rating System**: Rate movies you've watched
- **Written Reviews**: Share detailed thoughts about films
- **Watch Dates**: Track when you watched each movie
- **Review Management**: Edit or delete your reviews anytime

### 👤 User Profiles
- **Personal Dashboard**: View all logged movies with pagination
- **Statistics**: Track total movies logged and watchlist count
- **Activity History**: See your complete viewing history

### 🎨 Modern UX
- **Toast Notifications**: Non-blocking, beautiful success/error messages
- **Responsive Design**: Optimized for all screen sizes with Tailwind CSS
- **OnPush Change Detection**: Optimized performance
- **Smooth Animations**: Polished user experience throughout

## 📋 Project Structure

```
/Cinelog
  /server                    # Node.js/Express Backend
    /src
      /controllers           # Route handlers
      /models               # MongoDB schemas
      /routes               # API endpoints
      /middleware           # Auth & error handling
      /config               # Database configuration
  /client
    /cinelog-app           # Angular 18 Frontend
      /src
        /app
          /components       # UI components
          /services         # API & state management
          /guards           # Route protection
          /interceptors     # HTTP interceptors
          /pipes            # Custom pipes
        /environments       # Configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or cloud)
- TMDB API Key (free from https://www.themoviedb.org/settings/api)

### Backend Setup

1. Navigate to server folder:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the server directory:
```env
MONGO_URI=mongodb://localhost:27017/cinelog
JWT_SECRET=your_jwt_secret_key_change_this_in_production
PORT=3000
NODE_ENV=development
```

4. Ensure MongoDB is running locally or update `MONGO_URI` with your cloud database URL

5. Start the development server:
```bash
npm run dev
```

Server will be running on `http://localhost:3000`

**Available Scripts:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build

### Frontend Setup

1. Navigate to client folder:
```bash
cd client/cinelog-app
```

2. Install dependencies:
```bash
npm install
```

3. Get your free TMDB API key from [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)

4. Update `src/environments/environment.ts` with your API key:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  tmdbApiKey: 'YOUR_TMDB_API_KEY_HERE',
  tmdbBaseUrl: 'https://api.themoviedb.org/3'
};
```

5. Start the development server:
```bash
npm start
```

Frontend will be running on `http://localhost:4200`

**Available Scripts:**
- `npm start` - Start development server
- `ng build` - Build for production
- `ng test` - Run unit tests

## 📚 Database Schema

### User Collection
```typescript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required, validated),
  password: String (hashed with bcrypt),
  createdAt: Date,
  updatedAt: Date
}
```

### Review Collection
```typescript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  tmdbId: Number (required),
  movieTitle: String (required),
  posterPath: String,
  rating: Number (1-5, required),
  content: String (optional),
  watchedDate: Date (required),
  createdAt: Date,
  updatedAt: Date
}
// Compound index: { user: 1, tmdbId: 1 } (unique)
```

### List Collection
```typescript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  name: String (required),
  description: String,
  isPublic: Boolean (default: false),
  movies: [{
    tmdbId: Number (required),
    movieTitle: String (required),
    posterPath: String,
    addedAt: Date (default: Date.now)
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with JWT token

### Reviews (Protected)
- `POST /api/reviews` - Create a new review
- `GET /api/reviews` - Get all reviews for current user (paginated)
- `GET /api/reviews/movie/:tmdbId` - Get all reviews for a specific movie
- `DELETE /api/reviews/:id` - Delete a review
- `PUT /api/reviews/:id` - Update a review

### Lists (Protected)
- `POST /api/lists` - Create a new list
- `GET /api/lists` - Get all lists for current user (paginated)
- `GET /api/lists/:id` - Get a specific list by ID
- `PUT /api/lists/:id` - Update list details
- `DELETE /api/lists/:id` - Delete a list
- `POST /api/lists/:id/movies` - Add a movie to a list
- `DELETE /api/lists/:id/movies/:tmdbId` - Remove a movie from a list

### Watchlist (Deprecated - Now part of Lists)
- Watchlist is now implemented as a special default list named "Watchlist"

## 🛠️ Tech Stack

### Frontend
- **Angular 18** - Standalone components with OnPush change detection
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **RxJS** - Reactive programming with observables
- **Angular Router** - Client-side routing with guards
- **HTTP Interceptors** - JWT token management
- **Custom Pipes** - URL sanitization for YouTube embeds

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe backend development
- **Mongoose** - MongoDB object modeling
- **JWT** - Secure authentication
- **BCrypt** - Password hashing
- **Async/Await** - Error handling with custom middleware

### Database
- **MongoDB** - NoSQL document database
- **Mongoose ODM** - Schema validation and relationships

### External APIs
- **TMDB API** - Movie data, cast, crew, trailers, and images
  - Movies, TV shows, and people data
  - High-quality posters and backdrops
  - Video trailers and teasers
  - Credits and cast information

## 🎨 Application Features Overview

### Home Page (`/home`)
- **Trending Movies**: Current popular films
- **Discover**: Advanced filtering and search
- **Feed**: Instagram Reels-style vertical movie browser
  - Split-screen layout (60% trailer/poster, 40% details)
  - Movie trailers auto-loaded from YouTube
  - Watchlist and list actions directly in feed
  - Infinite scroll with pagination
- **Search**: Real-time movie search with debouncing

### Movie Details Page (`/movie/:id`)
- High-quality backdrop and poster images
- Complete movie information (runtime, release date, genres, overview)
- **Embedded YouTube trailer**
- **Cast section** with profile photos and character names
- **Crew section** with director and writers
- One-click logging with review modal
- Add to watchlist and custom lists

### Lists Page (`/lists`)
- Create new custom lists with name, description, and privacy settings
- **Default Watchlist** (blue highlighted, cannot be deleted)
- Grid view of all lists with movie counts
- View, edit, and delete custom lists
- Public/private list support

### Profile Page (`/profile`)
- User statistics (total movies logged, watchlist count)
- Grid view of all logged movies with posters
- Review details (rating, watched date, review text)
- Delete reviews functionality
- Pagination for large collections

## 🔑 Getting TMDB API Key

1. Visit [The Movie Database](https://www.themoviedb.org/)
2. Create a free account
3. Go to Settings → API
4. Request an API key (choose "Developer" option)
5. Copy your API key
6. Add it to `client/cinelog-app/src/environments/environment.ts`

**Note**: TMDB API is completely free for non-commercial use with generous rate limits.

## 📦 Production Build & Deployment

### Backend Deployment

1. Build TypeScript to JavaScript:
```bash
cd server
npm run build
```

2. Set production environment variables:
```env
MONGO_URI=your_production_mongodb_url
JWT_SECRET=strong_random_secret_for_production
PORT=3000
NODE_ENV=production
```

3. Start production server:
```bash
npm start
```

**Recommended Hosting**: Heroku, Railway, DigitalOcean, AWS EC2

### Frontend Deployment

1. Update production environment file:
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',
  tmdbApiKey: 'YOUR_TMDB_API_KEY',
  tmdbBaseUrl: 'https://api.themoviedb.org/3'
};
```

2. Build for production:
```bash
cd client/cinelog-app
ng build --configuration production
```

Built files will be in `dist/cinelog-app/browser/`

**Recommended Hosting**: Vercel, Netlify, Firebase Hosting, AWS S3 + CloudFront

### Database Setup

- **Development**: Local MongoDB installation
- **Production**: MongoDB Atlas (free tier available)
  1. Create cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  2. Whitelist your server's IP address
  3. Update `MONGO_URI` with connection string

## ✅ Completed Features

### Core Functionality
- ✅ User authentication (register, login, JWT tokens)
- ✅ Movie discovery with TMDB integration
- ✅ Instagram Reels-style feed with trailers
- ✅ Review and rating system (1-5 stars)
- ✅ Custom lists with public/private options
- ✅ Watchlist as default list
- ✅ User profiles with statistics
- ✅ Advanced search and filters
- ✅ Toast notification system
- ✅ Responsive design for all devices
- ✅ Protected routes with auth guards
- ✅ JWT token refresh and management
- ✅ Error handling and validation

### UI/UX Enhancements
- ✅ Split-screen feed layout with trailers
- ✅ Movie details with cast, crew, and trailers
- ✅ Visual feedback for all actions
- ✅ Smooth animations and transitions
- ✅ Pagination for lists and profiles
- ✅ Infinite scroll in feed
- ✅ Loading states and error messages

## 🚀 Future Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed future plans and upcoming features.

**Quick Preview:**
- Social features (collaborative lists, likes, comments)
- Enhanced user profiles with insights
- ML-powered recommendation system
- User-generated video content (Reels-style)
- Expansion to TV shows, music, and games
- Mobile applications

## 📊 Project Status

**Current Version**: 1.0.0  
**Status**: 🎉 Production Ready  
**Last Updated**: November 2025

### Build Status
- ✅ Backend: TypeScript compiled with 0 errors
- ✅ Frontend: Angular build successful
- ✅ Database: MongoDB connected
- ✅ API: All endpoints operational
- ✅ Tests: Core functionality verified

## 📖 Documentation

- [Quick Start Guide](./QUICKSTART.md) - Get up and running in 5 minutes
- [Implementation Details](./IMPLEMENTATION.md) - Technical deep dive
- [API Documentation](./DOCUMENTATION_INDEX.md) - Complete API reference
- [Future Roadmap](./ROADMAP.md) - Upcoming features and plans

## 🤝 Contributing

This project was developed as an academic assessment. For questions or suggestions, please refer to the documentation files.

## 📄 License

This project is developed for educational purposes.

## 🙏 Acknowledgments

- **TMDB API** for comprehensive movie data
- **MongoDB** for flexible database solution
- **Tailwind CSS** for rapid UI development

---

**Built with ❤️ for movie enthusiasts**
