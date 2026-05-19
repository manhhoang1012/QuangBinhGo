import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string | null;
  url?: string;
  type?: "website" | "article" | "profile";
  keywords?: string;
}

const siteName = "QuangBinhGo";
const defaultDescription = "Website khám phá du lịch Quảng Bình, địa điểm, review, lịch trình và cộng đồng du lịch.";

function frontendBaseUrl() {
  return (import.meta.env.VITE_FRONTEND_BASE_URL || window.location.origin).replace(/\/$/, "");
}

function absoluteUrl(value?: string | null) {
  const baseUrl = frontendBaseUrl();
  if (!value) return `${baseUrl}/og-default.jpg`;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${baseUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

export function SEO({
  title = `${siteName} - Khám phá du lịch Quảng Bình`,
  description = defaultDescription,
  image,
  url,
  type = "website",
  keywords,
}: SEOProps) {
  const canonical = absoluteUrl(url || window.location.pathname);
  const ogImage = absoluteUrl(image);
  const safeDescription = description || defaultDescription;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={safeDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
