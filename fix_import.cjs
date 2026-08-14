const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const response = await callGeminiWithRetry\(\{[\s\S]*?if \(!data\) throw new Error\('Failed to parse AI JSON response'\);/m;

const replacement = `      let data: any = null;
      try {
        const response = await callGeminiWithRetry({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING, description: "Detailed description. MUST include all important points like size, quality, paper, materials, and everything else." },
                price: { type: Type.NUMBER, description: "Extract the numeric price, if any" },
                category: { type: Type.STRING },
                image: { type: Type.STRING },
                images: { type: Type.ARRAY, items: { type: Type.STRING } },
                features: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Extract exactly the best 3 features." },
                colors: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      hex: { type: Type.STRING },
                    }
                  }
                },
                variations: {
                  type: Type.ARRAY,
                  description: "Categories of variations (e.g., 'Size', 'Finish'). Include EVERY single option found on the page.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "Internal lowercased id, e.g. 'size' or 'material'" },
                      name: { type: Type.STRING, description: "Display name of the variation category, e.g. 'Size', 'Finish'" },
                      options: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING, description: "Option name, e.g. 'A4', 'Glossy'" },
                            price: { type: Type.NUMBER, description: "Relative additional cost for this option (e.g. 0 for the base/cheapest option, 50 if it costs 50 more). Default to 0 if unknown." }
                          }
                        }
                      }
                    }
                  }
                }
              },
              required: ["name", "description"]
            }
          }
        });
        
        let parsedText = '';
        if (typeof response.text === 'function') {
          parsedText = response.text();
        } else {
          parsedText = response.text || "{}";
        }
        
        if (!parsedText) throw new Error('Failed to parse from AI');
        data = safeJsonParse(parsedText);
        if (!data) throw new Error('Failed to parse AI JSON response');
      } catch (aiErr: any) {
        console.warn('AI Parsing failed, falling back to heuristic parsing:', aiErr.message);
        
        const title = $('title').text().replace(/\\s+/g, ' ').trim() || 'Imported Product';
        const h1 = $('h1').first().text().replace(/\\s+/g, ' ').trim();
        
        data = {
          name: h1 || title || 'Unknown Product',
          description: $('meta[name="description"]').attr('content') || title,
          price: 0,
          category: 'General',
          image: imageUrls.length > 0 ? imageUrls[0] : '',
          images: imageUrls.slice(1, 10),
          features: [],
          colors: [],
          variations: []
        };
        
        const priceMatches = bodyText.match(/(?:Rs\\.?|INR|₹|\\$)\\s*([0-9,]+\\.?[0-9]*)/i);
        if (priceMatches && priceMatches[1]) {
           data.price = parseFloat(priceMatches[1].replace(/,/g, ''));
        }
      }`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Successfully replaced in server.ts");
} else {
    console.log("Regex didn't match server.ts!");
}
