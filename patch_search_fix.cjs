const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

const target = "p => p.title.toLowerCase().includes(searchQuery.toLowerCase())";
const replacement = "p => (p.title && typeof p.title === 'string' && p.title.toLowerCase().includes(searchQuery.toLowerCase()))";

code = code.replace(target, replacement);

fs.writeFileSync('src/components/layout/Navbar.tsx', code);
console.log("Done fixing search");
