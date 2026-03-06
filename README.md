# Slack Assistant

**Vision-based Slack assistant** that connects to your **existing Chrome browser** (where you're already logged into Slack) and finds unread messages using Qwen-VL.

✅ **No login needed** - Uses your existing Chrome tab  
✅ **No automation detection** - It's your real browser  
✅ **Silent screenshots** - No macOS overlay  
✅ **Vision-powered** - Qwen-VL analyzes Slack UI

---

## Features

✅ **Find Unread Messages** - Scan sidebar for unread channels and DMs  
✅ **Check @Mentions** - Open Activity tab and extract mentions  
✅ **Get Summary** - Overview of workspace status  
✅ **Vision-Powered** - Uses Qwen-VL to analyze Slack UI  
✅ **Silent Screenshots** - No macOS overlay  
✅ **Multiple Outputs** - JSON results + debug screenshots  

---

## Quick Start

### Step 1: Install & Configure

```bash
# Install dependencies
npm install

# Set API key
export DASHSCOPE_API_KEY=your_key_here
```

### Step 2: Start Chrome with Remote Debugging

**macOS:**
```bash
# 1. Close ALL Chrome windows completely (Cmd+Q)
# 2. Run this command:
open -a "Google Chrome" --args --remote-debugging-port=9222

# 3. Open Slack in Chrome
# Go to: https://app.slack.com
# Make sure you're logged in!
```

**Linux:**
```bash
google-chrome --remote-debugging-port=9222
```

**Windows:**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

### Step 3: Run the Assistant

```bash
# Get summary
npm run summary

# Find unread messages
npm run unread

# Check mentions
npm run mentions
```

---

## Commands

### 1. Find Unread Messages

```bash
npm run unread
# or
node src/assistant.js unread
```

**Output:**
```
🔍 Finding unread messages...

📊 UNREAD MESSAGES FOUND:
============================================================

📢 CHANNELS:
   #general: 5 unread
   #dev: 12 unread
   #random: 3 unread

💬 DIRECT MESSAGES:
   @john: 2 unread
   @sarah: 1 unread

📈 Total: 5 items with unread messages
============================================================
```

### 2. Check @Mentions

```bash
npm run mentions
# or
node src/assistant.js mentions
```

**Output:**
```
🔔 Checking @mentions...

📢 @MENTIONS:
============================================================

1. From @john in #dev
   "Can you review this PR?"

2. From @sarah in #general
   "Need your input on this..."

📈 Total: 2 mentions
============================================================
```

### 3. Get Summary

```bash
npm run summary
# or
node src/assistant.js summary
```

**Output:**
```
📋 Getting Slack summary...

📊 SLACK SUMMARY:
============================================================
Workspace: My Company
Status: active
Unread Channels: 3
Unread DMs: 2

Notifications:
   • Welcome back!
============================================================
```

---

## Programmatic Usage

```javascript
import { SlackAssistant } from './src/assistant.js';

const assistant = new SlackAssistant({
  headless: false,  // Show browser
  debugPath: './output'
});

try {
  await assistant.initialize();
  await assistant.navigateToSlack();
  
  // Find unread messages
  const unread = await assistant.findUnreadMessages();
  
  // Check mentions
  const mentions = await assistant.checkMentions();
  
  // Get summary
  const summary = await assistant.getSummary();
  
  // Save results
  await assistant.saveResults({ unread, mentions, summary }, 'full-report');
  
} finally {
  await assistant.close();
}
```

---

## Output

### Files Generated

All saved to `./output/`:

- **unread_*.json** - Unread messages data
- **mentions_*.json** - @mentions data
- **summary_*.json** - Workspace summary
- **sidebar_*.png** - Sidebar screenshot
- **activity_*.png** - Activity tab screenshot
- **main_*.png** - Main view screenshot

### JSON Format

```json
{
  "channels": [
    {"name": "#general", "count": 5, "x": 100, "y": 200}
  ],
  "directMessages": [
    {"name": "@john", "count": 2, "x": 100, "y": 300}
  ],
  "totalUnread": 5
}
```

---

## How It Works

```
1. Launch browser (Playwright)
   ↓
2. Navigate to app.slack.com
   ↓
3. Take screenshots of UI
   ↓
4. Send to Qwen-VL for analysis
   ↓
5. Extract structured data
   ↓
6. Save results + screenshots
```

### Vision Analysis

The assistant uses Qwen-VL to:
- **Identify** unread indicators (bold text, badges)
- **Extract** channel names and counts
- **Locate** @mentions in Activity tab
- **Parse** workspace status and notifications

---

## Configuration

### Headless Mode

Run without showing browser:

```javascript
const assistant = new SlackAssistant({
  headless: true
});
```

### Custom Timeout

```javascript
const assistant = new SlackAssistant({
  timeout: 120000  // 2 minutes
});
```

### Custom Debug Path

```javascript
const assistant = new SlackAssistant({
  debugPath: './my-screenshots'
});
```

---

## Troubleshooting

### "DASHSCOPE_API_KEY required"

Set your API key:
```bash
export DASHSCOPE_API_KEY=sk-xxxxx
```

Get one at: https://dashscope.console.aliyun.com/

### "Login required"

If Slack shows login page:
1. Browser will open
2. Manually log in
3. Re-run the command
4. (Future: add cookie persistence)

### "No unread found" but you see some

Vision analysis might miss some indicators. Check debug screenshots:
```bash
open ./output/sidebar_*.png
```

If indicators are visible but not detected, we can improve the vision prompt.

### Browser automation detected

Slack might detect automation. The code already includes anti-detection flags, but if issues persist:
- Use logged-in browser profile
- Add user data directory
- Reduce automation speed

---

## Slack Keyboard Shortcuts Used

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+D` | Focus channel sidebar |
| `Cmd+Shift+A` | Open Activity (mentions) |
| `Cmd+K` | Jump to channel |
| `Cmd+L` | Next unread channel |

---

## Advanced: Custom Vision Tasks

You can add custom analysis tasks:

```javascript
const result = await assistant.analyzeWithVision(screenshot, `
  Analyze this Slack screenshot and find:
  1. All pinned messages
  2. Starred channels
  3. Recent file uploads
  
  Return JSON: {...}
`);
```

---

## Next Steps

After testing:

1. **Add reply capability** - Send messages via keyboard
2. **Mark as read** - Navigate and mark messages read
3. **Scheduled checks** - Run every hour via cron
4. **Notifications** - Alert when urgent messages arrive
5. **Export to other tools** - Send to email, Slack, etc.

---

## Ethics & Security

**Important:**

- ✅ OK: Personal productivity, managing your own Slack
- ❌ Not OK: Monitoring others without consent, spam
- ⚠️ Security: Don't commit API keys or cookies
- ⚠️ Rate limiting: Don't run too frequently

**This is for personal use. Respect privacy!**

---

## License

MIT

---

## Credits

Built with:
- [Playwright](https://playwright.dev/) - Browser automation
- [Qwen-VL](https://dashscope.aliyun.com/) - Vision language model
- macOS screenshot methods (tested overlay-free!)
