/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import * as path from "path";

const redirectPaths = ["/dhis-web-pivot", "/dhis-web-data-visualizer", "/dhis-web-commons-ajax-json"];

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const proxy = getProxy(env);
    const port = Number(env.VITE_PORT || env.PORT || 8081);

    return {
        base: "",
        plugins: [nodePolyfills(), react()],
        resolve: {
            alias: {
                src: path.resolve(__dirname, "./src"),
                // Algunas dependencias hacen `require("process/")` y esbuild intentaba
                // resolverlo a un directorio (sin index). Lo forzamos a un archivo.
                "process/": path.resolve(__dirname, "node_modules/node-stdlib-browser/cjs/proxy/process.js"),
                process: path.resolve(__dirname, "node_modules/node-stdlib-browser/cjs/proxy/process.js"),
            },
        },
        server: {
            port,
            proxy,
        },
        test: {
            environment: "jsdom",
            globals: true,
            include: ["**/*.{test,spec}.{ts,tsx}"],
            setupFiles: "./src/tests/setup.ts",
            exclude: ["node_modules", "cypress"],
        },
    };
});

function getProxy(env: Record<string, string>) {
    const targetUrl = env.VITE_DHIS2_BASE_URL || env.REACT_APP_DHIS2_BASE_URL;
    const auth = env.VITE_DHIS2_AUTH || env.REACT_APP_DHIS2_AUTH;
    const logLevel = env.VITE_PROXY_LOG_LEVEL || env.REACT_APP_PROXY_LOG_LEVEL || "warn";
    const isBuild = env.NODE_ENV === "production";

    if (isBuild) return {};
    if (!targetUrl) {
        // Keep the same behavior as previous setupProxy.js in development.
        throw new Error("Set VITE_DHIS2_BASE_URL (or REACT_APP_DHIS2_BASE_URL)");
    }

    const shared = {
        target: targetUrl,
        auth,
        changeOrigin: true,
        configure: proxy => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
                const reqPath = proxyReq.path;
                const shouldRedirect = redirectPaths.some(redirectPath => reqPath.startsWith(redirectPath));
                if (!shouldRedirect || !res || !("writeHead" in res)) return;

                const redirectUrl = targetUrl.replace(/\/$/, "") + reqPath;
                // `res` is a node response object at runtime.
                (res as any).writeHead(302, { Location: redirectUrl });
                (res as any).end();
            });
            proxy.on("error", error => {
                console.error(`[proxy:${logLevel}]`, error);
            });
        },
    };

    return {
        "/dhis2": {
            ...shared,
            rewrite: (p: string) => p.replace(/^\/dhis2/, "/"),
        },
        "/documents": {
            ...shared,
            rewrite: (p: string) => p.replace(/^\/documents/, "/api/documents"),
        },
        "/api": {
            ...shared,
            rewrite: (p: string) => p.replace(/^\/api/, "/api"),
        },
    };
}
