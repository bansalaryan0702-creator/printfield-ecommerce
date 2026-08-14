const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const parsed = typeof u.savedQuotationDetails === 'string' ? JSON.parse(u.savedQuotationDetails) : u.savedQuotationDetails;\n            addressStr = parsed.company ? `Company: ${parsed.company}` : '';",
  "const parsed = typeof u.savedQuotationDetails === 'string' ? JSON.parse(u.savedQuotationDetails) : u.savedQuotationDetails;\n            if (Array.isArray(parsed) && parsed.length > 0) {\n              addressStr = parsed[0].company ? `Company: ${parsed[0].company}` : '';\n            } else {\n              addressStr = parsed.company ? `Company: ${parsed.company}` : '';\n            }"
);

fs.writeFileSync('server.ts', code);
