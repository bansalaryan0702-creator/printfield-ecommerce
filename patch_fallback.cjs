const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      const response = await callGeminiWithRetry({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "[]");
      if (!Array.isArray(parsed)) {
         return res.status(500).json({ error: "Failed to parse AI response into array" });
      }`;

const replacementStr = `      let parsed = [];
      try {
        const response = await callGeminiWithRetry({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        parsed = JSON.parse(response.text?.trim() || "[]");
        if (!Array.isArray(parsed)) throw new Error("Not an array");
      } catch (err) {
        console.warn("Gemini API failed or limit reached, falling back to heuristic parsing:", err.message);
        // Fallback heuristic parsing
        parsed = products.map((p) => {
          const lowerKeys = Object.keys(p).reduce((acc, k) => {
            acc[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = p[k];
            return acc;
          }, {});

          const name = lowerKeys.name || lowerKeys.productname || lowerKeys.title || lowerKeys.item || Object.values(p)[0] || "Unknown Product";
          const priceStr = lowerKeys.price || lowerKeys.cost || lowerKeys.mrp || "0";
          const price = parseFloat(String(priceStr).replace(/[^0-9.]/g, '')) || null;
          const stockQty = parseInt(lowerKeys.stock || lowerKeys.stockqty || lowerKeys.quantity || lowerKeys.qty || "1", 10) || null;
          const category = lowerKeys.category || lowerKeys.cat || "General";
          const subCategory = lowerKeys.subcategory || lowerKeys.subcat || "General";
          
          const description = lowerKeys.description || lowerKeys.desc || \`Custom \${name} tailored with premium finish for \${category}.\`;
          const cardDescription = lowerKeys.carddescription || lowerKeys.shortdesc || \`Custom \${name} tailored with premium finish.\`;
          
          let images = [];
          if (lowerKeys.image) images.push(String(lowerKeys.image));
          if (lowerKeys.images) {
             const imgs = String(lowerKeys.images).split(',').map(s=>s.trim()).filter(Boolean);
             images.push(...imgs);
          }
          if (lowerKeys.imageurl) images.push(String(lowerKeys.imageurl));

          return {
            name,
            price,
            stockQty,
            category,
            subCategory,
            description,
            cardDescription,
            image: images[0] || "",
            images,
            colors: [],
            variations: []
          };
        });
      }`;

if (code.includes('model: "gemini-3.6-flash"')) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('server.ts', code);
    console.log("Fallback logic added!");
} else {
    console.log("Target string not found!");
}
