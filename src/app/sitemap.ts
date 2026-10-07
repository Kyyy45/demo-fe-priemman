import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // Hanya public route yang tersedia dalam static export yang dicantumkan.
  return [
    { url: "https://priemman.my.id/" },
    { url: "https://priemman.my.id/explore" },
    { url: "https://priemman.my.id/contact" },
    { url: "https://priemman.my.id/privacy-policy" },
    { url: "https://priemman.my.id/terms" },
  ];
}
