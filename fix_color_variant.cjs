const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetail.tsx', 'utf8');

const targetStr = `      const activeVars = getActiveVariations();
      const variantParts: string[] = [];`;

const replacement = `      const activeVars = getActiveVariations();
      const variantParts: string[] = [];
      if (selectedColor) {
         const cName = typeof selectedColor === 'string' ? selectedColor : (selectedColor?.name || '');
         if (cName) variantParts.push(\`Color: \${cName}\`);
      }`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/pages/ProductDetail.tsx', code);
