const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const targetStr = `        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to bulk import products');
        
        totalImported += resData.count || 0;
        setImportProgress({ current: Math.min(i + chunkSize, json.length), total: json.length });
      }`;

const replacementStr = `        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to bulk import products');
        
        totalImported += resData.count || 0;
        setImportProgress({ current: Math.min(i + chunkSize, json.length), total: json.length });
        
        // Add a small delay between chunks to avoid rate limiting
        if (i + chunkSize < json.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/pages/Admin.tsx', code);
    console.log("Loop delayed!");
} else {
    console.log("Target string not found!");
}
