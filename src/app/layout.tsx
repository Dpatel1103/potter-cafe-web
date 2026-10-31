import type { Metadata } from "next";
import { Cinzel, Cinzel_Decorative, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CafeProvider } from "@/context/CafeContext";
import { MagicCanvas } from "@/components/MagicCanvas";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Espresso Patronum | The Wizarding Cafe of Diagon Alley",
  description:
    "Purveyors of fine artisan brews, glowing signature potions, and magical pastries. Order via Owl Post or UPI with live order tracking.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  keywords: [
    "Espresso Patronum",
    "Harry Potter Cafe",
    "Wizarding Coffee",
    "Butterscotch Cold Brew",
    "Polyjuice Potion",
    "Diagon Alley Cafe",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cinzel.variable} ${cinzelDecorative.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#0d0b0e] text-[#f3effa] relative selection:bg-amber-500/30 selection:text-amber-200"
      >
        <MagicCanvas />
        <CafeProvider>
          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
        </CafeProvider>
      </body>
    </html>
  );
}
