// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const TARGET = env.VITE_PROXY_TARGET || "https://serty.ro";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "^/backend": { target: "https://serty.ro", changeOrigin: true, secure: true },
        "^/api": { target: "https://serty.ro", changeOrigin: true, secure: true },
        "/agromi-proxy.php": {
          target: TARGET,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
