import { defineConfig } from "tsup";

/**
 * Two ESM entries: `index` is the stdio bin, `http` is the web-standard request handler the
 * package root exports. The CLI modules imported from `../../cli/src` (see src/cli.ts) are
 * bundled in, together with the small packages they use; the MCP SDK and zod stay external
 * dependencies. Only `http` gets type declarations: the bin has no importable API.
 */
export default defineConfig({
    entry: ["src/index.ts", "src/http.ts"],
    format: ["esm"],
    platform: "node",
    target: "node20",
    clean: true,
    dts: { entry: ["src/http.ts"] },
    external: ["@modelcontextprotocol/sdk", "zod"],
});
