import { apiFetch } from "../../lib/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, User, Printer, LogOut, ChevronDown, Phone, ShieldCheck, ArrowLeft, Menu, X, ChevronRight, Star, Shirt, Gift, Layers, Box, Award, Briefcase, Grid, FileText } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useContext, useState, useEffect } from "react";
import { Categories } from "../../data/products";
import { AppContext } from "../../context/AppContext";
import { CartDrawer } from "../../components/CartDrawer";

// Local high quality products list for category dropdowns if database doesn't have them
const LOCAL_PRODUCTS_BY_CATEGORY: Record<string, any[]> = {
  "apparel": [
    {
      id: "custom-tshirts",
      name: "Custom Round Neck T-Shirts",
      price: 349,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=300&auto=format&fit=crop",
      description: "Premium bio-washed cotton t-shirts with durable custom prints."
    },
    {
      id: "custom-polos",
      name: "Custom Polo T-Shirts",
      price: 499,
      image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=300&auto=format&fit=crop",
      description: "Professional collared polo shirts, perfect for corporate teams."
    },
    {
      id: "custom-hoodies",
      name: "Custom Hoodies & Sweatshirts",
      price: 899,
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300&auto=format&fit=crop",
      description: "Cozy custom hoodies with premium embroidery or print."
    },
    {
      id: "tote-bags",
      name: "Custom Canvas Tote Bags",
      price: 149,
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop",
      description: "Eco-friendly branded canvas bags for events and retail."
    }
  ],
  "gifts": [
    {
      id: "personalized-mugs",
      name: "Personalized Ceramic Mugs",
      price: 249,
      image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=300&auto=format&fit=crop",
      description: "Custom printed ceramic mugs. Perfect for corporate gifting."
    },
    {
      id: "custom-bottles",
      name: "Premium Steel Water Bottles",
      price: 449,
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=300&auto=format&fit=crop",
      description: "Insulated stainless steel bottles with laser engraved logo."
    },
    {
      id: "custom-keychains",
      name: "Engraved Metal Keychains",
      price: 99,
      image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=300&auto=format&fit=crop",
      description: "Durable metal or leather keychains with custom branding."
    },
    {
      id: "notebooks",
      name: "Custom Executive Notebooks",
      price: 299,
      image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=300&auto=format&fit=crop",
      description: "Premium leatherette notebooks with hard cover and custom page inserts."
    }
  ],
  "signage": [
    {
      id: "roll-up-standees",
      name: "Roll-up Standees (6x3 ft)",
      price: 1299,
      image: "https://images.unsplash.com/photo-1497005367839-6e852de72767?q=80&w=300&auto=format&fit=crop",
      description: "Portable, easy to assemble roll-up display standees."
    },
    {
      id: "vinyl-banners",
      name: "Outdoor Vinyl Banners",
      price: 349,
      image: "https://images.unsplash.com/photo-1563229649-7eaff6322b7a?q=80&w=300&auto=format&fit=crop",
      description: "Heavy-duty waterproof banners with grommets for display."
    },
    {
      id: "promotional-posters",
      name: "HD Wall Posters",
      price: 149,
      image: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?q=80&w=300&auto=format&fit=crop",
      description: "High-resolution printed glossy or matte posters."
    }
  ],
  "packaging": [
    {
      id: "shipping-boxes",
      name: "Custom Corrugated Boxes",
      price: 49,
      image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=300&auto=format&fit=crop",
      description: "Sturdy branded packaging boxes for safe product transit."
    },
    {
      id: "paper-bags",
      name: "Premium Branded Paper Bags",
      price: 29,
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop",
      description: "Elegant paper carrying bags with high quality prints."
    }
  ]
};

const DEFAULT_CATEGORIES_DATA: { name: string; subCategories: string[] }[] = [
  {
    name: "Business Stationery",
    subCategories: ["ID Cards & Lanyards", "Bill Books", "Envelopes", "Letterheads", "Rubber Stamps", "Notepads & Diaries", "Business Cards"]
  },
  {
    name: "Apparel",
    subCategories: ["Custom T-Shirts", "Polo T-Shirts", "Hoodies & Sweatshirts", "Caps & Hats", "Backpacks"]
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
          { id: 'jkcr3tpxx', name: 'Standard Visiting Cards', price: 199, image: 'https://images.unsplash.com/photo-1589330694165-27a3c3c764ed?q=80&w=300&auto=format&fit=crop', description: 'Premium quality standard visiting cards.' },
          { id: 'njui14k70', name: 'Rounded Corner Visiting Cards', price: 249, image: 'https://images.unsplash.com/photo-1589330694165-27a3c3c764ed?q=80&w=300&auto=format&fit=crop', description: 'Visiting cards with rounded corners.' },
          { id: 'o2w2btqp1', name: 'Non-Tearable Visiting Cards', price: 299, image: 'https://images.unsplash.com/photo-1589330694165-27a3c3c764ed?q=80&w=300&auto=format&fit=crop', description: 'Visiting cards printed on waterproof non-tearable paper.' }
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
          { id: 'flyers-a5', name: 'A5 Marketing Flyers', price: 499, image: 'https://images.unsplash.com/photo-1557002666-613dcf589254?q=80&w=300&auto=format&fit=crop', description: 'Vibrant promotional flyers.' },
          { id: 'brochures-trifold', name: 'Tri-Fold Pamphlets & Brochures', price: 699, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop', description: 'Tri-fold marketing brochures.' }
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

    // 1. T-shirts
    const tshirts = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return (name.includes('round neck') || name.includes('t-shirt') || name.includes('tshirt') || name.includes('polo')) &&
             !name.includes('popcorn') && !name.includes('m and s') && !name.includes('snitch');
    });
    const defaultTshirts = tshirts;

    // 2. Branded T-shirts
    const brandedTshirts = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('popcorn') || name.includes('m and s') || name.includes('snitch') || name.includes('signature') || name.includes('branded');
    });
    const defaultBrandedTshirts = brandedTshirts;

    // 3. Sweatshirts & Hoodies
    const hoodies = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('hoodie') || name.includes('sweatshirt') || name.includes('jacket');
    });
    const defaultHoodies = hoodies;

    // 4. Backpacks
    const backpacks = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('bag') || name.includes('backpack') || name.includes('sleeve') || name.includes('supasac');
    });
    const defaultBackpacks = backpacks;

    // 5. Caps
    const caps = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('cap') || name.includes('hat');
    });
    const defaultCaps = caps;

    // 6. Umbrellas & Raincoats
    const umbrellas = pool.filter((p: any) => {
      const name = String(p.name || '').toLowerCase();
      return name.includes('umbrella') || name.includes('raincoat') || name.includes('rainsuit');
    });
    const defaultUmbrellas = umbrellas;

    return {
      tshirts: defaultTshirts.slice(0, 5),
      brandedTshirts: defaultBrandedTshirts.slice(0, 5),
      hoodies: defaultHoodies.slice(0, 5),
      backpacks: defaultBackpacks.slice(0, 5),
      caps: defaultCaps.slice(0, 5),
      umbrellas: defaultUmbrellas.slice(0, 5)
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
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
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
                          navigate('/product/' + p.id);
                        }}
                        className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3"
                      >
                        {(p.image || (p.images && p.images[0])) ? (
                           <img src={p.image || (p.images && p.images[0])} alt={p.name} className="w-8 h-8 object-cover rounded-md" />
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
              <div className="hidden lg:flex items-center gap-6 border-l border-gray-200 pl-6 xl:pl-8">
                 <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                   <ShieldCheck className="w-4 h-4 text-green-600" />
                   <span className="hidden xl:inline">Premium Quality</span>
                   <span className="inline xl:hidden">Premium</span>
                 </div>
                 <Link to="/rating" className="flex items-center gap-1.5 text-sm text-gray-700 font-semibold hover:text-purple-600 transition-colors bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                   <span className="text-amber-500">★</span>
                   <span>4.3 Reviews</span>
                 </Link>
                 <Link to="/contact" className="flex items-center gap-2 text-sm text-gray-600 font-medium hover:text-purple-600 transition-colors">
                   <Phone className="w-4 h-4 text-purple-600" />
                   <span>Support</span>
                 </Link>
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
                          navigate('/product/' + p.id);
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
                                      <Link to={`/product/${p.id}`} className="text-[11px] text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors block truncate font-medium">
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
                              <Link to={`/product/${p.id}`} className="text-[11px] text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors block truncate font-medium">
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative flex-1 max-w-xs w-full bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                <img referrerPolicy="no-referrer" src="/logo.png" alt="Printfield" className="h-8 w-auto filter brightness-0 invert" />
              </Link>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Status */}
            <div className="p-4 bg-purple-50 border-b border-purple-100 shrink-0">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="truncate max-w-[140px]">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.name || 'Account'}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }}
                    className="text-xs font-semibold text-purple-600 hover:underline shrink-0"
                  >
                    Profile
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Welcome to Printfield</p>
                    <p className="text-[11px] text-gray-500">Sign in for quotes & order tracking</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-full shrink-0"
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Navigation List */}
            <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
              {/* Product Categories */}
              <div>
                <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Explore Categories</p>
                <div className="space-y-1">
                  <Link 
                    to="/categories" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-purple-50 text-slate-900 font-semibold text-sm transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Grid className="w-4.5 h-4.5 text-purple-600" />
                      <span>All Products & Catalog</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                  
                  {Categories.map((cat, idx) => (
                    <Link 
                      key={idx}
                      to={`/category/${cat.id}`} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-purple-50 text-slate-700 font-medium text-sm transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {cat.icon === 'shirt' ? <Shirt className="w-4.5 h-4.5 text-gray-500" /> :
                         cat.icon === 'gift' ? <Gift className="w-4.5 h-4.5 text-gray-500" /> :
                         cat.icon === 'contact' ? <User className="w-4.5 h-4.5 text-gray-500" /> :
                         cat.icon === 'package' ? <Box className="w-4.5 h-4.5 text-gray-500" /> :
                         <Layers className="w-4.5 h-4.5 text-gray-500" />}
                        <span>{cat.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Customer & Support Links */}
              <div>
                <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Links</p>
                <div className="space-y-1">
                  <Link 
                    to="/rating" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-50 text-slate-700 font-medium text-sm transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
                      <span>Reviews & Ratings (4.3★)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>

                  <Link 
                    to="/orders" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-purple-50 text-slate-700 font-medium text-sm transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4.5 h-4.5 text-purple-600" />
                      <span>Quote Requests / Orders</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>

                  <Link 
                    to="/contact" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-purple-50 text-slate-700 font-medium text-sm transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="w-4.5 h-4.5 text-purple-600" />
                      <span>Contact & Support</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </div>
              </div>

              {/* Quality Guarantee Badge */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3 text-xs text-slate-600">
                <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">100% Quality Guaranteed</p>
                  <p className="text-[11px] text-slate-500">Pan-India delivery with fast dispatch</p>
                </div>
              </div>

              {user && (
                <div className="pt-2 border-t border-gray-100">
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
