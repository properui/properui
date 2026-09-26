/**
 * Per-server state: which registry to read, which project directory to act on, and a small
 * cache of `Registry` instances so a long-lived server does not refetch `index.json` on every
 * tool call, while still picking up a republished registry within a few minutes.
 */
import path from "node:path";
import { DEFAULT_REGISTRY_URL, Registry, readConfig, resolveRegistrySource } from "./cli.js";

export interface ServerOptions {
    /**
     * Registry base URL or local directory. Precedence, highest first: this option (the
     * `--registry` flag), `PROPERUI_REGISTRY`, `REGISTRY_URL`, the `registry` field of the
     * project's `components.json`, then https://properui.dev/r.
     */
    registry?: string;
    /** Project directory tools act on when a call does not pass its own `cwd`. Defaults to `process.cwd()`. */
    cwd?: string;
    /** How long a registry index stays cached, in milliseconds. Defaults to five minutes. */
    cacheTtlMs?: number;
}

/** Public site the registry is served from; `docs` routes in registry entries are relative to it. */
export const DEFAULT_SITE_URL = new URL(DEFAULT_REGISTRY_URL).origin;

const DEFAULT_TTL_MS = 5 * 60 * 1000;

export class ServerContext {
    readonly defaultCwd: string;
    private readonly registryOverride: string | undefined;
    private readonly ttl: number;
    private readonly cache = new Map<string, { registry: Registry; created: number }>();

    constructor(options: ServerOptions = {}) {
        this.defaultCwd = path.resolve(options.cwd ?? process.cwd());
        this.registryOverride = options.registry ?? process.env.PROPERUI_REGISTRY ?? undefined;
        this.ttl = options.cacheTtlMs ?? DEFAULT_TTL_MS;
    }

    /** Absolute project directory for a tool call. Relative paths resolve against the server's cwd. */
    cwd(input?: string): string {
        return input ? path.resolve(this.defaultCwd, input) : this.defaultCwd;
    }

    /** The registry source a call against `cwd` reads, resolved exactly like the CLI resolves it. */
    registrySource(cwd?: string): string {
        return resolveRegistrySource(this.registryOverride, readConfig(this.cwd(cwd))?.registry);
    }

    /** The flag-level override (`--registry` / `PROPERUI_REGISTRY`), if any. */
    get override(): string | undefined {
        return this.registryOverride;
    }

    registry(cwd?: string): Registry {
        const source = this.registrySource(cwd);
        const hit = this.cache.get(source);
        if (hit && Date.now() - hit.created < this.ttl) return hit.registry;
        const registry = new Registry(source);
        this.cache.set(source, { registry, created: Date.now() });
        return registry;
    }

    /** Origin docs pages live on: the registry's own origin when it is remote, else the public site. */
    siteUrl(registry: Registry): string {
        return registry.remote ? new URL(registry.source).origin : DEFAULT_SITE_URL;
    }
}
