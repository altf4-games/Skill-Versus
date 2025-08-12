## ⚔️ **SkillVersus** – Real-Time 1v1 Skill Duels Platform

### 🎯 Core Concept

A web-based platform where students **challenge each other in 1v1 duels** across multiple domains (DSA, CSS, debugging, design, etc.) and **compete for leaderboard glory**.

> “Skill isn’t real unless you beat someone with it.” – you, probably.

---

### 🔧 Supported Skill Modes (examples):

| Mode                | Description                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| **DSA Duel**        | Both players get the same Leetcode-style problem. First to solve wins.             |
| **CSS Arena**       | Recreate a design (shown visually) under time pressure. Pixel diff decides winner. |
| **Debug Me**        | You're shown broken code. First to fix it with proper output wins.                 |
| **UI Trivia**       | Multiple-choice rounds on design principles, real-world UI fails.                  |
| **Git Bash Royale** | Terminal command challenges (basic Git tasks, Linux stuff).                        |

---

### 👇 How It Works:

1. **Create or accept a 1v1 challenge**
   - Choose skill area
   - Set difficulty
   - Invite friend or go public matchmaking
2. **Live Duel Room**
   - Countdown + split-screen code editor / design space
   - Timer
   - Auto-checker for solutions
3. **Result Reveal**
   - Win/Loss + XP + rating adjustment
   - Option to rematch or talk trash (via pre-set emojis/messages)
4. **Leaderboard**
   - Per-skill and global
   - Weekly top players
   - Campus/college-based filters

---

### 🔥 Additional Features:

- **Spectator Mode** – Watch top duels live
- **Ghost Mode** – Try to beat past winning solutions side-by-side
- **Rank Tiers** – Iron, Bronze, Silver, Gold, Platinum (yes, Valorant-style)
- **Skill Badges** – Win 5 CSS duels? Get “Flexbox Ninja”
- **Duels History** – Track your skill journey, losses, improvements
- **College Crews** – Join teams from your college and compete in inter-college ladders

---

### ✅ Why Gen Z Indian College Students Will Eat This Up

- Real-time = adrenaline = dopamine
- 1v1 format = ego fuel
- Perfect for streaming, screenshots, and college group chat flexes
- Works both as **fun** and **resume-friendly**
- Scalable to tournaments, internships, company challenges

---

### 🧱 MERN Implementation

- **MongoDB**: Users, match history, rankings, challenge templates
- **Express + Node**: Duel logic, code checker, timers, matchmaking
- **React**: Arena UI, lobby system, leaderboard views, profile pages
- **Socket.io**: Real-time duels + matchmaking
- **Optional Judges**: Use APIs to validate code output / pixel diffs / timer rules

---

### 🌱 MVP Scope

- DSA Duel + CSS Duel only to start
- Matchmaking + leaderboards
- Simple XP + Rank system
- Duel history log

---

## 💡 Twist Options (to keep it edgy):

- **"Roastable Replay"** – Losers can request anonymous peer feedback
- **Trash Talk Stickers** – Limited, voteable post-match taunts
- **Duels as Content** – Turn every match into a shareable summary card
- **Weekend Chaos Modes** – Time-based duels, random challenges, meme-themed design prompts

---

## TL;DR

> SkillVersus:
>
> A fast, fun, competitive 1v1 skill battle platform for DSA, CSS, and more.
>
> Real-time duels, leaderboards, bragging rights, and chaotic Gen Z energy — backed by actual skill growth.

# SRS

**Main Modes:**

- [ ] 1v1 LeetCode
- [ ] 1v1 Word Type
- [ ] 1v1 Debugging
- [ ] 1v1 CSS (Optional)
- [ ] Competitive Programming Contest

**Pages:**

- [ ] **Landing Page**
- [ ] **Signup / Login**
- [ ] **Dashboard**
- [ ] **Match Lobby** (select mode: LeetCode, Typing, Debugging, CSS, CP Contest)
- [ ] **Duel Room**
  - Code Editor View (LeetCode & Debugging)
  - Typing Test View
  - CSS Challenge View
- [ ] **Contest Arena** (for CP contest)
- [ ] **Leaderboard Page**
- [ ] **User Profile**
- [ ] **History / Results**

## API Endpoints

---

### Auth Endpoints

| Method | Endpoint           | Description                       |
| ------ | ------------------ | --------------------------------- |
| POST   | /api/auth/register | Register new user (via Clerk)     |
| POST   | /api/auth/login    | Authenticate user (OTP via Clerk) |

### User Endpoints

| Method | Endpoint          | Description        |
| ------ | ----------------- | ------------------ |
| GET    | /api/user/profile | Fetch user profile |

### Mode Endpoints

| Method | Endpoint   | Description          |
| ------ | ---------- | -------------------- |
| GET    | /api/modes | List available modes |

### Matchmaking Endpoints

| Method | Endpoint                | Description                        |
| ------ | ----------------------- | ---------------------------------- |
| POST   | /api/matchmaking/create | Create or join matchmaking session |
| GET    | /api/matchmaking/:id    | Get matchmaking status             |

### Duel Endpoints

| Method | Endpoint             | Description                 |
| ------ | -------------------- | --------------------------- |
| POST   | /api/duel/:id/start  | Initialize duel             |
| POST   | /api/duel/:id/submit | Submit duel result/solution |
| GET    | /api/duel/:id/result | Fetch duel outcome          |

### Leaderboard Endpoints

| Method | Endpoint               | Description               |
| ------ | ---------------------- | ------------------------- |
| GET    | /api/leaderboard       | Fetch global leaderboard  |
| GET    | /api/leaderboard/:mode | Fetch leaderboard by mode |

### History Endpoints

| Method | Endpoint     | Description             |
| ------ | ------------ | ----------------------- |
| GET    | /api/history | Fetch user duel history |

### Challenge Endpoints

| Method | Endpoint              | Description                     |
| ------ | --------------------- | ------------------------------- |
| GET    | /api/challenges/:mode | Fetch challenge data for a mode |

### Contest Endpoints

| Method | Endpoint                  | Description                    |
| ------ | ------------------------- | ------------------------------ |
| POST   | /api/contest/join         | Join CP contest                |
| GET    | /api/contest/:id/start    | Start contest (fetch problems) |
| POST   | /api/contest/:id/submit   | Submit CP contest solutions    |
| GET    | /api/contest/:id/rankings | Fetch contest rankings         |

---

### Data Schemas (MongoDB)

### User

```
{
  _id: ObjectId,
  clerkId: String,
  username: String,
  email: String,
  college: String,
  xp: Number,
  ranks: [ { mode: String, tier: String, points: Number } ],
  history: [ { duelId: ObjectId, mode: String, result: String, date: Date } ]
}
```

### Contest

```
{
  _id: ObjectId,
  participants: [ObjectId],
  problems: [ { id: String, description: String, tests: [] } ],
  submissions: [ { userId, problemId, code, time, correct } ],
  rankings: [ { userId, score, penalty } ],
  startTime: Date,
  endTime: Date
}
```

---

### Tech Stack

- **Frontend**: React, Redux or Context API, React Router, Socket.io-client, Monaco Editor (for code)
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB, Mongoose
- **Auth**: Clerk (email OTP auth)
- **Dev Tools**: ESLint, Prettier, Jest + supertest
- **CI/CD**: GitHub Actions, Docker
- **Hosting**: Heroku or Vercel (frontend), AWS / DigitalOcean (backend)
- **Code Execution**: Judge0 API
