#!/usr/bin/env node

/**
 * Problem Management Script
 * 
 * This script allows administrators to manage problem settings,
 * particularly the contest-only flag for problems.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import mongoose from 'mongoose';
import Problem from '../models/Problem.js';

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

// List all problems with their contest-only status
async function listProblems() {
  try {
    console.log('\n📋 Problem List:\n');
    
    const problems = await Problem.find({}, {
      title: 1,
      difficulty: 1,
      isContestOnly: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });
    
    if (problems.length === 0) {
      console.log('No problems found.');
      return;
    }
    
    console.log('ID'.padEnd(25) + 'Title'.padEnd(40) + 'Difficulty'.padEnd(12) + 'Contest Only');
    console.log('─'.repeat(85));
    
    problems.forEach(problem => {
      const id = problem._id.toString().substring(0, 24);
      const title = problem.title.length > 38 ? problem.title.substring(0, 35) + '...' : problem.title;
      const difficulty = problem.difficulty || 'Easy';
      const contestOnly = problem.isContestOnly ? '✅ Yes' : '❌ No';
      
      console.log(
        id.padEnd(25) + 
        title.padEnd(40) + 
        difficulty.padEnd(12) + 
        contestOnly
      );
    });
    
    console.log(`\nTotal: ${problems.length} problems`);
    
  } catch (error) {
    console.error('❌ Error listing problems:', error.message);
    throw error;
  }
}

// Set a problem as contest-only
async function setContestOnly(problemId) {
  try {
    const problem = await Problem.findById(problemId);
    
    if (!problem) {
      console.log(`❌ Problem with ID ${problemId} not found.`);
      return;
    }
    
    if (problem.isContestOnly) {
      console.log(`ℹ️  Problem "${problem.title}" is already marked as contest-only.`);
      return;
    }
    
    await Problem.findByIdAndUpdate(problemId, { isContestOnly: true });
    
    console.log(`✅ Problem "${problem.title}" has been marked as contest-only.`);
    console.log('   This problem will no longer appear in duels or practice mode.');
    
  } catch (error) {
    console.error('❌ Error setting contest-only flag:', error.message);
    throw error;
  }
}

// Remove contest-only flag from a problem
async function unsetContestOnly(problemId) {
  try {
    const problem = await Problem.findById(problemId);
    
    if (!problem) {
      console.log(`❌ Problem with ID ${problemId} not found.`);
      return;
    }
    
    if (!problem.isContestOnly) {
      console.log(`ℹ️  Problem "${problem.title}" is already available for all modes.`);
      return;
    }
    
    await Problem.findByIdAndUpdate(problemId, { isContestOnly: false });
    
    console.log(`✅ Problem "${problem.title}" is now available for all modes.`);
    console.log('   This problem will appear in duels, practice mode, and contests.');
    
  } catch (error) {
    console.error('❌ Error removing contest-only flag:', error.message);
    throw error;
  }
}

// Show help
function showHelp() {
  console.log('\n🛠️  Problem Management Script\n');
  console.log('Usage:');
  console.log('  node scripts/manageProblems.js <command> [arguments]\n');
  console.log('Commands:');
  console.log('  list                           List all problems with their contest-only status');
  console.log('  set-contest-only <problemId>   Mark a problem as contest-only');
  console.log('  unset-contest-only <problemId> Remove contest-only flag from a problem');
  console.log('  help                           Show this help message\n');
  console.log('Examples:');
  console.log('  node scripts/manageProblems.js list');
  console.log('  node scripts/manageProblems.js set-contest-only 507f1f77bcf86cd799439011');
  console.log('  node scripts/manageProblems.js unset-contest-only 507f1f77bcf86cd799439011\n');
  console.log('💡 Tip: Use the list command to find problem IDs');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }
  
  try {
    await connectDB();
    
    const command = args[0];
    
    switch (command) {
      case 'list':
        await listProblems();
        break;
        
      case 'set-contest-only':
        if (args.length < 2) {
          console.error('❌ Error: Problem ID is required');
          console.log('Usage: node scripts/manageProblems.js set-contest-only <problemId>');
          process.exit(1);
        }
        await setContestOnly(args[1]);
        break;
        
      case 'unset-contest-only':
        if (args.length < 2) {
          console.error('❌ Error: Problem ID is required');
          console.log('Usage: node scripts/manageProblems.js unset-contest-only <problemId>');
          process.exit(1);
        }
        await unsetContestOnly(args[1]);
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "node scripts/manageProblems.js help" to see available commands.');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
main().catch(console.error);
