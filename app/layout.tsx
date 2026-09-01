import type { Metadata } from "next";
import "./globals.css";
import "./brand.css";

export const metadata: Metadata = {
  title: "Scientific Workbench",
  description: "A visual scientific-programming workbench for projects, runs and publishable artifacts.",
  icons: {
    icon: [{ url: "/scientific-platform-mark-64.png", type: "image/png", sizes: "64x64" }],
    shortcut: "/scientific-platform-mark-64.png",
    apple: [{ url: "/scientific-platform-mark-180.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
