const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetail.tsx', 'utf8');

const target = `      if (selectedColor) {
         const cName = typeof selectedColor === 'string' ? selectedColor : (selectedColor?.name || '');
         if (cName) variantParts.push(\`Color: \${cName}\`);
      }`;

const replacement = `      if (selectedColor) {
         const cName = typeof selectedColor === 'string' ? selectedColor : (selectedColor?.name || '');
         
         const isAlsoVariation = product?.variations?.some((vc: any) => {
            const opt = activeVars[vc.id];
            return opt && opt.name === cName && isColorCategory(vc.name, vc.options);
         });

         if (cName && !isAlsoVariation) variantParts.push(\`Color: \${cName}\`);
      }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/ProductDetail.tsx', code);
