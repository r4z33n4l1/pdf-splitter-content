import type { Metadata, Viewport } from "next";
import { Crimson_Pro, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f0d0a",
};

export const metadata: Metadata = {
  title: "PDF Chapter Splitter - Extract & Split PDF Chapters Online Free",
  description: "Free online tool to split PDF by chapters, extract specific sections, and download individual chapters. 100% client-side processing - your files never leave your device. No signup required.",
  keywords: [
    "PDF splitter",
    "split PDF by chapters",
    "extract PDF chapters",
    "PDF chapter extractor",
    "split PDF online",
    "PDF section splitter",
    "free PDF splitter",
    "PDF tools",
    "client-side PDF",
    "private PDF processing",
    "PDF bookmark extractor",
    "merge PDF chapters",
    "PDF table of contents",
  ],
  authors: [{ name: "Razeen Ali", url: "https://razeenali.com" }],
  creator: "Razeen Ali",
  publisher: "Razeen Ali",
  metadataBase: new URL("https://pdfsplitter.filezap.dev"),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/image.png", type: "image/png" },
    ],
    apple: [
      { url: "/image.png", type: "image/png" },
    ],
    shortcut: "/image.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "PDF Chapter Splitter - Extract & Split PDF Chapters Online Free",
    description: "Free online tool to split PDF by chapters. 100% private - processing happens in your browser. Extract specific chapters, merge selections, and download instantly.",
    siteName: "PDF Chapter Splitter",
    images: [
      {
        url: "/image2.png",
        width: 1200,
        height: 630,
        alt: "PDF Chapter Splitter - Extract and split chapters from PDF documents",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Chapter Splitter - Free Online PDF Chapter Extraction",
    description: "Split PDFs by chapters, extract sections, download individually or merged. 100% private - your files never leave your device.",
    images: ["/image2.png"],
    creator: "@razeenali",
  },
  alternates: {
    canonical: "/",
  },
  category: "Technology",
  applicationName: "PDF Chapter Splitter",
  manifest: "/manifest.json",
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PDF Chapter Splitter",
  description: "Free online tool to split PDF by chapters and extract specific sections. 100% client-side processing for privacy.",
  url: "https://pdfsplitter.filezap.dev",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Razeen Ali",
    url: "https://razeenali.com",
    sameAs: [
      "https://github.com/r4z33n4l1",
      "https://linkedin.com/in/razeenali",
    ],
  },
  featureList: [
    "Split PDF by chapters",
    "Extract specific sections",
    "Download individual chapters",
    "Merge selected chapters with bookmarks",
    "Preview pages before download",
    "100% client-side processing",
    "No file uploads to servers",
    "Keyboard navigation support",
    "Auto-detect chapter structure",
  ],
  screenshot: "https://pdfsplitter.filezap.dev/image2.png",
  softwareVersion: "1.0.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/image.png" type="image/png" />
        <link rel="apple-touch-icon" href="/image.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${crimsonPro.variable} ${jetbrainsMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
