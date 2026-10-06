"use client";

import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { presetFromHash } from "~/lib/preview-presets";

/**
 * Wrapper for the preview route that applies a token preset chosen through the URL hash
 * (`#preset=teal`) and follows later hash changes, so a parent page can re-theme an embedded
 * preview by changing the iframe's `src` hash without a reload or a server render.
 */
export function PreviewPresetFrame({ children }: { children: ReactNode }) {
    const [preset, setPreset] = useState<CSSProperties | undefined>(undefined);

    useEffect(() => {
        const apply = () => setPreset(presetFromHash(window.location.hash));
        apply();
        window.addEventListener("hashchange", apply);
        return () => window.removeEventListener("hashchange", apply);
    }, []);

    return (
        <div className="bg-primary flex min-h-screen w-full flex-col items-center justify-center" style={preset}>
            {children}
        </div>
    );
}
