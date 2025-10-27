# Skill Versus ⚔️

A competitive 1v1 coding platform where developers battle in real-time algorithmic duels, contests, and typing challenges.

## ✨ Features

- **Real-Time Duels** - Live 1v1 coding battles with instant feedback
- **Contests** - Participate in timed competitive programming contests
- **Practice Mode** - Sharpen your skills with curated problems
- **Ranking System** - Climb from Iron to Platinum through skill-based matches
- **Leaderboard** - Track your progress and compete globally
- **Typing Challenges** - Speed typing battles for developers
- **Anti-Cheat System** - Fair play enforcement with fullscreen monitoring

## 🖼️ Screenshots

![Landing Page](assets/Screenshot%202025-10-27%20173533.png)
_Landing page with game modes and features_

![Dashboard](assets/Screenshot%202025-10-27%20173541.png)
_User dashboard with stats and recent activity_

![Duels Page](assets/Screenshot%202025-10-27%20173549.png)
_1v1 duel matchmaking and history_

![Practice](assets/Screenshot%202025-10-27%20173601.png)
_Practice problem catalog_

![Contests](assets/Screenshot%202025-10-27%20173607.png)
_Live and upcoming contests_

![Leaderboard](assets/Screenshot%202025-10-27%20173615.png)
_Global rankings and statistics_

![Profile](assets/Screenshot%202025-10-27%20173621.png)
_User profile and progress tracking_

## 🚀 Tech Stack

**Frontend:**

- React 19 + Vite
- TailwindCSS 4
- Monaco Editor
- Socket.io Client
- Clerk Authentication

**Backend:**

- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- Redis (for real-time features)
- Judge0 API (code execution)

## 📦 Installation

### Prerequisites

- Node.js 18+
- MongoDB
- Redis (optional, for real-time features)

### Backend Setup

```bash
cd backend
npm install
cp sample.env .env
# Configure your .env file
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
# Create .env.local file
cp .env.local.example .env.local
# Add your Clerk publishable key and API URL
npm run dev
```

## 🎮 Game Modes

- **DSA Duel** - Algorithmic problem-solving battles
- **Typing Duel** - Word typing duels
- **CP Contest** - Competitive programming contests with anti-cheat

## 🏆 Ranking System

Progress through 5 tiers based on XP and performance:

- Iron
- Bronze
- Silver
- Gold
- Platinum

## 🔧 Development

```bash
# Run backend
npm run dev

# Run frontend
npm run dev

# Grant contest admin rights
npm run contest-admin
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---
