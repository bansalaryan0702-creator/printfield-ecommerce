const fs = require('fs');

function replaceFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace (p.name || '').toLowerCase()
  content = content.replace(/\(p\.name \|\| ''\)\.toLowerCase\(\)/g, "String(p.name || '').toLowerCase()");

  // Replace (p.category || '').toLowerCase()
  content = content.replace(/\(p\.category \|\| ''\)\.toLowerCase\(\)/g, "String(p.category || '').toLowerCase()");

  // Replace (p.subCategory || '').toLowerCase()
  content = content.replace(/\(p\.subCategory \|\| ''\)\.toLowerCase\(\)/g, "String(p.subCategory || '').toLowerCase()");
  
  // Replace (cat || '').toLowerCase()
  content = content.replace(/\(cat \|\| ''\)\.toLowerCase\(\)/g, "String(cat || '').toLowerCase()");

  // Replace (o.userEmail || o.email || '').toLowerCase()
  content = content.replace(/\(o\.userEmail \|\| o\.email \|\| ''\)\.toLowerCase\(\)/g, "String(o.userEmail || o.email || '').toLowerCase()");
  
  // Replace (parsed.email || '').toLowerCase()
  content = content.replace(/\(parsed\.email \|\| ''\)\.toLowerCase\(\)/g, "String(parsed.email || '').toLowerCase()");

  // Replace (matchedUser.email || '').toLowerCase()
  content = content.replace(/\(matchedUser\.email \|\| ''\)\.toLowerCase\(\)/g, "String(matchedUser.email || '').toLowerCase()");

  fs.writeFileSync(filePath, content);
}

replaceFile('src/components/layout/Navbar.tsx');
replaceFile('src/pages/Admin.tsx');
replaceFile('server.ts');
console.log('Fixed Navbar and others');
