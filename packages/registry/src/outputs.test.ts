/**
 * Contract tests for dist/flows.json, dist/thumbs.json and the stats fields that count them.
 * Run after `pnpm registry:build`:  pnpm exec tsx --test packages/registry/src/outputs.test.ts
 * Uses node:test through tsx, so it needs no dependency beyond what this package already has.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const REGISTRY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(REGISTRY, "..", "..");
const DIST = path.join(REGISTRY, "dist");

type Thumbs = Record<string, { light: string; dark: string | null }>;
type Flows = { flows: { id: string; title: string; description: string; tags: string[]; steps: { entry: string; purpose: string }[] }[] };

const readJson = <T>(file: string): T => {
    const target = path.join(DIST, file);
    assert.ok(existsSync(target), `${file} is missing; run pnpm registry:build first`);
    return JSON.parse(readFileSync(target, "utf8")) as T;
};

const index = readJson<{ components: { name: string; type: string }[] }>("index.json");
const exampleNames = new Set(index.components.filter((entry) => entry.type === "example").map((entry) => entry.name));
const thumbs = readJson<Thumbs>("thumbs.json");
const { flows } = readJson<Flows>("flows.json");

test("thumbs.json maps example entries to site-relative webp paths that exist on disk", () => {
    const names = Object.keys(thumbs);
    assert.ok(names.length > 0, "thumbs.json is empty");
    for (const name of names) {
        const { light, dark } = thumbs[name]!;
        assert.ok(exampleNames.has(name), `${name} is not an example entry`);
        assert.match(light, /^\/thumbs\/[^/]+\/[^/]+\/[^/]+\.webp$/, `${name}: light path shape`);
        assert.ok(existsSync(path.join(REPO, "apps", "docs", "public", light)), `${name}: ${light} is not on disk`);
        if (dark !== null) {
            assert.match(dark, /-dark\.webp$/, `${name}: dark path shape`);
            assert.ok(existsSync(path.join(REPO, "apps", "docs", "public", dark)), `${name}: ${dark} is not on disk`);
        }
    }
});

test("flows.json has unique ids, 3 to 6 steps, 4 to 8 tags and clean copy", () => {
    assert.ok(flows.length >= 10 && flows.length <= 16, `expected 10 to 16 flows, got ${flows.length}`);
    assert.equal(new Set(flows.map((flow) => flow.id)).size, flows.length, "duplicate flow id");
    for (const flow of flows) {
        assert.ok(flow.title && flow.description, `${flow.id}: title and description`);
        assert.ok(flow.tags.length >= 4 && flow.tags.length <= 8, `${flow.id}: tag count`);
        assert.ok(flow.steps.length >= 3 && flow.steps.length <= 6, `${flow.id}: step count`);
        const copy = [flow.title, flow.description, ...flow.tags, ...flow.steps.map((step) => step.purpose)].join("\n");
        assert.doesNotMatch(copy, /[—…]/, `${flow.id}: em dash or ellipsis in copy`);
    }
});

test("every flow step resolves to an example entry that has a light thumbnail", () => {
    for (const flow of flows) {
        for (const step of flow.steps) {
            assert.ok(exampleNames.has(step.entry), `${flow.id}: unknown entry ${step.entry}`);
            assert.ok(thumbs[step.entry]?.light, `${flow.id}: ${step.entry} has no thumbnail`);
            assert.ok(step.purpose.trim().length > 0, `${flow.id}: ${step.entry} has no purpose`);
        }
    }
});

test("stats.json counts flows and thumbnails", () => {
    const stats = readJson<{ flows: number; thumbnails: number }>("stats.json");
    assert.equal(stats.flows, flows.length);
    assert.equal(stats.thumbnails, Object.keys(thumbs).length);
});
