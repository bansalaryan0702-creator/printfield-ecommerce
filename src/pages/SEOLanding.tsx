import React from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/src/components/layout/Layout";
import { ArrowRight, CheckCircle2, TrendingUp, Zap, ShieldCheck, Printer, Paintbrush, Truck } from "lucide-react";
import { motion } from "motion/react";
import { ProductCard } from "@/src/components/ui/ProductCard";
import { useProducts } from "../hooks/useProducts";
import { Categories } from "@/src/data/products";
import { SEO } from "@/src/components/SEO";

export const SEOLanding: React.FC = () => {
  const { products } = useProducts();
  // Get a mix of products to show in the featured section
  const featuredProducts = products.slice(0, 4);

  // Generate structured data for local business / organization
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "PrintingService",
    "name": "Printfield - Custom Printing Services Whitefield Bangalore",
    "description": "Premium custom printing services in Whitefield, Bengaluru 560066. Trophies, corporate gifts, apparel, signage, banners & promotional products with fast delivery.",
    "url": typeof window !== 'undefined' ? window.location.origin + "/custom-printing" : "https://printfield.shop/custom-printing",
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
    "telephone": "+919606371222",
    "areaServed": ["Whitefield", "Brookefield", "Marathahalli", "ITPL", "Mahadevapura", "Bengaluru"],
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  });

  return (
    <Layout>
      <SEO 
        title="Best Printing Services in Whitefield Bangalore | Custom Printing | Printfield" 
        description="Premium custom printing services in Whitefield, Bengaluru 560066. Trophies, corporate gifts, apparel, signage, banners & promotional products. Fast delivery within 5km. Order online."
        canonicalUrl="/custom-printing"
        schema={schema}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-24 pb-32">
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500 via-slate-900 to-slate-900"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                Custom Printing Services <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  For Your Business
                </span>
              </h1>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Elevate your brand with premium custom merchandise, business cards, and corporate gifts. Fast turnaround, exceptional quality, and seamless online design tools.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/categories"
                  className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                >
                  Start Creating <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/contact"
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  Get a Bulk Quote
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Proposition / Features */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose Our Print On Demand Services?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">We combine cutting-edge printing technology with premium materials to deliver merchandise that makes your brand stand out.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-600">
                <Printer className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">State-of-the-art Printing</h3>
              <p className="text-slate-600 leading-relaxed">Direct-to-garment (DTG), screen printing, and premium embroidery ensuring vibrant colors that last.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center">
              <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-pink-600">
                <Paintbrush className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Free Online Design Studio</h3>
              <p className="text-slate-600 leading-relaxed">No design skills? No problem. Use our intuitive 3D design studio to create pixel-perfect merchandise instantly.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                <Truck className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Fast & Reliable Shipping</h3>
              <p className="text-slate-600 leading-relaxed">Express production times and tracked shipping options to get your gear exactly when you need it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Trending Custom Merchandise</h2>
              <p className="text-lg text-slate-600">Our most popular items for business branding and events.</p>
            </div>
            <Link to="/categories" className="hidden md:flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700">
              View All Catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/categories" className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700">
              View All Catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SEO Keyword Content Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg prose-slate max-w-none">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Your Trusted Partner for Custom Business Merchandise</h2>
            <p className="text-slate-600 mb-6">
              When it comes to building a recognizable brand, high-quality promotional products and custom business merchandise are essential. Whether you are looking for custom t-shirt printing for your next corporate retreat, embroidered polos for your sales team, or premium business cards that leave a lasting impression, we are your one-stop-shop for professional printing services.
            </p>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-4 mt-10">Comprehensive Print On Demand Catalog</h3>
            <p className="text-slate-600 mb-6">
              Our extensive catalog features hundreds of customizable products. From custom apparel including hoodies, hats, and activewear, to promotional items like custom mugs, water bottles, and tech accessories. We source our blanks from industry-leading brands to guarantee comfort, durability, and a premium feel.
            </p>
            
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 list-none pl-0">
              {[
                "Corporate Apparel & Uniforms",
                "Trade Show Giveaways",
                "Custom Packaging & Mailers",
                "Employee Onboarding Kits",
                "Client Appreciation Gifts",
                "Event Merch & Signage"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <h3 className="text-2xl font-bold text-slate-900 mb-4 mt-10">Seamless Integration & Bulk Ordering</h3>
            <p className="text-slate-600">
              Need to order for a team of 10 or a company of 10,000? Our scalable printing infrastructure handles bulk orders with ease, offering significant volume discounts. Use our advanced 3D mockup generator to visualize your logo on any product before placing an order, ensuring your brand guidelines are strictly adhered to.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-purple-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-pink-600 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to bring your brand to life?</h2>
          <p className="text-xl text-purple-200 mb-10 max-w-2xl mx-auto">
            Join thousands of businesses who trust us with their custom printing and promotional product needs.
          </p>
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-900 rounded-full font-bold text-lg hover:bg-slate-100 transition-colors shadow-xl shadow-purple-900/50"
          >
            Start Designing Now <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </Layout>
  );
};
