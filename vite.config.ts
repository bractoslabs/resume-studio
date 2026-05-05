import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react") || id.includes("react-dom")) return "react";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("docx")) return "docx-export";
          if (id.includes("markdown-it") || id.includes("dompurify") || id.includes("yaml")) return "resume-engine";
          return "vendor";
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
