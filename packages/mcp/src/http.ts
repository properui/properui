/**
 * Stateless Streamable HTTP for the Proper UI MCP server, on web-standard `Request` and
 * `Response` so the same handler runs in a Next route on Cloudflare Workers and in Node.
 *
 *   import { handleMcpRequest } from "@properui/mcp";
 *   export const POST = (request: Request) => handleMcpRequest(request, { registryUrl: "https://properui.dev/r", siteUrl: "https://properui.dev" });
 *
 * Each POST builds a server and a transport, answers with a plain JSON body (no SSE stream) and
 * keeps nothing between requests except the registry cache. The server is hosted: the
 * project-bound tools (`add_component`, `get_project_info`, `check_tokens`) are not offered
 * because there is no project directory on the other end of an HTTP request.
 */
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ServerContext } from "./context.js";
import { createServer } from "./server.js";

export interface McpRequestOptions {
    /** Registry base URL, such as `https://properui.dev/r`. */
    registryUrl: string;
    /** Site origin docs, preview and thumbnail links point at, such as `https://properui.dev`. */
    siteUrl: string;
}

const CORS: Record<string, string> = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id, authorization",
    "access-control-expose-headers": "mcp-session-id, mcp-protocol-version",
    "access-control-max-age": "86400",
};

function withCors(response: Response): Response {
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(CORS)) headers.set(name, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

const jsonRpcError = (status: number, code: number, message: string, headers: Record<string, string> = {}) =>
    withCors(Response.json({ jsonrpc: "2.0", error: { code, message }, id: null }, { status, headers }));

/** One context per registry and site, so the registry index is fetched once per cache window, not once per request. */
const contexts = new Map<string, ServerContext>();

function contextFor(options: McpRequestOptions): ServerContext {
    const key = `${options.registryUrl}\n${options.siteUrl}`;
    let ctx = contexts.get(key);
    if (!ctx) {
        ctx = new ServerContext({ registry: options.registryUrl, siteUrl: options.siteUrl, hosted: true });
        contexts.set(key, ctx);
    }
    return ctx;
}

export async function handleMcpRequest(request: Request, options: McpRequestOptions): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    // No sessions and no server-initiated stream: GET (SSE) and DELETE (end session) do not apply.
    if (request.method !== "POST") {
        return jsonRpcError(405, -32000, "This endpoint is stateless. Send JSON-RPC messages with POST.", { allow: "POST, OPTIONS" });
    }

    try {
        const server = createServer({}, contextFor(options));
        const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
        await server.connect(transport);
        return withCors(await transport.handleRequest(request));
    } catch (error) {
        return jsonRpcError(500, -32603, `Internal error: ${(error as Error).message ?? String(error)}`);
    }
}
