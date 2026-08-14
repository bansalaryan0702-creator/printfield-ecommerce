const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const endpoints = `
  app.post('/api/scrape-category-links', verifyAdmin, async (req, res) => {
    try {
      let { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });

      url = url.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid URL provided.' });
      }

      const pageRes = await fetch(parsedUrl.toString(), { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        } 
      });
      if (!pageRes.ok) {
        throw new Error(\`Failed to fetch the URL. Status: \${pageRes.status}\`);
      }
      const html = await pageRes.text();
      const $ = cheerio.load(html);
      
      const baseUrl = parsedUrl.origin;
      const links = new Set<string>();
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && !href.startsWith('javascript') && !href.startsWith('#') && !href.startsWith('mailto:')) {
           if (href.startsWith('//')) href = 'https:' + href;
           else if (href.startsWith('/')) href = baseUrl + href;
           else if (!href.startsWith('http')) href = baseUrl + '/' + href;
           
           links.add(href.split('#')[0]); 
        }
      });
      
      const linksArray = Array.from(links);
      if (linksArray.length === 0) {
        return res.json({ success: true, urls: [] });
      }

      let extractedUrls = [];
      try {
        const prompt = \`Here is a list of URLs found on a webpage (\${url}). Which of these links are likely individual product detail pages? Filter out navigation, categories, privacy policies, etc. Return ONLY a JSON array of the product URLs.
URLs:
\${linksArray.slice(0, 300).join('\\n')}\`;
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

      return res.json({ success: true, urls: extractedUrls });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Failed to fetch category links' });
    }
  });

  app.post('/api/import-product', async (req, res) => {
    try {
      let { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });
      url = url.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid URL provided. Please enter a valid product webpage URL.' });
      }
      const pageRes = await fetch(parsedUrl.toString(), { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        } 
      });
      if (!pageRes.ok) {
        throw new Error(\`Failed to fetch the URL. Status: \${pageRes.status} \${pageRes.statusText}\`);
      }
      const html = await pageRes.text();
      
      const $ = cheerio.load(html);
      
      let jsonLdData = '';
      $('script[type="application/ld+json"], script[type="application/json"]').each((i, el) => {
        const text = $(el).html();
        if (text && text.trim() && text.length < 150000) {
           jsonLdData += text.trim() + '\\n\\n';
        }
      });
      jsonLdData = jsonLdData.slice(0, 50000);
      
      $('script, style, nav, footer, iframe, noscript').remove();
      $('br, p, div, li, td, tr, th, h1, h2, h3, h4, h5, h6, option, select').append(' ');
      const bodyText = $('body').text().replace(/\\s+/g, ' ').trim().slice(0, 40000);
      
      const baseUrl = parsedUrl.origin;
      const imgRegex = /https?:\\/\\/[^\\s"'<>;\\&\\}]+\\.(?:jpg|jpeg|png|webp|avif)(?:\\?[^\\s"'<>;\\&\\}]*)?/gi;
      const htmlMatches = html.match(imgRegex) || [];
      
      const images = new Set<string>(htmlMatches);
      $('img').each((i, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
        if (!src) {
           const srcset = $(el).attr('srcset');
           if (srcset) {
             src = srcset.split(',')[0].split(' ')[0];
           }
        }
        if (src) {
          if (src.startsWith('//')) src = 'https:' + src;
          else if (src.startsWith('/')) src = baseUrl + src;
          if (src.startsWith('http') && !src.includes('data:image')) images.add(src);
        }
      });
      
      function cleanAndDeduplicateImages(urls: string[]): string[] {
         const unique = new Set<string>();
         urls.forEach(u => {
           let clean = u;
           if (clean.includes('?')) {
             if (clean.includes('w=') || clean.includes('width=')) {
                // keep query params that look like image sizing or remove them to get full res
                clean = clean.split('?')[0]; 
             }
           }
           unique.add(clean);
         });
         return Array.from(unique);
      }
      
      const imageUrls = cleanAndDeduplicateImages(Array.from(images));
      const prompt = \`Extract product information from this webpage text.Return the information in JSON matching the defined schema exactly.If you find multiple images, choose the best product picture as 'image' and put ALL the rest in 'images'. You MUST include all accurate product images you can find in the 'images' array.If extracting colors, give a standard hex color if you can guess it from the name (e.g. Red -> #FF0000).Please try to identify and extract exactly the best 3 features of the product. FORMAT THE DESCRIPTION AS MARKDOWN. The description must start with a 1-2 sentence compelling paragraph. Following the paragraph, list the comprehensive product specifications (size, quality, paper types, material, etc.) as markdown bullet points. Do not use markdown headers for the bullet points.Extract EXACTLY all variations available on the linked site, including sizes, types, qualities, bindings, etc. You must be exhaustive and capture literally every single option you can find. DO NOT group them into broad categories if it loses detail. If the webpage shows full/absolute prices for options, calculate the RELATIVE additional price for each option compared to the cheapest option in that category. For example, if Size S is $100 and Size M is $150, the price for S is 0 and for M is 50. The 'price' field for each option MUST be the relative additional cost.Webpage text:\${bodyText}Image URLs found on page:\${imageUrls.slice(0, 50).join('\\n')}Original URL: \${url}\`;

      let data: any = null;
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
        const safeJsonParse = (str: string) => { try { return JSON.parse(str.trim()); } catch (e) { return null; } };
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
      }

      if (!data.image && imageUrls.length > 0) {
          data.image = imageUrls[0];
          data.images = Array.from(new Set([...(data.images || []), ...imageUrls.slice(1)]));
      }
      
      res.json({ success: true, data });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Failed to import product' });
    }
  });

`;

code = code.replace('  // Colors Settings endpoints', endpoints + '\n  // Colors Settings endpoints');
fs.writeFileSync('server.ts', code);
console.log("Injected");
