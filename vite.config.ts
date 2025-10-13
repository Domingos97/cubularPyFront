import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          
          // Routing
          'router': ['react-router-dom'],
          
          // UI Component libraries
          'ui-core': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs'
          ],
          
          // Form and data handling
          'forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],
          
          // Data fetching and state
          'data': [
            '@tanstack/react-query'
          ],
          
          // Charts and visualization
          'charts': ['recharts'],
          
          // Large utility libraries
          'utils': [
            'date-fns',
            'clsx',
            'tailwind-merge'
          ],
          
          // Heavy dependencies
          'heavy': [
            'jspdf',
            'html2canvas',
            'xlsx'
          ],
          
          // Icons (split into separate chunk as it's large)
          'icons': ['lucide-react'],
          
          // Maps (if used)
          'maps': ['mapbox-gl']
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^/.]+$/, "") 
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      },
      external: (id) => {
        // Externalize node modules that shouldn't be bundled
        return id.includes('node_modules') && (
          id.includes('@esbuild') ||
          id.includes('fsevents') ||
          id.includes('rollup')
        );
      }
    },
    
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Enable tree shaking
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query'
    ],
    exclude: [
      'jspdf',
      'html2canvas',
      'xlsx',
      'mapbox-gl'
    ]
  },
  preview: {
    port: 8080,
    host: "::",
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    cors: true,
    historyApiFallback: true,
  },
}));
