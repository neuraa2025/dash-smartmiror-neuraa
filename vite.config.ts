import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
// import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      // VitePWA({
      //   registerType: "autoUpdate",
      //   includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      //   manifest: {
      //     name: "RealFit",
      //     short_name: "RealFit",
      //     description: "Virtual Try-On Application",
      //     theme_color: "#ffffff",
      //     icons: [
      //       {
      //         src: "pwa-192x192.png",
      //         sizes: "192x192",
      //         type: "image/png",
      //       },
      //       {
      //         src: "pwa-512x512.png",
      //         sizes: "512x512",
      //         type: "image/png",
      //       },
      //     ],
      //   },
      // }),
    ],
    server: {
      host: true,
      port: 1317,
      allowedHosts: ["a24974f1e004.ngrok-free.app"],
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_URL || "http://localhost:5003",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
