const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `      const html = pageRes.data;`,
  `      const html = pageRes.data;
      console.log('Successfully fetched URL, length:', html.length);`
);

fs.writeFileSync('server.ts', code);
console.log('Patched with logs');
