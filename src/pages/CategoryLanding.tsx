import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Layout } from "@/src/components/layout/Layout";
import { SEO } from "@/src/components/SEO";
import { ProductCard } from "@/src/components/ui/ProductCard";
import { useProducts } from "../hooks/useProducts";
import { ArrowRight, CheckCircle2, Phone, MapPin } from "lucide-react";
import { motion } from "motion/react";

interface CategoryPageData {
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroHeading: string;
  heroSub: string;
  heroGradient: string;
  intro: string;
  features: { title: string; text: string }[];
  whyChooseUs: string[];
  services: string[];
  faq: { q: string; a: string }[];
  ctaHeading: string;
  ctaText: string;
  categoryFilter: string;
  keywords: string[];
  schemaType?: string;
}

const CATEGORIES: Record<string, CategoryPageData> = {
  "corporate-gifts": {
    title: "Corporate Gifts in Whitefield Bangalore | Printfield",
    metaTitle: "Corporate Gifts in Whitefield Bangalore | Custom branded Gifts | Printfield",
    metaDescription: "Best corporate gifts in Whitefield, Bangalore. Custom branded mugs, pens, tech accessories, gift sets & onboarding kits. Bulk orders, GST invoice, fast delivery. 22+ years experience.",
    heroHeading: "Corporate Gifts & Branded Merchandise",
    heroSub: "Premium custom corporate gifts for employee onboarding, client appreciation, Diwali gifting & promotional events. Delivered across Whitefield, Bangalore.",
    heroGradient: "from-amber-500 to-orange-600",
    intro: "Printfield is Whitefield's leading corporate gifting company with over 22 years of experience. We help businesses create memorable brand impressions through high-quality customised corporate gifts. From employee onboarding kits and Diwali gift hampers to client appreciation gifts and trade show giveaways, our extensive catalogue covers every corporate gifting need. Based on Borewell Road, Whitefield, we deliver across Bengaluru including ITPL, Brookefield, Marathahalli, and EPIP Zone.",
    features: [
      { title: "Custom Branding", text: "Logo printing, laser engraving, and custom packaging on all gifts" },
      { title: "Bulk Orders Welcome", text: "No minimum for gifts — even single pieces available. Volume discounts from 10+ units" },
      { title: "GST Invoice", text: "Full GST input credit for all corporate orders" },
      { title: "Same-Day Design Approval", text: "Get digital mockups within 2 hours of placing your order" },
    ],
    whyChooseUs: [
      "22+ years serving Bengaluru's top companies",
      "In-house production — no middlemen, better quality control",
      "Free design assistance for logos and branding",
      "Express delivery within Whitefield in 1-2 days",
      "Premium brands: Ambrane, Syska, Beats, HP, SanDisk",
      "Custom gift packaging and ribbons available",
    ],
    services: [
      "Employee Onboarding Kits",
      "Diwali & Festival Gift Hampers",
      "Client Appreciation Gifts",
      "Trade Show & Exhibition Giveaways",
      "Executive Gift Sets",
      "Branded Tech Accessories",
      "Custom Drinkware & Mugs",
      "Promotional Bags & Backpacks",
      "Trophy & Award Gifts",
      "Customised Stationery Kits",
    ],
    faq: [
      { q: "What are the best corporate gifts for employees?", a: "Popular corporate gifts include customised t-shirts, branded drinkware (mugs, water bottles), tech accessories (power banks, USB drives), executive diaries, and gift sets. At Printfield, we offer all these with your company logo starting from just ₹99 per piece." },
      { q: "What is the minimum order for corporate gifts?", a: "For most corporate gifts at Printfield, there is no minimum order. You can order even a single piece. However, for bulk orders of 50+ units, we offer significant volume discounts of up to 30%." },
      { q: "How long does corporate gift production take?", a: "Standard production time is 3-5 business days. For urgent orders, we offer express 24-48 hour production for select items like t-shirts, mugs, and pens. Delivery within Whitefield is usually same-day or next-day." },
      { q: "Do you provide GST invoices for corporate orders?", a: "Yes, all corporate orders at Printfield come with a proper GST invoice. You can claim input tax credit on all promotional and gifting expenses." },
      { q: "Can you customise gifts with our company logo?", a: "Yes, we specialise in custom branding. We offer screen printing, DTF printing, laser engraving, and embroidery for logo placement on virtually any product. We provide free digital mockups before production." },
    ],
    ctaHeading: "Need Corporate Gifts for Your Team?",
    ctaText: "Get a free quote for customised corporate gifts. Bulk discounts, GST invoice, and express delivery across Bangalore.",
    categoryFilter: "corporate-gifts",
    keywords: ["corporate gifts whitefield", "corporate gifts bangalore", "custom corporate gifts", "employee gifts", "client gifts", "diwali gifts corporate"],
    schemaType: "Product",
  },
  trophies: {
    title: "Trophies & Awards in Whitefield Bangalore | Printfield",
    metaTitle: "Custom Trophies & Awards in Whitefield Bangalore | Crystal, Wooden, Metal | Printfield",
    metaDescription: "Best custom trophies in Whitefield, Bangalore. Crystal, wooden, metal & fibre trophies. Award plaques, mementos & recognition awards. Bulk orders, fast delivery. 22+ years experience.",
    heroHeading: "Custom Trophies & Awards",
    heroSub: "Premium crystal, wooden, metal and fibre trophies for corporate awards, sports events, academic achievements & recognition ceremonies. Whitefield, Bangalore.",
    heroGradient: "from-yellow-500 to-amber-600",
    intro: "Printfield is Whitefield's most trusted trophy shop with over 22 years of experience in crafting premium awards and recognition trophies. We offer an extensive range of crystal trophies, resin awards, wooden plaques, metal mementos, and fibre trophies suitable for corporate annual days, sports tournaments, academic achievements, and employee recognition programs. Our in-house production facility on Borewell Road, Whitefield ensures fast turnaround and consistent quality for orders of any size.",
    features: [
      { title: "6 Trophy Materials", text: "Crystal, Resin, Acrylic, Wooden, Metal, and Fiber trophies available" },
      { title: "Custom Engraving", text: "Laser engraving and UV printing with names, logos, and event details" },
      { title: "Same-Day Dispatch", text: "Ready stock trophies dispatched same-day. Custom orders in 2-3 days" },
      { title: "Bulk & Single Pieces", text: "Order 1 trophy or 1000 — same quality, competitive pricing" },
    ],
    whyChooseUs: [
      "22+ years trophy crafting experience",
      "Largest collection: 300+ trophy designs across 6 materials",
      "Custom sizes from 6 inches to 3 feet tall",
      "Free name plate and logo engraving on bulk orders",
      "Same-day dispatch for ready stock trophies",
      "Delivery across Bengaluru in 1-2 days",
    ],
    services: [
      "Corporate Award Trophies",
      "Sports Tournament Trophies",
      "Academic Achievement Awards",
      "Employee Recognition Trophies",
      "Customised Mementos & Plaques",
      "Crystal Awards",
      "Wooden Engraved Plaques",
      "Metal & Brass Mementos",
      "Fiber and Resin Trophies",
      "Shield & Medal Awards",
    ],
    faq: [
      { q: "What types of trophies do you offer?", a: "Printfield offers 300+ trophy designs across 6 materials: Crystal trophies, Resin trophies, Acrylic trophies, Wooden plaques, Metal mementos, and Fiber trophies. We have options ranging from ₹99 to ₹5000 per piece." },
      { q: "What is the price of custom trophies?", a: "Trophy prices at Printfield start from ₹99 for basic fiber trophies, ₹199 for wooden plaques, ₹299 for metal mementos, ₹399 for acrylic trophies, ₹599 for resin awards, and ₹999+ for crystal trophies. Custom engraving is included in the price." },
      { q: "Can I get trophies with custom engraving?", a: "Yes, all our trophies can be customised with laser engraving or UV printing. We engrave names, event titles, dates, logos, and custom messages. Digital proof is provided before production." },
      { q: "What is the minimum order quantity for trophies?", a: "There is no minimum order at Printfield. You can order a single trophy or bulk order of 1000+. Bulk orders above 20 units get additional discounts." },
      { q: "How quickly can I get trophies delivered?", a: "Ready stock trophies can be dispatched same-day with delivery within Whitefield in 1-2 days. Custom engraved trophies take 2-3 business days for production. Express 24-hour delivery available for select models." },
    ],
    ctaHeading: "Order Custom Trophies Today",
    ctaText: "Get a free quote for customised trophies and awards. Bulk discounts, free engraving, and express delivery across Bangalore.",
    categoryFilter: "trophies",
    keywords: ["trophies whitefield", "trophies bangalore", "custom trophies", "award trophies", "crystal trophies", "wooden trophies", "corporate awards"],
    schemaType: "Product",
  },
  apparel: {
    title: "Custom Apparel Printing in Whitefield Bangalore | Printfield",
    metaTitle: "Custom T-Shirt Printing & Apparel in Whitefield Bangalore | DTF, Screen Print | Printfield",
    metaDescription: "Best custom t-shirt printing in Whitefield, Bangalore. DTF printing, screen printing & embroidery on t-shirts, polo shirts, hoodies & jackets. Bulk orders from 10 pcs. Fast delivery.",
    heroHeading: "Custom Apparel Printing",
    heroSub: "Premium t-shirt printing, polo shirts, hoodies, jackets & caps with DTF, screen print & embroidery. Bulk orders from 10 pieces. Whitefield, Bangalore.",
    heroGradient: "from-blue-500 to-indigo-600",
    intro: "Printfield is Whitefield's premier custom apparel printing service with state-of-the-art DTF (Direct-to-Film), screen printing, and embroidery technology. We transform plain apparel into branded merchandise for startups, corporates, colleges, and events. Based on Borewell Road, Whitefield, our in-house production facility handles orders from 10 pieces to 10,000+ with consistent quality and fast turnaround. We deliver across Bengaluru including ITPL, Brookefield, Marathahalli, Kadugodi, and Hoodi.",
    features: [
      { title: "3 Printing Methods", text: "DTF (full color), Screen Print (bulk), and Embroidery (premium)" },
      { title: "10+ Apparel Brands", text: "Feels, Luxco, Enamor, Rediscover, Auro, and more" },
      { title: "No Minimum for DTF", text: "DTF printing starts from just 1 piece. Screen print from 50 pieces" },
      { title: "Free Design Help", text: "Our team helps create print-ready files from your logo or idea" },
    ],
    whyChooseUs: [
      "Latest DTF printing technology for vibrant, durable prints",
      "Screen printing for bulk orders at lowest prices in Bangalore",
      "Premium embroidery for corporate polos and jackets",
      "Same-day design approval and digital mockups",
      "10+ apparel brands: Feels, Luxco, Enamor, Auro",
      "Express delivery within Whitefield in 1-2 days",
    ],
    services: [
      "Custom T-Shirt Printing (Round Neck)",
      "Polo T-Shirt Printing",
      "Hoodie & Sweatshirt Printing",
      "Jacket & Bomber Printing",
      "Corporate Uniform Printing",
      "Event & Merch T-Shirts",
      "Caps & Headwear Printing",
      "Backpack & Bag Printing",
      "Dry-Fit & Sports Wear",
      "Embroidered Apparel",
    ],
    faq: [
      { q: "What printing methods do you offer for t-shirts?", a: "Printfield offers 3 printing methods: DTF (Direct-to-Film) for full-color designs starting from 1 piece, Screen Printing for bulk orders (50+) at the lowest prices, and Embroidery for premium corporate wear like polos and jackets." },
      { q: "What is the minimum order for t-shirt printing?", a: "For DTF printing, there is no minimum — you can order even 1 t-shirt. For screen printing, the minimum is 50 pieces. For embroidery, the minimum is 10 pieces. Prices decrease significantly with larger quantities." },
      { q: "How much does t-shirt printing cost?", a: "T-shirt printing prices at Printfield start from ₹149 per print for DTF, ₹99 per print for screen printing (50+ pcs), and ₹199 per piece for embroidery. Blank t-shirts start from ₹180 depending on the brand and GSM." },
      { q: "How long does t-shirt printing take?", a: "DTF printing: 1-2 business days. Screen printing: 3-5 business days. Embroidery: 2-3 business days. Express 24-hour production available for DTF orders." },
      { q: "Can you print on any t-shirt brand?", a: "Yes, we work with all major brands including Feels, Luxco, Enamor, Auro, Allen Solly, and more. You can also provide your own blanks for printing." },
    ],
    ctaHeading: "Get Custom Apparel Printed Today",
    ctaText: "Upload your design and get a free mockup. DTF printing from 1 piece, screen print from 50 pieces. Fast delivery across Bangalore.",
    categoryFilter: "apparel",
    keywords: ["t-shirt printing whitefield", "t-shirt printing bangalore", "custom t-shirts", "DTF printing", "screen printing", "apparel printing"],
    schemaType: "Product",
  },
  "business-stationery": {
    title: "Business Cards & Stationery in Whitefield Bangalore | Printfield",
    metaTitle: "Business Cards, Letterheads & Stationery in Whitefield Bangalore | Printfield",
    metaDescription: "Best business cards, letterheads & stationery printing in Whitefield, Bangalore. Premium cards, envelopes, folders, stamps & certificates. Bulk orders, fast delivery.",
    heroHeading: "Business Cards & Corporate Stationery",
    heroSub: "Premium business cards, letterheads, envelopes, folders, stamps & corporate stationery. Make a lasting professional impression.",
    heroGradient: "from-emerald-500 to-teal-600",
    intro: "Printfield is Whitefield's trusted business stationery printing partner for over 22 years. We produce premium business cards, corporate letterheads, branded envelopes, presentation folders, rubber stamps, and complete office stationery kits. Our in-house production on Borewell Road, Whitefield ensures fast turnaround and consistent quality. We serve startups, SMEs, and large enterprises across Bengaluru with custom stationery that reflects your brand's professionalism.",
    features: [
      { title: "Premium Card Stock", text: "300 GSM to 400 GSM cards, matte, glossy, textured & metallic finishes" },
      { title: "Same-Day Printing", text: "Business cards printed and dispatched same-day for standard orders" },
      { title: "Design Assistance", text: "Free template customization and design help for all stationery" },
      { title: "Bulk Pricing", text: "Significant discounts on orders of 500+ cards and 100+ letterheads" },
    ],
    whyChooseUs: [
      "22+ years business stationery experience",
      "Premium paper stocks: 300 GSM to 400 GSM",
      "Special finishes: foil, emboss, die-cut, spot UV",
      "Same-day business card printing",
      "Complete stationery kits for new businesses",
      "Delivery across Bengaluru in 1-2 days",
    ],
    services: [
      "Business Cards (Standard & Premium)",
      "Corporate Letterheads",
      "Branded Envelopes",
      "Presentation Folders",
      "Rubber Stamps & Seal Stamps",
      "Notepads & Diaries",
      "ID Cards & Lanyards",
      "Certificates & Award Cards",
      "Bill Books & Receipts",
      "Compliment Slips",
    ],
    faq: [
      { q: "How much do business cards cost?", a: "Business card prices at Printfield start from ₹299 for 100 standard cards (300 GSM). Premium cards with special finishes like foil, emboss, or spot UV start from ₹599 for 100 cards. Design assistance is free." },
      { q: "What is the turnaround time for business cards?", a: "Standard business cards are printed same-day if ordered before 2 PM. Premium cards with special finishes take 2-3 business days. Delivery within Whitefield is usually next-day." },
      { q: "Do you offer letterhead and envelope printing?", a: "Yes, we print corporate letterheads on premium 100-120 GSM paper and branded envelopes in all standard sizes. We offer both offset and digital printing with your company branding." },
      { q: "Can you create a complete stationery kit?", a: "Yes, we create customised corporate stationery kits including business cards, letterheads, envelopes, notepads, pens, and folders — all branded with your company logo. Ideal for new employee onboarding." },
    ],
    ctaHeading: "Order Business Stationery Today",
    ctaText: "Get premium business cards, letterheads and stationery printed with your brand. Same-day dispatch, bulk discounts.",
    categoryFilter: "business-stationery",
    keywords: ["business cards whitefield", "business cards bangalore", "letterhead printing", "corporate stationery", "stationery printing"],
    schemaType: "Product",
  },
  drinkware: {
    title: "Custom Drinkware & Bottles in Whitefield Bangalore | Printfield",
    metaTitle: "Custom Water Bottles, Mugs & Drinkware in Whitefield Bangalore | Printfield",
    metaDescription: "Best custom drinkware in Whitefield, Bangalore. Printed water bottles, coffee mugs, tumblers & sipper bottles. Logo printing, bulk orders, fast delivery.",
    heroHeading: "Custom Drinkware & Branded Bottles",
    heroSub: "Custom printed water bottles, coffee mugs, tumblers & sipper bottles with your logo. Perfect for corporate gifts, events & promotions.",
    heroGradient: "from-cyan-500 to-blue-600",
    intro: "Printfield offers the widest range of custom drinkware in Whitefield, Bangalore. From stainless steel water bottles and ceramic coffee mugs to printed tumblers and insulated sipper bottles, we print your logo or design on any drinkware item. Our advanced printing techniques ensure vibrant, long-lasting prints that survive daily use. Based on Borewell Road, Whitefield, we deliver across Bengaluru with fast turnaround on both single pieces and bulk orders.",
    features: [
      { title: "8+ Drinkware Types", text: "Bottles, mugs, tumblers, sippers, flasks, glasses, cups & carafes" },
      { title: "Multiple Print Methods", text: "Screen printing, sublimation, laser engraving & UV printing" },
      { title: "No Minimum Order", text: "Order 1 mug or 1000 bottles — same quality, fair pricing" },
      { title: "Premium Brands", text: "Milton, Cello, Prestige, Milton, Hindware and more" },
    ],
    whyChooseUs: [
      "Widest drinkware collection in Whitefield",
      "Print on any surface: metal, ceramic, glass, plastic",
      "Sublimation for full-color photographic prints",
      "Laser engraving for premium stainless steel items",
      "No minimum order — even single pieces welcome",
      "Delivery within Whitefield in 1-2 days",
    ],
    services: [
      "Custom Water Bottles (Steel, Plastic, Glass)",
      "Printed Coffee Mugs & Tea Cups",
      "Insulated Tumblers & Flasks",
      "Sipper Bottles & Sports Bottles",
      "Corporate Branded Mugs",
      "Photo Mugs & Personalised Gifts",
      "Corporate Drinkware Gift Sets",
      "Promotional Bottles for Events",
      "Engraved Stainless Steel Bottles",
      "Custom Beer Mugs & Glasses",
    ],
    faq: [
      { q: "What types of drinkware can you print on?", a: "We can print on virtually any drinkware — stainless steel bottles, glass bottles, ceramic mugs, plastic sippers, insulated tumblers, copper bottles, and more. We use screen printing, sublimation, UV printing, and laser engraving depending on the material." },
      { q: "What is the price of custom printed mugs?", a: "Custom printed mugs at Printfield start from ₹149 for ceramic mugs, ₹199 for coffee mugs, ₹299 for insulated mugs, and ₹399 for glass mugs. Price includes logo printing on one side." },
      { q: "Can I order a single customised bottle?", a: "Yes, there is no minimum order at Printfield. You can order a single customised bottle or mug. However, bulk orders of 20+ units get significant discounts of up to 25%." },
      { q: "How durable is the print on drinkware?", a: "Our sublimation prints are permanent and dishwasher-safe. Screen prints last 2-3 years with regular use. Laser engraving is permanent and will never fade. We use premium inks for all print methods." },
    ],
    ctaHeading: "Custom Drinkware for Your Brand",
    ctaText: "Get custom printed bottles, mugs and tumblers with your logo. Single pieces to bulk orders. Fast delivery across Bangalore.",
    categoryFilter: "drinkware",
    keywords: ["custom bottles whitefield", "printed mugs bangalore", "custom drinkware", "branded water bottles", "corporate mugs"],
    schemaType: "Product",
  },
  signage: {
    title: "Signage & Banners in Whitefield Bangalore | Printfield",
    metaTitle: "Custom Signage, Banners & Standees in Whitefield Bangalore | Printfield",
    metaDescription: "Best signage & banner printing in Whitefield, Bangalore. Roll-up standees, outdoor banners, sunboard, acrylic signs, LED light boxes. Fast delivery, bulk orders.",
    heroHeading: "Signage, Banners & Display Printing",
    heroSub: "Roll-up standees, outdoor banners, sunboard printing, acrylic signs, LED light boxes & event displays. High-visibility signage for your business.",
    heroGradient: "from-red-500 to-rose-600",
    intro: "Printfield is Whitefield's complete signage and display printing solution. We produce high-quality roll-up standees, outdoor banners, sunboard prints, acrylic name boards, LED light boxes, and all types of event displays. Whether you need storefront signage, trade show displays, or event banners, our state-of-the-art large format printers deliver vibrant, durable results. Based on Borewell Road, Whitefield, we serve businesses, startups, and event organisers across Bengaluru.",
    features: [
      { title: "Large Format Printing", text: "Up to 5 feet wide, any length — banners, standees, backdrops" },
      { title: "Indoor & Outdoor", text: "UV-resistant inks for outdoor banners, premium finishes for indoor" },
      { title: "Custom Sizes", text: "Any size from A4 posters to 10x10 ft event backdrops" },
      { title: "Quick Turnaround", text: "Standard banners in 24 hours. Express same-day available" },
    ],
    whyChooseUs: [
      "Latest large format printers for sharp, vibrant prints",
      "UV-resistant inks for outdoor durability (2+ years)",
      "Complete range: standees, banners, boards, LED boxes",
      "Same-day banner printing for urgent requirements",
      "Installation support for large signage projects",
      "Delivery and setup across Bengaluru",
    ],
    services: [
      "Roll-Up Standees (80cm x 200cm)",
      "Outdoor Flex Banners",
      "Indoor Fabric Banners",
      "Sunboard Prints & Cutouts",
      "Acrylic Name Boards & Signs",
      "LED Light Boxes & Signboards",
      "Event Backdrops & Step & Repeat",
      "Window Graphics & Decals",
      "Poster Printing (All Sizes)",
      "Display Stands & Brochure Holders",
    ],
    faq: [
      { q: "What types of signage do you offer?", a: "Printfield offers a complete range of signage: roll-up standees, outdoor flex banners, indoor fabric banners, sunboard prints, acrylic name boards, LED light boxes, event backdrops, window graphics, and poster printing in any size." },
      { q: "How much does a roll-up standee cost?", a: "Roll-up standees at Printfield start from ₹999 for a standard 80cm x 200cm standee including the base. Premium standees with carrying case start from ₹1,499. Price includes full-color printing on one side." },
      { q: "What is the turnaround time for banners?", a: "Standard banners are ready in 24 hours. Express same-day printing is available for an additional charge. Large orders (10+ banners) take 2-3 business days. Delivery within Whitefield is usually same-day." },
      { q: "Do you offer outdoor banners?", a: "Yes, we offer weather-resistant outdoor banners printed on heavy-duty flex material with UV-resistant inks. These banners last 2+ years outdoors. We also offer mesh banners for windy locations." },
    ],
    ctaHeading: "Get Custom Signage & Banners",
    ctaText: "Roll-up standees from ₹999, banners from ₹499. Same-day printing available. Delivery across Bangalore.",
    categoryFilter: "signage",
    keywords: ["signage whitefield", "banners bangalore", "standee printing", "flex banner", "LED sign board", "sunboard printing"],
    schemaType: "Product",
  },
  gifts: {
    title: "Personalised Gifts in Whitefield Bangalore | Printfield",
    metaTitle: "Personalised & Customised Gifts in Whitefield Bangalore | Photo Mugs, Frames, Keychains | Printfield",
    metaDescription: "Best personalised gifts in Whitefield, Bangalore. Custom photo mugs, photo frames, canvas prints, keychains & photo books. Fast delivery, single pieces.",
    heroHeading: "Personalised & Customised Gifts",
    heroSub: "Custom photo mugs, photo frames, canvas prints, keychains & unique personalised gifts. Perfect for birthdays, anniversaries & special occasions.",
    heroGradient: "from-pink-500 to-rose-600",
    intro: "Printfield brings you the finest personalised gifts in Whitefield, Bangalore. Transform your cherished photos and memories into beautiful custom gifts — photo mugs, photo frames, canvas prints, personalised keychains, photo books, and more. Whether it's a birthday, anniversary, wedding, or corporate event, our advanced printing technology ensures your gifts are vibrant, lasting, and truly special. Based on Borewell Road, Whitefield, we deliver across Bengaluru.",
    features: [
      { title: "Photo-Quality Prints", text: "High-resolution printing that brings your photos to life" },
      { title: "No Minimum Order", text: "Order 1 personalised item or 100 — same quality and care" },
      { title: "Gift Wrapping", text: "Beautiful gift packaging available for all personalised items" },
      { title: "Same-Day Ready", text: "Most personalised gifts ready within 24 hours" },
    ],
    whyChooseUs: [
      "Latest sublimation and UV printing technology",
      "Vibrant, permanent photo-quality prints",
      "No minimum order — even single personalised pieces",
      "Beautiful gift packaging available",
      "Most items ready within 24 hours",
      "Delivery across Bengaluru in 1-2 days",
    ],
    services: [
      "Custom Photo Mugs",
      "Photo Frames (All Sizes)",
      "Canvas Prints & Wall Art",
      "Personalised Keychains",
      "Customised Photo Books",
      "Printed Cushions & Pillows",
      "Photo Calendars",
      "Personalised Pen Stands",
      "Custom Phone Cases",
      "Gift Sets & Hampers",
    ],
    faq: [
      { q: "What personalised gifts do you offer?", a: "Printfield offers a wide range of personalised gifts: custom photo mugs, photo frames, canvas prints, personalised keychains, photo books, printed cushions, photo calendars, custom phone cases, and gift hampers." },
      { q: "How much do personalised photo mugs cost?", a: "Custom photo mugs at Printfield start from ₹249 for a standard ceramic mug, ₹349 for a magic mug (changes colour with heat), and ₹449 for a glass mug. Price includes full-colour photo printing." },
      { q: "Can I order a single personalised gift?", a: "Yes, there is absolutely no minimum order. You can order a single personalised mug, frame, or any other item. Gift wrapping is available for an additional ₹50." },
      { q: "How long does personalisation take?", a: "Most personalised gifts are ready within 24 hours. Canvas prints and photo books take 2-3 business days. Express same-day personalisation is available for mugs and keychains." },
    ],
    ctaHeading: "Create Personalised Gifts Today",
    ctaText: "Upload your photo and we'll create a beautiful personalised gift. Single pieces, no minimum. Delivery across Bangalore.",
    categoryFilter: "gifts",
    keywords: ["personalised gifts whitefield", "personalised gifts bangalore", "custom photo mugs", "photo frames", "customised gifts"],
    schemaType: "Product",
  },
  "education-institutions": {
    title: "Printing for Schools & Colleges in Whitefield Bangalore | Printfield",
    metaTitle: "Custom Printing for Schools, Colleges & Educational Institutions in Whitefield Bangalore | Printfield",
    metaDescription: "Printing services for schools & colleges in Whitefield, Bangalore. ID cards, certificates, t-shirts, badges, event banners, annual day materials. Fast delivery.",
    heroHeading: "Printing for Schools & Educational Institutions",
    heroSub: "ID cards, certificates, event t-shirts, badges, annual day banners, prospectuses & complete printing solutions for schools, colleges & coaching centres.",
    heroGradient: "from-violet-500 to-purple-600",
    intro: "Printfield is the preferred printing partner for schools, colleges, and educational institutions across Whitefield, Bangalore. We offer a complete range of printing services tailored for education — student and staff ID cards, academic certificates, event t-shirts, annual day banners, prospectus printing, admission forms, and institutional stationery. With 22+ years of experience, we understand the unique printing needs of educational institutions and deliver quality products at education-friendly prices.",
    features: [
      { title: "Education-Friendly Pricing", text: "Special discounted rates for schools, colleges & educational institutions" },
      { title: "Bulk ID Card Printing", text: "Student & staff ID cards with photos, barcodes & lanyards" },
      { title: "Event Materials", text: "Annual day banners, fest t-shirts, certificate printing" },
      { title: "Campus Signage", text: "Directional signs, notice boards, room number plates" },
    ],
    whyChooseUs: [
      "22+ years serving educational institutions",
      "Special education pricing and credit terms",
      "Complete range: ID cards to annual day materials",
      "Fast turnaround for event requirements",
      "Campus signage and display solutions",
      "Trusted by 50+ schools and colleges in Whitefield area",
    ],
    services: [
      "Student & Staff ID Cards",
      "Academic Certificates & Awards",
      "Annual Day & Event Banners",
      "College/School Fest T-Shirts",
      "Prospectus & Brochure Printing",
      "Admission Forms & Letterheads",
      "Notice Board Prints & Displays",
      "Directional & Room Signage",
      "Achievement Trophies & Plaques",
      "Welcome & Congratulation Banners",
    ],
    faq: [
      { q: "Do you offer special pricing for educational institutions?", a: "Yes, Printfield offers special discounted rates for schools, colleges, and educational institutions. We also offer credit terms for registered institutions. Contact us for a customised education pricing sheet." },
      { q: "Can you print student ID cards?", a: "Yes, we print student and staff ID cards with photos, barcodes, QR codes, and custom designs. We also supply matching lanyards. Bulk orders of 100+ cards get additional discounts." },
      { q: "Do you provide annual day event materials?", a: "Yes, we provide complete annual day materials: stage banners, backdrop printing, event t-shirts for students and staff, certificates, trophies, invitation cards, and welcome signage." },
      { q: "What is the turnaround time for bulk orders?", a: "ID cards take 3-5 business days for 100+ pieces. Banners and signage are ready in 24-48 hours. T-shirts take 3-5 business days. Express delivery is available for urgent requirements." },
    ],
    ctaHeading: "Get a Custom Quote for Your Institution",
    ctaText: "Special pricing for schools, colleges & educational institutions. ID cards, certificates, event materials and more.",
    categoryFilter: "corporate-gifts",
    keywords: ["school printing whitefield", "college printing bangalore", "ID cards schools", "educational printing", "annual day banners"],
    schemaType: "EducationalOrganization",
  },
};

export const CategoryLanding: React.FC = () => {
  const location = useLocation();
  const categorySlug = location.pathname.replace("/", "");
  const data = CATEGORIES[categorySlug];

  const { products, loading } = useProducts(1, 8, data?.categoryFilter);

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Page Not Found</h1>
            <Link to="/categories" className="text-purple-600 font-semibold hover:underline">
              Browse All Categories
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const baseUrl = "https://www.printfieldonline.com";

  const breadcrumbSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": data.heroHeading, "item": `${baseUrl}/${categorySlug}` },
    ],
  });

  const faqSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faq.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": { "@type": "Answer", "text": item.a },
    })),
  });

  const localBusinessSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Printfield - ${data.heroHeading} in Whitefield`,
    "description": data.metaDescription,
    "url": `${baseUrl}/${categorySlug}`,
    "image": `${baseUrl}/logo.png`,
    "telephone": "+919606371222",
    "email": "Aryan@printfield.in",
    "foundingDate": "2004",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "No 96, Mini Villa, Opp. Chaitanya Swojas, Borewell Road",
      "addressLocality": "Whitefield",
      "addressRegion": "Bengaluru, Karnataka",
      "postalCode": "560066",
      "addressCountry": "IN",
    },
    "geo": { "@type": "GeoCoordinates", "latitude": 12.9698, "longitude": 77.75 },
    "areaServed": ["Whitefield", "ITPL", "Brookefield", "Marathahalli", "Mahadevapura", "Kadugodi", "Hoodi"],
    "priceRange": "₹99 - ₹5000",
    "openingHoursSpecification": [
      { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], "opens": "10:00", "closes": "19:00" },
    ],
  });

  return (
    <Layout>
      <SEO
        title={data.title}
        description={data.metaDescription}
        canonicalUrl={`/${categorySlug}`}
        schema={`[${localBusinessSchema},${breadcrumbSchema},${faqSchema}]`}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-24 pb-32">
        <div className={`absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] bg-gradient-to-br ${data.heroGradient}`}></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-6">
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
                <span>/</span>
                <span className="text-white">{data.heroHeading}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{data.heroHeading}</h1>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">{data.heroSub}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to={`/categories`} className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg transition-all hover:bg-slate-100 flex items-center justify-center gap-2">
                  Browse Products <ArrowRight className="h-5 w-5" />
                </Link>
                <a href="https://wa.me/919606371222" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                  <Phone className="h-5 w-5" /> Get a Quote
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-lg text-slate-700 leading-relaxed">{data.intro}</p>
          <div className="flex items-center gap-2 mt-6 text-sm text-slate-500">
            <MapPin className="h-4 w-4" />
            <span>Serving Whitefield, ITPL, Brookefield, Marathahalli, Mahadevapura & all of Bengaluru</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {data.features.map((f, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      {!loading && products.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Products</h2>
                <p className="text-slate-600">Browse our curated selection of {data.heroHeading.toLowerCase()}</p>
              </div>
              <Link to={`/category/${data.categoryFilter}`} className="hidden md:flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link to={`/category/${data.categoryFilter}`} className="inline-flex items-center gap-2 text-purple-600 font-semibold">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us + Services */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Why Choose Printfield?</h2>
              <ul className="space-y-4">
                {data.whyChooseUs.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Our Services</h2>
              <ul className="space-y-3">
                {data.services.map((service, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {data.faq.map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">{item.q}</h3>
                <p className="text-slate-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{data.ctaHeading}</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">{data.ctaText}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/categories" className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-100 transition-all flex items-center gap-2">
              Browse Products <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="https://wa.me/919606371222" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-lg transition-all flex items-center gap-2">
              <Phone className="h-5 w-5" /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};
