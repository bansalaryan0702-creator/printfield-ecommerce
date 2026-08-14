const fs = require('fs');

function replaceFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace `product.` with `product?.` only when it's `product.`
  content = content.replace(/product\./g, 'product?.');
  // Fix double question marks `product??.`
  content = content.replace(/product\?\?\./g, 'product?.');
  
  fs.writeFileSync(filePath, content);
}

replaceFile('src/pages/ProductDetail.tsx');
console.log('Fixed ProductDetail.tsx');
