export interface Env {}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    return new Response("warp-headcount-planner backend", {
      headers: { "content-type": "text/plain" },
    });
  },
} satisfies ExportedHandler<Env>;
