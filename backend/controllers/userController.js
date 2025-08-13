import User from "../models/User.js";
import { clerkClient, getAuth } from "@clerk/express";

// Get or create user from Clerk data
export const syncUser = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Get user data from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    // Check if user already exists in our database
    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      // Create new user with Clerk data
      user = new User({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        username: clerkUser.username || `user_${userId.slice(-8)}`,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        profileImage: clerkUser.imageUrl,
      });

      await user.save();
    } else {
      // Update existing user with latest Clerk data
      user.email = clerkUser.emailAddresses[0]?.emailAddress || user.email;
      user.firstName = clerkUser.firstName || user.firstName;
      user.lastName = clerkUser.lastName || user.lastName;
      user.profileImage = clerkUser.imageUrl || user.profileImage;
      user.lastActive = new Date();

      await user.save();
    }

    res.json({
      success: true,
      message: "User synchronized successfully",
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        stats: user.stats,
        bio: user.bio,
        winRate: user.winRate,
      },
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to sync user data",
    });
  }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "Please sync your account first",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        stats: user.stats,
        bio: user.bio,
        winRate: user.winRate,
        isOnline: user.isOnline,
        lastActive: user.lastActive,
      },
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get user data",
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { username, firstName, lastName, bio } = req.body;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "Please sync your account first",
      });
    }

    // Check if username is already taken (if provided and different)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({
        username,
        clerkId: { $ne: userId },
      });
      if (existingUser) {
        return res.status(400).json({
          error: "Username taken",
          message: "This username is already in use",
        });
      }
      user.username = username;
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        stats: user.stats,
        bio: user.bio,
        winRate: user.winRate,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update profile",
    });
  }
};

// Get user by username or ID
export const getUserProfile = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Try to find by username first, then by MongoDB ID
    let user = await User.findOne({ username: identifier });
    if (!user) {
      user = await User.findById(identifier);
    }

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "No user found with that identifier",
      });
    }

    // Return public profile (without sensitive data)
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        stats: user.stats,
        bio: user.bio,
        winRate: user.winRate,
        isOnline: user.isOnline,
        lastActive: user.lastActive,
      },
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get user profile",
    });
  }
};

// Get leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Only sort by global XP
    const users = await User.find({})
      .select("username firstName lastName profileImage stats bio")
      .sort({ "stats.xp": -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await User.countDocuments({});

    res.json({
      success: true,
      leaderboard: users.map((user, index) => ({
        rank: skip + index + 1,
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        stats: user.stats,
        bio: user.bio,
        winRate: user.winRate,
      })),
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        limit: limitNum,
        totalUsers: total,
      },
    });
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get leaderboard",
    });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: "Invalid query",
        message: "Search query must be at least 2 characters long",
      });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    const users = await User.find({
      $or: [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
      ],
    })
      .select("username firstName lastName profileImage stats")
      .limit(parseInt(limit));

    res.json({
      success: true,
      users: users.map((user) => ({
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        stats: user.stats,
        college: user.college,
        winRate: user.winRate,
      })),
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to search users",
    });
  }
};

// Update user online status
export const updateOnlineStatus = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { isOnline } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        isOnline: Boolean(isOnline),
        lastActive: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "Please sync your account first",
      });
    }

    res.json({
      success: true,
      message: "Online status updated",
      isOnline: user.isOnline,
    });
  } catch (error) {
    console.error("Error updating online status:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update online status",
    });
  }
};
