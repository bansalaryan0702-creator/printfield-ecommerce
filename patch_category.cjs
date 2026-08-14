const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      const aiResponse = await callGeminiWithRetry({
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

      let parsedText = '';
      if (typeof aiResponse.text === 'function') {
        parsedText = aiResponse.text();
      } else {
        parsedText = aiResponse.text || "[]";
      }
      const extractedUrls = JSON.parse(parsedText.trim() || "[]");

      return res.json({ success: true, urls: extractedUrls });`;

const replacement = `      let extractedUrls = [];
      try {
        const aiResponse = await callGeminiWithRetry({
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

        let parsedText = '';
        if (typeof aiResponse.text === 'function') {
          parsedText = aiResponse.text();
        } else {
          parsedText = aiResponse.text || "[]";
        }
        extractedUrls = JSON.parse(parsedText.trim() || "[]");
      } catch (err: any) {
        console.warn('AI link filtering failed, returning all valid-looking links:', err.message);
        extractedUrls = linksArray.filter(l => l.includes('product') || l.includes('item') || l.includes('p-') || l.match(/\\/[a-z0-9-]+\\.html$/i)).slice(0, 50);
        if (extractedUrls.length === 0) extractedUrls = linksArray.slice(0, 50);
      }

      return res.json({ success: true, urls: extractedUrls });`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
