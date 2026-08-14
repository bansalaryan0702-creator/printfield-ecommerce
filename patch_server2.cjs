const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `const extractedUrls = JSON.parse(aiResponse.text?.()?.trim() || aiResponse.text?.trim() || "[]");`;
const replacement = `let parsedText = '';
      if (typeof aiResponse.text === 'function') {
        parsedText = aiResponse.text();
      } else {
        parsedText = aiResponse.text || "[]";
      }
      const extractedUrls = JSON.parse(parsedText.trim() || "[]");`;
code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
