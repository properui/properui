import { handleMcpRequest } from "@properui/mcp";

/**
 * Remote MCP endpoint: `https://properui.dev/api/mcp`, Streamable HTTP, stateless.
 *
 * The server and its tools live in `@properui/mcp`; this file only maps a request to its origin.
 * Registry data is read from `<origin>/r/*.json` (the routes next door) and links point back at
 * the same origin, so a preview deployment answers with its own registry and its own thumbnails.
 * Project-bound tools (`add_component`, `get_project_info`, `check_tokens`) are not offered here:
 * there is no project on the other end of an HTTP request. An agent uses `get_install_plan` and
 * then runs the CLI.
 *
 * Dynamic on purpose: JSON-RPC arrives by POST.
 */

export const dynamic = "force-dynamic";

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

export function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS });
}

async function handle(request: Request): Promise<Response> {
    const origin = new URL(request.url).origin;
    const response = await handleMcpRequest(request, { registryUrl: `${origin}/r`, siteUrl: origin });
    return withCors(response);
}

/** GET opens an SSE stream in stateful servers. This one has none, so it answers 405 as the spec asks. */
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
