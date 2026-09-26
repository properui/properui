import { defineConfig } from "tsup";

/**
 * One ESM bundle. The CLI modules imported from `../../cli/src` (see src/cli.ts) are bundled in,
 * together with the small packages they use; the MCP SDK and zod stay external dependencies.
 */
export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    platform: "node",
    target: "node20",
    clean: true,
    external: ["@modelcontextprotocol/sdk", "zod"],
});
