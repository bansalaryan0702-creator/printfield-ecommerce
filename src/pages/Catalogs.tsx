import { Layout } from "../components/layout/Layout";
import { useState, useEffect } from "react";
import { SEO } from "../components/SEO";
import { FileText, Download, Search } from "lucide-react";
import { apiFetch } from "../lib/api";

interface Catalog {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  createdAt: number;
}

export function Catalogs() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    apiFetch('/api/catalogs')
      .then(res => res.json())
      .then(data => setCatalogs(data.catalogs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allCategories = ['All', ...Array.from(new Set(catalogs.map(c => c.category).filter(Boolean)))];

  const filtered = catalogs.filter(c => {
    const matchesSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (ts: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
  };

  return (
    <Layout>
      <SEO
        title="Product Catalogs | Printfield"
        description="Download our latest product catalogs featuring corporate gifts, promotional items, custom apparel, and printing services in Whitefield, Bangalore."
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2MkgyNHYyaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-10 w-10 text-purple-200" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Product Catalogs
          </h1>
          <p className="text-lg md:text-xl text-purple-100 max-w-2xl">
            Browse and download our latest catalogs. Find inspiration for corporate gifts, promotional merchandise, and custom printing solutions.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search + Category Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search catalogs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          {allCategories.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading catalogs...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">
              {catalogs.length === 0 ? 'No catalogs available yet' : 'No catalogs match your search'}
            </h3>
            <p className="text-gray-400 text-sm mt-2">
              {catalogs.length === 0 ? 'Check back soon — we\'re adding new catalogs regularly.' : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(cat => (
              <div
                key={cat.id}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* PDF Thumbnail */}
                <div className="h-44 bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center relative overflow-hidden">
                  {cat.thumbnail ? (
                    <img src={cat.thumbnail} alt={cat.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-20 h-26 bg-white rounded-lg shadow-md flex flex-col items-center justify-center border border-red-100">
                      <FileText className="h-8 w-8 text-red-400 mb-1" />
                      <span className="text-[10px] font-bold text-red-400 uppercase">PDF</span>
                    </div>
                  )}
                  {cat.category && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur text-xs font-semibold text-purple-700 rounded-full">
                      {cat.category}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 group-hover:text-purple-700 transition-colors">
                    {cat.title}
                  </h3>
                  {cat.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {cat.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    {cat.fileSize > 0 && <span>{formatSize(cat.fileSize)}</span>}
                    {cat.pageCount > 0 && <span>{cat.pageCount} pages</span>}
                    {cat.createdAt > 0 && <span>{formatDate(cat.createdAt)}</span>}
                  </div>
                  <a
                    href={cat.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors w-full justify-center"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
