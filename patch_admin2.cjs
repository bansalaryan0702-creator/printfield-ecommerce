const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const target1 = `  const handleBatchCategoryImport = async () => {
    if (!batchCategoryUrl || !token) return;`;
const replacement1 = `  const handleBatchCategoryImport = async (urlOverride?: string) => {
    const urlToUse = urlOverride || batchCategoryUrl;
    if (!urlToUse || !token) return;`;

const target2 = `        body: JSON.stringify({ url: batchCategoryUrl })`;
const replacement2 = `        body: JSON.stringify({ url: urlToUse })`;

const target3 = `<Button onClick={() => { setBatchCategoryUrl(importUrl); handleBatchCategoryImport(); }} disabled={isImporting || isBatchImporting || !importUrl} className="shrink-0 gap-2">`;
const replacement3 = `<Button onClick={() => { setBatchCategoryUrl(importUrl); handleBatchCategoryImport(importUrl); }} disabled={isImporting || isBatchImporting || !importUrl} className="shrink-0 gap-2">`;


code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
code = code.replace(target3, replacement3);
fs.writeFileSync('src/pages/Admin.tsx', code);
