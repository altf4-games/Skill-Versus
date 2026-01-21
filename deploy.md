# Deployment & Local Setup Guide

This guide provides detailed instructions on how to set up, deploy, and run the Skill Versus application locally. It covers all necessary components: Frontend, Backend, Database, Cache, and the Code Execution Engine (Judge0).

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:

*   **Node.js**: v18 or higher recommended.
*   **Docker & Docker Compose**: Required for running Judge0 and Redis easily.
*   **Git**: Version control.
*   **MongoDB**: Can be running locally or use a cloud provider like MongoDB Atlas.

## 2. Infrastructure Setup (Judge0 & Redis)

The easiest way to set up the infrastructure is using Docker.

### Redis
You need a running Redis instance for the backend to handle job queues and real-time leaderboards.
```bash
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

### Judge0 (Code Execution Engine)
Skill Versus relies on Judge0 for executing user code securely.

**Quick Start with Docker:**
```bash
wget https://github.com/judge0/judge0/releases/download/v1.13.0/judge0-v1.13.0.zip
unzip judge0-v1.13.0.zip
cd judge0-v1.13.0
docker-compose up -d db redis
sleep 10s
docker-compose up -d
```
*Note: This will start Judge0 on `http://localhost:2358` by default.*

## 3. Backend Setup

The backend handles API requests, authentication, and communication with Judge0.

### Installation
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Configuration
Create a `.env` file in the `backend` directory based on the example below.

**File:** `backend/.env`

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `PORT` | Port for the backend server | `3000` |
| `MONGODB_URI` | Connection string for MongoDB | `mongodb://localhost:27017/skillversus` |
| `CLERK_PUBLISHABLE_KEY` | Clerk Auth Public Key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk Auth Secret Key | `sk_test_...` |
| `FRONTEND_URL` | URL of the frontend for CORS | `http://localhost:5173` |
| `JUDGE0_BASE_URL` | URL of your Judge0 instance | `http://localhost:2358` |
| `NODE_ENV` | Environment mode | `development` |

### Running the Backend
Start the backend server:
```bash
npm run dev
```
The server should start on port 3000 (or your specified PORT).

## 4. Frontend Setup

The frontend is a React application built with Vite.

### Installation
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Configuration
Create a `.env` file in the `frontend` directory.

**File:** `frontend/.env`

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Auth Public Key | `pk_test_...` |
| `VITE_API_URL` | URL of your backend API | `http://localhost:3000` |

### Running the Frontend
Start the development server:
```bash
npm run dev
```
Open your browser to the URL shown (usually `http://localhost:5173`).

## 5. Removing the "End of Service" Screen

By default, the application may show an "End of Service" message. To remove this screen and access the full application:

1.  Open `frontend/src/App.jsx`.
2.  Locate the `SHOW_END_OF_SERVICE` constant at the top of the file (around line 32).
3.  Change its value from `true` to `false`:

    ```javascript
    // Before
    const SHOW_END_OF_SERVICE = true;

    // After
    const SHOW_END_OF_SERVICE = false;
    ```
4.  Save the file. The application will automatically reload and show the main interface.

## 6. Troubleshooting

*   **Judge0 Connection Error**: Ensure the `JUDGE0_BASE_URL` in your backend `.env` matches the URL where Judge0 is running. If running in Docker, you might need to use the host network IP if `localhost` fails inside a container.
*   **CORS Issues**: Make sure `FRONTEND_URL` in backend `.env` matches exactly where your frontend is running.
*   **Database Connection**: Ensure your MongoDB instance is running and the URI is correct.
