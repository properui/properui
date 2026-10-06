/**
 * The one place this package reaches into the CLI's source.
 *
 * `@properui/cli` ships as a bin, not a library, so the MCP server imports the CLI's modules by
 * relative path and tsup bundles them into `dist/index.js`. Registry access, fuzzy scoring,
 * `components.json` handling, file writes, `info --json` and the token guard therefore behave
 * exactly as they do on the command line: there is no second implementation to drift.
 */
export { scanForViolations, type Finding } from "../../cli/src/commands/check.js";
export { collectSnapshot, type ProjectSnapshot } from "../../cli/src/commands/info.js";
export { scoreEntry } from "../../cli/src/commands/search.js";
export { readAuthToken } from "../../cli/src/auth.js";
export { type ComponentsConfig, aliasBaseDir, configPath, configPlatform, readConfig, writeConfig } from "../../cli/src/config.js";
export { installCommand, installSpec, missingDependencies } from "../../cli/src/deps.js";
export { detectPackageManager } from "../../cli/src/detect.js";
export { type WriteResult, prepareFile, writeSourceFile } from "../../cli/src/files.js";
export { editDistance, fuzzyScore, nearestNames } from "../../cli/src/fuzzy.js";
export { PLATFORM_FILTERS, entryPlatforms, isHtmlEntry, matchesPlatform, resolveForPlatform } from "../../cli/src/platform.js";
export {
    DEFAULT_REGISTRY_URL,
    Registry,
    type RegistryEntry,
    RegistryError,
    type RegistryFile,
    type RegistryIndexEntry,
    entryVersion,
    resolveRegistrySource,
} from "../../cli/src/registry.js";
