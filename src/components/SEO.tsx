import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  type?: string;
  schema?: string;
  robots?: string;
}

const DEFAULT_OG_IMAGE = 'https://www.printfieldonline.com/logo.png';

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  canonicalUrl, 
  ogImage,
  type = 'website',
  schema,
  robots
}) => {
  const siteUrl = 'https://www.printfieldonline.com';
  let url = siteUrl;
  if (canonicalUrl) {
    if (canonicalUrl.startsWith('http')) {
      url = canonicalUrl;
    } else {
      url = `${siteUrl}${canonicalUrl.startsWith('/') ? '' : '/'}${canonicalUrl}`;
    }
  } else if (typeof window !== 'undefined') {
    url = `${siteUrl}${window.location.pathname}`;
  }
  const image = ogImage || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={robots || "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Printfield" />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schema && (
        <script type="application/ld+json">
          {schema}
        </script>
      )}
    </Helmet>
  );
};
