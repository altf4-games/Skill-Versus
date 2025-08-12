import express from "express";
import { requireAuth } from "@clerk/express";
import TypingTextController from "../controllers/typingTextController.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/random", TypingTextController.getRandomTypingText);
router.get("/stats", TypingTextController.getTypingTextStats);
router.get("/", TypingTextController.getAllTypingTexts);
router.get("/:id", TypingTextController.getTypingTextById);

// Admin routes (authentication required)
router.post("/seed", requireAuth(), TypingTextController.seedTypingTexts);
router.post("/", requireAuth(), TypingTextController.createTypingText);
router.put("/:id", requireAuth(), TypingTextController.updateTypingText);
router.delete("/:id", requireAuth(), TypingTextController.deleteTypingText);

export default router;
