#!/bin/bash

# Slack Assistant - Chrome Launcher
# This script launches Chrome with remote debugging enabled

echo "🚀 Launching Chrome with Remote Debugging..."
echo ""
echo "This will:"
echo "  1. Close any running Chrome instances"
echo "  2. Launch Chrome with debugging port 9222"
echo "  3. You can then open Slack and run the assistant"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📱 macOS detected"
    echo ""
    echo "Closing Chrome..."
    osascript -e 'quit app "Google Chrome"' 2>/dev/null
    sleep 2
    
    echo "Launching Chrome with debugging..."
    open -a "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug-profile"
    
    echo ""
    echo "✅ Chrome launched!"
    echo ""
    echo "Next steps:"
    echo "  1. Wait for Chrome to open"
    echo "  2. Navigate to: https://app.slack.com"
    echo "  3. Log in if needed"
    echo "  4. Run: npm run summary"
    echo ""
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Linux detected"
    echo ""
    
    # Try to close Chrome
    pkill chrome 2>/dev/null
    sleep 2
    
    google-chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug-profile" &
    
    echo ""
    echo "✅ Chrome launched in background!"
    echo ""
    
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "🪟 Windows detected"
    echo ""
    
    taskkill /F /IM chrome.exe 2>nul
    sleep 2
    
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug-profile"
    
    echo ""
    echo "✅ Chrome launched!"
    echo ""
else
    echo "❌ Unknown OS: $OSTYPE"
    echo ""
    echo "Please manually launch Chrome with:"
    echo "  google-chrome --remote-debugging-port=9222"
    exit 1
fi

echo "💡 Tip: Keep this Chrome window open while using the assistant!"
echo ""
