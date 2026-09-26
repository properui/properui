import { describe, expect, it } from "vitest";
import { withProperUI } from "./next";

describe("withProperUI", () => {
    it("adds @properui/ui to transpilePackages when there is no existing config", () => {
        expect(withProperUI()).toEqual({ transpilePackages: ["@properui/ui"] });
    });

    it("adds @properui/ui to an empty config object", () => {
        expect(withProperUI({})).toEqual({ transpilePackages: ["@properui/ui"] });
    });

    it("appends @properui/ui to an existing transpilePackages list", () => {
        expect(withProperUI({ transpilePackages: ["other-package"] })).toEqual({
            transpilePackages: ["other-package", "@properui/ui"],
        });
    });

    it("deduplicates when @properui/ui is already present", () => {
        expect(withProperUI({ transpilePackages: ["@properui/ui"] })).toEqual({
            transpilePackages: ["@properui/ui"],
        });
        expect(withProperUI({ transpilePackages: ["a", "@properui/ui", "b"] })).toEqual({
            transpilePackages: ["a", "@properui/ui", "b"],
        });
    });

    it("preserves the rest of the config untouched", () => {
        const result = withProperUI({ reactStrictMode: true, images: { unoptimized: true } });
        expect(result).toEqual({
            reactStrictMode: true,
            images: { unoptimized: true },
            transpilePackages: ["@properui/ui"],
        });
    });
});
