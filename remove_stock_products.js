const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-admin-key-replace-in-prod';
const token = jwt.sign({ id: 'system', role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });

async function removeStockProducts() {
  const url = 'http://localhost:3000/api/products?limit=1000';
  const response = await fetch(url);
  const data = await response.json();
  const products = data.data || [];

  console.log(`Loaded ${products.length} products.`);

  const stockProductIds = [];
  
  for (const product of products) {
    let hasStockImage = false;
    if (product.image && typeof product.image === 'string' && product.image.includes('unsplash.com')) {
      hasStockImage = true;
    }
    
    if (product.images) {
        let imgs = product.images;
        if (typeof imgs === 'string') {
            try {
                imgs = JSON.parse(imgs);
            } catch (e) {}
        }
        if (Array.isArray(imgs)) {
            for (const img of imgs) {
                if (img && typeof img === 'string' && img.includes('unsplash.com')) {
                    hasStockImage = true;
                }
            }
        }
    }
    
    if (hasStockImage) {
      stockProductIds.push(product.id);
    }
  }

  console.log(`Found ${stockProductIds.length} products with stock images.`);

  for (const id of stockProductIds) {
    console.log(`Deleting product: ${id}`);
    const deleteRes = await fetch(`http://localhost:3000/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const resData = await deleteRes.json();
    console.log(`Result for ${id}:`, resData);
  }
}

removeStockProducts().catch(console.error);
