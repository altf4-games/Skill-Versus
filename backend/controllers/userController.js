import User from "../models/User.js";
import DuelHistory from "../models/DuelHistory.js";
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

// Friends functionality
export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        error: "Username required",
        message: "Please provide a username",
      });
    }

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        error: "User not found",
        message: "Please sync your account first",
      });
    }

    // Find the target user by username
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({
        error: "User not found",
        message: "No user found with that username",
      });
    }

    // Check if trying to add themselves
    if (currentUser._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({
        error: "Invalid request",
        message: "You cannot add yourself as a friend",
      });
    }

    // Check if already friends
    if (currentUser.isFriendWith(targetUser._id)) {
      return res.status(400).json({
        error: "Already friends",
        message: "You are already friends with this user",
      });
    }

    // Check if friend request already sent
    if (currentUser.hasSentFriendRequestTo(targetUser._id)) {
      return res.status(400).json({
        error: "Request already sent",
        message: "Friend request already sent to this user",
      });
    }

    // Check if there's already a pending request from the target user
    if (currentUser.hasReceivedFriendRequestFrom(targetUser._id)) {
      return res.status(400).json({
        error: "Pending request exists",
        message:
          "This user has already sent you a friend request. Check your pending requests.",
      });
    }

    // Add friend request
    currentUser.friendRequests.sent.push({
      to: targetUser._id,
      sentAt: new Date(),
    });

    targetUser.friendRequests.received.push({
      from: currentUser._id,
      sentAt: new Date(),
    });

    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      message: `Friend request sent to ${targetUser.username}`,
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to send friend request",
    });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { requestId } = req.body;

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        error: "User not found",
        message: "Please sync your account first",
      });
    }

    // Find the friend request
    const requestIndex = currentUser.friendRequests.received.findIndex(
      (req) => req._id.toString() === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        error: "Request not found",
        message: "Friend request not found",
      });
    }

    const request = currentUser.friendRequests.received[requestIndex];
    const requesterUser = await User.findById(request.from);

    if (!requesterUser) {
      return res.status(404).json({
        error: "User not found",
        message: "Requester user not found",
      });
    }

    // Add each other as friends
    currentUser.friends.push(requesterUser._id);
    requesterUser.friends.push(currentUser._id);

    // Remove the friend request from both users
    currentUser.friendRequests.received.splice(requestIndex, 1);

    const sentRequestIndex = requesterUser.friendRequests.sent.findIndex(
      (req) => req.to.toString() === currentUser._id.toString()
    );
    if (sentRequestIndex !== -1) {
      requesterUser.friendRequests.sent.splice(sentRequestIndex, 1);
    }

    await currentUser.save();
    await requesterUser.save();

    res.json({
      success: true,
      message: `You are now friends with ${requesterUser.username}`,
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to accept friend request",
    });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { requestId } = req.body;

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        error: "User not found",
        message: "Please sync your account first",
      });
    }

    // Find and remove the friend request
    const requestIndex = currentUser.friendRequests.received.findIndex(
      (req) => req._id.toString() === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        error: "Request not found",
        message: "Friend request not found",
      });
    }

    const request = currentUser.friendRequests.received[requestIndex];
    const requesterUser = await User.findById(request.from);

    // Remove from current user's received requests
    currentUser.friendRequests.received.splice(requestIndex, 1);

    // Remove from requester's sent requests
    if (requesterUser) {
      const sentRequestIndex = requesterUser.friendRequests.sent.findIndex(
        (req) => req.to.toString() === currentUser._id.toString()
      );
      if (sentRequestIndex !== -1) {
        requesterUser.friendRequests.sent.splice(sentRequestIndex, 1);
        await requesterUser.save();
      }
    }

    await currentUser.save();

    res.json({
      success: true,
      message: "Friend request rejected",
    });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to reject friend request",
    });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { friendId } = req.params;

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        error: "User not found",
        message: "Please sync your account first",
      });
    }

    const friendUser = await User.findById(friendId);
    if (!friendUser) {
      return res.status(404).json({
        error: "Friend not found",
        message: "Friend user not found",
      });
    }

    // Check if they are actually friends
    if (!currentUser.isFriendWith(friendId)) {
      return res.status(400).json({
        error: "Not friends",
        message: "You are not friends with this user",
      });
    }

    // Remove from both users' friends lists
    currentUser.friends = currentUser.friends.filter(
      (id) => id.toString() !== friendId
    );
    friendUser.friends = friendUser.friends.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await friendUser.save();

    res.json({
      success: true,
      message: `Removed ${friendUser.username} from friends`,
    });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to remove friend",
    });
  }
};

export const getFriends = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    const user = await User.findOne({ clerkId: userId }).populate(
      "friends",
      "username firstName lastName profileImage stats isOnline lastActive"
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "Please sync your account first",
      });
    }

    res.json({
      success: true,
      friends: user.friends.map((friend) => ({
        id: friend._id,
        username: friend.username,
        firstName: friend.firstName,
        lastName: friend.lastName,
        profileImage: friend.profileImage,
        stats: friend.stats,
        isOnline: friend.isOnline,
        lastActive: friend.lastActive,
      })),
    });
  } catch (error) {
    console.error("Error getting friends:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get friends",
    });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    const user = await User.findOne({ clerkId: userId })
      .populate(
        "friendRequests.received.from",
        "username firstName lastName profileImage"
      )
      .populate(
        "friendRequests.sent.to",
        "username firstName lastName profileImage"
      );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "Please sync your account first",
      });
    }

    res.json({
      success: true,
      received: user.friendRequests.received.map((req) => ({
        id: req._id,
        from: {
          id: req.from._id,
          username: req.from.username,
          firstName: req.from.firstName,
          lastName: req.from.lastName,
          profileImage: req.from.profileImage,
        },
        sentAt: req.sentAt,
      })),
      sent: user.friendRequests.sent.map((req) => ({
        id: req._id,
        to: {
          id: req.to._id,
          username: req.to.username,
          firstName: req.to.firstName,
          lastName: req.to.lastName,
          profileImage: req.to.profileImage,
        },
        sentAt: req.sentAt,
      })),
    });
  } catch (error) {
    console.error("Error getting friend requests:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get friend requests",
    });
  }
};

// Get user's duel history
export const getDuelHistory = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Find user to get their MongoDB ObjectId
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get duel type filter
    const duelType = req.query.duelType;
    const filter = { "participants.userId": user._id };
    if (duelType && ["coding", "typing"].includes(duelType)) {
      filter.duelType = duelType;
    }

    // Get duel history with pagination
    const duelHistory = await DuelHistory.find(filter)
      .populate("participants.userId", "username profileImage")
      .populate("winner.userId", "username profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await DuelHistory.countDocuments(filter);

    // Transform the data to include user's perspective
    const transformedHistory = duelHistory.map(duel => {
      const userParticipant = duel.participants.find(p =>
        p.userId._id.toString() === user._id.toString()
      );
      const opponent = duel.participants.find(p =>
        p.userId._id.toString() !== user._id.toString()
      );

      // Determine if user is winner - check both winner.userId and participant.isWinner
      const isWinnerByWinnerId = duel.winner.userId.toString() === user._id.toString();
      const isWinnerByParticipant = userParticipant?.isWinner === true;
      const isWinner = isWinnerByWinnerId || isWinnerByParticipant;

      return {
        _id: duel._id,
        duelType: duel.duelType,
        roomCode: duel.roomCode,
        isWinner: isWinner,
        opponent: {
          userId: opponent?.userId._id,
          username: opponent?.username,
          profileImage: opponent?.userId.profileImage,
        },
        userStats: {
          submissionResult: userParticipant?.submissionResult,
          typingStats: userParticipant?.typingStats,
        },
        opponentStats: {
          submissionResult: opponent?.submissionResult,
          typingStats: opponent?.typingStats,
        },
        completionReason: duel.completionReason,
        duration: duel.duration,
        problem: duel.problem,
        typingContent: duel.typingContent,
        createdAt: duel.createdAt,
      };
    });

    res.json({
      success: true,
      data: {
        duelHistory: transformedHistory,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting duel history:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to get duel history",
    });
  }
};
