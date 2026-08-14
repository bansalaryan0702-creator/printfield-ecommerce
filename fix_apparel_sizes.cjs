const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

let updated = 0;
data.forEach(p => {
  const isApparel = p.category === "Apparel" || p.category === "Clothing & Bags" || p.category === "Custom Apparel" || p.category === "T-Shirts" || p.category === "Corporate Uniforms";
  const nameLower = (p.name || "").toLowerCase();
  const isApparelByName = nameLower.includes("t-shirt") || nameLower.includes("polo") || nameLower.includes("hoodie") || nameLower.includes("jacket") || nameLower.includes("sweatshirt") || nameLower.includes("wear");
  
  if (isApparel || isApparelByName) {
    if (!p.variations) p.variations = [];
    const hasSize = p.variations.some(v => v.name.toLowerCase() === 'size');
    if (!hasSize) {
      p.variations.unshift({
        name: "Size",
        options: [
          { name: "S", price: 0 },
          { name: "M", price: 0 },
          { name: "L", price: 0 },
          { name: "XL", price: 0 },
          { name: "XXL", price: 0 }
        ]
      });
      updated++;
    }
  }
});

fs.writeFileSync('data/products.json', JSON.stringify(data, null, 2));
console.log("Updated " + updated + " products.");
