const fs = require('fs');
const glob = require('glob');

// We want to find any variable followed by optional chaining .name?.toLowerCase() or .name.toLowerCase()
// and replace it with String(var.name || "").toLowerCase()

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix product.name.toLowerCase() and product?.name?.toLowerCase()
  content = content.replace(/([a-zA-Z0-9_]+)\?*\.name\?*\.toLowerCase\(\)/g, "String($1.name || '').toLowerCase()");
  
  // Fix .name.trim().toLowerCase()
  content = content.replace(/([a-zA-Z0-9_]+)\?*\.name\?*\.trim\(\)\.toLowerCase\(\)/g, "String($1.name || '').trim().toLowerCase()");

  // Fix product.category.toLowerCase() and product?.category?.toLowerCase()
  content = content.replace(/([a-zA-Z0-9_]+)\?*\.category\?*\.toLowerCase\(\)/g, "String($1.category || '').toLowerCase()");

  // Fix product.subCategory.toLowerCase() and product?.subCategory?.toLowerCase()
  content = content.replace(/([a-zA-Z0-9_]+)\?*\.subCategory\?*\.toLowerCase\(\)/g, "String($1.subCategory || '').toLowerCase()");

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log("Fixed: " + filePath);
  }
}

glob.sync('src/**/*.{ts,tsx}').forEach(fixFile);

