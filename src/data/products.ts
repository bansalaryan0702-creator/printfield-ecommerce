export interface Category {
  id: string;
  name: string;
  icon?: string;
  subCategories?: string[];
  description?: string;
  image?: string;
}

export interface VariationOption {
  name: string;
  price: number;
}

export interface ProductVariation {
  id: string;
  name: string;
  options: VariationOption[];
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  price: number;
  minQty?: number;
  qtyMultiple?: number;
  stockQty?: number;
  image: string;
  images?: string[];
  description: string;
  cardDescription?: string;
  features?: string[];
  variations?: ProductVariation[];
  colors?: any[];
  isBestseller?: boolean;
  isDisabled?: boolean;
  inMegaMenu?: boolean;
  badge?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export const Categories: Category[] = [
  {
    "id": "business-stationery",
    "name": "Business Stationery",
    "icon": "package",
    "image": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&auto=format&fit=crop&q=80"
  },
  {
    "id": "drinkware",
    "name": "Drinkware",
    "icon": "gift",
    "image": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=1200&auto=format&fit=crop&q=80"
  },
  {
    "id": "corporate-gifts",
    "name": "Corporate Gifts",
    "icon": "gift",
    "image": "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&auto=format&fit=crop&q=80"
  },
  {
    "id": "signage",
    "name": "Signages & Banners",
    "icon": "signpost",
    "image": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80"
  },
  {
    "id": "apparel",
    "name": "Apparel",
    "icon": "shirt",
    "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=80"
  },
  {
    "id": "gifts",
    "name": "Personalised Gifts",
    "icon": "gift",
    "image": "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&auto=format&fit=crop&q=80"
  },
  {
    "id": "trophies",
    "name": "Trophies",
    "icon": "trophy",
    "image": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&auto=format&fit=crop&q=80"
  }
];

export const PopularProducts: Product[] = [];
