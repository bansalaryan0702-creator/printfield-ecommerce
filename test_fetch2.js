const url = 'https://sagardisplay.com/';
fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  }
}).then(res => {
  console.log('Status:', res.status);
}).catch(err => console.error('Error:', err));
