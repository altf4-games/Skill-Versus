#!/usr/bin/env node

/**
 * Migration Script: CP Ranks to Valorant Ranks
 * 
 * This script migrates existing contest rankings from competitive programming
 * style ranks (Newbie, Pupil, etc.) to Valorant-style ranks (Iron, Bronze, etc.)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import mongoose from 'mongoose';
import ContestRanking from '../models/ContestRanking.js';

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

// Mapping from old CP ranks to new Valorant ranks
const rankMapping = {
  'Newbie': 'Iron',
  'Pupil': 'Bronze',
  'Specialist': 'Silver',
  'Expert': 'Gold',
  'Candidate Master': 'Platinum',
  'Master': 'Diamond',
  'International Master': 'Ascendant',
  'Grandmaster': 'Immortal',
  'International Grandmaster': 'Immortal',
  'Legendary Grandmaster': 'Radiant'
};

// Function to calculate Valorant rank based on rating
function calculateValorantRank(rating) {
  if (rating >= 2600) return "Radiant";
  if (rating >= 2400) return "Immortal";
  if (rating >= 2300) return "Ascendant";
  if (rating >= 2100) return "Diamond";
  if (rating >= 1900) return "Platinum";
  if (rating >= 1600) return "Gold";
  if (rating >= 1400) return "Silver";
  if (rating >= 1200) return "Bronze";
  return "Iron";
}

async function migrateRanks() {
  try {
    console.log('\n🔄 Starting rank migration...');
    
    // Get all contest rankings
    const rankings = await ContestRanking.find({});
    console.log(`Found ${rankings.length} contest rankings to migrate`);
    
    let migrated = 0;
    let alreadyCorrect = 0;
    let errors = 0;
    
    for (const ranking of rankings) {
      try {
        const oldRank = ranking.rank;
        let newRank;
        
        // Check if rank is already in Valorant format
        const valorantRanks = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'];
        if (valorantRanks.includes(oldRank)) {
          alreadyCorrect++;
          continue;
        }
        
        // Map old rank to new rank, or calculate from rating
        if (rankMapping[oldRank]) {
          newRank = rankMapping[oldRank];
        } else {
          // Calculate based on rating if mapping doesn't exist
          newRank = calculateValorantRank(ranking.rating);
        }
        
        // Update the ranking
        ranking.rank = newRank;
        await ranking.save();
        
        console.log(`✅ Migrated: ${ranking.username} (${ranking.rating}) ${oldRank} → ${newRank}`);
        migrated++;
        
      } catch (error) {
        console.error(`❌ Error migrating ${ranking.username}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Already correct: ${alreadyCorrect}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total processed: ${rankings.length}`);
    
    if (migrated > 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n✅ No migration needed - all ranks are already in Valorant format');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await migrateRanks();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
main().catch(console.error);
