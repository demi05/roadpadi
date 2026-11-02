import type { Metadata, Viewport } from "next";
// Brand fonts are self-hosted (no build-time download from Google)
import "@fontsource-variable/archivo/standard.css";
import "@fontsource/krona-one/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RoadPadi — Pay-as-you-go cover for drivers",
    template: "%s · RoadPadi",
  },
  description:
    "Affordable daily accident and repair cover for drivers. Pay small daily amounts that match how you earn.",
};

export const viewport: Viewport = {
  themeColor: "#1DAE00",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
