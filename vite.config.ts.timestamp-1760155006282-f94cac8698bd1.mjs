// vite.config.ts
import { defineConfig } from "file:///C:/Users/DMFer/Desktop/Cubular/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/DMFer/Desktop/Cubular/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/DMFer/Desktop/Cubular/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\DMFer\\Desktop\\Cubular";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          "react-vendor": ["react", "react-dom"],
          // Routing
          "router": ["react-router-dom"],
          // UI Component libraries
          "ui-core": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs"
          ],
          // Form and data handling
          "forms": [
            "react-hook-form",
            "@hookform/resolvers",
            "zod"
          ],
          // Data fetching and state
          "data": [
            "@tanstack/react-query"
          ],
          // Charts and visualization
          "charts": ["recharts"],
          // Large utility libraries
          "utils": [
            "date-fns",
            "clsx",
            "tailwind-merge"
          ],
          // Heavy dependencies
          "heavy": [
            "jspdf",
            "html2canvas",
            "xlsx"
          ],
          // Icons (split into separate chunk as it's large)
          "icons": ["lucide-react"],
          // Maps (if used)
          "maps": ["mapbox-gl"]
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split("/").pop()?.replace(/\.[^/.]+$/, "") : "chunk";
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "css/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        }
      },
      external: (id) => {
        return id.includes("node_modules") && (id.includes("@esbuild") || id.includes("fsevents") || id.includes("rollup"));
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1e3,
    // Enable tree shaking
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query"
    ],
    exclude: [
      "jspdf",
      "html2canvas",
      "xlsx",
      "mapbox-gl"
    ]
  },
  preview: {
    port: 8080,
    host: "::",
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true
      }
    },
    cors: true,
    historyApiFallback: true
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxETUZlclxcXFxEZXNrdG9wXFxcXEN1YnVsYXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXERNRmVyXFxcXERlc2t0b3BcXFxcQ3VidWxhclxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvRE1GZXIvRGVza3RvcC9DdWJ1bGFyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXHJcbiAgICBjb21wb25lbnRUYWdnZXIoKSxcclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgdGFyZ2V0OiAnZXMyMDIwJyxcclxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxyXG4gICAgc291cmNlbWFwOiBmYWxzZSxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAvLyBDb3JlIFJlYWN0IGxpYnJhcmllc1xyXG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFJvdXRpbmdcclxuICAgICAgICAgICdyb3V0ZXInOiBbJ3JlYWN0LXJvdXRlci1kb20nXSxcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gVUkgQ29tcG9uZW50IGxpYnJhcmllc1xyXG4gICAgICAgICAgJ3VpLWNvcmUnOiBbXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYWNjb3JkaW9uJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLCBcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51JyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1wb3BvdmVyJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zZWxlY3QnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRhYnMnXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBGb3JtIGFuZCBkYXRhIGhhbmRsaW5nXHJcbiAgICAgICAgICAnZm9ybXMnOiBbXHJcbiAgICAgICAgICAgICdyZWFjdC1ob29rLWZvcm0nLFxyXG4gICAgICAgICAgICAnQGhvb2tmb3JtL3Jlc29sdmVycycsXHJcbiAgICAgICAgICAgICd6b2QnXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBEYXRhIGZldGNoaW5nIGFuZCBzdGF0ZVxyXG4gICAgICAgICAgJ2RhdGEnOiBbXHJcbiAgICAgICAgICAgICdAdGFuc3RhY2svcmVhY3QtcXVlcnknXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBDaGFydHMgYW5kIHZpc3VhbGl6YXRpb25cclxuICAgICAgICAgICdjaGFydHMnOiBbJ3JlY2hhcnRzJ10sXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIExhcmdlIHV0aWxpdHkgbGlicmFyaWVzXHJcbiAgICAgICAgICAndXRpbHMnOiBbXHJcbiAgICAgICAgICAgICdkYXRlLWZucycsXHJcbiAgICAgICAgICAgICdjbHN4JyxcclxuICAgICAgICAgICAgJ3RhaWx3aW5kLW1lcmdlJ1xyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gSGVhdnkgZGVwZW5kZW5jaWVzXHJcbiAgICAgICAgICAnaGVhdnknOiBbXHJcbiAgICAgICAgICAgICdqc3BkZicsXHJcbiAgICAgICAgICAgICdodG1sMmNhbnZhcycsXHJcbiAgICAgICAgICAgICd4bHN4J1xyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gSWNvbnMgKHNwbGl0IGludG8gc2VwYXJhdGUgY2h1bmsgYXMgaXQncyBsYXJnZSlcclxuICAgICAgICAgICdpY29ucyc6IFsnbHVjaWRlLXJlYWN0J10sXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIE1hcHMgKGlmIHVzZWQpXHJcbiAgICAgICAgICAnbWFwcyc6IFsnbWFwYm94LWdsJ11cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAoY2h1bmtJbmZvKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBmYWNhZGVNb2R1bGVJZCA9IGNodW5rSW5mby5mYWNhZGVNb2R1bGVJZCBcclxuICAgICAgICAgICAgPyBjaHVua0luZm8uZmFjYWRlTW9kdWxlSWQuc3BsaXQoJy8nKS5wb3AoKT8ucmVwbGFjZSgvXFwuW14vLl0rJC8sIFwiXCIpIFxyXG4gICAgICAgICAgICA6ICdjaHVuayc7XHJcbiAgICAgICAgICByZXR1cm4gYGpzLyR7ZmFjYWRlTW9kdWxlSWR9LVtoYXNoXS5qc2A7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xyXG4gICAgICAgICAgaWYgKGFzc2V0SW5mby5uYW1lPy5lbmRzV2l0aCgnLmNzcycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnY3NzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuICdhc3NldHMvW25hbWVdLVtoYXNoXVtleHRuYW1lXSc7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBleHRlcm5hbDogKGlkKSA9PiB7XHJcbiAgICAgICAgLy8gRXh0ZXJuYWxpemUgbm9kZSBtb2R1bGVzIHRoYXQgc2hvdWxkbid0IGJlIGJ1bmRsZWRcclxuICAgICAgICByZXR1cm4gaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpICYmIChcclxuICAgICAgICAgIGlkLmluY2x1ZGVzKCdAZXNidWlsZCcpIHx8XHJcbiAgICAgICAgICBpZC5pbmNsdWRlcygnZnNldmVudHMnKSB8fFxyXG4gICAgICAgICAgaWQuaW5jbHVkZXMoJ3JvbGx1cCcpXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLy8gT3B0aW1pemUgY2h1bmsgc2l6ZSB3YXJuaW5nc1xyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxyXG4gICAgXHJcbiAgICAvLyBFbmFibGUgdHJlZSBzaGFraW5nXHJcbiAgICB0ZXJzZXJPcHRpb25zOiB7XHJcbiAgICAgIGNvbXByZXNzOiB7XHJcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxyXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgXHJcbiAgLy8gT3B0aW1pemUgZGVwZW5kZW5jaWVzXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXHJcbiAgICAgICdyZWFjdCcsXHJcbiAgICAgICdyZWFjdC1kb20nLFxyXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICdAdGFuc3RhY2svcmVhY3QtcXVlcnknXHJcbiAgICBdLFxyXG4gICAgZXhjbHVkZTogW1xyXG4gICAgICAnanNwZGYnLFxyXG4gICAgICAnaHRtbDJjYW52YXMnLFxyXG4gICAgICAneGxzeCcsXHJcbiAgICAgICdtYXBib3gtZ2wnXHJcbiAgICBdXHJcbiAgfSxcclxuICBwcmV2aWV3OiB7XHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgb3BlbjogdHJ1ZSxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGNvcnM6IHRydWUsXHJcbiAgICBoaXN0b3J5QXBpRmFsbGJhY2s6IHRydWUsXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNSLFNBQVMsb0JBQW9CO0FBQ25ULE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFL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
