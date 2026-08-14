const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const missingRoutes = `
  // --- RESTORED PRODUCT ROUTES ---
  app.get('/api/products', async (req, res) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const category = req.query.category;
      const subCategory = req.query.subCategory;
      const search = req.query.search;
      const sort = req.query.sort;

      let allProducts = await loadProductsFromS3();

      if (category && category !== 'all') {
        allProducts = allProducts.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
      }
      if (subCategory && subCategory !== 'all') {
        allProducts = allProducts.filter(p => (p.subCategory || '').toLowerCase() === subCategory.toLowerCase());
      }
      if (search) {
        const s = search.toLowerCase();
        allProducts = allProducts.filter(p => 
          (p.name || '').toLowerCase().includes(s) || 
          (p.description || '').toLowerCase().includes(s)
        );
      }
      
      if (sort === 'price-asc') {
        allProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sort === 'price-desc') {
        allProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
      } else if (sort === 'newest') {
        allProducts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }

      const total = allProducts.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginated = allProducts.slice(startIndex, startIndex + limit);

      const availableSubCategories = Array.from(new Set(allProducts.map(p => p.subCategory).filter(Boolean)));

      res.json({
        data: paginated,
        total,
        page,
        limit,
        totalPages,
        availableSubCategories
      });
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post('/api/products', verifyAdmin, async (req, res) => {
    try {
      const p = req.body;
      const currentProds = await loadProductsFromS3(true);
      const id = "printfield-" + Math.random().toString(36).substr(2, 9);
      
      const newObj = {
        id,
        name: p.name || 'New Product',
        category: p.category || 'General',
        subCategory: p.subCategory || '',
        price: Number(p.price || 0),
        stockQty: p.stockQty !== undefined ? p.stockQty : null,
        isDisabled: !!p.isDisabled,
        image: p.image || '',
        images: Array.isArray(p.images) ? p.images : [],
        description: p.description || '',
        cardDescription: p.cardDescription || '',
        metaTitle: p.metaTitle || '',
        metaDescription: p.metaDescription || '',
        features: Array.isArray(p.features) ? p.features : [],
        colors: Array.isArray(p.colors) ? p.colors : [],
        variations: Array.isArray(p.variations) ? p.variations : [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      currentProds.unshift(newObj);
      await saveProductsToS3(currentProds);
      res.json({ success: true, product: newObj });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', verifyAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const currentProds = await loadProductsFromS3(true);
      const idx = currentProds.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Product not found' });
      
      currentProds[idx] = {
        ...currentProds[idx],
        ...updates,
        id, 
        updatedAt: Date.now()
      };
      
      await saveProductsToS3(currentProds);
      res.json({ success: true, product: currentProds[idx] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.patch('/api/products/:id', verifyAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const currentProds = await loadProductsFromS3(true);
      const idx = currentProds.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Product not found' });
      
      currentProds[idx] = {
        ...currentProds[idx],
        ...updates,
        id, 
        updatedAt: Date.now()
      };
      
      await saveProductsToS3(currentProds);
      res.json({ success: true, product: currentProds[idx] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to patch product' });
    }
  });

  app.delete('/api/products/:id', verifyAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      let currentProds = await loadProductsFromS3(true);
      currentProds = currentProds.filter(p => p.id !== id);
      await saveProductsToS3(currentProds);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  app.get('/api/categories-and-subcategories', async (req, res) => {
    try {
      const allProducts = await loadProductsFromS3();
      const categoriesMap = {};
      
      for (const p of allProducts) {
        if (!p.category) continue;
        if (!categoriesMap[p.category]) {
          categoriesMap[p.category] = new Set();
        }
        if (p.subCategory) {
          categoriesMap[p.category].add(p.subCategory);
        }
      }
      
      const result = Object.keys(categoriesMap).map(cat => ({
        name: cat,
        subCategories: Array.from(categoriesMap[cat])
      }));
      
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });
  // --- END RESTORED ROUTES ---

`;

code = code.replace('// API 404 handler', missingRoutes + '\n  // API 404 handler');
fs.writeFileSync('server.ts', code);
console.log('Restored routes successfully.');
