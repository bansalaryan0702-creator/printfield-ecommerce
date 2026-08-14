import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/src/components/layout/Layout";
import { Categories } from "@/src/data/products";
import { ProductCard } from "@/src/components/ui/ProductCard";
import { ArrowLeft } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { Button } from '@/src/components/ui/button';
import { Pagination } from "@/src/components/ui/Pagination";
import { SEO } from "../components/SEO";

const ALIAS_MAP: Record<string, string> = {
  'promotional-materials': 'marketing',
  'signages-banners': 'signage',
};

export function CategoryPage() {
  const { categoryId } = useParams();
  const normalizedCategoryId = categoryId ? (ALIAS_MAP[categoryId] || categoryId) : 'all';
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest'); // 'newest', 'price_asc', 'price_desc'
  const [search, setSearch] = useState(urlSearch);
  const [subCategory, setSubCategory] = useState('all');
  const [categoriesData, setCategoriesData] = useState<{name: string, subCategories: string[]}[]>([]);

  useEffect(() => {
    fetch('/api/categories-and-subcategories')
      .then(res => res.json())
      .then(data => {
        const rawArray = Array.isArray(data) ? data : (data && Array.isArray(data.categories) ? data.categories : []);
        setCategoriesData(rawArray);
      })
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  // Synchronize URL search parameter with local state
  useEffect(() => {
    setSearch(urlSearch);
    setPage(1);
  }, [urlSearch]);

  // Synchronize URL subCategory query parameter with local state
  const urlSubCategory = searchParams.get('subCategory') || 'all';
  useEffect(() => {
    setSubCategory(urlSubCategory);
    setPage(1);
  }, [urlSubCategory]);

  const handleSubCategoryChange = (sub: string) => {
    setSubCategory(sub);
    setPage(1);
    setSearchParams((prev) => {
      if (sub && sub !== 'all') {
        prev.set('subCategory', sub);
      } else {
        prev.delete('subCategory');
      }
      return prev;
    }, { replace: true });
  };
  
  // Notice we pass normalizedCategoryId to useProducts
  const { products: displayProducts, loading, pagination, availableSubCategories } = useProducts(page, 18, normalizedCategoryId, sort, search, subCategory);

  useEffect(() => {
     setSubCategory('all');
     setPage(1);
  }, [categoryId]);
  
  const categoryObj = Categories.find(c => c.id === normalizedCategoryId || c.name === normalizedCategoryId || c.name === decodeURIComponent(normalizedCategoryId) || encodeURIComponent(c.name) === normalizedCategoryId);
  const category = normalizedCategoryId === "all" || !normalizedCategoryId 
       ? { name: "All Products", id: "all", image: "https://images.unsplash.com/photo-1563229649-7eaff6322b7a?q=80&w=1600&auto=format&fit=crop" }
       : categoryObj || { name: decodeURIComponent(normalizedCategoryId), id: normalizedCategoryId, image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1600&auto=format&fit=crop" };

  return (
    <Layout>
      <SEO 
        title={`${category.name} | Printfield`}
        description={`Browse our premium collection of ${String(category.name || '').toLowerCase()} for your business needs.`}
        canonicalUrl={`/category/${categoryId || 'all'}`}
        ogImage={category.image}
      />
      {/* Category Header */}
      <div className="relative h-[280px] md:h-[340px] w-full overflow-hidden bg-slate-950 border-b border-slate-800">
        <img referrerPolicy="no-referrer" 
          src={category.image || "https://images.unsplash.com/photo-1563229649-7eaff6322b7a?q=80&w=1600&auto=format&fit=crop"}
          alt={category.name}
          className="w-full h-full object-cover object-center opacity-50 filter saturate-[1.1] contrast-[1.05]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1563229649-7eaff6322b7a?q=80&w=1600&auto=format&fit=crop";
          }}
        />
        {/* Subtle dual gradient overlays for depth & text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end max-w-7xl mx-auto px-4 md:px-6 pb-10 z-10">
          <Link to="/" className="inline-flex items-center text-slate-300 hover:text-white mb-4 transition-colors text-sm font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-2 drop-shadow-sm">
            {category.name}
          </h1>
          <p className="text-slate-300 max-w-2xl text-base md:text-lg font-normal leading-relaxed">
            High-quality custom {String(category.name || '').toLowerCase()} tailored to your specifications.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-20 flex flex-col md:flex-row gap-8">
        
        {/* Filters Sidebar (Hidden on mobile phone view as requested) */}
        <div className="hidden md:block md:w-64 shrink-0 space-y-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 tracking-wider text-sm uppercase">Category</h3>
            <ul className="space-y-3">
              <li key="all">
                 <Link onClick={() => setPage(1)} to="/categories" className={`text-sm ${!normalizedCategoryId || normalizedCategoryId === 'all' ? 'text-purple-600 font-semibold' : 'text-gray-500 hover:text-gray-900'}`}>All Products</Link>
              </li>
              {categoriesData.map(cat => (
                <li key={cat.name}>
                  <Link onClick={() => setPage(1)} to={`/category/${encodeURIComponent(cat.name)}`} className={`text-sm ${normalizedCategoryId === encodeURIComponent(cat.name) || normalizedCategoryId === cat.name ? 'text-purple-600 font-semibold' : 'text-gray-500 hover:text-gray-900'}`}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {availableSubCategories && availableSubCategories.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 tracking-wider text-sm uppercase">Sub Category</h3>
              <ul className="space-y-3">
                 <li key="all-subs">
                   <button onClick={() => { handleSubCategoryChange('all'); }} className={`text-sm ${subCategory === 'all' ? 'text-purple-600 font-semibold' : 'text-gray-500 hover:text-gray-900'} text-left w-full`}>All {category.name}</button>
                </li>
                {availableSubCategories.map(sub => (
                  <li key={sub}>
                    <button onClick={() => { handleSubCategoryChange(sub); }} className={`text-sm ${subCategory === sub ? 'text-purple-600 font-semibold' : 'text-gray-500 hover:text-gray-900'} text-left w-full`}>
                      {sub}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Subcategory Filter Pills for Mobile */}
          {availableSubCategories && availableSubCategories.length > 0 && (
            <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
              <button
                type="button"
                onClick={() => { handleSubCategoryChange('all'); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                  subCategory === 'all' 
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                All {category.name}
              </button>
              {availableSubCategories.map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => { handleSubCategoryChange(sub); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                    subCategory === sub 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-200 gap-4">
            <span>Showing {pagination.total > 0 ? `${(pagination.page - 1) * pagination.limit + 1} - ${Math.min(pagination.page * pagination.limit, pagination.total)} of ` : ''}{pagination.total || displayProducts.length} products</span>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  setPage(1);
                  setSearchParams((prev) => {
                    if (val) {
                      prev.set('search', val);
                    } else {
                      prev.delete('search');
                    }
                    return prev;
                  }, { replace: true });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none min-w-[200px]"
              />
              <select 
                className="px-2 py-2 border bg-transparent font-medium border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none w-full sm:w-auto"
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
              >
                <option value="newest">Sort by Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
          
          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-[400px]"></div>
                ))}
            </div>
          ) : (
            <>
              {displayProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProducts.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <p>No products found in this category.</p>
                </div>
              )}
            </>
          )}
          
          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-12">
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                onPageChange={(target) => { setPage(target); window.scrollTo(0, 300); }}
              />
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
