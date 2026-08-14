const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `      if (!parsedUrl.hostname.includes('printo.in')) {
         return res.status(400).json({ error: 'Only Printo.in category URLs are currently supported for batch extraction.' });
      }`;

const target2 = `      // Check if it's a Printo.in URL
      if (parsedUrl.hostname.includes('printo.in')) {
        try {
          const printoData = await getPrintoStructuredData(parsedUrl.toString(), html);
          if (printoData) {
            return res.json({ success: true, data: printoData });
          }
        } catch (printoErr: any) {
          console.error('Printo custom parsing error:', printoErr);
          // If custom parsing fails, fallback to general parser below
        }
      }`;

code = code.replace(target1, '');

fs.writeFileSync('server.ts', code);
