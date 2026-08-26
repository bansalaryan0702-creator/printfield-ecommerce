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
    "image": ""
  },
  {
    "id": "drinkware",
    "name": "Drinkware",
    "icon": "gift",
    "image": ""
  },
  {
    "id": "corporate-gifts",
    "name": "Corporate Gifts",
    "icon": "gift",
    "image": ""
  },
  {
    "id": "signage",
    "name": "Signages & Banners",
    "icon": "signpost",
    "image": ""
  },
  {
    "id": "apparel",
    "name": "Apparel",
    "icon": "shirt",
    "image": ""
  },
  {
    "id": "gifts",
    "name": "Personalised Gifts",
    "icon": "gift",
    "image": ""
  },
  {
    "id": "trophies",
    "name": "Trophies",
    "icon": "trophy",
    "image": ""
  }
];

export const PopularProducts: Product[] = [];
