const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `      if (Array.isArray(prods) && prods.length > 0) {
        s3ProductsInMemory = prods.filter((p: any) => !isBannedProduct(p));
        lastS3FetchTime = now;
        return s3ProductsInMemory;
      }`;
      
const replacement1 = `      if (Array.isArray(prods) && prods.length > 0) {
        // Automatically inject Size variation for apparel products if missing
        prods.forEach((p: any) => {
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
        
        s3ProductsInMemory = prods.filter((p: any) => !isBannedProduct(p));
        lastS3FetchTime = now;
        return s3ProductsInMemory;
      }`;

code = code.replace(target1, replacement1);
fs.writeFileSync('server.ts', code);
