import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/src/components/layout/Layout";
import { SEO } from "@/src/components/SEO";
import { 
  Gift, 
  Package, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  ChevronDown,
  Layers,
  Award,
  Zap
} from "lucide-react";

interface KitItem {
  category: string;
  name: string;
  description: string;
  image: string;
  tag?: string;
}

const KIT_ITEMS: KitItem[] = [
  {
    category: "Packaging",
    name: "Custom Rigid Box with Magnetic Lid",
    description: "Premium matte or gloss laminated hardboard box with custom logo foil stamping and high-density foam cavity.",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80",
    tag: "Most Popular"
  },
  {
    category: "Drinkware",
    name: "Stainless Steel Insulated Sipper Bottle (750ml)",
    description: "Double-walled vacuum insulated flask with laser engraving or UV printed company logo. Keeps beverages cold 24h / hot 12h.",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80",
    tag: "Bestseller"
  },
  {
    category: "Apparel",
    name: "Bio-Washed 220 GSM Cotton Polo T-Shirt",
    description: "Comfort-fit combed cotton corporate polo with high-density computer embroidery on chest and sleeve.",
    image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=80"
  },
  {
    category: "Stationery",
    name: "Hardbound Executive Diary & Pen Set",
    description: "PU leather debossed notebook with ribbon bookmark and premium rollerball metal pen engraved with employee name.",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80"
  },
  {
    category: "Tech",
    name: "Fast-Charging 10,000mAh Power Bank",
    description: "Compact dual-port power bank with LED battery indicator and full-bleed logo UV printing.",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&auto=format&fit=crop&q=80"
  },
  {
    category: "Accessories",
    name: "Custom Keychain & Welcome Card",
    description: "Zinc alloy metal keychain with customized printed welcome card signed by leadership.",
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=80"
  }
];

const FAQS = [
  {
    q: "What is the minimum order quantity (MOQ) for corporate welcome kits?",
    a: "Our minimum order quantity starts from just 10 kits for standard combinations, and 25 kits for fully customized die-cut foam rigid packaging. We cater to early-stage startups as well as enterprise batches of 5,000+ units."
  },
  {
    q: "How fast can you deliver welcome kits across Bangalore tech parks?",
    a: "For pre-curated combinations with in-stock items, we offer 24 to 48-hour delivery across Whitefield, Bellandur, Electronic City, Koramangala, and HSR Layout. Custom-manufactured rigid box sets typically take 3-5 working days."
  },
  {
    q: "Can each item be individually personalized with the employee's name?",
    a: "Yes! We offer precision laser engraving on bottles, pens, power banks, and diaries with individual employee names, in addition to your corporate logo."
  },
  {
    q: "Do you offer pan-India shipping to remote employees?",
    a: "Yes. We offer complete kitting, individual box packaging, and doorstep dispatch directly to employee home addresses across all Indian pin codes."
  },
  {
    q: "Can we request a physical sample kit before placing a bulk order?",
    a: "Absolutely. We provide pre-production digital 3D mockups within 2 hours, and can dispatch physical sample kits to your office for leadership sign-off."
  }
];

export const CorporateWelcomeKits: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [estQuantity, setEstQuantity] = useState("50");
  const [companyName, setCompanyName] = useState("");

  const whatsappMessage = encodeURIComponent(
    `Hi Printfield, I'm interested in Corporate Welcome Kits for ${companyName ? companyName : "our company"}. Estimated quantity: ${estQuantity} kits. Please share your catalog and quote.`
  );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.printfieldonline.com/" },
      { "@type": "ListItem", "position": 2, "name": "Corporate Welcome Kits Bangalore", "item": "https://www.printfieldonline.com/corporate-welcome-kits-bangalore" }
    ]
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Corporate Welcome Kits & Employee Onboarding Hampers Bangalore",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Printfield Digital Solutions",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "No 96, Mini Villa, Opp. Chaitnya Swojas, Borewell Road",
        "addressLocality": "Whitefield",
        "addressRegion": "Bengaluru, Karnataka",
        "postalCode": "560066",
        "addressCountry": "IN"
      },
      "telephone": "+919606371222"
    },
    "areaServed": ["Whitefield", "Bellandur", "ITPL", "Electronic City", "Koramangala", "HSR Layout", "Bengaluru"],
    "description": "Custom employee onboarding welcome kits, company swag hampers, and new hire boxes in Bangalore with branded apparel, drinkware, tech items, and custom rigid boxes.",
    "offers": {
      "@type": "Offer",
      "price": "499",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2026-12-31"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  return (
    <Layout>
      <SEO
        title="Corporate Welcome Kits & Onboarding Swag Bangalore | Printfield"
        description="Premium employee welcome kits & onboarding swag boxes in Bangalore. Custom rigid boxes, bottles, diaries, hoodies & tech items with logo. Fast 1-2 day delivery. Get free mockup."
        canonicalUrl="/corporate-welcome-kits-bangalore"
        schema={JSON.stringify([breadcrumbSchema, serviceSchema, faqSchema])}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-24 pb-28">
        <div className="absolute inset-0 z-0 opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-700 via-slate-900 to-slate-950" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Bangalore's #1 Employee Onboarding Specialist
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Corporate Welcome Kits & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Employee Onboarding Swag
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Create an unforgettable Day-1 experience for your new hires. Custom branded apparel, insulated bottles, tech essentials, and luxury rigid boxes — assembled and delivered across Bengaluru.
            </p>

            {/* Quick Estimate Calculator */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto backdrop-blur-sm shadow-2xl text-left">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Get Instant Quote & Digital Mockup
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Tech"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Estimated Kits Quantity</label>
                  <select
                    value={estQuantity}
                    onChange={(e) => setEstQuantity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="10-25">10 - 25 Kits</option>
                    <option value="50">50 Kits (Popular)</option>
                    <option value="100">100 Kits</option>
                    <option value="250">250 Kits</option>
                    <option value="500+">500+ Kits</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://wa.me/919606371222?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/30"
                >
                  Request Kit Catalog & Quote
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="tel:+919606371222"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition-colors"
                >
                  <Phone className="w-4 h-4 text-purple-400" />
                  Call Expert
                </a>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 text-slate-400 text-xs sm:text-sm">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>MOQ from 10 Kits</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>24-48h Bangalore Delivery</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                <span>Pan-India Home Dispatch</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>GST Tax Invoices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kit Items Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Mix & Match Kit Components</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-2">
              Everything Your New Hires Need On Day One
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mt-3 text-sm sm:text-base">
              Choose items individually or build a custom welcome hamper. All items come custom branded with your company logo and employee name.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {KIT_ITEMS.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100 relative">
                  {item.tag && (
                    <span className="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                      {item.tag}
                    </span>
                  )}
                  <img
                    src={item.image}
                    alt={`${item.name} - Corporate Welcome Kits Printfield Bangalore`}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    width="500"
                    height="312"
                  />
                </div>
                <div className="p-6">
                  <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">{item.category}</span>
                  <h3 className="text-base font-bold text-gray-900 mt-1 mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              to="/corporate-gifts"
              className="inline-flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-700 underline underline-offset-4"
            >
              Browse 200+ more corporate gifting products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Effortless 3-Step Process</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-2">
              From Concept to Desk Delivery
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-8 relative">
              <span className="text-4xl font-black text-purple-300">01</span>
              <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2">Select Items & Share Logo</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pick your preferred kit items and box style. Send us your logo, brand guidelines, and target budget.
              </p>
            </div>
            <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-8 relative">
              <span className="text-4xl font-black text-purple-300">02</span>
              <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2">Review 3D Digital Mockup</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We generate high-resolution digital 3D mockups within 2 hours. Tweak colors, logo placements, and packaging until satisfied.
              </p>
            </div>
            <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-8 relative">
              <span className="text-4xl font-black text-purple-300">03</span>
              <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2">Batch Delivery or Home Dispatch</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We print, assemble, quality-check, and deliver all boxes directly to your Bangalore office or ship individually to remote employees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Frequently Asked Questions</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
              Questions About Corporate Welcome Kits
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                >
                  <span className="text-base">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};
