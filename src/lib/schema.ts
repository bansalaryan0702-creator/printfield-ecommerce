export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `https://www.printfieldonline.com${item.url}`,
    })),
  };
}

export function generateProductSchema(product: any, baseUrl: string = 'https://www.printfieldonline.com') {
  const images = product?.images?.length ? product.images : (product?.image ? [product.image] : []);
  const sizeOptions = product?.sizes?.map((s: any) => s.size) || [];
  const colorOptions = product?.colors || [];
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product?.name,
    image: images.filter(Boolean),
    description: product?.description || product?.cardDescription || product?.metaDescription || `Custom printed ${product?.name} with high-quality material and finish.`,
    sku: product?.model || product?.id,
    brand: {
      "@type": "Brand",
      name: "Printfield",
    },
    offers: {
      "@type": "Offer",
      price: product?.price || 0,
      priceCurrency: "INR",
      priceValidUntil: "2026-12-31",
      validFrom: "2026-01-01",
      url: `${baseUrl}/product/${product?.slug || product?.id}`,
      itemCondition: "https://schema.org/NewCondition",
      availability: product?.isDisabled ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Printfield",
        areaServed: ["Whitefield", "Brookefield", "Marathahalli", "ITPL", "Mahadevapura", "Bengaluru"],
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 5,
            unitCode: "DAY",
          },
        },
      },
    },
    ...(sizeOptions.length > 0 && {
      size: sizeOptions,
    }),
    ...(colorOptions.length > 0 && {
      color: colorOptions,
    }),
  };
}

export function generateCategoryItemListSchema(categoryName: string, products: any[], baseUrl: string = 'https://www.printfieldonline.com') {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${categoryName} - Printfield`,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product?.name,
        url: `${baseUrl}/product/${product?.slug || product?.id}`,
        image: product?.images?.[0] || product?.image,
        brand: { "@type": "Brand", name: "Printfield" },
        offers: {
          "@type": "Offer",
          price: product?.price || 0,
          priceCurrency: "INR",
          availability: product?.isDisabled ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        },
      },
    })),
  };
}

export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Printfield Digital Solutions",
    image: "https://www.printfieldonline.com/logo.png",
    url: "https://www.printfieldonline.com",
    telephone: "+919606371222",
    email: "Aryan@printfield.in",
    foundingDate: "2004",
    address: {
      "@type": "PostalAddress",
      streetAddress: "No 96, Mini Villa, Opp. Chaitnya Swojas, Borewell Road",
      addressLocality: "Whitefield",
      addressRegion: "Bengaluru, Karnataka",
      postalCode: "560066",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 12.9698,
      longitude: 77.7500,
    },
    areaServed: [
      "Whitefield",
      "EPIP Zone",
      "ITPL",
      "Brookefield",
      "Kadugodi",
      "Hoodi",
      "Marathahalli",
      "Mahadevapura",
    ],
    priceRange: "₹99 - ₹5000",
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], opens: "10:00", closes: "19:00" },
    ],
    description: "Corporate printing & gifting in Whitefield, Bangalore. 10+ years, own production unit on Borewell Road. Onboarding kits, awards, apparel, brochures, signage, packaging.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.3",
      reviewCount: "50",
      bestRating: "5",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Printfield Printing Services",
      itemListElement: [
        {"@type": "OfferCatalog", "name": "Custom T-Shirt Printing", "itemListElement": [
          {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "DTF Printing"}},
          {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Screen Printing"}},
          {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Embroidery"}},
        ]},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Corporate Gifts & Merchandise"}},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Signage & Banners"}},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Business Cards & Stationery"}},
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Custom Trophies & Awards"}},
      ],
    },
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Printfield",
    url: "https://www.printfieldonline.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.printfieldonline.com/categories?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };
}