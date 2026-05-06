import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const packageNameFromId = (id: string) => {
  const normalized = id.split("node_modules/")[1];
  if (!normalized) return "";
  const parts = normalized.split("/");
  return parts[0]?.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
};

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          const packageName = packageNameFromId(id);
          if (["react", "react-dom", "scheduler"].includes(packageName)) return "react";
          if (packageName === "lucide-react") return "icons";
          if (packageName === "docx") return "docx-export";
          if (packageName === "mammoth") return "docx-import";
          if (packageName === "pdfjs-dist") return "pdf-import";
          if (packageName === "@react-pdf/renderer" || packageName.startsWith("@react-pdf/")) return "pdf-export";
          if (packageName === "yoga-layout") return "pdf-layout";
          if (
            [
              "fontkit",
              "hyphen",
              "linebreak",
              "unicode-properties",
              "unicode-trie",
              "restructure",
              "tiny-inflate",
              "brotli",
              "dfa",
              "dingbat-to-unicode",
              "base64-js",
              "queue",
              "jay-peg",
              "png-js",
            ].includes(packageName)
          )
            return "pdf-fonts";
          if (["markdown-it", "dompurify", "yaml", "linkify-it", "mdurl", "uc.micro", "entities"].includes(packageName))
            return "resume-engine";
          if (["zod", "@noble/hashes", "@noble/ciphers"].includes(packageName)) return "vendor-validation";
          if (["@babel/runtime", "tslib", "pako"].includes(packageName)) return "vendor-runtime";
          return "vendor";
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
