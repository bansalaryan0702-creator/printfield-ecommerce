import { apiFetch } from "../../lib/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, User, Printer, LogOut, ChevronDown, Phone, ShieldCheck, ArrowLeft, Menu, X, ChevronRight, Star, Grid, FileText } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useContext, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import { CartDrawer } from "../../components/CartDrawer";

// Local high quality products list for category dropdowns if database doesn't have them
const LOCAL_PRODUCTS_BY_CATEGORY: Record<string, any[]> = {
  "apparel": [
    { id: "custom-polos", name: "Custom Polo T-Shirts", image: "", description: "Professional collared polo shirts, perfect for corporate teams." },
    { id: "custom-roundneck", name: "Custom Round Neck T-Shirts", image: "", description: "Premium bio-washed cotton t-shirts with durable custom prints." },
    { id: "custom-dryfit", name: "Custom Dryfit T-Shirts", image: "", description: "Moisture-wicking performance dryfit t-shirts for sports & outdoor." },
    { id: "custom-zipjackets", name: "Custom Zippered Jackets", image: "", description: "Full-zip hooded jackets with premium embroidery or print." },
    { id: "custom-hoodies", name: "Custom Hoodies & Sweatshirts", image: "", description: "Cozy custom hoodies with premium embroidery or print." },
    { id: "custom-caps", name: "Custom Caps & Hats", image: "", description: "Embroidered caps and hats for brand promotion." },
    { id: "custom-backpacks", name: "Custom Backpacks", image: "", description: "Branded backpacks with durable construction." }
  ],
  "gifts": [
    { id: "personalized-mugs", name: "Personalized Ceramic Mugs", image: "", description: "Custom printed ceramic mugs. Perfect for corporate gifting." },
    { id: "custom-bottles", name: "Premium Steel Water Bottles", image: "", description: "Insulated stainless steel bottles with laser engraved logo." },
    { id: "custom-keychains", name: "Engraved Metal Keychains", image: "", description: "Durable metal or leather keychains with custom branding." },
    { id: "notebooks", name: "Custom Executive Notebooks", image: "", description: "Premium leatherette notebooks with hard cover and custom page inserts." }
  ],
  "signage": [
    { id: "roll-up-standees", name: "Roll-up Standees (6x3 ft)", image: "", description: "Portable, easy to assemble roll-up display standees." },
    { id: "vinyl-banners", name: "Outdoor Vinyl Banners", image: "", description: "Heavy-duty waterproof banners with grommets for display." },
    { id: "promotional-posters", name: "HD Wall Posters", image: "", description: "High-resolution printed glossy or matte posters." }
  ],
  "packaging": [
    { id: "shipping-boxes", name: "Custom Corrugated Boxes", image: "", description: "Sturdy branded packaging boxes for safe product transit." },
    { id: "paper-bags", name: "Premium Branded Paper Bags", image: "", description: "Elegant paper carrying bags with high quality prints." }
  ]
};

const DEFAULT_CATEGORIES_DATA: { name: string; subCategories: string[] }[] = [
  {
    name: "Business Stationery",
    subCategories: ["ID Cards & Lanyards", "Bill Books", "Envelopes", "Letterheads", "Rubber Stamps", "Notepads & Diaries", "Business Cards"]
  },
  {
    name: "Apparel",
    subCategories: ["Polo T-Shirts", "Round Neck T-Shirts", "Dryfit T-Shirts", "Zippered Jackets", "Hoodies & Sweatshirts", "Caps & Hats", "Backpacks"]
  },
  {
    name: "Personalised Gifts",
    subCategories: ["Photo Mugs", "Photo Frames", "Canvas Prints", "Personalised Keychains", "Custom Water Bottles"]
  },
  {
    name: "Corporate Gifts",
    subCategories: ["Tech Accessories", "Executive Diaries", "Gift Sets", "Drinkware & Bottles"]
  },
  {
    name: "Signages & Banners",
    subCategories: ["Roll-up Standees", "Outdoor Banners", "Sunboard Printing", "Acrylic Name Plates", "LED Light Boxes"]
  },
  {
    name: "Drinkware",
    subCategories: ["Water Bottles", "Mugs", "Tumblers"]
  },
  {
    name: "Trophies",
    subCategories: ["Wooden Trophies", "Metal Trophies", "Fiber Trophies", "Other Products"]
  }
];

function organizeCategories(data: any[]): { name: string; subCategories: string[] }[] {
  const map = new Map<string, Set<string>>();
  
  DEFAULT_CATEGORIES_DATA.forEach(c => {
    map.set(c.name, new Set(c.subCategories));
  });

  if (Array.isArray(data)) {
    data.forEach(item => {
      if (!item || !item.name) return;
      const catName = String(item.name).trim();
      if (!catName) return;

      if (!map.has(catName)) {
        map.set(catName, new Set());
      }
      const set = map.get(catName)!;
      if (Array.isArray(item.subCategories)) {
        item.subCategories.forEach((sub: any) => {
          if (sub && typeof sub === 'string' && sub.trim()) {
            set.add(sub.trim());
          }
        });
      }
    });
  }

  const result: { name: string; subCategories: string[] }[] = [];
  map.forEach((subs, name) => {
    result.push({
      name,
      subCategories: Array.from(subs)
    });
  });

  const primaryOrder = [
    "Business Stationery",
    "Corporate Gifts",
    "Signages & Banners",
    "Personalised Gifts",
    "Apparel",
    "Drinkware",
    "Trophies"
  ];

  result.sort((a, b) => {
    const idxA = primaryOrder.indexOf(a.name);
    const idxB = primaryOrder.indexOf(b.name);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

export function Navbar() {
  const { cart, setIsCartOpen, user, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categoriesData, setCategoriesData] = useState<{name: string, subCategories: string[]}[]>(organizeCategories([]));

  useEffect(() => {
    apiFetch('/api/categories-and-subcategories')
      .then(res => res.json())
      .then(data => {
        const rawArray = Array.isArray(data) ? data : (data && Array.isArray(data.categories) ? data.categories : []);
        setCategoriesData(organizeCategories(rawArray));
      })
      .catch(err => {
        console.error("Error fetching categories:", err);
        setCategoriesData(organizeCategories([]));
      });
  }, []);
  
  const suggestions = searchQuery.trim() 
    ? dbProducts.filter(p => (p.name && typeof p.name === 'string' && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || (p.category && typeof p.category === 'string' && p.category.toLowerCase().includes(searchQuery.toLowerCase()))).slice(0, 5)
    : [];

  const searchParamValue = searchParams.get('search') || '';
  useEffect(() => {
    setSearchQuery(searchParamValue);
  }, [searchParamValue]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowMobileSearch(false);
    if (searchQuery.trim()) {
      navigate(`/categories?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/categories');
    }
  };

  useEffect(() => {
    apiFetch('/api/products?limit=1000')
      .then(res => res.json())
      .then(resData => {
        if (resData && Array.isArray(resData.data)) {
          setDbProducts(resData.data);
        }
      })
      .catch(err => console.error("Error fetching navbar products:", err));
  }, []);

  const handleLogout = () => {
    setToken('');
    navigate('/');
  };

  const getProductsForCategory = (catId: string) => {
    let filtered: any[] = [];
    if (catId === 'business-cards') {
      filtered = dbProducts.filter((p: any) => {
        const cat = String(p.category || '').toLowerCase().trim();
        return cat === 'business cards';
      });
      if (filtered.length === 0) {
        filtered = [
          { id: 'jkcr3tpxx', name: 'Standard Visiting Cards', image: '', description: 'Premium quality standard visiting cards.' },
          { id: 'njui14k70', name: 'Rounded Corner Visiting Cards', image: '', description: 'Visiting cards with rounded corners.' },
          { id: 'o2w2btqp1', name: 'Non-Tearable Visiting Cards', image: '', description: 'Visiting cards printed on waterproof non-tearable paper.' }
        ];
      }
    } else if (catId === 'business-stationery') {
      filtered = dbProducts.filter((p: any) => {
        const cat = String(p.category || '').toLowerCase().trim();
        return cat === 'business stationery';
      });
    } else if (catId === 'apparel') {
      filtered = dbProducts.filter((p: any) => {
        const cat = String(p.category || '').toLowerCase().trim();
        return cat === 'apparel' || cat === 'custom apparel';
      });
      if (filtered.length === 0) {
        filtered = LOCAL_PRODUCTS_BY_CATEGORY["apparel"] || [];
      }
    } else if (catId === 'marketing') {
      filtered = dbProducts.filter((p: any) => {
        const cat = String(p.category || '').toLowerCase().trim();
        return cat === 'promotional materials' || cat === 'marketing materials' || cat === 'marketing';
      });
      if (filtered.length === 0) {
        filtered = [
          { id: 'flyers-a5', name: 'A5 Marketing Flyers', image: '', description: 'Vibrant promotional flyers.' },
          { id: 'brochures-trifold', name: 'Tri-Fold Pamphlets & Brochures', image: '', description: 'Tri-fold marketing brochures.' }
        ];
      }
    } else if (catId === 'gifts') {
      filtered = dbProducts.filter((p: any) => {
        const cat = String(p.category || '').toLowerCase().trim();
        return cat === 'corporate gifts' || cat === 'drinkware' || cat === 'trophies' || cat === 'personalised gifts' || cat === 'gifts' || cat === 'personalized gifts';
      });
      if (filtered.length === 0) {
        filtered = LOCAL_PRODUCTS_BY_CATEGORY["gifts"] || [];
      }
    } else if (catId === 'corporate-gifts') {
      filtered = dbProducts.filter((p: any) => {
        const cat = String(p.category || '').toLowerCase().trim();
        return cat === 'corporate gifts' || cat === 'gifts';
      });
    } else if (catId === 'signage') {
      filtered = dbProducts.filter((p: any) => {
        const cat = String(p.category || '').toLowerCase().trim();
        return cat === 'signages & banners' || cat === 'signage & posters' || cat === 'signage';
      });
      if (filtered.length === 0) {
        filtered = LOCAL_PRODUCTS_BY_CATEGORY["signage"] || [];
      }
    } else if (catId === 'packaging') {
      filtered = dbProducts.filter((p: any) => {
        const cat = String(p.category || '').toLowerCase().trim();
        return cat === 'packaging';
      });
      if (filtered.length === 0) {
        filtered = LOCAL_PRODUCTS_BY_CATEGORY["packaging"] || [];
      }
    }
    return filtered;
  };

  const getMarketingSubgroups = () => {
    const products = getProductsForCategory('marketing');
    
    // Filter out business stationery items (ID cards, bill books, letterheads, envelopes, stamps, notepads, visiting cards, booklets, wiro notebooks, certificates, calendars)
    const marketingOnly = products.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      const sub = String(p.subCategory || '').toLowerCase();
      return !name.includes('id card') && 
             !name.includes('lanyard') && 
             !name.includes('badge') && 
             !name.includes('pvc') && 
             !name.includes('bill book') && 
             !name.includes('envelope') &&
             !name.includes('letterhead') &&
             !name.includes('notepad') &&
             !name.includes('note pad') &&
             !name.includes('stamp') &&
             !name.includes('visiting card') &&
             !name.includes('booklet') &&
             !name.includes('wiro') &&
             !name.includes('notebook') &&
             !name.includes('diary') &&
             !name.includes('journal') &&
             !name.includes('certificate') &&
             !name.includes('calendar') &&
             !sub.includes('booklet') &&
             !sub.includes('wiro') &&
             !sub.includes('notebook') &&
             !sub.includes('certificate') &&
             !sub.includes('calendar');
    });

    const flyersAndBrochures = marketingOnly.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('flyer') || name.includes('brochure') || name.includes('pamphlet') || name.includes('catalog');
    });
    const defaultFlyers = flyersAndBrochures.length > 0 ? flyersAndBrochures : [
      { id: 'flyers-a5', name: 'A5 Marketing Flyers' },
      { id: 'brochures-trifold', name: 'Tri-Fold Pamphlets & Brochures' },
      { id: 'catalogs', name: 'Product Catalogs & Brochures' },
      { id: 'pamphlets-a4', name: 'A4 Business Flyers' }
    ];

    const stickersAndLabels = marketingOnly.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('sticker') || name.includes('label') || name.includes('decal') || name.includes('seal');
    });
    const defaultStickers = stickersAndLabels.length > 0 ? stickersAndLabels : [
      { id: 'vinyl-stickers', name: 'Custom Vinyl Stickers' },
      { id: 'product-labels', name: 'Roll Product Labels' },
      { id: 'die-cut-stickers', name: 'Die-Cut Logo Stickers' },
      { id: 'packaging-seals', name: 'Branded Packaging Seals' }
    ];

    const promoMedia = marketingOnly.filter((p: any) => {
      return !flyersAndBrochures.includes(p) && !stickersAndLabels.includes(p);
    });
    const defaultPromoMedia = promoMedia.length > 0 ? promoMedia : [
      { id: 'table-tents', name: 'Acrylic Table Tents' },
      { id: 'promo-cards', name: 'Promotional Postcards' },
      { id: 'standees-promo', name: 'Marketing Banner Stands' },
      { id: 'wobblers', name: 'Shelf Wobblers & Hangtags' }
    ];

    return {
      flyersAndBrochures: defaultFlyers.slice(0, 5),
      stickersAndLabels: defaultStickers.slice(0, 5),
      promotionalMedia: defaultPromoMedia.slice(0, 5)
    };
  };

  const getBusinessStationerySubgroups = () => {
    const cardProducts = getProductsForCategory('business-cards');
    const allPool = [...dbProducts, ...cardProducts];

    const uniqueMap = new Map();
    allPool.forEach(p => { if (p.id) uniqueMap.set(p.id, p); });
    const pool = Array.from(uniqueMap.values());

    // 1. Business Cards (Strictly visiting cards / business cards, excluding certificates, id cards, calendars, etc.)
    const businessCards = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      const cat = String(p.category || '').toLowerCase();
      const isCard = name.includes('visiting card') || name.includes('business card') || cat.includes('business card') || name.includes('visiting');
      const isOtherStationery = name.includes('calendar') || name.includes('certificate') || name.includes('id card') ||
                                name.includes('lanyard') || name.includes('badge') || name.includes('bill book') ||
                                name.includes('envelope') || name.includes('letterhead') || name.includes('stamp') ||
                                name.includes('notepad') || name.includes('notebook') || name.includes('wiro') ||
                                name.includes('booklet') || name.includes('diary');
      return isCard && !isOtherStationery;
    });
    const defaultBusinessCards = businessCards;

    // 2. ID Cards & Certificates
    const idAndLanyards = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('id card') || name.includes('lanyard') || name.includes('badge') || name.includes('pvc') || name.includes('certificate') || name.includes('citation');
    });
    const defaultIdAndLanyards = idAndLanyards;

    // 3. Bill Books & Letterheads
    const billBooksAndEnvelopes = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('bill book') || name.includes('envelope') || name.includes('letterhead') || name.includes('stamp');
    });
    const defaultBillBooks = billBooksAndEnvelopes;

    // 4. Notebooks & Calendars
    const notepadsAndOffice = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('notepad') || name.includes('note pad') || name.includes('diary') || name.includes('notebook') || name.includes('wiro') || name.includes('booklet') || name.includes('calendar') || name.includes('folder');
    });
    const defaultNotepads = notepadsAndOffice;

    // 5. Booklets & Catalogs
    const bookletsAndCatalogs = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      const sub = String(p.subCategory || '').toLowerCase();
      return name.includes('booklet') || name.includes('catalog') || sub.includes('booklets & catalogs');
    });

    // 6. Stickers & Decals
    const stickersAndDecals = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      const sub = String(p.subCategory || '').toLowerCase();
      return name.includes('sticker') || name.includes('decal') || sub.includes('stickers & decals');
    });

    return {
      businessCards: defaultBusinessCards.slice(0, 5),
      idAndLanyards: defaultIdAndLanyards.slice(0, 5),
      billBooksAndEnvelopes: defaultBillBooks.slice(0, 5),
      notepadsAndOffice: defaultNotepads.slice(0, 5),
      bookletsAndCatalogs: bookletsAndCatalogs.slice(0, 5),
      stickersAndDecals: stickersAndDecals.slice(0, 5)
    };
  };

  const renderBadge = (p: any) => {
    if (p.badge === 'Recommended' || p.badgeType === 'recommended') {
      return <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">Recommended</span>;
    }
    if (p.badge === 'Popular' || p.badgeType === 'popular') {
      return <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">Popular</span>;
    }
    if (p.badge === 'NEW' || p.badgeType === 'new') {
      return <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">NEW</span>;
    }
    return null;
  };

  const getApparelSubgroups = () => {
    const products = getProductsForCategory('apparel');
    const allApparel = [...dbProducts, ...products];

    // Deduplicate
    const uniqueMap = new Map();
    allApparel.forEach(p => { if (p.id) uniqueMap.set(p.id, p); });
    const pool = Array.from(uniqueMap.values());

    // 1. Polo T-Shirts
    const polos = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('polo');
    });
    const defaultPolos = polos;

    // 2. Round Neck T-Shirts
    const roundNecks = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return (name.includes('round neck') || name.includes('roundneck')) && !name.includes('polo');
    });
    const defaultRoundNecks = roundNecks;

    // 3. Dryfit T-Shirts
    const dryfits = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('dryfit') || name.includes('dry fit') || name.includes('performance') || name.includes('sports tee');
    });
    const defaultDryfits = dryfits;

    // 4. Zippered Jackets
    const zipperedJackets = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return (name.includes('zipper') || name.includes('zippered') || name.includes('zip up')) && 
             (name.includes('jacket') || name.includes('hoodie'));
    });
    const defaultZipperedJackets = zipperedJackets;

    // 5. Hoodies & Sweatshirts
    const hoodies = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return (name.includes('hoodie') || name.includes('sweatshirt')) && 
             !name.includes('zipper') && !name.includes('zippered') && !name.includes('zip up');
    });
    const defaultHoodies = hoodies;

    // 6. Caps & Hats
    const caps = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('cap') || name.includes('hat');
    });
    const defaultCaps = caps;

    // 7. Backpacks
    const backpacks = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('bag') || name.includes('backpack') || name.includes('sleeve') || name.includes('supasac');
    });
    const defaultBackpacks = backpacks;

    return {
      polos: defaultPolos.slice(0, 5),
      roundNecks: defaultRoundNecks.slice(0, 5),
      dryfits: defaultDryfits.slice(0, 5),
      zipperedJackets: defaultZipperedJackets.slice(0, 5),
      hoodies: defaultHoodies.slice(0, 5),
      caps: defaultCaps.slice(0, 5),
      backpacks: defaultBackpacks.slice(0, 5)
    };
  };

  const getGiftsSubgroups = () => {
    const products = getProductsForCategory('gifts');
    const allGifts = [...dbProducts, ...products];

    const uniqueMap = new Map();
    allGifts.forEach(p => { if (p.id) uniqueMap.set(p.id, p); });
    const pool = Array.from(uniqueMap.values()).filter((p: any) => {
      const cat = String(p.category || '').toLowerCase().trim();
      return cat !== 'apparel' && cat !== 'custom apparel';
    });

    // 1. Photo Prints
    const photoPrints = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('photo print') || name.includes('polaroid') || name.includes('passport') || name.includes('bulk printing');
    });
    const defaultPhotoPrints = photoPrints;

    // 2. Photo Mugs
    const photoMugs = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('photo mug') || name.includes('magic mug') || name.includes('beer mug') || name.includes('mini mug');
    });
    const defaultPhotoMugs = photoMugs;

    // 3. Invitation Cards
    const invitations = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('invitation');
    });
    const defaultInvitations = invitations;

    // 4. Personalised Gifts
    const personalisedGifts = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('wooden stand') || name.includes('greeting card') || name.includes('fridge magnet') || name.includes('coasters') || name.includes('plaque');
    });
    const defaultPersonalisedGifts = personalisedGifts;

    // 5. Photo Frames
    const photoFrames = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('photo frame') && !name.includes('acrylic');
    });
    const defaultPhotoFrames = photoFrames;

    // 6. Canvas
    const canvas = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('canvas') && !name.includes('photo frame');
    });
    const defaultCanvas = canvas;

    // 7. Acrylic Photo Frames
    const acrylicFrames = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('acrylic');
    });
    const defaultAcrylicFrames = acrylicFrames;

    // 8. Drinkware
    const drinkware = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('sipper') || name.includes('bottle') || name.includes('flask');
    });
    const defaultDrinkware = drinkware;

    return {
      photoPrints: defaultPhotoPrints.slice(0, 5),
      photoMugs: defaultPhotoMugs.slice(0, 5),
      invitations: defaultInvitations.slice(0, 5),
      personalisedGifts: defaultPersonalisedGifts.slice(0, 5),
      photoFrames: defaultPhotoFrames.slice(0, 5),
      canvas: defaultCanvas.slice(0, 5),
      acrylicFrames: defaultAcrylicFrames.slice(0, 5),
      drinkware: defaultDrinkware.slice(0, 5)
    };
  };

  const getCorporateGiftsSubgroups = () => {
    const products = getProductsForCategory('corporate-gifts');
    const allCorporateGifts = [...dbProducts, ...products];

    const uniqueMap = new Map();
    allCorporateGifts.forEach(p => { if (p.id) uniqueMap.set(p.id, p); });
    const pool = Array.from(uniqueMap.values());

    const dairies = pool.filter((p: any) => {
      const sub = String(p.subCategory || '').toLowerCase().trim();
      const cat = String(p.category || '').toLowerCase().trim();
      const name = String(p.name || '').toLowerCase();
      return sub === 'dairies' || cat === 'dairies' || name.includes('diary') || name.includes('notebook') || name.includes('journal') || name.includes('urban gear');
    });

    return {
      dairies: dairies.slice(0, 15)
    };
  };

  const getSignageSubgroups = () => {
    const products = getProductsForCategory('signage');
    const allSignage = [...dbProducts, ...products];

    const uniqueMap = new Map();
    allSignage.forEach(p => { if (p.id) uniqueMap.set(p.id, p); });
    const pool = Array.from(uniqueMap.values());

    // 1. Standees
    const standees = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('standee');
    });
    const defaultStandees = standees;

    // 2. Sun Board Signs
    const sunboard = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('sunboard') || name.includes('stick on') || name.includes('wall mount') || name.includes('hanging');
    });
    const defaultSunboard = sunboard;

    // 3. Displays
    const displays = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('decal') || name.includes('dangler') || name.includes('selfie frame') || name.includes('tent card');
    });
    const defaultDisplays = displays;

    // 4. Name Plates
    const namePlates = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('name plate') || name.includes('nameplate');
    });
    const defaultNamePlates = namePlates;

    // 5. Banners
    const banners = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('banner') || name.includes('flex');
    });
    const defaultBanners = banners;

    // 6. Custom Signage & Decor
    const decor = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('canvas') || name.includes('bumper') || name.includes('window') || name.includes('plaque') || name.includes('wall frame');
    });
    const defaultDecor = decor;

    return {
      standees: defaultStandees.slice(0, 5),
      sunboard: defaultSunboard.slice(0, 5),
      displays: defaultDisplays.slice(0, 5),
      namePlates: defaultNamePlates.slice(0, 5),
      banners: defaultBanners.slice(0, 5),
      decor: defaultDecor.slice(0, 5)
    };
  };

  const getPackagingSubgroups = () => {
    const products = getProductsForCategory('packaging');
    const allPackaging = [...dbProducts, ...products];

    const uniqueMap = new Map();
    allPackaging.forEach(p => { if (p.id) uniqueMap.set(p.id, p); });
    const pool = Array.from(uniqueMap.values());

    // 1. Packaging Labels
    const labels = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('label') && !name.includes('box');
    });
    const defaultLabels = labels;

    // 2. Stickers
    const stickers = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('sticker') && !name.includes('label');
    });
    const defaultStickers = stickers;

    // 3. Shipping and Flat Mailer Boxes
    const mailerBoxes = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('mailer box') || name.includes('shipping box') || name.includes('carton') || name.includes('gift packaging box');
    });
    const defaultMailerBoxes = mailerBoxes;

    // 4. Hospitality
    const hospitality = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('menu') || name.includes('placemat') || name.includes('tent card') || name.includes('door hanger') || name.includes('coaster');
    });
    const defaultHospitality = hospitality;

    // 5. Tote Bags
    const toteBags = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('tote') || name.includes('bag') && !name.includes('paper') && !name.includes('poly') && !name.includes('laptop');
    });
    const defaultToteBags = toteBags;

    // 6. Packing Tape
    const tape = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('tape') || name.includes('packing tape');
    });
    const defaultTape = tape;

    // 7. Paper Bags
    const paperBags = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('paper bag') || name.includes('retail paper') || name.includes('takeout paper');
    });
    const defaultPaperBags = paperBags;

    // 8. Packaging Add-ons
    const addons = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('tissue') || name.includes('wrapping paper') || name.includes('poly bag') || name.includes('sleeves') || name.includes('jute') || name.includes('sticker');
    });
    const defaultAddons = addons;

    return {
      labels: defaultLabels.slice(0, 5),
      stickers: defaultStickers.slice(0, 5),
      mailerBoxes: defaultMailerBoxes.slice(0, 5),
      hospitality: defaultHospitality.slice(0, 5),
      toteBags: defaultToteBags.slice(0, 5),
      tape: defaultTape.slice(0, 5),
      paperBags: defaultPaperBags.slice(0, 5),
      addons: defaultAddons.slice(0, 6)
    };
  };

  const getTrophiesSubgroups = () => {
    const pool = dbProducts.filter((p: any) => {
      const cat = String(p.category || '').toLowerCase().trim();
      return (cat === 'trophies' || cat === 'awards') && !p.isDisabled;
    });

    const bySub = (subs: string[]) => pool.filter((p: any) => {
      const sub = String(p.subCategory || '').toLowerCase().trim();
      return subs.some(s => sub === s);
    });

    return {
      wooden: bySub(['wooden trophies', 'wooden plaques']).slice(0, 5),
      metal: bySub(['metal trophies', 'metal cups']).slice(0, 5),
      fiber: bySub(['fiber trophies']).slice(0, 5),
      other: bySub(['other products']).slice(0, 5)
    };
  };

  const getDynamicCustomColumns = (categoryName: string, knownSubs: string[]) => {
    const lowerKnown = knownSubs.map(s => s.toLowerCase().trim());
    
    // Find all products in dbProducts belonging to this category
    const catProducts = dbProducts.filter((p: any) => {
      const cat = String(p.category || '').toLowerCase().trim();
      if (categoryName.toLowerCase() === 'personalised gifts' || categoryName.toLowerCase() === 'gifts') {
        return cat === 'personalised gifts' || cat === 'gifts' || cat === 'personalized gifts';
      }
      if (categoryName.toLowerCase() === 'business stationery') {
        return cat === 'business stationery' || cat === 'stationery';
      }
      if (categoryName.toLowerCase() === 'apparel') {
        return cat === 'apparel' || cat === 'custom apparel';
      }
      if (categoryName.toLowerCase() === 'promotional materials') {
        return cat === 'promotional materials' || cat === 'marketing materials' || cat === 'marketing';
      }
      if (categoryName.toLowerCase() === 'signages & banners') {
        return cat === 'signages & banners' || cat === 'signage' || cat === 'signage & posters';
      }
      return cat === categoryName.toLowerCase().trim();
    });

    const groups: Record<string, any[]> = {};
    catProducts.forEach((p: any) => {
      if (p.subCategory) {
        const subClean = p.subCategory.trim();
        const subLower = subClean.toLowerCase();
        if (!lowerKnown.includes(subLower) && subLower !== '') {
          if (!groups[subClean]) {
            groups[subClean] = [];
          }
          if (groups[subClean].length < 5) {
            groups[subClean].push(p);
          }
        }
      }
    });

    return Object.entries(groups).map(([subName, products]) => ({
      subName,
      products
    }));
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        {showMobileSearch ? (
          <div className="flex h-16 items-center px-4 max-w-7xl mx-auto gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowMobileSearch(false)} type="button">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    {suggestions.map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setSearchQuery(p.name);
                          setShowSuggestions(false);
                          setShowMobileSearch(false);
                          navigate('/product/' + (p.slug || p.id));
                        }}
                        className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3"
                      >
                        {(p.image || (p.images && p.images[0])) ? (
                           <img src={p.image || (p.images && p.images[0])} alt={p.name} className="w-8 h-8 object-cover rounded-md" loading="lazy" width="32" height="32" />
                        ) : (
                           <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center"><Search className="w-4 h-4 text-gray-400" /></div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.category || 'Product'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
            <Button variant="ghost" onClick={handleSearchSubmit} className="text-purple-600 font-semibold text-sm">
              Search
            </Button>
          </div>
        ) : (
          <div className="flex h-16 items-center px-4 md:px-6 max-w-7xl mx-auto gap-4">
            {/* Logo & Trust Badges */}
            <div className="flex items-center gap-6 xl:gap-8 mr-2 lg:mr-4 shrink-0">
              <Link to="/" className="flex items-center">
                <img referrerPolicy="no-referrer" src="/logo.png" alt="Printfield" className="h-10 w-auto object-contain" />
              </Link>
              <div className="hidden md:flex items-center gap-6 border-l border-gray-200 pl-6 xl:pl-8">
                 <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                   <ShieldCheck className="w-4 h-4 text-green-600" />
                   <span className="hidden xl:inline">Premium Quality</span>
                   <span className="inline xl:hidden">Premium</span>
                 </div>
                 <Link to="/rating" className="hidden lg:flex items-center gap-1.5 text-sm text-gray-700 font-semibold hover:text-purple-600 transition-colors bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                   <span className="text-amber-500">★</span>
                   <span>4.3 Reviews</span>
                 </Link>
                  <a href="tel:+919606371222" className="flex items-center gap-2 text-sm text-gray-600 font-medium hover:text-purple-600 transition-colors">
                    <Phone className="w-4 h-4 text-purple-600" />
                    <span className="hidden xl:inline">+91 9606371222</span>
                    <span className="xl:hidden">Call</span>
                  </a>
                  <a href="https://wa.me/919606371222?text=Hi%20Printfield%2C%20I%27m%20interested%20in%20your%20printing%20services." target="_blank" rel="noopener noreferrer" className="hidden lg:flex items-center gap-1.5 text-sm text-white font-semibold bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-full transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <span className="hidden md:inline">WhatsApp</span>
                  </a>
              </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center justify-center mx-auto max-w-2xl relative">
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
                          setSearchQuery(p.name);
                          setShowSuggestions(false);
                          navigate('/product/' + (p.slug || p.id));
                        }}
                        className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3"
                      >
                        {(p.image || (p.images && p.images[0])) ? (
                           <img src={p.image || (p.images && p.images[0])} alt={p.name} className="w-10 h-10 object-cover rounded-md border border-gray-100" />
                        ) : (
                           <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center"><Search className="w-4 h-4 text-gray-400" /></div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{p.category || 'Product'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            {/* Icons */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMobileSearch(true)} aria-label="Search">
                <Search className="h-5 w-5 text-gray-600" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-gray-700 hover:text-purple-600 rounded-full" 
                onClick={() => setIsMobileMenuOpen(true)} 
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
              
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" className="text-sm font-medium text-gray-700 capitalize px-2 hover:text-purple-600" onClick={() => navigate('/profile')}>
                     <User className="h-4 w-4 mr-2" />
                     {user.name || (user.email ? user.email.split('@')[0] : 'User')}
                  </Button>
                  <Button variant="ghost" className="text-sm font-medium text-gray-700 px-2 hover:text-purple-600" onClick={() => navigate('/orders')}>Quote Requested</Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
                    <LogOut className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" className="hidden sm:flex gap-2" onClick={() => navigate('/login')}>
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="hidden lg:inline text-sm font-medium">Sign In</span>
                </Button>
              )}

              <Button variant="default" className="flex gap-2 bg-purple-600 hover:bg-purple-700 rounded-full px-4" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="h-5 w-5" />
                <span className="font-semibold">Cart {cart.length > 0 && `(${cart.length})`}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Categories Nav (Desktop) */}
        <div className="hidden md:flex items-center px-4 md:px-6 max-w-7xl mx-auto bg-white border-t border-gray-100 relative">
          <nav className="flex items-center justify-center gap-x-3.5 lg:gap-x-5 xl:gap-x-8 text-xs lg:text-sm font-medium text-gray-600 w-full flex-wrap">
            <div className="group">
              <Link to="/categories" className="flex items-center gap-1 hover:text-purple-600 py-3 whitespace-nowrap font-semibold text-gray-900 border-b-2 border-transparent hover:border-purple-600 transition-colors">
                All Products <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </Link>
              
              {/* Mega Menu Dropdown */}
              <div className="absolute top-full left-0 right-0 w-[780px] bg-white border border-gray-100 shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-5 mt-1">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-purple-600">Explore All Products & Categories</h4>
                  <Link to="/categories" className="text-xs font-semibold text-purple-600 hover:underline">View All Catalog &rarr;</Link>
                </div>
                <div className="grid grid-cols-4 gap-x-5 gap-y-4">
                  {categoriesData.slice(0, 8).map((cat, idx) => (
                    <div key={idx}>
                      <Link to={`/category/${encodeURIComponent(cat.name)}`} className="text-[11px] font-bold text-gray-900 uppercase tracking-wide hover:text-purple-600 transition-colors block mb-2 truncate border-l-2 border-purple-500 pl-2">
                        {cat.name}
                      </Link>
                      <ul className="space-y-0.5">
                        {(cat.subCategories || []).slice(0, 5).map((sub, sidx) => (
                          <li key={sidx}>
                            <Link to={`/category/${encodeURIComponent(cat.name)}?subCategory=${encodeURIComponent(sub)}`} className="text-[11px] text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors block truncate font-medium">
                              {sub}
                            </Link>
                          </li>
                        ))}
                        {(cat.subCategories || []).length > 5 && (
                          <li>
                            <Link to={`/category/${encodeURIComponent(cat.name)}`} className="text-[11px] text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors block font-semibold">
                              + View All
                            </Link>
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Level Categories */}
            {categoriesData.slice(0, 6).map((cat, idx) => {
              const catProducts = dbProducts.filter((p: any) => {
                const pCat = String(p.category || '').toLowerCase().trim();
                return pCat === cat.name.toLowerCase();
              });
              // Derive subcategory columns from actual products (real subCategories), falling back to declared ones
              const realSubs = Array.from(new Set(catProducts.map((p: any) => String(p.subCategory || '').trim()).filter(Boolean)));
              const subs = (realSubs.length > 0 ? realSubs : (cat.subCategories || [])).slice(0, 6);
              const productsBySub: Record<string, any[]> = {};
              subs.forEach((sub: string) => {
                productsBySub[sub] = catProducts.filter((p: any) => {
                  const pSub = String(p.subCategory || '').toLowerCase().trim();
                  return pSub === sub.toLowerCase();
                }).slice(0, 4);
              });
              // Products without a matching subcategory
              const unmatched = catProducts.filter((p: any) => {
                const pSub = String(p.subCategory || '').toLowerCase().trim();
                return !subs.some((s: string) => s.toLowerCase() === pSub);
              }).slice(0, 3);

              return (
                <div className="group relative" key={idx}>
                  <Link to={`/category/${encodeURIComponent(cat.name)}`} className="flex items-center gap-1 hover:text-purple-600 py-3 whitespace-nowrap font-medium transition-colors border-b-2 border-transparent hover:border-purple-600">
                    {cat.name} {(cat.subCategories || []).length > 0 && <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180" />}
                  </Link>
                  
                  {(cat.subCategories || []).length > 0 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-[680px] bg-white border border-gray-100 shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-5 mt-1">
                      <div className="flex justify-between items-center border-b pb-2 mb-4">
                        <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-purple-600">{cat.name}</h5>
                        <Link to={`/category/${encodeURIComponent(cat.name)}`} className="text-xs font-semibold text-purple-600 hover:underline">View All &rarr;</Link>
                      </div>
                      <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                        {subs.map((sub: string, sidx: number) => {
                          const subProducts = productsBySub[sub] || [];
                          return (
                            <div key={sidx}>
                              <Link to={`/category/${encodeURIComponent(cat.name)}?subCategory=${encodeURIComponent(sub)}`} className="text-[11px] font-bold text-gray-900 uppercase tracking-wide hover:text-purple-600 transition-colors block mb-1.5 truncate">
                                {sub}
                              </Link>
                              {subProducts.length > 0 && (
                                <ul className="space-y-0.5">
                                  {subProducts.slice(0, 4).map((p: any) => (
                                    <li key={p.id}>
                                      <Link to={`/product/${p.slug || p.id}`} className="text-[11px] text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors block truncate font-medium">
                                        {p.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            <div className="group relative">
              <Link to="/category/Trophies" className="flex items-center gap-1 hover:text-purple-600 py-3 whitespace-nowrap font-medium transition-colors border-b-2 border-transparent hover:border-purple-600">
                Trophies <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180" />
              </Link>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[680px] bg-white border border-gray-100 shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-5 mt-1">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-purple-600">Trophies</h5>
                  <Link to="/category/Trophies" className="text-xs font-semibold text-purple-600 hover:underline">View All &rarr;</Link>
                </div>
                <div className="grid grid-cols-4 gap-x-5 gap-y-4">
                  {[
                    { label: "Wooden Trophies", products: getTrophiesSubgroups().wooden },
                    { label: "Metal Trophies", products: getTrophiesSubgroups().metal },
                    { label: "Fiber Trophies", products: getTrophiesSubgroups().fiber },
                    { label: "Other Products", products: getTrophiesSubgroups().other }
                  ].map(({ label, products }) => (
                    <div key={label}>
                      <Link to={`/category/Trophies?subCategory=${encodeURIComponent(label)}`} className="text-[11px] font-bold text-gray-900 uppercase tracking-wide hover:text-purple-600 transition-colors block mb-1.5 truncate">
                        {label}
                      </Link>
                      {products.length > 0 && (
                        <ul className="space-y-0.5">
                          {products.slice(0, 4).map((p: any) => (
                            <li key={p.id}>
                              <Link to={`/product/${p.slug || p.id}`} className="text-[11px] text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors block truncate font-medium">
                                {p.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative w-[300px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10">
            {/* Drawer Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                <img referrerPolicy="no-referrer" src="/logo.png" alt="Printfield" className="h-8 w-auto" />
              </Link>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -m-2 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Account Status */}
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name || 'Account'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }}
                    className="text-xs font-semibold text-purple-600 hover:underline shrink-0 ml-2"
                  >
                    Profile
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Welcome to Printfield</p>
                    <p className="text-xs text-gray-500">Sign in for quotes & tracking</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-full shrink-0 ml-3"
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Quick Links */}
              <div className="px-3 pt-4 pb-2">
                <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Quick Links</p>
                <div className="space-y-0.5">
                  {[
                    { to: '/categories', icon: <Grid className="w-5 h-5 text-purple-600" />, label: 'All Products', bold: true },
                    { to: '/custom-printing', icon: <Printer className="w-5 h-5 text-purple-600" />, label: 'Custom Printing' },
                  ].map((item) => (
                    <Link 
                      key={item.to}
                      to={item.to} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 transition-colors ${item.bold ? 'font-semibold text-gray-900 text-sm' : 'font-medium text-gray-700 text-sm'}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="px-3 py-2">
                <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Categories</p>
                <div className="space-y-0.5">
                  {categoriesData.map((cat, idx) => (
                    <Link 
                      key={idx}
                      to={`/category/${encodeURIComponent(cat.name)}`} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-purple-50 text-gray-700 font-medium text-sm transition-colors"
                    >
                      <span className="truncate">{cat.name}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Customer Links */}
              <div className="px-3 py-2 border-t border-gray-100">
                <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Help & Support</p>
                <div className="space-y-0.5">
                  <Link 
                    to="/rating" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-amber-50 text-gray-700 font-medium text-sm transition-colors"
                  >
                    <Star className="w-5 h-5 text-amber-500" />
                    <span>Reviews & Ratings</span>
                  </Link>
                  <Link 
                    to="/orders" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 text-gray-700 font-medium text-sm transition-colors"
                  >
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span>Quote Requests</span>
                  </Link>
                  <Link 
                    to="/contact" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 text-gray-700 font-medium text-sm transition-colors"
                  >
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>Contact & Support</span>
                  </Link>
                </div>
              </div>

              {/* Contact CTA */}
              <div className="px-3 py-3">
                <a 
                  href="https://wa.me/919606371222?text=Hi%20Printfield%2C%20I%27m%20interested%20in%20your%20printing%20services." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Chat on WhatsApp
                </a>
                <a 
                  href="tel:+919606371222"
                  className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 border border-purple-200 text-purple-700 hover:bg-purple-50 text-sm font-semibold rounded-lg transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call +91 9606371222
                </a>
              </div>

              {/* Sign Out */}
              {user && (
                <div className="px-3 pb-4">
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </>
  );
}
