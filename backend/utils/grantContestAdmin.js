#!/usr/bin/env node

/**
 * Utility script to grant contestAdmin flag to users
 * Usage: node grantContestAdmin.js <clerkUserId>
 * Example: node grantContestAdmin.js user_2abc123def456
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

async function grantContestAdmin(clerkUserId) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find user by Clerk ID
    const user = await User.findOne({ clerkId: clerkUserId });
    
    if (!user) {
      console.error(`❌ User not found with Clerk ID: ${clerkUserId}`);
      console.log("Make sure the user has signed up and synced with the platform first.");
      return false;
    }

    // Check if already admin
    if (user.contestAdmin) {
      console.log(`✅ User ${user.username} (${user.email}) is already a contest admin`);
      return true;
    }

    // Grant admin privileges
    user.contestAdmin = true;
    await user.save();

    console.log(`🎉 Successfully granted contest admin privileges to:`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Clerk ID: ${user.clerkId}`);
    console.log(`   User ID: ${user._id}`);
    
    return true;

  } catch (error) {
    console.error("❌ Error granting contest admin privileges:", error.message);
    return false;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

async function revokeContestAdmin(clerkUserId) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find user by Clerk ID
    const user = await User.findOne({ clerkId: clerkUserId });
    
    if (!user) {
      console.error(`❌ User not found with Clerk ID: ${clerkUserId}`);
      return false;
    }

    // Check if not admin
    if (!user.contestAdmin) {
      console.log(`ℹ️ User ${user.username} (${user.email}) is not a contest admin`);
      return true;
    }

    // Revoke admin privileges
    user.contestAdmin = false;
    await user.save();

    console.log(`🔒 Successfully revoked contest admin privileges from:`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Clerk ID: ${user.clerkId}`);
    
    return true;

  } catch (error) {
    console.error("❌ Error revoking contest admin privileges:", error.message);
    return false;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

async function listContestAdmins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all contest admins
    const admins = await User.find({ contestAdmin: true })
      .select("username email clerkId createdAt")
      .sort({ createdAt: -1 });

    if (admins.length === 0) {
      console.log("📝 No contest admins found");
      return;
    }

    console.log(`📋 Found ${admins.length} contest admin(s):`);
    console.log("─".repeat(80));
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.username} (${admin.email})`);
      console.log(`   Clerk ID: ${admin.clerkId}`);
      console.log(`   Joined: ${admin.createdAt.toLocaleDateString()}`);
      console.log("");
    });

  } catch (error) {
    console.error("❌ Error listing contest admins:", error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("🏆 Contest Admin Management Utility");
    console.log("═".repeat(50));
    console.log("");
    console.log("Usage:");
    console.log("  Grant admin:   node grantContestAdmin.js grant <clerkUserId>");
    console.log("  Revoke admin:  node grantContestAdmin.js revoke <clerkUserId>");
    console.log("  List admins:   node grantContestAdmin.js list");
    console.log("");
    console.log("Examples:");
    console.log("  node grantContestAdmin.js grant user_2abc123def456");
    console.log("  node grantContestAdmin.js revoke user_2abc123def456");
    console.log("  node grantContestAdmin.js list");
    console.log("");
    process.exit(1);
  }

  const command = args[0].toLowerCase();
  
  switch (command) {
    case "grant":
      if (args.length < 2) {
        console.error("❌ Please provide a Clerk User ID");
        console.log("Usage: node grantContestAdmin.js grant <clerkUserId>");
        process.exit(1);
      }
      const grantSuccess = await grantContestAdmin(args[1]);
      process.exit(grantSuccess ? 0 : 1);
      
    case "revoke":
      if (args.length < 2) {
        console.error("❌ Please provide a Clerk User ID");
        console.log("Usage: node grantContestAdmin.js revoke <clerkUserId>");
        process.exit(1);
      }
      const revokeSuccess = await revokeContestAdmin(args[1]);
      process.exit(revokeSuccess ? 0 : 1);

    case "list":
      await listContestAdmins();
      process.exit(0);
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log("Available commands: grant, revoke, list");
      process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
