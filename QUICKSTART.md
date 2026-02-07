# CineLog - Quick Start Guide

## 🎯 Project Status: Production Ready ✅

**All Features Complete:**
- ✅ User Authentication (Register & Login)
- ✅ Movie Discovery with TMDB Integration
- ✅ Instagram Reels-Style Feed
- ✅ Review & Rating System
- ✅ Custom Lists & Watchlist
- ✅ User Profiles with Statistics
- ✅ Toast Notifications

---

## 🚀 Getting Started (5 Minutes)

### Prerequisites
- **Node.js** v18+ ([Download](https://nodejs.org))
- **MongoDB** ([Local Setup](https://www.mongodb.com/docs/manual/installation/) or [MongoDB Atlas Cloud](https://www.mongodb.com/atlas))
- **TMDB API Key** (Free) - [Get it here](https://www.themoviedb.org/settings/api)

### Step 1: Clone/Open Project

```bash
cd e:\Career\Projects\Cinelog
```

### Step 2: Get TMDB API Key

1. Go to https://www.themoviedb.org/settings/api
2. Sign up (free) or log in
3. Create an API v3 key
4. Copy your key

### Step 3: Configure Frontend

Edit `client/cinelog-app/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  tmdbApiKey: 'YOUR_API_KEY_HERE',  // ← Paste your TMDB key here
  tmdbBaseUrl: 'https://api.themoviedb.org/3'
};
```

### Step 4: Start Backend

```bash
cd server
npm run dev
```

You should see:
```
✓ MongoDB connected successfully
🎬 CineLog Server running on http://localhost:3000
```

### Step 5: Start Frontend (New Terminal)

```bash
cd client/cinelog-app
ng serve --open
```

Angular will open at `http://localhost:4200` automatically.

---

## 🎬 Using the Application

### 1. **Create Your Account**
1. Open `http://localhost:4200` in your browser
2. Click **"Sign Up"** button
3. Fill in:
   - Username (unique)
   - Email address
   - Password (minimum 6 characters)
   - Confirm password
4. Click **"Sign Up"**
5. You'll be automatically logged in!

### 2. **Explore Movies**

**Home Page - Multiple Tabs:**
- **Trending**: Current popular movies
- **Discover**: Advanced filters (genre, year, rating)
- **Feed**: Instagram Reels-style vertical scroll with trailers
- **Search**: Find specific movies

**Try the Feed Tab:**
1. Click on **"Feed"** tab
2. Scroll vertically to browse movies
3. Watch trailers directly in the split-screen layout
4. Click **"Watchlist"** to save for later (button turns blue)
5. Click **"Log"** to rate and review

### 3. **Log Movies & Rate**
1. Click **"Log"** button on any movie
2. In the modal:
   - Rate the movie (1-5 stars)
   - Write a review (optional)
   - Set when you watched it
   - Add to watchlist or custom list (optional)
3. Click **"Submit Review"**
4. See success notification in top-right corner!

### 4. **Create Custom Lists**
1. Click **"Lists"** in the navigation
2. Click **"Create New List"**
3. Enter list name (e.g., "Sci-Fi Classics")
4. Add description (optional)
5. Choose public or private
6. Click **"Create List"**
7. Add movies from the home feed or movie details page

### 5. **View Your Profile**
1. Click **"Profile"** in navigation
2. See all your logged movies
3. View statistics (total movies, watchlist count)
4. Click any movie to see details or delete review

### 6. **Movie Details Page**
1. Click any movie poster or "View Details"
2. Watch the embedded trailer
3. See cast with photos
4. Read director and writers
5. View full movie information
6. Log, rate, or add to lists

---

## 📂 Project Structure

```
cine-log/
├── server/                    # Node.js Backend
│   ├── src/
│   │   ├── index.ts           # Main server file
│   │   ├── config/
│   │   │   └── database.ts    # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.ts        # User schema
│   │   │   └── Review.ts      # Review schema
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   └── reviewController.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   └── reviewRoutes.ts
│   │   └── middleware/
│   │       ├── errorHandler.ts
│   │       └── auth.ts        # JWT verification
│   ├── dist/                  # Compiled output
│   ├── .env                   # Environment variables
│   └── package.json
│
├── client/cinelog-app/        # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── home/      # Main page with movies
│   │   │   │   └── movie-card/
│   │   │   ├── services/
│   │   │   │   ├── auth.ts    # Auth logic
│   │   │   │   ├── tmdb.ts    # TMDB API calls
│   │   │   │   └── review.ts  # Review CRUD
│   │   │   ├── interceptors/
│   │   │   │   └── auth-interceptor.ts # JWT injection
│   │   │   ├── app.routes.ts
│   │   │   └── app.config.ts
│   │   ├── environments/
│   │   │   ├── environment.ts (DEV)
│   │   │   └── environment.prod.ts
│   │   └── styles.css         # Tailwind CSS
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── Steps.md                   # Original specification
└── README.md                  # Full documentation
```

---

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT token

### Reviews (Protected)
- `POST /api/reviews` - Create review
- `GET /api/reviews` - Get current user's reviews (paginated)
- `DELETE /api/reviews/:id` - Delete review

### Lists (Protected)
- `POST /api/lists` - Create new list
- `GET /api/lists` - Get user's lists (paginated)
- `GET /api/lists/:id` - Get specific list
- `POST /api/lists/:id/movies` - Add movie to list
- `DELETE /api/lists/:id/movies/:tmdbId` - Remove movie from list
- `DELETE /api/lists/:id` - Delete list

---

## 🛠️ Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://localhost:27017/cinelog
JWT_SECRET=your_secret_key_change_in_production
PORT=3000
NODE_ENV=development
```

### Frontend (environment.ts)
```typescript
apiUrl: 'http://localhost:3000/api'
tmdbApiKey: 'YOUR_KEY_FROM_TMDB'
tmdbBaseUrl: 'https://api.themoviedb.org/3'
```

---

## 🐛 Troubleshooting

### "MongoDB connection failed"
**Solution**: 
- Ensure MongoDB is running locally
- Or update `MONGO_URI` in `.env` with MongoDB Atlas cloud URL

### "Cannot find module '@angular/..'"
**Solution**: 
```bash
cd client/cinelog-app
npm install
```

### "TMDB API returns 401 Unauthorized"
**Solution**: 
- Verify your API key is correct in `src/environments/environment.ts`
- Get a new key from https://www.themoviedb.org/settings/api

### Movies not loading
**Solution**:
- Check console for errors (F12 → Console tab)
- Verify TMDB API key is set correctly
- Check network tab to see API responses

### "Port 3000 already in use"
**Solution** (Windows):
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Login not working
**Solution**:
- Check MongoDB is running
- Verify backend is running on port 3000
- Check browser console for errors
- Try registering a new account

---

## 🎯 What's Next?

### Explore All Features
- ✅ Try the Instagram Reels-style feed
- ✅ Create multiple custom lists
- ✅ Add movies to your watchlist
- ✅ Write detailed reviews
- ✅ Browse by genre and filters
- ✅ View comprehensive movie details

### Check Out the Documentation
- **README.md** - Complete project overview
- **PROJECT_SUMMARY.md** - Key features and innovations
- **FUTURE_PLANS.md** - Upcoming features roadmap
- **ASSESSMENT_GUIDE.md** - Presentation preparation

---

## 🎨 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 17+ (Standalone) |
| **Styling** | Tailwind CSS |
| **State Management** | RxJS BehaviorSubject |
| **Backend** | Node.js + Express.js |
| **Language** | TypeScript |
| **Database** | MongoDB + Mongoose |
| **Authentication** | JWT + BCrypt |
| **External API** | TMDB v3 REST API |

---

## 💡 Key Features Implemented

✅ User Authentication (Register & Login with JWT)  
✅ Instagram Reels-Style Feed with Trailers  
✅ Movie Discovery (Trending, Search, Filters)  
✅ Review & Rating System (1-5 stars)  
✅ Custom Lists (Public/Private)  
✅ Watchlist as Default List  
✅ User Profiles with Statistics  
✅ Movie Details (Cast, Crew, Trailers)  
✅ Toast Notifications (No Blocking Alerts)  
✅ Responsive Design (Mobile, Tablet, Desktop)  
✅ OnPush Change Detection (Optimized Performance)  
✅ Protected Routes with Auth Guards  
✅ Pagination & Infinite Scroll  
✅ Real-time Visual Feedback

---

## 📞 Support

- **TMDB API Docs**: https://developer.themoviedb.org/docs/getting-started
- **Angular Docs**: https://angular.dev
- **MongoDB Docs**: https://www.mongodb.com/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 🚀 Ready to Submit!

Your CineLog application is **production ready** with all features complete. 

For more details:
- **Full Documentation**: See README.md
- **Technical Details**: See IMPLEMENTATION.md
- **Presentation Guide**: See ASSESSMENT_GUIDE.md

---

**Last Updated**: November 25, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
