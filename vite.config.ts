/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { resolve } from 'path';
import makeManifest from './utils/plugins/make-manifest';
import customDynamicImport from './utils/plugins/custom-dynamic-import';
import addHmr from './utils/plugins/add-hmr';
import watchRebuild from './utils/plugins/watch-rebuild';
import removeVitePreload from './utils/plugins/replace-code';
import manifest from "./manifest";

const rootDir = resolve(__dirname);
const srcDir = resolve(rootDir, 'src');
const pagesDir = resolve(srcDir, 'pages');
const assetsDir = resolve(srcDir, 'assets');
const outDir = resolve(rootDir, 'dist');
const publicDir = resolve(rootDir, 'public');

const isDev = process.env.__DEV__ === 'true';
const isProduction = !isDev;

// ENABLE HMR IN BACKGROUND SCRIPT
const enableHmrInBackgroundScript = true;

export default defineConfig({
    resolve: {
        alias: {
            '@root': rootDir,
            '@src': srcDir,
            '@assets': assetsDir,
            '@pages': pagesDir,
        },
    },
    plugins: [
        makeManifest(manifest, { isDev }),
        react(),
        customDynamicImport(),
        removeVitePreload({
            include: '**/index.js'
        }),
        addHmr({ background: enableHmrInBackgroundScript, view: true }),
        isDev && watchRebuild({ afterWriteBundle: () => { } }),
    ],
    publicDir,
    build: {
        outDir,
        /** Can slow down build speed. */
        // sourcemap: isDev,
        minify: isProduction,
        modulePreload: false,
        reportCompressedSize: isProduction,
        emptyOutDir: !isDev,
        rollupOptions: {
            watch: {
                include: ["src/**", "vite.config.ts"],
                exclude: ["node_modules/**", "src/**/*.spec.ts"],
            },
            input: {
                devtools: resolve(pagesDir, 'devtools', 'index.html'),
                priceConvert: resolve(pagesDir, 'content', 'priceConvert', 'index.ts'),
                priceConvStyle: resolve(pagesDir, 'content', 'priceConvert', 'style.scss'),
                buyerTrade: resolve(pagesDir, 'content', 'buyerTradePage', 'index.ts'),
                tailwindStyle: resolve(srcDir, 'assets', 'style', 'tailwind.css'),
                freightPage: resolve(pagesDir, 'content', 'freightPage', 'nswex', 'index.ts'),
                background: resolve(pagesDir, 'background', 'index.ts'),
                popup: resolve(pagesDir, 'popup', 'index.html')
            },
            output: {
                entryFileNames: 'src/pages/[name]/index.js',
                chunkFileNames: isDev ? 'assets/js/[name].js' : 'assets/js/[name].[hash].js',
                assetFileNames: assetInfo => {
                    const { name } = path.parse(assetInfo.name);
          return `assets/[ext]/${name}.chunk.[ext]`;
                },
            },
        },

    },
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['**/*.test.ts', '**/*.test.tsx'],
        setupFiles: './test-utils/vitest.setup.js',
    },
});
