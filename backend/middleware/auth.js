import { requireAuth, getAuth } from "@clerk/express";

// Middleware to require authentication
export { requireAuth };

// Middleware to get auth info (use this to access user data in controllers)
export { getAuth };
