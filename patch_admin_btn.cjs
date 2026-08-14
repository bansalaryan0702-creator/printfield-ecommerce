const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const targetStr = `              <button
                onClick={() => setProductViewMode('bulk_ai')}
                className={\`px-4 py-2 text-sm rounded-md font-medium transition-colors flex items-center gap-1.5 \${
                  productViewMode === 'bulk_ai' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }\`}
              >
                <Wand2 className="h-3.5 w-3.5 text-purple-600" />
                AI Bulk Creator
              </button>`;

const replacementStr = targetStr + `
              <label className={\`cursor-pointer px-4 py-2 text-sm rounded-md font-medium transition-colors flex items-center gap-1.5 \${isImporting ? "text-gray-400" : "text-gray-500 hover:text-gray-900"}\`}>
                <UploadCloud className="h-3.5 w-3.5" />
                {isImporting ? \`Importing... \${importProgress.total ? Math.round((importProgress.current / importProgress.total) * 100) : 0}%\` : "Smart Excel Import"}
                <input type="file" className="hidden" accept=".xlsx,.csv" onChange={handleBulkImport} disabled={isImporting} />
              </label>`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/pages/Admin.tsx', code);
    console.log("Button added!");
} else {
    console.log("Target string not found!");
}
