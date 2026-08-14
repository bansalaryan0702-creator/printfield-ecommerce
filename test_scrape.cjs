const cheerio = require('cheerio');
const { URL } = require('url');

async function test() {
  const url = 'https://sagardisplay.com';
  let parsedUrl = new URL(url);
  const pageRes = await fetch(parsedUrl.toString(), { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        } 
  });
  if (!pageRes.ok) throw new Error("fetch fail " + pageRes.status);
  const html = await pageRes.text();
  const $ = cheerio.load(html);
  
  const baseUrl = parsedUrl.origin;
  const links = new Set();
  $('a').each((i, el) => {
    let href = $(el).attr('href');
    if (href && !href.startsWith('javascript') && !href.startsWith('#') && !href.startsWith('mailto:')) {
        if (href.startsWith('//')) href = 'https:' + href;
        else if (href.startsWith('/')) href = baseUrl + href;
        else if (!href.startsWith('http')) href = baseUrl + '/' + href;
        
        links.add(href.split('#')[0]); 
    }
  });
  console.log("Found links:", links.size);
  const linksArray = Array.from(links);
  console.log(linksArray.slice(0, 5));
}
test().catch(console.error);
