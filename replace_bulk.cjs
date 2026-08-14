const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const newBulkImport = `
  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsImporting(true);
    setImportError('');
    setImportProgress({ current: 0, total: 0 });
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      if (!json || json.length === 0) {
        throw new Error("No data found in the Excel sheet.");
      }

      setImportProgress({ current: 0, total: json.length });
      
      const chunkSize = 5;
      let totalImported = 0;

      for (let i = 0; i < json.length; i += chunkSize) {
        const chunk = json.slice(i, i + chunkSize);
        
        const res = await apiFetch('/api/products/bulk-smart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({ products: chunk })
        });
        
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to bulk import products');
        
        totalImported += resData.count || 0;
        setImportProgress({ current: Math.min(i + chunkSize, json.length), total: json.length });
      }
      
      alert(\`Successfully auto-mapped and imported \${totalImported} products!\`);
      if (activeTab === 'products') {
        fetchProducts(1);
        setPage(1);
      }
    } catch(err: any) {
      setImportError(err.message || 'Error uploading file');
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };
`;

const regex = /const handleBulkImport = async \(e: React.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?(?=\n  useEffect\(\(\) => \{)/;

if (regex.test(code)) {
    code = code.replace(regex, newBulkImport.trim() + '\n\n');
    fs.writeFileSync('src/pages/Admin.tsx', code);
    console.log("Replaced handleBulkImport successfully!");
} else {
    console.error("Could not find handleBulkImport to replace!");
}
