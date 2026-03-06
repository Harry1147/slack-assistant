#!/usr/bin/env node

/**
 * Test cliclick is working and visible
 * This will click at 3 different positions so you can verify it's working
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testCliclick() {
  console.log('🖱️  Testing cliclick...\n');
  
  // Check if cliclick is installed
  try {
    await execAsync('which cliclick');
    console.log('✅ cliclick found!\n');
  } catch (e) {
    console.log('❌ cliclick NOT found!\n');
    console.log('📝 Install with:');
    console.log('   brew install cliclick\n');
    process.exit(1);
  }
  
  console.log('📍 This will click at 3 positions in 3 seconds...');
  console.log('   Watch your screen for mouse movements!\n');
  
  // Countdown
  for (let i = 3; i > 0; i--) {
    console.log(`   ${i}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const clicks = [
    { x: 200, y: 200, label: 'Top-left area' },
    { x: 600, y: 400, label: 'Center area' },
    { x: 1000, y: 600, label: 'Bottom-right area' }
  ];
  
  for (const click of clicks) {
    console.log(`🖱️  Clicking at (${click.x}, ${click.y}) - ${click.label}`);
    
    try {
      await execAsync(`cliclick c:${click.x},${click.y}`);
      console.log(`   ✅ Click executed\n`);
    } catch (e) {
      console.log(`   ❌ Failed: ${e.message}\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('✅ Test complete!\n');
  console.log('💡 If you saw the mouse move and click, cliclick is working!');
  console.log('   The Slack Assistant will now use cliclick for all navigation.\n');
}

testCliclick().catch(console.error);
