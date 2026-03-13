import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import connectDB from "./db/connection.js";
import routes from "./routes/index.js";

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedFrontends = [process.env.FRONTEND_URL, "https://skill-versus.netlify.app", "http://localhost:5173"];
      
      // If it's localhost, allow any port during dev
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      
      if (allowedFrontends.includes(origin)) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Add Clerk middleware
app.use(clerkMiddleware());

// Routes
app.use("/api", routes);

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to SkillVersus API! ⚔️",
    version: "2.0.0",
    endpoints: {
      health: "/api/health",
      users: "/api/users",
      auth: "Protected by Clerk",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `The endpoint ${req.originalUrl} does not exist`,
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Global error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

export default app;
