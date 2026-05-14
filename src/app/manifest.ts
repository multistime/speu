import type { MetadataRoute } from "next";

const DESCRIPTION =
  "Спеў — беларускі музычны лейбл і струмень: слухайце трэкі, альбомы і артыстаў на роднай мове.";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Спеў",
    short_name: "Спеў",
    description: DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0E1811",
    theme_color: "#0E1811",
    lang: "be",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
