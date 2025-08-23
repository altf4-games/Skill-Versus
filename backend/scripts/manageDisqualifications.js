#!/usr/bin/env node

/**
 * Anti-Cheat Disqualification Management Script
 * 
 * This script allows administrators to manage user disqualifications
 * for contests and duels.
 * 
 * Usage:
 *   node manageDisqualifications.js list <contestId>
 *   node manageDisqualifications.js disqualify <contestId> <userId> <reason>
 *   node manageDisqualifications.js remove <contestId> <userId>
 *   node manageDisqualifications.js clear <contestId>
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import redisContestUtils from '../utils/redisContestUtils.js';
import User from '../models/User.js';
import Contest from '../models/Contest.js';
import mongoose from 'mongoose';
import { connectRedis } from '../db/connection.js';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skill-versus');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Connect to Redis
async function connectToRedis() {
  try {
    await connectRedis();
    await redisContestUtils.init();
    console.log('✅ Connected to Redis');
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    process.exit(1);
  }
}

// List all disqualified users for a contest
async function listDisqualified(contestId) {
  try {
    console.log(`\n📋 Disqualified users for contest: ${contestId}`);
    console.log('=' .repeat(60));

    const disqualifiedUserIds = await redisContestUtils.getDisqualifiedUsers(contestId);
    
    if (disqualifiedUserIds.length === 0) {
      console.log('No disqualified users found.');
      return;
    }

    for (const userId of disqualifiedUserIds) {
      const user = await User.findById(userId).select('username firstName lastName');
      const disqualificationData = await redisContestUtils.getUserDisqualificationData(contestId, userId);
      
      console.log(`\n👤 User: ${user?.username || 'Unknown'} (${user?.firstName} ${user?.lastName})`);
      console.log(`   ID: ${userId}`);
      console.log(`   Reason: ${disqualificationData?.reason || 'Unknown'}`);
      console.log(`   Type: ${disqualificationData?.violationType || 'Unknown'}`);
      console.log(`   Time: ${disqualificationData?.timestamp || 'Unknown'}`);
      console.log(`   Virtual: ${disqualificationData?.isVirtual ? 'Yes' : 'No'}`);
    }
  } catch (error) {
    console.error('❌ Error listing disqualified users:', error);
  }
}

// Disqualify a user
async function disqualifyUser(contestId, userId, reason) {
  try {
    console.log(`\n⚠️  Disqualifying user ${userId} from contest ${contestId}`);
    
    // Verify contest exists
    const contest = await Contest.findById(contestId);
    if (!contest) {
      console.error('❌ Contest not found');
      return;
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found');
      return;
    }

    // Check if already disqualified
    const isAlreadyDisqualified = await redisContestUtils.isUserDisqualified(contestId, userId);
    if (isAlreadyDisqualified) {
      console.log('⚠️  User is already disqualified');
      return;
    }

    // Disqualify the user
    await redisContestUtils.disqualifyUser(contestId, userId, {
      reason: reason,
      timestamp: new Date(),
      violationType: 'MANUAL_ADMIN_ACTION',
      isVirtual: false
    });

    console.log(`✅ Successfully disqualified user: ${user.username}`);
    console.log(`   Reason: ${reason}`);
  } catch (error) {
    console.error('❌ Error disqualifying user:', error);
  }
}

// Remove disqualification
async function removeDisqualification(contestId, userId) {
  try {
    console.log(`\n🔄 Removing disqualification for user ${userId} from contest ${contestId}`);
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found');
      return;
    }

    // Check if user is disqualified
    const isDisqualified = await redisContestUtils.isUserDisqualified(contestId, userId);
    if (!isDisqualified) {
      console.log('ℹ️  User is not disqualified');
      return;
    }

    // Remove disqualification
    await redisContestUtils.removeUserDisqualification(contestId, userId);

    console.log(`✅ Successfully removed disqualification for user: ${user.username}`);
  } catch (error) {
    console.error('❌ Error removing disqualification:', error);
  }
}

// Clear all disqualifications for a contest
async function clearAllDisqualifications(contestId) {
  try {
    console.log(`\n🧹 Clearing all disqualifications for contest ${contestId}`);
    
    const disqualifiedUserIds = await redisContestUtils.getDisqualifiedUsers(contestId);
    
    if (disqualifiedUserIds.length === 0) {
      console.log('No disqualifications to clear.');
      return;
    }

    console.log(`Found ${disqualifiedUserIds.length} disqualified users. Clearing...`);

    for (const userId of disqualifiedUserIds) {
      await redisContestUtils.removeUserDisqualification(contestId, userId);
    }

    console.log(`✅ Successfully cleared all disqualifications`);
  } catch (error) {
    console.error('❌ Error clearing disqualifications:', error);
  }
}

// Show help
function showHelp() {
  console.log(`
🛠️  Anti-Cheat Disqualification Management Script

Usage:
  node manageDisqualifications.js <command> [arguments]

Commands:
  list <contestId>                    - List all disqualified users for a contest
  disqualify <contestId> <userId> <reason> - Disqualify a user from a contest
  remove <contestId> <userId>         - Remove disqualification for a user
  clear <contestId>                   - Clear all disqualifications for a contest
  help                               - Show this help message

Examples:
  node manageDisqualifications.js list 507f1f77bcf86cd799439011
  node manageDisqualifications.js disqualify 507f1f77bcf86cd799439011 507f191e810c19729de860ea "Cheating detected"
  node manageDisqualifications.js remove 507f1f77bcf86cd799439011 507f191e810c19729de860ea
  node manageDisqualifications.js clear 507f1f77bcf86cd799439011
`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help') {
    showHelp();
    return;
  }

  await connectDB();
  await connectToRedis();

  const command = args[0];
  
  try {
    switch (command) {
      case 'list':
        if (args.length < 2) {
          console.error('❌ Contest ID required');
          showHelp();
          return;
        }
        await listDisqualified(args[1]);
        break;
        
      case 'disqualify':
        if (args.length < 4) {
          console.error('❌ Contest ID, User ID, and reason required');
          showHelp();
          return;
        }
        await disqualifyUser(args[1], args[2], args.slice(3).join(' '));
        break;
        
      case 'remove':
        if (args.length < 3) {
          console.error('❌ Contest ID and User ID required');
          showHelp();
          return;
        }
        await removeDisqualification(args[1], args[2]);
        break;
        
      case 'clear':
        if (args.length < 2) {
          console.error('❌ Contest ID required');
          showHelp();
          return;
        }
        await clearAllDisqualifications(args[1]);
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
main().catch(console.error);
