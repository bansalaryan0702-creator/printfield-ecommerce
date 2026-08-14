const fs = require('fs');
const path = require('path');
let code = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

// We need to add state for the suggestions list and whether to show suggestions
const stateHooksTarget = "const [dbProducts, setDbProducts] = useState<any[]>([]);";
const stateHooksReplacement = `const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const suggestions = searchQuery.trim() 
    ? dbProducts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))).slice(0, 5)
    : [];`;

if (code.includes(stateHooksTarget)) {
  code = code.replace(stateHooksTarget, stateHooksReplacement);
} else {
  console.log("Could not find state hooks target.");
}

// Mobile Search Input
const mobileInputTarget = `<input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                />`;

const mobileInputReplacement = `<input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search for products..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    {suggestions.map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setSearchQuery(p.title);
                          setShowSuggestions(false);
                          setShowMobileSearch(false);
                          navigate('/product/' + p.id);
                        }}
                        className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3"
                      >
                        {p.images && p.images[0] ? (
                           <img src={p.images[0]} alt={p.title} className="w-8 h-8 object-cover rounded-md" />
                        ) : (
                           <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center"><Search className="w-4 h-4 text-gray-400" /></div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.title}</p>
                          <p className="text-xs text-gray-500">{p.category || 'Product'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}`;

if (code.includes(mobileInputTarget)) {
  code = code.replace(mobileInputTarget, mobileInputReplacement);
} else {
  console.log("Could not find mobile input target.");
}


// Desktop Search Form
const desktopFormTarget = `<form onSubmit={handleSearchSubmit} className="flex-1 flex items-center justify-center mx-auto max-w-2xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for Business Cards, T-Shirts, Mugs..."
                  className="hidden md:flex w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                />
              </div>
            </form>`;

const desktopFormReplacement = `<form onSubmit={handleSearchSubmit} className="flex-1 flex items-center justify-center mx-auto max-w-2xl relative">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search for Business Cards, T-Shirts, Mugs..."
                  className="hidden md:flex w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    {suggestions.map((p) => (
                      <div 
                        key={p.id}
                        onMouseDown={() => {
                          setSearchQuery(p.title);
                          setShowSuggestions(false);
                          navigate('/product/' + p.id);
                        }}
                        className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3"
                      >
                        {p.images && p.images[0] ? (
                           <img src={p.images[0]} alt={p.title} className="w-10 h-10 object-cover rounded-md border border-gray-100" />
                        ) : (
                           <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center"><Search className="w-4 h-4 text-gray-400" /></div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{p.category || 'Product'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>`;

if (code.includes(desktopFormTarget)) {
  code = code.replace(desktopFormTarget, desktopFormReplacement);
} else {
  console.log("Could not find desktop form target.");
}

fs.writeFileSync('src/components/layout/Navbar.tsx', code);
console.log("Done updating Navbar.tsx");
