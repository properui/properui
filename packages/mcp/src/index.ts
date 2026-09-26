#!/usr/bin/env node
/**
 * `properui-mcp` — the Proper UI MCP server over stdio.
 *
 *   npx -y @properui/mcp                          # registry: https://properui.dev/r
 *   npx -y @properui/mcp --registry ./registry    # a local directory or another base URL
 *   npx -y @properui/mcp --cwd ./apps/web         # project the tools act on by default
 *
 * stdout carries the protocol, so every diagnostic goes to stderr.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SERVER_VERSION, createServer } from "./server.js";

const HELP = `properui-mcp ${SERVER_VERSION}

Model Context Protocol server for Proper UI, over stdio.

Options:
  --registry <source>  registry base URL or local directory
                       (default: $PROPERUI_REGISTRY, $REGISTRY_URL, components.json, https://properui.dev/r)
  --cwd <dir>          project directory tools act on by default (default: the current directory)
  -v, --version        print the version
  -h, --help           print this help

Register it with your client, e.g.:
  claude mcp add properui -- npx -y @properui/mcp
`;

function parseArgs(argv: string[]): { registry?: string; cwd?: string } {
    const options: { registry?: string; cwd?: string } = {};
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index] ?? "";
        const [flag, inline] = arg.includes("=") ? [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)] : [arg, undefined];
        const value = () => {
            if (inline !== undefined) return inline;
            const next = argv[index + 1];
            if (next === undefined || next.startsWith("--")) throw new Error(`${flag} needs a value.`);
            index += 1;
            return next;
        };
        if (flag === "--registry") options.registry = value();
        else if (flag === "--cwd") options.cwd = value();
        else if (flag === "-h" || flag === "--help") {
            process.stderr.write(HELP);
            process.exit(0);
        } else if (flag === "-v" || flag === "--version") {
            process.stderr.write(`${SERVER_VERSION}\n`);
            process.exit(0);
        } else throw new Error(`Unknown option ${arg}. Run with --help for usage.`);
    }
    return options;
}

async function main(): Promise<void> {
    const server = createServer(parseArgs(process.argv.slice(2)));
    await server.connect(new StdioServerTransport());
    process.stderr.write(`properui-mcp ${SERVER_VERSION} ready on stdio\n`);
}

main().catch((error: unknown) => {
    process.stderr.write(`properui-mcp: ${(error as Error).message ?? String(error)}\n`);
    process.exit(1);
});
