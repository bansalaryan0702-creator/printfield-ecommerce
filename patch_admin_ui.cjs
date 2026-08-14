const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const regex = /<div className="flex gap-2 isolate relative z-10">[\s\S]*?<\/div>\s*\{importError\s*&&\s*\([\s\S]*?<\/p>\s*\)\}/m;

const newUI = `<div className="flex gap-2 isolate relative z-10 flex-wrap">
                  <input 
                    type="url" 
                    value={importUrl} 
                    onChange={e => setImportUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white min-w-[300px]" />
                  <Button onClick={handleAIImport} disabled={isImporting || isBatchImporting || !importUrl} className="shrink-0 gap-2" variant="outline">
                    {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Single Product
                  </Button>
                  <Button onClick={() => { setBatchCategoryUrl(importUrl); handleBatchCategoryImport(importUrl); }} disabled={isImporting || isBatchImporting || !importUrl} className="shrink-0 gap-2">
                    {isBatchImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Batch Import (All on Page)
                  </Button>
                </div>
                {importError && (
                  <p className="text-red-500 text-xs mt-2 relative z-10">{importError}</p>
                )}
                {isBatchImporting && (
                  <div className="mt-4 bg-white/80 rounded-lg p-3 text-xs text-gray-700 font-mono h-32 overflow-y-auto border border-purple-100 shadow-inner relative z-10">
                    <p className="font-semibold mb-1 text-purple-700">Batch Import Progress: {batchImportProgress.current} / {batchImportProgress.total}</p>
                    {batchImportLog.map((log, i) => (
                      <div key={i} className="py-0.5">{log}</div>
                    ))}
                  </div>
                )}`;

code = code.replace(regex, newUI);
fs.writeFileSync('src/pages/Admin.tsx', code);
