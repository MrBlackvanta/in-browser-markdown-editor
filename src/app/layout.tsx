import { Signature } from "@/components/layout";
import { SITE_NAME, SITE_URL } from "@/data";
import type { Metadata, Viewport } from "next";
import { Roboto, Roboto_Mono, Roboto_Slab } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  display: "swap",
});

const robotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

const title = `${SITE_NAME} | In-browser editor`;
const description =
  "Write markdown and see the formatted preview as you type. Create, name, save and delete documents that stay in your browser, in light or dark mode.";

const shareImage = {
  url: "/opengraph-image.jpg",
  width: 1200,
  height: 630,
  alt: "The Markdown editor in dark mode, with a welcome document's source beside its formatted preview.",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [shareImage],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2B2D31",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${robotoSlab.variable} ${robotoMono.variable} antialiased`}
    >
      <body className="relative flex min-h-dvh flex-col">
        {children}
        <Signature />
      </body>
    </html>
  );
}
