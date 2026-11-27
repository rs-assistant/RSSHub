import { bindings, defineConfig, exports } from 'cf/config';

// Workers Paid plan is recommended for better performance
// Free plan has 10ms CPU time limit per request
// Paid plan has 30s CPU time limit per request

// Build settings (build command, module rules, static assets) live in wrangler.config.ts
const name = 'rsshub';

export default defineConfig(({ mode }) => {
    // `cf deploy --mode production` deploys the official instance with its Playwright service
    const isProduction = mode === 'production';

    return {
        worker: {
            name,
            compatibilityDate: '2026-09-01',
            // No nodejs_compat needed, read https://developers.cloudflare.com/workers/runtime-apis/nodejs/#get-started
            compatibilityFlags: ['global_fetch_strictly_public', 'temporal'],
            entrypoint: 'dist-worker/worker.mjs',
            observability: {
                enabled: false,
            },
            exports: {
                // Created with SQLite storage by the `browser-session-v1` Wrangler migration
                BrowserSession: exports.durableObject({ storage: 'sqlite' }),
            },
            env: {
                REQUIRE_ACCESS_KEY: bindings.text('true'),
                DEBUG_INFO: bindings.text('false'),
                // Reuse the deployed cache when its ID is supplied. Otherwise, provision it on first deploy.
                CACHE: bindings.kv({ id: process.env.CLOUDFLARE_KV_NAMESPACE_ID || undefined }),
                // Browser Run API for Playwright support
                // Requires Workers Paid plan
                BROWSER: bindings.browser(),
                // Share Browser Run sessions across requests and Worker isolates.
                BROWSER_SESSIONS: bindings.durableObject({ worker: name, exportName: 'BrowserSession' }),
                // PLAYWRIGHT_WS_ENDPOINT takes priority over BROWSER; use a matching Playwright version.
                // Optional service binding when the WebSocket server is another Worker on this account.
                PLAYWRIGHT_SERVICE: isProduction && bindings.worker({ worker: 'cloudflare-patchright' }),
                // Only use the service binding for this endpoint origin.
                PLAYWRIGHT_SERVICE_ORIGIN: isProduction && bindings.text('https://cloudflare-patchright.rss3.workers.dev'),
            },
            // For production, set sensitive values such as ACCESS_KEY or GITHUB_ACCESS_TOKEN as secrets.
            // cf cannot set a single secret yet: run `wrangler secret put <KEY> --name rsshub`,
            // or upload secrets with a new version through `cf deploy --secrets-file <PATH>`.
        },
    };
});
