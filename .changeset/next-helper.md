---
"@properui/ui": minor
---

Adds `withProperUI`, exported from `@properui/ui/next`, for the one line of `next.config.ts` every
Next.js consumer of this package needs: `withProperUI(nextConfig)` appends `@properui/ui` to
`transpilePackages`, deduplicated, preserving whatever else the config already sets.

```ts
// next.config.ts
import type { NextConfig } from "next";
import { withProperUI } from "@properui/ui/next";

const nextConfig: NextConfig = {};

export default withProperUI(nextConfig);
```

This does not remove the need for `transpilePackages` — Next.js still won't compile this package's
TSX from `node_modules` without it — it's a shorter way to write it. The manual snippet keeps
working unchanged.
