const fs = require('fs');

function replaceFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace product.category || ""
  content = content.replace(/\(product\.category \|\| ""\)\.toLowerCase\(\)/g, 'String(product.category || "").toLowerCase()');
  
  // Replace (v.name || '').toLowerCase()
  content = content.replace(/\(v\.name \|\| ''\)\.toLowerCase\(\)/g, "String(v.name || '').toLowerCase()");

  // Replace (v?.name || '').toLowerCase()
  content = content.replace(/\(v\?\.name \|\| ''\)\.toLowerCase\(\)/g, "String(v?.name || '').toLowerCase()");

  // Replace product.description?.toLowerCase() || ""
  content = content.replace(/product\.description\?\.toLowerCase\(\) \|\| ""/g, 'String(product.description || "").toLowerCase()');

  // Replace p.name?.trim().toLowerCase() 
  content = content.replace(/p\.name\?\.trim\(\)\.toLowerCase\(\)/g, "String(p.name || '').trim().toLowerCase()");
  content = content.replace(/item\.name\?\.trim\(\)\.toLowerCase\(\)/g, "String(item.name || '').trim().toLowerCase()");
  content = content.replace(/g\.name\?\.trim\(\)\.toLowerCase\(\)/g, "String(g.name || '').trim().toLowerCase()");

  // Replace (typeof selVal === 'string' ? selVal : (selVal?.name || '')).trim().toLowerCase()
  content = content.replace(/\(typeof selVal === 'string' \? selVal : \(selVal\?\.name \|\| ''\)\)\.trim\(\)\.toLowerCase\(\)/g, "String(typeof selVal === 'string' ? selVal : (selVal?.name || '')).trim().toLowerCase()");

  // Replace (typeof o === 'string' ? o : (o?.name || '')).trim().toLowerCase()
  content = content.replace(/\(typeof o === 'string' \? o : \(o\?\.name \|\| ''\)\)\.trim\(\)\.toLowerCase\(\)/g, "String(typeof o === 'string' ? o : (o?.name || '')).trim().toLowerCase()");

  fs.writeFileSync(filePath, content);
}

replaceFile('src/pages/ProductDetail.tsx');
replaceFile('server.ts');
console.log('Fixed additional lowercase issues');
