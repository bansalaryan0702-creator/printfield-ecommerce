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
    "image": "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=1600&auto=format&fit=crop"
  },
  {
    "id": "drinkware",
    "name": "Drinkware",
    "icon": "gift",
    "image": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=1600&auto=format&fit=crop"
  },
  {
    "id": "corporate-gifts",
    "name": "Corporate Gifts",
    "icon": "gift",
    "image": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1600&auto=format&fit=crop"
  },
  {
    "id": "signage",
    "name": "Signages & Banners",
    "icon": "signpost",
    "image": "https://images.unsplash.com/photo-1572945281869-7023f82f338a?q=80&w=1600&auto=format&fit=crop"
  },
  {
    "id": "apparel",
    "name": "Apparel",
    "icon": "shirt",
    "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1600&auto=format&fit=crop"
  },
  {
    "id": "gifts",
    "name": "Personalised Gifts",
    "icon": "gift",
    "image": "https://images.unsplash.com/photo-1513885535751-8b9238bd45a1?q=80&w=1600&auto=format&fit=crop"
  },
  {
    "id": "trophies",
    "name": "Trophies",
    "icon": "trophy",
    "image": "https://images.unsplash.com/photo-1578269174936-2709b5a5e023?q=80&w=1600&auto=format&fit=crop"
  }
];

export const PopularProducts: Product[] = [];
