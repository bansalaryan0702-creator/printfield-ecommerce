const axios = require('axios');
axios.get('https://www.sagardisplay.com/', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}).then(res => console.log('axios success', res.status)).catch(err => console.log('axios err', err.message));
