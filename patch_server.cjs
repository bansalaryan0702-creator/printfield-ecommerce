const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      const aiResponse = await callGeminiWithRetry({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const extractedUrls = JSON.parse(aiResponse);`;

const replacement = `      const aiResponse = await callGeminiWithRetry({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const extractedUrls = JSON.parse(aiResponse.text?.()?.trim() || aiResponse.text?.trim() || "[]");`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
