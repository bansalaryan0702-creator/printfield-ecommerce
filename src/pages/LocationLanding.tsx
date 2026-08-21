import React from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "@/src/components/layout/Layout";
import { ArrowRight, CheckCircle2, MapPin, Phone, Clock, Truck, Star, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { ProductCard } from "@/src/components/ui/ProductCard";
import { useProducts } from "../hooks/useProducts";
import { SEO } from "@/src/components/SEO";

const LOCATIONS: Record<string, {
  name: string;
  area: string;
  city: string;
  pincode: string;
  landmark: string;
  metaTitle: string;
  metaDescription: string;
  heroHeading: string;
  heroSubheading: string;
  nearbyAreas: string[];
  deliveryTime: string;
  mapQuery: string;
  latitude: number;
  longitude: number;
  localKeywords: string[];
  localContent: {
    intro: string;
    services: string[];
    whyUs: string[];
  };
}> = {
  whitefield: {
    name: "Whitefield",
    area: "Whitefield",
    city: "Bengaluru",
    pincode: "560066",
    landmark: "Opp. Chaitanya Swojas, Borewell Road",
    metaTitle: "Custom T-Shirt Printing in Whitefield Bangalore | Printfield",
    metaDescription: "Best custom t-shirt printing, corporate gifting & promotional products in Whitefield, Bengaluru 560066. Fast delivery, bulk orders, free design studio. Order online.",
    heroHeading: "Custom Printing Services in Whitefield",
    heroSubheading: "Premium t-shirt printing, corporate gifts, signage & promotional products. Delivered to your doorstep in Whitefield, Bengaluru.",
    nearbyAreas: ["Marathahalli", "Brookefield", "ITPL", "Mahadevapura", "Kadugodi"],
    deliveryTime: "1-2 days",
    mapQuery: "Printfield+Whitefield+Bengaluru",
    latitude: 12.9698,
    longitude: 77.7500,
    localKeywords: ["custom tshirt printing whitefield", "printing services whitefield bangalore", "corporate gifts whitefield", "bulk tshirt printing whitefield bengaluru", "signage whitefield"],
    localContent: {
      intro: "Printfield is Whitefield's most trusted custom printing shop, located on Borewell Road. We serve startups, corporates, and individuals with high-quality t-shirt printing, embroidery, corporate gifting, signage, and promotional merchandise. With over 12 years of experience, we deliver to all areas within Whitefield including ITPL, Brookefield, and Marathahalli.",
      services: ["Custom T-Shirt Printing (DTF, Screen Print, Embroidery)", "Corporate Gifts & Merchandise", "Signage, Banners & Standees", "Business Cards & Stationery", "Promotional Products", "Custom Hoodies, Caps & Apparels"],
      whyUs: ["Same-day design approval", "Bulk orders from 10 pieces", "Free online 3D design tool", "Delivery within Whitefield in 1-2 days", "GST invoice for all orders", "12+ years serving Bengaluru"]
    }
  },
  itpl: {
    name: "ITPL",
    area: "ITPL / Whitefield",
    city: "Bengaluru",
    pincode: "560048",
    landmark: "Near ITPL Main Road",
    metaTitle: "Custom T-Shirt Printing near ITPL Bangalore | Printfield",
    metaDescription: "Custom t-shirt printing & corporate gifting near ITPL, Whitefield, Bengaluru. Fast delivery to ITPL Tech Park, Wipro SEZ, and surrounding areas. Bulk orders welcome.",
    heroHeading: "Custom Printing Services near ITPL",
    heroSubheading: "Trusted by 200+ companies in ITPL Tech Park for custom apparel, corporate gifts & branded merchandise.",
    nearbyAreas: ["Whitefield", "Brookefield", "Marathahalli", "Kadugodi", "Hope Farm"],
    deliveryTime: "1-2 days",
    mapQuery: "Printfield+ITPL+Whitefield+Bengaluru",
    latitude: 12.9850,
    longitude: 77.7460,
    localKeywords: ["custom tshirt printing ITPL", "corporate printing ITPL bangalore", "bulk tshirt ITPL whitefield", "promotional products ITPL tech park"],
    localContent: {
      intro: "Located just minutes from ITPL Tech Park, Printfield is the go-to printing partner for companies in and around ITPL. From startup launch merchandise to corporate uniform printing, we handle orders of all sizes with quick turnaround. Our team understands the fast-paced needs of IT companies and delivers consistently.",
      services: ["Corporate Uniform Printing", "Event T-Shirts & Merchandise", "Branded Corporate Gifts", "Office Signage & Wayfinding", "Business Cards & Letterheads", "Custom Hoodies & Jackets"],
      whyUs: ["5-minute drive from ITPL", "Express delivery for urgent orders", "Volume discounts for 100+ pieces", "Dedicated account manager for corporates", "Free design consultation", "Trusted by 200+ IT companies"]
    }
  },
  brookefield: {
    name: "Brookefield",
    area: "Brookefield",
    city: "Bengaluru",
    pincode: "560037",
    landmark: "Near Brookefield Main Road",
    metaTitle: "Custom T-Shirt Printing in Brookefield Bangalore | Printfield",
    metaDescription: "Best custom t-shirt printing services in Brookefield, Bengaluru. Corporate gifting, promotional products & bulk apparel printing. Fast delivery to Brookefield & nearby areas.",
    heroHeading: "Custom Printing Services in Brookefield",
    heroSubheading: "Your neighborhood printing partner for custom t-shirts, corporate gifts, banners & promotional products in Brookefield, Bengaluru.",
    nearbyAreas: ["Whitefield", "Marathahalli", "Koramangala", "HSR Layout", "Bellandur"],
    deliveryTime: "1-2 days",
    mapQuery: "Printfield+Brookefield+Bengaluru",
    latitude: 12.9670,
    longitude: 77.7450,
    localKeywords: ["custom tshirt printing brookefield", "printing services brookefield bangalore", "corporate gifts brookefield", "bulk tshirt brookefield bengaluru"],
    localContent: {
      intro: "Printfield serves the Brookefield community with premium custom printing services. Whether you need t-shirts for a college fest, corporate uniforms for your startup, or promotional giveaways for an event, we've got you covered. Located in Whitefield, we deliver to all parts of Brookefield within 1-2 days.",
      services: ["Custom T-Shirt & Apparel Printing", "Corporate Gifting Solutions", "Event & Promotional Products", "Signage & Banners", "Business Cards & Flyers", "Custom Caps & Accessories"],
      whyUs: ["Serving Brookefield since 2012", "Free design mockups before printing", "Starting at just ₹99 per piece", "Same-day dispatch for ready designs", "Pickup or delivery options", "100% quality guarantee"]
    }
  },
  marathahalli: {
    name: "Marathahalli",
    area: "Marathahalli",
    city: "Bengaluru",
    pincode: "560037",
    landmark: "Near Marathahalli Bridge",
    metaTitle: "Custom T-Shirt Printing in Marathahalli Bangalore | Printfield",
    metaDescription: "Custom t-shirt printing, corporate gifting & promotional products in Marathahalli, Bengaluru. Bulk orders, fast delivery, free design support. Order online now.",
    heroHeading: "Custom Printing Services in Marathahalli",
    heroSubheading: "Professional printing services for corporates, startups & events in Marathahalli, Bengaluru. Quality prints, fast turnaround.",
    nearbyAreas: ["Whitefield", "Brookefield", "Bellandur", "Sarjapur Road", "ORR"],
    deliveryTime: "1-2 days",
    mapQuery: "Printfield+Marathahalli+Bengaluru",
    latitude: 12.9560,
    longitude: 77.7010,
    localKeywords: ["custom tshirt printing marathahalli", "printing services marathahalli bangalore", "corporate gifts marathahalli", "bulk tshirt marathahalli bengaluru"],
    localContent: {
      intro: "Printfield brings premium custom printing to Marathahalli. As one of Bengaluru's busiest commercial hubs, Marathahalli demands fast, reliable printing services — and that's exactly what we deliver. From tech park companies to local businesses and colleges, we serve everyone with the same commitment to quality.",
      services: ["Corporate T-Shirt Printing", "Event & Promotional Merchandise", "Custom Hoodies & Apparels", "Signage, Flex & Standees", "Business Cards & Stationery", "Custom Mugs, Bottles & Gifts"],
      whyUs: ["Quick delivery to Marathahalli", "Trusted by 500+ businesses", "Online design studio — design from home", "Bulk discounts from 10 pieces", "Premium print quality guaranteed", "GST invoice for all orders"]
    }
  }
};

export const LocationLanding: React.FC = () => {
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const location = LOCATIONS[locationSlug || "whitefield"];
  const { products } = useProducts();
  const featuredProducts = products.slice(0, 4);

  if (!location) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Location Not Found</h1>
            <Link to="/" className="text-purple-600 hover:underline">Go back home</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Printfield - Custom Printing ${location.area}`,
    "description": location.metaDescription,
    "url": typeof window !== 'undefined' ? window.location.href : `https://printfieldonline.com/printing-${locationSlug}`,
    "image": "https://printfieldonline.com/logo.png",
    "telephone": "+919606371222",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": `No 96, Mini Villa, ${location.landmark}`,
      "addressLocality": location.area,
      "addressRegion": location.city,
      "postalCode": location.pincode,
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": location.latitude,
      "longitude": location.longitude
    },
    "areaServed": [location.area, ...location.nearbyAreas],
    "priceRange": "₹99 - ₹5000",
    "openingHours": "Mo-Sa 10:00-19:00",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "150"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Custom Printing Services",
      "itemListElement": [
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Custom T-Shirt Printing"}},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Corporate Gifting"}},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Signage & Banners"}},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Embroidery Printing"}}
      ]
    }
  });

  const breadcrumbs = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://printfieldonline.com/"},
      {"@type": "ListItem", "position": 2, "name": `Printing in ${location.area}`, "item": `https://printfieldonline.com/printing-${locationSlug}`}
    ]
  });

  return (
    <Layout>
      <SEO
        title={location.metaTitle}
        description={location.metaDescription}
        canonicalUrl={`/printing-${locationSlug}`}
        schema={schema}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-24 pb-32">
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500 via-slate-900 to-slate-900"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-purple-400" />
                <span className="text-purple-300 font-medium">{location.area}, {location.city}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                {location.heroHeading}
              </h1>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                {location.heroSubheading}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/categories"
                  className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                >
                  Start Designing <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="tel:+919606371222"
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="h-5 w-5" /> Call Now
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-6 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm text-slate-600">
            <div className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> 4.8 Rating (150+ Reviews)</div>
            <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-purple-500" /> Delivery in {location.deliveryTime}</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-500" /> 100% Quality Guarantee</div>
            <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-500" /> Same-day Design Approval</div>
          </div>
        </div>
      </section>

      {/* Local Content */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Custom Printing in {location.area}
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">{location.localContent.intro}</p>
              <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
                <MapPin className="h-4 w-4" />
                <span>Serving: {location.area}, {location.nearbyAreas.join(", ")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Truck className="h-4 w-4" />
                <span>Delivery: Within {location.area} in {location.deliveryTime}</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Our Services</h3>
              <ul className="space-y-3">
                {location.localContent.services.map((service, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700">{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">
            Why {location.area} Businesses Choose Printfield
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {location.localContent.whyUs.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-3 text-purple-600 font-bold text-sm">
                  {idx + 1}
                </div>
                <p className="text-slate-700 font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">
            Popular Products for {location.area} Businesses
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/categories" className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700">
              View Full Catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Areas We Serve */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Areas We Serve near {location.area}
          </h2>
          <p className="text-slate-600 mb-8">
            We deliver to {location.area} and all nearby areas in Bengaluru. Whether you are in a tech park, residential area, or commercial complex, we've got you covered.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[location.area, ...location.nearbyAreas].map((area, idx) => (
              <Link
                key={idx}
                to={`/printing-${area.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-5 py-2.5 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 rounded-full font-medium transition-colors text-sm"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Google Map */}
      <section className="h-96 bg-slate-200">
        <iframe
          title={`Printfield ${location.area}`}
          src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.5!2d${location.longitude}!3d${location.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDU4JzExLjMiTiA3N8KwNDQnNTUuMiJF!5e0!3m2!1sen!2sin!4v1`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>

      {/* CTA */}
      <section className="py-20 bg-purple-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Order Custom Printing in {location.area}?
          </h2>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Join 500+ businesses in {location.area} who trust Printfield for their printing needs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/categories"
              className="px-8 py-4 bg-white text-purple-900 rounded-full font-bold text-lg hover:bg-slate-100 transition-colors shadow-xl flex items-center gap-2"
            >
              Browse Products <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="tel:+919606371222"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full font-bold text-lg transition-colors flex items-center gap-2"
            >
              <Phone className="h-5 w-5" /> +91 96063 71222
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};
