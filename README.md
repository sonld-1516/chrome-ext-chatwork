# Chatwork Chrome Extension Plus

A Chrome extension that enhances Chatwork with additional features including emoticons and formatting tags.

## Features

### 🎭 Custom Emoticons
- **External Emoticon Support**: Load and display custom emoticons from external sources
- **Popup Interface**: Easy-to-use emoticon picker with categorized tabs
- **Auto-Apply**: Automatically converts emoticon codes to images in messages
- **Real-time Detection**: Detects and applies emoticons to new messages as they appear

### 🏷️ Message Formatting Tags
- **Info Tags**: `[info]content[/info]` for informational messages
- **Code Tags**: `[code]content[/code]` for code snippets
- **Title Tags**: `[title]content[/title]` for headings
- **Smart Insertion**: Wraps selected text or inserts at cursor position
- **Duplicate Prevention**: Advanced logic to prevent duplicate tag insertions

## Installation

1. Clone this repository or download zip file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project folder
5. The extension will be loaded and ready to use

## Usage

### Emoticons
1. Click the 😊 button in the chat input area
2. Select an emoticon from the popup
3. The emoticon code will be inserted into your message
4. Send the message to see the emoticon displayed

### Formatting Tags
1. Select text in the chat input (optional)
2. Click one of the tag buttons: [info], [code], or [title]
3. The selected text will be wrapped with the appropriate tags
4. If no text is selected, tags are inserted at cursor position

## Technical Details

### Architecture
- **Background Script**: Handles extension lifecycle
- **Content Scripts**: Inject functionality into Chatwork pages
- **Popup Interface**: Provides user interaction for emoticons

### Key Components
- `emoticon.js`: Handles emoticon loading, display, and auto-conversion
- `insertTag.js`: Manages formatting tag insertion and button creation
- `manifest.json`: Extension configuration and permissions

### Performance Optimizations
- **Efficient DOM Monitoring**: Uses MutationObserver for real-time updates
- **Event Delegation**: Prevents memory leaks and ensures event persistence
- **Duplicate Prevention**: Multiple layers of protection against duplicate operations
- **Resource Management**: Proper cleanup of intervals and observers

## Development

### File Structure
```
chrome-ext-chatwork/
├── manifest.json          # Extension manifest
├── popup.html             # Extension popup interface
├── README.md              # This file
├── css/
│   ├── foreground_styles.css
│   └── popup.css
├── images/                # Extension icons and assets
├── js/
│   ├── background.js      # Background script
│   ├── emoticon.js        # Emoticon functionality
│   ├── inject.js          # Main content script
│   ├── insertTag.js       # Tag insertion functionality
│   ├── mention.js         # Mention features
│   ├── popup.js           # Popup interface logic
│   ├── lib/               # Third-party libraries
│   └── settings/          # Configuration files
```

### Version History
- **v3.1.0**: Performance optimizations and bug fixes
- **v3.0.0**: Refactor insert tags, emoticons feature
- **v2.0.0**: Enhanced emoticon auto-application
- **v1.0.0**: Initial release with basic features

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature description"`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## Support

If you encounter any issues or have suggestions for improvements, please create an issue on GitHub.

## Changelog

### v3.1.0 (Current)
- ✅ Optimized emoticon auto-application performance
- ✅ Enhanced duplicate prevention for tag insertion
- ✅ Improved event handling and memory management
- ✅ Simplified DOM mutation observers
- ✅ Better error handling and fallbacks

### v3.0.0
- ✅ Refactor insert tags feature
- ✅ Refactor emoticons feature and disable mention feature

### v2.0.0
- ✅ Enhanced emoticon auto-application system
- ✅ Added comprehensive event handling
- ✅ Improved popup positioning and styling
- ✅ Added footer management for emoticon popup

### v1.0.0
- ✅ Initial release with core functionality
- ✅ Tag insertion features
- ✅ Chrome extension structure
