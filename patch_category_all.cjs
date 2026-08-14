const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  app.post('/api/scrape-category-links', verifyAdmin, async (req, res) => {
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
        } 
      });
      if (!pageRes.ok) {
        throw new Error(\`Failed to fetch the URL. Status: \${pageRes.status}\`);
      }
      const html = await pageRes.text();
      const $ = cheerio.load(html);
      
      const links = new Set<string>();
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/customizable-products/')) {
           const clean = href.split('?')[0];
           links.add(clean.startsWith('http') ? clean : 'https://printo.in' + clean);
        }
      });
      
      const urls = Array.from(links);
      res.json({ success: true, urls });
    } catch (err: any) {
      console.error('Error scraping category links:', err);
      res.status(500).json({ error: err.message || 'Error scraping links.' });
    }
  });`;

const replacement = `  app.post('/api/scrape-category-links', verifyAdmin, async (req, res) => {
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
      const extractedUrls = JSON.parse(parsedText.trim() || "[]");

      return res.json({ success: true, urls: extractedUrls });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Failed to fetch category links' });
    }
  });`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
