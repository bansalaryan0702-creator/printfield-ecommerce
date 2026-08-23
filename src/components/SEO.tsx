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
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const url = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;
  const image = ogImage || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {robots && <meta name="robots" content={robots} />}

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
