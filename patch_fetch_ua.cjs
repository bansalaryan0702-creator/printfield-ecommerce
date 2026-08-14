const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Patch scrape-category-links
code = code.replace(
  `const pageRes = await fetch(parsedUrl.toString());`,
  `const pageRes = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });`
);

// Patch import-product
code = code.replace(
  `const pageRes = await fetch(parsedUrl.toString());`,
  `const pageRes = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });`
);

fs.writeFileSync('server.ts', code);
console.log('Patched User-Agent successfully.');
