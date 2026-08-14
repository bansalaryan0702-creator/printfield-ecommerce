const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetail.tsx', 'utf8');

const target = `      } else if (isDocumentPrinting) {
         variantParts.push(\`Pages: \${documentPages}\`);
      }`;

const replacement = `      } else if (isDocumentPrinting) {
         variantParts.push(\`Pages: \${documentPages}\`);
      }
      
      // If it's apparel and they clicked a placement but didn't upload, or just generally for apparel
      if (isApparel) {
         const placementConfig = APPAREL_PLACEMENTS[activePlacement as PlacementId];
         if (placementConfig) {
            variantParts.push(\`Placement: \${placementConfig.label}\`);
         }
      }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/ProductDetail.tsx', code);
