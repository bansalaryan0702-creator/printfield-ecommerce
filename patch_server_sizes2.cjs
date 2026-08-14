const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target2 = `    try {
      const localStr = await fs.readFile('./data/products.json', 'utf-8');
      const localProds = JSON.parse(localStr);
      if (Array.isArray(localProds) && localProds.length > 0) {
        s3ProductsInMemory = localProds.filter((p: any) => !isBannedProduct(p));
        lastS3FetchTime = now;
        return s3ProductsInMemory;
      }`;
      
const replacement2 = `    try {
      const localStr = await fs.readFile('./data/products.json', 'utf-8');
      const localProds = JSON.parse(localStr);
      if (Array.isArray(localProds) && localProds.length > 0) {
        // Automatically inject Size variation for apparel products if missing
        localProds.forEach((p: any) => {
          const isApparel = p.category === "Apparel" || p.category === "Clothing & Bags" || p.category === "Custom Apparel" || p.category === "T-Shirts" || p.category === "Corporate Uniforms";
          const nameLower = (p.name || "").toLowerCase();
          const isApparelByName = nameLower.includes("t-shirt") || nameLower.includes("polo") || nameLower.includes("hoodie") || nameLower.includes("jacket") || nameLower.includes("sweatshirt") || nameLower.includes("wear");
          
          if (isApparel || isApparelByName) {
            if (!p.variations) p.variations = [];
            const hasSize = p.variations.some((v: any) => (v.name || "").toLowerCase() === 'size');
            if (!hasSize) {
              p.variations.unshift({
                id: "size-auto",
                name: "Size",
                options: [
                  { name: "S", price: 0 },
                  { name: "M", price: 0 },
                  { name: "L", price: 0 },
                  { name: "XL", price: 0 },
                  { name: "XXL", price: 0 }
                ]
              });
            }
          }
        });
        s3ProductsInMemory = localProds.filter((p: any) => !isBannedProduct(p));
        lastS3FetchTime = now;
        return s3ProductsInMemory;
      }`;

code = code.replace(target2, replacement2);
fs.writeFileSync('server.ts', code);
