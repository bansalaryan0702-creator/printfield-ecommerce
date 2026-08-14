const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const missingRoute = `
  app.post("/api/products/bulk-smart", verifyAdmin, async (req, res) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: "Expected an array of products" });
      }
      
      const currentProds = await loadProductsFromS3(true);
      const newProdsList = [];
      let imported = 0;

      for (const p of products) {
        if (!p.name) continue;
        const id = "printfield-" + Math.random().toString(36).substr(2, 9);
        
        let stockQty = p.stockQty != null ? parseInt(p.stockQty, 10) : null;
        if (isNaN(stockQty)) stockQty = null;

        let isDisabled = false;
        if (stockQty !== null && stockQty <= 0) {
          isDisabled = true;
        }

        const newObj = {
          id,
          name: p.name,
          category: p.category || "Apparel",
          subCategory: p.subCategory || "General",
          price: p.price != null ? parseFloat(p.price) : null,
          stockQty,
          isDisabled,
          image: p.image || "",
          images: Array.isArray(p.images) ? p.images : [],
          description: p.description || "",
          cardDescription: p.cardDescription || "",
          metaTitle: \`\${p.name} - Custom \${p.category || "Products"}\`, 
          metaDescription: p.cardDescription || "",
          features: [],
          colors: Array.isArray(p.colors) ? p.colors : [],
          variations: Array.isArray(p.variations) ? p.variations : [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        newProdsList.push(newObj);
        imported++;
      }

      currentProds.unshift(...newProdsList);
      await saveProductsToS3(currentProds);

      res.json({ success: true, count: imported });
    } catch (error) {
      console.error("Smart bulk import error:", error);
      res.status(500).json({ error: error.message || "Failed to process smart import" });
    }
  });
`;

code = code.replace('// --- END RESTORED ROUTES ---', missingRoute + '\n  // --- END RESTORED ROUTES ---');
fs.writeFileSync('server.ts', code);
console.log('Restored bulk-smart successfully.');
