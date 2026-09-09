import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/src/components/layout/Layout";
import { SEO } from "@/src/components/SEO";
import { 
  Shirt, 
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
  Zap,
  Check
} from "lucide-react";

interface ApparelType {
  name: string;
  gsm: string;
  bestFor: string;
  image: string;
  popularPrint: string;
}

const APPAREL_TYPES: ApparelType[] = [
  {
    name: "Classic Bio-Wash Round Neck",
    gsm: "180 GSM 100% Combed Cotton",
    bestFor: "Tech hackathons, college fests, startup launch events",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80",
    popularPrint: "Full-color DTF Print or Screen Print"
  },
  {
    name: "Corporate Executive Polo",
    gsm: "220-240 GSM Honeycomb Pique Cotton",
    bestFor: "Office uniforms, client meetings, sales teams",
    image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=80",
    popularPrint: "High-Density Left Chest Embroidery"
  },
  {
    name: "Heavyweight Winter Hoodie",
    gsm: "320-350 GSM Brushed Fleece Cotton",
    bestFor: "Developer winter swag, annual team retreats",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80",
    popularPrint: "Chest Logo Embroidery + Back Print"
  },
  {
    name: "Dry-Fit Performance T-Shirt",
    gsm: "160 GSM Micro-Polyester Mesh",
    bestFor: "Corporate cricket leagues, 5K marathons, sports days",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=80",
    popularPrint: "Sublimation or Breathable DTF"
  }
];

const FAQS = [
  {
    q: "What is the difference between DTF printing, Screen printing, and Embroidery?",
    a: "DTF (Direct-to-Film) is ideal for full-color gradients, photorealistic logos, and orders starting from 10 pieces. Screen printing is the most cost-effective solution for bulk quantities (50+ pieces) with 1-3 spot colors. Computerized embroidery offers the most premium, durable finish for corporate polo shirts, jackets, and caps."
  },
  {
    q: "What is your turnaround time for bulk corporate t-shirts in Bangalore?",
    a: "Standard bulk production takes 2 to 4 working days with doorstep delivery across Bangalore tech parks. For urgent event deadlines, we provide express 24-hour rush service."
  },
  {
    q: "Can we mix multiple sizes and colors in a single bulk order?",
    a: "Yes, you can freely mix sizes from XS to 5XL and choose multiple garment colors within the same bulk order without extra setup charges."
  },
  {
    q: "Do you provide physical fabric swatches and size samples before bulk printing?",
    a: "Yes! We can dispatch a sample sizing kit with blank polo and round neck t-shirts to your Bangalore office so your team can verify fit and fabric hand-feel before production."
  },
  {
    q: "Are your t-shirt fabrics pre-shrunk and colorfast?",
    a: "Yes, 100% of our cotton apparel undergoes biopolishing and pre-shrinking. We use reactive OEKO-TEX certified inks that resist fading through 50+ industrial washes."
  }
];

export const BulkTshirtPrinting: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [apparelStyle, setApparelStyle] = useState("Corporate Polo");
  const [estQuantity, setEstQuantity] = useState("100");
  const [companyName, setCompanyName] = useState("");

  const whatsappMessage = encodeURIComponent(
    `Hi Printfield, I'd like a quotation for Bulk T-Shirt Printing. Style: ${apparelStyle}, Estimated Quantity: ${estQuantity} pcs, Company: ${companyName || "Corporate Order"}. Please share pricing and mockup details.`
  );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.printfieldonline.com/" },
      { "@type": "ListItem", "position": 2, "name": "Bulk T-Shirt Printing Bangalore", "item": "https://www.printfieldonline.com/bulk-tshirt-printing-bangalore" }
    ]
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Bulk Custom T-Shirt Printing Bangalore",
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
    "areaServed": ["Whitefield", "Bellandur", "ITPL", "Electronic City", "Koramangala", "HSR Layout", "Manyata", "Bengaluru"],
    "description": "High-volume custom t-shirt printing, corporate polos, hoodies & uniforms in Bangalore with DTF, screen printing, and computerized embroidery.",
    "offers": {
      "@type": "Offer",
      "price": "199",
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
        title="Bulk Custom T-Shirt Printing in Bangalore | Corporate Polos & Hoodies | Printfield"
        description="Best bulk custom t-shirt printing in Bangalore. Screen printing, DTF & embroidery on polos, round necks, hoodies. Fast 1-2 day delivery. Free 3D mockups. Request quote."
        canonicalUrl="/bulk-tshirt-printing-bangalore"
        schema={JSON.stringify([breadcrumbSchema, serviceSchema, faqSchema])}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-24 pb-28">
        <div className="absolute inset-0 z-0 opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-700 via-slate-900 to-slate-950" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Bangalore's High-Capacity Apparel Factory
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Bulk Custom T-Shirt Printing <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                In Bangalore
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Equip your corporate teams, hackathons, and company events with high-grade customized apparel. DTF, screen printing, and computerized embroidery on 100% bio-washed cotton.
            </p>

            {/* Quick Estimate Calculator */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto backdrop-blur-sm shadow-2xl text-left">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Instant Bulk Apparel Quote
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Apparel Type</label>
                  <select
                    value={apparelStyle}
                    onChange={(e) => setApparelStyle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Corporate Polo">Corporate Polo (Embroidery)</option>
                    <option value="Round Neck T-Shirt">Round Neck (180 GSM Cotton)</option>
                    <option value="Hoodie / Sweatshirt">Premium Winter Hoodie</option>
                    <option value="Dry-Fit Sports Tee">Dry-Fit Sports T-Shirt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Order Quantity</label>
                  <select
                    value={estQuantity}
                    onChange={(e) => setEstQuantity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="25-50">25 - 50 Pieces</option>
                    <option value="100">100 Pieces (Best Value)</option>
                    <option value="250">250 Pieces</option>
                    <option value="500">500 Pieces</option>
                    <option value="1000+">1000+ Pieces (Enterprise)</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Company / Event Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Innovate Summit 2026"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://wa.me/919606371222?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/30"
                >
                  Get Immediate Pricing on WhatsApp
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="tel:+919606371222"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition-colors"
                >
                  <Phone className="w-4 h-4 text-purple-400" />
                  Call Now
                </a>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 text-slate-400 text-xs sm:text-sm">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Orders from 10 Pcs</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>2-3 Days Turnaround</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span>50+ Wash Guarantee</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>GST Credit Invoices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fabric & Apparel Types */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Premium Fabric Standards</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-2">
              Engineered for Corporate Wear & Maximum Comfort
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mt-3 text-sm sm:text-base">
              We exclusively use pre-shrunk, bio-washed cotton and performance blends designed to maintain color vibrancy and shape wash after wash.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {APPAREL_TYPES.map((apparel, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                  <img
                    src={apparel.image}
                    alt={`${apparel.name} - Bulk T-Shirt Printing Printfield Bangalore`}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    width="400"
                    height="300"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{apparel.gsm}</span>
                  <h3 className="text-base font-bold text-gray-900 mt-1 mb-2">{apparel.name}</h3>
                  <p className="text-xs text-gray-500 mb-4 flex-1">{apparel.bestFor}</p>
                  <div className="pt-3 border-t border-gray-100 text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>{apparel.popularPrint}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Printing Technology Comparison */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Printing Technology</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-2">
              Choosing the Right Printing Technique
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-2xl p-6 bg-slate-50">
              <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-md mb-4">Direct-To-Film (DTF)</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">High-Resolution Color</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Best for multi-color designs, photographic prints, gradients, and orders from 10 to 100 pieces. Zero color limits.
              </p>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Unlimited colors & gradients</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> High-detail precision</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Works on cotton, poly & blends</li>
              </ul>
            </div>

            <div className="border border-purple-300 rounded-2xl p-6 bg-purple-50/40 relative shadow-sm">
              <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">Lowest Bulk Cost</span>
              <span className="inline-block px-2.5 py-1 bg-purple-200 text-purple-800 text-xs font-bold rounded-md mb-4">Screen Printing</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Traditional Bulk Quality</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                The gold standard for large volume orders (50+ pieces) with 1 to 4 spot colors. Exceptional cost efficiency at scale.
              </p>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Lowest cost per unit at scale</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Ultra-durable pigment finish</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Ideal for large front/back prints</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-2xl p-6 bg-slate-50">
              <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-md mb-4">Computer Embroidery</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Executive Luxury Finish</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                The premier finish for corporate polos, jackets, fleece hoodies, and executive caps. 3D raised stitching available.
              </p>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Lifetime durability</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> High perceived corporate value</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Multi-needle Japanese precision</li>
              </ul>
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
              Common Questions About Bulk T-Shirt Printing
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
