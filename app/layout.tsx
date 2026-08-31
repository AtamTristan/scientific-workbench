import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scientific Workbench",
  description: "A visual scientific-programming workbench for projects, runs and publishable artifacts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
