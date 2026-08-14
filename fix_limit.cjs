const fs = require('fs');
let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

content = content.replace(
  "setSavedAddresses(updatedAddresses);",
  "updatedAddresses = updatedAddresses.slice(0, 5);\n    setSavedAddresses(updatedAddresses);"
);

fs.writeFileSync('src/pages/Checkout.tsx', content);
