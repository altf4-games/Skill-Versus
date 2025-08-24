#!/usr/bin/env node

/**
 * Skill Versus Admin CLI
 * 
 * A unified command-line interface for all administrative tasks.
 * This script provides easy access to all admin tools with helpful prompts and validation.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Available commands
const commands = {
  'disqualifications': {
    description: 'Manage contest disqualifications',
    script: 'manageDisqualifications.js',
    subcommands: ['list', 'disqualify', 'remove', 'clear', 'help']
  },
  'migrate-ranks': {
    description: 'Migrate CP ranks to Valorant ranks',
    script: 'migrateRanksToValorant.js',
    subcommands: []
  },
  'add-driver-code': {
    description: 'Add driver code to problems',
    script: 'addDriverCode.js',
    subcommands: []
  },
  'add-signatures': {
    description: 'Add function signatures to problems',
    script: 'addFunctionSignatures.js',
    subcommands: []
  },
  'manage-problems': {
    description: 'Manage problem settings (contest-only flag)',
    script: 'manageProblems.js',
    subcommands: ['list', 'set-contest-only', 'unset-contest-only']
  }
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function showHelp() {
  console.log('\n🛠️  Skill Versus Admin CLI\n');
  console.log('Available commands:\n');
  
  Object.entries(commands).forEach(([cmd, info]) => {
    console.log(`  ${cmd.padEnd(20)} - ${info.description}`);
    if (info.subcommands.length > 0) {
      console.log(`    ${' '.repeat(18)} Subcommands: ${info.subcommands.join(', ')}`);
    }
  });
  
  console.log('\nUsage:');
  console.log('  node scripts/admin-cli.js <command> [subcommand] [args...]');
  console.log('  node scripts/admin-cli.js interactive');
  console.log('\nExamples:');
  console.log('  node scripts/admin-cli.js disqualifications list 507f1f77bcf86cd799439011');
  console.log('  node scripts/admin-cli.js migrate-ranks');
  console.log('  node scripts/admin-cli.js interactive');
  console.log('');
}

function runScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = join(__dirname, scriptName);
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: dirname(__dirname)
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function interactiveMode() {
  console.log('\n🛠️  Skill Versus Admin CLI - Interactive Mode\n');
  
  while (true) {
    console.log('Available commands:');
    Object.entries(commands).forEach(([cmd, info], index) => {
      console.log(`  ${index + 1}. ${cmd} - ${info.description}`);
    });
    console.log('  0. Exit\n');
    
    const choice = await new Promise(resolve => {
      rl.question('Select a command (number): ', resolve);
    });
    
    const cmdIndex = parseInt(choice) - 1;
    const cmdEntries = Object.entries(commands);
    
    if (choice === '0') {
      console.log('Goodbye! 👋');
      break;
    }
    
    if (cmdIndex < 0 || cmdIndex >= cmdEntries.length) {
      console.log('❌ Invalid choice. Please try again.\n');
      continue;
    }
    
    const [cmdName, cmdInfo] = cmdEntries[cmdIndex];
    
    try {
      if (cmdInfo.subcommands.length > 0) {
        console.log(`\nSubcommands for ${cmdName}:`);
        cmdInfo.subcommands.forEach((sub, index) => {
          console.log(`  ${index + 1}. ${sub}`);
        });
        
        const subChoice = await new Promise(resolve => {
          rl.question('Select subcommand (number): ', resolve);
        });
        
        const subIndex = parseInt(subChoice) - 1;
        if (subIndex < 0 || subIndex >= cmdInfo.subcommands.length) {
          console.log('❌ Invalid subcommand choice.\n');
          continue;
        }
        
        const subcommand = cmdInfo.subcommands[subIndex];
        let args = [subcommand];
        
        // Get additional arguments based on subcommand
        if (subcommand === 'list' || subcommand === 'clear') {
          const contestId = await new Promise(resolve => {
            rl.question('Enter contest ID: ', resolve);
          });
          args.push(contestId);
        } else if (subcommand === 'disqualify') {
          const contestId = await new Promise(resolve => {
            rl.question('Enter contest ID: ', resolve);
          });
          const userId = await new Promise(resolve => {
            rl.question('Enter user ID: ', resolve);
          });
          const reason = await new Promise(resolve => {
            rl.question('Enter reason: ', resolve);
          });
          args.push(contestId, userId, reason);
        } else if (subcommand === 'remove') {
          const contestId = await new Promise(resolve => {
            rl.question('Enter contest ID: ', resolve);
          });
          const userId = await new Promise(resolve => {
            rl.question('Enter user ID: ', resolve);
          });
          args.push(contestId, userId);
        }
        
        console.log(`\n🚀 Running: ${cmdInfo.script} ${args.join(' ')}\n`);
        await runScript(cmdInfo.script, args);
      } else {
        console.log(`\n🚀 Running: ${cmdInfo.script}\n`);
        await runScript(cmdInfo.script);
      }
      
      console.log('\n✅ Command completed successfully!\n');
      
    } catch (error) {
      console.error(`\n❌ Error running command: ${error.message}\n`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }
  
  if (args[0] === 'interactive' || args[0] === '-i') {
    await interactiveMode();
    rl.close();
    process.exit(0);
  }
  
  const command = args[0];
  const commandInfo = commands[command];
  
  if (!commandInfo) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Run "node scripts/admin-cli.js help" to see available commands.');
    process.exit(1);
  }
  
  try {
    const scriptArgs = args.slice(1);
    console.log(`🚀 Running: ${commandInfo.script} ${scriptArgs.join(' ')}`);
    await runScript(commandInfo.script, scriptArgs);
    console.log('✅ Command completed successfully!');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  rl.close();
  process.exit(0);
});

main().catch(console.error);
