import { apiFetch } from '../lib/api';
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Pagination } from '../components/ui/Pagination';
import { UploadCloud, Plus, Trash2, CheckCircle2, Shield, LogIn, Edit2, X, Wand2, Loader2, FileSpreadsheet, PackageSearch, Eye, EyeOff, Search, Sparkles } from 'lucide-react';
import { OrdersAdmin } from '../components/OrdersAdmin';
import { ChatsAdmin } from '../components/ChatsAdmin';
import { CustomersAdmin } from '../components/CustomersAdmin';
import { getFeaturedImage } from '../lib/imageUtils';
import * as XLSX from 'xlsx';

import { Categories as INITIAL_CATEGORIES } from '../data/products';

// Remove custom Shield as it's imported from lucide-react
import { SEO } from "../components/SEO";

export function Admin() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'chats' | 'customers'>('orders');
  const [productViewMode, setProductViewMode] = useState<'form' | 'list' | 'bulk_ai'>('form');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // AI Bulk Product Creator state
  const [bulkCategory, setBulkCategory] = useState('Custom Apparel');
  const [bulkSubCategory, setBulkSubCategory] = useState('');
  const [bulkProducts, setBulkProducts] = useState<any[]>([
    { name: '', image: '', description: '', cardDescription: '', metaTitle: '', metaDescription: '' }
  ]);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [uploadingRowIndex, setUploadingRowIndex] = useState<number | null>(null);
  const [isUploadingBulkImages, setIsUploadingBulkImages] = useState(false);
  const [bulkImageUploadStatus, setBulkImageUploadStatus] = useState('');
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState('');

  const getStockImageForCategory = (cat: string, sub: string, name: string) => {
    const query = `${sub || cat || 'product'} premium luxury`;
    const normalizedCat = String(cat || '').toLowerCase();
    
    if (normalizedCat.includes('apparel') || normalizedCat.includes('t-shirt') || normalizedCat.includes('shirt')) {
      return ''
    }
    if (normalizedCat.includes('card') || normalizedCat.includes('business')) {
      return ''
    }
    if (normalizedCat.includes('trophies') || normalizedCat.includes('trophy') || normalizedCat.includes('award')) {
      return ''
    }
    if (normalizedCat.includes('gift') || normalizedCat.includes('corporate')) {
      return ''
    }
    if (normalizedCat.includes('signage') || normalizedCat.includes('poster') || normalizedCat.includes('banner')) {
      return ''
    }
    if (normalizedCat.includes('packaging') || normalizedCat.includes('box')) {
      return ''
    }
    
    return ''
  };

  const [categoriesData, setCategoriesData] = useState<{name: string, subCategories: string[]}[]>(() => {
    const map = new Map<string, Set<string>>();
    const defaults = ["Business Cards", "Business Stationery", "Apparel", "Corporate Gifts", "Drinkware", "Promotional Materials", "Signages & Banners", "Trophies"];
    defaults.forEach(d => map.set(d, new Set<string>()));

    if (INITIAL_CATEGORIES && INITIAL_CATEGORIES.length > 0) {
      INITIAL_CATEGORIES.forEach(c => {
        if (c && c.name) {
          const name = c.name.trim();
          if (!map.has(name)) map.set(name, new Set<string>());
          if (c.subCategories) {
            c.subCategories.forEach(sub => {
              if (sub) map.get(name)!.add(sub.trim());
            });
          }
        }
      });
    }

    return Array.from(map.entries()).map(([name, subsSet]) => ({
      name,
      subCategories: Array.from(subsSet).sort()
    })).sort((a, b) => a.name.localeCompare(b.name));
  });

  const allCategories = categoriesData.map(c => c.name);
  
  const fetchCategoriesAndSubcategories = () => {
    apiFetch('/api/categories-and-subcategories')
      .then(res => res.json())
      .then(data => {
        const rawArray = Array.isArray(data) ? data : (data && Array.isArray(data.categories) ? data.categories : []);
        setCategoriesData(rawArray);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  };
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom Apparel');
  const [subCategory, setSubCategory] = useState('');
  const [showCustomSubCategory, setShowCustomSubCategory] = useState(false);
  const [showBulkCustomSubCategory, setShowBulkCustomSubCategory] = useState(false);
  const [price, setPrice] = useState('');
  const [minQty, setMinQty] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [qtyMultiple, setQtyMultiple] = useState('');
  const [description, setDescription] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isGeneratingCardDesc, setIsGeneratingCardDesc] = useState(false);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
  const [isBulkOptimizingSEO, setIsBulkOptimizingSEO] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [features, setFeatures] = useState('');
  const [imageUrlsText, setImageUrlsText] = useState('');
  const [isDisabled, setIsDisabled] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [inMegaMenu, setInMegaMenu] = useState(false);
  const [badge, setBadge] = useState('');
  
  // PDF Catalog Import state
  const [pdfProducts, setPdfProducts] = useState<any[]>([]);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfExtractError, setPdfExtractError] = useState('');
  const [isGeneratingPdfDesc, setIsGeneratingPdfDesc] = useState(false);
  const [pdfImportCategory, setPdfImportCategory] = useState('Corporate Gifts');
  const [pdfImportSubCategory, setPdfImportSubCategory] = useState('');
  
  // List Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Color state
  const [colors, setColors] = useState<{name: string, hex: string, image: string, mockupImage?: string}[]>([]);
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [colorImage, setColorImage] = useState('');
  const [colorMockupImage, setColorMockupImage] = useState('');
  const [savedGlobalColors, setSavedGlobalColors] = useState<any[]>([]);

  useEffect(() => {
    apiFetch('/api/colors')
      .then(res => res.json())
      .then(data => {
        if (data && data.colors) setSavedGlobalColors(data.colors);
      })
      .catch(() => {});
    fetchCategoriesAndSubcategories();
  }, []);

  
  // Variations state
  const [variations, setVariations] = useState<any[]>([]);
  const [variationCat, setVariationCat] = useState('');
  
  // AI Import State
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importError, setImportError] = useState('');

  // Batch Category Import State
  const [batchCategoryUrl, setBatchCategoryUrl] = useState('');
  const [isBatchImporting, setIsBatchImporting] = useState(false);
  const [batchImportLog, setBatchImportLog] = useState<string[]>([]);
  const [batchImportProgress, setBatchImportProgress] = useState({ current: 0, total: 0 });

  // Auth state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleIdPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('admin_token', data.token);
        setToken(data.token);
      } else {
        alert(data.error);
      }
    } catch (error: any) {
      console.error(error);
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if token exists
    const adminToken = localStorage.getItem('admin_token');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // We don't use apiFetch for FormData directly because of Content-Type headers
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok && data.url) {
        setter(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingGallery(true);
    setGalleryUploadProgress(`Uploading 1 of ${files.length}...`);
    
    const adminToken = localStorage.getItem('admin_token');
    let urls = [];
    
    for (let i = 0; i < files.length; i++) {
      setGalleryUploadProgress(`Uploading ${i + 1} of ${files.length}: ${files[i].name}...`);
      try {
        const formData = new FormData();
        formData.append('file', files[i]);
        
        const res = await apiFetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${adminToken}` },
          body: formData
        });
        
        const data = await res.json();
        if (res.ok && data.url) {
          urls.push(data.url);
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    if (urls.length > 0) {
      setImageUrlsText(prev => prev ? prev + '\n' + urls.join('\n') : urls.join('\n'));
    }
    setIsUploadingGallery(false);
    setGalleryUploadProgress('');
  };

  const handleBulkBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingBulkImages(true);
    setBulkImageUploadStatus(`Uploading 1 of ${files.length}...`);
    
    const adminToken = localStorage.getItem('admin_token');
    const newRows: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBulkImageUploadStatus(`Uploading ${i + 1} of ${files.length}: ${file.name}...`);
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await apiFetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${adminToken}` },
          body: formData
        });
        
        const data = await res.json();
        if (res.ok && data.url) {
          const baseFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const formattedName = baseFileName
            .replace(/[-_]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, c => c.toUpperCase());
            
          // Auto-classify image using local CLIP
          let detectedCategory = '';
          try {
            setBulkImageUploadStatus(`Classifying ${i + 1} of ${files.length}: ${file.name}...`);
            const clsRes = await apiFetch('/api/ai/classify-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
              body: JSON.stringify({ imageUrl: data.url })
            });
            if (clsRes.ok) {
              const clsData = await clsRes.json();
              detectedCategory = clsData.category || '';
            }
          } catch {}

          newRows.push({
            name: formattedName,
            image: data.url,
            category: detectedCategory,
            description: '',
            cardDescription: ''
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    if (newRows.length > 0) {
      setBulkProducts(prev => {
        const filteredPrev = prev.filter(p => p.name.trim() !== '' || p.image !== '');
        return [...filteredPrev, ...newRows];
      });
    }
    
    setIsUploadingBulkImages(false);
    setBulkImageUploadStatus('');
  };

  // PDF Catalog Import handlers — fully client-side, no server credits used
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setPdfExtractError('Please upload a PDF file');
      return;
    }

    setIsExtractingPdf(true);
    setPdfExtractError('');
    setPdfProducts([]);

    try {
      // Dynamically load pdfjs-dist in browser — use local worker to avoid CDN version mismatch
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const extracted: any[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        // Render page to canvas
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Crop to 4:3 ratio (center crop)
        const imgW = canvas.width;
        const imgH = canvas.height;
        const targetRatio = 4 / 3;
        const currentRatio = imgW / imgH;

        let cropW: number, cropH: number, sx: number, sy: number;
        if (currentRatio > targetRatio) {
          cropH = imgH;
          cropW = Math.round(imgH * targetRatio);
          sx = Math.round((imgW - cropW) / 2);
          sy = 0;
        } else {
          cropW = imgW;
          cropH = Math.round(imgW / targetRatio);
          sx = 0;
          sy = Math.round((imgH - cropH) / 2);
        }

        // Create cropped canvas
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = 1200;
        cropCanvas.height = 900;
        const cropCtx = cropCanvas.getContext('2d')!;
        
        // Draw cropped + scaled to 1200x900
        cropCtx.drawImage(canvas, sx, sy, cropW, cropH, 0, 0, 1200, 900);

        // Apply sharpening via convolute (unsharp mask approximation)
        // Simple contrast + brightness boost
        const imageData = cropCtx.getImageData(0, 0, 1200, 900);
        const data = imageData.data;
        const contrast = 1.1;
        const brightness = 1.05;
        for (let p = 0; p < data.length; p += 4) {
          data[p] = Math.min(255, Math.max(0, ((data[p] / 255 - 0.5) * contrast + 0.5) * 255 * brightness));
          data[p + 1] = Math.min(255, Math.max(0, ((data[p + 1] / 255 - 0.5) * contrast + 0.5) * 255 * brightness));
          data[p + 2] = Math.min(255, Math.max(0, ((data[p + 2] / 255 - 0.5) * contrast + 0.5) * 255 * brightness));
        }
        cropCtx.putImageData(imageData, 0, 0);

        // Convert to blob and upload to server
        const blob = await new Promise<Blob>((resolve) => {
          cropCanvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92);
        });

        // Upload to server via existing upload endpoint
        const formData = new FormData();
        formData.append('file', blob, `product-${i}.jpg`);

        const adminToken = localStorage.getItem('admin_token');
        const uploadRes = await apiFetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${adminToken}` },
          body: formData
        });

        let imageUrl = '';
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }

        // Extract text for auto-detecting product name
        let extractedText = '';
        let detectedName = '';
        try {
          const textContent = await page.getTextContent();
          const items = textContent.items as any[];

          // Group text items by Y position (same line = similar Y) then sort by X
          // This reconstructs actual lines as they appear in the PDF
          const lineMap: Map<number, { x: number; str: string }[]> = new Map();
          for (const item of items) {
            if (!item.str?.trim()) continue;
            const transform = item.transform as number[] | undefined;
            if (!transform) continue;
            const yRaw = transform[5];
            // Round Y to nearest 2pts to group same-line items
            const yKey = Math.round(yRaw / 2) * 2;
            if (!lineMap.has(yKey)) lineMap.set(yKey, []);
            lineMap.get(yKey)!.push({ x: transform[4], str: item.str });
          }

          // Sort lines by Y descending (top of page first in PDF coordinate system)
          const sortedYKeys = Array.from(lineMap.keys()).sort((a, b) => b - a);
          const lines: string[] = sortedYKeys.map(y => {
            const lineItems = lineMap.get(y)!.sort((a, b) => a.x - b.x);
            return lineItems.map(it => it.str).join(' ').trim();
          }).filter(l => l.length > 0);

          extractedText = lines.join('\n');
          console.log(`[PDF Page ${i}] Lines: ${lines.length}, preview: "${lines.slice(0, 3).join(' | ')}"`);

          // Find the best product name: prefer short title-case or ALL-CAPS lines near the top
          for (const line of lines) {
            // Remove special chars except alphanumeric, spaces, hyphens, ampersands
            const clean = line.replace(/[^a-zA-Z0-9\s\-&\/.]/g, '').trim();
            if (
              clean.length >= 3 &&
              clean.length <= 80 &&
              !/^\d+$/.test(clean) &&       // not just numbers
              !/^[₹$€£]/.test(clean) &&     // not a price line
              !/^(page|pg|www|http)/i.test(clean) // not a page/URL indicator
            ) {
              detectedName = clean.slice(0, 80);
              break;
            }
          }

          // Fallback: first 4 words of all text
          if (!detectedName && extractedText.length > 2) {
            const words = extractedText.split(/\s+/).filter((w: string) => w.length > 1 && /[a-zA-Z]/.test(w));
            if (words.length >= 1) {
              detectedName = words.slice(0, 4).join(' ').replace(/[^a-zA-Z0-9\s\-&\/]/g, '').trim().slice(0, 80);
            }
          }
        } catch (e) {
          console.warn('Text extraction failed for page', i, e);
        }

        extracted.push({
          pageIndex: i,
          name: detectedName || `Product ${i}`,
          imageUrl,
          extractedText: extractedText.slice(0, 500),
          selected: true,
          category: pdfImportCategory,
          subCategory: ''
        });

        // Update state progressively so user sees progress
        setPdfProducts([...extracted]);
      }
    } catch (err: any) {
      setPdfExtractError(err.message || 'Failed to process PDF');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handlePdfProductNameChange = (idx: number, name: string) => {
    setPdfProducts(prev => prev.map((p, i) => i === idx ? { ...p, name } : p));
  };

  const handlePdfProductToggle = (idx: number) => {
    setPdfProducts(prev => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p));
  };

  const handlePdfGenerateDescriptions = async () => {
    const selected = pdfProducts.filter(p => p.selected && p.name.trim());
    if (selected.length === 0) return;

    setIsGeneratingPdfDesc(true);
    try {
      const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
      
      for (let i = 0; i < selected.length; i++) {
        const p = selected[i];
        const origIdx = pdfProducts.indexOf(p);
        setPdfProducts(prev => prev.map((pp, idx) => 
          idx === origIdx ? { ...pp, generating: true } : pp
        ));

        try {
          const res = await apiFetch('/api/ai/generate-product-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({
              imageUrl: p.imageUrl,
              name: p.name,
              category: pdfImportCategory
            })
          });

          if (res.ok) {
            const data = await res.json();
            setPdfProducts(prev => prev.map((pp, idx) => 
              idx === origIdx ? { 
                ...pp, 
                generating: false,
                description: data.description || pp.description,
                cardDescription: data.cardDescription || pp.cardDescription,
                metaTitle: data.metaTitle || pp.metaTitle,
                metaDescription: data.metaDescription || pp.metaDescription
              } : pp
            ));
          } else {
            setPdfProducts(prev => prev.map((pp, idx) => 
              idx === origIdx ? { ...pp, generating: false } : pp
            ));
          }
        } catch (err) {
          console.error('AI generation failed for', p.name, err);
          setPdfProducts(prev => prev.map((pp, idx) => 
            idx === origIdx ? { ...pp, generating: false } : pp
          ));
        }
      }
    } finally {
      setIsGeneratingPdfDesc(false);
    }
  };

  const handlePdfGenerateSingle = async (idx: number) => {
    const p = pdfProducts[idx];
    if (!p || !p.name.trim()) return;

    setPdfProducts(prev => prev.map((pp, i) => i === idx ? { ...pp, generating: true } : pp));

    try {
      const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
      const res = await apiFetch('/api/ai/generate-product-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
          imageUrl: p.imageUrl,
          name: p.name,
          category: pdfImportCategory
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPdfProducts(prev => prev.map((pp, i) => i === idx ? { 
          ...pp, 
          generating: false,
          description: data.description || pp.description,
          cardDescription: data.cardDescription || pp.cardDescription,
          metaTitle: data.metaTitle || pp.metaTitle,
          metaDescription: data.metaDescription || pp.metaDescription
        } : pp));
      } else {
        setPdfProducts(prev => prev.map((pp, i) => i === idx ? { ...pp, generating: false } : pp));
      }
    } catch (err) {
      setPdfProducts(prev => prev.map((pp, i) => i === idx ? { ...pp, generating: false } : pp));
    }
  };

  const handlePdfImportAll = async () => {
    const selected = pdfProducts.filter(p => p.selected && p.name.trim());
    if (selected.length === 0) return;

    const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
    if (!adminToken) {
      alert('Please log in first to import products.');
      return;
    }
    
    const products = selected.map(p => ({
      name: p.name,
      category: p.category || pdfImportCategory,
      subCategory: p.subCategory || '',
      image: p.imageUrl,
      images: [p.imageUrl],
      description: p.description || '',
      cardDescription: p.cardDescription || '',
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      price: 0,
      isDisabled: false
    }));

    try {
      const res = await apiFetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ products, skipImageMove: true })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Imported ${data.count || products.length} products successfully!`);
        setPdfProducts([]);
        // Refresh products list
        const refreshRes = await apiFetch('/api/products', { headers: { 'Authorization': `Bearer ${adminToken}` } });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setProducts(refreshData.products || []);
        }
      } else {
        const err = await res.json();
        alert(`Import failed: ${err.error || 'Unknown error'} (Status: ${res.status})`);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      alert(`Import failed: ${err.message}`);
    }
  };

  const handleBulkRowImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const adminToken = localStorage.getItem('admin_token');
    setUploadingRowIndex(idx);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok && data.url) {
        setBulkProducts(prev => {
          const copy = [...prev];
          copy[idx].image = data.url;
          return copy;
        });
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploadingRowIndex(null);
    }
  };

  const handleGenerateSingleAI = async (idx: number) => {
    const p = bulkProducts[idx];
    if (!p.name.trim()) {
      alert("Please enter a product name first before generating descriptions.");
      return;
    }
    const cat = p.category || bulkCategory;
    if (!cat.trim()) {
      alert("Category is required. Please select or enter a category.");
      return;
    }
    
    setBulkProducts(prev => prev.map((item, i) => i === idx ? { ...item, isGenerating: true } : item));
    
    try {
      const adminToken = localStorage.getItem('admin_token') || token;
      const res = await apiFetch('/api/ai/local-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          task: 'description',
          name: p.name,
          category: cat,
          subCategory: p.subCategory || bulkSubCategory,
          features: p.features || []
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate');
      }
      
      const data = await res.json();
      setBulkProducts(prev => prev.map((item, i) => i === idx ? {
        ...item,
        cardDescription: data.cardDescription || item.cardDescription,
        description: data.description || item.description,
        metaTitle: data.metaTitle || item.metaTitle,
        metaDescription: data.metaDescription || item.metaDescription,
        isGenerating: false
      } : item));
    } catch (err: any) {
      alert(err.message || 'Generation failed');
      setBulkProducts(prev => prev.map((item, i) => i === idx ? { ...item, isGenerating: false } : item));
    }
  };

  const handleGenerateCardDescription = async () => {
    if (!description || !name) {
      alert("Please enter Product Name and Full Description first.");
      return;
    }
    setIsGeneratingCardDesc(true);
    try {
      const res = await apiFetch('/api/ai/local-generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ task: 'cardDescription', name, category, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate description');
      setCardDescription(data.description);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGeneratingCardDesc(false);
    }
  };

  const handleGenerateSEOMeta = async () => {
    if (!name.trim()) {
      alert("Please enter a Product Name first.");
      return;
    }
    setIsGeneratingSEO(true);
    try {
      const res = await apiFetch('/api/ai/local-generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ task: 'seoMeta', name, category, description, cardDescription, features })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate SEO meta tags');
      if (data.metaTitle) setMetaTitle(data.metaTitle);
      if (data.metaDescription) setMetaDescription(data.metaDescription);
    } catch (err: any) {
      const fallbackTitle = `${name} - Custom ${category || 'Printing'} | Printfield`;
      const fallbackDesc = cardDescription || description?.slice(0, 150) || `Order custom printed ${name} online at Printfield. Premium quality, custom designs, and fast delivery.`;
      setMetaTitle(fallbackTitle);
      setMetaDescription(fallbackDesc);
    } finally {
      setIsGeneratingSEO(false);
    }
  };

  const handleBulkOptimizeAllSEO = async (forceOverwrite = false) => {
    if (!confirm(forceOverwrite 
      ? "Re-generate & optimize high-ranking SEO titles and descriptions for ALL products in catalog?" 
      : "Auto-generate high-ranking SEO titles and descriptions for all products missing SEO tags?")) {
      return;
    }
    setIsBulkOptimizingSEO(true);
    try {
      const res = await apiFetch('/api/ai/bulk-optimize-all-seo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ forceOverwrite })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to bulk optimize SEO');
      alert(`SEO Optimization Complete!\n\n${data.message}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Bulk SEO optimization failed');
    } finally {
      setIsBulkOptimizingSEO(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  const decodedToken = token ? (() => { 
    try { 
      const parts = token.split('.');
      if (parts.length === 3) {
        let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const pad = b64.length % 4;
        if (pad) {
          b64 += '='.repeat(4 - pad);
        }
        const decoded = atob(b64);
        return JSON.parse(decodeURIComponent(Array.from(decoded).map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
      }
      return null;
    } catch (e) { 
      return null; 
    } 
  })() : null;
  const userRole = decodedToken?.role || 'admin';

  useEffect(() => {
    if (userRole === 'employee' && activeTab === 'products') {
      setActiveTab('orders');
    } else if (userRole === 'manager' && activeTab === 'products') {
      setActiveTab('orders');
    }
  }, [userRole, activeTab]);

  const handleAddColor = () => {
    if (colorName && colorHex && colorImage) {
      setColors([...colors, { name: colorName, hex: colorHex, image: colorImage, mockupImage: colorMockupImage }]);
      
      // Save globally
      const newGlobal = [...savedGlobalColors];
      if (!newGlobal.find(c => String(c.name || '').toLowerCase() === colorName.toLowerCase())) {
        const updatedGlobal = [...newGlobal, { name: colorName, hex: colorHex, image: colorImage, mockupImage: colorMockupImage }];
        setSavedGlobalColors(updatedGlobal);
        apiFetch('/api/colors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ colors: updatedGlobal })
        }).catch(console.error);
      }
      
      setColorName('');
      setColorHex('#000000');
      setColorImage('');
      setColorMockupImage('');
    } else {
      alert("Please provide name, hex code and image for the color.");
    }
  };
  
  // Ignore old handleAddColor
  const oldHandleAddColor = () => {
    if (colorName && colorHex && colorImage) {
      setColors([...colors, { name: colorName, hex: colorHex, image: colorImage }]);
      setColorName('');
      setColorHex('#000000');
      setColorImage('');
    } else {
      alert("Please provide name, hex code and image for the color.");
    }
  };

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const handleAddCategory = () => {
    if (variationCat) {
      if (!variations.find(v => String(v.name || '').toLowerCase() === variationCat.toLowerCase())) {
        setVariations([...variations, { 
          id: variationCat.toLowerCase().replace(/\s+/g, '-'), 
          name: variationCat, 
          options: [] 
        }]);
      }
      setVariationCat('');
    }
  };

  const [optionInputs, setOptionInputs] = useState<Record<number, {name: string, price: string}>>({});

  const handleUpdateOptionInput = (catIdx: number, field: string, value: string) => {
    setOptionInputs(prev => ({
      ...prev,
      [catIdx]: {
        ...prev[catIdx],
        [field]: value
      }
    }));
  };

  const handleAddOptionToCat = (catIdx: number) => {
    const inputs = optionInputs[catIdx];
    if (inputs && inputs.name && inputs.price) {
      const newVars = [...variations];
      newVars[catIdx].options.push({ name: inputs.name, price: parseFloat(inputs.price) });
      setVariations(newVars);
      setOptionInputs(prev => ({
        ...prev,
        [catIdx]: { name: '', price: '' }
      }));
    } else {
      alert("Please provide option name and price.");
    }
  };

  const handleRemoveCategory = (catIdx: number) => {
    const newVars = [...variations];
    newVars.splice(catIdx, 1);
    setVariations(newVars);
  };


  const handleEditVariationOption = (catIdx: number, optIndex: number, field: 'name' | 'price', value: string) => {
    const newVars = [...variations];
    if (field === 'price') {
      newVars[catIdx].options[optIndex][field] = value ? parseInt(value, 10) : 0;
    } else {
      newVars[catIdx].options[optIndex][field] = value;
    }
    setVariations(newVars);
  };

  const handleRemoveVariationOption = (catIdx: number, optIndex: number) => {
    const newVars = [...variations];
    newVars[catIdx].options.splice(optIndex, 1);
    setVariations(newVars);
  };

  const [aiVariationInput, setAiVariationInput] = useState<Record<number, string>>({});
  const [isProcessingAiVars, setIsProcessingAiVars] = useState<Record<number, boolean>>({});

  const handleNormalizeExistingOptions = (catIdx: number) => {
    const newVars = [...variations];
    const cat = newVars[catIdx];
    if (cat.options.length < 2) {
      alert("Need at least 2 options to normalize prices.");
      return;
    }

    const prices = cat.options.map((opt: any) => opt.price);
    const minPrice = Math.min(...prices);

    if (minPrice === 0) {
      alert("The cheapest option is already 0. No normalization needed.");
      return;
    }

    setPrice(minPrice.toString());

    cat.options = cat.options.map((opt: any) => ({
      ...opt,
      price: opt.price - minPrice
    }));

    setVariations(newVars);
    alert(`Successfully normalized! Set base product price to ₹${minPrice} and adjusted options relative to it.`);
  };

  const handleProcessAiVariations = async (catIdx: number) => {
    const inputText = aiVariationInput[catIdx];
    if (!inputText || !inputText.trim()) {
      alert("Please enter some options and prices (e.g., '2x2 is 1500, 2x3 is 1800')");
      return;
    }

    setIsProcessingAiVars(prev => ({ ...prev, [catIdx]: true }));
    try {
      const res = await apiFetch('/api/ai/normalize-variations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: inputText })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process with AI');

      const parsedOptions = data.options;
      if (!Array.isArray(parsedOptions) || parsedOptions.length === 0) {
        throw new Error("AI could not find any options or prices in your text. Please try with clearer text (e.g. 'Size 2x2 is 1500 and 2x3 is 1800')");
      }

      const minPrice = Math.min(...parsedOptions.map((o: any) => o.fullPrice || 0));

      const newVars = [...variations];
      const normalizedOptions = parsedOptions.map((o: any) => ({
        name: o.name,
        price: (o.fullPrice || 0) - minPrice
      }));

      newVars[catIdx].options = [...newVars[catIdx].options, ...normalizedOptions];
      setVariations(newVars);

      setPrice(minPrice.toString());

      setAiVariationInput(prev => ({ ...prev, [catIdx]: '' }));
      alert(`AI parsed and added ${normalizedOptions.length} options! Set base product price to ₹${minPrice} and made options relative.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessingAiVars(prev => ({ ...prev, [catIdx]: false }));
    }
  };

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const fetchProducts = async (currentPage = page, search = searchQuery, categoryFilter = filterCategory) => {
    try {
      const qs = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        includeDisabled: 'true'
      });
      if (search) qs.append('search', search);
      if (categoryFilter && categoryFilter !== 'all') qs.append('category', categoryFilter);

      const res = await apiFetch(`/api/products?${qs.toString()}`);
      if (res.ok) {
        const resData = await res.json();
        setProducts(resData.data || []);
        setTotalPages(resData.totalPages);
        setTotalCount(resData.total);
      }
    } catch (error) {
      console.error(error);
    }
  };



  const handleAIImport = async () => {
    if (!importUrl || !token) return;
    setIsImporting(true);
    setImportError('');
    try {
      const res = await apiFetch('/api/import-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: importUrl })
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to import product');
      
      const { data } = resData;
      
      setName(data.name || '');
      setDescription(data.description || '');
      setCardDescription(data.cardDescription || '');
      setPrice(data.price?.toString() || '');
      setMinQty(data.minQty?.toString() || '');
      setQtyMultiple(data.qtyMultiple?.toString() || '');
      if (data.category) {
        setCategory(data.category);
      }
      setSubCategory(data.subCategory || '');
      setImageUrl(data.image || '');
      if (data.images && data.images.length > 0) {
        setImageUrlsText(Array.isArray(data.images) ? data.images.join('\n') : (typeof data.images === 'string' ? data.images : ''));
      } else {
        setImageUrlsText('');
      }
      if (data.features && data.features.length > 0) {
        setFeatures(Array.isArray(data.features) ? data.features.join(', ') : (typeof data.features === 'string' ? data.features : ''));
      } else {
        setFeatures('');
      }
      if (data.colors && data.colors.length > 0) {
        setColors(data.colors.map((c: any) => ({ name: c.name || '', hex: c.hex || '#000000', image: '' })));
      } else {
        setColors([]);
      }
      if (data.variations && data.variations.length > 0) {
        setVariations(data.variations.map((v: any) => ({
          id: v.id || String(v.name || '').toLowerCase().replace(/\s+/g, '-'),
          name: v.name || '',
          options: v.options || []
        })));
      } else {
        setVariations([]);
      }
      
      setImportUrl('');
      // smooth scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setImportError(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleBatchCategoryImport = async (urlOverride?: string) => {
    const urlToUse = urlOverride || batchCategoryUrl;
    if (!urlToUse || !token) return;
    setIsBatchImporting(true);
    setBatchImportLog([]);
    setBatchImportProgress({ current: 0, total: 0 });

    const addLog = (msg: string) => setBatchImportLog(prev => [...prev, msg]);

    try {
      addLog('Fetching category links...');
      const scrapeRes = await apiFetch('/api/scrape-category-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: urlToUse })
      });
      
      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Failed to fetch category links');

      const urls = scrapeData.urls || [];
      addLog(`Found ${urls.length} product links. Starting import...`);
      setBatchImportProgress({ current: 0, total: urls.length });

      for (let i = 0; i < urls.length; i++) {
        const prodUrl = urls[i];
        addLog(`[${i + 1}/${urls.length}] Importing: ${prodUrl}`);
        setBatchImportProgress(prev => ({ ...prev, current: i + 1 }));

        try {
          // Import product logic using our internal endpoint
          const importRes = await apiFetch('/api/import-product', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ url: prodUrl })
          });
          const importData = await importRes.json();
          if (!importRes.ok) {
             addLog(`   -> Error importing: ${importData.error || 'Failed'}`);
             continue;
          }
          
          const data = importData.data;
          
          // Construct product object to save
          const payload = {
            name: data.name || '',
            description: data.description || '',
            card_description: data.cardDescription || '',
            price: parseFloat(data.price || '0'),
            min_qty: parseInt(data.minQty || '1', 10),
            qty_multiple: parseInt(data.qtyMultiple || '1', 10),
            category: data.category || '',
            sub_category: data.subCategory || '',
            image: data.image || '',
            images: data.images || [],
            features: data.features ? (Array.isArray(data.features) ? data.features.join(', ') : data.features) : '',
            colors: data.colors ? data.colors.map((c: any) => ({ name: c.name || '', hex: c.hex || '#000000', image: '' })) : [],
            variations: data.variations ? data.variations.map((v: any) => ({
              id: v.id || String(v.name || '').toLowerCase().replace(/\s+/g, '-'),
              name: v.name || '',
              options: v.options || []
            })) : []
          };

          const saveRes = await apiFetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          if (!saveRes.ok) {
            const saveErr = await saveRes.json();
            addLog(`   -> Error saving: ${saveErr.error || 'Failed'}`);
          } else {
            addLog(`   -> Successfully saved "${payload.name}"!`);
          }
        } catch (err: any) {
           addLog(`   -> Exception importing: ${err.message}`);
        }
      }

      addLog('Batch import completed!');
      fetchProducts(); // Refresh the list
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    } finally {
      setIsBatchImporting(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

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
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ products: chunk })
        });
        
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to bulk import products');
        
        totalImported += resData.count || 0;
        setImportProgress({ current: Math.min(i + chunkSize, json.length), total: json.length });
        
        // Add a small delay between chunks to avoid rate limiting
        if (i + chunkSize < json.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      alert(`Successfully auto-mapped and imported ${totalImported} products!`);
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


  useEffect(() => {
    if (token) {
      if (activeTab === 'products') {
        fetchProducts(page);
      }
    }
  }, [token, page, activeTab, searchQuery, filterCategory]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      let finalColors = [...colors];
      if (colorName && colorHex) {
        finalColors.push({ name: colorName, hex: colorHex, image: colorImage, mockupImage: colorMockupImage });
        setColors(finalColors);
        setColorName('');
        setColorHex('#000000');
        setColorImage('');
        setColorMockupImage('');
      }
      const formatImageUrl = (url: string) => {
        const driveIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (driveIdMatch && driveIdMatch[1]) {
          return `/api/proxy-image/${driveIdMatch[1]}`;
        }
        return url;
      };

      const images = imageUrlsText.split('\n').map(url => formatImageUrl(url.trim())).filter(Boolean);
      const formattedMainImage = formatImageUrl(imageUrl);
      
      const productData = {
        name,
        category,
        subCategory,
        price: parseFloat(price),
        minQty: minQty ? parseInt(minQty, 10) : undefined,
        stockQty: stockQty ? parseInt(stockQty, 10) : undefined,
        qtyMultiple: qtyMultiple ? parseInt(qtyMultiple, 10) : undefined,
        description,
        cardDescription,
        metaTitle,
        metaDescription,
        image: formattedMainImage,
        images,
        isDisabled,
        isBestseller,
        inMegaMenu,
        badge,
        colors: finalColors,
        variations
      };

      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${editingId ? 'update' : 'add'} product`);
      }
      
      // Reset form
      setName('');
      setCategory('Custom Apparel');
      setSubCategory('');
      setShowCustomSubCategory(false);
      setPrice('');
      setMinQty('');
      setQtyMultiple('');
      setDescription('');
      setCardDescription('');
      setMetaTitle('');
      setMetaDescription('');
      setImageUrl('');
      setImageUrlsText('');
      setFeatures('');
      setColors([]);
      setVariations([]);
      setIsDisabled(false);
      setIsBestseller(false);
      setInMegaMenu(false);
      setBadge('');
      setEditingId(null);
      setProductViewMode('list');
      setPage(1);
      setSearchQuery('');
      setFilterCategory('all');
      
      fetchProducts(1, '', 'all');
      fetchCategoriesAndSubcategories();
      alert(`Product ${editingId ? 'updated' : 'added'} successfully!`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEditProduct = (p: any) => {
    setProductViewMode('form');
    setEditingId(p.id);
    setName(p.name);
    const catName = p.category || 'Custom Apparel';
    setCategory(catName);
    const subName = p.subCategory || '';
    setSubCategory(subName);
    const currentSubs = categoriesData.find(c => c.name === catName)?.subCategories || [];
    const isCustom = subName && !currentSubs.includes(subName);
    setShowCustomSubCategory(!!isCustom);
    setPrice(p.price?.toString() || '');
    setMinQty(p.minQty?.toString() || '');
    setQtyMultiple(p.qtyMultiple?.toString() || '');
    setDescription(p.description || '');
    setCardDescription(p.cardDescription || '');
    setMetaTitle(p.metaTitle || '');
    setMetaDescription(p.metaDescription || '');
    setImageUrl(p.image || '');
    setImageUrlsText(Array.isArray(p.images) ? p.images.join('\n') : (typeof p.images === 'string' ? p.images : ''));
    setFeatures(Array.isArray(p.features) ? p.features.join(', ') : (typeof p.features === 'string' ? p.features : ''));
    setColors(p.colors || []);
    setVariations(p.variations || []);
    setIsDisabled(!!p.isDisabled);
    setIsBestseller(!!p.isBestseller);
    setInMegaMenu(!!p.inMegaMenu);
    setBadge(p.badge || '');
    // smooth scroll to top where form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setProductViewMode('list');
    setEditingId(null);
    setName('');
    setCategory('Custom Apparel');
    setSubCategory('');
    setShowCustomSubCategory(false);
    setPrice('');
    setMinQty('');
    setQtyMultiple('');
    setDescription('');
    setCardDescription('');
    setMetaTitle('');
    setMetaDescription('');
    setImageUrl('');
    setImageUrlsText('');
    setFeatures('');
    setColors([]);
    setVariations([]);
    setIsDisabled(false);
    setIsBestseller(false);
    setInMegaMenu(false);
    setBadge('');
  };

  const promptDeleteProduct = (productOrId: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof productOrId === 'string') {
      const found = products.find(p => p.id === productOrId || p._id === productOrId || p.name === productOrId);
      setProductToDelete(found || { id: productOrId, name: productOrId });
    } else if (productOrId && typeof productOrId === 'object') {
      setProductToDelete(productOrId);
    }
  };

  const handleDeleteProduct = (id: string, e?: React.MouseEvent) => {
    promptDeleteProduct(id, e);
  };

  const confirmAndExecuteDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    const rawTarget = String(productToDelete.id || productToDelete._id || productToDelete.name || '').trim();
    const activeToken = token || localStorage.getItem('admin_token');

    try {
      // Optimistically remove from state immediately
      setProducts(prev => prev.filter(p => 
        String(p.id || '').trim() !== rawTarget && 
        String(p._id || '').trim() !== rawTarget &&
        String(p.name || '').trim().toLowerCase() !== String(productToDelete.name || '').trim().toLowerCase()
      ));

      const res = await apiFetch(`/api/products/${encodeURIComponent(rawTarget)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });

      if (res.ok) {
        setStatusNotification({
          type: 'success',
          message: `Successfully deleted product "${productToDelete.name || rawTarget}".`
        });
        if (editingId && (editingId === rawTarget || editingId === productToDelete.id)) {
          handleCancelEdit();
        }
        fetchProducts();
        fetchCategoriesAndSubcategories();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusNotification({
          type: 'error',
          message: `Failed to delete product: ${err.error || 'Server error'}`
        });
        fetchProducts();
      }
    } catch (error: any) {
      console.error("Error deleting product:", error);
      setStatusNotification({
        type: 'error',
        message: "Error deleting product: " + (error.message || String(error))
      });
      fetchProducts();
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
      setTimeout(() => setStatusNotification(null), 5000);
    }
  };

  const handleToggleEnableProduct = async (id: string, currentStatus: boolean) => {
    try {
      const res = await apiFetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isDisabled: !currentStatus })
      });
      if (res.ok) {
        fetchProducts();
        fetchCategoriesAndSubcategories();
      } else {
        alert("Failed to toggle visibility status");
      }
    } catch (error) {
       console.error(error);
       alert("Error toggling status.");
    }
  };

  if (!token) {
    return (
      <Layout>
        <SEO title="Admin Login | Printfield" description="Admin login" canonicalUrl="/admin" robots="noindex, nofollow" />
        <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
          <UploadCloud className="h-16 w-16 text-purple-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Staff Portal</h1>
          <p className="text-gray-600 mb-8">Sign in to access the staff dashboard.</p>
          
          <form onSubmit={handleIdPasswordLogin} className="space-y-4 mb-6">
            <div>
              <input 
                type="text" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-left"
                placeholder="Email/Username" />

            </div>
            <div>
              <input 
                type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-left"
                placeholder="Password" />

            </div>
            <Button type="submit" className="w-full py-4 text-lg bg-purple-600 hover:bg-purple-700 text-white font-bold" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>


          </form>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Admin Dashboard | Printfield" description="Admin dashboard" canonicalUrl="/admin" robots="noindex, nofollow" />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
            <p className="text-gray-600">Overview & Management</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
               <p className="text-sm font-medium text-gray-900 capitalize">{userRole}</p>
             </div>
             <Button variant="ghost" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200 mb-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 text-sm rounded-t-xl ${
              activeTab === 'orders' ? 'border-purple-600 text-purple-700 bg-purple-50/80 shadow-xs' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📋 Quotation Requests
          </button>
          
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-3 px-5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 text-sm rounded-t-xl ${
                activeTab === 'products' ? 'border-purple-600 text-purple-700 bg-purple-50/80 shadow-xs' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📦 Products Catalog
            </button>
          )}

          <button
            onClick={() => setActiveTab('chats')}
            className={`pb-3 px-5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 text-sm rounded-t-xl ${
              activeTab === 'chats' ? 'border-purple-600 text-purple-700 bg-purple-50/80 shadow-xs' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            💬 AI Customer Chats
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-3 px-5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 text-sm rounded-t-xl ${
              activeTab === 'customers' ? 'border-purple-600 text-purple-700 bg-purple-50/80 shadow-xs' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            👥 Customers Database & Bulk Email ✉️
          </button>
        </div>

        {activeTab === 'customers' && <CustomersAdmin token={token} />}
        {activeTab === 'chats' && <ChatsAdmin token={token} />}
        {activeTab === 'orders' && <OrdersAdmin token={token} userRole={userRole} />}
        

        {activeTab === 'products' && userRole === 'admin' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {productViewMode === 'form' ? (editingId ? 'Edit Product' : 'Add New Product') : productViewMode === 'bulk_ai' ? 'AI Bulk Product Creator' : 'Manage Products'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  AWS S3 Bucket Connected: <code className="font-mono text-emerald-800">printfielddigital</code>
                </span>
                <span className="text-xs text-gray-500">Showing {totalCount} S3 Catalog items</span>
              </div>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setProductViewMode('form')}
                className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                  productViewMode === 'form' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {editingId ? 'Edit Product Form' : 'Add Product'}
              </button>
              <button
                onClick={() => setProductViewMode('list')}
                className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                  productViewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Manage Products
              </button>
              <button
                onClick={() => setProductViewMode('bulk_ai')}
                className={`px-4 py-2 text-sm rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  productViewMode === 'bulk_ai' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Wand2 className="h-3.5 w-3.5 text-purple-600" />
                AI Bulk Creator
              </button>
              <label className={`cursor-pointer px-4 py-2 text-sm rounded-md font-medium transition-colors flex items-center gap-1.5 ${isImporting ? "text-gray-400" : "text-gray-500 hover:text-gray-900"}`}>
                <UploadCloud className="h-3.5 w-3.5" />
                {isImporting ? `Importing... ${importProgress.total ? Math.round((importProgress.current / importProgress.total) * 100) : 0}%` : "Smart Excel Import"}
                <input type="file" className="hidden" accept=".xlsx,.csv" onChange={handleBulkImport} disabled={isImporting} />
              </label>
              <button
                onClick={() => handleBulkOptimizeAllSEO(true)}
                disabled={isBulkOptimizingSEO}
                className="px-3.5 py-2 text-sm rounded-md font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ml-1"
                title="Automatically generate high-ranking Google search titles and meta descriptions for all existing products using AI"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                {isBulkOptimizingSEO ? 'SEO Optimizing...' : '⚡ AI SEO All Products'}
              </button>
              <label className={`cursor-pointer px-4 py-2 text-sm rounded-md font-medium transition-colors flex items-center gap-1.5 ${isExtractingPdf ? "text-gray-400" : "text-gray-500 hover:text-gray-900"}`}>
                <FileSpreadsheet className="h-3.5 w-3.5 text-orange-500" />
                {isExtractingPdf ? 'Extracting...' : 'PDF Catalog Import'}
                <input type="file" className="hidden" accept=".pdf" onChange={handlePdfUpload} disabled={isExtractingPdf} />
              </label>
            </div>
          </div>
          
          {productViewMode === 'form' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
{/*             AI Auto Import */}
            {!editingId && (
              <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-sm border border-purple-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Wand2 className="w-24 h-24 text-purple-900" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2 relative z-10">
                  <Wand2 className="h-5 w-5 text-purple-600" />
                  Auto-Import with AI
                </h2>
                <p className="text-sm text-gray-600 mb-4 relative z-10">Paste a link to any product from another website. We'll automatically extract the details, pricing, and images.</p>
                <div className="flex gap-2 isolate relative z-10 flex-wrap">
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
                )}
              </div>
            )}

            {/* Add New Product Form container starts here directly after AI Auto Import */}


            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                {editingId ? <Edit2 className="h-5 w-5 text-purple-600" /> : <Plus className="h-5 w-5 text-purple-600" />}
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input 
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Premium Cotton T-shirt"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-semibold">Category</label>
                    <select
                      value={allCategories.includes(category) ? category : "custom"}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "custom") {
                          setCategory("");
                        } else {
                          setCategory(val);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white mb-2"
                    >
                      <option value="" disabled>Select a Category</option>
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="custom">+ Create Custom Category...</option>
                    </select>

                    {(!allCategories.includes(category) || category === "") && (
                      <input 
                        type="text" 
                        required 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Type new custom category name"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category (Optional)</label>
                    <select
                      value={showCustomSubCategory ? "custom" : subCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "custom") {
                          setShowCustomSubCategory(true);
                          setSubCategory("");
                        } else {
                          setShowCustomSubCategory(false);
                          setSubCategory(val);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white mb-2"
                    >
                      <option value="">No Sub Category (None)</option>
                      {(categoriesData.find(c => c.name === category)?.subCategories || []).map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                      <option value="custom">+ Create Custom Subcategory...</option>
                    </select>

                    {showCustomSubCategory && (
                      <input 
                        type="text" 
                        required={showCustomSubCategory}
                        value={subCategory} 
                        onChange={e => setSubCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none animate-fadeIn"
                        placeholder="Type new custom subcategory name"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input 
                    type="number" required value={price} onChange={e => setPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />

                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity (Optional)</label>
                    <input 
                      type="number" value={minQty} onChange={e => setMinQty(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qty Multiple (Optional)</label>
                    <input 
                      type="number" value={qtyMultiple} onChange={e => setQtyMultiple(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity (Optional)</label>
                    <input 
                      type="number" value={stockQty} onChange={e => setStockQty(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="e.g. 100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Image URL / Upload</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" required value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="https://... or upload image"
                    />
                    <label className="cursor-pointer bg-gray-100 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-1">
                      <UploadCloud className="w-4 h-4" /> Upload
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setImageUrl)} />
                    </label>
                  </div>
                  {imageUrl && (
                    <div className="mt-2.5 flex items-center gap-3 bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-white">
                        <img 
                          src={imageUrl} 
                          alt="Primary image preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <div style={{ display: 'none' }} className="w-full h-full flex-col items-center justify-center text-red-500 bg-red-50 p-1 text-[10px] text-center font-medium">
                          <span>Invalid Image</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider">Primary Image</span>
                          <span className="text-xs text-gray-600 truncate max-w-[240px] font-mono">{imageUrl}</span>
                        </div>
                        <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Loaded & ready for product card
                        </p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setImageUrl('')} 
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shrink-0" 
                        title="Remove Primary Image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images (Optional)</label>
                  <p className="text-xs text-gray-500 mb-2">Paste image URLs here, one per line, or upload multiple files.</p>
                  <div className="flex flex-col gap-2">
                    <textarea 
                      value={imageUrlsText} onChange={e => setImageUrlsText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]"
                      placeholder="Enter one URL per line"
                    />
                    <div className="flex items-center gap-3">
                      <label className={`cursor-pointer self-start bg-gray-100 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-1 ${isUploadingGallery ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploadingGallery ? (
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        ) : (
                          <UploadCloud className="w-4 h-4" />
                        )}
                        <span>{isUploadingGallery ? 'Uploading...' : 'Upload Multiple Images'}</span>
                        <input type="file" multiple className="hidden" accept="image/*" disabled={isUploadingGallery} onChange={handleMultipleFileUpload} />
                      </label>
                      {isUploadingGallery && (
                        <span className="text-xs text-purple-600 font-medium animate-pulse">{galleryUploadProgress}</span>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const galleryList = imageUrlsText.split('\n').map(u => u.trim()).filter(Boolean);
                    if (galleryList.length === 0) return null;
                    return (
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between items-center text-xs text-gray-600 font-semibold">
                          <span>Gallery Image Previews ({galleryList.length})</span>
                          <button 
                            type="button" 
                            onClick={() => setImageUrlsText('')} 
                            className="text-red-500 hover:text-red-700 hover:underline text-[11px] font-medium"
                          >
                            Clear All Gallery Images
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 max-h-72 overflow-y-auto">
                          {galleryList.map((url, idx) => (
                            <div key={idx} className="relative group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all">
                              <div className="aspect-square w-full relative bg-gray-100">
                                <img 
                                  src={url} 
                                  alt={`Gallery preview ${idx + 1}`} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextElementSibling) {
                                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                    }
                                  }}
                                />
                                <div style={{ display: 'none' }} className="w-full h-full flex-col items-center justify-center text-red-500 bg-red-50 p-1 text-[10px] text-center font-medium">
                                  <span>Failed to load</span>
                                </div>
                                
                                <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  #{idx + 1}
                                </span>

                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const updated = galleryList.filter((_, i) => i !== idx);
                                    setImageUrlsText(updated.join('\n'));
                                  }}
                                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition-transform hover:scale-110"
                                  title="Remove Image"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="p-1.5 flex flex-col gap-1 bg-white border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const target = galleryList[idx];
                                    const updatedGallery = galleryList.filter((_, i) => i !== idx);
                                    if (imageUrl) {
                                      updatedGallery.push(imageUrl);
                                    }
                                    setImageUrl(target);
                                    setImageUrlsText(updatedGallery.join('\n'));
                                  }}
                                  className="text-[10px] font-semibold text-purple-700 hover:bg-purple-50 py-1 px-1.5 rounded text-center transition-colors border border-purple-100"
                                  title="Set this image as primary"
                                >
                                  Set as Primary
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Card Description (Short)</label>
                    <button 
                      type="button" 
                      onClick={handleGenerateCardDescription} 
                      disabled={isGeneratingCardDesc}
                      className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded disabled:opacity-50"
                    >
                      <Wand2 className="w-3 h-3" />
                      {isGeneratingCardDesc ? 'Generating...' : 'AI Generate'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Shown only on product cards in the listing. If empty, the main description is used.</p>
                  <textarea 
                    value={cardDescription} onChange={e => setCardDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-16"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                  <textarea 
                    required value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-24"
                  />
                </div>

                {/* Search Engine Optimization (SEO) Meta Section */}
                <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-gray-900">Search Engine Optimization (SEO)</h4>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleGenerateSEOMeta} 
                      disabled={isGeneratingSEO}
                      className="text-xs flex items-center gap-1.5 text-blue-700 hover:text-blue-800 bg-white border border-blue-200 shadow-sm px-2.5 py-1 rounded-md font-medium disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      {isGeneratingSEO ? 'Generating SEO Meta...' : 'AI Auto-Fill SEO Meta'}
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        SEO Meta Title
                      </label>
                      <span className={`text-xs ${metaTitle.length > 60 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                        {metaTitle.length} / 60 chars
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={metaTitle} 
                      onChange={e => setMetaTitle(e.target.value)}
                      placeholder={name ? `${name} - Custom Printing | Printfield` : "e.g. Custom Printed Cotton T-Shirt | High Quality | Printfield"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Title tag displayed in Google Search results. (Recommended: 50-60 characters)
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        SEO Meta Description
                      </label>
                      <span className={`text-xs ${metaDescription.length > 160 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                        {metaDescription.length} / 160 chars
                      </span>
                    </div>
                    <textarea 
                      value={metaDescription} 
                      onChange={e => setMetaDescription(e.target.value)}
                      placeholder={cardDescription || (description ? description.slice(0, 150) : "e.g. Order custom printed products online with fast delivery, durable finishes, and no minimum orders at Printfield.")}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white resize-none"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Snippet summary shown below the title on search engines. (Recommended: 140-160 characters)
                    </p>
                  </div>

                  {/* Live Google Search Preview snippet */}
                  {(metaTitle || metaDescription || name) && (
                    <div className="mt-3 pt-3 border-t border-blue-100 bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Google Search Result Preview</span>
                      <div className="font-sans">
                        <div className="text-xs text-emerald-800 font-normal truncate">https://printfieldonline.com › product › {name ? name.toLowerCase().replace(/\s+/g, '-') : 'product-id'}</div>
                        <div className="text-sm text-blue-800 hover:underline font-medium line-clamp-1">
                          {metaTitle || `${name || 'Product Title'} - Custom Printing | Printfield`}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                          {metaDescription || cardDescription || (description ? description.slice(0, 150) : 'Custom printed products with high quality finish and fast shipping from Printfield.')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Product Colors (Optional)</label>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" value={colorName} onChange={e => setColorName(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Color Name (e.g. Red)"
                      />
                      <input 
                        type="color" value={colorHex} onChange={e => setColorHex(e.target.value)}
                        className="w-full h-8 cursor-pointer rounded border border-gray-300"
                        title="Choose Color"
                      />
                    </div>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="url" value={colorImage} onChange={e => setColorImage(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Product Image URL for this color"
                      />
                      <label className="cursor-pointer bg-gray-100 px-2 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-200 flex items-center">
                        <UploadCloud className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setColorImage)} />
                      </label>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="url" value={colorMockupImage} onChange={e => setColorMockupImage(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Mockup Image URL for this color (Optional)"
                      />
                      <label className="cursor-pointer bg-gray-100 px-2 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-200 flex items-center">
                        <UploadCloud className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setColorMockupImage)} />
                      </label>
                    </div>
                    <Button type="button" variant="outline" onClick={handleAddColor} className="w-full text-sm py-1 h-8">
                      <Plus className="h-4 w-4 mr-1" /> Add Color
                    </Button>
                  </div>

                  {colors.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Added Colors:</p>
                      {colors.map((c, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-2 border border-gray-200 rounded-lg text-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: c.hex }}></span>
                            <span className="font-medium">{c.name}</span>
                            {c.image && (
                              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 text-xs">
                                <img src={c.image} alt={c.name} referrerPolicy="no-referrer" className="w-4 h-4 rounded object-cover border border-blue-200" />
                                <span>Image</span>
                              </div>
                            )}
                            {c.mockupImage && (
                              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 text-xs">
                                <img src={c.mockupImage} alt={`${c.name} mockup`} referrerPolicy="no-referrer" className="w-4 h-4 rounded object-cover border border-emerald-200" />
                                <span>Mockup</span>
                              </div>
                            )}
                          </div>
                          <button type="button" onClick={() => handleRemoveColor(i)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Product Variations (Optional)</label>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" value={variationCat} onChange={e => setVariationCat(e.target.value)} 
                      placeholder="New Category Name (e.g. Material)" 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleAddCategory}>
                      <Plus className="w-4 h-4 mr-2" /> Add Category
                    </Button>
                  </div>

                  {variations.length > 0 && (
                    <div className="space-y-4 mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Categories & Options:</p>
                      {variations.map((v, catIdx) => (
                        <div key={catIdx} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                            <h4 className="font-semibold text-gray-900">{v.name}</h4>
                            <button type="button" onClick={() => handleRemoveCategory(catIdx)} className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-2 mb-3">
                            {v.options.map((opt: any, optIdx: number) => (
                              <div key={optIdx} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50 p-2 rounded text-sm">
                                <input 
                                  type="text" 
                                  value={opt.name} 
                                  onChange={(e) => handleEditVariationOption(catIdx, optIdx, 'name', e.target.value)}
                                  className="flex-1 bg-white border border-gray-200 px-2 py-1 rounded outline-none focus:border-purple-400"
                                  placeholder="Option name"
                                />
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center bg-white border border-gray-200 rounded px-2 focus-within:border-purple-400 overflow-hidden">
                                    <span className="text-gray-500 mr-1">+₹</span>
                                    <input 
                                      type="number" 
                                      value={opt.price === 0 ? '' : opt.price} 
                                      onChange={(e) => handleEditVariationOption(catIdx, optIdx, 'price', e.target.value)}
                                      className="w-20 py-1 outline-none"
                                      placeholder="0"
                                    />
                                  </div>
                                  <button type="button" onClick={() => handleRemoveVariationOption(catIdx, optIdx)} className="text-red-500 hover:text-red-700 p-1 shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {v.options.length === 0 && (
                              <p className="text-xs text-gray-400 italic">No options added yet. Add below.</p>
                            )}
                          </div>

                          {/* AI Smart Price Normalizer Helper */}
                          <div className="mb-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-purple-800 flex items-center gap-1">
                                <Wand2 className="w-3.5 h-3.5" /> AI Smart Price Normalizer
                              </span>
                              {v.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleNormalizeExistingOptions(catIdx)}
                                  className="text-[11px] font-medium text-purple-700 bg-white hover:bg-purple-100 px-2 py-1 rounded border border-purple-200 transition"
                                  title="Make the cheapest option +₹0 and adjust others relative to it"
                                >
                                  Normalize Existing Prices
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-purple-600 mb-2 leading-relaxed">
                              Paste/type full prices (e.g. <span className="font-semibold font-mono bg-purple-100 px-1 rounded text-purple-800">2x2: 1500, 2x3: 1800</span>), and AI will parse them, make the cheapest option <span className="font-semibold">+₹0</span> (included in base price), calculate differences, and update product price!
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="e.g. Size 2x2 is 1500 and 2x3 is 1800"
                                value={aiVariationInput[catIdx] || ''}
                                onChange={(e) => setAiVariationInput(prev => ({ ...prev, [catIdx]: e.target.value }))}
                                className="flex-1 px-3 py-1.5 border border-purple-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none placeholder-purple-300"
                              />
                              <button
                                type="button"
                                disabled={isProcessingAiVars[catIdx]}
                                onClick={() => handleProcessAiVariations(catIdx)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1 shrink-0 shadow-sm"
                              >
                                {isProcessingAiVars[catIdx] ? 'Adding...' : 'AI Normalize & Add'}
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={optionInputs[catIdx]?.name || ''} 
                              onChange={e => handleUpdateOptionInput(catIdx, 'name', e.target.value)} 
                              placeholder="Option Name (e.g. Glossy)" 
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input 
                              type="number" 
                              value={optionInputs[catIdx]?.price || ''} 
                              onChange={e => handleUpdateOptionInput(catIdx, 'price', e.target.value)} 
                              placeholder="Additional Price" 
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => handleAddOptionToCat(catIdx)}>
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isDisabled} 
                      onChange={e => setIsDisabled(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Disable product on website</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isBestseller} 
                      onChange={e => setIsBestseller(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Mark as Bestseller</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={inMegaMenu} 
                      onChange={e => setInMegaMenu(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Show in Mega Menu (Navigation dropdown)</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Badge (Optional)</label>
                    <select
                      value={badge}
                      onChange={e => setBadge(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                    >
                      <option value="">No Badge (Default)</option>
                      <option value="Popular">Popular</option>
                      <option value="Recommended">Recommended</option>
                      <option value="NEW">NEW</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button type="submit" className="flex-1 py-3 text-lg">
                    {editingId ? 'Update Product' : 'Add Product'}
                  </Button>
                  {editingId && (
                    <>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={(e) => promptDeleteProduct({ id: editingId, name }, e)} 
                        className="py-3 text-lg px-4 text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancelEdit} className="py-3 text-lg px-6">
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
          )}

          {/* PDF Catalog Import Panel */}
          {pdfProducts.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-orange-500" />
                    PDF Catalog — {pdfProducts.length} products extracted
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Review names, generate AI descriptions, then import all at once</p>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={pdfImportCategory}
                    onChange={(e) => setPdfImportCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {['Corporate Gifts', 'Apparel', 'Trophies', 'Signage', 'Drinkware', 'Business Stationery', 'Personalised Gifts', 'Packaging', 'Marketing', 'Photo Prints'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    onClick={handlePdfGenerateDescriptions}
                    disabled={isGeneratingPdfDesc || pdfProducts.filter(p => p.selected).length === 0}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGeneratingPdfDesc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isGeneratingPdfDesc ? 'Generating...' : 'AI Generate All'}
                  </button>
                  <button
                    onClick={handlePdfImportAll}
                    disabled={pdfProducts.filter(p => p.selected && p.name.trim()).length === 0}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Import ({pdfProducts.filter(p => p.selected && p.name.trim()).length})
                  </button>
                  <button
                    onClick={() => setPdfProducts([])}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {pdfProducts.map((p, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl border transition-all relative group ${p.selected ? 'bg-gray-50/50 border-gray-200 hover:border-orange-200' : 'bg-gray-100/50 border-gray-100 opacity-50'}`}>
                    
                    {p.generating && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
                        <p className="text-xs font-bold text-purple-700">AI Generating...</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Image Preview + Toggle (3 cols) */}
                      <div className="md:col-span-3 bg-white p-2 rounded-xl border border-gray-200 relative aspect-square">
                        <img 
                          src={p.imageUrl} 
                          alt={p.name || 'Preview'} 
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handlePdfProductToggle(idx)}
                          className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${p.selected ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-300'}`}
                        >
                          {p.selected && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Editable Fields (9 cols) */}
                      <div className="md:col-span-9 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Product Name</label>
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => handlePdfProductNameChange(idx, e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 focus:border-orange-500 rounded-lg text-sm bg-white font-semibold text-gray-800 outline-none transition-colors"
                              placeholder="Product name..."
                            />
                          </div>
                          <div className="flex gap-1 pt-4">
                            <button
                              onClick={() => handlePdfGenerateSingle(idx)}
                              disabled={p.generating}
                              className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg flex items-center justify-center"
                              title="Generate with AI"
                            >
                              <Wand2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setPdfProducts(prev => prev.filter((_, i) => i !== idx))}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Category + Sub-category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</label>
                            <select
                              value={allCategories.includes(p.category) ? p.category : (p.category || pdfImportCategory)}
                              onChange={(e) => setPdfProducts(prev => prev.map((pp, i) => i === idx ? { ...pp, category: e.target.value } : pp))}
                              className="w-full px-3 py-1.5 border border-gray-300 focus:border-orange-500 rounded-lg text-sm bg-white outline-none transition-colors"
                            >
                              {allCategories.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                              <option value="custom">Custom...</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sub-category</label>
                            <select
                              value={p.subCategory || ''}
                              onChange={(e) => setPdfProducts(prev => prev.map((pp, i) => i === idx ? { ...pp, subCategory: e.target.value } : pp))}
                              className="w-full px-3 py-1.5 border border-gray-300 focus:border-orange-500 rounded-lg text-sm bg-white outline-none transition-colors"
                            >
                              <option value="">None</option>
                              {(categoriesData.find(c => c.name === (p.category || pdfImportCategory))?.subCategories || []).map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Extracted text debug */}
                        {p.extractedText && p.extractedText.length > 5 && (
                          <div className="bg-gray-100 rounded-lg px-3 py-2 border border-gray-200">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Extracted from PDF</label>
                            <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-wrap">{p.extractedText.slice(0, 300)}</p>
                          </div>
                        )}

                        {/* Description */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description {p.description ? <span className="text-green-500 normal-case">(AI generated)</span> : ''}</label>
                          <textarea
                            value={p.description || ''}
                            onChange={(e) => setPdfProducts(prev => prev.map((pp, i) => i === idx ? { ...pp, description: e.target.value } : pp))}
                            rows={2}
                            className="w-full px-3 py-1.5 border border-gray-300 focus:border-orange-500 rounded-lg text-sm bg-white outline-none transition-colors resize-none"
                            placeholder="Product description..."
                          />
                        </div>

                        {/* Card Description */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Card Hook</label>
                          <input
                            type="text"
                            value={p.cardDescription || ''}
                            onChange={(e) => setPdfProducts(prev => prev.map((pp, i) => i === idx ? { ...pp, cardDescription: e.target.value } : pp))}
                            className="w-full px-3 py-1.5 border border-gray-300 focus:border-orange-500 rounded-lg text-sm bg-white outline-none transition-colors"
                            placeholder="Short punchy hook..."
                          />
                        </div>

                        {/* SEO Title + Description */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Meta Title</label>
                            <input
                              type="text"
                              value={p.metaTitle || ''}
                              onChange={(e) => setPdfProducts(prev => prev.map((pp, i) => i === idx ? { ...pp, metaTitle: e.target.value } : pp))}
                              className="w-full px-3 py-1.5 border border-gray-300 focus:border-orange-500 rounded-lg text-sm bg-white outline-none transition-colors"
                              placeholder="SEO title..."
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Meta Description</label>
                            <input
                              type="text"
                              value={p.metaDescription || ''}
                              onChange={(e) => setPdfProducts(prev => prev.map((pp, i) => i === idx ? { ...pp, metaDescription: e.target.value } : pp))}
                              className="w-full px-3 py-1.5 border border-gray-300 focus:border-orange-500 rounded-lg text-sm bg-white outline-none transition-colors"
                              placeholder="SEO description..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {pdfExtractError && (
            <div className="max-w-6xl mx-auto mb-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {pdfExtractError}
              </div>
            </div>
          )}

          {productViewMode === 'list' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 shrink-0">Existing Products ({totalCount})</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-full sm:w-64"
                  />

                  <select 
                    value={filterCategory} 
                    onChange={e => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-full sm:w-auto"
                  >
                    <option value="all">All Categories</option>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                {products.map(p => (
                  <div key={p.id} className={`flex gap-4 p-4 border border-gray-100 rounded-xl transition-colors ${p.isDisabled ? 'bg-gray-100 opacity-60' : 'hover:bg-gray-50'}`}>
                    <div className="relative">
                      {getFeaturedImage(p) ? (
                        <img 
                          referrerPolicy="no-referrer" 
                          src={getFeaturedImage(p) || ''} 
                          alt={p.name} 
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200 bg-gray-50"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div style={{ display: getFeaturedImage(p) ? 'none' : 'flex' }} className={`w-20 h-20 rounded-lg border border-gray-200 bg-gray-100 items-center justify-center text-gray-400`}>
                        <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {p.isDisabled && (
                        <div className="absolute top-1 left-1 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          DISABLED
                        </div>
                      )}
                      {p.isBestseller && !p.isDisabled && (
                        <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          BESTSELLER
                        </div>
                      )}
                      {p.inMegaMenu && (
                        <div className="absolute top-6 left-1 bg-purple-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          MEGA MENU
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900">{p.name}</h3>
                        <div className="flex gap-2">
                          <button onClick={() => handleToggleEnableProduct(p.id, !!p.isDisabled)} className="text-gray-500 hover:bg-gray-200 p-1.5 rounded-md transition-colors" title={p.isDisabled ? "Enable" : "Disable"}>
                            {p.isDisabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button onClick={() => handleEditProduct(p)} className="text-purple-500 hover:bg-purple-50 p-1.5 rounded-md transition-colors" title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={(e) => promptDeleteProduct(p, e)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors" title="Delete Product">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">{p.category}{p.subCategory ? ` / ${p.subCategory}` : ''}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{p.description}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">₹{(p.price || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="text-center py-20 text-gray-400">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No products found.</p>
                  </div>
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          </div>
          )}

          {productViewMode === 'bulk_ai' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <Wand2 className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI Bulk Product Creator</h3>
                  <p className="text-sm text-gray-500">Add multiple products with customized name-specific descriptions, completely generated by Gemini AI.</p>
                </div>
              </div>

              {/* Step 1: Context Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                  <select
                    value={allCategories.includes(bulkCategory) ? bulkCategory : "custom"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setBulkCategory("");
                      } else {
                        setBulkCategory(val);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
                  >
                    <option value="" disabled>Select Category</option>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="custom">+ Create Custom Category...</option>
                  </select>

                  {!allCategories.includes(bulkCategory) && (
                    <div className="flex gap-2 mt-2">
                      <input 
                        type="text" 
                        value={bulkCategory} 
                        onChange={e => setBulkCategory(e.target.value)}
                        className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white"
                        placeholder="Type custom category name..."
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!bulkCategory.trim()) return;
                          try {
                            const adminToken = localStorage.getItem('admin_token') || token;
                            const res = await apiFetch('/api/categories', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                              body: JSON.stringify({ name: bulkCategory.trim(), subCategories: [] })
                            });
                            if (res.ok) {
                              fetchCategoriesAndSubcategories();
                              alert(`Category "${bulkCategory.trim()}" saved!`);
                            }
                          } catch {}
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sub-category (Optional)</label>
                  <select
                    value={showBulkCustomSubCategory ? "custom" : bulkSubCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setShowBulkCustomSubCategory(true);
                        setBulkSubCategory("");
                      } else {
                        setShowBulkCustomSubCategory(false);
                        setBulkSubCategory(val);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm mb-2"
                  >
                    <option value="">No Sub Category (None)</option>
                    {(categoriesData.find(c => c.name === bulkCategory)?.subCategories || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    <option value="custom">+ Create Custom Subcategory...</option>
                  </select>

                  {showBulkCustomSubCategory && (
                    <div className="flex gap-2 animate-fadeIn">
                      <input 
                        type="text" 
                        required={showBulkCustomSubCategory}
                        value={bulkSubCategory} 
                        onChange={e => setBulkSubCategory(e.target.value)}
                        className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white"
                        placeholder="Type custom subcategory name..."
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!bulkSubCategory.trim() || !bulkCategory.trim()) return;
                          try {
                            const adminToken = localStorage.getItem('admin_token') || token;
                            const res = await apiFetch('/api/categories', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                              body: JSON.stringify({ name: bulkCategory.trim(), subCategories: [bulkSubCategory.trim()] })
                            });
                            if (res.ok) {
                              fetchCategoriesAndSubcategories();
                              alert(`Subcategory "${bulkSubCategory.trim()}" saved under "${bulkCategory.trim()}"!`);
                            }
                          } catch {}
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Local File Multi-Upload Area */}
              <div className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/20 rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer relative mb-6"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const files = e.dataTransfer.files;
                  if (!files || files.length === 0) return;
                  
                  // Trigger upload
                  const dummyEvent = { target: { files } } as any;
                  handleBulkBatchImageUpload(dummyEvent);
                }}
                onClick={() => {
                  document.getElementById('drag-drop-file-input')?.click();
                }}
              >
                <input 
                  type="file" 
                  id="drag-drop-file-input"
                  multiple 
                  className="hidden" 
                  accept="image/*" 
                  disabled={isUploadingBulkImages}
                  onChange={handleBulkBatchImageUpload} 
                />
                
                <div className="p-4 bg-purple-100/60 rounded-full text-purple-600 mb-3">
                  {isUploadingBulkImages ? (
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  ) : (
                    <UploadCloud className="h-8 w-8" />
                  )}
                </div>
                <h4 className="text-base font-bold text-gray-800 mb-1">
                  {isUploadingBulkImages ? 'Uploading Images...' : 'Drag & Drop Images from Local Machine'}
                </h4>
                <p className="text-xs text-gray-500 max-w-md">
                  {isUploadingBulkImages 
                    ? bulkImageUploadStatus 
                    : 'Select multiple product images from your computer. We will automatically format the filenames into clean product titles!'
                  }
                </p>
                
                {isUploadingBulkImages && (
                  <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5 mt-4 overflow-hidden">
                    <div className="bg-purple-600 h-1.5 animate-pulse" style={{ width: '100%' }}></div>
                  </div>
                )}
              </div>

              {/* Quick Paste Area */}
              <details className="group bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6 transition-all">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-sm text-gray-700 select-none">
                  <span className="flex items-center gap-2">
                    <span>⚡ Quick Paste Multi-Product Tool</span>
                  </span>
                  <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-gray-500">
                    Paste a list of product names (one per line) to instantly add rows. You can upload their images afterward.
                  </p>
                  <textarea
                    placeholder="Premium Wooden Star Trophy&#10;Custom Double Star Award&#10;Sleek Glass Star Engraving"
                    className="w-full h-24 p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    id="bulk-names-textarea"
                  />
                  <div className="flex justify-end">
                    <Button 
                      size="sm"
                      onClick={() => {
                        const el = document.getElementById('bulk-names-textarea') as HTMLTextAreaElement;
                        if (!el || !el.value.trim()) return;
                        const names = el.value.split('\n').map(n => n.trim()).filter(Boolean);
                        const rows = names.map(name => ({
                          name,
                          image: getStockImageForCategory(bulkCategory, bulkSubCategory, name),
                          description: '',
                          cardDescription: ''
                        }));
                        setBulkProducts(prev => {
                          const filteredPrev = prev.filter(p => p.name.trim() !== '' || p.image !== '');
                          return [...filteredPrev, ...rows];
                        });
                        el.value = '';
                      }}
                      className="text-xs py-1 px-3 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Add Products ({bulkProducts.length} current rows will be preserved)
                    </Button>
                  </div>
                </div>
              </details>

              {/* Main List of Product Cards */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    📦 Products to Import ({bulkProducts.length})
                  </h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setBulkProducts(prev => [...prev, { name: '', image: '', description: '', cardDescription: '', metaTitle: '', metaDescription: '', category: '', features: [] }])}
                      className="text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setBulkProducts([])}
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                  {bulkProducts.map((p, idx) => (
                    <div key={idx} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-200 hover:border-purple-200 transition-all shadow-sm relative group">
                      
                      {/* Loading/Generating Overlay */}
                      {p.isGenerating && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-10">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
                          <p className="text-xs font-bold text-purple-700">AI Generating...</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        
                        {/* Image Preview & Upload (3 cols) */}
                        <div className="md:col-span-3 bg-white p-2 rounded-xl border border-gray-200 relative aspect-square">
                          {p.image ? (
                            <>
                              <img 
                                src={p.image} 
                                alt={p.name || 'Preview'} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain rounded-lg border border-gray-100 bg-gray-50"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextElementSibling) {
                                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                  }
                                }}
                              />
                              <div style={{ display: 'none' }} className="w-full h-full flex-col items-center justify-center text-gray-300 rounded-lg border border-gray-100 bg-gray-50">
                                <UploadCloud className="h-10 w-10 mb-2 stroke-1 text-gray-400" />
                                <span className="text-[10px] uppercase font-bold text-gray-400">Broken Image</span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 rounded-lg border border-gray-100 bg-gray-50">
                              <UploadCloud className="h-10 w-10 mb-2 stroke-1 text-gray-400" />
                              <span className="text-[10px] uppercase font-bold text-gray-400">No Image</span>
                            </div>
                          )}
                          
                          {/* Inline Row Image Upload Trigger */}
                          <label className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-1.5 shadow-md cursor-pointer transition-colors" title="Upload Local Image">
                            {uploadingRowIndex === idx ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UploadCloud className="h-3.5 w-3.5" />
                            )}
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              disabled={uploadingRowIndex !== null}
                              onChange={(e) => handleBulkRowImageUpload(e, idx)} 
                            />
                          </label>
                        </div>

                        {/* Editable Info Fields (9 cols) */}
                        <div className="md:col-span-9 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Product Name</label>
                              <input 
                                type="text"
                                value={p.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkProducts(prev => {
                                    const copy = [...prev];
                                    copy[idx].name = val;
                                    return copy;
                                  });
                                }}
                                className="w-full px-3 py-1.5 border border-gray-300 focus:border-purple-500 rounded-lg text-sm bg-white font-semibold text-gray-800 outline-none transition-colors"
                                placeholder="e.g. Elegant Silver Star Plaque"
                              />
                            </div>
                            
                            {/* Card-Level Action buttons */}
                            <div className="flex gap-1 pt-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Generate with AI"
                                onClick={() => handleGenerateSingleAI(idx)}
                                className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                <Wand2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Remove row"
                                onClick={() => setBulkProducts(prev => prev.filter((_, i) => i !== idx))}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Auto-detected Category */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category {p.category ? <span className="text-purple-500 normal-case">(AI detected)</span> : ''}</label>
                            <div className="flex gap-2">
                              <select
                                value={allCategories.includes(p.category) ? p.category : (p.category || bulkCategory)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkProducts(prev => {
                                    const copy = [...prev];
                                    copy[idx].category = val;
                                    return copy;
                                  });
                                }}
                                className="flex-1 px-3 py-1.5 border border-gray-300 focus:border-purple-500 rounded-lg text-sm bg-white outline-none transition-colors"
                              >
                                {allCategories.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                                <option value="custom">Custom...</option>
                              </select>
                            </div>
                          </div>

                          {/* Sub-category */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sub-category</label>
                            <div className="flex gap-2">
                              <select
                                value={p.subCategory || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkProducts(prev => {
                                    const copy = [...prev];
                                    copy[idx].subCategory = val;
                                    return copy;
                                  });
                                }}
                                className="flex-1 px-3 py-1.5 border border-gray-300 focus:border-purple-500 rounded-lg text-sm bg-white outline-none transition-colors"
                              >
                                <option value="">None</option>
                                {(categoriesData.find(c => c.name === (p.category || bulkCategory))?.subCategories || []).map(sub => (
                                  <option key={sub} value={sub}>{sub}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Product Card Description (Short summary)</label>
                              <textarea 
                                value={p.cardDescription}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkProducts(prev => {
                                    const copy = [...prev];
                                    copy[idx].cardDescription = val;
                                    return copy;
                                  });
                                }}
                                rows={3}
                                
                                className="w-full px-3 py-2 border border-gray-300 focus:border-purple-500 rounded-lg text-xs bg-white outline-none resize-none leading-normal"
                                placeholder="Auto-generates with Gemini, or write custom text..."
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Product Description (Full details)</label>
                              <textarea 
                                value={p.description}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkProducts(prev => {
                                    const copy = [...prev];
                                    copy[idx].description = val;
                                    return copy;
                                  });
                                }}
                                rows={3}
                                
                                className="w-full px-3 py-2 border border-gray-300 focus:border-purple-500 rounded-lg text-xs bg-white outline-none resize-none leading-normal font-serif"
                                placeholder="Auto-generates with Gemini, or write custom details..."
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">SEO Title (Meta)</label>
                              <input 
                                type="text"
                                value={p.metaTitle || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkProducts(prev => {
                                    const copy = [...prev];
                                    copy[idx].metaTitle = val;
                                    return copy;
                                  });
                                }}
                                
                                className="w-full px-3 py-1.5 border border-gray-300 focus:border-purple-500 rounded-lg text-xs bg-white outline-none"
                                placeholder="Auto-generates with Gemini"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">SEO Description (Meta)</label>
                              <textarea 
                                value={p.metaDescription || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkProducts(prev => {
                                    const copy = [...prev];
                                    copy[idx].metaDescription = val;
                                    return copy;
                                  });
                                }}
                                rows={2}
                                
                                className="w-full px-3 py-1.5 border border-gray-300 focus:border-purple-500 rounded-lg text-xs bg-white outline-none resize-none"
                                placeholder="Auto-generates with Gemini"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}

                  {bulkProducts.length === 0 && (
                    <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
                      No products added yet. Click "+ Add Row" or drag & drop image files above!
                    </div>
                  )}
                </div>
              </div>

              {bulkError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm my-6">
                  {bulkError}
                </div>
              )}

              {/* Global Action controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-100 pt-6 mt-6 gap-4">
                <Button 
                  onClick={async () => {
                    const valid = bulkProducts.filter(p => p.name.trim());
                    if (valid.length === 0) {
                      setBulkError('Please add at least one product with a valid name.');
                      return;
                    }
                    setBulkError('');
                    setIsGeneratingBulk(true);
                    try {
                      const adminToken = localStorage.getItem('admin_token') || token;
                      for (let i = 0; i < valid.length; i++) {
                        const p = valid[i];
                        const cat = p.category || bulkCategory;
                        setBulkError(`Generating ${i + 1} of ${valid.length}: ${p.name}...`);
                        try {
                          const res = await apiFetch('/api/ai/local-generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                            body: JSON.stringify({ task: 'description', name: p.name, category: cat, subCategory: bulkSubCategory, features: p.features || [] })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setBulkProducts(prev => prev.map((item) => {
                              if (item.name.trim().toLowerCase() === p.name.trim().toLowerCase()) {
                                return { ...item, description: data.description || item.description, cardDescription: data.cardDescription || item.cardDescription, metaTitle: data.metaTitle || item.metaTitle, metaDescription: data.metaDescription || item.metaDescription };
                              }
                              return item;
                            }));
                          }
                        } catch {}
                      }
                      setBulkError('');
                      alert('AI generated descriptions and SEO tags for all products!');
                    } catch (err: any) {
                      setBulkError(err.message);
                    } finally {
                      setIsGeneratingBulk(false);
                    }
                  }}
                  disabled={isGeneratingBulk || bulkProducts.length === 0}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white gap-2 py-2.5 px-6 font-semibold shadow-sm transition-all"
                >
                  {isGeneratingBulk ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating with Gemini AI...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Generate AI Descriptions & SEO for All ({bulkProducts.length})
                    </>
                  )}
                </Button>

                <Button
                  onClick={async () => {
                    const valid = bulkProducts.filter(p => p.name.trim());
                    if (!bulkCategory.trim()) {
                      setBulkError('Category is required.');
                      return;
                    }
                    if (valid.length === 0) {
                      setBulkError('No products to save.');
                      return;
                    }
                    setIsSavingBulk(true);
                    setBulkError('');
                    try {
                      // Auto-generate descriptions using AI before saving
                      const missingDesc = valid.filter(p => !p.description?.trim() || !p.cardDescription?.trim() || !p.metaTitle?.trim() || !p.metaDescription?.trim());
                      let updatedValid = [...valid];

                      if (missingDesc.length > 0) {
                        try {
                          const adminToken = localStorage.getItem('admin_token') || token;
                          for (const p of missingDesc) {
                            const cat = p.category || bulkCategory;
                            const genRes = await apiFetch('/api/ai/local-generate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                            body: JSON.stringify({ task: 'description', name: p.name, category: cat, subCategory: p.subCategory || bulkSubCategory, features: p.features || [] })
                            });
                            if (genRes.ok) {
                              const gen = await genRes.json();
                              updatedValid = updatedValid.map(item => {
                                if (item.name.trim().toLowerCase() === p.name.trim().toLowerCase()) {
                                  return {
                                    ...item,
                                    description: item.description?.trim() || gen.description || `Discover the ${item.name}, a dependable ${cat.toLowerCase()} product for everyday use. Available with custom printing at Printfield, Whitefield Bangalore.`,
                                    cardDescription: item.cardDescription?.trim() || gen.cardDescription || `Make your brand stand out with the ${item.name}. Custom printing available at Printfield.`,
                                    metaTitle: item.metaTitle?.trim() || gen.metaTitle || `${item.name} - Custom ${cat} | Printfield`,
                                    metaDescription: item.metaDescription?.trim() || gen.metaDescription || `Order ${item.name} at Printfield, Whitefield Bangalore. Custom branding. Fast delivery. Shop now!`
                                  };
                                }
                                return item;
                              });
                            }
                          }
                        } catch (e) {
                          console.warn("AI generation prior to bulk save failed, using dynamic fallbacks:", e);
                        }
                      }

                      const bulkPayload = updatedValid.map(p => ({
                            name: p.name,
                            category: p.category || bulkCategory,
                            subCategory: p.subCategory || bulkSubCategory,
                            price: 499,
                            image: p.image || getStockImageForCategory(p.category || bulkCategory, p.subCategory || bulkSubCategory, p.name),
                            images: [p.image || getStockImageForCategory(p.category || bulkCategory, p.subCategory || bulkSubCategory, p.name)],
                            description: p.description || `Discover the ${p.name}, a dependable ${(p.category || bulkCategory).toLowerCase()} product for everyday use. Available with custom printing at Printfield, Whitefield Bangalore.`,
                            cardDescription: p.cardDescription || `Make your brand stand out with the ${p.name}. Custom printing available at Printfield.`,
                            metaTitle: p.metaTitle || `${p.name} - Custom ${p.category || bulkCategory} | Printfield`,
                            metaDescription: p.metaDescription || `Order ${p.name} at Printfield, Whitefield Bangalore. Custom branding. Fast delivery. Shop now!`,
                            features: [],
                            colors: [],
                            variations: []
                          }));

                          const res = await apiFetch('/api/products/bulk', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ products: bulkPayload })
                          });
                          if (!res.ok) {
                            const errBody = await res.json().catch(() => ({}));
                            throw new Error(errBody.error || `Failed to save products`);
                          }

                          const savedCount = bulkPayload.length;

                          alert(`Successfully added ${savedCount} products to the catalog!`);
                      setBulkProducts([
                        { name: '', image: '', description: '', cardDescription: '' }
                      ]);
                      setProductViewMode('list');
                      fetchProducts(1, '', 'all');
                    } catch (err: any) {
                      setBulkError(err.message || 'An error occurred while saving products.');
                    } finally {
                      setIsSavingBulk(false);
                    }
                  }}
                  disabled={isSavingBulk || bulkProducts.length === 0}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-2.5 shadow-md gap-2 transition-all"
                >
                  {isSavingBulk ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving to Catalog...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Save All {bulkProducts.filter(p => p.name.trim()).length} Products to Catalog
                    </>
                  )}
                </Button>
              </div>

            </div>
          </div>
          )}
        </div>
        )}
        

      </div>

      {/* Status Toast Notification */}
      {statusNotification && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl font-medium text-sm flex items-center gap-3 border transition-all animate-bounce ${
          statusNotification.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'
        }`}>
          {statusNotification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <Trash2 className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{statusNotification.message}</span>
          <button onClick={() => setStatusNotification(null)} className="ml-2 text-gray-400 hover:text-gray-700 font-bold text-base">×</button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Product?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-gray-900">{productToDelete.name || productToDelete.id}</strong>? This will remove it from the product catalog, S3 bucket, and storage. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmAndExecuteDelete}
                className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
