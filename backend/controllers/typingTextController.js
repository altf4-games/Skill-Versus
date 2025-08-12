import TypingText from "../models/TypingText.js";
import { typingTexts } from "../utils/typingTexts.js";

class TypingTextController {
  // Seed database with initial typing texts
  static async seedTypingTexts(req, res) {
    try {
      // Check if typing texts already exist
      const existingCount = await TypingText.countDocuments();
      if (existingCount > 0) {
        return res.json({
          message: `Database already contains ${existingCount} typing texts`,
          seeded: false,
        });
      }

      // Convert utility texts to database format with calculated metadata
      const textsToInsert = typingTexts.map((text) => {
        const words = text.text.split(/\s+/).filter((word) => word.length > 0);
        return {
          text: text.text,
          difficulty: text.difficulty,
          category: text.category,
          words: words,
          totalWords: words.length,
          avgWordLength:
            words.reduce((sum, word) => sum + word.length, 0) / words.length,
          isActive: true,
        };
      });

      // Insert all texts
      const insertedTexts = await TypingText.insertMany(textsToInsert);

      res.status(201).json({
        message: `Successfully seeded ${insertedTexts.length} typing texts`,
        seeded: true,
        count: insertedTexts.length,
      });
    } catch (error) {
      console.error("Seed typing texts error:", error);
      res.status(500).json({
        error: "Failed to seed typing texts",
        message: error.message,
      });
    }
  }

  // Get all typing texts with optional filtering
  static async getAllTypingTexts(req, res) {
    try {
      const { difficulty, category, isActive = true } = req.query;
      const query = {};

      if (difficulty) query.difficulty = difficulty;
      if (category) query.category = category;
      if (isActive !== undefined) query.isActive = isActive === "true";

      const typingTexts = await TypingText.find(query)
        .sort({ difficulty: 1, category: 1, createdAt: -1 })
        .select("-__v");

      res.json({
        typingTexts,
        count: typingTexts.length,
      });
    } catch (error) {
      console.error("Get typing texts error:", error);
      res.status(500).json({
        error: "Failed to fetch typing texts",
        message: error.message,
      });
    }
  }

  // Get a random typing text
  static async getRandomTypingText(req, res) {
    try {
      const { difficulty, category } = req.query;

      const typingText = await TypingText.getRandomText(difficulty, category);

      if (!typingText) {
        return res.status(404).json({
          error: "No typing texts found matching criteria",
        });
      }

      res.json({
        typingText: typingText.getFormattedData(),
      });
    } catch (error) {
      console.error("Get random typing text error:", error);
      res.status(500).json({
        error: "Failed to get random typing text",
        message: error.message,
      });
    }
  }

  // Get typing text by ID
  static async getTypingTextById(req, res) {
    try {
      const { id } = req.params;

      const typingText = await TypingText.findById(id);

      if (!typingText) {
        return res.status(404).json({
          error: "Typing text not found",
        });
      }

      res.json({
        typingText: typingText.getFormattedData(),
      });
    } catch (error) {
      console.error("Get typing text by ID error:", error);
      res.status(500).json({
        error: "Failed to get typing text",
        message: error.message,
      });
    }
  }

  // Create new typing text (admin only)
  static async createTypingText(req, res) {
    try {
      const { text, difficulty, category } = req.body;

      if (!text || !difficulty || !category) {
        return res.status(400).json({
          error: "Text, difficulty, and category are required",
        });
      }

      const typingText = new TypingText({
        text: text.trim(),
        difficulty,
        category: category.trim(),
        createdBy: req.auth?.userId
          ? await getUserIdFromClerkId(req.auth.userId)
          : null,
      });

      await typingText.save();

      res.status(201).json({
        message: "Typing text created successfully",
        typingText: typingText.getFormattedData(),
      });
    } catch (error) {
      console.error("Create typing text error:", error);
      res.status(500).json({
        error: "Failed to create typing text",
        message: error.message,
      });
    }
  }

  // Update typing text (admin only)
  static async updateTypingText(req, res) {
    try {
      const { id } = req.params;
      const { text, difficulty, category, isActive } = req.body;

      const typingText = await TypingText.findById(id);

      if (!typingText) {
        return res.status(404).json({
          error: "Typing text not found",
        });
      }

      // Update fields if provided
      if (text !== undefined) typingText.text = text.trim();
      if (difficulty !== undefined) typingText.difficulty = difficulty;
      if (category !== undefined) typingText.category = category.trim();
      if (isActive !== undefined) typingText.isActive = isActive;

      await typingText.save();

      res.json({
        message: "Typing text updated successfully",
        typingText: typingText.getFormattedData(),
      });
    } catch (error) {
      console.error("Update typing text error:", error);
      res.status(500).json({
        error: "Failed to update typing text",
        message: error.message,
      });
    }
  }

  // Delete typing text (admin only)
  static async deleteTypingText(req, res) {
    try {
      const { id } = req.params;

      const typingText = await TypingText.findById(id);

      if (!typingText) {
        return res.status(404).json({
          error: "Typing text not found",
        });
      }

      await TypingText.findByIdAndDelete(id);

      res.json({
        message: "Typing text deleted successfully",
      });
    } catch (error) {
      console.error("Delete typing text error:", error);
      res.status(500).json({
        error: "Failed to delete typing text",
        message: error.message,
      });
    }
  }

  // Get typing text statistics
  static async getTypingTextStats(req, res) {
    try {
      const stats = await TypingText.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalTexts: { $sum: 1 },
            totalUsage: { $sum: "$usageCount" },
            avgWordLength: { $avg: "$avgWordLength" },
            avgTotalWords: { $avg: "$totalWords" },
            difficultyBreakdown: {
              $push: {
                difficulty: "$difficulty",
                category: "$category",
              },
            },
          },
        },
      ]);

      const difficultyStats = await TypingText.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$difficulty",
            count: { $sum: 1 },
            totalUsage: { $sum: "$usageCount" },
          },
        },
      ]);

      const categoryStats = await TypingText.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            totalUsage: { $sum: "$usageCount" },
          },
        },
      ]);

      res.json({
        overall: stats[0] || {},
        byDifficulty: difficultyStats,
        byCategory: categoryStats,
      });
    } catch (error) {
      console.error("Get typing text stats error:", error);
      res.status(500).json({
        error: "Failed to get typing text statistics",
        message: error.message,
      });
    }
  }
}

// Helper function to get user ID from Clerk ID
async function getUserIdFromClerkId(clerkId) {
  try {
    const User = (await import("../models/User.js")).default;
    const user = await User.findOne({ clerkId });
    return user?._id || null;
  } catch (error) {
    console.error("Error getting user ID from Clerk ID:", error);
    return null;
  }
}

export default TypingTextController;
