import type { Metadata } from "next";
import { Geist, Geist_Mono, Quicksand, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import DisclaimerModal from "@/components/shared/DisclaimerModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lazpe.store"),
  title: {
    default: "LazPe - Nền tảng thương mại điện tử Mẹ & Bé hàng đầu",
    template: "%s | LazPe",
  },
  description: "Khám phá LazPe - Điểm đến tin cậy chuyên cung cấp các sản phẩm chất lượng cao, an toàn và đa dạng dành riêng cho Mẹ và Bé. Mua sắm thông minh, nhận ngàn ưu đãi!",
  keywords: ["LazPe", "thương mại điện tử", "mẹ và bé", "đồ sơ sinh", "bỉm sữa", "mua sắm trực tuyến", "khuyến mãi mẹ bé"],
  authors: [{ name: "LazPe Team" }],
  creator: "LazPe",
  publisher: "LazPe",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://lazpe.store",
    title: "LazPe - Thế Giới Mẹ & Bé Thu Nhỏ Trong Tầm Tay",
    description: "Khám phá LazPe - Điểm đến tin cậy chuyên cung cấp các sản phẩm chất lượng cao, an toàn và đa dạng dành riêng cho Mẹ và Bé.",
    siteName: "LazPe Store",
    images: [
      {
        url: "/logo/lazpe_og_image.png", // File ảnh banner (khuyến nghị 1200x630px)
        width: 1200,
        height: 630,
        alt: "LazPe - Nền tảng thương mại điện tử Mẹ & Bé",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LazPe - Thế Giới Mẹ & Bé",
    description: "Trải nghiệm mua sắm tuyệt vời các sản phẩm an toàn, chất lượng cho Mẹ & Bé tại LazPe.",
    images: ["/logo/lazpe_og_image.png"],
  },
  icons: {
    icon: "/logo/icon_logo.svg",
    shortcut: "/logo/icon_logo.svg",
    apple: "/logo/icon_logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-body-md bg-background text-on-background">
        {children}
        <DisclaimerModal />
        <Toaster richColors position="top-right" closeButton visibleToasts={3} />
      </body>
    </html>
  );
}
