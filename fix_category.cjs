const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetRegex = /app\.post\('\/api\/scrape-category-links', verifyAdmin, async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, urls \}\);\s*\} catch \(err: any\) \{\s*console\.error\('Error scraping category links:', err\);\s*res\.status\(500\)\.json\(\{ error: err\.message \|\| 'Error scraping links\.' \}\);\s*\}\s*\}\);/m;

const replacement = `app.post('/api/scrape-category-links', verifyAdmin, async (req, res) => {
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
  });`;

if (targetRegex.test(code)) {
    code = code.replace(targetRegex, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Successfully replaced");
} else {
    console.log("Regex didn't match!");
}
