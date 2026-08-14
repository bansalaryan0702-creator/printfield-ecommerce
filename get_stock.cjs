const fs = require('fs');
async function run() {
  const url = 'http://localhost:3000/api/products?limit=1000';
  const response = await fetch(url);
  const data = await response.json();
  const products = data.data || [];
  const stock = products.filter(p => JSON.stringify(p).includes('unsplash.com'));
  console.log(stock.map(s => s.image || s.images));
}
run();
