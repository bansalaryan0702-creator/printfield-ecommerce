import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/src/components/layout/Layout";
import { Categories } from "@/src/data/products";
import { ProductCard } from "@/src/components/ui/ProductCard";
import { 
  ArrowRight, Contact, Shirt, Megaphone, Gift, Signpost, Package, Star,
  GraduationCap, Factory, Store, Utensils, HeartPulse, Building2, Laptop, Home as HomeIcon, X, Check, Loader2
} from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { motion, useScroll, useTransform } from "motion/react";
import { apiFetch } from "../lib/api";
import { SEO } from "../components/SEO";

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case "contact": return <Contact className="h-8 w-8" />;
    case "shirt": return <Shirt className="h-8 w-8" />;
    case "megaphone": return <Megaphone className="h-8 w-8" />;
    case "gift": return <Gift className="h-8 w-8" />;
    case "signpost": return <Signpost className="h-8 w-8" />;
    case "package": return <Package className="h-8 w-8" />;
    default: return <Package className="h-8 w-8" />;
  }
};

const getIndustryIcon = (iconName: string) => {
  switch (iconName) {
    case "GraduationCap": return <GraduationCap className="h-6 w-6 text-purple-600" />;
    case "Factory": return <Factory className="h-6 w-6 text-purple-600" />;
    case "Store": return <Store className="h-6 w-6 text-purple-600" />;
    case "Utensils": return <Utensils className="h-6 w-6 text-purple-600" />;
    case "HeartPulse": return <HeartPulse className="h-6 w-6 text-purple-600" />;
    case "Building2": return <Building2 className="h-6 w-6 text-purple-600" />;
    case "Laptop": return <Laptop className="h-6 w-6 text-purple-600" />;
    case "HomeIcon": return <HomeIcon className="h-6 w-6 text-purple-600" />;
    default: return <Building2 className="h-6 w-6 text-purple-600" />;
  }
};

const INDUSTRIES = [
  {
    id: "education",
    name: "Education Institutions",
    tagline: "Schools, universities, and training academies",
    image: "",
    icon: "GraduationCap",
    kitTitle: "Academic Excellence Brand Kit",
    kitItems: [
      { name: "Custom Student ID Cards", desc: "Durable PVC with magnetic strip or barcode options." },
      { name: "Premium Nylon Lanyards", desc: "Custom printed with academy logo & safety breakaway latch." },
      { name: "Branded Matte Notebooks", desc: "80 GSM premium ruled sheets, soft-touch cover." },
      { name: "Engraved Metal Pens", desc: "Sleek blue-ink ballpoint with laser-etched academy name." },
      { name: "Annual Achievement Certificates", desc: "A4 thick 300 GSM cardstock with gold-foil border." }
    ]
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    tagline: "Production hubs, mills, and shipping factories",
    image: "",
    icon: "Factory",
    kitTitle: "Industrial Safety & Identity Kit",
    kitItems: [
      { name: "High-Visibility Safety Vests", desc: "Certified neon mesh vest with reflective security tape." },
      { name: "Embroidered Twill Caps", desc: "Structured 6-panel breathable cap with 3D logo embroidery." },
      { name: "Breathable Cotton Polo Shirts", desc: "Recycled poly-cotton, pre-shrunk for physical labor." },
      { name: "Heavy-Duty Staff ID Cards", desc: "Scratch-resistant plastic with RFID chip." },
      { name: "Matte Stainless Steel Flasks", desc: "Double-walled vacuum insulated, 750ml capacity." }
    ]
  },
  {
    id: "retail",
    name: "Retail",
    tagline: "Boutiques, department stores, and supermarkets",
    image: "",
    icon: "Store",
    kitTitle: "Premium Retail Packaging & Brand Kit",
    kitItems: [
      { name: "Custom Kraft Paper Shopping Bags", desc: "Thick recyclable paper with reinforced twisted handles." },
      { name: "Luxury Apparel Hang Tags", desc: "Heavy matte board with metallic foil lettering & twine." },
      { name: "Branded Tissue Wrap Paper", desc: "Acid-free 17 GSM wrapping paper with pattern print." },
      { name: "Promotional Discount Flyers", desc: "Glossy double-sided 150 GSM leaflets." },
      { name: "Outdoor Retractable Roll-up Standees", desc: "Anodized aluminum base with tear-proof polyester banner." }
    ]
  },
  {
    id: "cafes-restaurants",
    name: "Cafes and Restaurants",
    tagline: "Bistros, coffee bars, and fine dining locations",
    image: "",
    icon: "Utensils",
    kitTitle: "Culinary Identity & Hospitality Kit",
    kitItems: [
      { name: "Multi-layered Table Menu Cards", desc: "Waterproof synthetic paper with non-tear matte coating." },
      { name: "Custom Absorbent Drink Coasters", desc: "Thick compressed pulp board, single or double-sided." },
      { name: "Heavy-Duty Cotton Aprons", desc: "Adjustable neck strap, utility pockets, premium front logo print." },
      { name: "Matte Ceramic Branded Coffee Mugs", desc: "11oz scratch-resistant dishwasher safe ceramic." },
      { name: "Kraft Food Takeaway Paper Bags", desc: "Greaseproof lined kraft paper with flat block bottom." }
    ]
  },
  {
    id: "healthcare",
    name: "Healthcare",
    tagline: "Clinics, labs, diagnostics, and care centers",
    image: "",
    icon: "HeartPulse",
    kitTitle: "Clinical Trust & Stationery Kit",
    kitItems: [
      { name: "Embroidered Professional Lab Coats", desc: "Anti-stain breathable poly-cotton with surgeon-grade stitching." },
      { name: "Anti-microbial Lanyards & ID Badges", desc: "Silicone-coated lanyards, easily sanitized PVC badges." },
      { name: "Custom Doctor Prescription Pads", desc: "70 GSM bond paper, clean tear-away binding, 100 sheets/pad." },
      { name: "Heavy-Weight Patient File Folders", desc: "Laminated cardstock with dual metal clip fasteners." },
      { name: "Branded Wellness Desk Calendars", desc: "Wiro-bound standing calendar with customized monthly health tips." }
    ]
  },
  {
    id: "mnc",
    name: "MNC",
    tagline: "Corporate offices and multinational enterprises",
    image: "",
    icon: "Building2",
    kitTitle: "Executive Corporate Identity Kit",
    kitItems: [
      { name: "Premium Vegan Leather Diaries", desc: "Hardcover, integrated ribbon marker, magnetic clasp." },
      { name: "Laser-Engraved Executive Pens", desc: "Luxury twist-action metallic pen, premium rollerball refill." },
      { name: "Custom Neoprene Laptop Sleeves", desc: "Water-resistant padded interior, secure dual zippers." },
      { name: "100% Cotton Premium Corporate Polo Tees", desc: "Combed cotton, custom collar tipping, premium fit." },
      { name: "Triple-insulated Metal Water Bottles", desc: "Hot/Cold retention up to 24 hrs, matte powder finish." }
    ]
  },
  {
    id: "itbc",
    name: "ITBC",
    tagline: "IT organizations and Business Centers / Tech Parks",
    image: "",
    icon: "Laptop",
    kitTitle: "Modern Tech Workspace Brand Kit",
    kitItems: [
      { name: "Ergonomic Branded Backpacks", desc: "Anti-theft zip design, integrated USB port, laptop compartment." },
      { name: "Smooth Anti-slip Mousepads", desc: "Micro-textured fiber surface, natural rubber backing." },
      { name: "Premium Heavyweight Pullover Hoodies", desc: "320 GSM fleece lined, premium cotton-blend fabric." },
      { name: "Dual-compartment Tech Accessories Organizers", desc: "Waterproof canvas pouch with elastic mesh loops." },
      { name: "Vibrant Branded Die-Cut Stickers", desc: "Weatherproof matte vinyl, residue-free removal." }
    ]
  },
  {
    id: "realestate",
    name: "Realestate",
    tagline: "Builders, development consultants, and brokers",
    image: "",
    icon: "HomeIcon",
    kitTitle: "Luxury Property Presentation Kit",
    kitItems: [
      { name: "High-gloss Tri-fold Property Brochures", desc: "Premium 250 GSM paper with gloss laminate finish." },
      { name: "Thick 400GSM Embossed Business Cards", desc: "Premium textured stock, blind debossing/embossing." },
      { name: "Custom Embossed Presentation Folders", desc: "A4 oversized with pre-cut slots for business cards." },
      { name: "Rigid Acrylic Table Standees", desc: "Laser cut clear acrylic, double-sided graphic insert." },
      { name: "Engraved Metal Keychains", desc: "Sturdy alloy with split ring, laser marked with logo." }
    ]
  }
];

export function Home() {
  const { products, loading } = useProducts(1, 6);
  const containerRef = useRef(null);

  // Industry Solutions States
  const [selectedIndustry, setSelectedIndustry] = useState<typeof INDUSTRIES[number] | null>(null);
  const [rfqName, setRfqName] = useState("");
  const [rfqPhone, setRfqPhone] = useState("");
  const [rfqEmail, setRfqEmail] = useState("");
  const [rfqCompany, setRfqCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [rfqError, setRfqError] = useState("");

  const handleIndustryRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqName || !rfqPhone || !rfqEmail) {
      setRfqError("Name, phone, and email are required.");
      return;
    }
    setRfqError("");
    setIsSubmitting(true);

    try {
      const res = await apiFetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rfqName,
          phone: rfqPhone,
          email: rfqEmail,
          company: rfqCompany || selectedIndustry?.name || "Corporate Client",
          requirements: `Industry Kit: ${selectedIndustry?.kitTitle}`,
          description: `Interested in the complete customized solutions kit for ${selectedIndustry?.name}. Specifically checking recommended items: ${selectedIndustry?.kitItems.map(i => i.name).join(', ')}.`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }
      setSubmittedId(data.id);
      // reset form
      setRfqName("");
      setRfqPhone("");
      setRfqEmail("");
      setRfqCompany("");
    } catch (err: any) {
      setRfqError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <Layout>
      <SEO 
        title="Printfield | Corporate Printing & Gifting in Whitefield, Bangalore" 
        description="Corporate printing & gifting in Whitefield, Bangalore. 22+ years, own production unit on Borewell Road. Onboarding kits, awards, apparel, brochures, signage, packaging. Fast delivery."
        canonicalUrl="/"
        ogImage="/logo.png"
        schema={JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Printfield Digital Solutions",
          "image": "https://www.printfieldonline.com/logo.png",
          "url": "https://www.printfieldonline.com",
          "telephone": "+919606371222",
          "email": "Aryan@printfield.in",
          "foundingDate": "2004",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "No 96, Mini Villa, Opp. Chaitnya Swojas, Borewell Road",
            "addressLocality": "Whitefield",
            "addressRegion": "Bengaluru, Karnataka",
            "postalCode": "560066",
            "addressCountry": "IN"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 12.9698,
            "longitude": 77.7500
          },
          "areaServed": [
            "Whitefield",
            "EPIP Zone",
            "ITPL",
            "Brookefield",
            "Kadugodi",
            "Hoodi",
            "Marathahalli",
            "Mahadevapura"
          ],
          "priceRange": "₹99 - ₹5000",
          "openingHoursSpecification": [
            { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], "opens": "10:00", "closes": "19:00" }
          ],
          "description": "Corporate printing & gifting in Whitefield, Bangalore. 22+ years, own production unit on Borewell Road. Onboarding kits, awards, apparel, brochures, signage, packaging.",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "50",
            "bestRating": "5"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Printfield Printing Services",
            "itemListElement": [
              {"@type": "OfferCatalog", "name": "Custom T-Shirt Printing", "itemListElement": [
                {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "DTF Printing"}},
                {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Screen Printing"}},
                {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Embroidery"}}
              ]},
              {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Corporate Gifts & Merchandise"}},
              {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Signage & Banners"}},
              {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Business Cards & Stationery"}},
              {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Custom Trophies & Awards"}}
            ]
          }
        })}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {"@type": "Question", "name": "Do you offer custom t-shirt printing in Whitefield?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, Printfield is located in Whitefield, Bengaluru 560066. We offer DTF printing, screen printing, and embroidery on t-shirts, hoodies, polo shirts, and caps. Orders start from just 10 pieces."}},
          {"@type": "Question", "name": "What are your printing prices?", "acceptedAnswer": {"@type": "Answer", "text": "Our custom t-shirt printing starts at ₹99 per piece for screen printing (50+ pieces). DTF printing starts at ₹149 per print. Corporate gifts, signage, and business cards have separate pricing. Contact us for a custom quote."}},
          {"@type": "Question", "name": "Do you deliver to ITPL and Marathahalli?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, we deliver to Whitefield, ITPL, Brookefield, Marathahalli, Mahadevapura, and all nearby areas in Bengaluru. Delivery is usually within 1-2 days for local orders."}},
          {"@type": "Question", "name": "What printing methods do you offer?", "acceptedAnswer": {"@type": "Answer", "text": "We offer DTF (Direct-to-Film) printing for full-color designs, screen printing for bulk orders, and embroidery for premium corporate wear. We also do sublimation printing for mugs and gifts."}},
          {"@type": "Question", "name": "Do you provide corporate gifting solutions?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, we are a leading corporate gifting company in Whitefield. We offer custom mugs, trophies, plaques, pens, bags, t-shirts, and more with your company logo. GST invoice provided for all orders."}},
          {"@type": "Question", "name": "What is the minimum order quantity?", "acceptedAnswer": {"@type": "Answer", "text": "For DTF printing, minimum order is 10 pieces. For screen printing, minimum is 50 pieces. For corporate gifts and trophies, there is no minimum — even single pieces are welcome."}}
        ]
      }) }} />
      <div ref={containerRef} className="bg-white text-slate-900 min-h-screen selection:bg-purple-500 selection:text-white font-sans overflow-hidden">
        
        {/* MARQUEE SECTION */}
        <section className="py-6 border-b border-slate-100 bg-slate-50/50 overflow-hidden flex whitespace-nowrap">
          <motion.div
            animate={{ x: [0, -1035] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex gap-16 items-center text-xl md:text-2xl font-black uppercase tracking-widest text-slate-400"
          >
            <span>Bespoke Customization</span>
            <Star className="w-5 h-5 text-purple-600" />
            <span>Priority Fulfillment</span>
            <Star className="w-5 h-5 text-fuchsia-600" />
            <span>Volume Pricing</span>
            <Star className="w-5 h-5 text-pink-600" />
            <span>Premium Finishes</span>
            <Star className="w-5 h-5 text-purple-600" />
            <span>Brand Consistency</span>
            <Star className="w-5 h-5 text-fuchsia-600" />
            <span>Eco-Friendly</span>
            <Star className="w-5 h-5 text-pink-600" />
            <span>Bespoke Customization</span>
          </motion.div>
        </section>

        {/* HERO SECTION */}
        <section className="relative min-h-[calc(100vh-140px)] flex items-center justify-start overflow-hidden py-20">
          {/* Full Screen Background Image with Sophisticated Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              referrerPolicy="no-referrer"
              src="/api/proxy-image/1La7Wt1--ZaCPxI45PaIyuU0mQJCEEPMn?w=1376" 
              alt="You Think It, We Ink It Brand Presentation Backdrop" 
              className="w-full h-full object-cover object-center lg:object-[center_right]"
              fetchPriority="high"
              width="1920"
              height="1080"
            />
            {/* Elegant glass gradient overlay: solid white on the left (for text), transparent on the right (for image details) */}
            <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-white via-white/95 to-transparent md:from-white/95 md:via-white/85 md:to-transparent"></div>
            {/* Subtle radial light effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(147,51,234,0.03),transparent_50%)]"></div>
          </div>

          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-8 flex flex-col items-center text-center md:items-start md:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-200/80 bg-white/90 backdrop-blur-md mb-8 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping absolute"></span>
              <span className="w-2 h-2 rounded-full bg-purple-600 relative"></span>
              <span className="text-sm font-semibold tracking-wide uppercase text-purple-900">Premium Print & Packaging</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[10vw] md:text-[6vw] lg:text-[5.5rem] font-black tracking-tighter leading-[0.85] uppercase text-slate-900 max-w-3xl"
            >
              You think it. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 italic pr-4">
                We ink it.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 text-lg md:text-xl text-slate-700 max-w-xl font-normal leading-relaxed"
            >
              Turn your imagination into tactile reality. Premium printing and custom packaging that commands attention.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-wrap gap-4 sm:gap-6"
            >
              <Link to="/categories" className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-slate-900 text-white font-bold uppercase tracking-wider rounded-full overflow-hidden shadow-lg shadow-slate-900/10 hover:shadow-purple-500/25 transition-all">
                <span className="relative z-10 flex items-center gap-2">
                  Explore Catalog <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-purple-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
              </Link>
              <a
                href="https://wa.me/919606371222?text=Hi%20Printfield%2C%20I%27d%20like%20a%20quote%20for%20custom%20printing."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 sm:px-8 sm:py-4 bg-green-500 hover:bg-green-600 text-white font-bold uppercase tracking-wider rounded-full transition-all shadow-lg shadow-green-500/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Get a Quote
              </a>
              <a
                href="tel:+919606371222"
                className="px-6 py-3 sm:px-8 sm:py-4 border-2 border-slate-300 hover:border-purple-600 text-slate-900 hover:text-purple-600 font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                Call Now
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* TRUST STRIP */}
        <section className="bg-slate-900 text-white py-10 md:py-14 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { value: "22+", label: "Years Experience", sub: "Serving Bengaluru since 2004" },
                { value: "Own Unit", label: "Production Facility", sub: "Borewell Road, Whitefield" },
                { value: "10K+", label: "Orders Delivered", sub: "Corporate & individual" },
                { value: "4.8★", label: "Customer Rating", sub: "150+ verified reviews" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-black text-purple-400 mb-1">{stat.value}</div>
                  <div className="text-sm font-bold uppercase tracking-wider text-white/90">{stat.label}</div>
                  <div className="text-xs text-white/50 mt-1">{stat.sub}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* BENTO GRID CATEGORIES */}
        <section className="py-16 md:py-32 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase mb-4 text-slate-900 leading-[0.9]">
                Core <br />
                <span className="text-purple-600">Categories</span>
              </h2>
              <p className="text-slate-600 text-lg md:text-xl max-w-xl">
                Discover our specialized print solutions tailored perfectly across our premium product categories.
              </p>
            </div>
            <Link to="/categories" className="group flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-slate-900 hover:text-purple-600 transition-colors shrink-0">
              <span>View All</span>
              <div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center group-hover:border-purple-600 group-hover:bg-purple-50 transition-all">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]">
            {[
              {
                id: "promotional-materials",
                name: "Promotional Materials",
                displayName: "PROMOTIONAL MATERIALS",
                image: "/api/proxy-image/1v3a0JHejsM-7YXyIyyQCqghoV-YLIv4O?w=800",
                gridClass: "md:col-span-2"
              },
              {
                id: "apparel",
                name: "Corporate Apparel",
                displayName: "CORPORATE APPAREL",
                image: "/api/proxy-image/16ZtTAEAnOgcY4FoheVizu_oiHSlwNDoK?w=600",
                gridClass: "md:col-span-1 md:row-span-2 h-full min-h-[400px] md:min-h-full"
              },
              {
                id: "drinkware",
                name: "Drinkware & Sippers",
                displayName: "DRINKWARE & SIPPERS",
                image: "/api/proxy-image/1To3eajzVf05oiEfAkarRx_H4_Sn98neU?w=800",
                gridClass: "md:col-span-1"
              },
              {
                id: "business-stationery",
                name: "Business Stationery",
                displayName: "BUSINESS STATIONERY",
                image: "/api/proxy-image/1omKI3woeT0iM3E34ApSsp5WwGPqxSCfQ?w=800",
                gridClass: "md:col-span-1"
              }
            ].map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`relative group rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-2xl hover:border-purple-400/60 transition-all duration-500 ${cat.gridClass}`}
              >
                <div className="absolute inset-0 z-0">
                  <img 
                    referrerPolicy="no-referrer" 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-full h-full object-cover object-center opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                    loading="lazy"
                    width="800"
                    height="600"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/80"></div>
                </div>
                <Link to={`/category/${cat.id}`} className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                  <div>
                    <span className="text-white/95 text-xs font-bold tracking-wider uppercase bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-md drop-shadow-sm">
                      {cat.name}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight uppercase group-hover:translate-x-2 transition-transform duration-500 text-white drop-shadow-md leading-none">
                      {cat.displayName}
                    </h3>
                    <p className="text-white/80 text-xs mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Explore collection &rarr;
                    </p>
                  </div>
                </Link>
                {/* Abstract hover background overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-fuchsia-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-overlay"></div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* BESTSELLERS GALLERY */}
        <section className="py-16 md:py-24 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6 text-slate-900">Trending <br/> <span className="text-slate-400">Now</span></h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full"></div>
            </div>
            <Link to="/categories" className="text-lg font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1 hover:text-purple-600 hover:border-purple-600 transition-colors">
              View All Products &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-100 animate-pulse rounded-2xl h-[450px]"></div>
              ))
            ) : (
              products.slice(0, 6).map((product, i) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.7, delay: i * 0.1 }}
                  className="group"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* BROWSE BY CATEGORY */}
        <section className="py-16 md:py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
                Browse by <span className="text-purple-600">Category</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Explore our full range of custom printing services across 13+ categories.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { name: "Drinkware", slug: "Drinkware", icon: "🥤" },
                { name: "Corporate Gifts", slug: "Corporate%20Gifts", icon: "🎁" },
                { name: "Business Stationery", slug: "Business%20Stationery", icon: "📋" },
                { name: "Apparel", slug: "Apparel", icon: "👕" },
                { name: "Signages & Banners", slug: "Signages%20%26%20Banners", icon: "🪧" },
                { name: "Personalised Gifts", slug: "Personalised%20Gifts", icon: "✨" },
                { name: "Photo Prints", slug: "Photo%20Prints", icon: "📷" },
                { name: "Photo Mugs", slug: "Photo%20Mugs", icon: "☕" },
                { name: "Rubber Stamps", slug: "Rubber%20Stamps", icon: "🔴" },
                { name: "Trophies", slug: "Trophies", icon: "🏆" },
                { name: "Menu Covers", slug: "Menu%20Covers", icon: "📖" },
                { name: "Printing Service", slug: "Printing%20Service", icon: "🖨️" },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  className="group p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-all text-center"
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">{cat.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CATERED BY INDUSTRY SHOWROOM */}
        <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
              <div>
                <span className="text-purple-600 font-bold uppercase tracking-widest text-xs">Tailored Print Solutions</span>
                <h2 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase mt-2 mb-4 text-slate-900 leading-[0.9]">
                  Catered <br />
                  <span className="text-slate-400">By Industry</span>
                </h2>
                <p className="text-slate-600 text-lg md:text-xl max-w-xl">
                  Explore custom merchandise kits, stationery products, and brand solutions specialized for your sector's standards.
                </p>
              </div>
            </div>

            {/* Mobile Horizontal Carousel */}
            <div className="lg:hidden flex overflow-x-auto gap-3 pb-6 mb-4 scrollbar-none snap-x">
              {INDUSTRIES.map((industry) => {
                const isActive = selectedIndustry?.id === industry.id || (!selectedIndustry && INDUSTRIES[0].id === industry.id);
                const activeInd = selectedIndustry || INDUSTRIES[0];
                return (
                  <button
                    key={industry.id}
                    onClick={() => {
                      const found = INDUSTRIES.find(i => i.id === industry.id);
                      if (found) setSelectedIndustry(found);
                      setSubmittedId(null);
                      setRfqError("");
                    }}
                    className={`snap-center shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-300 ${
                      isActive
                        ? "bg-purple-600 text-white border-purple-600 shadow-md"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {getIndustryIcon(industry.icon)}
                    <span>{industry.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Vertical Selection List (Desktop Only) */}
              <div className="hidden lg:flex lg:col-span-4 flex-col gap-3 max-h-[640px] overflow-y-auto pr-2 custom-scrollbar">
                {INDUSTRIES.map((industry) => {
                  const isActive = selectedIndustry?.id === industry.id || (!selectedIndustry && INDUSTRIES[0].id === industry.id);
                  return (
                    <button
                      key={industry.id}
                      onClick={() => {
                        setSelectedIndustry(industry);
                        setSubmittedId(null);
                        setRfqError("");
                      }}
                      className={`w-full p-5 rounded-2xl border text-left transition-all duration-350 flex items-center gap-4 group relative overflow-hidden ${
                        isActive
                          ? "bg-white border-purple-500/80 shadow-md ring-1 ring-purple-100"
                          : "bg-white/40 border-slate-200/80 hover:bg-white hover:border-slate-300/80"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-600 rounded-r" />
                      )}
                      
                      <div className={`p-3 rounded-xl border transition-colors ${
                        isActive 
                          ? "bg-purple-50 border-purple-100 text-purple-600" 
                          : "bg-slate-50 border-slate-100 text-slate-500 group-hover:bg-purple-50/50 group-hover:text-purple-600 group-hover:border-purple-50"
                      }`}>
                        {getIndustryIcon(industry.icon)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-bold uppercase tracking-wide truncate ${
                            isActive ? "text-purple-700" : "text-slate-800"
                          }`}>
                            {industry.name}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 shrink-0 bg-slate-100 px-2 py-0.5 rounded">
                            {industry.id === "mnc" ? "MNC" : industry.id === "itbc" ? "ITBC" : "Kit"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
                          {industry.tagline}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Premium Active Showroom Panel */}
              <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[640px]">
                {(() => {
                  const activeInd = selectedIndustry || INDUSTRIES[0];
                  return (
                    <>
                      {/* Active Panel Banner Image */}
                      <div className="h-64 relative w-full overflow-hidden shrink-0">
                        <img
                          referrerPolicy="no-referrer"
                          src={activeInd.image}
                          alt={activeInd.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
                        
                        <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between gap-4">
                          <div>
                            <span className="text-purple-400 text-xs font-bold uppercase tracking-wider bg-purple-950/45 backdrop-blur-sm px-3 py-1 rounded border border-purple-500/20">
                              Selected Industry Solution
                            </span>
                            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mt-2 leading-none">
                              {activeInd.name}
                            </h3>
                            <p className="text-white/80 text-sm mt-1.5 font-medium max-w-xl">
                              {activeInd.tagline}
                            </p>
                          </div>
                          
                          <div className="hidden sm:block p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white shadow-lg shrink-0">
                            {getIndustryIcon(activeInd.icon)}
                          </div>
                        </div>
                      </div>

                      {/* Content Split: Left items, Right form */}
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 bg-white">
                        
                        {/* Kit Blueprint Column */}
                        <div className="flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2.5 mb-5">
                              <div className="w-1.5 h-6 bg-purple-600 rounded" />
                              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                Recommended Brand Blueprint:
                              </h4>
                            </div>
                            
                            <p className="text-xs text-slate-500 leading-relaxed mb-6">
                              This premium curation represents the industry standard for <strong>{String(activeInd.name || '').toLowerCase()}</strong> to maintain consistent visual guidelines and utility.
                            </p>

                            <div className="space-y-4">
                              {activeInd.kitItems.map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-start group">
                                  <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800 leading-snug">{item.name}</p>
                                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{item.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium flex items-center gap-2">
                            <span>💡 Custom options: Full Pantone matching & variable data.</span>
                          </div>
                        </div>

                        {/* Fast RFQ / Consultation Column */}
                        <div className="p-6 bg-slate-50/55 rounded-2xl border border-slate-200/50 flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-1">
                              Request Package Quote
                            </h4>
                            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
                              Get pricing, free physical/digital mockups, and bulk discount structures for the <strong>{activeInd.kitTitle}</strong>.
                            </p>

                            {submittedId ? (
                              <div className="py-10 px-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center flex flex-col items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-3 shadow">
                                  <Check className="w-6 h-6 stroke-[3]" />
                                </div>
                                <h5 className="text-sm font-bold text-emerald-900 uppercase tracking-tight mb-1">
                                  Proposal Received
                                </h5>
                                <p className="text-[11px] text-emerald-700 max-w-xs mb-3 leading-relaxed">
                                  Your request has been filed. Our dedicated manager will contact you in under 2 hours.
                                </p>
                                <span className="text-[9px] font-bold font-mono uppercase text-emerald-600 bg-white border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                                  REF: {submittedId.split('-')[0].toUpperCase()}
                                </span>
                              </div>
                            ) : (
                              <form onSubmit={handleIndustryRfq} className="space-y-3.5">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                    Your Name *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={rfqName}
                                    onChange={(e) => setRfqName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-500 focus:outline-none bg-white transition-colors"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                      Phone *
                                    </label>
                                    <input
                                      type="tel"
                                      required
                                      value={rfqPhone}
                                      onChange={(e) => setRfqPhone(e.target.value)}
                                      placeholder="Phone number"
                                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-500 focus:outline-none bg-white transition-colors"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                      Email *
                                    </label>
                                    <input
                                      type="email"
                                      required
                                      value={rfqEmail}
                                      onChange={(e) => setRfqEmail(e.target.value)}
                                      placeholder="Email address"
                                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-500 focus:outline-none bg-white transition-colors"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                    Company Name
                                  </label>
                                  <input
                                    type="text"
                                    value={rfqCompany}
                                    onChange={(e) => setRfqCompany(e.target.value)}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-500 focus:outline-none bg-white transition-colors"
                                  />
                                </div>

                                {rfqError && (
                                  <p className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100">
                                    {rfqError}
                                  </p>
                                )}

                                <button
                                  type="submit"
                                  disabled={isSubmitting}
                                  className="w-full bg-slate-900 hover:bg-purple-600 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
                                >
                                  {isSubmitting ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Processing...</span>
                                    </>
                                  ) : (
                                    <span>Submit Consultation &rarr;</span>
                                  )}
                                </button>
                              </form>
                            )}
                          </div>

                          {!submittedId && (
                            <p className="text-[9px] text-slate-400 text-center mt-3">
                              🛡️ HIPAA/GDPR Compliant. Custom specifications processed instantly.
                            </p>
                          )}
                        </div>

                      </div>
                    </>
                  );
                })()}
              </div>

            </div>
          </div>
        </section>

        {/* TESTIMONIALS & TRUST SECTION */}
        <section className="py-16 md:py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
                Premium Printing, <span className="text-purple-600">Delivered Fast</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                From business cards to trophies, we deliver premium printing solutions across Whitefield and Bangalore.
              </p>
            </div>

            {/* Trust Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { stat: "9+", label: "Years in Business" },
                { stat: "3-5", label: "Day Turnaround" },
                { stat: "0", label: "Upfront Payment Required" },
              ].map((s, i) => (
                <div key={i} className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-3xl md:text-4xl font-black text-purple-600 mb-2">{s.stat}</div>
                  <div className="text-sm font-medium text-slate-600">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AREAS WE SERVE */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-4">
                Custom Printing <span className="text-purple-600">Near You</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                We deliver to Whitefield and all nearby areas in Bengaluru. Find your location below.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { name: "Whitefield", slug: "whitefield", desc: "Borewell Road, ITPL Road" },
                { name: "ITPL", slug: "itpl", desc: "Tech Park, Wipro SEZ" },
                { name: "Brookefield", slug: "brookefield", desc: "Main Road, AECS Layout" },
                { name: "Marathahalli", slug: "marathahalli", desc: "ORR, Silva Section" },
              ].map((loc) => (
                <Link
                  key={loc.slug}
                  to={`/printing-${loc.slug}`}
                  className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-all text-center"
                >
                  <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{loc.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{loc.desc}</p>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/custom-printing" className="text-purple-600 font-semibold hover:text-purple-700 inline-flex items-center gap-1">
                View All Areas <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-black text-slate-900 text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                { q: "Do you offer custom t-shirt printing in Whitefield?", a: "Yes, Printfield is located in Whitefield, Bengaluru 560066. We offer DTF printing, screen printing, and embroidery on t-shirts, hoodies, polo shirts, and caps. Orders start from just 10 pieces." },
                { q: "What are your printing prices?", a: "Our custom t-shirt printing starts at ₹99 per piece for screen printing (50+ pieces). DTF printing starts at ₹149 per print. Corporate gifts, signage, and business cards have separate pricing. Contact us for a custom quote." },
                { q: "Do you deliver to ITPL and Marathahalli?", a: "Yes, we deliver to Whitefield, ITPL, Brookefield, Marathahalli, Mahadevapura, and all nearby areas in Bengaluru. Delivery is usually within 1-2 days for local orders." },
                { q: "What printing methods do you offer?", a: "We offer DTF (Direct-to-Film) printing for full-color designs, screen printing for bulk orders, and embroidery for premium corporate wear. We also do sublimation printing for mugs and gifts." },
                { q: "Do you provide corporate gifting solutions?", a: "Yes, we are a leading corporate gifting company in Whitefield. We offer custom mugs, trophies, plaques, pens, bags, t-shirts, and more with your company logo. GST invoice provided for all orders." },
                { q: "What is the minimum order quantity?", a: "For DTF printing, minimum order is 10 pieces. For screen printing, minimum is 50 pieces. For corporate gifts and trophies, there is no minimum — even single pieces are welcome." },
              ].map((faq, idx) => (
                <details key={idx} className="group bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-slate-900 hover:text-purple-600 transition-colors">
                    {faq.q}
                    <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <div className="px-5 pb-5 text-slate-600 leading-relaxed">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* GUARANTEE SECTION */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <h2 className="text-3xl font-black text-slate-900">100% Quality Guarantee</h2>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              We stand behind every product we print. If you're not satisfied with the quality, we'll make it right. 
              No upfront payment required. Design verification before printing.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/faq" className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-full hover:bg-purple-600 transition-colors">
                View FAQs
              </Link>
              <a href="tel:+919606371222" className="px-6 py-3 border-2 border-slate-300 text-slate-900 font-semibold rounded-full hover:border-purple-600 hover:text-purple-600 transition-colors">
                Call +91 9606371222
              </a>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
