const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-key-do-not-use-in-prod';
const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });

async function doImport() {
  const url = 'https://www.sagardisplay.com';
  console.log('Fetching category links from', url);
  
  const scrapeRes = await fetch('http://localhost:3000/api/scrape-category-links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ url })
  });
  const scrapeData = await scrapeRes.json();
  if (!scrapeRes.ok) {
    console.error('Failed to fetch category links:', scrapeData);
    return;
  }
  
  const urls = scrapeData.urls || [];
  console.log(`Found ${urls.length} urls. Proceeding to import...`);
  
  for (let i = 0; i < urls.length; i++) {
    const prodUrl = urls[i];
    console.log(`\n[${i+1}/${urls.length}] Importing: ${prodUrl}`);
    
    try {
      const importRes = await fetch('http://localhost:3000/api/import-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: prodUrl })
      });
      const importData = await importRes.json();
      if (!importRes.ok) {
        console.error(`   -> Error importing: ${importData.error || 'Failed'}`);
        continue;
      }
      
      const data = importData.data;
      
      const payload = {
        name: data.name || '',
        description: data.description || '',
        card_description: data.cardDescription || '',
        price: parseFloat(data.price || '0'),
        min_qty: parseInt(data.minQty || '1', 10),
        qty_multiple: parseInt(data.qtyMultiple || '1', 10),
        category: data.category || 'General',
        sub_category: data.subCategory || '',
        image: data.image || '',
        images: data.images || [],
        features: data.features ? (Array.isArray(data.features) ? data.features.join(', ') : data.features) : '',
        colors: data.colors ? data.colors.map((c) => ({ name: c.name || '', hex: c.hex || '#000000', image: '' })) : [],
        variations: data.variations ? data.variations.map((v) => ({
          id: v.id || String(v.name || '').toLowerCase().replace(/\s+/g, '-'),
          name: v.name || '',
          options: v.options || []
        })) : []
      };
      
      const saveRes = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!saveRes.ok) {
        const saveErr = await saveRes.json();
        console.error(`   -> Error saving: ${saveErr.error || 'Failed'}`);
      } else {
        console.log(`   -> Successfully saved "${payload.name}"!`);
      }
    } catch (err) {
      console.error(`   -> Exception importing: ${err.message}`);
    }
  }
  console.log('\nBatch import completed!');
}
doImport().catch(console.error);
