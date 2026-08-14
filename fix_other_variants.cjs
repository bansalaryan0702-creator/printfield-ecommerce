const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetail.tsx', 'utf8');

const oldNameBuilder = `      const variantSuffix = variantParts.length > 0
          ? \` [\${variantParts.join(' | ')}]\`
          : '';

      if (isBusinessCard) {
         finalProduct.name = \`\${product?.name} (\${cardQuantity} cards)\${variantSuffix}\`;
      } else if (isBrochure) {
         finalProduct.name = \`\${product?.name} (\${brochureQty} brochures, \${brochureStyle}, \${brochureFold})\${variantSuffix}\`;
      } else if (isStandee) {
         finalProduct.name = \`\${product?.name} (\${standeeQty} standees, \${standeeSize} ft)\${variantSuffix}\`;
      } else if (isAcrylic) {
         const suffixText = baseQuantity > 1 ? \` (\${baseQuantity} pcs)\` : '';
         finalProduct.name = \`\${product?.name}\${suffixText} (Shape: \${acrylicShape})\${variantSuffix}\`;
      } else if (isDocumentPrinting) {
         finalProduct.name = \`\${product?.name} (\${documentPages} Pages, \${baseQuantity} Copies)\${variantSuffix}\`;
      } else {
         const suffixText = baseQuantity > 1 ? \` (\${baseQuantity} pcs)\` : '';
         finalProduct.name = \`\${product?.name}\${suffixText}\${variantSuffix}\`;
      }`;

const newNameBuilder = `      if (isBusinessCard) {
         variantParts.push(\`Sides: \${cardSides === 'front-back' ? 'Front & Back' : 'Front Only'}\`);
         if (cardShape && cardShape !== "Standard Business Card" && cardShape !== "Standard") variantParts.push(\`Shape: \${cardShape}\`);
      } else if (isBrochure) {
         variantParts.push(\`Style: \${brochureStyle}\`);
         variantParts.push(\`Fold: \${brochureFold}\`);
      } else if (isStandee) {
         variantParts.push(\`Size: \${standeeSize} ft\`);
      } else if (isAcrylic) {
         variantParts.push(\`Shape: \${acrylicShape}\`);
      } else if (isDocumentPrinting) {
         variantParts.push(\`Pages: \${documentPages}\`);
      }

      const variantSuffix = variantParts.length > 0
          ? \` [\${variantParts.join(' | ')}]\`
          : '';

      if (isBusinessCard) {
         finalProduct.name = \`\${product?.name} (\${cardQuantity} cards)\${variantSuffix}\`;
      } else if (isBrochure) {
         finalProduct.name = \`\${product?.name} (\${brochureQty} brochures)\${variantSuffix}\`;
      } else if (isStandee) {
         finalProduct.name = \`\${product?.name} (\${standeeQty} standees)\${variantSuffix}\`;
      } else if (isAcrylic) {
         const suffixText = baseQuantity > 1 ? \` (\${baseQuantity} pcs)\` : '';
         finalProduct.name = \`\${product?.name}\${suffixText}\${variantSuffix}\`;
      } else if (isDocumentPrinting) {
         finalProduct.name = \`\${product?.name} (\${baseQuantity} Copies)\${variantSuffix}\`;
      } else {
         const suffixText = baseQuantity > 1 ? \` (\${baseQuantity} pcs)\` : '';
         finalProduct.name = \`\${product?.name}\${suffixText}\${variantSuffix}\`;
      }`;

code = code.replace(oldNameBuilder, newNameBuilder);
fs.writeFileSync('src/pages/ProductDetail.tsx', code);
