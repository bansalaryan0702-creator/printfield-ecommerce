const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Scrape category links endpoint replacement
code = code.replace(
  `      const pageRes = await fetch(parsedUrl.toString(), { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        } 
      });
      if (!pageRes.ok) {
        throw new Error(\`Failed to fetch the URL. Status: \${pageRes.status}\`);
      }
      const html = await pageRes.text();`,
  `      const pageRes = await axios.get(parsedUrl.toString(), { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 30000
      });
      const html = pageRes.data;`
);

// Import product endpoint replacement
code = code.replace(
  `      const pageRes = await fetch(parsedUrl.toString(), { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        } 
      });
      if (!pageRes.ok) {
        throw new Error(\`Failed to fetch the URL. Status: \${pageRes.status} \${pageRes.statusText}\`);
      }
      const html = await pageRes.text();`,
  `      const pageRes = await axios.get(parsedUrl.toString(), { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 30000
      });
      const html = pageRes.data;`
);

fs.writeFileSync('server.ts', code);
console.log('Patched fetch to axios successfully.');
