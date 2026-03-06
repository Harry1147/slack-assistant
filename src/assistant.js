import { chromium } from 'playwright';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SlackAssistant {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.debugPath = options.debugPath || './debug';
    this.apiKey = options.apiKey || process.env.DASHSCOPE_API_KEY;
    this.timeout = options.timeout || 60000;
    this.chromePath = options.chromePath || 'google-chrome';
    
    if (!this.apiKey) {
      throw new Error('DASHSCOPE_API_KEY environment variable required');
    }
  }

  async initialize() {
    console.log('🤖 Slack Assistant initializing...\n');
    console.log('📋 Mode: Connect to existing Chrome (you keep Slack logged in)\n');
    
    await mkdir(this.debugPath, { recursive: true });
    
    // Connect to running Chrome via DevTools Protocol
    console.log('🔌 Connecting to Chrome...');
    console.log('   Make sure Chrome is running with Slack open!\n');
    
    try {
      // Connect to Chrome's DevTools Protocol
      this.browser = await chromium.connectOverCDP('http://localhost:9222');
      
      // Get the first context and page (your existing Slack tab)
      const context = this.browser.contexts()[0];
      const pages = context.pages();
      
      if (pages.length === 0) {
        throw new Error('No tabs found in Chrome. Please open Slack first!');
      }
      
      // Find Slack tab or use first tab
      this.page = pages.find(p => p.url().includes('slack.com')) || pages[0];
      
      console.log(`✅ Connected to Chrome!`);
      console.log(`   Current tab: ${this.page.url().substring(0, 60)}...\n`);
      
    } catch (error) {
      console.log('❌ Could not connect to Chrome!\n');
      console.log('📝 To enable Chrome remote debugging:');
      console.log('');
      console.log('   **Option 1: Quick Start (macOS)**');
      console.log('   1. Close ALL Chrome windows completely (Cmd+Q)');
      console.log('   2. Run this command in terminal:');
      console.log('      open -a "Google Chrome" --args --remote-debugging-port=9222');
      console.log('   3. Open Slack in Chrome: https://app.slack.com');
      console.log('   4. Run this command again\n');
      console.log('   **Option 2: Create Chrome Shortcut**');
      console.log('   Create a shortcut with target:');
      console.log('   "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222\n');
      throw error;
    }
    
    return this;
  }

  async navigateToSlack() {
    console.log('📍 Checking Slack tab...');
    
    // If not on Slack, navigate there
    const currentUrl = this.page.url();
    if (!currentUrl.includes('slack.com')) {
      console.log('   Not on Slack, navigating...');
      await this.page.goto('https://app.slack.com', { 
        waitUntil: 'networkidle',
        timeout: this.timeout 
      });
    }
    
    await this.page.waitForTimeout(2000);
    await this.captureScreenshot('slack_loaded');
    console.log('✅ Slack ready\n');
    return this;
  }

  async captureScreenshot(name) {
    const path = join(this.debugPath, `${name}_${Date.now()}.png`);
    await this.page.screenshot({ path, fullPage: false });
    return path;
  }

  async analyzeWithVision(screenshotPath, task) {
    const { readFile } = await import('fs/promises');
    const imageBuffer = await readFile(screenshotPath);
    const base64 = imageBuffer.toString('base64');
    
    const prompts = {
      unread: `Analyze this Slack screenshot. Find ALL unread message indicators:
1. Channels with unread counts (bold text or numbered badges)
2. Direct messages with unread indicators
3. Threads with unread replies

For each unread item, extract:
- Name (channel or person)
- Unread count (if visible)
- Position on screen (approximate x,y)

Return JSON:
{
  "channels": [{"name": "#general", "count": 5, "x": 100, "y": 200}],
  "directMessages": [{"name": "@john", "count": 2, "x": 100, "y": 300}],
  "threads": [{"channel": "#dev", "count": 1, "x": 100, "y": 400}],
  "totalUnread": number
}`,

      mentions: `Analyze this Slack screenshot. Find the Activity/Mentions section:
1. Count @mentions visible
2. For each mention: who mentioned you, which channel, brief preview
3. Are there more mentions below (scrollbar)?

Return JSON:
{
  "mentions": [{"from": "@user", "channel": "#name", "preview": "text..."}],
  "hasMore": boolean
}`,

      summary: `Analyze this Slack sidebar. Provide a complete summary:
1. Total channels with unread messages
2. Total direct messages with unread
3. List workspace name and current status
4. Any visible notifications or banners

Return JSON:
{
  "workspace": "name",
  "unreadChannels": number,
  "unreadDMs": number,
  "status": "active|away|dnd",
  "notifications": ["text"]
}`
    };
    
    const prompt = prompts[task] || task;
    
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-vl-max',
        input: {
          messages: [{
            role: 'user',
            content: [
              { image: `data:image/png;base64,${base64}` },
              { text: prompt }
            ]
          }]
        },
        parameters: { result_format: 'message' }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vision API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    const content = data.output?.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse vision response:', e.message);
    }
    
    return { raw: content };
  }

  async findUnreadMessages() {
    console.log('🔍 Finding unread messages...\n');
    
    // Focus on sidebar
    await this.page.keyboard.press('Cmd+Shift+D');
    await this.page.waitForTimeout(1000);
    
    const screenshot = await this.captureScreenshot('sidebar');
    console.log(`📸 Sidebar captured: ${screenshot}\n`);
    
    const result = await this.analyzeWithVision(screenshot, 'unread');
    
    console.log('📊 UNREAD MESSAGES FOUND:');
    console.log('='.repeat(60));
    
    if (result.channels?.length > 0) {
      console.log('\n📢 CHANNELS:');
      result.channels.forEach(ch => {
        console.log(`   ${ch.name}: ${ch.count || '?'} unread`);
      });
    }
    
    if (result.directMessages?.length > 0) {
      console.log('\n💬 DIRECT MESSAGES:');
      result.directMessages.forEach(dm => {
        console.log(`   ${dm.name}: ${dm.count || '?'} unread`);
      });
    }
    
    const total = (result.channels?.length || 0) + (result.directMessages?.length || 0);
    console.log(`\n📈 Total: ${total} items with unread messages`);
    console.log('='.repeat(60));
    console.log('');
    
    return result;
  }

  async checkMentions() {
    console.log('🔔 Checking @mentions...\n');
    
    // Open Activity tab
    await this.page.keyboard.press('Cmd+Shift+A');
    await this.page.waitForTimeout(2000);
    
    const screenshot = await this.captureScreenshot('activity');
    console.log(`📸 Activity captured: ${screenshot}\n`);
    
    const result = await this.analyzeWithVision(screenshot, 'mentions');
    
    console.log('📢 @MENTIONS:');
    console.log('='.repeat(60));
    
    if (result.mentions?.length > 0) {
      result.mentions.forEach((m, i) => {
        console.log(`\n${i + 1}. From ${m.from} in ${m.channel}`);
        console.log(`   "${m.preview}"`);
      });
      console.log(`\n📈 Total: ${result.mentions.length} mentions`);
      if (result.hasMore) {
        console.log('   (...and more - scroll to see all)');
      }
    } else {
      console.log('   No new mentions found! 🎉');
    }
    
    console.log('='.repeat(60));
    console.log('');
    
    return result;
  }

  async getSummary() {
    console.log('📋 Getting Slack summary...\n');
    
    const screenshot = await this.captureScreenshot('main');
    console.log(`📸 Main view captured: ${screenshot}\n`);
    
    const result = await this.analyzeWithVision(screenshot, 'summary');
    
    console.log('📊 SLACK SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Workspace: ${result.workspace || 'Unknown'}`);
    console.log(`Status: ${result.status || 'Unknown'}`);
    console.log(`Unread Channels: ${result.unreadChannels || 0}`);
    console.log(`Unread DMs: ${result.unreadDMs || 0}`);
    
    if (result.notifications?.length > 0) {
      console.log('\nNotifications:');
      result.notifications.forEach(n => console.log(`   • ${n}`));
    }
    
    console.log('='.repeat(60));
    console.log('');
    
    return result;
  }

  async saveResults(results, filename) {
    const path = join(this.debugPath, `${filename}_${Date.now()}.json`);
    await writeFile(path, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to: ${path}\n`);
    return path;
  }

  async close() {
    if (this.browser) {
      // Don't close user's Chrome, just disconnect
      await this.browser.disconnect();
      console.log('👋 Disconnected from Chrome (your browser stays open)\n');
    }
  }
}

// CLI
async function main() {
  const command = process.argv[2] || 'summary';
  
  const assistant = new SlackAssistant({
    headless: false,
    debugPath: './output'
  });
  
  try {
    await assistant.initialize();
    await assistant.navigateToSlack();
    
    let results;
    
    if (command === 'unread') {
      results = await assistant.findUnreadMessages();
    } else if (command === 'mentions') {
      results = await assistant.checkMentions();
    } else if (command === 'summary') {
      results = await assistant.getSummary();
    } else {
      console.log('Unknown command. Use: unread | mentions | summary');
      process.exit(1);
    }
    
    await assistant.saveResults(results, command);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('DASHSCOPE_API_KEY')) {
      console.log('\n📝 Set your API key:');
      console.log('   export DASHSCOPE_API_KEY=your_key_here\n');
    }
    process.exit(1);
  } finally {
    await assistant.close();
  }
}

if (process.argv[1]?.endsWith('assistant.js')) {
  main();
}
