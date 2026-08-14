sed -i '/\/\/ Add Product (Admin only) - Saves to S3/i \
  // Smart Bulk Import Products (Admin only) - Handles raw excel data with AI\
  app.post("/api/products/bulk-smart", verifyAdmin, async (req, res) => {\
    try {\
      const { products } = req.body;\
      if (!Array.isArray(products)) {\
        return res.status(400).json({ error: "Expected an array of products" });\
      }\
\
      if (!process.env.MY_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {\
        return res.status(500).json({ error: "Gemini API key not configured for smart import." });\
      }\
\
      const prompt = `You are an expert e-commerce catalog manager.\\nI have a list of raw product data extracted from an Excel sheet.\\nThe headers/keys might be unpredictable. Please analyze the data and map it to our structured Product format.\\nFor each product:\\n- Determine the \\"name\\" (product name)\\n- Extract \\"category\\" and \\"subCategory\\" if possible.\\n- Extract \\"price\\" as a number.\\n- Extract \\"stockQty\\" (stock quantity) if available, or \\"minQty\\".\\n- Extract image URLs (any columns that look like URLs or image links). Assign the first to \\"image\\", and the rest to \\"images\\" array.\\n- Generate a UNIQUE, compelling \\"description\\" based on the product name and properties.\\n- Generate a short \\"cardDescription\\".\\n- Extract \\"colors\\" if available (e.g., \\"Red, Blue\\") into an array of objects: { \\"name\\": \\"Red\\", \\"hex\\": \\"#FF0000\\" }.\\n- Extract \\"variations\\" if available (e.g., sizes \\"S, M, L, XL\\") into an array: { \\"name\\": \\"Size\\", \\"options\\": [{ \\"name\\": \\"S\\", \\"price\\": 0 }, { \\"name\\": \\"M\\", \\"price\\": 0 }] }.\\n\\nHere is the raw data batch:\\n${JSON.stringify(products, null, 2)}\\n\\nReturn JSON ONLY as an array of objects matching this exact schema:\\n[{\\n  "name": "...",\\n  "category": "...",\\n  "subCategory": "...",\\n  "price": 100,\\n  "stockQty": 50,\\n  "minQty": 1,\\n  "image": "https://...",\\n  "images": ["https://..."],\\n  "description": "...",\\n  "cardDescription": "...",\\n  "colors": [{"name": "Red", "hex": "#FF0000"}],\\n  "variations": [{"name": "Size", "options": [{"name": "S", "price": 0}]}]\\n}]`;\
\
      const response = await callGeminiWithRetry({\
        model: "gemini-3.6-flash",\
        contents: prompt,\
        config: {\
          responseMimeType: "application/json"\
        }\
      });\
\
      const parsed = JSON.parse(response.text?.trim() || "[]");\
      if (!Array.isArray(parsed)) {\
         return res.status(500).json({ error: "Failed to parse AI response into array" });\
      }\
\
      const currentProds = await loadProductsFromS3(true);\
      const newProdsList = [];\
      let imported = 0;\
\
      for (const p of parsed) {\
        if (!p.name) continue;\
        const id = "printfield-" + Math.random().toString(36).substr(2, 9);\
        \
        let stockQty = p.stockQty != null ? parseInt(p.stockQty, 10) : null;\
        if (isNaN(stockQty)) stockQty = null;\
\
        let isDisabled = false;\
        if (stockQty !== null && stockQty <= 0) {\
          isDisabled = true;\
        }\
\
        const newObj = {\
          id,\
          name: p.name,\
          category: p.category || "Apparel",\
          subCategory: p.subCategory || "General",\
          price: p.price != null ? parseFloat(p.price) : null,\
          stockQty,\
          isDisabled,\
          image: p.image || "",\
          images: Array.isArray(p.images) ? p.images : [],\
          description: p.description || "",\
          cardDescription: p.cardDescription || "",\
          metaTitle: `${p.name} - Custom ${p.category || "Products"}`, \
          metaDescription: p.cardDescription || "",\
          features: [],\
          colors: Array.isArray(p.colors) ? p.colors : [],\
          variations: Array.isArray(p.variations) ? p.variations : [],\
          createdAt: Date.now(),\
          updatedAt: Date.now()\
        };\
        newProdsList.push(newObj);\
        imported++;\
      }\
\
      currentProds.unshift(...newProdsList);\
      await saveProductsToS3(currentProds);\
\
      res.json({ success: true, count: imported });\
    } catch (error) {\
      console.error("Smart bulk import error:", error);\
      res.status(500).json({ error: error.message || "Failed to process smart import" });\
    }\
  });\
\
' server.ts
