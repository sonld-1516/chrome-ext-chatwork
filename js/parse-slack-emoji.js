// Cmd: node js/parse-slack-emoji.js


const fs = require('fs');

// Read the HTML file
const html = fs.readFileSync('./slack.md', 'utf8');

// Parse HTML to extract emoji data
const emojiPattern = /<button[^>]*id="emoji-picker-([^"]+)"[^>]*data-name="([^"]+)"[^>]*>.*?<img src="([^"]+)"/g;

const emojis = [];
let match;

while ((match = emojiPattern.exec(html)) !== null) {
    const name = match[2];
    const src = match[3];

    // Format: (emoji_name)
    const key = `(${name})`;

    emojis.push({
        key: key,
        src: src
    });
}

// Write to JSON file
const output = JSON.stringify(emojis, null, 2);
fs.writeFileSync('./slack-emojis.json', output, 'utf8');

console.log(`✅ Parsed ${emojis.length} emojis`);
console.log('📄 File output: slack-emojis.json');
console.log('\nExample first 5 emojis:');
console.log(JSON.stringify(emojis.slice(0, 5), null, 2));
