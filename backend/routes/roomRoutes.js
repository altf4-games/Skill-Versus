import express from "express";
import RoomController from "../controllers/roomController.js";

const router = express.Router();

// Room management routes
router.post("/", RoomController.createRoom); // Create room
router.get("/", RoomController.getRooms); // Get all rooms (with filters)
router.get("/:roomId", RoomController.getRoom); // Get specific room
router.put("/:roomId", RoomController.updateRoom); // Update room (host only)
router.delete("/:roomId", RoomController.deleteRoom); // Delete room (host only)

// Room participation routes
router.post("/:roomId/join", RoomController.joinRoom); // Join room
router.post("/:roomId/leave", RoomController.leaveRoom); // Leave room
router.post("/:roomId/ready", RoomController.toggleReady); // Toggle ready status
router.post("/:roomId/start", RoomController.startRoom); // Start room (host only)

// Chat routes
router.post("/:roomId/chat", RoomController.addChatMessage); // Send chat message

export default router;
