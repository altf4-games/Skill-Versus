import express from "express";
import * as practiceController from "../controllers/practiceController.js";

const router = express.Router();

// Get available programming languages (anonymous access)
router.get("/languages", practiceController.getLanguages);

// Execute code in practice mode (anonymous access)
router.post("/execute", practiceController.executeCode);

export default router;
