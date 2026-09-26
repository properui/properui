# Deploying the documentation site

`apps/docs` (Next.js 15, App Router) is deployed to **Cloudflare Workers** with the
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) adapter, as the Worker
`properui-docs`, serving **https://properui.dev**.

The adapter runs `next build` and then repackages the output into `.open-next/`:
`worker.js` (the Worker entry), `assets/` (everything from `public/` plus `_next/static`,
uploaded to Workers static assets) and `cache/` (the prerendered pages and route handlers,
served by the Worker). Nothing is Pages, and nothing uses `next-on-pages`.

## What gets served

| Route                                      | Rendering                                               |
| ------------------------------------------ | ------------------------------------------------------- |
| `/`, `/docs/*`, `/components/*`, …         | Prerendered at build time (919 pages)                   |
| `/r/index.json`, `/r/<name>.json`          | Prerendered from `packages/registry/dist` (798 entries) |
| `/css/<file>.css`                          | Prerendered from `packages/tokens/dist`                 |
| `/llms.txt`, `/robots.txt`, `/sitemap.xml` | Prerendered                                             |
| `/api/markdown/*`, `/preview/*`            | Rendered on demand in the Worker                        |

`/r/*` is the public component registry the `properui` CLI talks to
(`DEFAULT_REGISTRY_URL = https://properui.dev/r`), so the CLI works against the live
domain with no flags.

## Prerequisites

1. A Cloudflare account (Workers Free is enough; Workers Paid raises the bundle-size and
   CPU limits and is recommended for a site this size).
2. The `properui.dev` domain, registered anywhere.
3. **Node 22+** and pnpm 9. Note this is stricter than the rest of the repo: `next build`,
   `next dev` and `opennextjs-cloudflare build` are happy on Node 20 (what `ci.yml` uses),
   but **wrangler 4 refuses to start on Node 20**, so anything that talks to Cloudflare
   (`deploy`, `preview`, `cf-typegen`, `wrangler rollback`) needs Node 22. The deploy
   workflow pins `node-version: 22` for exactly this reason.

## 1. Add the domain to Cloudflare

1. Cloudflare dashboard → **Add a site** → `properui.dev` → pick a plan (Free is fine).
2. Cloudflare shows two assigned nameservers. At your registrar, replace the existing
   nameservers with those two.
3. Wait for the zone status to become **Active** (minutes to a few hours). Everything below
   assumes the zone is active; `wrangler deploy` fails with "Could not find zone" otherwise.

## 2. DNS records

You do **not** create the records by hand. Attaching a _custom domain_ to a Worker makes
Cloudflare create and manage the proxied records for you. Either:

- **Dashboard:** Workers & Pages → `properui-docs` → Settings → Domains & Routes →
  **Add** → Custom domain → `properui.dev`. Repeat for `www.properui.dev`.
- **Config (preferred, reviewable):** uncomment the `routes` block at the bottom of
  [`wrangler.jsonc`](./wrangler.jsonc) and deploy:

    ```jsonc
    "routes": [
        { "pattern": "properui.dev", "custom_domain": true },
        { "pattern": "www.properui.dev", "custom_domain": true }
    ]
    ```

Either way Cloudflare creates proxied (orange-cloud) `CNAME` records for `properui.dev`
and `www.properui.dev` pointing at the Worker, and issues the TLS certificate. If the
zone already has an `A`/`CNAME` for `@` or `www` (a registrar parking page, for example),
delete it first or the custom domain cannot be attached.

Optional: to make `www` redirect to the apex instead of serving a second copy, attach only
`properui.dev` as a custom domain and add a Cloudflare **Redirect Rule**
(`www.properui.dev/*` → `https://properui.dev/$1`, 301).

## 3. GitHub secrets

Add exactly two repository secrets (Settings → Secrets and variables → Actions):

| Secret                  | Where to get it                                                                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | My Profile → API Tokens → Create Token → **Edit Cloudflare Workers** template. Scope it to this account and to the `properui.dev` zone. It needs Workers Scripts:Edit, Account Settings:Read, User Memberships:Read, and, once custom domains are on, Zone Workers Routes:Edit and Zone DNS:Edit. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → the **Account ID** in the right-hand sidebar.                                                                                                                                                                                                            |

[`.github/workflows/deploy-docs.yml`](../../.github/workflows/deploy-docs.yml) deploys on
every push to `main` (and via **Run workflow**) using `cloudflare/wrangler-action@v4`.

## 4. First manual deploy

Run these from the repository root. The first deploy is worth doing by hand so you can see
the Worker come up before wiring the domain.

```bash
pnpm install

# Workspace inputs the docs build reads from disk.
pnpm build:packages      # @properui/ui + properui (CLI) + @properui/tokens (packages/tokens/dist, the source of /css/*.css)
pnpm registry:build      # packages/registry/dist/*.json, the source of /r/*.json

# Authenticate this machine once (opens a browser).
pnpm -F docs exec wrangler login

# Build + deploy.
pnpm -F docs deploy
```

`pnpm -F docs deploy` runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`.
Other scripts on `apps/docs`:

| Script                    | What it does                                                           |
| ------------------------- | ---------------------------------------------------------------------- |
| `pnpm -F docs dev`        | Plain `next dev`, unchanged. Use this for day-to-day work.             |
| `pnpm -F docs build`      | Plain `next build`, unchanged.                                         |
| `pnpm -F docs cf:build`   | `next build` + the OpenNext transform into `.open-next/`.              |
| `pnpm -F docs preview`    | Builds, then serves the real Worker locally with workerd.              |
| `pnpm -F docs deploy`     | Builds, then uploads and activates the Worker.                         |
| `pnpm -F docs cf-typegen` | Regenerates `cloudflare-env.d.ts` from the bindings in wrangler.jsonc. |

Before the domain is attached the site is reachable at
`https://properui-docs.<your-subdomain>.workers.dev`.

Sanity checks after the first deploy:

```bash
curl -sI  https://properui.dev/                  # 200
curl -s   https://properui.dev/robots.txt        # sitemap points at properui.dev
curl -s   https://properui.dev/r/index.json | head
npx @properui/cli@latest list                         # CLI resolves the public registry
```

## 5. Rolling back

Every upload is a numbered version, and rollback does not require a rebuild.

```bash
cd apps/docs
pnpm exec wrangler deployments list          # find the version id you want
pnpm exec wrangler rollback [<version-id>]   # omit the id to go back one version
```

Or in the dashboard: Workers & Pages → `properui-docs` → **Deployments** → pick a past
version → **Rollback**. Rolling back the Worker also rolls back its static assets, so the
whole site returns to that build. Rollback does not change DNS or custom domains.

If a bad commit reached `main`, revert it there too; the next push redeploys.

## Notes and limitations

- **No middleware.** The adapter does not support Node middleware (Next 15.2+). This app has
  no `middleware.ts`, so it is unaffected. Do not add one without checking the adapter first.
- **No `export const runtime = "edge"`.** The adapter uses the Node.js runtime; the edge
  runtime is not supported. Nothing in `apps/docs` sets it.
- **Bundle size.** The server bundle is large (the docs site ships every component). If a
  deploy is rejected for size, move to the Workers Paid plan (10 MiB gzipped vs 3 MiB).
- **`compatibility_date`** in `wrangler.jsonc` is pinned. Bump it deliberately, not casually.
- **Cloudflare bindings in `next dev`** are not wired up. If the site ever needs a binding
  (KV, R2, D1), add `initOpenNextCloudflareForDev()` to `next.config.ts` as the adapter's
  Get Started guide describes; it is deliberately absent today so `next dev` stays plain Next.
- **`NEXT_PUBLIC_SITE_URL`** overrides the canonical origin (`lib/site.ts` defaults to
  `https://properui.dev`). Set it as a Worker var only if the site moves.
