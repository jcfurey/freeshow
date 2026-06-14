import { defineConfig } from "vite"
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte"

const production = process.env.NODE_ENV === "production"

export default defineConfig({
    plugins: [
        svelte({
            preprocess: vitePreprocess(),
            compilerOptions: {
                dev: !production
            },
            onwarn: (warning, handler) => {
                // disable A11y warnings (Svelte 5 renamed codes from a11y-* to a11y_*)
                if (warning.code.startsWith("a11y-") || warning.code.startsWith("a11y_")) return
                handler(warning)
            }
        }),
        // Dev only: index.html references the production bundle (./build/bundle.js) for the packaged app;
        // in `vite` dev serve, rewrite it to the live entry module so `npm start` + HMR work.
        {
            name: "freeshow-dev-index-html",
            apply: "serve",
            transformIndexHtml: (html) => html.replace(/<script[^>]*src="\.\/build\/bundle\.js"[^>]*><\/script>\s*<link[^>]*href="\.\/build\/bundle\.css"[^>]*>/, '<script type="module" src="/src/frontend/main.ts"></script>')
        }
    ],
    root: production ? "." : "public",
    publicDir: false,
    build: production
        ? {
              lib: {
                  entry: "src/frontend/main.ts",
                  name: "freeshow",
                  formats: ["iife"],
                  fileName: () => "bundle.js"
              },
              outDir: "public/build",
              emptyOutDir: false,
              rollupOptions: {
                  output: {
                      assetFileNames: (assetInfo) => {
                          // Vite 8 / Rollup 4: prefer names[] (the singular .name is deprecated)
                          const name = assetInfo.names?.[0] ?? assetInfo.name ?? ""
                          if (name.endsWith(".css")) {
                              return "bundle.css"
                          }
                          return name
                      }
                  }
              }
          }
        : {
              outDir: "../dist",
              rollupOptions: {
                  input: "index.html"
              }
          },
    server: {
        port: 3000,
        host: "127.0.0.1",
        strictPort: true,
        middlewareMode: false
    },
    resolve: {
        dedupe: ["svelte"],
        ...(!production && { alias: { "/src": "../src" } })
    }
})
