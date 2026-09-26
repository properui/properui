import { describe, expect, it } from "vitest";
import plugin, { rules } from "./index.js";

describe("@properui/eslint-plugin", () => {
    it("exports all four rules", () => {
        expect(Object.keys(rules).sort()).toEqual(["no-arbitrary-values", "no-dark-variant", "no-physical-properties", "no-raw-palette"]);
        expect(plugin.rules).toBe(rules);
    });

    it("exposes a flat-config recommended preset with the right severities", () => {
        const recommended = plugin.configs.recommended;
        expect(recommended.plugins).toEqual({ "@properui": plugin });
        expect(recommended.rules).toEqual({
            "@properui/no-raw-palette": "error",
            "@properui/no-arbitrary-values": "warn",
            "@properui/no-dark-variant": "error",
            "@properui/no-physical-properties": "error",
        });
    });
});
