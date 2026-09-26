import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    // Tests run against the html behaviours' source, so they do not need `@properui/html` built first.
    resolve: { alias: { "@properui/html": fileURLToPath(new URL("../html/src/index.ts", import.meta.url)) } },
    test: {
        environment: "jsdom",
        include: ["test/**/*.test.ts"],
        setupFiles: ["./test/setup.ts"],
        testTimeout: 30_000,
    },
});
