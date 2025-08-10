import app from "./app.js";
import dotenv from "dotenv";
import { createServer } from "http";
import SocketManager from "./middleware/socketManager.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket
const socketManager = new SocketManager(server);

// Make socket manager available globally
app.set("socketManager", socketManager);

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server is ready for real-time communication`);
});
