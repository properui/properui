import type { NextConfig } from "next";

/**
 * Wires `@properui/ui` into a Next.js config's `transpilePackages`, deduplicated and preserving
 * whatever else the project's own config already sets. Next.js only compiles a consumer's own
 * source by default, and this package ships source TSX (see the Next.js quick start in
 * README.md), so every Next.js project that installs `@properui/ui` as a dependency needs
 * `transpilePackages: ["@properui/ui"]` one way or another.
 *
 * ```ts
 * // next.config.ts
 * import type { NextConfig } from "next";
 * import { withProperUI } from "@properui/ui/next";
 *
 * const nextConfig: NextConfig = {};
 *
 * export default withProperUI(nextConfig);
 * ```
 *
 * Equivalent to writing the array by hand:
 *
 * ```ts
 * const nextConfig: NextConfig = {
 *     transpilePackages: ["@properui/ui"],
 * };
 * ```
 */
export function withProperUI(nextConfig: NextConfig = {}): NextConfig {
    return {
        ...nextConfig,
        transpilePackages: [...new Set([...(nextConfig.transpilePackages ?? []), "@properui/ui"])],
    };
}
